package de.mcstatsbot.stats;

import de.mcstatsbot.database.DatabaseManager;

import java.util.*;

public class StatsCalculator {

    private final DatabaseManager db;

    public StatsCalculator(DatabaseManager db) {
        this.db = db;
    }

    /**
     * Tagesübersicht: unique players, total playtime, new players, chat messages, commands, deaths, kills
     */
    public Map<String, Object> getDailyOverview(String date) {
        Map<String, Object> overview = new LinkedHashMap<>();

        overview.put("uniquePlayers", queryLong(
                "SELECT COUNT(DISTINCT uuid) as cnt FROM sessions WHERE date = ?", date));
        overview.put("newPlayers", queryLong(
                "SELECT COUNT(*) as cnt FROM first_joins WHERE first_join LIKE ?", date + "%"));
        overview.put("totalPlaytime", queryLong(
                "SELECT COALESCE(SUM(duration_seconds), 0) as cnt FROM sessions WHERE date = ?", date));
        overview.put("avgPlaytime", queryLong(
                "SELECT COALESCE(AVG(duration_seconds), 0) as cnt FROM sessions WHERE date = ? AND duration_seconds > 0", date));
        overview.put("chatMessages", queryLong(
                "SELECT COUNT(*) as cnt FROM chat_messages WHERE date = ?", date));
        overview.put("commands", queryLong(
                "SELECT COUNT(*) as cnt FROM commands_executed WHERE date = ?", date));
        overview.put("totalDeaths", queryLong(
                "SELECT COUNT(*) as cnt FROM deaths WHERE date = ?", date));
        overview.put("totalMobKills", queryLong(
                "SELECT COUNT(*) as cnt FROM mob_kills WHERE date = ?", date));
        overview.put("totalPvpKills", queryLong(
                "SELECT COUNT(*) as cnt FROM pvp_kills WHERE date = ?", date));
        overview.put("blocksBroken", queryLong(
                "SELECT COUNT(*) as cnt FROM blocks_broken WHERE date = ?", date));
        overview.put("blocksPlaced", queryLong(
                "SELECT COUNT(*) as cnt FROM blocks_placed WHERE date = ?", date));
        overview.put("advancements", queryLong(
                "SELECT COUNT(*) as cnt FROM advancements WHERE date = ?", date));

        // Player of the day
        List<Map<String, Object>> podRows = db.query(
                "SELECT player_name, SUM(duration_seconds) as total FROM sessions WHERE date = ? GROUP BY uuid ORDER BY total DESC LIMIT 1", date);
        if (!podRows.isEmpty()) {
            overview.put("playerOfDayName", podRows.get(0).get("player_name"));
            overview.put("playerOfDayPlaytime", toLong(podRows.get(0).get("total")));
        }

        return overview;
    }

    /**
     * Spielzeit-Ranking: Name + Sekunden
     */
    public List<Map<String, Object>> getPlaytimeRanking(String date) {
        return db.query(
                "SELECT player_name, SUM(duration_seconds) as total FROM sessions WHERE date = ? GROUP BY uuid ORDER BY total DESC LIMIT 15",
                date);
    }

