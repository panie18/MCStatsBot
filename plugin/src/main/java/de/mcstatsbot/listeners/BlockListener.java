package de.mcstatsbot.listeners;

import de.mcstatsbot.MCStatsBot;
import de.mcstatsbot.config.ConfigManager;
import de.mcstatsbot.database.DatabaseManager;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.block.BlockBreakEvent;
import org.bukkit.event.block.BlockPlaceEvent;

public class BlockListener implements Listener {

    private final DatabaseManager db;
    private final ConfigManager config;

    public BlockListener(MCStatsBot plugin) {
        this.db = plugin.getDatabaseManager();
        this.config = plugin.getConfigManager();
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onBlockBreak(BlockBreakEvent event) {
        if (!config.isTrackBlocks()) return;

        Player player = event.getPlayer();
        String blockType = event.getBlock().getType().name();
        db.queueBlockBreak(player.getUniqueId().toString(), player.getName(), blockType);
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onBlockPlace(BlockPlaceEvent event) {
        if (!config.isTrackBlocks()) return;

        Player player = event.getPlayer();
        String blockType = event.getBlock().getType().name();
        db.queueBlockPlace(player.getUniqueId().toString(), player.getName(), blockType);
    }
}
