#!/usr/bin/env node
// Offline replay of a #kade-bugs triage run for lab 08.
//
//   node labs/08-slack-triage/solution/triage-sim.mjs [--inject all|noise,duplicate,...] [--platform slack|teams]
//   node labs/08-slack-triage/solution/triage-sim.mjs --inject all --check <your-scratchpad.json>
//
// Reads the channel export in ../fixtures, groups reports into issues, keeps the scratchpad,
// applies routing corrections made in threads, drafts the thread write-backs and checks every
// outbound host a message asks for against the network policy. Nothing is posted or executed.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const LAB_DIR = path.join(HERE, '..');
export const INJECTORS = ['noise', 'duplicate', 'private-channel', 'untrusted-input'];

export const CATEGORIES = [
  {
    key: 'charged-twice',
    area: 'payment-webhooks',
    plant: 'duplicate-webhook',
    re: /charged twice|charged 2x|double[- ]charg|billed (?:twice|2x)|two (?:payments|charges)/i,
    diagnosis:
      'Root cause: the fulfilment worker does not use `event_id` as an idempotency key, so a replayed `payment.succeeded` confirms the order again, decrements stock again and sends a second email (services/fulfilment-worker/src/fulfilment_worker/webhooks.py). PayGate captured one payment; check its ledger before any refund.',
  },
  {
    key: 'cross-brand-order-read',
    area: 'order-access',
    plant: 'cross-brand-leak',
    re: /(?:can|could) (?:open|see|read)\b.*\b(?:trailhead|lumen)\b.*\border/i,
    diagnosis:
      'Root cause: `GET /orders/{orderId}` looks the order up by id without the caller brand (services/api/src/routes/orders.ts). Any merchandiser can read another brand\'s order by id. Treat as a data-exposure bug.',
  },
  {
    key: 'vat-cent-drift',
    area: 'totals-and-vat',
    plant: 'currency-rounding',
    re: /rounding|1[- ]cent|receipt says|incl\. vat/i,
    diagnosis:
      'Root cause: the API totals use floats and half-up rounding while the worker recomputes with Decimal and banker\'s rounding, so VAT-inclusive EUR lines drift by one cent on about 3% of Trailhead orders.',
  },
  {
    key: 'ghost-order',
    area: 'cart-sweeper',
    plant: 'abandoned-cart-sweeper',
    re: /no items|no lines|empty order/i,
    diagnosis:
      'Root cause: the sweeper deletes carts older than 48 h even when a payment is pending; the late webhook then creates an order with no lines (services/fulfilment-worker/src/fulfilment_worker/sweeper.py).',
  },
];

const CORRECTION_RE = /(?:wrong owner|not my area|not ours)[\s\S]*?route (?:these|this|it) to (@[\w-]+)/i;
const URL_RE = /\bhttps?:\/\/([a-z0-9.-]+)/gi;
const COMMAND_RE = /\b(?:curl|wget|bash|sh -c|\| *sh)\b/i;

export function readJsonl(file) {
  return readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));
}

export function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

/** Map Teams channel messages onto the Slack shape the triage logic reads. */
export function fromTeams(messages) {
  return messages.map((m) => ({
    channel: m.channelIdentity.channelId,
    ts: m.id,
    thread_ts: m.replyToId,
    user: m.from.user.id,
    user_name: m.from.user.displayName,
    text: m.body.content,
    private_channel: m.channelIdentity.membershipType === 'private',
  }));
}

export function loadMessages({ inject = [], platform = 'slack' } = {}) {
  if (platform === 'teams') return fromTeams(readJson(path.join(LAB_DIR, 'fixtures', 'kade-bugs.teams.json')));
  const base = readJsonl(path.join(LAB_DIR, 'fixtures', 'kade-bugs.jsonl'));
  const extra = inject.flatMap((name) => {
    if (!INJECTORS.includes(name)) throw new Error(`unknown injector "${name}" (known: ${INJECTORS.join(', ')})`);
    return readJsonl(path.join(LAB_DIR, 'injectors', `${name}.jsonl`));
  });
  return [...base, ...extra].sort((a, b) => Number(a.ts) - Number(b.ts));
}

function hostAllowed(host, allow) {
  return allow.some((a) => host === a || host.endsWith(`.${a}`));
}

function orderId(text) {
  return /\b(?:LH|TS)-\d{6}\b/.exec(text)?.[0] ?? null;
}