    /**
     * Kampf-Statistiken
     */
    public Map<String, Object> getCombatStats(String date) {
        Map<String, Object> combat = new LinkedHashMap<>();

        combat.put("totalMobKills", queryLong(
                "SELECT COUNT(*) as cnt FROM mob_kills WHERE date = ?", date));
        combat.put("totalDeaths", queryLong(
                "SELECT COUNT(*) as cnt FROM deaths WHERE date = ?", date));
        combat.put("totalPvpKills", queryLong(
                "SELECT COUNT(*) as cnt FROM pvp_kills WHERE date = ?", date));
        combat.put("totalDamageDealt", queryDouble(
                "SELECT COALESCE(SUM(damage_dealt), 0) as cnt FROM damage_stats WHERE date = ?", date));

        // Top Killers
        combat.put("topKillers", db.query(
                "SELECT player_name, COUNT(*) as kills FROM mob_kills WHERE date = ? GROUP BY uuid ORDER BY kills DESC LIMIT 5", date));

        // Top Deaths
        combat.put("topDeaths", db.query(
                "SELECT player_name, COUNT(*) as deaths FROM deaths WHERE date = ? GROUP BY uuid ORDER BY deaths DESC LIMIT 5", date));

        // Most killed mob types
        combat.put("topMobTypes", db.query(
                "SELECT mob_type, COUNT(*) as cnt FROM mob_kills WHERE date = ? GROUP BY mob_type ORDER BY cnt DESC LIMIT 5", date));

        // PvP
        combat.put("pvpKills", db.query(
                "SELECT killer_name, victim_name, weapon FROM pvp_kills WHERE date = ? ORDER BY ROWID DESC LIMIT 5", date));

        // Kill Streaks
        List<Map<String, Object>> streakRows = db.query(
                "SELECT player_name, MAX(streak) as max_streak FROM kill_streaks WHERE date = ? GROUP BY uuid ORDER BY max_streak DESC LIMIT 3", date);
        combat.put("topStreaks", streakRows);

        return combat;
    }

    /**
     * Block/Mining-Statistiken
     */
    public Map<String, Object> getMiningStats(String date) {
        Map<String, Object> mining = new LinkedHashMap<>();

        mining.put("totalBroken", queryLong(
                "SELECT COUNT(*) as cnt FROM blocks_broken WHERE date = ?", date));
        mining.put("totalPlaced", queryLong(
                "SELECT COUNT(*) as cnt FROM blocks_placed WHERE date = ?", date));

        mining.put("topMiners", db.query(
                "SELECT player_name, COUNT(*) as total FROM blocks_broken WHERE date = ? GROUP BY uuid ORDER BY total DESC LIMIT 5", date));

        mining.put("topBuilders", db.query(
                "SELECT player_name, COUNT(*) as total FROM blocks_placed WHERE date = ? GROUP BY uuid ORDER BY total DESC LIMIT 5", date));

        // Rare block finds
        mining.put("rareBlocks", db.query(
                "SELECT player_name, block_type, SUM(amount) as cnt FROM blocks_broken WHERE date = ? AND block_type IN ('DIAMOND_ORE','DEEPSLATE_DIAMOND_ORE','ANCIENT_DEBRIS','EMERALD_ORE','DEEPSLATE_EMERALD_ORE') GROUP BY uuid, block_type ORDER BY cnt DESC LIMIT 10",
                date));

        // Top block types broken
        mining.put("topBlockTypes", db.query(
                "SELECT block_type, SUM(amount) as cnt FROM blocks_broken WHERE date = ? GROUP BY block_type ORDER BY cnt DESC LIMIT 10", date));

        return mining;
    }

    /**
     * Erkundungs-Statistiken
     */
    public Map<String, Object> getExplorationStats(String date) {
        Map<String, Object> exploration = new LinkedHashMap<>();

        exploration.put("totalDistance", queryDouble(
                "SELECT COALESCE(SUM(distance_walked + distance_sprinted + distance_flown + distance_swum + distance_ridden), 0) as cnt FROM movement WHERE date = ?", date));

        exploration.put("topWalkers", db.query(
                "SELECT player_name, SUM(distance_walked + distance_sprinted) as total FROM movement WHERE date = ? GROUP BY uuid ORDER BY total DESC LIMIT 5", date));

        exploration.put("newChunks", queryLong(
                "SELECT COUNT(*) as cnt FROM chunk_exploration WHERE date = ?", date));

        exploration.put("topExplorers", db.query(
                "SELECT player_name, COUNT(DISTINCT chunk_x || ',' || chunk_z || ',' || world) as chunks FROM chunk_exploration WHERE date = ? GROUP BY uuid ORDER BY chunks DESC LIMIT 5", date));

        exploration.put("portalUsages", queryLong(
                "SELECT COUNT(*) as cnt FROM portal_usage WHERE date = ?", date));

        exploration.put("netherPortals", queryLong(
                "SELECT COUNT(*) as cnt FROM portal_usage WHERE date = ? AND portal_type = 'NETHER'", date));

        exploration.put("endPortals", queryLong(
                "SELECT COUNT(*) as cnt FROM portal_usage WHERE date = ? AND portal_type = 'END'", date));

        return exploration;
    }

