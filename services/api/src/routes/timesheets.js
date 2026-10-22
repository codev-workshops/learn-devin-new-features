const express = require('express');
const schemas = require('../validation/schemas');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/asyncHandler');
const { badRequest, forbidden, notFound, conflict } = require('../errors');
const { serializeEntry } = require('../serializers');
const { visibleUserIds, appendIdFilter, canReview } = require('../scope');
const { recordAudit } = require('../audit');
const { withTransaction } = require('../db/transaction');

const ENTRY_SELECT = `
  SELECT e.id, e.user_id, u.name AS user_name, e.project_id, p.code AS project_code, p.name AS project_name,
         e.work_date, e.hours, e.description, e.status, e.reviewed_by, e.reviewed_at, e.review_note
    FROM timesheet_entries e
    JOIN users u ON u.id = e.user_id AND u.tenant_id = e.tenant_id
    JOIN projects p ON p.id = e.project_id AND p.tenant_id = e.tenant_id`;

const EDITABLE = ['draft', 'rejected'];

function timesheetRoutes(db) {
  const router = express.Router();

  async function loadEntry(tenantId, entryId) {
    const { rows } = await db.query(`${ENTRY_SELECT} WHERE e.tenant_id = $1 AND e.id = $2`, [tenantId, entryId]);
    if (!rows.length) throw notFound('Timesheet entry not found');
    return rows[0];
  }

  async function loadOwnEntry(user, entryId) {
    const entry = await loadEntry(user.tenantId, entryId);
    if (entry.user_id !== user.id) throw notFound('Timesheet entry not found');
    return entry;
  }

  async function assertActiveProject(tenantId, projectId) {
    const { rows } = await db.query('SELECT id FROM projects WHERE id = $1 AND tenant_id = $2 AND archived = false', [
      projectId,
      tenantId,
    ]);
    if (!rows.length) throw badRequest('Unknown or archived project');
  }

  async function audit(client, req, action, entityId, details) {
    await recordAudit(client, { tenantId: req.user.tenantId, actorId: req.user.id, action, entity: 'timesheet_entry', entityId, details });
  }

  router.get(
    '/',
    validate(schemas.listEntries, 'query'),
    asyncHandler(async (req, res) => {
      const { from, to, status, userId } = req.validated.query;
      const params = [req.user.tenantId];
      const clauses = ['e.tenant_id = $1'];
      const visible = await visibleUserIds(db, req.user);
      if (userId !== undefined) {
        if (visible !== null && !visible.includes(userId)) throw notFound('User not found');
        appendIdFilter(clauses, params, 'e.user_id', [userId]);
      } else {
        appendIdFilter(clauses, params, 'e.user_id', visible);
      }
      for (const [column, operator, value] of [
        ['e.work_date', '>=', from],
        ['e.work_date', '<=', to],
        ['e.status', '=', status],
      ]) {
        if (value === undefined) continue;
        params.push(value);
        clauses.push(`${column} ${operator} $${params.length}`);
      }
      const { rows } = await db.query(
        `${ENTRY_SELECT} WHERE ${clauses.join(' AND ')} ORDER BY e.work_date DESC, e.id DESC LIMIT 500`,
        params,
      );
      res.json({ data: rows.map(serializeEntry) });
    }),
  );

  router.post(
    '/',
    validate(schemas.createEntry),
    asyncHandler(async (req, res) => {
      const { projectId, workDate, hours, description } = req.validated.body;
      await assertActiveProject(req.user.tenantId, projectId);
      const id = await withTransaction(db, async (client) => {
        const { rows } = await client.query(
          `INSERT INTO timesheet_entries (tenant_id, user_id, project_id, work_date, hours, description)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [req.user.tenantId, req.user.id, projectId, workDate, hours, description],
        );
        await audit(client, req, 'timesheet.created', rows[0].id, { workDate, hours });
        return rows[0].id;
      });
      res.status(201).json({ data: serializeEntry(await loadEntry(req.user.tenantId, id)) });
    }),
  );

  router.patch(
    '/:id',
    validate(schemas.idParam, 'params'),
    validate(schemas.updateEntry),
    asyncHandler(async (req, res) => {
      const entry = await loadOwnEntry(req.user, req.validated.params.id);
      if (!EDITABLE.includes(entry.status)) throw conflict(`Entries that are ${entry.status} cannot be edited`);
      const changes = req.validated.body;
      if (changes.projectId !== undefined) await assertActiveProject(req.user.tenantId, changes.projectId);
      const columns = { projectId: 'project_id', workDate: 'work_date', hours: 'hours', description: 'description' };
      const params = [];
      const sets = Object.entries(changes).map(([key, value]) => {
        params.push(value);
        return `${columns[key]} = $${params.length}`;
      });
      params.push(req.user.tenantId, entry.id);
      await withTransaction(db, async (client) => {
        const result = await client.query(
          `UPDATE timesheet_entries SET ${sets.join(', ')}, status = 'draft', updated_at = now()
            WHERE tenant_id = $${params.length - 1} AND id = $${params.length} AND status IN ('draft', 'rejected')`,
          params,
        );
        if (result.rowCount === 0) throw conflict('The entry changed while you were editing it');
        await audit(client, req, 'timesheet.updated', entry.id, changes);
      });
      res.json({ data: serializeEntry(await loadEntry(req.user.tenantId, entry.id)) });
    }),
  );

  router.delete(
    '/:id',
    validate(schemas.idParam, 'params'),
    asyncHandler(async (req, res) => {
      const entry = await loadOwnEntry(req.user, req.validated.params.id);
      if (entry.status !== 'draft') throw conflict('Only draft entries can be deleted');
      await withTransaction(db, async (client) => {
        const result = await client.query(
          "DELETE FROM timesheet_entries WHERE tenant_id = $1 AND id = $2 AND status = 'draft'",
          [req.user.tenantId, entry.id],
        );
        if (result.rowCount === 0) throw conflict('Only draft entries can be deleted');
        await audit(client, req, 'timesheet.deleted', entry.id, {});
      });
      res.status(204).end();
    }),
  );

  router.post(
    '/:id/submit',
    validate(schemas.idParam, 'params'),
    asyncHandler(async (req, res) => {
      const entry = await loadOwnEntry(req.user, req.validated.params.id);
      if (!EDITABLE.includes(entry.status)) throw conflict(`Entries that are ${entry.status} cannot be submitted`);
      await withTransaction(db, async (client) => {
        const result = await client.query(
          `UPDATE timesheet_entries SET status = 'submitted', updated_at = now()
            WHERE tenant_id = $1 AND id = $2 AND status IN ('draft', 'rejected')`,
          [req.user.tenantId, entry.id],
        );
        if (result.rowCount === 0) throw conflict('The entry changed before it could be submitted');
        await audit(client, req, 'timesheet.submitted', entry.id, {});
      });
      res.json({ data: serializeEntry(await loadEntry(req.user.tenantId, entry.id)) });
    }),
  );

  for (const [action, status, schema] of [
    ['approve', 'approved', schemas.reviewEntry],
    ['reject', 'rejected', schemas.rejectEntry],
  ]) {
    router.post(
      `/:id/${action}`,
      validate(schemas.idParam, 'params'),
      validate(schema),
      asyncHandler(async (req, res) => {
        const entry = await loadEntry(req.user.tenantId, req.validated.params.id);
        if (!(await canReview(db, req.user, entry.user_id))) throw forbidden('You cannot review this entry');
        if (entry.status !== 'submitted') throw conflict(`Entries that are ${entry.status} cannot be reviewed`);
        await withTransaction(db, async (client) => {
          const result = await client.query(
            `UPDATE timesheet_entries
                SET status = $1, reviewed_by = $2, reviewed_at = now(), review_note = $3, updated_at = now()
              WHERE tenant_id = $4 AND id = $5 AND status = 'submitted'`,
            [status, req.user.id, req.validated.body.note || null, req.user.tenantId, entry.id],
          );
          if (result.rowCount === 0) throw conflict('The entry was already reviewed');
          await audit(client, req, `timesheet.${status}`, entry.id, { note: req.validated.body.note });
        });
        res.json({ data: serializeEntry(await loadEntry(req.user.tenantId, entry.id)) });
      }),
    );
  }

  return router;
}

module.exports = { timesheetRoutes };
