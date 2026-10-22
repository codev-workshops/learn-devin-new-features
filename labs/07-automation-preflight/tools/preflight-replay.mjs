#!/usr/bin/env node
// Offline replay of the Devin Automation Preflight script contract (lab 07).
//
//   node labs/07-automation-preflight/tools/preflight-replay.mjs --script <file> [options]
//
//   --script <file>    Preflight script (.mjs/.js → node, .py → python3, .sh → bash)
//   --events <file>    fixture with { events: [...] } (default: ../fixtures/paygate-notifications.json)
//   --only <ids>       comma-separated notification_ids to replay (default: all)
//   --state-dir <dir>  keep STATE_FILE and handled items here between invocations (default: fresh temp dir)
//   --timeout <s>      script timeout in seconds, 1–300 (default 60)
//   --cap <n>          max items per run, 1–50 (default 10)
//   --run-now          skip Preflight entirely, like the Automation's "Run now" button
//   --json             print the summary as JSON
//
// For each event it writes EVENT_FILE, STATE_FILE, LAST_RUN_FILE and an empty
// OUTPUT_FILE path, runs the script, validates the decision, dedupes items by
// id@version, and prints one line per event. A failed run (non-zero exit,
// timeout, invalid output, state over 64 KiB) stops that event, does not save
// state and is not retried. This mirrors the documented contract; it is not the
// Devin runtime.

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { promises as fs, mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_EVENTS = path.join(HERE, '..', 'fixtures', 'paygate-notifications.json');
export const STATE_LIMIT_BYTES = 64 * 1024;
export const OUTPUT_LIMIT_BYTES = 256 * 1024;

function runner(script) {
  const ext = path.extname(script);
  if (ext === '.py') return ['python3', [script]];
  if (ext === '.sh') return ['bash', [script]];
  return [process.execPath, [script]];
}

function exec(script, env, timeoutSeconds) {
  return new Promise((resolve) => {
    const [cmd, args] = runner(script);
    const child = spawn(cmd, args, { env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
    let log = '';
    let timedOut = false;
    child.stdout.on('data', (d) => (log += d));
    child.stderr.on('data', (d) => (log += d));
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutSeconds * 1000);
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, timedOut, log: log.slice(0, 4000) });
    });
  });
}

export function validateDecision(raw, cap) {
  let out;
  try {
    out = JSON.parse(raw);
  } catch {
    return { error: 'OUTPUT_FILE is not valid JSON' };
  }
  if (!out || typeof out !== 'object' || Array.isArray(out)) return { error: 'output must be a JSON object' };
  const keys = Object.keys(out).filter((k) => k !== 'reason');
  if (out.reason !== undefined && typeof out.reason !== 'string') return { error: 'reason must be a string' };
  if (keys.length !== 1 || !['run', 'items'].includes(keys[0])) return { error: 'output must contain exactly one of "run" or "items"' };
  if (keys[0] === 'run') {
    if (typeof out.run !== 'boolean') return { error: '"run" must be a boolean' };
    return { decision: out };
  }
  if (!Array.isArray(out.items)) return { error: '"items" must be an array' };
  for (const [i, it] of out.items.entries()) {
    if (!it || typeof it !== 'object') return { error: `items[${i}] must be an object` };
    if (it.id !== undefined && typeof it.id !== 'string') return { error: `items[${i}].id must be a string` };
    if (it.version !== undefined && !['string', 'number'].includes(typeof it.version)) return { error: `items[${i}].version must be a string or number` };
  }
  return { decision: out, deferred: Math.max(0, out.items.length - cap) };
}

const itemKey = (it) => (it.id !== undefined ? `${it.id}@${it.version ?? ''}` : `sha256:${createHash('sha256').update(JSON.stringify(it)).digest('hex').slice(0, 16)}`);

