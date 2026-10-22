const express = require('express');
const schemas = require('../validation/schemas');
const { validate } = require('../middleware/validate');
const { requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');
const { serializeProject } = require('../serializers');
const { recordAudit } = require('../audit');

function projectRoutes(db) {
  const router = express.Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const { rows } = await db.query(
        'SELECT id, code, name, billable, archived FROM projects WHERE tenant_id = $1 AND archived = false ORDER BY code',
        [req.user.tenantId],
      );
      res.json({ data: rows.map(serializeProject) });
    }),
  );

  router.post(
    '/',
    requireRole('admin'),
    validate(schemas.createProject),
    asyncHandler(async (req, res) => {
      const { code, name, billable } = req.validated.body;
      const { rows } = await db.query(
        'INSERT INTO projects (tenant_id, code, name, billable) VALUES ($1, $2, $3, $4) RETURNING id, code, name, billable, archived',
        [req.user.tenantId, code, name, billable],
      );
      await recordAudit(db, {
        tenantId: req.user.tenantId,
        actorId: req.user.id,
        action: 'project.created',
        entity: 'project',
        entityId: rows[0].id,
        details: { code },
      });
      res.status(201).json({ data: serializeProject(rows[0]) });
    }),
  );

  return router;
}

module.exports = { projectRoutes };
