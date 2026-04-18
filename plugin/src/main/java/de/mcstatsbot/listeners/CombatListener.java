package de.mcstatsbot.listeners;

import de.mcstatsbot.MCStatsBot;
import de.mcstatsbot.config.ConfigManager;
import de.mcstatsbot.database.DatabaseManager;
import org.bukkit.Location;
import org.bukkit.entity.Entity;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.entity.Projectile;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityDamageByEntityEvent;
import org.bukkit.event.entity.EntityDeathEvent;
import org.bukkit.event.entity.PlayerDeathEvent;
import org.bukkit.inventory.ItemStack;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class CombatListener implements Listener {

    private final MCStatsBot plugin;
    private final DatabaseManager db;
    private final ConfigManager config;
    private final Map<UUID, Integer> killStreaks = new ConcurrentHashMap<>();

    public CombatListener(MCStatsBot plugin) {
        this.plugin = plugin;
        this.db = plugin.getDatabaseManager();
        this.config = plugin.getConfigManager();
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onEntityDeath(EntityDeathEvent event) {
        if (event instanceof PlayerDeathEvent) return; // handled separately
        if (!config.isTrackMobKills()) return;

        LivingEntity entity = event.getEntity();
        Player killer = entity.getKiller();
        if (killer == null) return;

        String uuid = killer.getUniqueId().toString();
        String name = killer.getName();
        String mobType = entity.getType().name();
        String world = entity.getWorld().getName();

        // Check if PvP (should not happen here since PlayerDeathEvent is excluded, but safety check)
        if (entity instanceof Player victim) {
            String weapon = getWeaponName(killer);
            db.recordPvpKill(uuid, name, victim.getUniqueId().toString(), victim.getName(), weapon);
            return;
        }

        db.recordMobKill(uuid, name, mobType, world);

        // Kill streak tracking
        int streak = killStreaks.merge(killer.getUniqueId(), 1, Integer::sum);
        if (streak % 10 == 0) {
            plugin.getLogger().info(name + " hat eine Kill-Streak von " + streak + "!");
        }
    }

    @EventHandler(priority = EventPriority.MONITOR)
    public void onPlayerDeath(PlayerDeathEvent event) {
        Player player = event.getEntity();
        String uuid = player.getUniqueId().toString();
        String name = player.getName();
        Location loc = player.getLocation();

        String cause = player.getLastDamageCause() != null
                ? player.getLastDamageCause().getCause().name()
                : "UNKNOWN";
        String deathMessage = event.getDeathMessage();

        String killerUuid = null;
        String killerName = null;
        String killerType = null;

        Player killer = player.getKiller();
        if (killer != null) {
            killerUuid = killer.getUniqueId().toString();
            killerName = killer.getName();
            killerType = "PLAYER";
        } else if (player.getLastDamageCause() instanceof EntityDamageByEntityEvent dmgEvent) {
            Entity damager = dmgEvent.getDamager();
            if (damager instanceof Projectile proj && proj.getShooter() instanceof Entity shooter) {
                killerName = shooter.getName();
                killerType = shooter.getType().name();
            } else {
                killerName = damager.getName();
                killerType = damager.getType().name();
            }
        }

        db.recordDeath(uuid, name, cause, deathMessage, killerUuid, killerName, killerType,
                loc.getWorld().getName(), loc.getX(), loc.getY(), loc.getZ());

        // Save and reset kill streak
        int streak = killStreaks.getOrDefault(player.getUniqueId(), 0);
        if (streak > 3) {
            db.recordKillStreak(uuid, name, streak);
        }
        killStreaks.remove(player.getUniqueId());
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onEntityDamageByEntity(EntityDamageByEntityEvent event) {
        Player attacker = resolvePlayerAttacker(event.getDamager());
        double damage = event.getFinalDamage();

        if (attacker != null) {
            db.recordDamage(attacker.getUniqueId().toString(), attacker.getName(),
                    damage, 0, event.getCause().name());
        }

        if (event.getEntity() instanceof Player victim) {
            db.recordDamage(victim.getUniqueId().toString(), victim.getName(),
                    0, damage, event.getCause().name());
        }
    }

    private Player resolvePlayerAttacker(Entity damager) {
        if (damager instanceof Player player) return player;
        if (damager instanceof Projectile proj && proj.getShooter() instanceof Player player) {
            return player;
        }
        return null;
    }

    private String getWeaponName(Player player) {
        ItemStack item = player.getInventory().getItemInMainHand();
        if (item.getType().isAir()) return "Faust";
        if (item.hasItemMeta() && item.getItemMeta().hasDisplayName()) {
            return item.getItemMeta().getDisplayName();
        }
        return item.getType().name();
    }
}
