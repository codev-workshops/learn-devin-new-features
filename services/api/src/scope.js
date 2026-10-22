// Returns the user ids whose timesheet data the caller may see, or null for "all users in the tenant".
async function visibleUserIds(db, user) {
  if (user.role === 'admin') return null;
  if (user.role === 'employee') return [user.id];
  const { rows } = await db.query('SELECT id FROM users WHERE tenant_id = $1 AND manager_id = $2', [user.tenantId, user.id]);
  return [user.id, ...rows.map((row) => row.id)];
}

// Appends "AND <column> IN (...)" for a scoped id list, keeping every value parameterized.
function appendIdFilter(clauses, params, column, ids) {
  if (ids === null) return;
  const placeholders = ids.map((value) => {
    params.push(value);
    return `$${params.length}`;
  });
  clauses.push(`${column} IN (${placeholders.join(', ')})`);
}

async function canReview(db, reviewer, ownerId) {
  if (reviewer.id === ownerId) return false;
  if (reviewer.role === 'admin') return true;
  if (reviewer.role !== 'manager') return false;
  const { rows } = await db.query('SELECT 1 FROM users WHERE id = $1 AND tenant_id = $2 AND manager_id = $3', [
    ownerId,
    reviewer.tenantId,
    reviewer.id,
  ]);
  return rows.length > 0;
}

module.exports = { visibleUserIds, appendIdFilter, canReview };
