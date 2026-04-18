package de.mcstatsbot.api;

import de.mcstatsbot.MCStatsBot;

import java.io.IOException;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Scanner;
import java.util.logging.Level;

/**
 * HTTP client that communicates with the central MCStatsBot server.
 * Handles registration, status checks, and stats submission.
 */
public class CentralApiClient {

    private final MCStatsBot plugin;
    private final String baseUrl;
    private String serverId;
    private String apiSecret;
    private String setupUrl;
    private boolean setupComplete = false;

    public CentralApiClient(MCStatsBot plugin) {
        this.plugin = plugin;
        this.baseUrl = plugin.getConfig().getString("central.url", "https://auth.mcstatsbot.tech");
        this.serverId = plugin.getConfig().getString("central.server-id", "");
        this.apiSecret = plugin.getConfig().getString("central.api-secret", "");
    }

    /**
     * Register this server with the central server.
     * If already registered, retrieves existing config.
     */
    public boolean register() {
        if (serverId.isEmpty()) {
            serverId = java.util.UUID.randomUUID().toString();
            plugin.getConfig().set("central.server-id", serverId);
            plugin.saveConfig();
        }

        try {
            String serverName = plugin.getServer().getMotd();
            if (serverName == null || serverName.isEmpty()) serverName = "Minecraft Server";

            String body = "{\"server_id\":\"" + serverId + "\",\"server_name\":\"" + escapeJson(serverName) + "\"}";
            String response = post("/api/register", body, null);

            if (response == null) return false;

            String secret = extractJsonString(response, "api_secret");
            String url = extractJsonString(response, "setup_url");
            String complete = extractJsonString(response, "setup_complete");

            if (secret != null && !secret.isEmpty()) {
                this.apiSecret = secret;
                plugin.getConfig().set("central.api-secret", apiSecret);
                plugin.saveConfig();
            }

            if (url != null) this.setupUrl = url;
            this.setupComplete = "true".equals(complete);

            return true;
        } catch (Exception e) {
            plugin.getLogger().log(Level.WARNING, "Error registering with the central server", e);
            return false;
        }
    }

    /**
     * Check if the setup (Discord OAuth, channel selection) is complete.
     */
    public boolean checkStatus() {
        if (apiSecret.isEmpty()) return false;

        try {
            String response = get("/api/status");
            if (response == null) return false;

            String complete = extractJsonString(response, "setup_complete");
            this.setupComplete = "true".equals(complete);
            return this.setupComplete;
        } catch (Exception e) {
            plugin.getLogger().log(Level.WARNING, "Error during status check", e);
            return false;
        }
    }

    /**
     * Send stats data to the central server.
     */
    public boolean sendStats(String statsJson) {
        if (apiSecret.isEmpty() || !setupComplete) return false;

        try {
            String response = post("/api/stats", statsJson, apiSecret);
            return response != null && response.contains("\"success\":true");
        } catch (Exception e) {
            plugin.getLogger().log(Level.WARNING, "Error sending stats", e);
            return false;
        }
    }

    /**
     * Trigger a report to be sent to Discord.
     */
    public boolean triggerReport() {
        if (apiSecret.isEmpty() || !setupComplete) return false;

        try {
            String response = post("/api/report", "{}", apiSecret);
            return response != null && response.contains("\"success\":true");
        } catch (Exception e) {
            plugin.getLogger().log(Level.WARNING, "Error triggering report", e);
            return false;
        }
    }

    private String get(String path) throws IOException {
        URL url = URI.create(baseUrl + path).toURL();
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("X-API-Secret", apiSecret);
        conn.setConnectTimeout(10000);
        conn.setReadTimeout(10000);

        int code = conn.getResponseCode();
        if (code >= 200 && code < 300) {
            return readStream(conn);
        }
        plugin.getLogger().warning("API GET " + path + " returned " + code);
        return null;
    }

    private String post(String path, String body, String secret) throws IOException {
        URL url = URI.create(baseUrl + path).toURL();
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        if (secret != null) {
            conn.setRequestProperty("X-API-Secret", secret);
        }
        conn.setDoOutput(true);
        conn.setConnectTimeout(10000);
        conn.setReadTimeout(10000);

        try (OutputStream os = conn.getOutputStream()) {
            os.write(body.getBytes(StandardCharsets.UTF_8));
        }

        int code = conn.getResponseCode();
        if (code >= 200 && code < 300) {
            return readStream(conn);
        }
        plugin.getLogger().warning("API POST " + path + " returned " + code);
        return null;
    }

    private String readStream(HttpURLConnection conn) throws IOException {
        try (Scanner scanner = new Scanner(conn.getInputStream(), StandardCharsets.UTF_8)) {
            scanner.useDelimiter("\\A");
            return scanner.hasNext() ? scanner.next() : "";
        }
    }

    private String extractJsonString(String json, String key) {
        String search = "\"" + key + "\"";
        int idx = json.indexOf(search);
        if (idx == -1) return null;

        int afterKey = idx + search.length();
        int colonIdx = json.indexOf(':', afterKey);
        if (colonIdx == -1) return null;

        // Skip whitespace after colon
        int i = colonIdx + 1;
        while (i < json.length() && json.charAt(i) == ' ') i++;

        if (i >= json.length()) return null;

        // Check if value is a string (starts with quote) or other type
        if (json.charAt(i) == '"') {
            int endQuote = json.indexOf('"', i + 1);
            if (endQuote == -1) return null;
            return json.substring(i + 1, endQuote);
        } else {
            // Boolean or number - read until comma, }, or ]
            int end = i;
            while (end < json.length() && json.charAt(end) != ',' && json.charAt(end) != '}' && json.charAt(end) != ']') {
                end++;
            }
            return json.substring(i, end).trim();
        }
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");
    }

    // Getters
    public String getSetupUrl() { return setupUrl; }
    public boolean isSetupComplete() { return setupComplete; }
    public String getServerId() { return serverId; }
    public String getApiSecret() { return apiSecret; }
}
