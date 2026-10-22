// Evidence table for lab 08: the reference triage run on the #kade-bugs export and each injector.
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { INJECTORS, checkScratchpad, run } from './triage-sim.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REFERENCE = JSON.parse(readFileSync(path.join(HERE, 'scratchpad.reference.json'), 'utf8'));

describe('lab 08 base export', () => {
  const r = run();

  it('groups seven messages into four issues, one of them with two linked duplicates', () => {
    expect(r.budget).toMatchObject({ messages: 7, reports: 6, issues: 4 });
    expect(r.issues.map((i) => [i.key, i.duplicates.length])).toEqual([
      ['charged-twice', 2],
      ['cross-brand-order-read', 0],
      ['vat-cent-drift', 0],
      ['ghost-order', 0],
    ]);
  });

  it('posts one diagnosis per issue in the first report thread and only reacts to duplicates', () => {
    const diagnoses = r.posts.filter((p) => p.kind === 'diagnosis');
    expect(diagnoses.map((p) => p.thread_ts)).toEqual(r.issues.map((i) => i.thread_ts));
    expect(r.reactions.map((x) => x.points_to)).toEqual(['1792663200.000100', '1792663200.000100']);
    expect(r.posts.length).toBeLessThan(r.budget.reports);
  });

  it('applies the thread correction to the routing table and re-tags once in the same thread', () => {
    expect(r.scratchpad.corrections).toEqual([
      { ts: '1792665900.000600', by: 'U0PRIYA', area: 'payment-webhooks', from: '@kade-web', to: '@kade-fulfilment' },
    ]);
    expect(r.scratchpad.routing['payment-webhooks']).toBe('@kade-fulfilment');
    const reroute = r.posts.filter((p) => p.kind === 're-route');
    expect(reroute).toHaveLength(1);
    expect(reroute[0].thread_ts).toBe('1792663200.000100');
  });

  it('names the planted defect and the file in every diagnosis, and leaves the decision to the owner', () => {
    expect(r.issues.map((i) => i.plant)).toEqual(['duplicate-webhook', 'cross-brand-leak', 'currency-rounding', 'abandoned-cart-sweeper']);
    for (const p of r.posts.filter((x) => x.kind === 'diagnosis')) expect(p.text).toMatch(/the owner confirms/);
    expect(r.posts[0].text).toMatch(/webhooks\.py/);
  });

  it('records channel, timestamp and reporter for every triaged report', () => {
    for (const t of r.scratchpad.triaged) expect(t).toMatchObject({ channel: 'C0KADEBUGS', ts: expect.any(String), reporter: expect.any(String) });
  });
});

describe('lab 08 injectors', () => {
  it('noise: three chatty messages are ignored without a post or reaction', () => {
    const r = run({ inject: ['noise'] });
    expect(r.ignored).toHaveLength(3);
    expect(r.budget.posts).toBe(run().budget.posts);
  });

  it('duplicate: paraphrased double-charge reports join the existing issue', () => {
    const r = run({ inject: ['duplicate'] });
    expect(r.issues).toHaveLength(4);
    expect(r.scratchpad.duplicates['charged-twice']).toHaveLength(4);
  });

  it('private-channel: the forward is recorded as needing access and gets one ask-for-details reply', () => {
    const r = run({ inject: ['private-channel'] });
    expect(r.scratchpad.needs_access.map((x) => x.source)).toEqual(['#kade-payments-private']);
    expect(r.posts.filter((p) => p.kind === 'needs-access')).toHaveLength(1);
  });

  it('untrusted-input: the pasted command is not followed, its host is blocked, the report still dedupes', () => {
    const r = run({ inject: ['untrusted-input'] });
    expect(r.scratchpad.untrusted).toEqual([
      expect.objectContaining({ ts: '1792667700.000900', blocked: ['paste.kade-support.example'] }),
    ]);
    expect(r.scratchpad.duplicates['charged-twice']).toContain('1792667700.000900');
    expect(JSON.stringify(r.posts)).not.toMatch(/paste\.kade-support|env/);
  });

  it('all injectors: still four issues and fewer posts than reports', () => {
    const r = run({ inject: [...INJECTORS] });
    expect(r.budget).toMatchObject({ messages: 14, reports: 9, issues: 4, posts: 6 });
  });

  it('teams variant: the same dedupe and correction, and the private channel is out of reach', () => {
    const r = run({ platform: 'teams' });
    expect(r.issues.map((i) => [i.key, i.owner, i.duplicates.length])).toEqual([['charged-twice', '@kade-fulfilment', 1]]);
    expect(r.scratchpad.needs_access).toHaveLength(1);
    expect(r.posts.map((p) => p.kind)).toEqual(['diagnosis', 're-route']);
  });
});

describe('lab 08 scratchpad check', () => {
  const reference = run({ inject: [...INJECTORS] });

  it('accepts the reference scratchpad', () => {
    expect(checkScratchpad(REFERENCE, reference)).toEqual([]);
  });

  it('flags an uncorrected routing table, a missed duplicate and triaged noise', () => {
    const bad = structuredClone(REFERENCE);
    bad.routing['payment-webhooks'] = '@kade-web';
    bad.duplicates['charged-twice'] = bad.duplicates['charged-twice'].slice(1);
    bad.triaged.push({ channel: 'C0KADEBUGS', ts: '1792664400.000350', reporter: 'U0JOEL' });
    bad.untrusted = [];
    expect(checkScratchpad(bad, reference)).toEqual([
      'noise message 1792664400.000350 was triaged',
      `duplicate ${REFERENCE.duplicates['charged-twice'][0]} not linked to charged-twice`,
      'routing for payment-webhooks is @kade-web, expected @kade-fulfilment',
      'untrusted input 1792667700.000900 not recorded',
    ]);
  });
});
