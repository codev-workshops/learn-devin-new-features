// Lab 01 evidence: the AGENTS.md budget tool and the injectors behave as the lab page says.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { LIMIT_BYTES, budget } from './agents-budget.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..', '..');
const tmp = mkdtempSync(path.join(os.tmpdir(), 'lab01-'));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

describe('lab 01 agents-budget', () => {
  it('uses the documented per-file limit of 16 KiB', () => {
    expect(LIMIT_BYTES).toBe(16384);
  });

  it('finds every AGENTS.md in the repo and none is over the limit on main', () => {
    const r = budget(REPO);
    const names = r.files.map((f) => f.file);
    expect(names[0]).toBe('AGENTS.md');
    expect(names).toContain(path.join('services', 'api', 'AGENTS.md'));
    expect(r.anyOver).toBe(false);
  });

  it('flags a file over the limit and names the first heading past it', () => {
    mkdirSync(path.join(tmp, 'svc'), { recursive: true });
    writeFileSync(path.join(tmp, 'AGENTS.md'), '# root\nshort\n');
    writeFileSync(path.join(tmp, 'svc', 'AGENTS.md'), `# svc\n${'x'.repeat(LIMIT_BYTES)}\n## Never reset shared data\n`);
    const r = budget(tmp);
    const svc = r.files.find((f) => f.file === path.join('svc', 'AGENTS.md'));
    expect(svc.over).toBe(true);
    expect(svc.lostHeading).toBe('## Never reset shared data');
    expect(r.files[0].over).toBe(false);
  });
});

describe('lab 01 injectors', () => {
  const inject = (arg) => execFileSync('bash', [path.join(HERE, '..', 'injectors', 'inject.sh'), arg], { encoding: 'utf8' });
  const targets = ['services/api/src/AGENTS.md', 'docs/SETUP.md', 'labs/01-onboarding/.env.lab'].map((t) => path.join(REPO, t));
  const preexisting = targets.filter((t) => existsSync(t));

  it.skipIf(preexisting.length > 0)('inject then revert leaves no injected file behind', () => {
    try {
      expect(inject('contradictory-agents')).toMatch(/injected/);
      expect(inject('stale-setup-doc')).toMatch(/injected/);
      expect(inject('missing-paygate-secret')).toMatch(/injected/);
      for (const t of targets) expect(existsSync(t)).toBe(true);
      expect(budget(REPO).files.map((f) => f.file)).toContain(path.join('services', 'api', 'src', 'AGENTS.md'));
    } finally {
      expect(inject('--revert').trim()).toBe('reverted');
    }
    for (const t of targets) expect(existsSync(t)).toBe(false);
  });
});
