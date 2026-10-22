#!/usr/bin/env node
// Offline scope resolver for lab 03: given a repo tree, a file the agent is working on and a
// (sandbox) home directory, list which instruction layers would be in context and why, which were
// skipped, which statements conflict and which skills share a name. It models the documented loading
// rules (AGENTS.md / AGENTS.local.md at the root and in each directory down to the file, .devin/rules
// trigger frontmatter, global ~/.config/devin files, repo and global skills); anything the docs do
// not state is listed under `assumptions` in the output.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ASSUMPTIONS = [
  'Globs are matched against the path relative to the repo root; supported syntax is **, *, ? and {a,b}.',
  'A .devin/rules file without a trigger is treated as always_on.',
  'The docs state no precedence between two loaded instructions that disagree: both are in context. The resolver therefore reports a conflict unless all but one statement explicitly defer.',
  'Statement keys such as [tax.presentation] and the :defer suffix are a Harbourline lab convention that makes conflicts greppable; Devin reads them as plain text.',
  'Which of two same-named skills (global and repo) wins is not stated here; the resolver reports the collision instead of picking one.',
];

export function parseFrontMatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  let listKey = null;
  for (const raw of m[1].split(/\r?\n/)) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const item = /^\s*-\s+(.*)$/.exec(line);
    if (item && listKey) {
      meta[listKey].push(unquote(item[1]));
      continue;
    }
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (!kv) continue;
    const [, key, value] = kv;
    if (value === '') {
      meta[key] = [];
      listKey = key;
    } else if (value.startsWith('[')) {
      meta[key] = parseInlineList(value);
      listKey = null;
    } else {
      meta[key] = unquote(value);
      listKey = null;
    }
  }
  return { meta, body: text.slice(m[0].length) };
}

function parseInlineList(value) {
  try {
    const parsed = JSON.parse(value.replace(/'/g, '"'));
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // fall through to a quote-aware split
  }
  return (value.slice(1, -1).match(/"[^"]*"|'[^']*'|[^,\s][^,]*/g) ?? []).map((s) => unquote(s.trim())).filter(Boolean);
}

function unquote(s) {
  return s.replace(/^["']|["']$/g, '');
}

export function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        i++;
        if (glob[i + 1] === '/') {
          i++;
          re += '(?:.*/)?';
        } else re += '.*';
      } else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else if (c === '{') {
      const end = glob.indexOf('}', i);
      if (end < 0) {
        re += '\\{';
        continue;
      }
      const alts = glob.slice(i + 1, end).split(',');
      re += `(?:${alts.map((a) => globToRegExp(a).source.slice(1, -1)).join('|')})`;
      i = end;
    } else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}

export function matchesAny(globs, rel) {
  return (globs ?? []).find((g) => globToRegExp(g).test(rel)) ?? null;
}

export function extractStatements(body) {
  const out = [];
  for (const line of body.split(/\r?\n/)) {
    const m = /^\s*[-*]\s+\[([a-z0-9._-]+)(:defer)?\]\s+(.*)$/i.exec(line);
    if (m) out.push({ key: m[1], defer: Boolean(m[2]), text: m[3].trim() });
  }
  return out;
}

function read(p) {
  return readFileSync(p, 'utf8');
}

function listDirs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => statSync(path.join(dir, n)).isDirectory())
    .sort();
}

function listFiles(dir, ext) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => n.endsWith(ext) && statSync(path.join(dir, n)).isFile())
    .sort();
}

