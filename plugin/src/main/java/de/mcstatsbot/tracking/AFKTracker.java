package de.mcstatsbot.tracking;

import de.mcstatsbot.MCStatsBot;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerMoveEvent;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class AFKTracker implements Listener {

    private final MCStatsBot plugin;
    private final Map<UUID, Long> lastActivity = new ConcurrentHashMap<>();
    private final Map<UUID, Long> joinTime = new ConcurrentHashMap<>();
    private final Map<UUID, Long> afkStartTime = new ConcurrentHashMap<>();
    private final Map<UUID, Long> totalAFKTime = new ConcurrentHashMap<>();

    public AFKTracker(MCStatsBot plugin) {
        this.plugin = plugin;
        plugin.getServer().getPluginManager().registerEvents(this, plugin);

        // Check AFK status every 30 seconds
        plugin.getServer().getScheduler().runTaskTimer(plugin, this::checkAFK, 600L, 600L);
    }

    public void recordJoin(UUID uuid) {
        long now = System.currentTimeMillis();
        lastActivity.put(uuid, now);
        joinTime.put(uuid, now);
        totalAFKTime.put(uuid, 0L);
        afkStartTime.remove(uuid);
    }

    public void recordLeave(UUID uuid) {
        // If AFK when leaving, add remaining AFK time
        if (afkStartTime.containsKey(uuid)) {
            long afkDuration = System.currentTimeMillis() - afkStartTime.get(uuid);
            totalAFKTime.merge(uuid, afkDuration, Long::sum);
        }
        // Cleanup happens after caller reads the values
    }

    public void cleanup(UUID uuid) {
        lastActivity.remove(uuid);
        joinTime.remove(uuid);
        afkStartTime.remove(uuid);
        totalAFKTime.remove(uuid);
    }

    public void recordActivity(UUID uuid) {
        long now = System.currentTimeMillis();
        lastActivity.put(uuid, now);

        // If was AFK, record AFK duration and clear
        if (afkStartTime.containsKey(uuid)) {
            long afkDuration = now - afkStartTime.get(uuid);
            totalAFKTime.merge(uuid, afkDuration, Long::sum);
            afkStartTime.remove(uuid);
        }
    }

    @EventHandler
    public void onPlayerMove(PlayerMoveEvent event) {
        // Only track if actually moved (not just head rotation)
        if (event.getFrom().getBlockX() != event.getTo().getBlockX()
                || event.getFrom().getBlockY() != event.getTo().getBlockY()
                || event.getFrom().getBlockZ() != event.getTo().getBlockZ()) {
            recordActivity(event.getPlayer().getUniqueId());
        }
    }

    public boolean isAFK(UUID uuid) {
        return afkStartTime.containsKey(uuid);
    }

    public long getSessionDuration(UUID uuid) {
        Long join = joinTime.get(uuid);
        if (join == null) return 0;
        return (System.currentTimeMillis() - join) / 1000;
    }

    public long getAFKDuration(UUID uuid) {
        long total = totalAFKTime.getOrDefault(uuid, 0L);
        // Add current AFK period if still AFK
        if (afkStartTime.containsKey(uuid)) {
            total += System.currentTimeMillis() - afkStartTime.get(uuid);
        }
        return total / 1000;
    }

    private void checkAFK() {
        long now = System.currentTimeMillis();
        long timeoutMs = plugin.getConfigManager().getAfkTimeoutMinutes() * 60_000L;

        for (Player player : plugin.getServer().getOnlinePlayers()) {
            UUID uuid = player.getUniqueId();
            Long last = lastActivity.get(uuid);
            if (last == null) continue;

            if (now - last > timeoutMs && !afkStartTime.containsKey(uuid)) {
                // Player just went AFK
                afkStartTime.put(uuid, now);
            }
        }
    }
}
