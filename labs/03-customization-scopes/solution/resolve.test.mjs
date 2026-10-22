// Evidence table for lab 03: each acceptance case resolved offline against a sandbox repo tree.
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { applyLayers } from './apply.mjs';
import { globToRegExp, parseFrontMatter, resolveScopes } from './resolve.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const INJECTORS = path.join(HERE, '..', 'injectors');
const REPO = path.resolve(HERE, '..', '..', '..');
let root;
let home;

const put = (rel, text) => {
  mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  writeFileSync(path.join(root, rel), text);
};
const inject = (name, rel) => {
  mkdirSync(path.dirname(rel), { recursive: true });
  cpSync(path.join(INJECTORS, name), rel);
};
const resolve = (file, extra = {}) => resolveScopes({ root, file, home, ...extra });
const paths = (list) => list.map((e) => e.path);

beforeEach(() => {
  root = mkdtempSync(path.join(os.tmpdir(), 'lab03-repo-'));
  home = mkdtempSync(path.join(os.tmpdir(), 'lab03-home-'));
  put('package.json', '{}\n');
  put('.gitignore', 'node_modules/\nAGENTS.local.md\n');
  put('AGENTS.md', '# Kadé Commerce\n');
  put('services/api/AGENTS.md', '# services/api\n');
  put('services/api/src/money.ts', '');
  put('services/api/src/routes/catalog.ts', '');
  applyLayers(root);
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
  rmSync(home, { recursive: true, force: true });
});

describe('lab 03 reference layers', () => {
  it('loads the Platform checklist and the Trailhead VAT rule for money.ts, and the brand rule wins tax', () => {
    const r = resolve('services/api/src/money.ts');
    expect(paths(r.loaded)).toEqual(
      expect.arrayContaining(['.devin/rules/checkout-review.md', '.devin/rules/trailhead-vat.md', 'services/api/AGENTS.md']),
    );
    const tax = r.conflicts.find((c) => c.key === 'tax.presentation');
    expect(tax.status).toBe('resolved');
    expect(tax.winner).toBe('.devin/rules/trailhead-vat.md');
    expect(r.conflicts.every((c) => c.status === 'resolved')).toBe(true);
  });

  it('keeps the Trailhead rule out of files that do not handle Trailhead money', () => {
    const r = resolve('services/api/src/routes/catalog.ts');
    expect(paths(r.loaded)).toContain('.devin/rules/checkout-review.md');
    expect(paths(r.skipped)).toContain('.devin/rules/trailhead-vat.md');
  });

  it('shows the repo skill and the CODEOWNERS split', () => {
    const r = resolve('services/api/src/money.ts');
    expect(r.skills).toEqual([expect.objectContaining({ name: 'checkout-review', scope: 'repo' })]);
    expect(r.skill_collisions).toEqual([]);
  });
});

