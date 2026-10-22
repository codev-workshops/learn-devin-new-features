#!/usr/bin/env node
// Offline model of a Devin Outpost queue and a Dockerfile policy check for lab 14.
// It needs no Outpost, token or network: it replays fixture scenarios through the rules
// documented in https://docs.devin.ai/cloud/outposts/orchestration (list-then-watch,
// atomic claim with 409 on a race, claim deadline, release on provisioning failure,
// one session per worker, pending sessions wait with a banner instead of failing).
//
//   node labs/14-outposts/tools/outpost-sim.mjs scenario labs/14-outposts/fixtures/two-workers.json
//   node labs/14-outposts/tools/outpost-sim.mjs check-dockerfile outpost/Dockerfile
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function createOutpost(name, { claimDeadlineSeconds = 120 } = {}) {
  return { name, claimDeadlineSeconds, workers: new Map(), sessions: new Map(), log: [] };
}

function note(op, t, msg) {
  op.log.push(`[${String(t).padStart(4, ' ')}s] ${msg}`);
}

export function workerOnline(op, t, acceptorId) {
  const existing = op.workers.get(acceptorId);
  if (existing && existing.online) {
    note(op, t, `worker ${acceptorId} REJECTED: acceptor id already online (give every worker its own data dir)`);
    return { ok: false, status: 409 };
  }
  op.workers.set(acceptorId, { id: acceptorId, online: true, session: null });
  note(op, t, `worker ${acceptorId} online`);
  return { ok: true };
}

export function workerOffline(op, t, acceptorId) {
  const w = op.workers.get(acceptorId);
  if (!w) return;
  w.online = false;
  if (w.session) {
    const s = op.sessions.get(w.session);
    note(op, t, `worker ${acceptorId} offline while running ${s.id}; session waits for a machine`);
    s.state = 'pending';
    s.worker = null;
    w.session = null;
  } else note(op, t, `worker ${acceptorId} offline`);
}

export function createSession(op, t, id, { via = 'web' } = {}) {
  op.sessions.set(id, { id, via, state: 'pending', worker: null, claimedAt: null, claims: 0 });
  note(op, t, `session ${id} queued on outpost ${op.name} (via ${via})`);
}

export function claim(op, t, acceptorId, sessionId) {
  const w = op.workers.get(acceptorId);
  const s = op.sessions.get(sessionId);
  if (!w?.online || w.session) return { ok: false, status: 400 };
  if (!s || s.state !== 'pending') {
    note(op, t, `worker ${acceptorId} claim ${sessionId} -> 409 (already claimed); keeps watching`);
    return { ok: false, status: 409 };
  }
  s.state = 'claimed';
  s.worker = acceptorId;
  s.claimedAt = t;
  s.claims += 1;
  w.session = sessionId;
  note(op, t, `worker ${acceptorId} claimed ${sessionId}`);
  return { ok: true, status: 200 };
}

export function provisioned(op, t, sessionId, { ok = true } = {}) {
  const s = op.sessions.get(sessionId);
  if (!s || s.state !== 'claimed') return;
  if (ok) {
    s.state = 'running';
    note(op, t, `session ${sessionId} running on ${s.worker}`);
  } else {
    note(op, t, `worker ${s.worker} released ${sessionId} (provisioning failed); back to the queue`);
    op.workers.get(s.worker).session = null;
    s.state = 'pending';
    s.worker = null;
  }
}

export function finish(op, t, sessionId) {
  const s = op.sessions.get(sessionId);
  if (!s?.worker) return;
  op.workers.get(s.worker).session = null;
  note(op, t, `session ${sessionId} finished; worker ${s.worker} idle`);
  s.state = 'done';
  s.worker = null;
}

export function tick(op, t) {
  for (const s of op.sessions.values()) {
    if (s.state === 'claimed' && t - s.claimedAt > op.claimDeadlineSeconds) {
      note(op, t, `claim on ${s.id} by ${s.worker} expired; session returns to pending`);
      op.workers.get(s.worker).session = null;
      s.state = 'pending';
      s.worker = null;
    }
  }
}

/** Idle online workers pick the oldest pending sessions (one session per worker). */
export function dispatch(op, t) {
  for (const w of op.workers.values()) {
    if (!w.online || w.session) continue;
    const next = [...op.sessions.values()].find((s) => s.state === 'pending');
    if (!next) break;
    claim(op, t, w.id, next.id);
    provisioned(op, t, next.id);
  }
}