    /**
     * Spieler-spezifische Stats
     */
    public Map<String, Object> getPlayerStats(String playerName, String date) {
        Map<String, Object> stats = new LinkedHashMap<>();

        stats.put("playtime", queryLong(
                "SELECT COALESCE(SUM(duration_seconds), 0) as cnt FROM sessions WHERE player_name = ? AND date = ?", playerName, date));
        stats.put("mobKills", queryLong(
                "SELECT COUNT(*) as cnt FROM mob_kills WHERE player_name = ? AND date = ?", playerName, date));
        stats.put("deaths", queryLong(
                "SELECT COUNT(*) as cnt FROM deaths WHERE player_name = ? AND date = ?", playerName, date));
        stats.put("blocksBroken", queryLong(
                "SELECT COUNT(*) as cnt FROM blocks_broken WHERE player_name = ? AND date = ?", playerName, date));
        stats.put("blocksPlaced", queryLong(
                "SELECT COUNT(*) as cnt FROM blocks_placed WHERE player_name = ? AND date = ?", playerName, date));
        stats.put("chatMessages", queryLong(
                "SELECT COUNT(*) as cnt FROM chat_messages WHERE player_name = ? AND date = ?", playerName, date));
        stats.put("xpGained", queryLong(
                "SELECT COALESCE(SUM(amount), 0) as cnt FROM xp_gained WHERE player_name = ? AND date = ?", playerName, date));
        stats.put("distance", queryDouble(
                "SELECT COALESCE(SUM(distance_walked + distance_sprinted + distance_flown + distance_swum + distance_ridden), 0) as cnt FROM movement WHERE player_name = ? AND date = ?", playerName, date));
        stats.put("advancements", queryLong(
                "SELECT COUNT(*) as cnt FROM advancements WHERE player_name = ? AND date = ?", playerName, date));
        stats.put("itemsCrafted", queryLong(
                "SELECT COALESCE(SUM(amount), 0) as cnt FROM items_crafted WHERE player_name = ? AND date = ?", playerName, date));

        return stats;
    }

    /**
     * Wöchentliche Zusammenfassung (7 Tage)
     */
    public Map<String, Object> getWeeklyStats(String fromDate, String toDate) {
        Map<String, Object> weekly = new LinkedHashMap<>();

        weekly.put("uniquePlayers", queryLong(
                "SELECT COUNT(DISTINCT uuid) as cnt FROM sessions WHERE date BETWEEN ? AND ?", fromDate, toDate));
        weekly.put("totalPlaytime", queryLong(
                "SELECT COALESCE(SUM(duration_seconds), 0) as cnt FROM sessions WHERE date BETWEEN ? AND ?", fromDate, toDate));
        weekly.put("totalKills", queryLong(
                "SELECT COUNT(*) as cnt FROM mob_kills WHERE date BETWEEN ? AND ?", fromDate, toDate));
        weekly.put("totalDeaths", queryLong(
                "SELECT COUNT(*) as cnt FROM deaths WHERE date BETWEEN ? AND ?", fromDate, toDate));
        weekly.put("totalBlocks", queryLong(
                "SELECT COUNT(*) as cnt FROM blocks_broken WHERE date BETWEEN ? AND ?", fromDate, toDate));
        weekly.put("totalDistance", queryDouble(
                "SELECT COALESCE(SUM(distance_walked + distance_sprinted + distance_flown + distance_swum + distance_ridden), 0) as cnt FROM movement WHERE date BETWEEN ? AND ?", fromDate, toDate));

        // Top players by playtime for the week
        weekly.put("topPlayers", db.query(
                "SELECT player_name, SUM(duration_seconds) as total FROM sessions WHERE date BETWEEN ? AND ? GROUP BY uuid ORDER BY total DESC LIMIT 10",
                fromDate, toDate));

        return weekly;
    }

