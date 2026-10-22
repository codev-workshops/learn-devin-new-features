const { createTestContext } = require('./helpers');

describe('reports', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
  });

  test('approved hours by user for a manager team', async () => {
    const res = await (await ctx.as('mia.manager@acme.test')).get('/api/reports/hours?from=2026-09-07&to=2026-09-27&groupBy=user');
    expect(res.status).toBe(200);
    // Three approved weeks: 38 hours per week, plus Eli's 4 overtime hours in week 2.
    expect(res.body.data.rows).toEqual([
      { key: 'eli@acme.test', label: 'Eli Employee', hours: 118 },
      { key: 'mia.manager@acme.test', label: 'Mia Manager', hours: 114 },
      { key: 'noah@acme.test', label: 'Noah Employee', hours: 114 },
    ]);
    expect(res.body.data.totalHours).toBe(346);
  });

  test('employees only get their own totals and dates are validated', async () => {
    const eli = await ctx.as('eli@acme.test');
    const res = await eli.get('/api/reports/hours?from=2026-09-07&to=2026-09-27&groupBy=user');
    expect(res.body.data.rows).toEqual([{ key: 'eli@acme.test', label: 'Eli Employee', hours: 118 }]);
    expect((await eli.get('/api/reports/hours?from=2026-09-27&to=2026-09-07')).status).toBe(400);
    expect((await eli.get('/api/reports/hours?from=2026-09-07')).status).toBe(400);
  });
});

describe('payroll exports', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
  });

  test('admins queue exports idempotently', async () => {
    const admin = await ctx.as('ava.admin@acme.test');
    const body = { periodStart: '2026-09-01', periodEnd: '2026-09-30' };
    const first = await admin.post('/api/payroll-exports').send(body);
    expect(first.status).toBe(202);
    expect(first.body.data).toMatchObject({ status: 'queued', attempts: 0, idempotencyKey: '2026-09-01_2026-09-30' });
    const second = await admin.post('/api/payroll-exports').send(body);
    expect(second.status).toBe(200);
    expect(second.body.data.id).toBe(first.body.data.id);
    expect((await admin.get(`/api/payroll-exports/${first.body.data.id}`)).body.data.periodEnd).toBe('2026-09-30');
    expect((await admin.get('/api/payroll-exports')).body.data).toHaveLength(1);
  });

  test('rejects invalid periods, non-admins and other tenants', async () => {
    const admin = await ctx.as('ava.admin@acme.test');
    expect((await admin.post('/api/payroll-exports').send({ periodStart: '2026-09-30', periodEnd: '2026-09-01' })).status).toBe(400);
    expect((await admin.post('/api/payroll-exports').send({ periodStart: '2026-08-01', periodEnd: '2026-09-30' })).status).toBe(400);
    expect((await (await ctx.as('mia.manager@acme.test')).get('/api/payroll-exports')).status).toBe(403);
    const created = await admin.post('/api/payroll-exports').set('Idempotency-Key', 'oct-run-1').send({ periodStart: '2026-10-01', periodEnd: '2026-10-31' });
    expect((await (await ctx.as('gus.admin@globex.test')).get(`/api/payroll-exports/${created.body.data.id}`)).status).toBe(404);
  });
});
