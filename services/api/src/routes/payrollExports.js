const express = require('express');
const schemas = require('../validation/schemas');
const { validate } = require('../middleware/validate');
const { requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');
const { badRequest, notFound } = require('../errors');
const { serializeExport } = require('../serializers');
const { recordAudit } = require('../audit');

const MAX_PERIOD_DAYS = 31;
const DAY_MS = 24 * 60 * 60 * 1000;

function periodDays(start, end) {
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / DAY_MS) + 1;
}

function payrollExportRoutes(db) {
  const router = express.Router();
  router.use(requireRole('admin'));

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const { rows } = await db.query(
        'SELECT * FROM payroll_exports WHERE tenant_id = $1 ORDER BY created_at DESC, id DESC LIMIT 50',
        [req.user.tenantId],
      );
      res.json({ data: rows.map(serializeExport) });
    }),
  );

  router.get(
    '/:id',
    validate(schemas.idParam, 'params'),
    asyncHandler(async (req, res) => {
      const { rows } = await db.query('SELECT * FROM payroll_exports WHERE id = $1 AND tenant_id = $2', [
        req.validated.params.id,
        req.user.tenantId,
      ]);
      if (!rows.length) throw notFound('Payroll export not found');
      res.json({ data: serializeExport(rows[0]) });
    }),
  );

  router.post(
    '/',
    validate(schemas.createPayrollExport),
    asyncHandler(async (req, res) => {
      const { periodStart, periodEnd } = req.validated.body;
      const days = periodDays(periodStart, periodEnd);
      if (days < 1) throw badRequest('periodEnd must be on or after periodStart');
      if (days > MAX_PERIOD_DAYS) throw badRequest(`A payroll period cannot exceed ${MAX_PERIOD_DAYS} days`);
      const idempotencyKey = (req.get('idempotency-key') || `${periodStart}_${periodEnd}`).slice(0, 100);

      const existing = await db.query('SELECT * FROM payroll_exports WHERE tenant_id = $1 AND idempotency_key = $2', [
        req.user.tenantId,
        idempotencyKey,
      ]);
      if (existing.rows.length) {
        return res.status(200).json({ data: serializeExport(existing.rows[0]) });
      }

      const { rows } = await db.query(
        `INSERT INTO payroll_exports (tenant_id, requested_by, period_start, period_end, idempotency_key)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [req.user.tenantId, req.user.id, periodStart, periodEnd, idempotencyKey],
      );
      await recordAudit(db, {
        tenantId: req.user.tenantId,
        actorId: req.user.id,
        action: 'payroll_export.requested',
        entity: 'payroll_export',
        entityId: rows[0].id,
        details: { periodStart, periodEnd },
      });
      req.log?.info({ payrollExportId: rows[0].id, periodStart, periodEnd }, 'Payroll export queued');
      return res.status(202).json({ data: serializeExport(rows[0]) });
    }),
  );

  return router;
}

module.exports = { payrollExportRoutes };
