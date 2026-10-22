const { createTestContext } = require('./helpers');
const { loadConfig } = require('../src/config');

describe('review hardening', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
  });

  test('reusing an Idempotency-Key for another period is a conflict', async () => {
    const ava = await ctx.as('ava.admin@acme.test');
    const first = await ava.post('/api/payroll-exports').set('Idempotency-Key', 'reuse-1').send({ periodStart: '2026-08-01', periodEnd: '2026-08-31' });
    expect(first.status).toBe(202);
    const again = await ava.post('/api/payroll-exports').set('Idempotency-Key', 'reuse-1').send({ periodStart: '2026-08-01', periodEnd: '2026-08-31' });
    expect(again.status).toBe(200);
    const other = await ava.post('/api/payroll-exports').set('Idempotency-Key', 'reuse-1').send({ periodStart: '2026-07-01', periodEnd: '2026-07-31' });
    expect(other.status).toBe(409);
  });

  test('a second review of the same entry is rejected', async () => {
    const eli = await ctx.as('eli@acme.test');
    const mia = await ctx.as('mia.manager@acme.test');
    const created = await eli.post('/api/timesheets').send({ projectId: 1, workDate: '2026-10-07', hours: 4, description: 'race' });
    expect(created.status).toBe(201);
    await eli.post(`/api/timesheets/${created.body.data.id}/submit`).send();
    expect((await mia.post(`/api/timesheets/${created.body.data.id}/approve`).send({})).status).toBe(200);
    expect((await mia.post(`/api/timesheets/${created.body.data.id}/reject`).send({ note: 'too late' })).status).toBe(409);
  });

  test('production refuses the development JWT secret and disables demo login', () => {
    expect(() => loadConfig({ NODE_ENV: 'production', JWT_SECRET: 'change-me-local-only' })).toThrow();
    expect(loadConfig({ NODE_ENV: 'production', JWT_SECRET: 'x'.repeat(32) }).demoLogin).toBe(false);
    expect(loadConfig({}).demoLogin).toBe(true);
  });
});
