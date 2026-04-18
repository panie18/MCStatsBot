package de.mcstatsbot.database;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import de.mcstatsbot.config.ConfigManager;

import java.io.File;
import java.sql.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.*;
import java.util.logging.Level;
import java.util.logging.Logger;

public final class DatabaseManager {

    private static final DateTimeFormatter DT_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final DateTimeFormatter D_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final Logger logger;
    private final HikariDataSource dataSource;
    private final ExecutorService executor;
    private final ConfigManager config;

    // Batch queues
    private final ConcurrentLinkedQueue<Object[]> blockBreakQueue = new ConcurrentLinkedQueue<>();
    private final ConcurrentLinkedQueue<Object[]> blockPlaceQueue = new ConcurrentLinkedQueue<>();
    private final ConcurrentLinkedQueue<Object[]> movementQueue = new ConcurrentLinkedQueue<>();
    private final ScheduledExecutorService flushScheduler;

    public DatabaseManager(File dataFolder, ConfigManager config, Logger logger) {
        this.logger = logger;
        this.config = config;
        this.executor = Executors.newFixedThreadPool(2, r -> {
            Thread t = new Thread(r, "MCStatsBot-DB");
            t.setDaemon(true);
            return t;
        });

        File dbFile = new File(dataFolder, "mcstatsbot.db");
        HikariConfig hikariConfig = new HikariConfig();
        hikariConfig.setJdbcUrl("jdbc:sqlite:" + dbFile.getAbsolutePath());
        hikariConfig.setMaximumPoolSize(config.getMaxPoolSize());
        hikariConfig.setConnectionTimeout(5000);
        hikariConfig.setPoolName("MCStatsBot-Pool");
        // SQLite needs single connection for writes
        hikariConfig.setMaximumPoolSize(1);

        this.dataSource = new HikariDataSource(hikariConfig);

        initializeTables();

        this.flushScheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "MCStatsBot-Flush");
            t.setDaemon(true);
            return t;
        });
        flushScheduler.scheduleAtFixedRate(this::flushBatches,
                config.getFlushIntervalSeconds(), config.getFlushIntervalSeconds(), TimeUnit.SECONDS);
    }

    private void initializeTables() {
        try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
            // Enable WAL mode for better concurrent performance
            stmt.execute("PRAGMA journal_mode=WAL");
            stmt.execute("PRAGMA synchronous=NORMAL");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uuid TEXT NOT NULL,
                    player_name TEXT NOT NULL,
                    join_time TEXT NOT NULL,
                    leave_time TEXT,
                    duration_seconds INTEGER DEFAULT 0,
                    afk_seconds INTEGER DEFAULT 0,
                    date TEXT NOT NULL
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS first_joins (
                    uuid TEXT PRIMARY KEY,
                    player_name TEXT NOT NULL,
                    first_join TEXT NOT NULL
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS chat_messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uuid TEXT NOT NULL,
                    player_name TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    date TEXT NOT NULL
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS commands_executed (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uuid TEXT NOT NULL,
                    player_name TEXT NOT NULL,
                    command TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    date TEXT NOT NULL
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS deaths (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uuid TEXT NOT NULL,
                    player_name TEXT NOT NULL,
                    cause TEXT NOT NULL,
                    death_message TEXT,
                    killer_uuid TEXT,
                    killer_name TEXT,
                    killer_type TEXT,
                    world TEXT,
                    x REAL, y REAL, z REAL,
                    timestamp TEXT NOT NULL,
                    date TEXT NOT NULL
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS mob_kills (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uuid TEXT NOT NULL,
                    player_name TEXT NOT NULL,
                    mob_type TEXT NOT NULL,
                    world TEXT,
                    timestamp TEXT NOT NULL,
                    date TEXT NOT NULL
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS pvp_kills (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    killer_uuid TEXT NOT NULL,
                    killer_name TEXT NOT NULL,
                    victim_uuid TEXT NOT NULL,
                    victim_name TEXT NOT NULL,
                    weapon TEXT,
                    timestamp TEXT NOT NULL,
                    date TEXT NOT NULL
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS damage_stats (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uuid TEXT NOT NULL,
                    player_name TEXT NOT NULL,
                    damage_dealt REAL DEFAULT 0,
                    damage_taken REAL DEFAULT 0,
                    cause TEXT,
                    timestamp TEXT NOT NULL,
                    date TEXT NOT NULL
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS blocks_broken (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uuid TEXT NOT NULL,
                    player_name TEXT NOT NULL,
                    block_type TEXT NOT NULL,
                    amount INTEGER DEFAULT 1,
                    date TEXT NOT NULL
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS blocks_placed (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uuid TEXT NOT NULL,
                    player_name TEXT NOT NULL,
                    block_type TEXT NOT NULL,
                    amount INTEGER DEFAULT 1,
                    date TEXT NOT NULL
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS items_crafted (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uuid TEXT NOT NULL,
                    player_name TEXT NOT NULL,
                    item_type TEXT NOT NULL,
                    amount INTEGER DEFAULT 1,
                    timestamp TEXT NOT NULL,
                    date TEXT NOT NULL
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS advancements (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uuid TEXT NOT NULL,
                    player_name TEXT NOT NULL,
                    advancement TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    date TEXT NOT NULL
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS xp_gained (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uuid TEXT NOT NULL,
                    player_name TEXT NOT NULL,
                    amount INTEGER NOT NULL,
                    timestamp TEXT NOT NULL,
                    date TEXT NOT NULL
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS enchantments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uuid TEXT NOT NULL,
                    player_name TEXT NOT NULL,
                    item TEXT NOT NULL,
                    enchantment TEXT NOT NULL,
                    level INTEGER,
                    timestamp TEXT NOT NULL,
                    date TEXT NOT NULL
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS movement (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uuid TEXT NOT NULL,
                    player_name TEXT NOT NULL,
                    distance_walked REAL DEFAULT 0,
                    distance_sprinted REAL DEFAULT 0,
                    distance_flown REAL DEFAULT 0,
                    distance_swum REAL DEFAULT 0,
                    distance_ridden REAL DEFAULT 0,
                    date TEXT NOT NULL
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS chunk_exploration (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uuid TEXT NOT NULL,
                    player_name TEXT NOT NULL,
                    world TEXT NOT NULL,
                    chunk_x INTEGER NOT NULL,
                    chunk_z INTEGER NOT NULL,
                    first_visit TEXT NOT NULL,
                    date TEXT NOT NULL,
                    UNIQUE(uuid, world, chunk_x, chunk_z)
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS portal_usage (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uuid TEXT NOT NULL,
                    player_name TEXT NOT NULL,
                    portal_type TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    date TEXT NOT NULL
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS items_picked_up (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uuid TEXT NOT NULL,
                    player_name TEXT NOT NULL,
                    item_type TEXT NOT NULL,
                    amount INTEGER DEFAULT 1,
                    timestamp TEXT NOT NULL,
                    date TEXT NOT NULL
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS items_dropped (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uuid TEXT NOT NULL,
                    player_name TEXT NOT NULL,
                    item_type TEXT NOT NULL,
                    amount INTEGER DEFAULT 1,
                    timestamp TEXT NOT NULL,
                    date TEXT NOT NULL
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS items_consumed (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uuid TEXT NOT NULL,
                    player_name TEXT NOT NULL,
                    item_type TEXT NOT NULL,
                    amount INTEGER DEFAULT 1,
                    timestamp TEXT NOT NULL,
                    date TEXT NOT NULL
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS villager_trades (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uuid TEXT NOT NULL,
                    player_name TEXT NOT NULL,
                    item_bought TEXT,
                    item_sold TEXT,
                    timestamp TEXT NOT NULL,
                    date TEXT NOT NULL
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS fishing (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uuid TEXT NOT NULL,
                    player_name TEXT NOT NULL,
                    catch_type TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    date TEXT NOT NULL
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS animal_taming (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uuid TEXT NOT NULL,
                    player_name TEXT NOT NULL,
                    animal_type TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    date TEXT NOT NULL
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS animal_breeding (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uuid TEXT NOT NULL,
                    player_name TEXT NOT NULL,
                    animal_type TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    date TEXT NOT NULL
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS redstone_activations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uuid TEXT NOT NULL,
                    player_name TEXT NOT NULL,
                    block_type TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    date TEXT NOT NULL
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS tnt_ignitions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uuid TEXT NOT NULL,
                    player_name TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    date TEXT NOT NULL
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS bed_usage (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uuid TEXT NOT NULL,
                    player_name TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    date TEXT NOT NULL
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS pet_deaths (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    owner_uuid TEXT,
                    owner_name TEXT,
                    pet_type TEXT NOT NULL,
                    pet_name TEXT,
                    cause TEXT,
                    timestamp TEXT NOT NULL,
                    date TEXT NOT NULL
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS kill_streaks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uuid TEXT NOT NULL,
                    player_name TEXT NOT NULL,
                    streak INTEGER NOT NULL,
                    ended_at TEXT NOT NULL,
                    date TEXT NOT NULL
                )""");

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS biome_visits (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uuid TEXT NOT NULL,
                    player_name TEXT NOT NULL,
                    biome TEXT NOT NULL,
                    first_visit TEXT NOT NULL,
                    UNIQUE(uuid, biome)
                )""");

            // Indexes
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date)");
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_sessions_uuid ON sessions(uuid)");
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_deaths_date ON deaths(date)");
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_mob_kills_date ON mob_kills(date)");
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_blocks_broken_date ON blocks_broken(date)");
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_blocks_placed_date ON blocks_placed(date)");
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_chat_date ON chat_messages(date)");
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_movement_date ON movement(date)");
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_advancements_date ON advancements(date)");

            logger.info("Database tables successfully initialized.");
        } catch (SQLException e) {
            logger.log(Level.SEVERE, "Error initializing database!", e);
        }
    }

    // ============================================
    //  Async execution helpers
    // ============================================

    public CompletableFuture<Void> executeAsync(String sql, Object... params) {
        return CompletableFuture.runAsync(() -> {
            try (Connection conn = dataSource.getConnection();
                 PreparedStatement ps = conn.prepareStatement(sql)) {
                setParams(ps, params);
                ps.executeUpdate();
            } catch (SQLException e) {
                logger.log(Level.WARNING, "DB Error: " + sql, e);
            }
        }, executor);
    }

    public CompletableFuture<List<Map<String, Object>>> queryAsync(String sql, Object... params) {
        return CompletableFuture.supplyAsync(() -> query(sql, params), executor);
    }

    public List<Map<String, Object>> query(String sql, Object... params) {
        List<Map<String, Object>> results = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            setParams(ps, params);
            try (ResultSet rs = ps.executeQuery()) {
                ResultSetMetaData meta = rs.getMetaData();
                int cols = meta.getColumnCount();
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    for (int i = 1; i <= cols; i++) {
                        row.put(meta.getColumnLabel(i), rs.getObject(i));
                    }
                    results.add(row);
                }
            }
        } catch (SQLException e) {
            logger.log(Level.WARNING, "DB Query Error: " + sql, e);
        }
        return results;
    }

    private void setParams(PreparedStatement ps, Object... params) throws SQLException {
        for (int i = 0; i < params.length; i++) {
            ps.setObject(i + 1, params[i]);
        }
    }

    // ============================================
    //  Session tracking
    // ============================================

    public void recordJoin(String uuid, String name) {
        String now = LocalDateTime.now().format(DT_FMT);
        String date = LocalDate.now().format(D_FMT);
        executeAsync("INSERT INTO sessions (uuid, player_name, join_time, date) VALUES (?, ?, ?, ?)",
                uuid, name, now, date);

        // Check first join
        executeAsync("INSERT OR IGNORE INTO first_joins (uuid, player_name, first_join) VALUES (?, ?, ?)",
                uuid, name, now);
    }

    public void recordLeave(String uuid, String name, long durationSeconds, long afkSeconds) {
        String now = LocalDateTime.now().format(DT_FMT);
        String date = LocalDate.now().format(D_FMT);
        executeAsync("""
            UPDATE sessions SET leave_time = ?, duration_seconds = ?, afk_seconds = ?
            WHERE uuid = ? AND date = ? AND leave_time IS NULL
            """, now, durationSeconds, afkSeconds, uuid, date);
    }

    public boolean isFirstJoin(String uuid) {
        List<Map<String, Object>> rows = query("SELECT uuid FROM first_joins WHERE uuid = ?", uuid);
        return rows.isEmpty();
    }

    // ============================================
    //  Chat & Commands
    // ============================================

    public void recordChat(String uuid, String name) {
        String now = LocalDateTime.now().format(DT_FMT);
        String date = LocalDate.now().format(D_FMT);
        executeAsync("INSERT INTO chat_messages (uuid, player_name, timestamp, date) VALUES (?, ?, ?, ?)",
                uuid, name, now, date);
    }

    public void recordCommand(String uuid, String name, String command) {
        String now = LocalDateTime.now().format(DT_FMT);
        String date = LocalDate.now().format(D_FMT);
        executeAsync("INSERT INTO commands_executed (uuid, player_name, command, timestamp, date) VALUES (?, ?, ?, ?, ?)",
                uuid, name, command, now, date);
    }

    // ============================================
    //  Combat
    // ============================================

    public void recordDeath(String uuid, String name, String cause, String deathMessage,
                            String killerUuid, String killerName, String killerType,
                            String world, double x, double y, double z) {
        String now = LocalDateTime.now().format(DT_FMT);
        String date = LocalDate.now().format(D_FMT);
        executeAsync("""
            INSERT INTO deaths (uuid, player_name, cause, death_message, killer_uuid, killer_name,
            killer_type, world, x, y, z, timestamp, date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, uuid, name, cause, deathMessage, killerUuid, killerName, killerType,
                world, x, y, z, now, date);
    }

    public void recordMobKill(String uuid, String name, String mobType, String world) {
        String now = LocalDateTime.now().format(DT_FMT);
        String date = LocalDate.now().format(D_FMT);
        executeAsync("INSERT INTO mob_kills (uuid, player_name, mob_type, world, timestamp, date) VALUES (?, ?, ?, ?, ?, ?)",
                uuid, name, mobType, world, now, date);
    }

    public void recordPvpKill(String killerUuid, String killerName, String victimUuid,
                              String victimName, String weapon) {
        String now = LocalDateTime.now().format(DT_FMT);
        String date = LocalDate.now().format(D_FMT);
        executeAsync("""
            INSERT INTO pvp_kills (killer_uuid, killer_name, victim_uuid, victim_name, weapon, timestamp, date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, killerUuid, killerName, victimUuid, victimName, weapon, now, date);
    }

    public void recordDamage(String uuid, String name, double dealt, double taken, String cause) {
        String now = LocalDateTime.now().format(DT_FMT);
        String date = LocalDate.now().format(D_FMT);
        executeAsync("""
            INSERT INTO damage_stats (uuid, player_name, damage_dealt, damage_taken, cause, timestamp, date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, uuid, name, dealt, taken, cause, now, date);
    }

    public void recordKillStreak(String uuid, String name, int streak) {
        String now = LocalDateTime.now().format(DT_FMT);
        String date = LocalDate.now().format(D_FMT);
        executeAsync("INSERT INTO kill_streaks (uuid, player_name, streak, ended_at, date) VALUES (?, ?, ?, ?, ?)",
                uuid, name, streak, now, date);
    }

    // ============================================
    //  Blocks (Batched)
    // ============================================

    public void queueBlockBreak(String uuid, String name, String blockType) {
        String date = LocalDate.now().format(D_FMT);
        blockBreakQueue.add(new Object[]{uuid, name, blockType, date});
        if (blockBreakQueue.size() >= config.getBatchSize()) {
            flushBlockBreaks();
        }
    }

    public void queueBlockPlace(String uuid, String name, String blockType) {
        String date = LocalDate.now().format(D_FMT);
        blockPlaceQueue.add(new Object[]{uuid, name, blockType, date});
        if (blockPlaceQueue.size() >= config.getBatchSize()) {
            flushBlockPlaces();
        }
    }

    private void flushBlockBreaks() {
        List<Object[]> batch = new ArrayList<>();
        Object[] item;
        while ((item = blockBreakQueue.poll()) != null) {
            batch.add(item);
        }
        if (batch.isEmpty()) return;

        executor.submit(() -> {
            try (Connection conn = dataSource.getConnection()) {
                conn.setAutoCommit(false);
                try (PreparedStatement ps = conn.prepareStatement(
                        "INSERT INTO blocks_broken (uuid, player_name, block_type, date) VALUES (?, ?, ?, ?)")) {
                    for (Object[] row : batch) {
                        setParams(ps, row);
                        ps.addBatch();
                    }
                    ps.executeBatch();
                    conn.commit();
                } catch (SQLException e) {
                    conn.rollback();
                    throw e;
                } finally {
                    conn.setAutoCommit(true);
                }
            } catch (SQLException e) {
                logger.log(Level.WARNING, "Error flushing block breaks", e);
            }
        });
    }

    private void flushBlockPlaces() {
        List<Object[]> batch = new ArrayList<>();
        Object[] item;
        while ((item = blockPlaceQueue.poll()) != null) {
            batch.add(item);
        }
        if (batch.isEmpty()) return;

        executor.submit(() -> {
            try (Connection conn = dataSource.getConnection()) {
                conn.setAutoCommit(false);
                try (PreparedStatement ps = conn.prepareStatement(
                        "INSERT INTO blocks_placed (uuid, player_name, block_type, date) VALUES (?, ?, ?, ?)")) {
                    for (Object[] row : batch) {
                        setParams(ps, row);
                        ps.addBatch();
                    }
                    ps.executeBatch();
                    conn.commit();
                } catch (SQLException e) {
                    conn.rollback();
                    throw e;
                } finally {
                    conn.setAutoCommit(true);
                }
            } catch (SQLException e) {
                logger.log(Level.WARNING, "Error flushing block places", e);
            }
        });
    }

    public void flushBatches() {
        flushBlockBreaks();
        flushBlockPlaces();
        flushMovement();
    }

    // ============================================
    //  Items
    // ============================================

    public void recordItemCrafted(String uuid, String name, String itemType, int amount) {
        String now = LocalDateTime.now().format(DT_FMT);
        String date = LocalDate.now().format(D_FMT);
        executeAsync("INSERT INTO items_crafted (uuid, player_name, item_type, amount, timestamp, date) VALUES (?, ?, ?, ?, ?, ?)",
                uuid, name, itemType, amount, now, date);
    }

    public void recordItemPickup(String uuid, String name, String itemType, int amount) {
        String now = LocalDateTime.now().format(DT_FMT);
        String date = LocalDate.now().format(D_FMT);
        executeAsync("INSERT INTO items_picked_up (uuid, player_name, item_type, amount, timestamp, date) VALUES (?, ?, ?, ?, ?, ?)",
                uuid, name, itemType, amount, now, date);
    }

    public void recordItemDrop(String uuid, String name, String itemType, int amount) {
        String now = LocalDateTime.now().format(DT_FMT);
        String date = LocalDate.now().format(D_FMT);
        executeAsync("INSERT INTO items_dropped (uuid, player_name, item_type, amount, timestamp, date) VALUES (?, ?, ?, ?, ?, ?)",
                uuid, name, itemType, amount, now, date);
    }

    public void recordItemConsumed(String uuid, String name, String itemType) {
        String now = LocalDateTime.now().format(DT_FMT);
        String date = LocalDate.now().format(D_FMT);
        executeAsync("INSERT INTO items_consumed (uuid, player_name, item_type, amount, timestamp, date) VALUES (?, ?, ?, ?, ?, ?)",
                uuid, name, itemType, 1, now, date);
    }

    // ============================================
    //  Advancements & XP
    // ============================================

    public void recordAdvancement(String uuid, String name, String advancement) {
        String now = LocalDateTime.now().format(DT_FMT);
        String date = LocalDate.now().format(D_FMT);
        executeAsync("INSERT INTO advancements (uuid, player_name, advancement, timestamp, date) VALUES (?, ?, ?, ?, ?)",
                uuid, name, advancement, now, date);
    }

    public void recordXpGain(String uuid, String name, int amount) {
        String now = LocalDateTime.now().format(DT_FMT);
        String date = LocalDate.now().format(D_FMT);
        executeAsync("INSERT INTO xp_gained (uuid, player_name, amount, timestamp, date) VALUES (?, ?, ?, ?, ?)",
                uuid, name, amount, now, date);
    }

    public void recordEnchantment(String uuid, String name, String item, String enchantment, int level) {
        String now = LocalDateTime.now().format(DT_FMT);
        String date = LocalDate.now().format(D_FMT);
        executeAsync("INSERT INTO enchantments (uuid, player_name, item, enchantment, level, timestamp, date) VALUES (?, ?, ?, ?, ?, ?, ?)",
                uuid, name, item, enchantment, level, now, date);
    }

    // ============================================
    //  Movement (Batched)
    // ============================================

    public void queueMovement(String uuid, String name, double walked, double sprinted,
                              double flown, double swum, double ridden) {
        String date = LocalDate.now().format(D_FMT);
        movementQueue.add(new Object[]{uuid, name, walked, sprinted, flown, swum, ridden, date});
        if (movementQueue.size() >= config.getBatchSize()) {
            flushMovement();
        }
    }

    private void flushMovement() {
        List<Object[]> batch = new ArrayList<>();
        Object[] item;
        while ((item = movementQueue.poll()) != null) {
            batch.add(item);
        }
        if (batch.isEmpty()) return;

        // Aggregate by uuid+date
        Map<String, double[]> aggregated = new HashMap<>();
        Map<String, String> names = new HashMap<>();
        for (Object[] row : batch) {
            String key = row[0] + "|" + row[7];
            names.put(key, (String) row[1]);
            double[] vals = aggregated.computeIfAbsent(key, k -> new double[5]);
            vals[0] += (double) row[2]; // walked
            vals[1] += (double) row[3]; // sprinted
            vals[2] += (double) row[4]; // flown
            vals[3] += (double) row[5]; // swum
            vals[4] += (double) row[6]; // ridden
        }

        executor.submit(() -> {
            try (Connection conn = dataSource.getConnection()) {
                conn.setAutoCommit(false);
                try (PreparedStatement ps = conn.prepareStatement("""
                    INSERT INTO movement (uuid, player_name, distance_walked, distance_sprinted,
                    distance_flown, distance_swum, distance_ridden, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """)) {
                    for (var entry : aggregated.entrySet()) {
                        String[] parts = entry.getKey().split("\\|");
                        double[] vals = entry.getValue();
                        ps.setString(1, parts[0]);
                        ps.setString(2, names.get(entry.getKey()));
                        ps.setDouble(3, vals[0]);
                        ps.setDouble(4, vals[1]);
                        ps.setDouble(5, vals[2]);
                        ps.setDouble(6, vals[3]);
                        ps.setDouble(7, vals[4]);
                        ps.setString(8, parts[1]);
                        ps.addBatch();
                    }
                    ps.executeBatch();
                    conn.commit();
                } catch (SQLException e) {
                    conn.rollback();
                    throw e;
                } finally {
                    conn.setAutoCommit(true);
                }
            } catch (SQLException e) {
                logger.log(Level.WARNING, "Error flushing movement data", e);
            }
        });
    }

    // ============================================
    //  Exploration
    // ============================================

    public void recordChunkVisit(String uuid, String name, String world, int chunkX, int chunkZ) {
        String now = LocalDateTime.now().format(DT_FMT);
        String date = LocalDate.now().format(D_FMT);
        executeAsync("""
            INSERT OR IGNORE INTO chunk_exploration (uuid, player_name, world, chunk_x, chunk_z, first_visit, date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, uuid, name, world, chunkX, chunkZ, now, date);
    }

    public void recordPortalUsage(String uuid, String name, String portalType) {
        String now = LocalDateTime.now().format(DT_FMT);
        String date = LocalDate.now().format(D_FMT);
        executeAsync("INSERT INTO portal_usage (uuid, player_name, portal_type, timestamp, date) VALUES (?, ?, ?, ?, ?)",
                uuid, name, portalType, now, date);
    }

    public void recordBiomeVisit(String uuid, String name, String biome) {
        String now = LocalDateTime.now().format(DT_FMT);
        executeAsync("INSERT OR IGNORE INTO biome_visits (uuid, player_name, biome, first_visit) VALUES (?, ?, ?, ?)",
                uuid, name, biome, now);
    }

    // ============================================
    //  Misc
    // ============================================

    public void recordVillagerTrade(String uuid, String name, String itemBought, String itemSold) {
        String now = LocalDateTime.now().format(DT_FMT);
        String date = LocalDate.now().format(D_FMT);
        executeAsync("INSERT INTO villager_trades (uuid, player_name, item_bought, item_sold, timestamp, date) VALUES (?, ?, ?, ?, ?, ?)",
                uuid, name, itemBought, itemSold, now, date);
    }

    public void recordFishing(String uuid, String name, String catchType) {
        String now = LocalDateTime.now().format(DT_FMT);
        String date = LocalDate.now().format(D_FMT);
        executeAsync("INSERT INTO fishing (uuid, player_name, catch_type, timestamp, date) VALUES (?, ?, ?, ?, ?)",
                uuid, name, catchType, now, date);
    }

    public void recordAnimalTame(String uuid, String name, String animalType) {
        String now = LocalDateTime.now().format(DT_FMT);
        String date = LocalDate.now().format(D_FMT);
        executeAsync("INSERT INTO animal_taming (uuid, player_name, animal_type, timestamp, date) VALUES (?, ?, ?, ?, ?)",
                uuid, name, animalType, now, date);
    }

    public void recordAnimalBreed(String uuid, String name, String animalType) {
        String now = LocalDateTime.now().format(DT_FMT);
        String date = LocalDate.now().format(D_FMT);
        executeAsync("INSERT INTO animal_breeding (uuid, player_name, animal_type, timestamp, date) VALUES (?, ?, ?, ?, ?)",
                uuid, name, animalType, now, date);
    }

    public void recordRedstoneActivation(String uuid, String name, String blockType) {
        String now = LocalDateTime.now().format(DT_FMT);
        String date = LocalDate.now().format(D_FMT);
        executeAsync("INSERT INTO redstone_activations (uuid, player_name, block_type, timestamp, date) VALUES (?, ?, ?, ?, ?)",
                uuid, name, blockType, now, date);
    }

    public void recordTntIgnition(String uuid, String name) {
        String now = LocalDateTime.now().format(DT_FMT);
        String date = LocalDate.now().format(D_FMT);
        executeAsync("INSERT INTO tnt_ignitions (uuid, player_name, timestamp, date) VALUES (?, ?, ?, ?)",
                uuid, name, now, date);
    }

    public void recordBedUsage(String uuid, String name) {
        String now = LocalDateTime.now().format(DT_FMT);
        String date = LocalDate.now().format(D_FMT);
        executeAsync("INSERT INTO bed_usage (uuid, player_name, timestamp, date) VALUES (?, ?, ?, ?)",
                uuid, name, now, date);
    }

    public void recordPetDeath(String ownerUuid, String ownerName, String petType, String petName, String cause) {
        String now = LocalDateTime.now().format(DT_FMT);
        String date = LocalDate.now().format(D_FMT);
        executeAsync("INSERT INTO pet_deaths (owner_uuid, owner_name, pet_type, pet_name, cause, timestamp, date) VALUES (?, ?, ?, ?, ?, ?, ?)",
                ownerUuid, ownerName, petType, petName, cause, now, date);
    }

    // ============================================
    //  Cleanup
    // ============================================

    public void cleanupOldData() {
        int days = config.getDataRetentionDays();
        String cutoff = LocalDate.now().minusDays(days).format(D_FMT);
        String[] tables = {
                "sessions", "chat_messages", "commands_executed", "deaths", "mob_kills",
                "pvp_kills", "damage_stats", "blocks_broken", "blocks_placed", "items_crafted",
                "advancements", "xp_gained", "enchantments", "movement", "chunk_exploration",
                "portal_usage", "items_picked_up", "items_dropped", "items_consumed",
                "villager_trades", "fishing", "animal_taming", "animal_breeding",
                "redstone_activations", "tnt_ignitions", "bed_usage", "pet_deaths", "kill_streaks"
        };
        executor.submit(() -> {
            try (Connection conn = dataSource.getConnection()) {
                for (String table : tables) {
                    try (PreparedStatement ps = conn.prepareStatement(
                            "DELETE FROM " + table + " WHERE date < ?")) {
                        ps.setString(1, cutoff);
                        int deleted = ps.executeUpdate();
                        if (deleted > 0) {
                            logger.info("Cleanup: " + deleted + " old entries removed from " + table + ".");
                        }
                    }
                }
            } catch (SQLException e) {
                logger.log(Level.WARNING, "Error during cleanup of old data", e);
            }
        });
    }

    // ============================================
    //  Shutdown
    // ============================================

    public void shutdown() {
        flushBatches();
        executor.shutdown();
        flushScheduler.shutdown();
        try {
            executor.awaitTermination(10, TimeUnit.SECONDS);
            flushScheduler.awaitTermination(5, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        if (dataSource != null && !dataSource.isClosed()) {
            dataSource.close();
        }
    }
}
