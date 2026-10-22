// Offline checker for lab 04: inspects a plugin folder the way the lab's acceptance criteria read it.
// It is a course fixture, not Devin's loader. Facts it encodes come from the plugin docs (fetched 2026-10-22).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const NAME_RE = /^[a-z0-9][a-z0-9.-]*$/;
const SECRET_REF_RE = /^\$\{[A-Z0-9_]+\}$/;
const SECRET_KEY_RE = /client_?secret/i;

export function listFiles(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir).sort()) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...listFiles(full, base));
    else out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}

function readJson(file, problems) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    problems.push(`${path.basename(file)} is not valid JSON: ${err.message}`);
    return null;
  }
}

function frontmatterName(markdown) {
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(markdown);
  const m = fm && /^name:\s*["']?([^"'\n]+?)["']?\s*$/m.exec(fm[1]);
  return m ? m[1] : null;
}

function inspectMcp(servers, source, problems) {
  return Object.entries(servers ?? {}).map(([name, cfg]) => {
    const envRefs = [];
    const literals = [];
    for (const [key, value] of Object.entries(cfg?.env ?? {})) {
      if (SECRET_REF_RE.test(String(value))) envRefs.push(key);
      else literals.push(key);
    }
    for (const key of literals) {
      problems.push(`MCP server "${name}" (${source}) sets ${key} to a literal value; literal values are stripped — reference it as \${${key}} and connect the credential after install`);
    }
    const walk = (obj) => Object.entries(obj ?? {}).some(([k, v]) => SECRET_KEY_RE.test(k) || (v && typeof v === 'object' && walk(v)));
    if (walk(cfg)) problems.push(`MCP server "${name}" (${source}) carries a client secret; a server config with one is rejected at activation`);
    return { name, source, envRefs, literals, needsConnection: envRefs.length > 0 || !!cfg?.url };
  });
}

/** Inspect one plugin folder. `repoName` names a skills-only repo (it has no manifest to name it). */
const KIT_SKILLS = ['flash-sale-incident', 'flash-sale-release'];

export function inspect(dir, { repoName = path.basename(dir), kit = false } = {}) {
  const problems = [];
  const files = listFiles(dir);
  const manifestPath = path.join(dir, '.devin-plugin', 'plugin.json');
  const skillDirs = existsSync(path.join(dir, 'skills'))
    ? readdirSync(path.join(dir, 'skills')).filter((d) => existsSync(path.join(dir, 'skills', d, 'SKILL.md'))).sort()
    : [];
  let kind = 'invalid';
  let name = null;
  let manifest = null;
  if (existsSync(manifestPath)) {
    kind = 'manifest';
    manifest = readJson(manifestPath, problems);
    name = manifest?.name ?? null;
    if (!name) problems.push('plugin.json has no "name" (the only required field)');
    else if (!NAME_RE.test(name)) problems.push(`plugin name "${name}" must be lowercase letters, digits, "-" or "."`);
  } else if (skillDirs.length) {
    kind = 'skills-only';
    name = repoName;
  } else {
    problems.push('neither .devin-plugin/plugin.json nor skills/<name>/SKILL.md found');
  }
  const skills = skillDirs.map((d) => {
    const fmName = frontmatterName(readFileSync(path.join(dir, 'skills', d, 'SKILL.md'), 'utf8'));
    if (fmName && fmName !== d) problems.push(`skills/${d}/SKILL.md declares name "${fmName}"; keep it equal to the folder`);
    return d;
  });
  const rules = files.filter((f) => f === 'AGENTS.md' || /^rules\/[^/]+\.md$/.test(f));
  const agents = files.filter((f) => /^agents\/[^/]+\.md$/.test(f) || /^agents\/[^/]+\/AGENT\.md$/.test(f)).map((f) => f.split('/')[1].replace(/\.md$/, ''));
  let hooks = [];
  let preToolHooks = 0;
  if (files.includes('hooks.json')) {
    const cfg = readJson(path.join(dir, 'hooks.json'), problems);
    hooks = cfg ? Object.keys(cfg) : [];
    preToolHooks = (Array.isArray(cfg?.PreToolUse) ? cfg.PreToolUse : []).flatMap((m) => (Array.isArray(m?.hooks) ? m.hooks : [])).filter((h) => h?.type === 'command' && h.command).length;
  }
  const mcpServers = [];
  if (manifest?.mcpServers && typeof manifest.mcpServers === 'object' && !Array.isArray(manifest.mcpServers) && !manifest.mcpServers.paths) {
    mcpServers.push(...inspectMcp(manifest.mcpServers, 'plugin.json', problems));
  }
  if (files.includes('.mcp.json')) {
    const cfg = readJson(path.join(dir, '.mcp.json'), problems);
    for (const s of inspectMcp(cfg?.mcpServers, '.mcp.json', problems)) if (!mcpServers.some((m) => m.name === s.name)) mcpServers.push(s);
  }
  if (kit) {
    if (kind !== 'manifest') problems.push('kit: no .devin-plugin/plugin.json manifest');
    for (const s of KIT_SKILLS) if (!skills.includes(s)) problems.push(`kit: missing skill skills/${s}/SKILL.md`);
    if (!rules.length) problems.push('kit: no rule (AGENTS.md or rules/*.md)');
    if (!agents.length) problems.push('kit: no subagent under agents/');
    if (!preToolHooks) problems.push('kit: no PreToolUse hook command in hooks.json');
    if (!mcpServers.length) problems.push('kit: no MCP server declared');
  }
  return { kind, name, commands: skills.map((s) => `/${name}:${s}`), skills, rules, agents, hooks, mcpServers, files, problems };
}

