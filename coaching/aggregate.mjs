#!/usr/bin/env node
// Per-learner coaching trends (plan §5, W5-coach). Lives only on the long-lived `coaching`
// branch (Decision 13a, never merged into main). Source of truth per learner:
// coaching/<handle>/index.md — one table row per coach run, appended by --record.
//
//   node coaching/aggregate.mjs [handle ...]              trend tables (all learners when none given)
//   node coaching/aggregate.mjs --record <handle> <report.json>
//                                                         copy a coach report to progress/<nn>/<run>.json, append its row
//   node coaching/aggregate.mjs --previous <handle> <nn>  latest run for lab nn (what a coach's preflight reads)
//   node coaching/aggregate.mjs --check [handle ...]      every index row agrees with its report file
//   --ref <git-ref>   read from a ref instead of the working tree, e.g. from a main checkout:
//                     git fetch origin coaching && git show origin/coaching:coaching/aggregate.mjs > /tmp/aggregate.mjs
//                     node /tmp/aggregate.mjs --ref origin/coaching --previous <handle> <nn>

import { promises as fs } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DIMENSIONS = [
  ['accuracy', 'Acc', 30],
  ['structure', 'Str', 25],
  ['customer_relevance', 'Rel', 20],
  ['brevity_and_fluency', 'Brev', 15],
  ['recovery', 'Rec', 10],
];
export const COLUMNS = ['run_at', 'lab', 'mode', 'total', ...DIMENSIONS.map(([k]) => k), 'report'];
const HEADER = `| ${COLUMNS.join(' | ')} |`;
const SEP = `| ${COLUMNS.map(() => '---').join(' | ')} |`;

// Reads from the working tree (root = repo root) or from a git ref.
export function source({ root, ref }) {
  if (!ref) {
    return {
      read: (p) => fs.readFile(path.join(root, p), 'utf8'),
      list: async (p) => (await fs.readdir(path.join(root, p), { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name),
    };
  }
  const git = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  return {
    read: async (p) => git('show', `${ref}:${p}`),
    list: async (p) =>
      git('ls-tree', '-d', '--name-only', `${ref}:${p}`)
        .split('\n')
        .filter(Boolean),
  };
}

export function parseIndex(md) {
  const lines = md.split('\n').map((l) => l.trim());
  const h = lines.indexOf(HEADER);
  if (h < 0) throw new Error(`index.md has no run table (expected header: ${HEADER})`);
  const rows = [];
  for (const line of lines.slice(h + 2)) {
    if (!line.startsWith('|')) break;
    const cells = line.slice(1, -1).split('|').map((c) => c.trim());
    if (cells.length !== COLUMNS.length) throw new Error(`index.md row has ${cells.length} cells, expected ${COLUMNS.length}: ${line}`);
    const row = Object.fromEntries(COLUMNS.map((c, i) => [c, cells[i]]));
    for (const k of ['total', ...DIMENSIONS.map(([d]) => d)]) row[k] = Number(row[k]);
    row.report = row.report.replace(/^\[[^\]]*\]\(([^)]*)\)$/, '$1');
    rows.push(row);
  }
  return rows.sort((a, b) => a.run_at.localeCompare(b.run_at));
}

export function rowFromReport(r, reportRel) {
  return {
    run_at: r.run.started_at,
    lab: String(r.lab.number).padStart(2, '0'),
    mode: r.mode,
    total: r.scores.total,
    ...Object.fromEntries(DIMENSIONS.map(([k]) => [k, r.scores[k].score])),
    report: reportRel,
  };
}

const formatRow = (row) => `| ${COLUMNS.map((c) => (c === 'report' ? `[json](${row.report})` : row[c])).join(' | ')} |`;

export function emptyIndex(handle) {
  return `# Coaching progress — ${handle}\n\nOne row per coach run, appended by \`node coaching/aggregate.mjs --record ${handle} <report.json>\`. Do not edit by hand.\n\n${HEADER}\n${SEP}\n`;
}

export function appendRow(md, row) {
  const lines = md.replace(/\n+$/, '').split('\n');
  let end = lines.findIndex((l) => l.trim() === HEADER) + 2;
  if (end < 2) throw new Error('index.md has no run table');
  while (end < lines.length && lines[end].trim().startsWith('|')) end++;
  lines.splice(end, 0, formatRow(row));
  return `${lines.join('\n')}\n`;
}

const pct = (score, max) => Math.round((100 * score) / max);
const signed = (n) => (n > 0 ? `+${n}` : `${n}`);

