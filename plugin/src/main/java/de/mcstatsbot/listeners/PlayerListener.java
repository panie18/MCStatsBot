package de.mcstatsbot.listeners;

import de.mcstatsbot.MCStatsBot;
import de.mcstatsbot.config.ConfigManager;
import de.mcstatsbot.database.DatabaseManager;
import de.mcstatsbot.tracking.AFKTracker;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.player.AsyncPlayerChatEvent;
import org.bukkit.event.player.PlayerCommandPreprocessEvent;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerQuitEvent;

public class PlayerListener implements Listener {

    private final MCStatsBot plugin;
    private final DatabaseManager db;
    private final ConfigManager config;
    private final AFKTracker afkTracker;

    public PlayerListener(MCStatsBot plugin) {
        this.plugin = plugin;
        this.db = plugin.getDatabaseManager();
        this.config = plugin.getConfigManager();
        this.afkTracker = plugin.getAfkTracker();
    }

    @EventHandler(priority = EventPriority.MONITOR)
    public void onPlayerJoin(PlayerJoinEvent event) {
        Player player = event.getPlayer();
        String uuid = player.getUniqueId().toString();
        String name = player.getName();

        db.recordJoin(uuid, name);
        afkTracker.recordJoin(player.getUniqueId());

        if (db.isFirstJoin(uuid)) {
            plugin.getLogger().info("Neuer Spieler: " + name + " betritt den Server zum ersten Mal!");
        }
    }

    @EventHandler(priority = EventPriority.MONITOR)
    public void onPlayerQuit(PlayerQuitEvent event) {
        Player player = event.getPlayer();
        String uuid = player.getUniqueId().toString();
        String name = player.getName();

        afkTracker.recordLeave(player.getUniqueId());
        long sessionDuration = afkTracker.getSessionDuration(player.getUniqueId());
        long afkDuration = afkTracker.getAFKDuration(player.getUniqueId());

        db.recordLeave(uuid, name, sessionDuration, afkDuration);
        afkTracker.cleanup(player.getUniqueId());
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onChat(AsyncPlayerChatEvent event) {
        if (!config.isTrackChat()) return;

        Player player = event.getPlayer();
        db.recordChat(player.getUniqueId().toString(), player.getName());
        afkTracker.recordActivity(player.getUniqueId());
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onCommand(PlayerCommandPreprocessEvent event) {
        if (!config.isTrackCommands()) return;

        Player player = event.getPlayer();
        String command = event.getMessage().split(" ")[0];
        db.recordCommand(player.getUniqueId().toString(), player.getName(), command);
        afkTracker.recordActivity(player.getUniqueId());
    }
}
