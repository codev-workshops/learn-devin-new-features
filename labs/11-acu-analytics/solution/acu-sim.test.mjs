// Evidence table for lab 11: the two simulated limit decisions and the dashboard-total puzzle.
import { describe, expect, it } from 'vitest';
import { EMPTY_CYCLE, applyOptions, check, cycleFor, loadFixture, parseArgs, resolveTier, scenario, views } from '../tools/acu-sim.mjs';

const fx = loadFixture();
const run = (name, argv = []) => scenario(fx, name, parseArgs(argv));

describe('decision A — Trailhead lead under her tier, organization capped', () => {
  it('is blocked by the organization limit only', () => {
    const r = run('A');
    expect(r.user).toMatchObject({ counted: 180, limit: 400, blocked: false });
    expect(r.organization).toMatchObject({ total: 3000, limit: 3000, blocked: true });
    expect(r.blockedBy).toEqual(['organization limit']);
  });

  it('a per-member override does not lift the organization limit', () => {
    expect(run('A', ['--override', 'mira=600']).blockedBy).toEqual(['organization limit']);
  });

  it('raising the organization limit to 4000 survives the sale forecast', () => {
    const r = run('A', ['--raise-org', 'kade-trailhead=4000', '--inject', 'sale-spike', '--date', '2026-11-20']);
    expect(r.organization.total).toBe(3900);
    expect(r.allowed).toBe(true);
  });

  it('waiting for the reset is not an option: the window resets on the 23rd, after the sale', () => {
    expect(cycleFor(fx, '2026-11-20')).toEqual({ start: '2026-10-23', end: '2026-11-22' });
    expect(cycleFor(fx, '2026-11-23').start).toBe('2026-11-23');
    expect(run('A', ['--date', '2026-11-19', '--inject', 'sale-spike']).allowed).toBe(false);
  });
});

describe('decision B — Lumen engineer over his tier, organization has headroom', () => {
  it('is blocked by the per-user limit; local counts, Devin Review does not', () => {
    const r = run('B');
    expect(r.user).toMatchObject({ cloud: 250, local: 160, review: 90, counted: 410, limit: 400, blocked: true });
    expect(r.organization.blocked).toBe(false);
    expect(r.blockedBy).toEqual(['per-user limit']);
    expect(run('B', ['--inject', 'review-storm']).user.counted).toBe(410);
  });

  it('explicit assignment beats the higher-priority IdP tier until it is removed', () => {
    const arjun = (f) => f.members.find((m) => m.handle === 'arjun');
    expect(resolveTier(fx, arjun(fx)).tier.id).toBe('brand-eng');
    const un = applyOptions(fx, parseArgs(['--unassign', 'arjun']));
    expect(resolveTier(un, arjun(un)).tier.allocation).toBe(800);
    expect(run('B', ['--unassign', 'arjun']).allowed).toBe(true);
  });

  it('a temporary override unblocks until the cycle ends, then expires', () => {
    expect(run('B', ['--override', 'arjun=520']).allowed).toBe(true);
    const later = applyOptions(fx, parseArgs(['--override', 'arjun=520', '--date', '2026-11-23']));
    expect(check(later, 'arjun', 'kade-lumen').user.limit).toBe(400);
  });
});

describe('why the dashboards disagree', () => {
  it('enterprise total, org totals, cloud-only and local numbers differ by scope', () => {
    const v = views(applyOptions(fx, {}), 'cycle');
    expect(v.enterprise_consumption_total).toBe(8870);
    const th = v.orgs.find((o) => o.org === 'kade-trailhead');
    expect(th).toEqual({ org: 'kade-trailhead', overview_all_surfaces: 3000, cloud_tab: 2180, local_tab: 400, review: 420 });
  });

  it('a rolling 30-day range includes the previous cycle tail', () => {
    const v = views(applyOptions(fx, {}), 'last-30');
    expect(v.orgs.find((o) => o.org === 'kade-trailhead').overview_all_surfaces).toBe(3210);
  });

  it('local usage follows the billing organization', () => {
    const before = views(applyOptions(fx, {}), 'cycle').orgs.find((o) => o.org === 'kade-platform').local_tab;
    const after = views(applyOptions(fx, parseArgs(['--billing-org', 'noor=kade-trailhead'])), 'cycle');
    expect(before).toBe(420);
    expect(after.orgs.find((o) => o.org === 'kade-platform').local_tab).toBe(300);
    expect(after.orgs.find((o) => o.org === 'kade-trailhead').local_tab).toBe(520);
  });

  it('a range before the contract started has no billing cycle', () => {
    expect(views(applyOptions(fx, {}), '2026-03-01..2026-04-15').empty).toBe(EMPTY_CYCLE);
  });
});
