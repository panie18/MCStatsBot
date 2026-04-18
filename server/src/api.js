const express = require('express');
const crypto = require('crypto');
const db = require('./db');
const bot = require('./bot');
const { securityEvent, logger } = require('./logger');

const router = express.Router();

// Middleware: authenticate plugin requests via X-API-Secret
function requireApiSecret(req, res, next) {
  const secret = req.headers['x-api-secret'];
  if (!secret || typeof secret !== 'string' || secret.length > 128) {
    securityEvent('API_MISSING_SECRET', req);
    return res.status(401).json({ error: 'X-API-Secret header required' });
  }
  const server = db.getServerBySecret(secret);
  if (!server) {
    securityEvent('API_INVALID_SECRET', req, { secretPrefix: secret.slice(0, 8) });
    return res.status(401).json({ error: 'Invalid API secret' });
  }
  req.mcServer = server;
  next();
}

// POST /api/register
// Plugin registers itself and gets an API secret + setup URL
router.post('/register', (req, res) => {
  const { server_id, server_name } = req.body;
  if (!server_id) return res.status(400).json({ error: 'server_id fehlt' });

  // Check if already registered
  const existing = db.getServer(server_id);
  if (existing) {
    // Return existing config (without exposing full secret)
    return res.json({
      registered: true,
      setup_complete: !!existing.guild_id && existing.guild_id !== '',
      setup_url: `https://auth.mcstatsbot.tech/setup?server_id=${server_id}`,
      api_secret: existing.api_secret
    });
  }

  // Create new server entry
  const apiSecret = crypto.randomBytes(32).toString('hex');
  db.createServer(server_id, apiSecret, '', '', '', server_name || 'Minecraft Server', '22:00');

  res.json({
    registered: true,
    setup_complete: false,
    setup_url: `https://auth.mcstatsbot.tech/setup?server_id=${server_id}`,
    api_secret: apiSecret
  });
});

// GET /api/status
router.get('/status', requireApiSecret, (req, res) => {
  const server = req.mcServer;
  db.updateLastSeen(server.id);

  res.json({
    server_id: server.id,
    setup_complete: !!server.channel_id && server.channel_id !== '',
    guild_id: server.guild_id,
    channel_id: server.channel_id,
    report_time: server.report_time,
    server_name: server.server_name,
    report_sections: server.report_sections || 'overview,combat,mining,exploration,funfacts'
  });
});

// POST /api/stats
router.post('/stats', requireApiSecret, (req, res) => {
  const server = req.mcServer;

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Keine Daten gesendet' });
  }

  // Validate payload size (max 500KB JSON)
  const bodyStr = JSON.stringify(req.body);
  if (bodyStr.length > 512000) {
    return res.status(413).json({ error: 'Payload zu gross (max 500KB)' });
  }

  // Sanitize: strip any HTML/script from string values recursively
  function sanitize(obj) {
    if (typeof obj === 'string') return obj.replace(/<[^>]*>/g, '').slice(0, 1000);
    if (Array.isArray(obj)) return obj.slice(0, 200).map(sanitize);
    if (obj && typeof obj === 'object') {
      const clean = {};
      const keys = Object.keys(obj).slice(0, 100);
      for (const k of keys) clean[k.slice(0, 64)] = sanitize(obj[k]);
      return clean;
    }
    return obj;
  }

  db.updateLastSeen(server.id);
  db.saveStats(server.id, sanitize(req.body));

  res.json({ success: true });
});

// POST /api/report
router.post('/report', requireApiSecret, async (req, res) => {
  const server = req.mcServer;

  if (!server.channel_id) {
    return res.status(400).json({ error: 'Setup nicht abgeschlossen' });
  }

  try {
    await bot.sendReport(server.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/server-info?server_id=xxx
// Public endpoint to check if a server is registered and configured
router.get('/server-info', (req, res) => {
  const serverId = req.query.server_id;
  if (!serverId) return res.status(400).json({ error: 'server_id fehlt' });

  const server = db.getServer(serverId);
  if (!server) return res.status(404).json({ registered: false });

  const botClient = bot.getClient();
  let guildName = null;
  let channelName = null;
  if (server.guild_id && botClient) {
    const guild = botClient.guilds.cache.get(server.guild_id);
    if (guild) {
      guildName = guild.name;
      const channel = guild.channels.cache.get(server.channel_id);
      if (channel) channelName = channel.name;
    }
  }

  res.json({
    registered: true,
    setup_complete: !!server.channel_id && server.channel_id !== '',
    server_name: server.server_name,
    guild_name: guildName,
    channel_name: channelName,
    report_time: server.report_time,
    report_sections: server.report_sections || 'overview,combat,mining,exploration,funfacts'
  });
});

// GET /api/health
// Public health endpoint for status page
router.get('/health', (req, res) => {
  const start = Date.now();

  // Database check
  let dbStatus = 'down';
  try {
    db.getServer('__health_check__'); // lightweight query
    dbStatus = 'operational';
  } catch {
    dbStatus = 'down';
  }
  const apiLatency = Date.now() - start;

  // Discord bot check
  const botClient = bot.getClient();
  let discordStatus = 'down';
  let discordPing = null;
  if (botClient && botClient.isReady()) {
    discordPing = botClient.ws.ping;
    discordStatus = discordPing > 500 ? 'degraded' : 'operational';
  }

  // Connected Minecraft servers (seen in last 10 minutes)
  const servers = db.getAllServers();
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const mcServers = servers
    .filter(s => s.channel_id && s.channel_id !== '')
    .map(s => ({
      name: s.server_name || 'Minecraft Server',
      status: s.last_seen_at && s.last_seen_at > tenMinAgo ? 'operational' : 'down',
      last_seen: s.last_seen_at
    }));

  res.json({
    services: {
      api: { status: 'operational', latency: apiLatency },
      discord_bot: { status: discordStatus, ping: discordPing },
      database: { status: dbStatus }
    },
    minecraft_servers: mcServers,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
