// Shared helpers for the lab 02 reference hooks (Devin CLI lifecycle hooks).
// Hook contract (docs.devin.ai/cli/extensibility/hooks): event JSON on stdin,
// exit 0 = continue, exit 2 = block, any other code = logged, does not block.
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

export const LAB_DATABASE_URL_DEFAULT = 'postgres://kade:kade@localhost:5432/kade';
export const LAB_DB_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'postgres']);

export function projectDir() {
  return process.env.DEVIN_PROJECT_DIR || process.cwd();
}

export function logPath() {
  return process.env.KADE_HOOK_LOG || path.join(projectDir(), '.devin', 'hook-audit.log');
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

/** The lab database is whatever KADE_LAB_DATABASE_URL says, else the Compose default. */
export function labDatabase() {
  return parseDbUrl(process.env.KADE_LAB_DATABASE_URL || LAB_DATABASE_URL_DEFAULT);
}

export function parseDbUrl(url) {
  try {
    const u = new URL(url);
    return { host: u.hostname.replace(/^\[|\]$/g, ''), port: u.port || '5432', db: u.pathname.replace(/^\//, '') };
  } catch {
    return null;
  }
}

export function isLabDatabase(url) {
  const target = parseDbUrl(url);
  const lab = labDatabase();
  if (!target || !lab) return false;
  return LAB_DB_HOSTS.has(target.host) && target.port === lab.port && target.db === lab.db;
}

/** The DATABASE_URL a shell command would run against: inline assignment, else the hook's env, else the lab default. */
export function effectiveDatabaseUrl(command) {
  const inline = /(?:^|[\s;&|(])(?:export\s+)?DATABASE_URL=("[^"]*"|'[^']*'|\S+)/.exec(command);
  if (inline) return inline[1].replace(/^["']|["']$/g, '');
  return process.env.DATABASE_URL || LAB_DATABASE_URL_DEFAULT;
}

/** Destructive DDL in the "Up" part of a node-pg-migrate SQL migration (or a patch adding one). */
export const DESTRUCTIVE_DDL = /\b(?:DROP\s+(?:NOT\s+NULL|DEFAULT|COLUMN|TABLE|SCHEMA|CONSTRAINT)|TRUNCATE)\b/i;

export function upSection(sql) {
  const idx = sql.search(/^\s*\+?\s*--\s*Down Migration/im);
  return idx === -1 ? sql : sql.slice(0, idx);
}
