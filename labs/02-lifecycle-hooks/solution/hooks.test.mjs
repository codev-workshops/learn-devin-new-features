// Evidence table for lab 02: each acceptance case replayed through the documented hook contract.
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { matcherMatches, simulate, REPO_ROOT } from './simulate.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SOLUTION = path.join(HERE, 'hooks.v1.json');
const INJECTORS = path.join(HERE, '..', 'injectors');
const logDir = mkdtempSync(path.join(os.tmpdir(), 'lab02-log-'));
const env = { HARBOURLINE_HOOK_LOG: path.join(logDir, 'hook-audit.log'), DATABASE_URL: '', HARBOURLINE_LAB_DATABASE_URL: '' };
const pre = (command, extraEnv = {}) =>
  simulate({ config: SOLUTION, event: 'PreToolUse', toolName: 'exec', toolInput: { command }, env: { ...env, ...extraEnv } });

afterAll(() => rmSync(logDir, { recursive: true, force: true }));

describe('lab 02 reference hooks', () => {
  it('allows ordinary commands (exit 0, input unchanged)', async () => {
    const r = await pre('npm test');
    expect(r.outcome).toBe('allow');
    expect(r.input.command).toBe('npm test');
  });

  it('allows a reset against the lab database', async () => {
    const r = await pre('npm run db:seed -- --reset');
    expect(r.outcome).toBe('allow');
  });

  it('blocks a reset against anything but the lab database with exit 2', async () => {
    const r = await pre('DATABASE_URL=postgres://harbourline:harbourline@staging-db.harbourline.internal:5432/harbourline npm run db:seed -- --reset');
    expect(r.outcome).toBe('block');
    expect(r.hooks_run[0].exit).toBe(2);
    expect(r.reason).toMatch(/not the lab database/);
  });

  it('blocks a migration when the hook environment points at a shared database', async () => {
    const r = await pre('npm run db:migrate', { DATABASE_URL: 'postgres://harbourline:harbourline@10.0.4.12:5432/harbourline' });
    expect(r.outcome).toBe('block');
  });

  it('blocks applying the bad-migration patch', async () => {
    const r = await pre('git apply scenarios/bad-migration.patch');
    expect(r.outcome).toBe('block');
    expect(r.reason).toMatch(/destructive DDL/);
  });

  it('still allows reverting the patch (lab reset path)', async () => {
    const r = await pre('git apply -R scenarios/bad-migration.patch');
    expect(r.outcome).toBe('allow');
  });

  it('rewrites psql through the read-only wrapper via updatedInput', async () => {
    const r = await pre('psql "$DATABASE_URL" -c "select count(*) from orders"');
    expect(r.outcome).toBe('rewrite');
    expect(r.input.command).toMatch(/psql-ro\.sh" "\$DATABASE_URL" -c/);
    const again = await pre(r.input.command);
    expect(again.outcome).toBe('allow');
  });

  it('rewrites psql inside docker compose exec with a container-side read-only default', async () => {
    const r = await pre('docker compose exec postgres psql -U harbourline harbourline -c "delete from carts"');
    expect(r.outcome).toBe('rewrite');
    expect(r.input.command).toBe(`docker compose exec -e PGOPTIONS='-c default_transaction_read_only=on' postgres psql -U harbourline harbourline -c "delete from carts"`);
  });

  it('does not let a mention of the wrapper exempt a second, raw psql', async () => {
    const r = await pre('echo psql-ro.sh; psql -c "delete from carts"');
    expect(r.outcome).toBe('rewrite');
    expect(r.input.command).toMatch(/; "[^"]*psql-ro\.sh" -c/);
  });

  it('blocks SQL that switches the session back to read-write', async () => {
    const r = await pre(`psql -c 'SET default_transaction_read_only=off; DELETE FROM carts'`);
    expect(r.outcome).toBe('block');
  });

  it('checks every inline DATABASE_URL, not only the first', async () => {
    const r = await pre('DATABASE_URL=postgres://harbourline:harbourline@localhost:5432/harbourline DATABASE_URL=postgres://harbourline:harbourline@staging-db:5432/harbourline npm run db:seed -- --reset');
    expect(r.outcome).toBe('block');
  });

  it('rejects connection-string parameters that override the host', async () => {
    const r = await pre('DATABASE_URL="postgres://harbourline:harbourline@localhost:5432/harbourline?host=staging-db" npm run db:migrate');
    expect(r.outcome).toBe('block');
  });

  it('records every decision in the audit log', () => {
    const lines = readFileSync(env.HARBOURLINE_HOOK_LOG, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    expect(lines.some((l) => l.decision === 'block')).toBe(true);
    expect(lines.some((l) => l.decision === 'rewrite')).toBe(true);
  });

  it('fails closed when the guard receives unreadable input', async () => {
    const r = await simulate({
      config: { PreToolUse: [{ matcher: '^exec$', hooks: [{ type: 'command', command: `echo 'not json' | node "${path.join(HERE, 'pretool-guard.mjs')}"` }] }] },
      event: 'PreToolUse',
      toolName: 'exec',
      toolInput: { command: 'npm test' },
      env,
    });
    expect(r.outcome).toBe('block');
  });

  it('does not run the exec guard for other tools (anchored matcher)', async () => {
    const r = await simulate({ config: SOLUTION, event: 'PreToolUse', toolName: 'write_to_process', toolInput: { text_input: 'psql' }, env });
    expect(r.hooks_run).toHaveLength(0);
  });
});

describe('lab 02 injectors', () => {
  it('malformed hook JSON loads no hooks, so the reset goes through (fail-open)', async () => {
    const r = await simulate({ config: path.join(INJECTORS, 'malformed-hooks.v1.json'), event: 'PreToolUse', toolName: 'exec', toolInput: { command: 'DATABASE_URL=postgres://x@prod-db:5432/harbourline npm run db:seed -- --reset' }, env });
    expect(r.malformed).toBe(true);
    expect(r.outcome).toBe('allow');
  });

  it('a hook that exceeds its timeout is killed and does not block', async () => {
    const r = await simulate({ config: path.join(INJECTORS, 'slow-hook.v1.json'), event: 'PreToolUse', toolName: 'exec', toolInput: { command: 'npm test' }, env });
    expect(r.outcome).toBe('timeout');
    expect(r.hooks_run[0].timed_out).toBe(true);
  }, 10_000);

  it('a glob-style matcher is not a valid regex and guards nothing', async () => {
    const r = await simulate({ config: path.join(INJECTORS, 'matcher-glob.v1.json'), event: 'PreToolUse', toolName: 'exec', toolInput: { command: 'npm run db:seed -- --reset' }, env });
    expect(r.hooks_run).toHaveLength(0);
    expect(r.notes.join(' ')).toMatch(/not a valid regex/);
  });

  it('matcher semantics: unanchored regex is a substring match; a list matches any entry', () => {
    expect(matcherMatches('edit', 'notebook_edit')).toBe(true);
    expect(matcherMatches('^edit$', 'notebook_edit')).toBe(false);
    expect(matcherMatches(['^write$', '^exec$'], 'exec')).toBe(true);
    expect(matcherMatches(undefined, 'anything')).toBe(true);
  });
});

describe('Stop hook', () => {
  it('blocks stopping while the bad migration is in the tree, then lets a second stop through', async () => {
    const proj = mkdtempSync(path.join(os.tmpdir(), 'lab02-proj-'));
    mkdirSync(path.join(proj, 'db', 'migrations'), { recursive: true });
    writeFileSync(path.join(proj, 'db', 'migrations', '1761094800000_orders-currency-nullable.sql'), '-- x\n');
    const cfg = { Stop: [{ matcher: '', hooks: [{ type: 'command', command: `node "${path.join(HERE, 'stop-check.mjs')}"` }] }] };
    const first = await simulate({ config: cfg, event: 'Stop', extra: { stop_hook_active: false }, projectDir: proj, env });
    expect(first.outcome).toBe('block');
    const second = await simulate({ config: cfg, event: 'Stop', extra: { stop_hook_active: true }, projectDir: proj, env });
    expect(second.outcome).toBe('allow');
    rmSync(proj, { recursive: true, force: true });
  });

  it('lets the agent stop on a clean tree', async () => {
    const r = await simulate({ config: SOLUTION, event: 'Stop', extra: { stop_hook_active: false }, projectDir: REPO_ROOT, env });
    expect(r.outcome).toBe('allow');
  });
});
