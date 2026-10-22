const DEV_SECRET = 'change-me-local-only';

function loadConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';
  const jwtSecret = env.JWT_SECRET || (nodeEnv === 'production' ? '' : DEV_SECRET);
  if (!jwtSecret) {
    throw new Error('JWT_SECRET must be set in production');
  }
  return {
    nodeEnv,
    port: Number(env.API_PORT || 3001),
    databaseUrl: env.DATABASE_URL || 'postgres://ldnf:ldnf@localhost:5432/ldnf',
    jwtSecret,
    jwtExpiresIn: env.JWT_EXPIRES_IN || '8h',
    logLevel: env.LOG_LEVEL || 'info',
  };
}

module.exports = { loadConfig };
