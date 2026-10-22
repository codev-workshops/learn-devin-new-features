const pino = require('pino');

function createLogger(level = 'info') {
  return pino({
    level,
    base: { service: 'api' },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: ['req.headers.authorization', 'req.headers.cookie'],
  });
}

module.exports = { createLogger };
