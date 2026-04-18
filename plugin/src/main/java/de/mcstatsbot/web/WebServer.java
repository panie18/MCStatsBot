package de.mcstatsbot.web;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import de.mcstatsbot.MCStatsBot;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.logging.Level;

public class WebServer {

    private final MCStatsBot plugin;
    private HttpServer server;
    private String cachedIndexHtml;

    public WebServer(MCStatsBot plugin) {
        this.plugin = plugin;
    }

    public void start(int port) {
        try {
            server = HttpServer.create(new InetSocketAddress(port), 0);
            server.createContext("/", this::handleIndex);
            server.createContext("/api/stats", this::handleStats);
            server.setExecutor(null);
            server.start();
            plugin.getLogger().info("Web dashboard started on port " + port);
        } catch (IOException e) {
            plugin.getLogger().log(Level.SEVERE, "Web server could not be started!", e);
        }
    }

    public void stop() {
        if (server != null) {
            server.stop(2);
            plugin.getLogger().info("Web dashboard stopped.");
        }
    }

    private void handleIndex(HttpExchange exchange) throws IOException {
        if (cachedIndexHtml == null) {
            try (InputStream is = plugin.getClass().getClassLoader().getResourceAsStream("web/index.html")) {
                if (is != null) {
                    cachedIndexHtml = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                } else {
                    cachedIndexHtml = "<html><body><h1>MCStatsBot Dashboard</h1><p>index.html nicht gefunden</p></body></html>";
                }
            }
        }
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        sendResponse(exchange, 200, cachedIndexHtml, "text/html; charset=UTF-8");
    }

    private void handleStats(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, OPTIONS");
        exchange.getResponseHeaders().add("Content-Type", "application/json; charset=UTF-8");

        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        try {
            String json = buildStatsJson();
            sendResponse(exchange, 200, json, "application/json; charset=UTF-8");
        } catch (Exception e) {
            plugin.getLogger().log(Level.WARNING, "Error creating stats", e);
            sendResponse(exchange, 500, "{\"error\":\"Internal Server Error\"}", "application/json");
        }
    }

    /**
     * Builds the complete stats JSON string.
     * Used both by the local web dashboard and the central API client.
     */
    public String buildStatsJson() {
        Map<String, Object> data = buildStatsData();
        return mapToJson(data);
    }

    private void sendResponse(HttpExchange exchange, int code, String body, String contentType) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.sendResponseHeaders(code, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> buildStatsData() {
        var db = plugin.getDatabaseManager();
        var afk = plugin.getAfkTracker();
        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));

        Map<String, Object> data = new LinkedHashMap<>();

        // Server name
        data.put("serverName", plugin.getServer().getName() + " — " + plugin.getServer().getMotd());

        // Online Players
        List<Map<String, Object>> onlinePlayers = new ArrayList<>();
        for (var player : plugin.getServer().getOnlinePlayers()) {
            Map<String, Object> p = new LinkedHashMap<>();
            p.put("name", player.getName());
            p.put("world", getWorldType(player.getWorld().getName()));
            p.put("afk", afk.isAFK(player.getUniqueId()));
            p.put("sessionSeconds", getSessionDuration(player.getUniqueId()));
            onlinePlayers.add(p);
        }
        data.put("onlinePlayers", onlinePlayers);

        // Overview
        Map<String, Object> overview = new LinkedHashMap<>();
        List<Map<String, Object>> uniqueRows = db.query(
                "SELECT COUNT(DISTINCT uuid) as cnt FROM sessions WHERE date = ?", today);
        overview.put("uniquePlayers", toLong(uniqueRows.isEmpty() ? 0 : uniqueRows.get(0).get("cnt")));

        List<Map<String, Object>> newRows = db.query(
                "SELECT COUNT(*) as cnt FROM first_joins WHERE first_join LIKE ?", today + "%");
        overview.put("newPlayers", toLong(newRows.isEmpty() ? 0 : newRows.get(0).get("cnt")));

        List<Map<String, Object>> playtimeRows = db.query(
                "SELECT SUM(duration_seconds) as total FROM sessions WHERE date = ?", today);
        long totalPlaytime = toLong(playtimeRows.isEmpty() ? 0 : playtimeRows.get(0).get("total"));
        overview.put("totalPlaytimeSeconds", totalPlaytime);