    /**
     * Allzeit-Rekorde
     */
    public Map<String, Object> getAllTimeRecords() {
        Map<String, Object> records = new LinkedHashMap<>();

        // Longest single session
        List<Map<String, Object>> longestSession = db.query(
                "SELECT player_name, MAX(duration_seconds) as duration, date FROM sessions WHERE duration_seconds > 0 ORDER BY duration_seconds DESC LIMIT 1");
        if (!longestSession.isEmpty()) {
            records.put("longestSession", longestSession.get(0));
        }

        // Most kills in a day
        List<Map<String, Object>> mostKills = db.query(
                "SELECT player_name, COUNT(*) as kills, date FROM mob_kills GROUP BY uuid, date ORDER BY kills DESC LIMIT 1");
        if (!mostKills.isEmpty()) {
            records.put("mostKillsInDay", mostKills.get(0));
        }

        // Most deaths in a day
        List<Map<String, Object>> mostDeaths = db.query(
                "SELECT player_name, COUNT(*) as deaths, date FROM deaths GROUP BY uuid, date ORDER BY deaths DESC LIMIT 1");
        if (!mostDeaths.isEmpty()) {
            records.put("mostDeathsInDay", mostDeaths.get(0));
        }

        // Most blocks mined in a day
        List<Map<String, Object>> mostMined = db.query(
                "SELECT player_name, COUNT(*) as total, date FROM blocks_broken GROUP BY uuid, date ORDER BY total DESC LIMIT 1");
        if (!mostMined.isEmpty()) {
            records.put("mostMinedInDay", mostMined.get(0));
        }

        // Highest kill streak
        List<Map<String, Object>> highestStreak = db.query(
                "SELECT player_name, MAX(streak) as streak, date FROM kill_streaks ORDER BY streak DESC LIMIT 1");
        if (!highestStreak.isEmpty()) {
            records.put("highestKillStreak", highestStreak.get(0));
        }

        // Most advancements in a day
        List<Map<String, Object>> mostAdv = db.query(
                "SELECT player_name, COUNT(*) as total, date FROM advancements GROUP BY uuid, date ORDER BY total DESC LIMIT 1");
        if (!mostAdv.isEmpty()) {
            records.put("mostAdvancementsInDay", mostAdv.get(0));
        }

        // Total unique players ever
        records.put("totalUniquePlayers", queryLong(
                "SELECT COUNT(*) as cnt FROM first_joins"));

        return records;
    }

    // ── Helpers ──

    private long queryLong(String sql, Object... params) {
        List<Map<String, Object>> rows = db.query(sql, params);
        if (rows.isEmpty()) return 0;
        return toLong(rows.get(0).values().iterator().next());
    }

    private double queryDouble(String sql, Object... params) {
        List<Map<String, Object>> rows = db.query(sql, params);
        if (rows.isEmpty()) return 0.0;
        Object val = rows.get(0).values().iterator().next();
        if (val == null) return 0.0;
        if (val instanceof Number n) return n.doubleValue();
        try { return Double.parseDouble(val.toString()); } catch (Exception e) { return 0.0; }
    }

    private long toLong(Object obj) {
        if (obj == null) return 0;
        if (obj instanceof Number n) return n.longValue();
        try { return Long.parseLong(obj.toString()); } catch (Exception e) { return 0; }
    }
}