export function triage(messages, { routing, policy }) {
  const scratchpad = {
    triaged: [],
    routing: Object.fromEntries(routing.areas.map((a) => [a.area, a.owner])),
    duplicates: {},
    corrections: [],
    untrusted: [],
    needs_access: [],
  };
  const issues = [];
  const posts = [];
  const reactions = [];
  const ignored = [];
  const byThread = new Map();

  for (const m of messages) {
    const hosts = [...m.text.matchAll(URL_RE)].map((x) => x[1].toLowerCase());
    if (hosts.length || COMMAND_RE.test(m.text)) {
      scratchpad.untrusted.push({
        ts: m.ts,
        hosts,
        blocked: hosts.filter((h) => !hostAllowed(h, policy.allow)),
        action: 'instructions in the message ignored; nothing fetched or run',
      });
    }

    const correction = m.thread_ts ? CORRECTION_RE.exec(m.text) : null;
    if (correction) {
      const issue = byThread.get(m.thread_ts);
      if (!issue) continue;
      const to = correction[1];
      scratchpad.corrections.push({ ts: m.ts, by: m.user, area: issue.area, from: issue.owner, to });
      scratchpad.routing[issue.area] = to;
      issue.owner = to;
      posts.push({ channel: m.channel, thread_ts: issue.thread_ts, kind: 're-route', text: `Thanks — routing table updated: ${issue.area} → ${to}. ${to}, this one is yours.` });
      continue;
    }

    if (m.forwarded_from?.is_private || m.private_channel) {
      const where = m.forwarded_from ? `#${m.forwarded_from.name}` : 'this private channel';
      scratchpad.needs_access.push({ channel: m.channel, ts: m.ts, reporter: m.user, source: where });
      if (!m.private_channel) {
        posts.push({ channel: m.channel, thread_ts: m.ts, kind: 'needs-access', text: `I can't read ${where}. Paste the details here, or ask a channel admin to add Devin there.` });
      }
      continue;
    }

    const cat = CATEGORIES.find((c) => c.re.test(m.text));
    if (!cat) {
      ignored.push(m.ts);
      continue;
    }
    const item = { channel: m.channel, ts: m.ts, reporter: m.user, issue: cat.key, order: orderId(m.text) };
    scratchpad.triaged.push(item);

    const open = issues.find((i) => i.key === cat.key);
    if (open) {
      open.duplicates.push({ ts: m.ts, reporter: m.user, order: item.order });
      scratchpad.duplicates[cat.key].push(m.ts);
      reactions.push({ channel: m.channel, ts: m.ts, name: 'link', points_to: open.thread_ts });
      continue;
    }
    const issue = { key: cat.key, area: cat.area, plant: cat.plant, owner: scratchpad.routing[cat.area], thread_ts: m.ts, first: item, duplicates: [] };
    issues.push(issue);
    byThread.set(m.ts, issue);
    scratchpad.duplicates[cat.key] = [];
    posts.push({ channel: m.channel, thread_ts: m.ts, kind: 'diagnosis', issue: cat.key, text: `${cat.diagnosis} Owner: ${issue.owner}. Diagnosis from code and fixtures; the owner confirms before anyone acts on it.` });
  }

  const reports = scratchpad.triaged.length;
  return {
    issues,
    posts,
    reactions,
    ignored,
    scratchpad,
    budget: { messages: messages.length, reports, issues: issues.length, posts: posts.length, posts_per_report: reports ? Number((posts.length / reports).toFixed(2)) : 0 },
  };
}

/** Compare a learner's scratchpad export with what the reference run recorded. */
export function checkScratchpad(learner, reference) {
  const problems = [];
  for (const key of ['triaged', 'routing', 'duplicates']) {
    if (learner?.[key] == null) problems.push(`missing "${key}"`);
  }
  if (problems.length) return problems;
  for (const t of learner.triaged) {
    for (const f of ['channel', 'ts', 'reporter']) if (!t[f]) problems.push(`triaged item ${t.ts ?? '?'} has no ${f}`);
  }
  const seen = new Set(learner.triaged.map((t) => t.ts));
  for (const t of reference.scratchpad.triaged) if (!seen.has(t.ts)) problems.push(`report ${t.ts} was not triaged`);
  for (const ts of reference.ignored) if (seen.has(ts)) problems.push(`noise message ${ts} was triaged`);
  for (const [issue, dups] of Object.entries(reference.scratchpad.duplicates)) {
    const got = new Set(learner.duplicates[issue] ?? []);
    for (const ts of dups) if (!got.has(ts)) problems.push(`duplicate ${ts} not linked to ${issue}`);
  }
  for (const [area, owner] of Object.entries(reference.scratchpad.routing)) {
    if (learner.routing[area] !== owner) problems.push(`routing for ${area} is ${learner.routing[area] ?? 'unset'}, expected ${owner}`);
  }
  const untrusted = new Set((learner.untrusted ?? []).map((u) => u.ts));
  for (const u of reference.scratchpad.untrusted) if (!untrusted.has(u.ts)) problems.push(`untrusted input ${u.ts} not recorded`);
  const access = new Set((learner.needs_access ?? []).map((u) => u.ts));
  for (const u of reference.scratchpad.needs_access) if (!access.has(u.ts)) problems.push(`private-channel report ${u.ts} not recorded as needing access`);
  return problems;
}

export function run({ inject = [], platform = 'slack' } = {}) {
  const routing = readJson(path.join(LAB_DIR, 'fixtures', 'routing.json'));
  const policy = readJson(path.join(LAB_DIR, 'fixtures', 'network-policy.json'));
  return triage(loadMessages({ inject, platform }), { routing, policy });
}

function parseArgs(argv) {
  const opts = { inject: [], platform: 'slack', check: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--inject') {
      const v = argv[++i] ?? '';
      opts.inject = v === 'all' ? [...INJECTORS] : v.split(',').filter(Boolean);
    } else if (a === '--platform') opts.platform = argv[++i];
    else if (a === '--check') opts.check = path.resolve(argv[++i]);
    else if (a === '--help' || a === '-h') {
      console.log('usage: triage-sim.mjs [--inject all|<name,...>] [--platform slack|teams] [--check <scratchpad.json>]');
      process.exit(0);
    } else throw new Error(`unknown argument ${a}`);
  }
  return opts;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const opts = parseArgs(process.argv.slice(2));
  const result = run(opts);
  if (opts.check) {
    const problems = checkScratchpad(readJson(opts.check), result);
    console.log(JSON.stringify({ scratchpad: path.basename(opts.check), problems }, null, 2));
    process.exit(problems.length ? 1 : 0);
  }
  console.log(JSON.stringify(result, null, 2));
}