export function isGitIgnored(root, rel) {
  const r = spawnSync('git', ['check-ignore', '-q', rel], { cwd: root });
  if (r.status === 0) return true;
  if (r.status === 1) return false;
  const gi = path.join(root, '.gitignore');
  if (!existsSync(gi)) return false;
  const base = path.basename(rel);
  return read(gi)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .some((l) => l === base || l === `/${rel}` || l === rel);
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

export function resolveScopes({ root, file, home = null, mentions = [] }) {
  root = path.resolve(root);
  const rel = toPosix(path.isAbsolute(file) ? path.relative(root, file) : path.normalize(file));
  const loaded = [];
  const candidates = [];
  const skipped = [];
  const display = (abs) => (home && abs.startsWith(path.resolve(home)) ? `~/${toPosix(path.relative(home, abs))}` : toPosix(path.relative(root, abs)));

  const addInstructionFile = (abs, layer, why) => {
    const text = read(abs);
    const isLocal = path.basename(abs) === 'AGENTS.local.md';
    const entry = { layer, path: display(abs), trigger: 'always_on', why, statements: extractStatements(text) };
    if (isLocal) {
      entry.local = true;
      entry.git_ignored = isGitIgnored(root, toPosix(path.relative(root, abs)));
    }
    loaded.push(entry);
  };

  if (home) {
    const g = path.join(home, '.config', 'devin', 'AGENTS.md');
    if (existsSync(g)) addInstructionFile(g, 'global', 'global rules file, loaded in every project on this machine');
  }

  const dirs = [''];
  const parts = rel.split('/').slice(0, -1);
  for (let i = 0; i < parts.length; i++) dirs.push(parts.slice(0, i + 1).join('/'));
  for (const d of dirs) {
    const layer = d === '' ? 'project-root' : 'nested';
    for (const name of ['AGENTS.md', 'AGENTS.local.md']) {
      const abs = path.join(root, d, name);
      if (!existsSync(abs)) continue;
      const why =
        d === ''
          ? 'root instruction file, loaded at session start'
          : `nested instruction file, discovered when the agent works in ${d}/`;
      addInstructionFile(abs, layer, name === 'AGENTS.local.md' ? `${why} (personal, uncommitted)` : why);
    }
  }

  const rulesDir = path.join(root, '.devin', 'rules');
  for (const name of listFiles(rulesDir, '.md')) {
    const abs = path.join(rulesDir, name);
    const { meta, body } = parseFrontMatter(read(abs));
    const ruleName = name.replace(/\.md$/, '');
    const trigger = meta.trigger ?? 'always_on';
    const base = { layer: 'project-rule', path: display(abs), trigger, statements: extractStatements(body) };
    if (trigger === 'always_on') loaded.push({ ...base, why: 'trigger: always_on' });
    else if (trigger === 'glob') {
      const globs = Array.isArray(meta.globs) ? meta.globs : meta.globs ? [meta.globs] : [];
      const hit = matchesAny(globs, rel);
      if (hit) loaded.push({ ...base, globs, why: `glob ${hit} matched ${rel}` });
      else
        skipped.push({
          ...base,
          globs,
          reason: globs.length ? `no glob matched ${rel} (globs: ${globs.join(', ')})` : 'trigger: glob but no globs listed',
        });
    } else if (trigger === 'manual') {
      if (mentions.includes(ruleName)) loaded.push({ ...base, why: `manual rule, mentioned as @rules:${ruleName}` });
      else skipped.push({ ...base, reason: `manual rule, only loaded when mentioned as @rules:${ruleName}` });
    } else candidates.push({ ...base, description: meta.description ?? '', why: `trigger: ${trigger}; the model decides from the description` });
  }

  const skills = [];
  const scanSkills = (dir, scope) => {
    for (const d of listDirs(dir)) {
      const abs = path.join(dir, d, 'SKILL.md');
      if (!existsSync(abs)) continue;
      const { meta } = parseFrontMatter(read(abs));
      skills.push({ name: meta.name ?? d, scope, path: display(abs), triggers: meta.triggers ?? [] });
    }
  };
  if (home) {
    scanSkills(path.join(home, '.config', 'devin', 'skills'), 'global');
    scanSkills(path.join(home, '.agents', 'skills'), 'global');
  }
  scanSkills(path.join(root, '.devin', 'skills'), 'repo');
  scanSkills(path.join(root, '.agents', 'skills'), 'repo');

  const byName = new Map();
  for (const s of skills) byName.set(s.name, [...(byName.get(s.name) ?? []), s]);
  const skill_collisions = [...byName.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([name, list]) => ({
      name,
      paths: list.map((s) => `${s.scope}: ${s.path}`),
      note: 'Two skills share a name and only one skill can be active at a time; rename one so the invocation is unambiguous.',
    }));

  const byKey = new Map();
  for (const e of loaded) for (const s of e.statements) byKey.set(s.key, [...(byKey.get(s.key) ?? []), { path: e.path, layer: e.layer, ...s }]);
  const conflicts = [];
  for (const [key, list] of byKey) {
    if (new Set(list.map((s) => s.path)).size < 2) continue;
    const owners = list.filter((s) => !s.defer);
    const status = owners.length === 1 ? 'resolved' : 'unresolved';
    conflicts.push({
      key,
      status,
      winner: status === 'resolved' ? owners[0].path : null,
      statements: list.map(({ path: p, layer, defer, text }) => ({ path: p, layer, defer, text })),
      note:
        status === 'resolved'
          ? `Only ${owners[0].path} states ${key} without deferring.`
          : `${owners.length} loaded files state ${key} without deferring; both are in context and nothing documented decides between them.`,
    });
  }

  return { file: rel, loaded, candidates, skipped, skills, skill_collisions, conflicts, assumptions: ASSUMPTIONS };
}

function parseArgs(argv) {
  const args = { root: '.', file: null, home: null, mentions: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--root') args.root = argv[++i];
    else if (a === '--file') args.file = argv[++i];
    else if (a === '--home') args.home = argv[++i];
    else if (a === '--mention') args.mentions.push(argv[++i]);
    else throw new Error(`unknown argument ${a}`);
  }
  if (!args.file) throw new Error('usage: resolve.mjs --file <path> [--root <repo>] [--home <sandbox-home>] [--mention <rule>]');
  return args;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const report = resolveScopes(parseArgs(process.argv.slice(2)));
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.exit(report.conflicts.some((c) => c.status === 'unresolved') ? 1 : 0);
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    process.exit(2);
  }
}
