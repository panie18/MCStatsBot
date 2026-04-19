const express = require('express');
const crypto = require('crypto');
const db = require('./db');
const bot = require('./bot');
const { securityEvent, logger } = require('./logger');

const router = express.Router();

// GET /auth/login?server_id=xxx
router.get('/login', (req, res) => {
  const serverId = req.query.server_id;

  // Validate server_id format (alphanumeric/hyphens only, max 64 chars)
  if (!serverId || !/^[\w-]{1,64}$/.test(serverId)) {
    securityEvent('AUTH_LOGIN_INVALID_PARAM', req, { server_id: serverId?.slice(0, 64) });
    return res.status(400).json({ error: 'Invalid server_id' });
  }

  const server = db.getServer(serverId);
  if (!server) {
    securityEvent('AUTH_LOGIN_UNKNOWN_SERVER', req, { server_id: serverId });
    return res.status(404).json({ error: 'Server not found. Start the Minecraft plugin first.' });
  }

  const state = crypto.randomBytes(32).toString('hex');
  db.createOAuthState(state, serverId);

  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: `${process.env.BASE_URL}/auth/callback`,
    response_type: 'code',
    scope: 'identify guilds',
    state: state,
    prompt: 'none'
  });

  res.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
});

// GET /auth/callback
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
    securityEvent('AUTH_CALLBACK_MISSING_PARAMS', req);
    return res.redirect('/setup/error?msg=OAuth failed');
  }

  // State must be exactly 64 hex chars
  if (!/^[0-9a-f]{64}$/.test(state)) {
    securityEvent('AUTH_CALLBACK_INVALID_STATE_FORMAT', req);
    return res.redirect('/setup/error?msg=Invalid state');
  }

  const oauthState = db.getOAuthState(state);
  if (!oauthState) {
    securityEvent('AUTH_CALLBACK_INVALID_STATE', req);
    return res.redirect('/setup/error?msg=Invalid or expired state');
  }

  db.deleteOAuthState(state);
  const serverId = oauthState.server_id;

  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${process.env.BASE_URL}/auth/callback`
      })
    });

    if (!tokenRes.ok) {
      securityEvent('AUTH_CALLBACK_TOKEN_EXCHANGE_FAILED', req, { status: tokenRes.status });
      return res.redirect('/setup/error?msg=Token exchange failed');
    }

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      securityEvent('AUTH_CALLBACK_NO_TOKEN', req);
      return res.redirect('/setup/error?msg=Token exchange failed');
    }

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    if (!userRes.ok) {
      securityEvent('AUTH_CALLBACK_USER_FETCH_FAILED', req, { status: userRes.status });
      return res.redirect('/setup/error?msg=User fetch failed');
    }
    const user = await userRes.json();

    const sessionData = {
      serverId,
      userId: user.id,
      username: user.username,
      accessToken: tokenData.access_token
    };

    // __Host- prefix: forces Secure, no Domain attribute, Path=/ — prevents subdomain attacks
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 3600000,
      signed: true
    };

    res.cookie('__Host-mcstats', JSON.stringify(sessionData), cookieOptions);
    logger.info({ event: 'AUTH_SUCCESS', userId: user.id, serverId });
    res.redirect(`/setup/configure?server_id=${encodeURIComponent(serverId)}`);
  } catch (e) {
    logger.error({ event: 'AUTH_CALLBACK_ERROR', error: e.message });
    res.redirect('/setup/error?msg=Internal error');
  }
});

// GET /auth/guilds
router.get('/guilds', async (req, res) => {
  try {
    const session = JSON.parse(req.signedCookies['__Host-mcstats'] || 'null');
    if (!session?.accessToken || !session?.userId) {
      securityEvent('AUTH_GUILDS_UNAUTHORIZED', req);
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const guildsRes = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: { Authorization: `Bearer ${session.accessToken}` }
    });

    if (!guildsRes.ok) {
      securityEvent('AUTH_GUILDS_DISCORD_ERROR', req, { status: guildsRes.status });
      return res.status(guildsRes.status === 401 ? 401 : 502).json({ error: 'Discord API error' });
    }

    const userGuilds = await guildsRes.json();
    if (!Array.isArray(userGuilds)) {
      return res.status(502).json({ error: 'Invalid response from Discord' });
    }

    const botClient = bot.getClient();
    const botGuildIds = botClient ? botClient.guilds.cache.map(g => g.id) : [];

    const guilds = userGuilds
      .filter(g => (parseInt(g.permissions) & 0x20) === 0x20)
      .map(g => ({
        id: g.id,
        name: g.name,
        icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
        botPresent: botGuildIds.includes(g.id)
      }));

    res.json({ guilds });
  } catch (e) {
    logger.error({ event: 'AUTH_GUILDS_ERROR', error: e.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /auth/channels?guild_id=xxx
router.get('/channels', async (req, res) => {
  try {
    const session = JSON.parse(req.signedCookies['__Host-mcstats'] || 'null');
    if (!session?.userId) {
      securityEvent('AUTH_CHANNELS_UNAUTHORIZED', req);
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const guildId = req.query.guild_id;
    if (!guildId || !/^\d{17,20}$/.test(guildId)) {
      securityEvent('AUTH_CHANNELS_INVALID_GUILD', req, { guild_id: guildId?.slice(0, 32) });
      return res.status(400).json({ error: 'Invalid guild_id' });
    }

    const botClient = bot.getClient();
    if (!botClient) return res.status(503).json({ error: 'Bot not connected' });

    const guild = botClient.guilds.cache.get(guildId);
    if (!guild) {
      return res.status(404).json({ error: 'Bot is not in this server. Please invite it first.' });
    }

    const channels = guild.channels.cache
      .filter(c => c.type === 0)
      .map(c => ({ id: c.id, name: c.name }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({ channels });
  } catch (e) {
    logger.error({ event: 'AUTH_CHANNELS_ERROR', error: e.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// POST /auth/save
router.post('/save', (req, res) => {
  try {
    const session = JSON.parse(req.signedCookies['__Host-mcstats'] || 'null');
    if (!session?.userId || !session?.serverId) {
      securityEvent('AUTH_SAVE_UNAUTHORIZED', req);
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { guild_id, channel_id, report_time, server_name, report_sections, language } = req.body;

    // Validate Discord snowflake IDs
    if (!guild_id || !/^\d{17,20}$/.test(guild_id)) {
      securityEvent('AUTH_SAVE_INVALID_GUILD', req, { guild_id: String(guild_id).slice(0, 32) });
      return res.status(400).json({ error: 'Invalid guild_id' });
    }
    if (!channel_id || !/^\d{17,20}$/.test(channel_id)) {
      securityEvent('AUTH_SAVE_INVALID_CHANNEL', req, { channel_id: String(channel_id).slice(0, 32) });
      return res.status(400).json({ error: 'Invalid channel_id' });
    }

    // Validate report time (HH:MM)
    const safeTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(report_time) ? report_time : '22:00';

    // Validate sections whitelist
    const validSections = ['overview', 'combat', 'mining', 'exploration', 'funfacts'];
    let sections = 'overview,combat,mining,exploration,funfacts';
    if (report_sections && typeof report_sections === 'string') {
      const filtered = report_sections.split(',').filter(s => validSections.includes(s.trim()));
      if (!filtered.includes('overview')) filtered.unshift('overview');
      sections = filtered.join(',');
    }

    // Validate language
    const safeLang = ['de', 'en'].includes(language) ? language : 'en';

    db.updateServer(session.serverId, {
      owner_discord_id: session.userId,
      guild_id,
      channel_id,
      report_time: safeTime,
      server_name: server_name ? String(server_name).slice(0, 64).replace(/[<>"]/g, '') : 'Minecraft Server',
      report_sections: sections,
      language: safeLang
    });

    logger.info({ event: 'SERVER_CONFIGURED', userId: session.userId, serverId: session.serverId, guild_id });
    res.json({ success: true });
  } catch (e) {
    logger.error({ event: 'AUTH_SAVE_ERROR', error: e.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

module.exports = router;
