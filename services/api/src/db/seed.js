const { TENANTS, USERS, PROJECTS, buildEntries } = require('./seedData');

const RESET_ORDER = ['audit_log', 'payroll_exports', 'timesheet_entries', 'projects', 'users', 'tenants'];

async function seed(db, { reset = false } = {}) {
  const { rows } = await db.query('SELECT COUNT(*)::int AS count FROM tenants');
  if (Number(rows[0].count) > 0) {
    if (!reset) return { skipped: true };
    for (const table of RESET_ORDER) {
      await db.query(`DELETE FROM ${table}`);
    }
  }

  const tenantIds = {};
  for (const tenant of TENANTS) {
    const result = await db.query('INSERT INTO tenants (slug, name) VALUES ($1, $2) RETURNING id', [tenant.slug, tenant.name]);
    tenantIds[tenant.slug] = result.rows[0].id;
  }

  const userIds = {};
  const managers = {};
  for (const user of USERS) {
    const result = await db.query(
      'INSERT INTO users (tenant_id, email, name, role, hourly_rate_cents) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [tenantIds[user.tenant], user.email, user.name, user.role, user.rate],
    );
    userIds[user.email] = result.rows[0].id;
    if (user.manager) managers[user.email] = user.manager;
  }
  for (const [email, managerEmail] of Object.entries(managers)) {
    await db.query('UPDATE users SET manager_id = $1 WHERE id = $2', [userIds[managerEmail], userIds[email]]);
  }

  const projectIds = {};
  for (const project of PROJECTS) {
    const result = await db.query(
      'INSERT INTO projects (tenant_id, code, name, billable) VALUES ($1, $2, $3, $4) RETURNING id',
      [tenantIds[project.tenant], project.code, project.name, project.billable],
    );
    projectIds[project.code] = result.rows[0].id;
  }

  const usersByEmail = Object.fromEntries(USERS.map((user) => [user.email, user]));
  const adminByTenant = Object.fromEntries(USERS.filter((u) => u.role === 'admin').map((u) => [u.tenant, u.email]));
  const entries = buildEntries();
  for (const entry of entries) {
    const user = usersByEmail[entry.email];
    const reviewerEmail = user.manager || adminByTenant[user.tenant];
    const reviewed = entry.status === 'approved';
    await db.query(
      `INSERT INTO timesheet_entries
         (tenant_id, user_id, project_id, work_date, hours, description, status, reviewed_by, reviewed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        tenantIds[user.tenant],
        userIds[entry.email],
        projectIds[entry.projectCode],
        entry.workDate,
        entry.hours,
        entry.description,
        entry.status,
        reviewed ? userIds[reviewerEmail] : null,
        reviewed ? `${entry.workDate}T18:00:00Z` : null,
      ],
    );
  }

  return { skipped: false, tenants: TENANTS.length, users: USERS.length, projects: PROJECTS.length, entries: entries.length };
}

module.exports = { seed };

if (require.main === module) {
  const { loadConfig } = require('../config');
  const { createPool } = require('./pool');
  const pool = createPool(loadConfig().databaseUrl);
  seed(pool, { reset: process.argv.includes('--reset') })
    .then((result) => console.log(result.skipped ? 'Seed skipped: data already present (use --reset)' : `Seeded ${JSON.stringify(result)}`))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