/** An uploaded plugin's new revision is the new bundle, whole: files missing from it are gone. */
export function reviseUpload(oldDir, newDir) {
  const before = listFiles(oldDir);
  const after = listFiles(newDir);
  const read = (d, f) => readFileSync(path.join(d, f), 'utf8');
  return {
    result: after,
    added: after.filter((f) => !before.includes(f)),
    removed: before.filter((f) => !after.includes(f)),
    changed: after.filter((f) => before.includes(f) && read(oldDir, f) !== read(newDir, f)),
  };
}

/** Course model of the shared-plugin edit flow (Oct 19 2026): a non-editor's session proposes, an admin approves the diff. */
export function proposeEdit({ plugin, scope, actor, change, approver }) {
  if (actor?.can_edit_org_plugins) return { outcome: 'direct-edit', plugin, scope, applied_by: actor.handle };
  return {
    outcome: 'proposal',
    plugin,
    scope,
    applied: false,
    proposed_by: actor?.handle ?? 'unknown',
    awaiting: approver?.can_edit_org_plugins ? approver.handle : 'an admin with plugin edit permission',
    diff: `--- a/${change.file}\n+++ b/${change.file}\n-${change.from}\n+${change.to}\n`,
  };
}

/** Run the plugin's PreToolUse hook command for an exec call; returns the exit code and stderr. */
export function runPreToolHook(pluginDir, command, env = {}) {
  const cfg = JSON.parse(readFileSync(path.join(pluginDir, 'hooks.json'), 'utf8'));
  const hook = cfg.PreToolUse[0].hooks[0];
  const r = spawnSync('sh', ['-c', hook.command], {
    input: JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: 'exec', tool_input: { command } }),
    env: { ...process.env, HARBOURLINE_SALE_FREEZE: '', ...env },
    encoding: 'utf8',
    timeout: hook.timeout * 1000,
  });
  return { exit: r.status, stderr: r.stderr.trim() };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , a, b, c] = process.argv;
  let out;
  if (a === '--revise') out = reviseUpload(b, c);
  else if (a === '--propose') out = proposeEdit(JSON.parse(readFileSync(b, 'utf8')));
  else if (a === '--hook') out = runPreToolHook(b, c, { HARBOURLINE_SALE_FREEZE: process.env.HARBOURLINE_SALE_FREEZE ?? '' });
  else if (a === '--kit') out = inspect(b, { kit: true });
  else if (a && a !== '--help') out = inspect(a, b === '--repo-name' ? { repoName: c } : {});
  else {
    console.error('usage: node plugin-check.mjs <plugin-dir> [--repo-name <name>] | --kit <plugin-dir> | --revise <old> <new> | --propose <fixture.json> | --hook <plugin-dir> "<command>"');
    process.exit(64);
  }
  console.log(JSON.stringify(out, null, 2));
  if (out.problems?.length) process.exit(1);
}
