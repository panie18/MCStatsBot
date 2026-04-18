package de.mcstatsbot;

import de.mcstatsbot.api.AutoUpdater;
import de.mcstatsbot.api.CentralApiClient;
import de.mcstatsbot.config.ConfigManager;
import de.mcstatsbot.database.DatabaseManager;
import de.mcstatsbot.listeners.*;
import de.mcstatsbot.stats.StatsCalculator;
import de.mcstatsbot.tracking.AFKTracker;
import de.mcstatsbot.web.WebServer;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.bukkit.plugin.java.JavaPlugin;

import java.util.logging.Level;

public final class MCStatsBot extends JavaPlugin {

    private static MCStatsBot instance;
    private ConfigManager configManager;
    private DatabaseManager databaseManager;
    private StatsCalculator statsCalculator;
    private AFKTracker afkTracker;
    private WebServer webServer;
    private CentralApiClient apiClient;

    @Override
    public void onEnable() {
        instance = this;

        // Config
        configManager = new ConfigManager(this);

        // Database
        databaseManager = new DatabaseManager(getDataFolder(), configManager, getLogger());

        // AFK Tracker
        afkTracker = new AFKTracker(this);

        // Stats Calculator
        statsCalculator = new StatsCalculator(databaseManager);

        // Register listeners
        registerListeners();

        // Web Server (local dashboard)
        int webPort = getConfig().getInt("web.port", 8080);
        boolean webEnabled = getConfig().getBoolean("web.enabled", true);
        if (webEnabled) {
            webServer = new WebServer(this);
            webServer.start(webPort);
        }

        // Central API - register with central server
        apiClient = new CentralApiClient(this);
        getServer().getScheduler().runTaskAsynchronously(this, () -> {
            if (apiClient.register()) {
                if (apiClient.isSetupComplete()) {
                    getLogger().info("Connected to central server. Discord setup complete.");
                    startStatsSync();
                } else {
                    getLogger().info("========================================");
                    getLogger().info("  MCStatsBot Setup:");
                    getLogger().info("  " + apiClient.getSetupUrl());
                    getLogger().info("========================================");
                    getLogger().info("Open the link to connect the bot with Discord.");
                    // Poll for setup completion
                    startSetupPoller();
                }
            } else {
                getLogger().warning("Connection to central server failed.");
                getLogger().warning("The bot works offline - stats will be saved locally.");
                getLogger().warning("Central Server: " + getConfig().getString("central.url", "https://auth.mcstatsbot.tech"));
            }
        });

        // Auto-Update Check
        new AutoUpdater(this).checkForUpdate();

        // Schedule cleanup
        scheduleCleanup();

        getLogger().info("MCStatsBot v" + getDescription().getVersion() + " enabled!");
    }

    /**
     * Polls the central server every 15 seconds to check if OAuth setup is complete.
     * Stops polling once setup is confirmed.
     */
    private void startSetupPoller() {
        final int[] taskId = {-1};
        taskId[0] = getServer().getScheduler().runTaskTimerAsynchronously(this, () -> {
            if (apiClient.checkStatus()) {
                // Cancel the poller
                getServer().getScheduler().cancelTask(taskId[0]);

                getLogger().info("========================================");
                getLogger().info("  Setup complete!");
                getLogger().info("  Discord bot is now connected.");
                getLogger().info("  Stats will be sent every 5 minutes.");
                getLogger().info("========================================");

                // Notify online admins
                getServer().getScheduler().runTask(MCStatsBot.this, () -> {
                    getServer().getOnlinePlayers().stream()
                        .filter(p -> p.hasPermission("mcstatsbot.admin"))
                        .forEach(p -> {
                            p.sendMessage("§a§l[MCStatsBot] §r§aSetup complete! §fThe bot is now connected to Discord.");
                            p.sendMessage("§7Stats are automatically synchronized every 5 minutes.");
                        });
                });

                startStatsSync();
            }
        }, 300L, 300L).getTaskId(); // Every 15 seconds (300 ticks)
    }

    /**
     * Periodically sends stats to the central server.
     * Runs every 5 minutes.
     */
    private void startStatsSync() {
        getServer().getScheduler().runTaskTimerAsynchronously(this, () -> {
            try {
                if (!apiClient.isSetupComplete()) return;

                // Build stats JSON using WebServer's data builder
                String statsJson = webServer != null ? webServer.buildStatsJson() : "{}";
                if (apiClient.sendStats(statsJson)) {
                    getLogger().fine("Stats sent to central server.");
                }
            } catch (Exception e) {
                getLogger().log(Level.WARNING, "Error during stats sync", e);
            }
        }, 1200L, 6000L); // Start after 1 min, then every 5 minutes (6000 ticks)
    }

