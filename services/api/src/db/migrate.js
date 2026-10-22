const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function migrate(db) {
  await db.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())',
  );
  const { rows } = await db.query('SELECT version FROM schema_migrations');
  const applied = new Set(rows.map((row) => row.version));
  const files = fs.readdirSync(MIGRATIONS_DIR).filter((file) => file.endsWith('.sql')).sort();
  const newlyApplied = [];
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    await db.query(sql);
    await db.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
    newlyApplied.push(file);
  }
  return newlyApplied;
}

module.exports = { migrate };

if (require.main === module) {
  const { loadConfig } = require('../config');
  const { createPool } = require('./pool');
  const pool = createPool(loadConfig().databaseUrl);
  migrate(pool)
    .then((applied) => {
      console.log(applied.length ? `Applied: ${applied.join(', ')}` : 'Database is up to date');
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
