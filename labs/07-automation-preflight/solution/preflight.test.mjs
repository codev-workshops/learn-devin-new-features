// Evidence table for lab 07: the reference Preflight replayed through the documented script contract.
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { replay, validateDecision } from '../tools/preflight-replay.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SOLUTION = path.join(HERE, 'preflight.mjs');
const INJ = (n) => path.join(HERE, '..', 'injectors', n);
const tmp = mkdtempSync(path.join(os.tmpdir(), 'lab07-test-'));
const dir = (n) => path.join(tmp, n);
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

describe('lab 07 reference Preflight', () => {
  it('turns 11 notifications into exactly 3 investigations', async () => {
    const s = await replay({ script: SOLUTION, stateDir: dir('full') });
    expect(s.events).toBe(11);
    expect(s.failed).toBe(0);
    expect(s.sessions).toEqual(['paygate:evt_lab07_a@1', 'paygate:evt_lab07_c@1', 'paygate:evt_lab07_a@2']);
    expect(s.stateBytes).toBeLessThan(64 * 1024);
  });

  it('skips transient attempts, recoveries, redelivered notifications, pings and malformed bodies', async () => {
    const s = await replay({ script: SOLUTION, stateDir: dir('reasons') });
    const by = Object.fromEntries(s.results.map((r, i) => [`${i}:${r.event}`, r]));
    expect(by['0:ntf_701'].reason).toMatch(/transient/);
    expect(by['3:ntf_704'].reason).toMatch(/recovered/);
    expect(by['5:ntf_705'].reason).toMatch(/already seen/);
    expect(by['7:ntf_707'].reason).toMatch(/not a delivery/);
    expect(by['8:ntf_708'].reason).toMatch(/already under investigation/);
    expect(by['9:ntf_709'].reason).toMatch(/malformed/);
  });

  it('is idempotent: replaying the same day again opens nothing new', async () => {
    await replay({ script: SOLUTION, stateDir: dir('again') });
    const s = await replay({ script: SOLUTION, stateDir: dir('again') });
    expect(s.sessions).toEqual([]);
  });

  it('treats a manual PayGate replay (new replay_seq) as a new version of the same item', async () => {
    await replay({ script: SOLUTION, stateDir: dir('ver'), only: ['ntf_701', 'ntf_702', 'ntf_705'] });
    const s = await replay({ script: SOLUTION, stateDir: dir('ver'), only: ['ntf_710'] });
    expect(s.sessions).toEqual(['paygate:evt_lab07_a@2']);
  });

  it('the stateless naive script opens one investigation per retry', async () => {
    const s = await replay({ script: INJ('naive-items.mjs'), stateDir: dir('naive') });
    expect(s.sessions.length).toBe(8);
  });

  it('invalid output fails the event and does not save state', async () => {
    const s = await replay({ script: INJ('invalid-output.mjs'), stateDir: dir('invalid'), only: ['ntf_705'] });
    expect(s.failed).toBe(s.events);
    expect(s.results[0].reason).toMatch(/exactly one/);
    expect(s.sessions).toEqual([]);
    const after = await replay({ script: SOLUTION, stateDir: dir('invalid'), only: ['ntf_705'] });
    expect(after.sessions).toEqual(['paygate:evt_lab07_a@1']);
  });

  it('a timeout stops the event before any action', async () => {
    const s = await replay({ script: INJ('slow-preflight.mjs'), stateDir: dir('slow'), only: ['ntf_705'], timeout: 1 });
    expect(s.results[0]).toMatchObject({ status: 'failed', reason: 'timed out after 1 s' });
  });

  it('rejects timeouts outside 1–300 s and caps outside 1–50', async () => {
    await expect(replay({ script: SOLUTION, timeout: 0 })).rejects.toThrow(/1 to 300/);
    await expect(replay({ script: SOLUTION, timeout: 301 })).rejects.toThrow(/1 to 300/);
    await expect(replay({ script: SOLUTION, cap: 51 })).rejects.toThrow(/1 to 50/);
  });

  it('Run now bypasses Preflight and dispatches every event, ping included', async () => {
    const s = await replay({ runNow: true, stateDir: dir('runnow') });
    expect(s.sessions.length).toBe(11);
    expect(s.sessions).toContain('ntf_707');
  });

  it('validates the decision shapes', () => {
    expect(validateDecision('{"run":false,"reason":"x"}', 10).decision).toEqual({ run: false, reason: 'x' });
    expect(validateDecision('{"items":[]}', 10).deferred).toBe(0);
    expect(validateDecision('{"items":[{"id":"a"},{"id":"b"}]}', 1).deferred).toBe(1);
    expect(validateDecision('{"run":"yes"}', 10).error).toMatch(/boolean/);
    expect(validateDecision('', 10).error).toMatch(/not valid JSON/);
    expect(validateDecision('{"items":[{"id":7}]}', 10).error).toMatch(/string/);
  });
});
