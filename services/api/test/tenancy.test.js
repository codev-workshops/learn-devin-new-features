const { createTestContext } = require('./helpers');

describe('tenant isolation and role scoping', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
  });

  test('employees only see their own entries', async () => {
    const res = await (await ctx.as('eli@acme.test')).get('/api/timesheets');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(new Set(res.body.data.map((entry) => entry.userName))).toEqual(new Set(['Eli Employee']));
  });

  test('managers see themselves and direct reports only', async () => {
    const res = await (await ctx.as('mia.manager@acme.test')).get('/api/timesheets');
    expect(new Set(res.body.data.map((entry) => entry.userName))).toEqual(
      new Set(['Mia Manager', 'Eli Employee', 'Noah Employee']),
    );
  });

  test('admins never see another tenant', async () => {
    const res = await (await ctx.as('gus.admin@globex.test')).get('/api/timesheets');
    expect(res.body.data.every((entry) => entry.projectCode.startsWith('GLX-'))).toBe(true);
  });

  test('cross-tenant entry ids return 404', async () => {
    const acmeEntries = await (await ctx.as('eli@acme.test')).get('/api/timesheets?status=draft');
    const draftId = acmeEntries.body.data[0].id;
    const globex = await ctx.as('omar@globex.test');
    expect((await globex.patch(`/api/timesheets/${draftId}`).send({ hours: 1 })).status).toBe(404);
    expect((await globex.delete(`/api/timesheets/${draftId}`)).status).toBe(404);
    expect((await (await ctx.as('gia.manager@globex.test')).post(`/api/timesheets/${draftId}/approve`).send({})).status).toBe(404);
  });

  test('employees cannot query other users', async () => {
    const mia = await (await ctx.as('mia.manager@acme.test')).get('/api/me');
    const res = await (await ctx.as('eli@acme.test')).get(`/api/timesheets?userId=${mia.body.data.id}`);
    expect(res.status).toBe(403);
  });

  test('projects are tenant scoped and admin-only to create', async () => {
    const eli = await ctx.as('eli@acme.test');
    const projects = await eli.get('/api/projects');
    expect(projects.body.data.map((project) => project.code)).toEqual(['ACM-INT', 'ACM-OPS', 'ACM-WMS']);
    expect((await eli.post('/api/projects').send({ code: 'ACM-NEW', name: 'New' })).status).toBe(403);
    const admin = await ctx.as('ava.admin@acme.test');
    expect((await admin.post('/api/projects').send({ code: 'acm-new', name: 'New project' })).status).toBe(201);
    expect((await admin.post('/api/projects').send({ code: 'ACM-NEW', name: 'Duplicate' })).status).toBe(409);
  });
});
