const DEV_SECRET = 'change-me-local-only';

function loadConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';
  const jwtSecret = env.JWT_SECRET || (nodeEnv === 'production' ? '' : DEV_SECRET);
  if (!jwtSecret) {
    throw new Error('JWT_SECRET must be set in production');
  }
  if (nodeEnv === 'production' && jwtSecret === DEV_SECRET) {
    throw new Error('JWT_SECRET must not use the published development value in production');
  }
  return {
    nodeEnv,
    port: Number(env.API_PORT || 3001),
    databaseUrl: env.DATABASE_URL || 'postgres://ldnf:ldnf@localhost:5432/ldnf',
    jwtSecret,
    demoLogin: nodeEnv !== 'production' || env.ALLOW_DEMO_LOGIN === 'true',
    jwtExpiresIn: env.JWT_EXPIRES_IN || '8h',
    logLevel: env.LOG_LEVEL || 'info',
  };
}

module.exports = { loadConfig };
