const express = require('express');
const jwt = require('jsonwebtoken');
const schemas = require('../validation/schemas');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/asyncHandler');
const { unauthorized } = require('../errors');

// Training-only login: seeded users sign in with their email address and no password.
function authRoutes(db, config) {
  const router = express.Router();

  router.post(
    '/login',
    validate(schemas.login),
    asyncHandler(async (req, res) => {
      const { email } = req.validated.body;
      const { rows } = await db.query(
        `SELECT u.id, u.tenant_id, u.email, u.name, u.role, t.slug AS tenant_slug, t.name AS tenant_name
           FROM users u JOIN tenants t ON t.id = u.tenant_id
          WHERE u.email = $1`,
        [email],
      );
      if (!rows.length) throw unauthorized('Unknown user');
      const user = rows[0];
      const token = jwt.sign({ sub: user.id, tid: user.tenant_id, role: user.role }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
      });
      res.json({
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenant: { id: user.tenant_id, slug: user.tenant_slug, name: user.tenant_name },
          },
        },
      });
    }),
  );

  return router;
}

module.exports = { authRoutes };
