package de.mcstatsbot.config;

import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.plugin.java.JavaPlugin;

import java.util.List;

public final class ConfigManager {

    private final JavaPlugin plugin;

    private int dataRetentionDays;
    private int afkTimeoutMinutes;
    private boolean trackChat;
    private boolean trackCommands;
    private boolean trackBlocks;
    private boolean trackMobKills;
    private boolean trackMovement;
    private boolean trackItems;
    private int maxPoolSize;
    private int batchSize;
    private int flushIntervalSeconds;

    public ConfigManager(JavaPlugin plugin) {
        this.plugin = plugin;
        plugin.saveDefaultConfig();
        loadConfig();
    }

    public void loadConfig() {
        plugin.reloadConfig();
        FileConfiguration config = plugin.getConfig();

        this.dataRetentionDays = config.getInt("general.data-retention-days", 90);
        this.afkTimeoutMinutes = config.getInt("general.afk-timeout-minutes", 5);

        this.trackChat = config.getBoolean("tracking.chat-messages", true);
        this.trackCommands = config.getBoolean("tracking.commands", true);
        this.trackBlocks = config.getBoolean("tracking.blocks", true);
        this.trackMobKills = config.getBoolean("tracking.mob-kills", true);
        this.trackMovement = config.getBoolean("tracking.movement", true);
        this.trackItems = config.getBoolean("tracking.items", true);

        this.maxPoolSize = config.getInt("database.max-pool-size", 5);
        this.batchSize = config.getInt("database.batch-size", 50);
        this.flushIntervalSeconds = config.getInt("database.flush-interval-seconds", 30);
    }

    public int getDataRetentionDays() { return dataRetentionDays; }
    public int getAfkTimeoutMinutes() { return afkTimeoutMinutes; }
    public boolean isTrackChat() { return trackChat; }
    public boolean isTrackCommands() { return trackCommands; }
    public boolean isTrackBlocks() { return trackBlocks; }
    public boolean isTrackMobKills() { return trackMobKills; }
    public boolean isTrackMovement() { return trackMovement; }
    public boolean isTrackItems() { return trackItems; }
    public int getMaxPoolSize() { return maxPoolSize; }
    public int getBatchSize() { return batchSize; }
    public int getFlushIntervalSeconds() { return flushIntervalSeconds; }
}
