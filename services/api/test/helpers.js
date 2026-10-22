const { newDb } = require('pg-mem');
const request = require('supertest');
const pino = require('pino');
const { migrate } = require('../src/db/migrate');
const { seed } = require('../src/db/seed');
const { createApp } = require('../src/app');

const config = { jwtSecret: 'test-secret', jwtExpiresIn: '1h' };

async function createTestContext() {
  const mem = newDb();
  const { Pool } = mem.adapters.createPg();
  const db = new Pool();
  await migrate(db);
  await seed(db);
  const app = createApp({ db, config, logger: pino({ level: 'silent' }) });
  const tokens = {};
  const login = async (email) => {
    if (!tokens[email]) {
      const res = await request(app).post('/api/auth/login').send({ email });
      if (res.status !== 200) throw new Error(`Login failed for ${email}: ${res.status}`);
      tokens[email] = res.body.data.token;
    }
    return tokens[email];
  };
  const as = async (email) => {
    const token = await login(email);
    const auth = (req) => req.set('Authorization', `Bearer ${token}`);
    return {
      get: (url) => auth(request(app).get(url)),
      post: (url) => auth(request(app).post(url)),
      patch: (url) => auth(request(app).patch(url)),
      delete: (url) => auth(request(app).delete(url)),
    };
  };
  return { app, db, as };
}

module.exports = { createTestContext };