export async function replay({ script, events = DEFAULT_EVENTS, only, stateDir, timeout = 60, cap = 10, runNow = false } = {}) {
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > 300) throw new Error('timeout must be an integer from 1 to 300 seconds');
  if (!Number.isInteger(cap) || cap < 1 || cap > 50) throw new Error('cap must be an integer from 1 to 50');
  const fixture = JSON.parse(await fs.readFile(events, 'utf8'));
  let list = fixture.events ?? fixture;
  if (only) {
    const want = new Set(only);
    list = list.filter((e) => want.has(e.body?.notification_id));
  }
  const dir = stateDir ?? mkdtempSync(path.join(os.tmpdir(), 'lab07-preflight-'));
  await fs.mkdir(dir, { recursive: true });
  const statePath = path.join(dir, 'state.json');
  const handledPath = path.join(dir, 'handled.json');
  const readJson = async (p, dflt) => JSON.parse(await fs.readFile(p, 'utf8').catch(() => JSON.stringify(dflt)));
  let state = await readJson(statePath, {});
  const handled = await readJson(handledPath, []);
  const results = [];

  for (const [i, event] of list.entries()) {
    const label = event.body?.notification_id ?? `event-${i + 1}`;
    if (runNow) {
      results.push({ event: label, status: 'dispatched', sessions: [label], reason: 'Run now: Preflight bypassed' });
      continue;
    }
    const work = await fs.mkdtemp(path.join(dir, 'run-'));
    const files = {
      EVENT_FILE: path.join(work, 'event.json'),
      STATE_FILE: path.join(work, 'state.json'),
      LAST_RUN_FILE: path.join(work, 'last_run.json'),
      OUTPUT_FILE: path.join(work, 'output.json'),
    };
    await fs.writeFile(files.EVENT_FILE, JSON.stringify(event, null, 2));
    await fs.writeFile(files.STATE_FILE, JSON.stringify(state));
    await fs.writeFile(files.LAST_RUN_FILE, JSON.stringify({ items: handled.slice(-200), truncated: handled.length > 200 }));
    await fs.chmod(files.EVENT_FILE, 0o444);
    await fs.chmod(files.LAST_RUN_FILE, 0o444);
    const r = await exec(script, files, timeout);
    const fail = (reason) => results.push({ event: label, status: 'failed', sessions: [], reason, log: r.log });
    if (r.timedOut) {
      fail(`timed out after ${timeout} s`);
      continue;
    }
    if (r.code !== 0) {
      fail(`script exited ${r.code}`);
      continue;
    }
    const raw = await fs.readFile(files.OUTPUT_FILE, 'utf8').catch(() => '');
    if (Buffer.byteLength(raw) > OUTPUT_LIMIT_BYTES) {
      fail('output over 256 KiB');
      continue;
    }
    const { decision, deferred, error } = validateDecision(raw, cap);
    if (error) {
      fail(error);
      continue;
    }
    const stateRaw = await fs.readFile(files.STATE_FILE, 'utf8');
    let next;
    try {
      next = JSON.parse(stateRaw);
    } catch {
      fail('STATE_FILE is not valid JSON');
      continue;
    }
    if (Buffer.byteLength(stateRaw) > STATE_LIMIT_BYTES) {
      fail('STATE_FILE over 64 KiB');
      continue;
    }
    state = next;
    if ('run' in decision) {
      results.push({ event: label, status: decision.run ? 'dispatched' : 'skipped', sessions: decision.run ? [label] : [], reason: decision.reason ?? '' });
      continue;
    }
    const sessions = [];
    const duplicates = [];
    for (const it of decision.items.slice(0, cap)) {
      const key = itemKey(it);
      if (handled.some((h) => h.key === key)) duplicates.push(key);
      else {
        handled.push({ key, id: it.id ?? null, version: it.version ?? null, title: it.title ?? null, at: event.received_at ?? null });
        sessions.push(key);
      }
    }
    const status = sessions.length ? 'dispatched' : 'skipped';
    results.push({ event: label, status, sessions, duplicates, deferred, reason: decision.reason ?? (decision.items.length ? 'every item already handled' : 'no items') });
  }

  await fs.writeFile(statePath, JSON.stringify(state, null, 2));
  await fs.writeFile(handledPath, JSON.stringify(handled, null, 2));
  const sessions = results.flatMap((r) => r.sessions);
  return {
    events: results.length,
    sessions,
    skipped: results.filter((r) => r.status === 'skipped').length,
    failed: results.filter((r) => r.status === 'failed').length,
    results,
    stateDir: dir,
    stateBytes: Buffer.byteLength(JSON.stringify(state)),
  };
}

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--script') o.script = path.resolve(argv[++i]);
    else if (a === '--events') o.events = path.resolve(argv[++i]);
    else if (a === '--only') o.only = argv[++i].split(',');
    else if (a === '--state-dir') o.stateDir = path.resolve(argv[++i]);
    else if (a === '--timeout') o.timeout = Number(argv[++i]);
    else if (a === '--cap') o.cap = Number(argv[++i]);
    else if (a === '--run-now') o.runNow = true;
    else if (a === '--json') o.json = true;
    else throw new Error(`unknown argument ${a}`);
  }
  if (!o.script && !o.runNow) throw new Error('--script is required (or --run-now)');
  return o;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const opts = parseArgs(process.argv.slice(2));
    const s = await replay(opts);
    if (opts.json) console.log(JSON.stringify(s, null, 2));
    else {
      for (const r of s.results) console.log(`${r.event.padEnd(9)} ${r.status.padEnd(10)} ${r.sessions.join(', ') || '-'}  ${r.reason}`);
      console.log(`RESULT: events=${s.events} sessions=${s.sessions.length} skipped=${s.skipped} failed=${s.failed} state_bytes=${s.stateBytes} state_dir=${s.stateDir}`);
    }
  } catch (err) {
    console.error(`preflight-replay: ${err.message}`);
    process.exit(2);
  }
}
