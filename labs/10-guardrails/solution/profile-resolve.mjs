#!/usr/bin/env node
// Offline model of Devin security-profile resolution for lab 10, written from
// https://docs.devin.ai/product-guides/security-profiles (fetched 2026-10-22).
//
//   node labs/10-guardrails/solution/profile-resolve.mjs --world <world.json> [--target <name>]
//        [--check host,host] [--grant host] [--then <world2.json>] [--validate]
//
// A world has `profiles`, `bindings` and `targets`. A binding is "inherit", "none"
// or { "profile": "<name>" }. Targets are sessions, child sessions or snapshot builds.
// The resolver prints the effective restrictions as JSON; it never calls Devin.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const GIT_RANK = { 'read-only': 0, full: 1 };

/** Hostname pattern match: `*` matches any run of characters, dots included. */
export function hostMatches(pattern, host) {
  if (/^[0-9.]+\/\d+$/.test(pattern)) return cidrMatches(pattern, host);
  const re = new RegExp('^' + pattern.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$', 'i');
  return re.test(host);
}

function cidrMatches(cidr, host) {
  const [base, bits] = cidr.split('/');
  const toInt = (ip) => ip.split('.').reduce((a, o) => (a << 8) + Number(o), 0) >>> 0;
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(host)) return false;
  const mask = Number(bits) === 0 ? 0 : (~0 << (32 - Number(bits))) >>> 0;
  return (toInt(base) & mask) === (toInt(host) & mask);
}

/** Save-time checks the product applies, plus wildcard warnings the CISO would raise. */
export function validateProfile(name, p) {
  const problems = [];
  const warnings = [];
  if (p.gh_token === 'keep') {
    if (p.git && p.git !== 'full') problems.push(`${name}: keeping the GitHub CLI token requires Full git access`);
    if (Array.isArray(p.network) && !p.network.some((h) => hostMatches(h, 'api.github.com'))) {
      problems.push(`${name}: keeping the GitHub CLI token requires the network policy to allow api.github.com`);
    }
  }
  for (const h of p.network ?? []) {
    if (/[/:]/.test(h) && !/^[0-9.]+\/\d+$/.test(h)) problems.push(`${name}: "${h}" is not a hostname or CIDR (no scheme, port or path)`);
    if (/\*$/.test(h) || /^\*[^.]/.test(h)) warnings.push(`${name}: "${h}" is over-broad — e.g. it also matches "${h.replace(/^\*/, 'evil-').replace(/\*$/, '.evil.example')}"`);
  }
  if (!['mandatory', 'recommended'].includes(p.enforcement)) problems.push(`${name}: enforcement must be mandatory or recommended`);
  return { problems, warnings };
}

/** The binding chain for a target, broadest first. */
export function chainFor(world, targetName) {
  const t = world.targets?.[targetName];
  if (!t) throw new Error(`unknown target "${targetName}"`);
  if (t.kind === 'child') {
    const parent = chainFor(world, t.parent);
    return { levels: parent.levels, inheritedFrom: t.parent, ignoredChildBinding: t.binding && t.binding !== 'inherit' ? t.binding : undefined };
  }
  const b = world.bindings ?? {};
  const levels = [
    ['enterprise default', b.enterprise_default],
    ['organization default', b.org_default],
  ];
  if (t.kind === 'snapshot-build') levels.push(['snapshot builds', b.snapshot_builds]);
  if (t.kind === 'automation-session') {
    levels.push(['automations default', b.automations_default]);
    levels.push([`automation ${t.automation}`, b.automations?.[t.automation]]);
  }
  if (t.kind !== 'snapshot-build') levels.push(['session', t.binding]);
  return { levels: levels.map(([level, binding]) => ({ level, binding: binding ?? 'inherit' })) };
}