    @Override
    public void onDisable() {
        // Record leave for all online players
        for (Player player : getServer().getOnlinePlayers()) {
            long sessionDuration = afkTracker.getSessionDuration(player.getUniqueId());
            long afkDuration = afkTracker.getAFKDuration(player.getUniqueId());
            databaseManager.recordLeave(
                    player.getUniqueId().toString(),
                    player.getName(),
                    sessionDuration,
                    afkDuration
            );
        }

        // Shutdown components
        if (webServer != null) webServer.stop();
        if (databaseManager != null) databaseManager.shutdown();

        getLogger().info("MCStatsBot disabled.");
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!command.getName().equalsIgnoreCase("mcstats")) return false;

        if (args.length == 0) {
            sender.sendMessage("§a[MCStatsBot] §fCommands: reload, setup, status, report");
            return true;
        }

        switch (args[0].toLowerCase()) {
            case "reload" -> {
                if (!sender.hasPermission("mcstatsbot.admin")) {
                    sender.sendMessage("§c[MCStatsBot] No permission!");
                    return true;
                }
                configManager.loadConfig();
                sender.sendMessage("§a[MCStatsBot] §fConfiguration reloaded!");
            }
            case "setup" -> {
                if (!sender.hasPermission("mcstatsbot.admin")) {
                    sender.sendMessage("§c[MCStatsBot] No permission!");
                    return true;
                }
                if (apiClient != null && apiClient.getSetupUrl() != null) {
                    sender.sendMessage("§a[MCStatsBot] §fSetup link:");
                    sender.sendMessage("§b" + apiClient.getSetupUrl());
                } else {
                    sender.sendMessage("§c[MCStatsBot] §fNot connected to central server.");
                }
            }
            case "status" -> {
                sender.sendMessage("§a[MCStatsBot] §fStatus:");
                sender.sendMessage("§7  Central Server: " + (apiClient != null && apiClient.isSetupComplete() ? "§aConnected & Setup complete" : "§cNot configured"));
                sender.sendMessage("§7  Web: " + (webServer != null ? "§aPort " + getConfig().getInt("web.port", 8080) : "§cDisabled"));
                sender.sendMessage("§7  Players online: §f" + getServer().getOnlinePlayers().size());
            }
            case "report" -> {
                if (!sender.hasPermission("mcstatsbot.admin")) {
                    sender.sendMessage("§c[MCStatsBot] No permission!");
                    return true;
                }
                if (apiClient != null && apiClient.isSetupComplete()) {
                    sender.sendMessage("§a[MCStatsBot] §fSending report...");
                    getServer().getScheduler().runTaskAsynchronously(this, () -> {
                        if (apiClient.triggerReport()) {
                            getServer().getScheduler().runTask(this, () ->
                                sender.sendMessage("§a[MCStatsBot] §fReport sent!"));
                        } else {
                            getServer().getScheduler().runTask(this, () ->
                                sender.sendMessage("§c[MCStatsBot] §fError sending report."));
                        }
                    });
                } else {
                    sender.sendMessage("§c[MCStatsBot] §fSetup not yet complete. Use /mcstats setup");
                }
            }
            default -> sender.sendMessage("§a[MCStatsBot] §fUnknown command. Use: reload, setup, status, report");
        }
        return true;
    }

    private void registerListeners() {
        var pm = getServer().getPluginManager();
        pm.registerEvents(new PlayerListener(this), this);
        pm.registerEvents(new CombatListener(this), this);
        pm.registerEvents(new BlockListener(this), this);
        pm.registerEvents(new MiscListener(this), this);
    }

    private void scheduleCleanup() {
        int retentionDays = configManager.getDataRetentionDays();
        getServer().getScheduler().runTaskTimerAsynchronously(this,
                () -> databaseManager.cleanupOldData(), 72000L, 1728000L);
    }

    public static MCStatsBot getInstance() { return instance; }
    public ConfigManager getConfigManager() { return configManager; }
    public DatabaseManager getDatabaseManager() { return databaseManager; }
    public StatsCalculator getStatsCalculator() { return statsCalculator; }
    public AFKTracker getAfkTracker() { return afkTracker; }
    public CentralApiClient getApiClient() { return apiClient; }
}
