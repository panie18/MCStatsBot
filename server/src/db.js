const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'data', 'mcstatsbot.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS servers (
    id TEXT PRIMARY KEY,
    api_secret TEXT NOT NULL,
    owner_discord_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    server_name TEXT DEFAULT 'Minecraft Server',
    report_time TEXT DEFAULT '22:00',
    created_at TEXT DEFAULT (datetime('now')),
    last_seen_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id TEXT NOT NULL,
    data TEXT NOT NULL,
    received_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (server_id) REFERENCES servers(id)
  );

  CREATE TABLE IF NOT EXISTS oauth_states (
    state TEXT PRIMARY KEY,
    server_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Migration: add report_sections column if missing
try {
  db.prepare("SELECT report_sections FROM servers LIMIT 1").get();
} catch {
  db.exec("ALTER TABLE servers ADD COLUMN report_sections TEXT DEFAULT 'overview,combat,mining,exploration,funfacts'");
}

// Migration: add language column if missing
try {
  db.prepare("SELECT language FROM servers LIMIT 1").get();
} catch {
  db.exec("ALTER TABLE servers ADD COLUMN language TEXT DEFAULT 'de'");
}

// Clean up old OAuth states (older than 10 minutes)
function cleanupOAuthStates() {
  db.prepare("DELETE FROM oauth_states WHERE created_at < datetime('now', '-10 minutes')").run();
}
setInterval(cleanupOAuthStates, 5 * 60 * 1000);

// Delete stats older than retention period (default 90 days) — DSGVO compliance
function cleanupOldStats() {
  const servers = db.prepare('SELECT id FROM servers').all();
  for (const server of servers) {
    db.prepare("DELETE FROM stats WHERE server_id = ? AND received_at < datetime('now', '-90 days')").run(server.id);
  }
}
cleanupOldStats(); // run once on startup
setInterval(cleanupOldStats, 24 * 60 * 60 * 1000); // then daily

module.exports = {
  // Server management
  createServer(id, apiSecret, ownerDiscordId, guildId, channelId, serverName, reportTime) {
    return db.prepare(`
      INSERT INTO servers (id, api_secret, owner_discord_id, guild_id, channel_id, server_name, report_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, apiSecret, ownerDiscordId, guildId, channelId, serverName, reportTime);
  },

  getServer(id) {
    return db.prepare('SELECT * FROM servers WHERE id = ?').get(id);
  },

  getServerBySecret(apiSecret) {
    return db.prepare('SELECT * FROM servers WHERE api_secret = ?').get(apiSecret);
  },

  updateServer(id, fields) {
    const sets = [];
    const values = [];
    for (const [key, val] of Object.entries(fields)) {
      sets.push(`${key} = ?`);
      values.push(val);
    }
    values.push(id);
    return db.prepare(`UPDATE servers SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  },

  updateLastSeen(id) {
    return db.prepare("UPDATE servers SET last_seen_at = datetime('now') WHERE id = ?").run(id);
  },

  getAllServers() {
    return db.prepare('SELECT * FROM servers').all();
  },

  deleteServer(id) {
    db.prepare('DELETE FROM stats WHERE server_id = ?').run(id);
    return db.prepare('DELETE FROM servers WHERE id = ?').run(id);
  },

  // Stats
  saveStats(serverId, data) {
    return db.prepare('INSERT INTO stats (server_id, data) VALUES (?, ?)').run(serverId, JSON.stringify(data));
  },

  getLatestStats(serverId) {
    const row = db.prepare('SELECT * FROM stats WHERE server_id = ? ORDER BY received_at DESC LIMIT 1').get(serverId);
    if (row) row.data = JSON.parse(row.data);
    return row;
  },

  // OAuth states
  createOAuthState(state, serverId) {
    return db.prepare('INSERT INTO oauth_states (state, server_id) VALUES (?, ?)').run(state, serverId);
  },

  getOAuthState(state) {
    return db.prepare('SELECT * FROM oauth_states WHERE state = ?').get(state);
  },

  deleteOAuthState(state) {
    return db.prepare('DELETE FROM oauth_states WHERE state = ?').run(state);
  },

  close() {
    db.close();
  }
};
