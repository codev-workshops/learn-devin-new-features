const express = require('express');
const schemas = require('../validation/schemas');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/asyncHandler');
const { badRequest } = require('../errors');
const { visibleUserIds, appendIdFilter } = require('../scope');

const GROUPS = {
  project: { key: 'p.code', label: 'p.name' },
  user: { key: 'u.email', label: 'u.name' },
};

function reportRoutes(db) {
  const router = express.Router();

  router.get(
    '/hours',
    validate(schemas.hoursReport, 'query'),
    asyncHandler(async (req, res) => {
      const { from, to, groupBy, status } = req.validated.query;
      if (from > to) throw badRequest('"from" must be on or before "to"');
      const group = GROUPS[groupBy];
      const params = [req.user.tenantId, from, to, status];
      const clauses = ['e.tenant_id = $1', 'e.work_date >= $2', 'e.work_date <= $3', 'e.status = $4'];
      appendIdFilter(clauses, params, 'e.user_id', await visibleUserIds(db, req.user));
      const { rows } = await db.query(
        `SELECT ${group.key} AS key, ${group.label} AS label, SUM(e.hours) AS hours
           FROM timesheet_entries e
           JOIN users u ON u.id = e.user_id AND u.tenant_id = e.tenant_id
           JOIN projects p ON p.id = e.project_id AND p.tenant_id = e.tenant_id
          WHERE ${clauses.join(' AND ')}
          GROUP BY ${group.key}, ${group.label}
          ORDER BY ${group.key}`,
        params,
      );
      const reportRows = rows.map((row) => ({ key: row.key, label: row.label, hours: Number(row.hours) }));
      const totalHours = reportRows.reduce((sum, row) => sum + row.hours, 0);
      res.json({ data: { from, to, groupBy, status, rows: reportRows, totalHours } });
    }),
  );

  return router;
}

module.exports = { reportRoutes };
