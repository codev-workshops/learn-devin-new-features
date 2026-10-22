#!/usr/bin/env node
// Lab 11 offline ACU limit and analytics simulator. Reads fixtures/kade-consumption.json
// and applies the documented rules (docs.devin.ai, fetched 2026-10-22):
//   * organization limit: cloud sessions, Devin Review and local usage (Desktop, CLI,
//     JetBrains) billed to the org, per monthly billing window;
//   * per-user limit: local + cloud share one cap, Devin Review excluded, resets on the
//     contract's billing-cycle day; tier = explicit > highest-priority IdP group > default;
//   * either limit blocks new work; raising one never lifts the other;
//   * local usage counts toward the user's billing org (first accessible org if unset).
//
//   node labs/11-acu-analytics/tools/acu-sim.mjs --scenario A|B [options]
//   node labs/11-acu-analytics/tools/acu-sim.mjs --check <handle> [--org <org>] [options]
//   node labs/11-acu-analytics/tools/acu-sim.mjs --views [--range cycle|last-30|YYYY-MM-DD..YYYY-MM-DD]
//
// Options (repeatable where it makes sense):
//   --date YYYY-MM-DD           evaluate on this day (default: fixture "today")
//   --raise-org <org>=<acu>     set an organization limit (enterprise admin)
//   --override <h>=<acu>[:temporary|:permanent]   per-member override (default temporary)
//   --assign <h>=<tier>         explicit tier assignment (clears any override)
//   --unassign <h>              remove the explicit tier (IdP mapping / default applies)
//   --billing-org <h>=<org>     assign a member's billing organization
//   --inject sale-spike|review-storm
//   --json                      machine-readable output
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const FIXTURE = path.join(HERE, '..', 'fixtures', 'kade-consumption.json');
export const EMPTY_CYCLE = 'No billing cycle covers the selected period';

export function loadFixture(file = FIXTURE) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

const day = (s) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s ?? '')) throw new Error(`not a YYYY-MM-DD date: ${s}`);
  return Date.parse(`${s}T00:00:00Z`);
};
const addDays = (s, n) => new Date(day(s) + n * 86400000).toISOString().slice(0, 10);

