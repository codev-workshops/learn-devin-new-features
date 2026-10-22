const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const pinoHttp = require('pino-http');
const { authenticate } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./errors');
const { authRoutes } = require('./routes/auth');
const { meRoutes } = require('./routes/me');
const { projectRoutes } = require('./routes/projects');
const { timesheetRoutes } = require('./routes/timesheets');
const { reportRoutes } = require('./routes/reports');
const { payrollExportRoutes } = require('./routes/payrollExports');

const REQUEST_ID = /^[A-Za-z0-9-]{8,64}$/;

function createApp({ db, config, logger }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const incoming = req.headers['x-request-id'];
        const id = typeof incoming === 'string' && REQUEST_ID.test(incoming) ? incoming : crypto.randomUUID();
        res.setHeader('x-request-id', id);
        return id;
      },
      customProps: (req) => ({ requestId: req.id }),
    }),
  );
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (_req, res) => res.json({ data: { status: 'ok' } }));
  app.get('/health/ready', async (_req, res) => {
    try {
      await db.query('SELECT 1');
      res.json({ data: { status: 'ready' } });
    } catch {
      res.status(503).json({ error: { code: 'not_ready', message: 'Database unavailable' } });
    }
  });

  app.use('/api/auth', authRoutes(db, config));
  app.use('/api', authenticate(db, config.jwtSecret));
  app.use('/api/me', meRoutes(db));
  app.use('/api/projects', projectRoutes(db));
  app.use('/api/timesheets', timesheetRoutes(db));
  app.use('/api/reports', reportRoutes(db));
  app.use('/api/payroll-exports', payrollExportRoutes(db));

  app.use((_req, _res, next) => next(notFound('Route not found')));
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
