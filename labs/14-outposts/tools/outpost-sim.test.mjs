import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkDockerfile, runScenario } from './outpost-sim.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const lab = join(here, '..');
const repo = join(lab, '..', '..');
const load = (p) => JSON.parse(readFileSync(join(lab, p), 'utf8'));
const failing = (p) => checkDockerfile(readFileSync(p, 'utf8')).filter((r) => !r.ok).map((r) => r.id);

describe('outpost queue model', () => {
  it('two workers serve two sessions; the third waits with a banner until one finishes', () => {
    const { snapshots } = runScenario(load('fixtures/two-workers.json'));
    expect(snapshots[0]).toMatchObject({ workers_online: 2, running: ['S1', 'S2'], pending: ['S3'] });
    expect(snapshots[0].wait_banner).toMatch(/kade-vpc/);
    expect(snapshots[1]).toMatchObject({ running: ['S2', 'S3'], pending: [], wait_banner: null });
  });

  it('a dead worker puts its session back in the queue and a restart resumes it', () => {
    const { snapshots } = runScenario(load('fixtures/worker-down.json'));
    expect(snapshots[0]).toMatchObject({ workers_online: 1, pending: ['S2'] });
    expect(snapshots[1]).toMatchObject({ workers_online: 2, running: ['S1', 'S2'], pending: [] });
  });

  it('a claim race gives the loser 409 and the session runs once', () => {
    const { log, final } = runScenario(load('injectors/claim-race.json'));
    expect(log.some((l) => /worker-b claim S1 -> 409/.test(l))).toBe(true);
    expect(log.filter((l) => /running on/.test(l))).toHaveLength(1);
    expect(final.running).toEqual(['S1']);
  });

  it('a duplicated acceptor id is rejected, leaving one effective worker', () => {
    const { log, final } = runScenario(load('injectors/shared-acceptor-id.json'));
    expect(log.some((l) => /REJECTED/.test(l))).toBe(true);
    expect(final).toMatchObject({ workers_online: 1, pending: ['S2'] });
  });
});

describe('worker image policy', () => {
  it('comments do not satisfy a rule', () => {
    const src = readFileSync(join(repo, 'outpost', 'Dockerfile'), 'utf8').replace(/git ffmpeg /, 'git ');
    expect(checkDockerfile(src).filter((r) => !r.ok).map((r) => r.id)).toEqual(['ffmpeg']);
  });
  it('outpost/Dockerfile passes every rule', () => {
    expect(failing(join(repo, 'outpost', 'Dockerfile'))).toEqual([]);
  });
  it('the no-chrome injector fails only the chrome rule', () => {
    expect(failing(join(lab, 'injectors', 'no-chrome.Dockerfile'))).toEqual(['chrome']);
  });
  it('the baked-token injector fails the token and sudo rules', () => {
    expect(failing(join(lab, 'injectors', 'baked-token.Dockerfile'))).toEqual(['no-token', 'no-sudo']);
  });
});
