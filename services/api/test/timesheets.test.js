const { createTestContext } = require('./helpers');

describe('timesheet lifecycle', () => {
  let ctx;
  let projectId;
  beforeAll(async () => {
    ctx = await createTestContext();
    projectId = (await (await ctx.as('eli@acme.test')).get('/api/projects')).body.data[0].id;
  });

  test('create, edit, submit, reject, resubmit and approve', async () => {
    const eli = await ctx.as('eli@acme.test');
    const mia = await ctx.as('mia.manager@acme.test');

    const created = await eli.post('/api/timesheets').send({ projectId, workDate: '2026-10-06', hours: 7.5, description: 'Dock audit' });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ status: 'draft', hours: 7.5, workDate: '2026-10-06' });
    const id = created.body.data.id;

    expect((await eli.patch(`/api/timesheets/${id}`).send({ hours: 8 })).body.data.hours).toBe(8);
    expect((await eli.post(`/api/timesheets/${id}/submit`)).body.data.status).toBe('submitted');
    expect((await eli.patch(`/api/timesheets/${id}`).send({ hours: 6 })).status).toBe(409);

    expect((await mia.post(`/api/timesheets/${id}/reject`).send({})).status).toBe(400);
    const rejected = await mia.post(`/api/timesheets/${id}/reject`).send({ note: 'Split by project' });
    expect(rejected.body.data).toMatchObject({ status: 'rejected', reviewNote: 'Split by project' });

    expect((await eli.post(`/api/timesheets/${id}/submit`)).body.data.status).toBe('submitted');
    const approved = await mia.post(`/api/timesheets/${id}/approve`).send({});
    expect(approved.body.data.status).toBe('approved');
    expect((await eli.delete(`/api/timesheets/${id}`)).status).toBe(409);
  });

  test('reviewers cannot approve their own or unrelated entries', async () => {
    const mia = await ctx.as('mia.manager@acme.test');
    const own = await mia.post('/api/timesheets').send({ projectId, workDate: '2026-10-06', hours: 2 });
    await mia.post(`/api/timesheets/${own.body.data.id}/submit`);
    expect((await mia.post(`/api/timesheets/${own.body.data.id}/approve`).send({})).status).toBe(403);
    const noah = await ctx.as('noah@acme.test');
    expect((await noah.post(`/api/timesheets/${own.body.data.id}/approve`).send({})).status).toBe(403);
    expect((await (await ctx.as('ava.admin@acme.test')).post(`/api/timesheets/${own.body.data.id}/approve`).send({})).status).toBe(200);
  });

  test('validates input', async () => {
    const eli = await ctx.as('eli@acme.test');
    const res = await eli.post('/api/timesheets').send({ projectId, workDate: '06/10/2026', hours: 30 });
    expect(res.status).toBe(400);
    expect(res.body.error.details.length).toBe(2);
    const globexProject = (await (await ctx.as('omar@globex.test')).get('/api/projects')).body.data[0].id;
    expect((await eli.post('/api/timesheets').send({ projectId: globexProject, workDate: '2026-10-06', hours: 1 })).status).toBe(400);
    expect((await eli.patch('/api/timesheets/abc').send({ hours: 1 })).status).toBe(400);
  });

  test('deletes drafts', async () => {
    const eli = await ctx.as('eli@acme.test');
    const created = await eli.post('/api/timesheets').send({ projectId, workDate: '2026-10-07', hours: 1 });
    expect((await eli.delete(`/api/timesheets/${created.body.data.id}`)).status).toBe(204);
  });
});