        List<Map<String, Object>> chatRows = db.query(
                "SELECT COUNT(*) as cnt FROM chat_messages WHERE date = ?", today);
        overview.put("chatMessages", toLong(chatRows.isEmpty() ? 0 : chatRows.get(0).get("cnt")));

        List<Map<String, Object>> cmdRows = db.query(
                "SELECT COUNT(*) as cnt FROM commands_executed WHERE date = ?", today);
        overview.put("commands", toLong(cmdRows.isEmpty() ? 0 : cmdRows.get(0).get("cnt")));

        // Player of the day
        List<Map<String, Object>> podRows = db.query(
                "SELECT player_name, SUM(duration_seconds) as total FROM sessions WHERE date = ? GROUP BY uuid ORDER BY total DESC LIMIT 1", today);
        if (!podRows.isEmpty()) {
            Map<String, Object> pod = new LinkedHashMap<>();
            pod.put("name", podRows.get(0).get("player_name"));
            pod.put("playtime", toLong(podRows.get(0).get("total")));
            overview.put("playerOfDay", pod);
        }

        data.put("overview", overview);

        // Playtime Ranking
        List<Map<String, Object>> ptRows = db.query(
                "SELECT player_name, SUM(duration_seconds) as total FROM sessions WHERE date = ? GROUP BY uuid ORDER BY total DESC LIMIT 10", today);
        List<Map<String, Object>> playtimeRanking = new ArrayList<>();
        for (var row : ptRows) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("name", row.get("player_name"));
            entry.put("seconds", toLong(row.get("total")));
            playtimeRanking.add(entry);
        }
        data.put("playtimeRanking", playtimeRanking);

        // Combat
        Map<String, Object> combat = new LinkedHashMap<>();
        List<Map<String, Object>> mobKillRows = db.query(
                "SELECT COUNT(*) as cnt FROM mob_kills WHERE date = ?", today);
        combat.put("totalMobKills", toLong(mobKillRows.isEmpty() ? 0 : mobKillRows.get(0).get("cnt")));

        List<Map<String, Object>> deathRows = db.query(
                "SELECT COUNT(*) as cnt FROM deaths WHERE date = ?", today);
        combat.put("totalDeaths", toLong(deathRows.isEmpty() ? 0 : deathRows.get(0).get("cnt")));

        // Top Killers
        List<Map<String, Object>> killerRows = db.query(
                "SELECT player_name, COUNT(*) as cnt FROM mob_kills WHERE date = ? GROUP BY uuid ORDER BY cnt DESC LIMIT 5", today);
        List<Map<String, Object>> topKillers = new ArrayList<>();
        for (var row : killerRows) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("name", row.get("player_name"));
            entry.put("kills", toLong(row.get("cnt")));
            topKillers.add(entry);
        }
        combat.put("topKillers", topKillers);

        // Top Deaths
        List<Map<String, Object>> topDeathRows = db.query(
                "SELECT player_name, COUNT(*) as cnt FROM deaths WHERE date = ? GROUP BY uuid ORDER BY cnt DESC LIMIT 5", today);
        List<Map<String, Object>> topDeaths = new ArrayList<>();
        for (var row : topDeathRows) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("name", row.get("player_name"));
            entry.put("deaths", toLong(row.get("cnt")));
            topDeaths.add(entry);
        }
        combat.put("topDeaths", topDeaths);

        // Mob Types
        List<Map<String, Object>> mobTypeRows = db.query(
                "SELECT mob_type, COUNT(*) as cnt FROM mob_kills WHERE date = ? GROUP BY mob_type ORDER BY cnt DESC LIMIT 8", today);
        List<Map<String, Object>> mobTypes = new ArrayList<>();
        for (var row : mobTypeRows) {
            Map<String, Object> entry = new LinkedHashMap<>();
            String mobType = (String) row.get("mob_type");
            entry.put("type", formatMobName(mobType));
            entry.put("count", toLong(row.get("cnt")));
            entry.put("emoji", getMobEmoji(mobType));
            mobTypes.add(entry);
        }
        combat.put("mobTypes", mobTypes);

        // PvP Kills
        List<Map<String, Object>> pvpRows = db.query(
                "SELECT killer_name, victim_name, weapon FROM pvp_kills WHERE date = ? ORDER BY ROWID DESC LIMIT 5", today);
        List<Map<String, Object>> pvpKills = new ArrayList<>();
        for (var row : pvpRows) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("killer", row.get("killer_name"));
            entry.put("victim", row.get("victim_name"));
            entry.put("weapon", row.get("weapon"));
            pvpKills.add(entry);
        }
        combat.put("pvpKills", pvpKills);

        // Funniest Death
        List<Map<String, Object>> funnyDeathRows = db.query(
                "SELECT player_name, death_message, cause FROM deaths WHERE date = ? ORDER BY RANDOM() LIMIT 1", today);
        if (!funnyDeathRows.isEmpty()) {
            Map<String, Object> fd = new LinkedHashMap<>();
            fd.put("name", funnyDeathRows.get(0).get("player_name"));
            fd.put("message", funnyDeathRows.get(0).get("death_message"));
            fd.put("cause", funnyDeathRows.get(0).get("cause"));
            combat.put("funniestDeath", fd);
        }

        // Longest Kill Streak
        List<Map<String, Object>> streakRows = db.query(
                "SELECT player_name, MAX(streak) as max_streak FROM kill_streaks WHERE date = ? GROUP BY uuid ORDER BY max_streak DESC LIMIT 1", today);
        if (!streakRows.isEmpty()) {
            Map<String, Object> streak = new LinkedHashMap<>();
            streak.put("name", streakRows.get(0).get("player_name"));
            streak.put("streak", toLong(streakRows.get(0).get("max_streak")));
            combat.put("longestStreak", streak);
        }

        data.put("combat", combat);

        // Mining
        Map<String, Object> mining = new LinkedHashMap<>();
        List<Map<String, Object>> brokenRows = db.query(
                "SELECT COUNT(*) as cnt FROM blocks_broken WHERE date = ?", today);
        mining.put("totalBroken", toLong(brokenRows.isEmpty() ? 0 : brokenRows.get(0).get("cnt")));

        List<Map<String, Object>> placedRows = db.query(
                "SELECT COUNT(*) as cnt FROM blocks_placed WHERE date = ?", today);
        mining.put("totalPlaced", toLong(placedRows.isEmpty() ? 0 : placedRows.get(0).get("cnt")));

        // Top Miners
        List<Map<String, Object>> minerRows = db.query(
                "SELECT player_name, COUNT(*) as cnt FROM blocks_broken WHERE date = ? GROUP BY uuid ORDER BY cnt DESC LIMIT 5", today);
        List<Map<String, Object>> topMiners = new ArrayList<>();
        for (var row : minerRows) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("name", row.get("player_name"));
            entry.put("total", toLong(row.get("cnt")));
            topMiners.add(entry);
        }
        mining.put("topMiners", topMiners);

        // Top Builders
        List<Map<String, Object>> builderRows = db.query(
                "SELECT player_name, COUNT(*) as cnt FROM blocks_placed WHERE date = ? GROUP BY uuid ORDER BY cnt DESC LIMIT 5", today);
        List<Map<String, Object>> topBuilders = new ArrayList<>();
        for (var row : builderRows) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("name", row.get("player_name"));
            entry.put("total", toLong(row.get("cnt")));
            topBuilders.add(entry);
        }
        mining.put("topBuilders", topBuilders);

        // Rare blocks
        String[] rareBlockTypes = {"DIAMOND_ORE", "DEEPSLATE_DIAMOND_ORE", "ANCIENT_DEBRIS", "EMERALD_ORE", "DEEPSLATE_EMERALD_ORE"};
        String rarePlaceholders = String.join(",", Collections.nCopies(rareBlockTypes.length, "?"));
        Object[] rareParams = new Object[rareBlockTypes.length + 1];
        rareParams[0] = today;
        System.arraycopy(rareBlockTypes, 0, rareParams, 1, rareBlockTypes.length);
        List<Map<String, Object>> rareRows = db.query(
                "SELECT player_name, block_type, SUM(amount) as cnt FROM blocks_broken WHERE date = ? AND block_type IN (" + rarePlaceholders + ") GROUP BY uuid, block_type ORDER BY cnt DESC LIMIT 10",
                rareParams);
        List<Map<String, Object>> rareBlocks = new ArrayList<>();
        for (var row : rareRows) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("name", row.get("player_name"));
            String blockType = (String) row.get("block_type");
            entry.put("block", formatBlockName(blockType));
            entry.put("count", toLong(row.get("cnt")));
            entry.put("emoji", getBlockEmoji(blockType));
            rareBlocks.add(entry);
        }
        mining.put("rareBlocks", rareBlocks);

        data.put("mining", mining);

        // Exploration
        Map<String, Object> exploration = new LinkedHashMap<>();
        List<Map<String, Object>> distRows = db.query(
                "SELECT SUM(distance_walked + distance_sprinted + distance_flown + distance_swum + distance_ridden) as total FROM movement WHERE date = ?", today);
        double totalDistance = toDouble(distRows.isEmpty() ? 0 : distRows.get(0).get("total"));
        exploration.put("totalDistance", (long) totalDistance);

        List<Map<String, Object>> walkerRows = db.query(
                "SELECT player_name, SUM(distance_walked + distance_sprinted) as total FROM movement WHERE date = ? GROUP BY uuid ORDER BY total DESC LIMIT 1", today);
        if (!walkerRows.isEmpty()) {
            Map<String, Object> fw = new LinkedHashMap<>();
            fw.put("name", walkerRows.get(0).get("player_name"));
            fw.put("distance", (long) toDouble(walkerRows.get(0).get("total")));
            exploration.put("farthestWalker", fw);
        }

        List<Map<String, Object>> explorerRows = db.query(
                "SELECT player_name, COUNT(DISTINCT chunk_x || ',' || chunk_z || ',' || world) as chunks FROM chunk_exploration WHERE date = ? GROUP BY uuid ORDER BY chunks DESC LIMIT 5", today);
        List<Map<String, Object>> topExplorers = new ArrayList<>();
        for (var row : explorerRows) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("name", row.get("player_name"));
            entry.put("chunks", toLong(row.get("chunks")));
            topExplorers.add(entry);
        }
        exploration.put("topExplorers", topExplorers);

        List<Map<String, Object>> netherPortalRows = db.query(
                "SELECT COUNT(*) as cnt FROM portal_usage WHERE date = ? AND portal_type = 'NETHER'", today);
        exploration.put("netherPortals", toLong(netherPortalRows.isEmpty() ? 0 : netherPortalRows.get(0).get("cnt")));

        List<Map<String, Object>> endPortalRows = db.query(
                "SELECT COUNT(*) as cnt FROM portal_usage WHERE date = ? AND portal_type = 'END'", today);
        exploration.put("endPortals", toLong(endPortalRows.isEmpty() ? 0 : endPortalRows.get(0).get("cnt")));

        data.put("exploration", exploration);

        // Weekly
        Map<String, Object> weekly = new LinkedHashMap<>();
        String[] dayNames = {"Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"};
        List<Map<String, Object>> weekDays = new ArrayList<>();
        LocalDate now = LocalDate.now();
        DateTimeFormatter df = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter labelFmt = DateTimeFormatter.ofPattern("dd.MM");

        long weekTotalPlayers = 0, weekTotalPlaytime = 0, weekTotalKills = 0, weekTotalDeaths = 0;
        Set<String> weekUniquePlayers = new HashSet<>();

        for (int i = 6; i >= 0; i--) {
            LocalDate day = now.minusDays(i);
            String dayStr = day.format(df);
            int dayOfWeek = day.getDayOfWeek().getValue() - 1;

            List<Map<String, Object>> dayPlayers = db.query(
                    "SELECT COUNT(DISTINCT uuid) as cnt FROM sessions WHERE date = ?", dayStr);
            long playerCount = toLong(dayPlayers.isEmpty() ? 0 : dayPlayers.get(0).get("cnt"));

            List<Map<String, Object>> dayUuids = db.query(
                    "SELECT DISTINCT uuid FROM sessions WHERE date = ?", dayStr);
            for (var row : dayUuids) {
                weekUniquePlayers.add((String) row.get("uuid"));
            }

            List<Map<String, Object>> dayPlaytime = db.query(
                    "SELECT SUM(duration_seconds) as total FROM sessions WHERE date = ?", dayStr);
            weekTotalPlaytime += toLong(dayPlaytime.isEmpty() ? 0 : dayPlaytime.get(0).get("total"));

            List<Map<String, Object>> dayKills = db.query(
                    "SELECT COUNT(*) as cnt FROM mob_kills WHERE date = ?", dayStr);
            weekTotalKills += toLong(dayKills.isEmpty() ? 0 : dayKills.get(0).get("cnt"));

            List<Map<String, Object>> dayDeaths = db.query(
                    "SELECT COUNT(*) as cnt FROM deaths WHERE date = ?", dayStr);
            weekTotalDeaths += toLong(dayDeaths.isEmpty() ? 0 : dayDeaths.get(0).get("cnt"));

            Map<String, Object> dayEntry = new LinkedHashMap<>();
            dayEntry.put("day", dayNames[dayOfWeek]);
            dayEntry.put("players", playerCount);
            dayEntry.put("label", day.format(labelFmt));
            weekDays.add(dayEntry);
        }

        weekly.put("days", weekDays);
        weekly.put("totalPlayers", (long) weekUniquePlayers.size());
        weekly.put("totalPlaytime", weekTotalPlaytime);
        weekly.put("totalKills", weekTotalKills);
        weekly.put("totalDeaths", weekTotalDeaths);
        data.put("weekly", weekly);

        // Recent Events
        List<Map<String, Object>> events = new ArrayList<>();

        List<Map<String, Object>> advRows = db.query(
                "SELECT player_name, advancement, timestamp FROM advancements WHERE date = ? ORDER BY ROWID DESC LIMIT 3", today);
        for (var row : advRows) {
            Map<String, Object> evt = new LinkedHashMap<>();
            evt.put("emoji", "\uD83C\uDFC6");
            evt.put("text", row.get("player_name") + " hat '" + formatAdvancement((String) row.get("advancement")) + "' freigeschaltet");
            evt.put("time", extractTime((String) row.get("timestamp")));
            events.add(evt);
        }

        List<Map<String, Object>> recentDeaths = db.query(
                "SELECT player_name, death_message, timestamp FROM deaths WHERE date = ? ORDER BY ROWID DESC LIMIT 3", today);
        for (var row : recentDeaths) {
            Map<String, Object> evt = new LinkedHashMap<>();
            evt.put("emoji", "\uD83D\uDC80");
            evt.put("text", row.get("death_message") != null ? row.get("death_message") : row.get("player_name") + " ist gestorben");
            evt.put("time", extractTime((String) row.get("timestamp")));
            events.add(evt);
        }

        List<Map<String, Object>> recentPvp = db.query(
                "SELECT killer_name, victim_name, timestamp FROM pvp_kills WHERE date = ? ORDER BY ROWID DESC LIMIT 2", today);
        for (var row : recentPvp) {
            Map<String, Object> evt = new LinkedHashMap<>();
            evt.put("emoji", "\u2694\uFE0F");
            evt.put("text", row.get("killer_name") + " hat " + row.get("victim_name") + " im PvP besiegt");
            evt.put("time", extractTime((String) row.get("timestamp")));
            events.add(evt);
        }

        events.sort((a, b) -> ((String) b.get("time")).compareTo((String) a.get("time")));
        if (events.size() > 8) events = events.subList(0, 8);
        data.put("events", events);

        // Fun Facts
        List<String> funFacts = new ArrayList<>();
        long totalBroken = toLong(mining.get("totalBroken"));
        if (totalBroken > 0) {
            funFacts.add("Heute wurden " + totalBroken + " Bloecke abgebaut — das reicht fuer eine " + (totalBroken / 100) + " Block hohe Saeule.");
        }
        if (totalDistance > 1000) {
            funFacts.add("Spieler haben heute " + String.format("%.1f", totalDistance / 1000.0) + " km zurueckgelegt.");
        }
        long totalMobKills = toLong(combat.get("totalMobKills"));
        if (totalMobKills > 0) {
            funFacts.add("Heute wurden " + totalMobKills + " Mobs zur Strecke gebracht. RIP.");
        }
        if (funFacts.isEmpty()) {
            funFacts.add("Noch keine Statistiken fuer heute — spring auf den Server und leg los!");
        }
        data.put("funFacts", funFacts);

        return data;
    }

    // ── Helpers ──

    private String getWorldType(String worldName) {
        if (worldName.contains("nether")) return "nether";
        if (worldName.contains("end")) return "end";
        return "overworld";
    }

    private long getSessionDuration(java.util.UUID uuid) {
        var afk = plugin.getAfkTracker();
        return afk.getSessionDuration(uuid);
    }

    private long toLong(Object obj) {
        if (obj == null) return 0;
        if (obj instanceof Number n) return n.longValue();
        try { return Long.parseLong(obj.toString()); } catch (Exception e) { return 0; }
    }

    private double toDouble(Object obj) {
        if (obj == null) return 0.0;
        if (obj instanceof Number n) return n.doubleValue();
        try { return Double.parseDouble(obj.toString()); } catch (Exception e) { return 0.0; }
    }

    private String formatMobName(String type) {
        if (type == null) return "Unknown";
        return type.replace("_", " ").substring(0, 1).toUpperCase()
                + type.replace("_", " ").substring(1).toLowerCase();
    }

    private String getMobEmoji(String type) {
        if (type == null) return "\uD83D\uDC7E";
        return switch (type.toUpperCase()) {
            case "ZOMBIE", "ZOMBIE_VILLAGER", "DROWNED", "HUSK" -> "\uD83E\uDDDF";
            case "SKELETON", "WITHER_SKELETON", "STRAY" -> "\uD83D\uDC80";
            case "CREEPER" -> "\uD83D\uDCA5";
            case "SPIDER", "CAVE_SPIDER" -> "\uD83D\uDD77\uFE0F";
            case "ENDERMAN" -> "\uD83D\uDC7E";
            case "BLAZE" -> "\uD83D\uDD25";
            case "WITCH" -> "\uD83E\uDDD9";
            case "GHAST" -> "\uD83D\uDC7B";
            case "SLIME", "MAGMA_CUBE" -> "\uD83D\uDFE2";
            case "PHANTOM" -> "\uD83E\uDD87";
            case "PIGLIN", "PIGLIN_BRUTE", "ZOMBIFIED_PIGLIN" -> "\uD83D\uDC37";
            case "WARDEN" -> "\uD83C\uDF00";
            case "ENDER_DRAGON" -> "\uD83D\uDC09";
            case "WITHER" -> "\u2620\uFE0F";
            default -> "\u2694\uFE0F";
        };
    }

    private String formatBlockName(String type) {
        if (type == null) return "Unknown";
        return type.replace("DEEPSLATE_", "").replace("_ORE", "")
                .replace("_", " ").substring(0, 1).toUpperCase()
                + type.replace("DEEPSLATE_", "").replace("_ORE", "")
                .replace("_", " ").substring(1).toLowerCase();
    }

    private String getBlockEmoji(String type) {
        if (type == null) return "\uD83E\uDEA8";
        if (type.contains("DIAMOND")) return "\uD83D\uDC8E";
        if (type.contains("EMERALD")) return "\uD83D\uDC9A";
        if (type.contains("ANCIENT_DEBRIS")) return "\uD83D\uDFE4";
        if (type.contains("GOLD")) return "\uD83E\uDD47";
        if (type.contains("LAPIS")) return "\uD83D\uDD35";
        return "\uD83E\uDEA8";
    }

    private String formatAdvancement(String advancement) {
        if (advancement == null) return "???";
        String name = advancement;
        if (name.contains("/")) name = name.substring(name.lastIndexOf('/') + 1);
        if (name.contains(":")) name = name.substring(name.lastIndexOf(':') + 1);
        return name.replace("_", " ").substring(0, 1).toUpperCase()
                + name.replace("_", " ").substring(1);
    }

    private String extractTime(String timestamp) {
        if (timestamp == null || timestamp.length() < 16) return "--:--";
        return timestamp.substring(11, 16);
    }

    // ── Simple JSON serializer ──

    @SuppressWarnings("unchecked")
    private String mapToJson(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof String s) return "\"" + escapeJson(s) + "\"";
        if (obj instanceof Number n) return n.toString();
        if (obj instanceof Boolean b) return b.toString();
        if (obj instanceof Map<?, ?> map) {
            StringBuilder sb = new StringBuilder("{");
            boolean first = true;
            for (var entry : ((Map<String, Object>) map).entrySet()) {
                if (!first) sb.append(",");
                sb.append("\"").append(escapeJson(entry.getKey())).append("\":");
                sb.append(mapToJson(entry.getValue()));
                first = false;
            }
            return sb.append("}").toString();
        }
        if (obj instanceof List<?> list) {
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) {
                if (i > 0) sb.append(",");
                sb.append(mapToJson(list.get(i)));
            }
            return sb.append("]").toString();
        }
        return "\"" + escapeJson(obj.toString()) + "\"";
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
