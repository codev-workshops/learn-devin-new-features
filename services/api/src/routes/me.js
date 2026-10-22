const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');

function meRoutes(db) {
  const router = express.Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const { rows } = await db.query('SELECT id, slug, name FROM tenants WHERE id = $1', [req.user.tenantId]);
      const { id, email, name, role, managerId } = req.user;
      res.json({ data: { id, email, name, role, managerId, tenant: rows[0] } });
    }),
  );

  return router;
}

module.exports = { meRoutes };
