const { loadConfig } = require('./config');
const { createLogger } = require('./logger');
const { createPool } = require('./db/pool');
const { createApp } = require('./app');

const config = loadConfig();
const logger = createLogger(config.logLevel);
const pool = createPool(config.databaseUrl);
const app = createApp({ db: pool, config, logger });

const server = app.listen(config.port, () => logger.info({ port: config.port }, 'API listening'));

function shutdown(signal) {
  logger.info({ signal }, 'Shutting down');
  server.close(() => pool.end().finally(() => process.exit(0)));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
