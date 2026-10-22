#!/usr/bin/env node
// PreToolUse hook for the `exec` tool (matcher "^exec$").
//   * blocks (exit 2) db:seed --reset, lab:reset and migrations unless they target the lab DB;
//   * blocks (exit 2) applying a patch or running migrations that contain destructive DDL
//     (the bad-migration injector drops NOT NULL / DEFAULT on orders.currency);
//   * rewrites every psql invocation through the read-only wrapper via updatedInput;
//   * fails CLOSED: unreadable stdin is a block, not a pass.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DESTRUCTIVE_DDL,
  audit,
  candidateDatabaseUrls,
  isLabDatabase,
  projectDir,
  readStdin,
  upSection,
} from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const WRAPPER = path.join(HERE, 'psql-ro.sh');

const RESETTING = /\b(?:lab:reset|db:reset)\b|\bdb:seed\b.*\s--reset\b/;
const MIGRATING = /\b(?:db:migrate|node-pg-migrate|migrate\s+up)\b/;
const APPLYING = /\b(?:git\s+apply|git\s+am|patch\s+-p\d)\b/;
const REVERSING = /\s(?:-R|--reverse|--check)\b/;
// SQL that would switch a session back to read-write despite the wrapper's default.
const READ_WRITE_ESCAPE = /default_transaction_read_only|transaction_read_only|read\s+write|session\s+characteristics/i;
const COMPOSE_EXEC = /\bdocker(?:\s+|-)compose\s+exec\b/;
const PSQL = /(^|[\s;&|(`])psql(?=\s|$)/g;
const HAS_PSQL = /(^|[\s;&|(`])psql(?=\s|$)/;

function block(reason, command) {
  audit({ hook: 'PreToolUse', decision: 'block', reason, command });
  process.stderr.write(`${reason}\n`);
  process.stdout.write(`${JSON.stringify({ decision: 'block', reason })}\n`);
  process.exit(2);
}

function patchFiles(command) {
  return [...command.matchAll(/(\S+\.(?:patch|diff))\b/g)].map((m) => path.resolve(projectDir(), m[1]));
}

function pendingMigrationsAreDestructive() {
  const dir = path.join(projectDir(), 'db', 'migrations');
  if (!existsSync(dir)) return null;
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.sql')).sort()) {
    if (DESTRUCTIVE_DDL.test(upSection(readFileSync(path.join(dir, f), 'utf8')))) return f;
  }
  return null;
}

export function decide(event) {
  const command = String(event?.tool_input?.command ?? '');
  if (!command.trim()) return { action: 'allow', command };

  if (RESETTING.test(command) || MIGRATING.test(command)) {
    const url = candidateDatabaseUrls(command).find((u) => !isLabDatabase(u));
    if (url) {
      return { action: 'block', command, reason: `Blocked by lab policy: "${command}" targets ${url}, not the lab database. Reset and migrate only against the lab DB.` };
    }
  }
  if (APPLYING.test(command) && !REVERSING.test(command)) {
    for (const p of patchFiles(command)) {
      if (existsSync(p) && DESTRUCTIVE_DDL.test(upSection(readFileSync(p, 'utf8')))) {
        return { action: 'block', command, reason: `Blocked by lab policy: ${path.basename(p)} adds a migration with destructive DDL (DROP NOT NULL/DEFAULT/COLUMN/TABLE). Ask the DBA.` };
      }
    }
  }
  if (MIGRATING.test(command)) {
    const bad = pendingMigrationsAreDestructive();
    if (bad) return { action: 'block', command, reason: `Blocked by lab policy: db/migrations/${bad} contains destructive DDL; refusing to migrate.` };
  }
  if (HAS_PSQL.test(command) || command.includes('psql-ro.sh')) {
    if (READ_WRITE_ESCAPE.test(command)) {
      return { action: 'block', command, reason: 'Blocked by lab policy: psql sessions stay read-only; the command tries to switch the transaction mode.' };
    }
  }
  if (HAS_PSQL.test(command)) {
    // Inside a container the host wrapper does not exist: pass the same read-only default via PGOPTIONS.
    const rewritten = COMPOSE_EXEC.test(command)
      ? command.replace(COMPOSE_EXEC, (m) => `${m} -e PGOPTIONS='-c default_transaction_read_only=on'`)
      : command.replace(PSQL, (_m, pre) => `${pre}"${WRAPPER}"`);
    return { action: 'rewrite', command, rewritten };
  }
  return { action: 'allow', command };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const raw = readStdin();
  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    block('Blocked by lab policy: hook input was not valid JSON (failing closed).', raw.slice(0, 200));
  }
  const d = decide(event);
  if (d.action === 'block') block(d.reason, d.command);
  if (d.action === 'rewrite') {
    audit({ hook: 'PreToolUse', decision: 'rewrite', command: d.command, rewritten: d.rewritten });
    process.stdout.write(`${JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', updatedInput: { command: d.rewritten } } })}\n`);
    process.exit(0);
  }
  audit({ hook: 'PreToolUse', decision: 'allow', command: d.command });
  process.exit(0);
}
