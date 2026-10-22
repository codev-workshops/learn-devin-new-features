// Evidence table for lab 04: the reference plugin and each injector, read through plugin-check.mjs.
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { inspect, proposeEdit, reviseUpload, runPreToolHook } from './plugin-check.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.join(HERE, 'kade-flash-sale');
const INJECTORS = path.join(HERE, '..', 'injectors');

describe('lab 04 reference plugin', () => {
  const r = inspect(PLUGIN);

  it('is a valid manifest plugin with no problems', () => {
    expect(r.kind).toBe('manifest');
    expect(r.name).toBe('kade-flash-sale');
    expect(r.problems).toEqual([]);
  });

  it('bundles both procedures as skills, plus rules, a subagent, a hook and an MCP', () => {
    expect(r.commands).toEqual(['/kade-flash-sale:flash-sale-incident', '/kade-flash-sale:flash-sale-release']);
    expect(r.rules).toEqual(['AGENTS.md', 'rules/sale-pricing.md']);
    expect(r.agents).toEqual(['release-checker']);
    expect(r.hooks).toEqual(['PreToolUse']);
    expect(r.mcpServers).toEqual([
      { name: 'kade-incidents', source: '.mcp.json', envRefs: ['PAGERDUTY_API_TOKEN'], literals: [], needsConnection: true },
    ]);
  });

  it('ships no credential values in any file', () => {
    for (const f of r.files) expect(readFileSync(path.join(PLUGIN, f), 'utf8')).not.toMatch(/u\+[A-Za-z0-9_-]{8,}|clientSecret/);
  });

  it('freeze hook blocks a push to main only while the freeze is on', () => {
    expect(runPreToolHook(PLUGIN, 'git push origin main', { KADE_SALE_FREEZE: '1' }).exit).toBe(2);
    expect(runPreToolHook(PLUGIN, 'git push origin main').exit).toBe(0);
    expect(runPreToolHook(PLUGIN, 'git push origin devin/sale-banner', { KADE_SALE_FREEZE: '1' }).exit).toBe(0);
    expect(runPreToolHook(PLUGIN, 'npm run gates', { KADE_SALE_FREEZE: '1' }).exit).toBe(0);
  });
});

describe('lab 04 injectors', () => {
  it('skills-only repo installs as a plugin named after the repo', () => {
    const r = inspect(path.join(INJECTORS, 'brand-checklists'), { repoName: 'lumen-checklists' });
    expect(r.kind).toBe('skills-only');
    expect(r.commands).toEqual(['/lumen-checklists:lumen-sale-checklist']);
    expect(r.mcpServers).toEqual([]);
    expect(r.hooks).toEqual([]);
  });

  it('a partial revision-2 upload replaces the bundle: everything it left out is gone', () => {
    const d = reviseUpload(PLUGIN, path.join(INJECTORS, 'revision-2', 'kade-flash-sale'));
    expect(d.result).toEqual(['.devin-plugin/plugin.json', 'skills/flash-sale-release/SKILL.md']);
    expect(d.changed).toEqual(d.result);
    expect(d.removed).toEqual(expect.arrayContaining(['.mcp.json', 'hooks.json', 'AGENTS.md', 'agents/release-checker.md', 'skills/flash-sale-incident/SKILL.md']));
    expect(d.removed).toHaveLength(6);
  });

  it('inline secrets and a bad name are reported', () => {
    const r = inspect(path.join(INJECTORS, 'inline-secret'));
    expect(r.problems).toHaveLength(3);
    expect(r.problems.join('\n')).toMatch(/lowercase/);
    expect(r.problems.join('\n')).toMatch(/literal values are stripped/);
    expect(r.problems.join('\n')).toMatch(/rejected at activation/);
  });

  it('an unauthorised proposer gets a pending proposal, never an applied change', () => {
    const fixture = JSON.parse(readFileSync(path.join(INJECTORS, 'unauthorised-proposer.json'), 'utf8'));
    const p = proposeEdit(fixture);
    expect(p).toMatchObject({ outcome: 'proposal', applied: false, proposed_by: 'trailhead-eng', awaiting: 'platform-admin' });
    expect(p.diff).toContain('+fewer than 25 units');
    expect(proposeEdit({ ...fixture, actor: fixture.approver }).outcome).toBe('direct-edit');
  });
});
