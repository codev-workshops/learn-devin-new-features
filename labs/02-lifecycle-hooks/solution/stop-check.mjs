#!/usr/bin/env node
// Stop hook: refuse to finish while the bad migration is still in the working tree.
// Guarded by stop_hook_active so a second stop always goes through (no loop).
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { audit, projectDir, readStdin } from './lib.mjs';

let event = {};
try {
  event = JSON.parse(readStdin() || '{}');
} catch {
  process.exit(0);
}
if (event.stop_hook_active) process.exit(0);
const dir = path.join(projectDir(), 'db', 'migrations');
const leftover = existsSync(dir) ? readdirSync(dir).find((f) => /currency-nullable/.test(f)) : undefined;
if (leftover) {
  const reason = `db/migrations/${leftover} (bad-migration injector) is still in the working tree. Revert it with git apply -R scenarios/bad-migration.patch, then stop.`;
  audit({ hook: 'Stop', decision: 'block', reason });
  process.stdout.write(`${JSON.stringify({ decision: 'block', reason })}\n`);
}
process.exit(0);
