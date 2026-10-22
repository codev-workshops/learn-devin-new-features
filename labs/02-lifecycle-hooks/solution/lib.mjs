// Shared helpers for the lab 02 reference hooks (Devin CLI lifecycle hooks).
// Hook contract (docs.devin.ai/cli/extensibility/hooks): event JSON on stdin,
// exit 0 = continue, exit 2 = block, any other code = logged, does not block.
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

export const LAB_DATABASE_URL_DEFAULT = 'postgres://harbourline:harbourline@localhost:5432/harbourline';
export const LAB_DB_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'postgres']);

export function projectDir() {
  return process.env.DEVIN_PROJECT_DIR || process.cwd();
}

export function logPath() {
  return process.env.HARBOURLINE_HOOK_LOG || path.join(projectDir(), '.devin', 'hook-audit.log');
}

export function audit(entry) {
  try {
    const p = logPath();
    mkdirSync(path.dirname(p), { recursive: true });
    appendFileSync(p, `${JSON.stringify({ at: new Date().toISOString(), ...entry })}\n`);
  } catch {
    // Logging must never change the hook's decision.
  }
}

export function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

/** The lab database is whatever HARBOURLINE_LAB_DATABASE_URL says, else the Compose default. */
export function labDatabase() {
  return parseDbUrl(process.env.HARBOURLINE_LAB_DATABASE_URL || LAB_DATABASE_URL_DEFAULT);
}

function unwrap(value, open, close) {
  return value.length >= 2 && value.startsWith(open) && value.endsWith(close) ? value.slice(1, -1) : value;
}

function unquote(value) {
  return unwrap(unwrap(value, '"', '"'), "'", "'");
}

// libpq lets query parameters override the authority part (postgres://localhost/harbourline?host=staging).
const CONNECTION_OVERRIDES = ['host', 'hostaddr', 'port', 'dbname', 'service'];

export function parseDbUrl(url) {
  try {
    const u = new URL(url);
    const overridden = CONNECTION_OVERRIDES.some((k) => u.searchParams.has(k));
    return { host: unwrap(u.hostname, '[', ']'), port: u.port || '5432', db: u.pathname.replace(/^\//, ''), overridden };
  } catch {
    return null;
  }
}

export function isLabDatabase(url) {
  const target = parseDbUrl(url);
  const lab = labDatabase();
  if (!target || !lab || target.overridden) return false;
  return LAB_DB_HOSTS.has(target.host) && target.port === lab.port && target.db === lab.db;
}

const INLINE_DATABASE_URL = /(?:^|[\s;&|(])(?:export\s+)?DATABASE_URL=("[^"]*"|'[^']*'|\S+)/g;

/**
 * Every DATABASE_URL a shell command could run against: each inline assignment (a later one
 * may override an earlier one), plus the hook's env, else the lab default when none is inline.
 */
export function candidateDatabaseUrls(command) {
  const inline = [...command.matchAll(INLINE_DATABASE_URL)].map((m) => unquote(m[1]));
  const ambient = process.env.DATABASE_URL || LAB_DATABASE_URL_DEFAULT;
  return inline.length ? [...inline, ambient] : [ambient];
}

/** Destructive DDL in the "Up" part of a node-pg-migrate SQL migration (or a patch adding one). */
export const DESTRUCTIVE_DDL = /\b(?:DROP\s+(?:NOT\s+NULL|DEFAULT|COLUMN|TABLE|SCHEMA|CONSTRAINT)|TRUNCATE)\b/i;

export function upSection(sql) {
  const idx = sql.search(/^\s*\+?\s*--\s*Down Migration/im);
  return idx === -1 ? sql : sql.slice(0, idx);
}
