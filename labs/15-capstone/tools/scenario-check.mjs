#!/usr/bin/env node
// Runtime loader for the sealed capstone scenarios (facilitator / coach only).
//   node labs/15-capstone/tools/scenario-check.mjs --check
//   node labs/15-capstone/tools/scenario-check.mjs --list
//   node labs/15-capstone/tools/scenario-check.mjs --scenario <id> [--json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const LAB_DIR = path.resolve(here, '..');
export const SCENARIO_DIR = path.join(LAB_DIR, 'scenarios');
export const ENVELOPE_PARTS = ['Incident', 'Feature request', 'Governance constraint'];
export const ACCURACY_SHARE = 30;

function frontMatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(text);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([a-z_]+):\s*(.*)$/.exec(line);
    if (kv) meta[kv[1]] = kv[2].trim();
  }
  return { meta, body: m[2] };
}

function sections(body) {
  const out = {};
  let current = null;
  for (const line of body.split(/\r?\n/)) {
    const h = /^##\s+(.+?)\s*$/.exec(line);
    if (h) {
      current = h[1];
      out[current] = [];
    } else if (current) out[current].push(line);
  }
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.join('\n').trim()]));
}

function section(secs, prefix) {
  const key = Object.keys(secs).find((k) => k.toLowerCase().startsWith(prefix.toLowerCase()));
  return key ? secs[key] : '';
}

function unquote(text) {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^>\s?/, ''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseScenario(text) {
  const { meta, body } = frontMatter(text);
  const secs = sections(body);
  const envelopeText = section(secs, 'Envelope');
  const firstBlock = envelopeText.split(/\r?\n\r?\n/)[0];
  const envelope = { opening: firstBlock.startsWith('>') ? unquote(firstBlock) : '' };
  for (const part of ENVELOPE_PARTS) {
    const m = new RegExp(`\\*\\*${part}\\*\\*\\s*[—-]\\s*(.+)`).exec(envelopeText);
    envelope[part] = m ? m[1].trim() : null;
  }
  const mustMention = [];
  for (const line of section(secs, 'Must-mention').split(/\r?\n/)) {
    const cells = /^\|(.+)\|$/.exec(line.trim())?.[1].split('|').map((c) => c.trim());
    if (!cells || cells.length !== 4 || !/^mm\d+$/.test(cells[0])) continue;
    mustMention.push({ id: cells[0], weight: Number(cells[1]), belonged_in: cells[2], point: cells[3] });
  }
  const objections = [];
  for (const line of section(secs, 'Objections').split(/\r?\n/)) {
    const m = /^\d+\.\s+\*\*(.+?)\*\*\s*[—-]\s*"(.+?)"\s*Follow-up:\s*"(.+?)"\s*$/.exec(line.trim());
    if (m) objections.push({ theme: m[1], question: m[2], follow_up: m[3] });
  }
  return {
    id: meta.id,
    brand: meta.brand,
    customer: meta.customer,
    role: meta.role,
    envelope,
    requirement_change: unquote(section(secs, 'Requirement change')),
    injected_blocker: section(secs, 'Injected blocker').replace(/\s+/g, ' '),
    must_mention: mustMention,
    objections,
  };
}

export function listScenarioFiles(dir = SCENARIO_DIR) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .sort()
    .map((f) => path.join(dir, f));
}

export function loadScenario(id, dir = SCENARIO_DIR) {
  const file = path.join(dir, `${id}.md`);
  if (!/^[a-z0-9-]+$/.test(id) || !fs.existsSync(file)) throw new Error(`unknown scenario "${id}"`);
  return parseScenario(fs.readFileSync(file, 'utf8'));
}

export function validateScenario(s, segmentIds, fileId) {
  const errors = [];
  if (s.id !== fileId) errors.push(`front matter id "${s.id}" != file name "${fileId}"`);
  for (const k of ['brand', 'customer', 'role']) if (!s[k]) errors.push(`front matter ${k} missing`);
  for (const part of ENVELOPE_PARTS) if (!s.envelope[part]) errors.push(`envelope has no **${part}** paragraph`);
  if (!s.requirement_change) errors.push('requirement change at T+60 missing');
  if (!s.injected_blocker) errors.push('injected blocker missing');
  const weights = s.must_mention.reduce((a, m) => a + m.weight, 0);
  if (weights !== ACCURACY_SHARE) errors.push(`must-mention weights sum to ${weights}, expected ${ACCURACY_SHARE}`);
  const ids = s.must_mention.map((m) => m.id);
  if (new Set(ids).size !== ids.length) errors.push('duplicate must-mention ids');
  for (const m of s.must_mention) {
    if (!segmentIds.includes(m.belonged_in)) errors.push(`${m.id} belonged_in "${m.belonged_in}" is not a lab.json segment`);
    if (!Number.isInteger(m.weight) || m.weight < 1) errors.push(`${m.id} weight must be a positive integer`);
  }
  if (!s.must_mention.some((m) => m.belonged_in === 'checkpoint-90')) errors.push('no must-mention point tests the T+60 change (checkpoint-90)');
  if (s.objections.length !== 3) errors.push(`expected 3 objections with follow-ups, found ${s.objections.length}`);
  return errors;
}

export function segmentIdsFromLab(labDir = LAB_DIR) {
  const lab = JSON.parse(fs.readFileSync(path.join(labDir, 'lab.json'), 'utf8'));
  return lab.coach.segments.map((s) => s.id);
}

export function checkAll(dir = SCENARIO_DIR, labDir = LAB_DIR) {
  const segmentIds = segmentIdsFromLab(labDir);
  const results = {};
  for (const file of listScenarioFiles(dir)) {
    const id = path.basename(file, '.md');
    results[id] = validateScenario(parseScenario(fs.readFileSync(file, 'utf8')), segmentIds, id);
  }
  return results;
}

function main(argv) {
  const arg = (name) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  if (argv.includes('--list')) {
    for (const f of listScenarioFiles()) console.log(path.basename(f, '.md'));
    return 0;
  }
  if (argv.includes('--check')) {
    const results = checkAll();
    let bad = 0;
    for (const [id, errors] of Object.entries(results)) {
      console.log(`${errors.length ? 'FAIL' : 'ok  '} ${id}${errors.length ? `: ${errors.join('; ')}` : ''}`);
      bad += errors.length;
    }
    if (Object.keys(results).length !== 3) {
      console.log(`FAIL expected 3 sealed scenarios, found ${Object.keys(results).length}`);
      bad += 1;
    }
    return bad ? 1 : 0;
  }
  const id = arg('--scenario');
  if (!id) {
    console.error('usage: scenario-check.mjs --check | --list | --scenario <id> [--json]');
    return 2;
  }
  const s = loadScenario(id);
  if (argv.includes('--json')) console.log(JSON.stringify(s, null, 2));
  else {
    console.log(`${s.id} — ${s.customer}, ${s.role}`);
    for (const m of s.must_mention) console.log(`${m.id} (${m.weight}, ${m.belonged_in}) ${m.point}`);
  }
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