/** Billing cycle containing `date`, or null before the contract started. */
export function cycleFor(fx, date) {
  if (day(date) < day(fx.contract_start)) return null;
  const d = new Date(day(date));
  let y = d.getUTCFullYear();
  let m = d.getUTCMonth();
  if (d.getUTCDate() < fx.billing_cycle_day) m -= 1;
  const start = new Date(Date.UTC(y, m, fx.billing_cycle_day));
  const end = new Date(Date.UTC(y, m + 1, fx.billing_cycle_day - 1));
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

/** Apply option flags to a deep copy of the fixture. */
export function applyOptions(fixture, opts = {}) {
  const fx = structuredClone(fixture);
  fx.date = opts.date ?? fx.today;
  fx.applied = [];
  const member = (h) => {
    const m = fx.members.find((x) => x.handle === h);
    if (!m) throw new Error(`unknown member: ${h}`);
    return m;
  };
  const org = (id) => {
    const o = fx.orgs.find((x) => x.id === id);
    if (!o) throw new Error(`unknown organization: ${id}`);
    return o;
  };
  for (const [id, acu] of opts.raiseOrg ?? []) {
    org(id).limit = acu;
    fx.applied.push(`organization limit ${id} = ${acu ?? 'none'}`);
  }
  for (const h of opts.unassign ?? []) {
    member(h).explicit_tier = null;
    fx.applied.push(`explicit tier removed for ${h}`);
  }
  for (const [h, tier] of opts.assign ?? []) {
    if (!fx.tiers.some((t) => t.id === tier)) throw new Error(`unknown tier: ${tier}`);
    Object.assign(member(h), { explicit_tier: tier, override: null });
    fx.applied.push(`${h} assigned to tier ${tier} (override cleared)`);
  }
  for (const [h, acu, kind] of opts.override ?? []) {
    member(h).override = { acu, kind, expires: kind === 'temporary' ? cycleFor(fx, fx.today).end : null };
    fx.applied.push(`${kind} override ${h} = ${acu}`);
  }
  for (const [h, id] of opts.billingOrg ?? []) {
    org(id);
    member(h).billing_org = id;
    fx.applied.push(`billing organization of ${h} = ${id}`);
  }
  for (const name of opts.inject ?? []) {
    if (name === 'sale-spike') {
      fx.usage.push({ member: 'rest-trailhead', surface: 'cloud', org: fx.sale.org, period: 'sale', from: fx.sale.start, acu: fx.sale.forecast_cloud_acu });
      fx.applied.push(`injector sale-spike: +${fx.sale.forecast_cloud_acu} cloud ACU in ${fx.sale.org} from ${fx.sale.start}`);
    } else if (name === 'review-storm') {
      fx.usage.push({ member: 'arjun', surface: 'review', org: 'kade-lumen', period: 'cycle', acu: 300 });
      fx.applied.push('injector review-storm: +300 Devin Review ACU on arjun\'s PRs in kade-lumen');
    } else throw new Error(`unknown injector: ${name}`);
  }
  return fx;
}

/** Billing org: explicit assignment, else the first organization the member can access. */
export function billingOrg(fx, m) {
  return m.billing_org ?? m.orgs[0];
}

/** Org a usage row is billed to. */
export function rowOrg(fx, row) {
  if (row.surface === 'local') return billingOrg(fx, fx.members.find((m) => m.handle === row.member));
  return row.org;
}

/** Rows counted in the billing window that contains fx.date. */
export function rowsInWindow(fx) {
  const cyc = cycleFor(fx, fx.date);
  if (!cyc || cyc.start !== fx.cycle.start) return []; // a later window starts empty
  return fx.usage.filter((r) => r.period === 'cycle' || (r.period === 'sale' && day(fx.date) >= day(r.from)));
}

export function resolveTier(fx, m) {
  const byId = Object.fromEntries(fx.tiers.map((t) => [t.id, t]));
  if (m.explicit_tier) return { tier: byId[m.explicit_tier], source: 'explicit assignment' };
  const mapped = fx.idp_mappings.filter((x) => m.groups.includes(x.group)).map((x) => byId[x.tier]);
  if (mapped.length) {
    const best = mapped.sort((a, b) => a.priority - b.priority)[0];
    const group = fx.idp_mappings.find((x) => x.tier === best.id && m.groups.includes(x.group)).group;
    return { tier: best, source: `IdP group ${group} (priority ${best.priority})` };
  }
  return { tier: fx.tiers.find((t) => t.default), source: 'default tier' };
}

export function memberLimit(fx, m) {
  const { tier, source } = resolveTier(fx, m);
  const o = m.override;
  const live = o && (o.kind === 'permanent' || day(fx.date) <= day(o.expires));
  if (live) return { limit: o.acu, source: `${o.kind} override${o.expires ? ` until ${o.expires}` : ''} (tier ${tier.name})`, tier };
  return { limit: tier.allocation, source: `tier ${tier.name} via ${source}`, tier };
}

export function memberUsage(fx, handle) {
  const out = { cloud: 0, local: 0, review: 0 };
  for (const r of rowsInWindow(fx)) if (r.member === handle) out[r.surface] += r.acu;
  return { ...out, counted: out.cloud + out.local };
}

export function orgUsage(fx, id) {
  const out = { cloud: 0, local: 0, review: 0 };
  for (const r of rowsInWindow(fx)) if (rowOrg(fx, r) === id) out[r.surface] += r.acu;
  return { ...out, total: out.cloud + out.local + out.review };
}

/** Can `handle` start new work billed to `orgId` on fx.date? */
export function check(fx, handle, orgId) {
  const m = fx.members.find((x) => x.handle === handle);
  if (!m) throw new Error(`unknown member: ${handle}`);
  const target = orgId ?? m.orgs[m.orgs.length - 1];
  const org = fx.orgs.find((o) => o.id === target);
  const u = memberUsage(fx, handle);
  const lim = memberLimit(fx, m);
  const ou = orgUsage(fx, target);
  const userBlocked = lim.limit != null && u.counted >= lim.limit;
  const orgBlocked = org.limit != null && ou.total >= org.limit;
  const blockedBy = [userBlocked && 'per-user limit', orgBlocked && 'organization limit'].filter(Boolean);
  return {
    date: fx.date,
    window: cycleFor(fx, fx.date),
    member: handle,
    org: target,
    user: { ...u, limit: lim.limit, source: lim.source, blocked: userBlocked },
    organization: { ...ou, limit: org.limit, blocked: orgBlocked },
    allowed: blockedBy.length === 0,
    blockedBy,
    applied: fx.applied,
  };
}

/** What each analytics view would total for a date range (simulated, see answer.md). */
export function views(fx, range = 'cycle') {
  let from;
  let to;
  if (range === 'cycle') [from, to] = [fx.cycle.start, fx.today];
  else if (range === 'last-30') [from, to] = [addDays(fx.today, -29), fx.today];
  else {
    const m = /^(\d{4}-\d{2}-\d{2})\.\.(\d{4}-\d{2}-\d{2})$/.exec(range);
    if (!m) throw new Error(`bad --range: ${range}`);
    [from, to] = [m[1], m[2]];
  }
  if (day(to) < day(fx.contract_start)) return { range: { from, to }, empty: EMPTY_CYCLE };
  const periods = new Set();
  if (day(from) <= day(fx.today) && day(to) >= day(fx.cycle.start)) periods.add('cycle');
  if (day(from) <= day(fx.pre_cycle_tail.end) && day(to) >= day(fx.pre_cycle_tail.start)) periods.add('pre-cycle-tail');
  const rows = fx.usage.filter((r) => periods.has(r.period));
  const sum = (pred) => rows.filter(pred).reduce((a, r) => a + r.acu, 0);
  const orgs = fx.orgs.map((o) => {
    const mine = (r) => rowOrg(fx, r) === o.id;
    return {
      org: o.id,
      overview_all_surfaces: sum(mine),
      cloud_tab: sum((r) => mine(r) && r.surface === 'cloud'),
      local_tab: sum((r) => mine(r) && r.surface === 'local'),
      review: sum((r) => mine(r) && r.surface === 'review'),
    };
  });
  const people = fx.members
    .filter((m) => !m.aggregate)
    .map((m) => ({
      member: m.handle,
      my_analytics: {
        cloud: sum((r) => r.member === m.handle && r.surface === 'cloud'),
        local: sum((r) => r.member === m.handle && r.surface === 'local'),
        review: sum((r) => r.member === m.handle && r.surface === 'review'),
      },
      limit_meter_this_cycle: memberUsage({ ...fx, date: fx.today }, m.handle).counted,
    }));
  return { range: { from, to }, enterprise_consumption_total: sum(() => true), orgs, people };
}

export function scenario(fixture, name, opts = {}) {
  const fx = applyOptions(fixture, opts);
  if (name === 'A') return check(fx, 'mira', 'kade-trailhead');
  if (name === 'B') return check(fx, 'arjun', 'kade-lumen');
  throw new Error(`unknown scenario: ${name} (A or B)`);
}

// ---------------------------------------------------------------------------
// CLI

function pair(v, flag) {
  const m = /^([a-z0-9-]+)=(.+)$/.exec(v ?? '');
  if (!m) throw new Error(`${flag} expects key=value`);
  return [m[1], m[2]];
}

export function parseArgs(argv) {
  const o = { raiseOrg: [], override: [], assign: [], unassign: [], billingOrg: [], inject: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--scenario') o.scenario = next();
    else if (a === '--check') o.check = next();
    else if (a === '--org') o.org = next();
    else if (a === '--views') o.views = true;
    else if (a === '--range') o.range = next();
    else if (a === '--date') o.date = next();
    else if (a === '--json') o.json = true;
    else if (a === '--raise-org') {
      const [k, v] = pair(next(), a);
      o.raiseOrg.push([k, v === 'none' ? null : Number(v)]);
    } else if (a === '--override') {
      const [k, v] = pair(next(), a);
      const [acu, kind = 'temporary'] = v.split(':');
      if (!['temporary', 'permanent'].includes(kind)) throw new Error('--override kind is temporary or permanent');
      o.override.push([k, Number(acu), kind]);
    } else if (a === '--assign') o.assign.push(pair(next(), a));
    else if (a === '--unassign') o.unassign.push(next());
    else if (a === '--billing-org') o.billingOrg.push(pair(next(), a));
    else if (a === '--inject') o.inject.push(next());
    else if (a === '--help' || a === '-h') o.help = true;
    else throw new Error(`unknown argument: ${a}`);
  }
  return o;
}

function printCheck(r) {
  const L = [];
  L.push(`date ${r.date} · billing window ${r.window ? `${r.window.start} → ${r.window.end}` : 'none'}`);
  for (const a of r.applied) L.push(`applied: ${a}`);
  const u = r.user;
  L.push(`per-user  ${r.member}: ${u.counted} of ${u.limit ?? '∞'} ACU (cloud ${u.cloud} + local ${u.local}; review ${u.review} not counted) — ${u.source}${u.blocked ? ' — LIMIT REACHED' : ''}`);
  const g = r.organization;
  L.push(`org       ${r.org}: ${g.total} of ${g.limit ?? '∞'} ACU (cloud ${g.cloud} + local ${g.local} + review ${g.review})${g.blocked ? ' — LIMIT REACHED' : ''}`);
  L.push(`RESULT: member=${r.member} org=${r.org} ${r.allowed ? 'allowed' : `blocked by ${r.blockedBy.join(' and ')}`}`);
  return L.join('\n');
}

function printViews(v) {
  if (v.empty) return `range ${v.range.from} → ${v.range.to}\n${v.empty}`;
  const L = [`range ${v.range.from} → ${v.range.to} (simulated views — compare with your tenant's screenshots)`];
  L.push(`Enterprise Consumption total: ${v.enterprise_consumption_total} ACU`);
  L.push('org               overview  cloud  local  review');
  for (const o of v.orgs) L.push(`${o.org.padEnd(16)} ${String(o.overview_all_surfaces).padStart(9)} ${String(o.cloud_tab).padStart(6)} ${String(o.local_tab).padStart(6)} ${String(o.review).padStart(7)}`);
  L.push('member   my-analytics cloud/local/review   limit meter (this cycle, cloud+local)');
  for (const p of v.people) L.push(`${p.member.padEnd(8)} ${`${p.my_analytics.cloud}/${p.my_analytics.local}/${p.my_analytics.review}`.padEnd(32)} ${p.limit_meter_this_cycle}`);
  return L.join('\n');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const o = parseArgs(process.argv.slice(2));
    if (o.help || (!o.scenario && !o.check && !o.views)) {
      console.log('usage: acu-sim.mjs --scenario A|B | --check <handle> [--org <org>] | --views [--range …]  (see header for options)');
      process.exit(o.help ? 0 : 2);
    }
    const fixture = loadFixture();
    let out;
    if (o.views) out = views(applyOptions(fixture, o), o.range ?? 'cycle');
    else if (o.scenario) out = scenario(fixture, o.scenario, o);
    else out = check(applyOptions(fixture, o), o.check, o.org);
    console.log(o.json ? JSON.stringify(out, null, 2) : o.views ? printViews(out) : printCheck(out));
  } catch (err) {
    console.error(`acu-sim: ${err.message}`);
    process.exit(2);
  }
}