export function status(op) {
  const online = [...op.workers.values()].filter((w) => w.online);
  const busy = online.filter((w) => w.session).length;
  const pending = [...op.sessions.values()].filter((s) => s.state === 'pending').map((s) => s.id);
  return {
    workers_online: online.length,
    workers_busy: busy,
    running: [...op.sessions.values()].filter((s) => s.state === 'running').map((s) => s.id),
    pending,
    wait_banner: pending.length > 0 ? `Waiting for a machine on outpost ${op.name}` : null,
  };
}

export function runScenario(spec) {
  const op = createOutpost(spec.outpost, spec.options);
  const snapshots = [];
  for (const ev of spec.events) {
    const { t } = ev;
    tick(op, t);
    if (ev.op === 'worker_online') workerOnline(op, t, ev.worker);
    else if (ev.op === 'worker_offline') workerOffline(op, t, ev.worker);
    else if (ev.op === 'session') createSession(op, t, ev.id, ev);
    else if (ev.op === 'claim') claim(op, t, ev.worker, ev.id);
    else if (ev.op === 'provision_failed') provisioned(op, t, ev.id, { ok: false });
    else if (ev.op === 'finish') finish(op, t, ev.id);
    else if (ev.op !== 'tick') throw new Error(`unknown op ${ev.op}`);
    if (!ev.manual) dispatch(op, t);
    if (ev.snapshot) snapshots.push({ t, label: ev.snapshot, ...status(op) });
  }
  return { log: op.log, snapshots, final: status(op) };
}

// --- Dockerfile policy --------------------------------------------------------

export const DOCKERFILE_RULES = [
  { id: 'base', why: 'official Devin CLI base image', test: (d) => /public\.ecr\.aws\/e0h8a4b6\/devin-cli:stable/.test(d) },
  { id: 'git', why: 'git installed (required)', test: (d) => /apt-get install[^\n]*(\\\n[^\n]*)*\bgit\b/.test(d) },
  { id: 'ffmpeg', why: 'ffmpeg installed (screen recording)', test: (d) => /\bffmpeg\b/.test(d) },
  { id: 'chrome', why: 'DEVIN_CHROME_PATH points at a real Chrome', test: (d) => /ENV\s+DEVIN_CHROME_PATH=\S+/.test(d) && /google-chrome|chromium/.test(d) },
  { id: 'workspace', why: 'WORKDIR /workspace', test: (d) => /^WORKDIR\s+\/workspace\s*$/m.test(d) },
  { id: 'repo', why: 'repo baked in under repos/', test: (d) => /^(COPY|RUN git clone)[^\n]*\brepos\//m.test(d) },
  { id: 'cmd', why: 'default command is worker start', test: (d) => /CMD\s+\[\s*"worker"\s*,\s*"start"\s*\]/.test(d) },
  { id: 'no-token', why: 'no outpost token baked into the image', test: (d) => !/^(ENV|ARG)\s+DEVIN_OUTPOSTS_TOKEN/m.test(d) && !/--token=\S/.test(d.replace(/^#.*$/gm, '')) },
  { id: 'no-sudo', why: 'no passwordless sudo on a long-lived worker', test: (d) => !/NOPASSWD/.test(d) },
];

export function checkDockerfile(text) {
  const code = text.replace(/^\s*#.*$/gm, '');
  return DOCKERFILE_RULES.map((r) => ({ id: r.id, why: r.why, ok: r.test(code) }));
}

function main(argv) {
  const [cmd, file] = argv;
  if (cmd === 'scenario' && file) {
    const res = runScenario(JSON.parse(readFileSync(file, 'utf8')));
    console.log(res.log.join('\n'));
    for (const s of res.snapshots) console.log(`\n== ${s.label} (t=${s.t}s)\n${JSON.stringify(s, null, 2)}`);
    return 0;
  }
  if (cmd === 'check-dockerfile' && file) {
    const results = checkDockerfile(readFileSync(file, 'utf8'));
    for (const r of results) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.id.padEnd(9)} ${r.why}`);
    return results.every((r) => r.ok) ? 0 : 1;
  }
  console.error('usage: outpost-sim.mjs scenario <fixture.json> | check-dockerfile <Dockerfile>');
  return 2;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exit(main(process.argv.slice(2)));
