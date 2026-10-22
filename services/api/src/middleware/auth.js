const jwt = require('jsonwebtoken');
const { unauthorized, forbidden } = require('../errors');

function authenticate(db, jwtSecret) {
  return async (req, _res, next) => {
    try {
      const header = req.get('authorization') || '';
      const [scheme, token] = header.split(' ');
      if (scheme !== 'Bearer' || !token) throw unauthorized();
      let payload;
      try {
        payload = jwt.verify(token, jwtSecret);
      } catch {
        throw unauthorized('Invalid or expired token');
      }
      const { rows } = await db.query(
        'SELECT id, tenant_id, email, name, role, manager_id FROM users WHERE id = $1 AND tenant_id = $2',
        [payload.sub, payload.tid],
      );
      if (!rows.length) throw unauthorized('User no longer exists');
      const user = rows[0];
      req.user = {
        id: user.id,
        tenantId: user.tenant_id,
        email: user.email,
        name: user.name,
        role: user.role,
        managerId: user.manager_id,
      };
      if (req.log) req.log = req.log.child({ tenantId: user.tenant_id, userId: user.id });
      next();
    } catch (error) {
      next(error);
    }
  };
}

const requireRole = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) return next(forbidden());
  return next();
};

module.exports = { authenticate, requireRole };
