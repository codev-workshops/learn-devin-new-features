async function recordAudit(db, { tenantId, actorId, action, entity, entityId, details = {} }) {
  await db.query(
    'INSERT INTO audit_log (tenant_id, actor_id, action, entity, entity_id, details) VALUES ($1, $2, $3, $4, $5, $6)',
    [tenantId, actorId, action, entity, entityId, JSON.stringify(details)],
  );
}

module.exports = { recordAudit };
