// Evidence table for lab 10: the reference policy matrix and each injector, read through profile-resolve.mjs.
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { allowed, grant, hostMatches, resolve, validateProfile } from './profile-resolve.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const load = (p) => JSON.parse(readFileSync(path.join(HERE, p), 'utf8'));
const WORLD = load('harbourline-guardrails.json');
const can = (eff, host) => allowed(eff, host).allowed;

describe('lab 10 reference policy matrix', () => {
  it('saves cleanly', () => {
    for (const [n, p] of Object.entries(WORLD.profiles)) expect(validateProfile(n, p).problems).toEqual([]);
  });

  it('lets a normal session reach the package registry and the PayGate sandbox and nothing else', () => {
    const eff = resolve(WORLD, 'dev-session');
    expect(eff.profiles).toEqual(['harbourline-floor', 'harbourline-dev']);
    expect(can(eff, 'registry.npmjs.org')).toBe(true);
    expect(can(eff, 'api.sandbox.paygate.example')).toBe(true);
    for (const h of ['api.paygate.example', 'pypi.org', 'api.github.com', 'example.com']) expect(can(eff, h)).toBe(false);
    expect(eff.mcp).toEqual([[]]);
    expect(eff.gh_token).toBe('removed');
    expect(eff.git).toBe('full');
  });

  it('ignores a session opt-out under the mandatory floor', () => {
    const eff = resolve(WORLD, 'opt-out-session');
    expect(eff.profiles).toEqual(['harbourline-floor']);
    expect(can(eff, 'example.com')).toBe(false);
    expect(eff.notes[0]).toMatch(/ignored/);
  });

  it('honours the same opt-out when the floor is only recommended', () => {
    const eff = resolve(load('../injectors/recommended-floor.json'), 'opt-out-session');
    expect(eff.profiles).toEqual([]);
    expect(can(eff, 'example.com')).toBe(true);
    expect(eff.gh_token).toBe('kept');
  });

  it('gives an automation run the stricter default intersected with the floor', () => {
    const eff = resolve(WORLD, 'webhook-triage-run');
    expect(eff.git).toBe('read-only');
    expect(eff.devin_mcp_read_only).toBe(true);
    expect(can(eff, 'registry.npmjs.org')).toBe(true);
    expect(can(eff, 'api.sandbox.paygate.example')).toBe(false);
  });

  it('governs a child session by the parent chain', () => {
    const child = resolve(WORLD, 'child-of-dev');
    const parent = resolve(WORLD, 'dev-session');
    expect(child.profiles).toEqual(parent.profiles);
    expect(can(child, 'example.com')).toBe(false);
    const looseChild = resolve(load('../injectors/recommended-floor.json'), 'child-of-dev');
    expect(looseChild.profiles).toEqual(['harbourline-dev']);
  });

  it('runs snapshot builds under the same floor, so the Python install is blocked', () => {
    const eff = resolve(WORLD, 'snapshot-build');
    expect(can(eff, 'registry.npmjs.org')).toBe(true);
    expect(can(eff, 'pypi.org')).toBe(false);
    expect(can(eff, 'files.pythonhosted.org')).toBe(false);
  });

  it('clamps a mid-session approval to the floor', () => {
    const eff = resolve(WORLD, 'dev-session');
    expect(grant(eff, 'cdn.playwright.dev').reachable_after_grant).toBe(false);
    expect(grant(eff, 'api.sandbox.paygate.example').reachable_after_grant).toBe(true);
  });

  it('keeps the old floor in a running session until it wakes', () => {
    const before = resolve(WORLD, 'dev-session');
    const after = resolve(load('../injectors/floor-tightened.json'), 'dev-session');
    expect(can(before, 'webhooks.sandbox.paygate.example')).toBe(true);
    expect(can(after, 'webhooks.sandbox.paygate.example')).toBe(false);
    expect(can(after, 'api.sandbox.paygate.example')).toBe(true);
  });
});

describe('lab 10 injectors', () => {
  it('rejects keeping the GitHub CLI token without api.github.com or Full git', () => {
    const w = load('../injectors/gh-token-keep.json');
    expect(validateProfile('harbourline-gh', w.profiles['harbourline-gh']).problems[0]).toMatch(/api\.github\.com/);
    expect(validateProfile('harbourline-gh-readonly', w.profiles['harbourline-gh-readonly']).problems[0]).toMatch(/Full git/);
  });

  it('flags the hurried wildcards and the URL entry', () => {
    const w = load('../injectors/broad-wildcard.json');
    const v = validateProfile('harbourline-floor-draft', w.profiles['harbourline-floor-draft']);
    expect(v.problems).toHaveLength(1);
    expect(v.warnings).toHaveLength(2);
    expect(hostMatches('registry.npmjs.org*', 'registry.npmjs.org.evil.example')).toBe(true);
    expect(hostMatches('*paygate.example', 'evilpaygate.example')).toBe(true);
    expect(hostMatches('*.sandbox.paygate.example', 'evilsandbox.paygate.example')).toBe(false);
  });

  it('matches CIDR entries', () => {
    expect(hostMatches('10.20.0.0/16', '10.20.3.4')).toBe(true);
    expect(hostMatches('10.20.0.0/16', '10.21.3.4')).toBe(false);
  });

  it('rejects malformed CIDR entries instead of matching through bitwise coercion', () => {
    const base = { enforcement: 'recommended', git: 'full' };
    for (const bad of ['10.0.0.0/40', '10.0.0.300/16', '999.1.1.1/8']) {
      expect(validateProfile('bad', { ...base, network: [bad] }).problems[0]).toMatch(/not a valid IPv4 CIDR/);
      expect(hostMatches(bad, '10.0.0.1')).toBe(false);
    }
    expect(validateProfile('ok', { ...base, network: ['10.20.0.0/16', '0.0.0.0/0'] }).problems).toEqual([]);
  });

  it('rejects a mandatory floor that omits its network or MCP allowlist', () => {
    const floor = { enforcement: 'mandatory', git: 'full', network: ['registry.npmjs.org'], mcp: [] };
    expect(validateProfile('f', floor).problems).toEqual([]);
    const { network: _n, ...noNetwork } = floor;
    const { mcp: _m, ...noMcp } = floor;
    expect(validateProfile('f', noNetwork).problems[0]).toMatch(/network allowlist/);
    expect(validateProfile('f', noMcp).problems[0]).toMatch(/mcp allowlist/);
    expect(validateProfile('r', { ...noMcp, enforcement: 'recommended' }).problems).toEqual([]);
  });
});