export function renderTrends(handle, rows) {
  const L = [`## ${handle}`, ''];
  if (!rows.length) return [...L, 'No runs yet.', ''].join('\n');
  const labs = [...new Set(rows.map((r) => r.lab))].sort();
  L.push(`${rows.length} run(s) across ${labs.length} lab(s), ${rows[0].run_at.slice(0, 10)} → ${rows.at(-1).run_at.slice(0, 10)}.`, '');
  L.push('| Lab | Runs | Totals (oldest → latest) | First | Latest | Best | Δ first→latest | Weakest in latest |');
  L.push('| --- | ---: | --- | ---: | ---: | ---: | ---: | --- |');
  for (const lab of labs) {
    const rs = rows.filter((r) => r.lab === lab);
    const first = rs[0];
    const last = rs.at(-1);
    const weakest = DIMENSIONS.map(([k, short, max]) => [short, pct(last[k], max)]).sort((a, b) => a[1] - b[1])[0];
    L.push(
      `| ${lab} | ${rs.length} | ${rs.map((r) => r.total).join(' → ')} | ${first.total} | ${last.total} | ${Math.max(...rs.map((r) => r.total))} | ${signed(last.total - first.total)} | ${weakest[0]} (${weakest[1]} %) |`,
    );
  }
  L.push('', 'Rubric dimensions, % of max (first run per lab vs latest run per lab, averaged):', '');
  L.push(`| Dimension | ${DIMENSIONS.map(([, s, m]) => `${s} /${m}`).join(' | ')} |`);
  L.push(`| --- | ${DIMENSIONS.map(() => '---:').join(' | ')} |`);
  const avg = (pick) => DIMENSIONS.map(([k, , max]) => Math.round(labs.reduce((a, lab) => a + pct(pick(rows.filter((r) => r.lab === lab))[k], max), 0) / labs.length));
  const firsts = avg((rs) => rs[0]);
  const lasts = avg((rs) => rs.at(-1));
  L.push(`| First | ${firsts.join(' | ')} |`);
  L.push(`| Latest | ${lasts.join(' | ')} |`);
  L.push(`| Δ | ${lasts.map((v, i) => signed(v - firsts[i])).join(' | ')} |`);
  L.push('');
  return L.join('\n');
}

async function learners(src, handles) {
  if (handles.length) return handles;
  const out = [];
  for (const h of (await src.list('coaching')).sort()) {
    try {
      await src.read(`coaching/${h}/index.md`);
      out.push(h);
    } catch {
      /* not a learner directory */
    }
  }
  return out;
}

export async function loadRows(src, handle) {
  return parseIndex(await src.read(`coaching/${handle}/index.md`));
}

export async function previousRun(src, handle, nn) {
  const lab = String(nn).padStart(2, '0');
  let rows;
  try {
    rows = await loadRows(src, handle);
  } catch {
    return null;
  }
  const last = rows.filter((r) => r.lab === lab).at(-1);
  if (!last) return null;
  const report = JSON.parse(await src.read(`coaching/${handle}/${last.report}`));
  return { ...last, runs_on_lab: rows.filter((r) => r.lab === lab).length, report };
}

export async function check(src, handles) {
  const failures = [];
  for (const h of handles) {
    for (const row of await loadRows(src, h)) {
      let r;
      try {
        r = JSON.parse(await src.read(`coaching/${h}/${row.report}`));
      } catch (e) {
        failures.push(`${h} ${row.run_at}: cannot read ${row.report} (${e.message.split('\n')[0]})`);
        continue;
      }
      const want = rowFromReport(r, row.report);
      for (const c of COLUMNS) if (want[c] !== row[c]) failures.push(`${h} ${row.run_at}: ${c} is ${row[c]} in index.md but ${want[c]} in ${row.report}`);
      const sum = DIMENSIONS.reduce((a, [k]) => a + row[k], 0);
      if (sum !== row.total) failures.push(`${h} ${row.run_at}: total ${row.total} != sum of dimensions ${sum}`);
    }
  }
  return failures;
}

export async function record(root, handle, reportPath) {
  const r = JSON.parse(await fs.readFile(reportPath, 'utf8'));
  const lab = String(r.lab.number).padStart(2, '0');
  const rel = `progress/${lab}/${r.run.started_at.replace(/:/g, '-')}.json`;
  const dir = path.join(root, 'coaching', handle);
  await fs.mkdir(path.join(dir, 'progress', lab), { recursive: true });
  await fs.writeFile(path.join(dir, rel), `${JSON.stringify({ ...r, learner: handle }, null, 2)}\n`);
  const indexPath = path.join(dir, 'index.md');
  let md;
  try {
    md = await fs.readFile(indexPath, 'utf8');
  } catch {
    md = emptyIndex(handle);
  }
  if (parseIndex(md).some((x) => x.report === rel)) throw new Error(`${rel} is already recorded`);
  await fs.writeFile(indexPath, appendRow(md, rowFromReport(r, rel)));
  return rel;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const argv = process.argv.slice(2);
  const take = (flag, n = 1) => {
    const i = argv.indexOf(flag);
    if (i < 0) return null;
    return argv.splice(i, n + 1).slice(1);
  };
  const ref = take('--ref')?.[0];
  const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  const src = source({ root, ref });
  const rec = take('--record', 2);
  const prev = take('--previous', 2);
  const doCheck = take('--check', 0);
  try {
    if (rec) {
      console.log(`recorded coaching/${rec[0]}/${await record(root, rec[0], path.resolve(rec[1]))}`);
    } else if (prev) {
      const p = await previousRun(src, prev[0], prev[1]);
      if (!p) console.log(`no previous run for ${prev[0]} on lab ${String(prev[1]).padStart(2, '0')}`);
      else {
        const weakest = DIMENSIONS.map(([k, s, m]) => [s, pct(p[k], m)]).sort((a, b) => a[1] - b[1])[0];
        console.log(`previous run for ${prev[0]} on lab ${p.lab}: ${p.run_at}, total ${p.total}, weakest ${weakest[0]} (${weakest[1]} %), run ${p.runs_on_lab} on this lab`);
        console.log(`stems: ${p.report.stems.join(' / ')}`);
      }
    } else {
      const handles = await learners(src, argv);
      if (doCheck) {
        const failures = await check(src, handles);
        for (const f of failures) console.log(` - ${f}`);
        console.log(failures.length ? `coaching index check FAILED (${failures.length})` : `coaching index check OK (${handles.join(', ')})`);
        process.exit(failures.length ? 1 : 0);
      }
      console.log('# Coaching trends\n');
      for (const h of handles) console.log(renderTrends(h, await loadRows(src, h)));
    }
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