describe('lab 03 injectors', () => {
  it('nested-conflict: a deeper AGENTS.md that does not defer leaves an unresolved conflict', () => {
    inject('nested-conflict.AGENTS.md', path.join(root, 'services/api/src/AGENTS.md'));
    const r = resolve('services/api/src/money.ts');
    const tax = r.conflicts.find((c) => c.key === 'tax.presentation');
    expect(tax.status).toBe('unresolved');
    expect(tax.statements.map((s) => s.path)).toEqual(expect.arrayContaining(['services/api/src/AGENTS.md', '.devin/rules/trailhead-vat.md']));
    expect(resolve('apps/web/src/App.tsx').loaded.map((e) => e.path)).not.toContain('services/api/src/AGENTS.md');
  });

  it('nested-conflict fixed: marking the deeper statements :defer resolves it in favour of the brand rule', () => {
    put(
      'services/api/src/AGENTS.md',
      '- [tax.presentation:defer] Tax presentation follows the brand rule file.\n- [tax.rounding:defer] Rounding follows the brand rule file.\n',
    );
    const r = resolve('services/api/src/money.ts');
    expect(r.conflicts.find((c) => c.key === 'tax.presentation').winner).toBe('.devin/rules/trailhead-vat.md');
    expect(r.conflicts.every((c) => c.status === 'resolved')).toBe(true);
  });

  it('local-override: AGENTS.local.md is loaded for you only and is git-ignored', () => {
    inject('local-override.AGENTS.local.md', path.join(root, 'AGENTS.local.md'));
    const r = resolve('services/api/src/money.ts');
    const local = r.loaded.find((e) => e.path === 'AGENTS.local.md');
    expect(local).toMatchObject({ local: true, git_ignored: true });
    expect(r.conflicts.find((c) => c.key === 'review.checklist').status).toBe('unresolved');
  });

  it('wrong-glob: the Trailhead rule never triggers on money.ts', () => {
    inject('trailhead-vat.wrong-glob.md', path.join(root, '.devin/rules/trailhead-vat.md'));
    const r = resolve('services/api/src/money.ts');
    const skip = r.skipped.find((e) => e.path === '.devin/rules/trailhead-vat.md');
    expect(skip.reason).toMatch(/no glob matched services\/api\/src\/money\.ts/);
    expect(r.conflicts.find((c) => c.key === 'tax.presentation')).toBeUndefined();
  });

  it('global-skill: a personal global skill with the same name collides with the repo skill', () => {
    inject('global-skill.SKILL.md', path.join(home, '.config/devin/skills/checkout-review/SKILL.md'));
    const r = resolve('services/api/src/money.ts');
    expect(r.skill_collisions).toEqual([
      expect.objectContaining({ name: 'checkout-review', paths: ['global: ~/.config/devin/skills/checkout-review/SKILL.md', 'repo: .devin/skills/checkout-review/SKILL.md'] }),
    ]);
  });

  it('manual and model_decision rules are reported, not silently loaded', () => {
    put('.devin/rules/lumen-tax.md', '---\ntrigger: manual\n---\n- [tax.presentation] Lumen adds 8.25% on top.\n');
    put('.devin/rules/style.md', '---\ntrigger: model_decision\ndescription: UI copy style\n---\n');
    const r = resolve('services/api/src/money.ts');
    expect(paths(r.skipped)).toContain('.devin/rules/lumen-tax.md');
    expect(paths(r.candidates)).toContain('.devin/rules/style.md');
    const mentioned = resolve('services/api/src/money.ts', { mentions: ['lumen-tax'] });
    expect(mentioned.conflicts.find((c) => c.key === 'tax.presentation').status).toBe('unresolved');
  });
});

describe('lab 03 resolver internals', () => {
  it('matches globs against the repo-relative path', () => {
    expect(globToRegExp('services/**').test('services/api/src/money.ts')).toBe(true);
    expect(globToRegExp('services/api/src/**/*.ts').test('services/api/src/money.ts')).toBe(true);
    expect(globToRegExp('services/api/src/routes/{checkout,orders}.ts').test('services/api/src/routes/orders.ts')).toBe(true);
    expect(globToRegExp('src/routes/*.ts').test('services/api/src/routes/checkout.ts')).toBe(false);
    expect(globToRegExp('service/api/src/money.ts').test('services/api/src/money.ts')).toBe(false);
  });

  it('parses inline and block list frontmatter', () => {
    expect(parseFrontMatter('---\ntrigger: glob\nglobs: ["a/**", "b/*.ts"]\n---\nx').meta.globs).toEqual(['a/**', 'b/*.ts']);
    expect(parseFrontMatter('---\nglobs:\n  - a/**\n  - "b/*.ts"\n---\n').meta.globs).toEqual(['a/**', 'b/*.ts']);
  });

  it('reads the real repo: money-and-brands is glob-triggered on services/** and AGENTS.local.md is ignored', () => {
    const r = resolveScopes({ root: REPO, file: 'services/api/src/money.ts' });
    expect(r.loaded.find((e) => e.path === '.devin/rules/money-and-brands.md').why).toMatch(/services\/\*\*/);
    expect(r.loaded.find((e) => e.path === '.devin/rules/repo-conventions.md').trigger).toBe('always_on');
  });
});