/** Resolve the effective restrictions for one target. */
export function resolve(world, targetName) {
  const { levels, inheritedFrom, ignoredChildBinding } = chainFor(world, targetName);
  const profileOf = (binding) => (binding && typeof binding === 'object' ? binding.profile : null);
  const get = (name) => {
    const p = world.profiles?.[name];
    if (!p) throw new Error(`unknown profile "${name}"`);
    return p;
  };
  let winner = -1;
  levels.forEach((l, i) => {
    if (l.binding !== 'inherit') winner = i;
  });
  const notes = [];
  const floors = [];
  levels.forEach((l, i) => {
    const n = profileOf(l.binding);
    if (n && get(n).enforcement === 'mandatory' && i <= winner) floors.push(n);
  });
  const applied = new Set(floors);
  const selected = winner >= 0 ? levels[winner] : null;
  if (selected && profileOf(selected.binding)) applied.add(profileOf(selected.binding));
  if (selected?.binding === 'none' && floors.length) notes.push(`"No profile" at ${selected.level} is ignored: mandatory ${floors.join(', ')} is a floor`);
  if (selected?.binding === 'none' && !floors.length) notes.push(`"No profile" at ${selected.level}: unrestricted`);
  if (ignoredChildBinding) notes.push(`Child of ${inheritedFrom}: governed by the parent's chain; its own selection ${JSON.stringify(ignoredChildBinding)} is not a new level`);
  const names = [...applied];
  const ps = names.map(get);
  const effective = {
    target: targetName,
    profiles: names,
    floors,
    winning_level: selected ? selected.level : 'none (all levels inherit)',
    network: ps.filter((p) => Array.isArray(p.network)).map((p) => p.network),
    mcp: ps.filter((p) => Array.isArray(p.mcp)).map((p) => p.mcp),
    devin_mcp_read_only: ps.some((p) => p.devin_mcp_read_only === true),
    git: ps.reduce((g, p) => (p.git && GIT_RANK[p.git] < GIT_RANK[g] ? p.git : g), 'full'),
    gh_token: ps.some((p) => p.gh_token === 'remove') ? 'removed' : 'kept',
    network_by_profile: Object.fromEntries(names.filter((n) => Array.isArray(get(n).network)).map((n) => [n, get(n).network])),
    floor_network: floors.filter((n) => Array.isArray(get(n).network)).map((n) => get(n).network),
    notes,
  };
  return effective;
}

/** A host is reachable when every network list in force allows it (no list = no network policy). */
export function allowed(effective, host) {
  if (!effective.network.length) return { host, allowed: true, reason: 'no network policy' };
  const blockedBy = effective.profiles.filter((n) => (effective.network_by_profile[n] && !effective.network_by_profile[n].some((p) => hostMatches(p, host))));
  return { host, allowed: blockedBy.length === 0, reason: blockedBy.length ? `not in ${blockedBy.join(', ')}` : 'allowed by every list in force' };
}

/** Approving Devin's request for a host adds it to the session; a mandatory floor clamps the grant. */
export function grant(effective, host) {
  const floorOk = effective.floor_network.every((l) => l.some((p) => hostMatches(p, host)));
  return {
    host,
    granted_in_session: true,
    reachable_after_grant: floorOk,
    reason: floorOk ? 'inside every mandatory floor' : 'clamped: outside a mandatory floor, so the approval has no effect',
  };
}

function main(argv) {
  const opt = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) opt[a.slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }
  if (!opt.world) {
    console.error('usage: profile-resolve.mjs --world <world.json> [--target <name>] [--check h1,h2] [--grant host] [--then <world2.json>] [--validate]');
    return 2;
  }
  const world = JSON.parse(readFileSync(opt.world, 'utf8'));
  const out = {};
  if (opt.validate) {
    out.validation = Object.fromEntries(Object.entries(world.profiles ?? {}).map(([n, p]) => [n, validateProfile(n, p)]));
  }
  const targets = opt.target ? [opt.target] : Object.keys(world.targets ?? {});
  out.targets = targets.map((t) => {
    const eff = resolve(world, t);
    if (opt.check) eff.checks = String(opt.check).split(',').map((h) => allowed(eff, h.trim()));
    if (opt.grant) eff.grant = grant(eff, String(opt.grant));
    if (opt.then) {
      const next = JSON.parse(readFileSync(opt.then, 'utf8'));
      const after = resolve(next, t);
      eff.timeline = {
        running_now: { profiles: eff.profiles, network: eff.network },
        after_next_wake: { profiles: after.profiles, network: after.network },
        note: 'A running session keeps what it resolved at its last boot or wake; new sessions get the new chain immediately',
      };
    }
    return eff;
  });
  console.log(JSON.stringify(out, null, 2));
  return out.validation && Object.values(out.validation).some((v) => v.problems.length) ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));
