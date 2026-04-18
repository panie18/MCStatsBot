'use strict';
require('dotenv').config();

// Fail fast if critical env vars are missing
const REQUIRED_ENV = ['DISCORD_BOT_TOKEN', 'DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'SESSION_SECRET'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[FATAL] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}
if (process.env.SESSION_SECRET.length < 32) {
  console.error('[FATAL] SESSION_SECRET must be at least 32 characters. Run: openssl rand -hex 32');
  process.exit(1);
}

const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const bot = require('./bot');
const authRouter = require('./auth');
const apiRouter = require('./api');
const { logger, securityEvent } = require('./logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust only Cloudflare proxy (1 hop)
app.set('trust proxy', 1);

// Ensure directories exist
const dataDir = path.join(__dirname, '..', 'data');
const logsDir = path.join(__dirname, '..', 'logs');
for (const dir of [dataDir, logsDir]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ── Security Headers ──────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "https://cdn.discordapp.com", "data:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    }
  },
  crossOriginEmbedderPolicy: false, // Discord CDN images
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  next();
});

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    securityEvent('RATE_LIMIT_GENERAL', req);
    res.status(429).json({ error: 'Too many requests' });
  }
});

// Strict limiter for auth (Discord OAuth flow)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    securityEvent('RATE_LIMIT_AUTH', req);
    res.status(429).json({ error: 'Too many requests' });
  }
});

// API limiter (plugin calls)
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    securityEvent('RATE_LIMIT_API', req);
    res.status(429).json({ error: 'Too many requests' });
  }
});

app.use(generalLimiter);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '512kb' }));
app.use(cookieParser(process.env.SESSION_SECRET));

// Assign request ID for log correlation
app.use((req, res, next) => {
  req.id = require('crypto').randomBytes(8).toString('hex');
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Request logging (no sensitive data)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      logger.info({
        reqId: req.id,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        ms: Date.now() - start,
        ip: (req.ip || '').replace(/(\d+\.\d+\.\d+\.)\d+/, '$1***').replace(/([\da-f:]+:[\da-f:]+):[:\da-f]+$/i, '$1:***')
      });
    }
  });
  next();
});

// ── Static Files ──────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'public'), {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.includes('/assets/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    // Never cache HTML
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store');
    }
  }
}));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/auth', authLimiter, authRouter);
app.use('/api', apiLimiter, apiRouter);

// Invite URL
app.get('/auth/invite-url', (req, res) => {
  res.json({ url: bot.getInviteUrl() });
});

// Plugin update endpoints
const PLUGIN_VERSION = '1.0.0';
const PLUGIN_JAR = path.join(__dirname, '..', 'public', 'downloads', 'MCStatsBot-' + PLUGIN_VERSION + '.jar');

app.get('/api/update/check', (req, res) => {
  res.json({ version: PLUGIN_VERSION });
});

app.get('/api/update/download', (req, res) => {
  if (!fs.existsSync(PLUGIN_JAR)) return res.status(404).json({ error: 'JAR not available' });
  res.download(PLUGIN_JAR, `MCStatsBot-${PLUGIN_VERSION}.jar`);
});

// security.txt (RFC 9116)
app.get('/.well-known/security.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send([
    'Contact: mailto:security@mcstatsbot.tech',
    'Expires: 2027-01-01T00:00:00.000Z',
    'Preferred-Languages: de, en',
    'Policy: https://auth.mcstatsbot.tech/privacy',
  ].join('\n'));
});

// SPA catch-all
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  logger.error({ event: 'UNHANDLED_ERROR', error: err.message, path: req.path });
  res.status(500).json({ error: 'Internal server error' });
});

// ── Report Scheduler ──────────────────────────────────────────────────────────
function scheduleReports() {
  setInterval(() => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    for (const server of db.getAllServers()) {
      if (server.report_time === currentTime && server.channel_id) {
        bot.sendReport(server.id);
      }
    }
  }, 60 * 1000);
}

// ── Start ─────────────────────────────────────────────────────────────────────
async function main() {
  logger.info('[Server] MCStatsBot starting...');

  try {
    await bot.start();
    logger.info('[Server] Discord bot started');
  } catch (e) {
    logger.error(`[Server] Failed to start Discord bot: ${e.message}`);
    process.exit(1);
  }

  scheduleReports();
  logger.info('[Server] Report scheduler started');

  app.listen(PORT, '127.0.0.1', () => {
    logger.info(`[Server] Listening on 127.0.0.1:${PORT}`);
  });
}

main().catch(e => {
  logger.error(`[Server] Fatal error: ${e.message}`);
  process.exit(1);
});

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
process.on('SIGINT', () => {
  logger.info('[Server] Shutting down...');
  db.close();
  process.exit(0);
});
process.on('SIGTERM', () => {
  logger.info('[Server] Shutting down (SIGTERM)...');
  db.close();
  process.exit(0);
});
process.on('uncaughtException', (err) => {
  logger.error({ event: 'UNCAUGHT_EXCEPTION', error: err.message, stack: err.stack });
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logger.error({ event: 'UNHANDLED_REJECTION', reason: String(reason) });
});
