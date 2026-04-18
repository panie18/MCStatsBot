const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    // Security events: auth failures, invalid secrets, anomalies
    new transports.File({
      filename: path.join(logDir, 'security.log'),
      level: 'warn',
      maxsize: 5 * 1024 * 1024, // 5 MB
      maxFiles: 10,
      tailable: true
    }),
    // All events
    new transports.File({
      filename: path.join(logDir, 'app.log'),
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 5,
      tailable: true
    }),
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(format.colorize(), format.simple())
  }));
}

// Mask sensitive fields before logging
function maskIp(ip) {
  if (!ip) return 'unknown';
  // For IPv4, mask last octet. For IPv6, mask last 4 groups.
  return ip.replace(/(\d+\.\d+\.\d+\.)\d+/, '$1***')
           .replace(/([\da-f:]+:[\da-f:]+):[:\da-f]+$/i, '$1:***');
}

function securityEvent(type, req, extra = {}) {
  logger.warn({
    event: type,
    ip: maskIp(req.ip),
    ua: (req.headers['user-agent'] || '').slice(0, 200),
    path: req.path,
    ...extra
  });
}

module.exports = { logger, securityEvent };
