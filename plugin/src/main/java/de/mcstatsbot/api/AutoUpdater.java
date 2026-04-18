package de.mcstatsbot.api;

import de.mcstatsbot.MCStatsBot;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Scanner;
import java.util.logging.Level;

public class AutoUpdater {

    private final MCStatsBot plugin;
    private final String baseUrl;

    public AutoUpdater(MCStatsBot plugin) {
        this.plugin = plugin;
        this.baseUrl = plugin.getConfig().getString("central.url", "https://auth.mcstatsbot.tech");
    }

    public void checkForUpdate() {
        plugin.getServer().getScheduler().runTaskAsynchronously(plugin, () -> {
            try {
                String currentVersion = plugin.getDescription().getVersion();
                String latestVersion = fetchLatestVersion();

                if (latestVersion == null) return;

                if (!currentVersion.equals(latestVersion) && isNewer(latestVersion, currentVersion)) {
                    plugin.getLogger().info("New version available: v" + latestVersion + " (current: v" + currentVersion + ")");
                    plugin.getLogger().info("Downloading update...");

                    if (downloadUpdate(latestVersion)) {
                        plugin.getLogger().info("Update downloaded! Will be active upon next server restart.");
                    }
                } else {
                    plugin.getLogger().info("Plugin is up to date (v" + currentVersion + ")");
                }
            } catch (Exception e) {
                plugin.getLogger().log(Level.WARNING, "Update check failed", e);
            }
        });
    }

    private String fetchLatestVersion() {
        try {
            HttpURLConnection conn = (HttpURLConnection) URI.create(baseUrl + "/api/update/check").toURL().openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);

            if (conn.getResponseCode() != 200) return null;

            try (Scanner scanner = new Scanner(conn.getInputStream(), "UTF-8")) {
                scanner.useDelimiter("\\A");
                String response = scanner.hasNext() ? scanner.next() : "";
                // Parse {"version":"x.y.z"}
                int idx = response.indexOf("\"version\"");
                if (idx == -1) return null;
                int start = response.indexOf('"', idx + 10) + 1;
                int end = response.indexOf('"', start);
                return response.substring(start, end);
            }
        } catch (Exception e) {
            return null;
        }
    }

    private boolean downloadUpdate(String version) {
        try {
            HttpURLConnection conn = (HttpURLConnection) URI.create(baseUrl + "/api/update/download").toURL().openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(30000);

            if (conn.getResponseCode() != 200) return false;

            // Find the current plugin JAR file
            Path pluginFile = plugin.getServer().getPluginsFolder().toPath()
                    .resolve(plugin.getDescription().getName() + "-" + plugin.getDescription().getVersion() + ".jar");

            // If exact name doesn't exist, search for it
            if (!Files.exists(pluginFile)) {
                File[] files = plugin.getServer().getPluginsFolder().listFiles(
                        (dir, name) -> name.toLowerCase().startsWith("mcstatsbot") && name.endsWith(".jar")
                );
                if (files != null && files.length > 0) {
                    pluginFile = files[0].toPath();
                } else {
                    plugin.getLogger().warning("Plugin JAR not found, update aborted.");
                    return false;
                }
            }

            // Download to temp file first, then replace
            Path tempFile = pluginFile.resolveSibling("MCStatsBot-" + version + ".jar.tmp");
            try (InputStream in = conn.getInputStream()) {
                Files.copy(in, tempFile, StandardCopyOption.REPLACE_EXISTING);
            }

            // Verify download (minimum size check)
            if (Files.size(tempFile) < 10000) {
                Files.deleteIfExists(tempFile);
                plugin.getLogger().warning("Download too small, update aborted.");
                return false;
            }

            // Delete old JAR and rename new one
            Path newFile = pluginFile.resolveSibling("MCStatsBot-" + version + ".jar");
            if (!pluginFile.equals(newFile)) {
                Files.deleteIfExists(pluginFile);
            }
            Files.move(tempFile, newFile, StandardCopyOption.REPLACE_EXISTING);

            return true;
        } catch (Exception e) {
            plugin.getLogger().log(Level.WARNING, "Download failed", e);
            return false;
        }
    }

    private boolean isNewer(String latest, String current) {
        String[] l = latest.split("\\.");
        String[] c = current.split("\\.");
        for (int i = 0; i < Math.max(l.length, c.length); i++) {
            int lv = i < l.length ? Integer.parseInt(l[i]) : 0;
            int cv = i < c.length ? Integer.parseInt(c[i]) : 0;
            if (lv > cv) return true;
            if (lv < cv) return false;
        }
        return false;
    }
}
