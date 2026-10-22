const request = require('supertest');
const { createTestContext } = require('./helpers');

describe('auth', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
  });

  test('logs in a seeded user and returns tenant details', async () => {
    const res = await request(ctx.app).post('/api/auth/login').send({ email: 'ELI@acme.test' });
    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ email: 'eli@acme.test', role: 'employee', tenant: { slug: 'acme' } });
    expect(typeof res.body.data.token).toBe('string');
  });

  test('rejects unknown users and invalid bodies', async () => {
    expect((await request(ctx.app).post('/api/auth/login').send({ email: 'nobody@acme.test' })).status).toBe(401);
    const invalid = await request(ctx.app).post('/api/auth/login').send({ email: 'not-an-email' });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('validation_error');
  });

  test('requires a valid bearer token for /api routes', async () => {
    expect((await request(ctx.app).get('/api/me')).status).toBe(401);
    expect((await request(ctx.app).get('/api/me').set('Authorization', 'Bearer nope')).status).toBe(401);
    const me = await (await ctx.as('mia.manager@acme.test')).get('/api/me');
    expect(me.status).toBe(200);
    expect(me.body.data).toMatchObject({ role: 'manager', tenant: { slug: 'acme' } });
  });

  test('health endpoints and request ids', async () => {
    const res = await request(ctx.app).get('/health').set('x-request-id', 'lab-request-0001');
    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toBe('lab-request-0001');
    expect((await request(ctx.app).get('/health/ready')).body.data.status).toBe('ready');
  });
});
