#!/usr/bin/env node
// Dry-run harness for the per-lab articulation coaches (plan §5).
//
//   npm run coach:dryrun -- <nn>          e.g. npm run coach:dryrun -- 05
//   node labs/coach-dryrun.mjs <nn> [--labs <dir>] [--json]
//   node labs/coach-dryrun.mjs --render <report.json>   print the Markdown rendering
//
// Expects, under labs/<nn>-<slug>/coaching/dryrun/, for each of the three
// variants strong | mediocre | off-track:
//   <variant>.md                 transcript fixture with YAML front matter
//                                (planted_fillers, planted_omissions,
//                                planted_long_pauses), "--- segment: <id> ---"
//                                headers, "[mm:ss] COACH:|LEARNER:" lines and
//                                "[mm:ss] (pause N s)" lines
//   <variant>.report.json        the gap report the coach wrote (run 1)
//   <variant>.report.md          its Markdown rendering
//   <variant>.rerun.report.json  the gap report from a second run on the same
//                                transcript (stability check)
//
// Asserts:
//   * every report validates against labs/coach-report.schema.json;
//   * every coach.segments[].id of the lab's lab.json is present, and nothing
//     else; actual_seconds agrees with the transcript markers (±5 s);
//     delta/verdict are consistent with the declared tolerance;
//   * exactly three stems; the caveat string in JSON and Markdown;
//   * totals ordered strong > mediocre > off-track with ≥15 points between
//     neighbours and total == sum of the five scores; weights sum to 30;
//   * missed must-mention ids == planted_omissions; filler_count within ±1 of
//     planted_fillers (and the transcript really contains that many);
//   * every planted long pause is reported (±5 s);
//   * second run: no score moves by more than 5 points.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const VARIANTS = ['strong', 'mediocre', 'off-track'];
export const CAVEAT = 'transcript-based, approximate';
export const MIN_GAP = 15;
export const MAX_DRIFT = 5;
export const TIMING_SLACK_SECONDS = 5;
export const ACCURACY_SHARE = 30;
export const FILLER_PATTERNS = [
  { word: 'actually', re: /\bactually\b/gi },
  { word: 'basically', re: /\bbasically\b/gi },
  { word: 'so yeah', re: /\bso,?\s+yeah\b/gi },
  { word: 'you know', re: /\byou know\b/gi },
  { word: 'like', re: /\blike,/gi },
  { word: 'um', re: /\b(?:um+|uh+|er+m*)\b/gi },
];
export const TAG_QUESTION_RE = /,\s*(?:no|right|isn't it|yes)\?/gi;

// ---------------------------------------------------------------------------
// Front matter and transcript parsing (tiny YAML subset: scalars and flow lists)

export function parseFrontMatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!m) return { data: {}, body: text };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (!kv) continue;
    data[kv[1]] = parseScalarOrList(kv[2].trim());
  }
  return { data, body: m[2] };
}

function parseScalarOrList(v) {
  if (v.startsWith('[') && v.endsWith(']')) {
    const inner = v.slice(1, -1).trim();
    return inner ? inner.split(',').map((s) => parseScalar(s.trim())) : [];
  }
  return parseScalar(v);
}

function parseScalar(v) {
  if (/^".*"$/.test(v) || /^'.*'$/.test(v)) return v.slice(1, -1);
  if (/^-?\d+$/.test(v)) return Number(v);
  if (v === 'true') return true;
  if (v === 'false') return false;
  return v;
}

export function toSeconds(mmss) {
  const m = /^(\d{1,3}):(\d{2})$/.exec(mmss);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function parseTranscript(text) {
  const { data, body } = parseFrontMatter(text);
  const segments = [];
  let current = null;
  const pauses = [];
  const learnerText = [];
  for (const raw of body.split(/\r?\n/)) {
    const seg = /^---\s*segment:\s*([a-z0-9-]+)\s*---\s*$/.exec(raw);
    if (seg) {
      current = { id: seg[1], lines: [] };
      segments.push(current);
      continue;
    }
    const pause = /^\[(\d{1,3}:\d{2})\]\s*\(pause\s+(\d+)\s*s\)/.exec(raw);
    if (pause) {
      pauses.push({ at: pause[1], seconds: Number(pause[2]), segment: current?.id });
      continue;
    }
    const line = /^\[(\d{1,3}:\d{2})\]\s*(COACH|LEARNER):\s*(.*)$/.exec(raw);
    if (line) {
      const entry = { at: line[1], t: toSeconds(line[1]), speaker: line[2], text: line[3] };
      if (current) current.lines.push(entry);
      if (entry.speaker === 'LEARNER') learnerText.push(entry.text);
    }
  }
  return { data, segments, pauses, learnerText: learnerText.join('\n') };
}

/** Segment timing from markers: coach "Go" (or first learner line) → learner "done" (or last learner line). */
export function segmentDurations(parsed) {
  const out = {};
  for (const seg of parsed.segments) {
    const go = seg.lines.find((l) => l.speaker === 'COACH' && /\bgo\b/i.test(l.text));
    const firstLearner = seg.lines.find((l) => l.speaker === 'LEARNER');
    const start = go ?? firstLearner;
    const learnerLines = seg.lines.filter((l) => l.speaker === 'LEARNER');
    const done = learnerLines.find((l) => /\bdone\b[.!]?\s*$/i.test(l.text));
    const end = done ?? learnerLines.at(-1);
    if (start && end) out[seg.id] = Math.max(0, end.t - start.t);
  }
  return out;
}

export function countFillers(learnerText) {
  let total = 0;
  const perWord = [];
  for (const { word, re } of FILLER_PATTERNS) {
    const n = (learnerText.match(re) ?? []).length;
    if (n) perWord.push({ word, count: n });
    total += n;
  }
  return { total, perWord };
}

export function countTagQuestions(learnerText) {
  return (learnerText.match(TAG_QUESTION_RE) ?? []).length;
}

// ---------------------------------------------------------------------------
// Checks

export async function loadSchema(labsDir = __dirname) {
  return JSON.parse(await fs.readFile(path.join(labsDir, 'coach-report.schema.json'), 'utf8'));
}

async function readJson(p) {
  return JSON.parse(await fs.readFile(p, 'utf8'));
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function findLabDir(labsDir, nn) {
  const want = String(nn).padStart(2, '0');
  const entries = await fs.readdir(labsDir, { withFileTypes: true });
  const hit = entries.find((e) => e.isDirectory() && e.name.startsWith(`${want}-`));
  return hit ? hit.name : null;
}

function expectedVerdict(delta, tolerance) {
  if (Math.abs(delta) <= tolerance) return 'on';
  return delta < 0 ? 'under' : 'over';
}

export async function runDryrunChecks({ labsDir = __dirname, nn } = {}) {
  const failures = [];
  const fail = (msg) => failures.push(msg);
  const summary = { lab: null, variants: {} };

  const dirName = await findLabDir(labsDir, nn);
  if (!dirName) return { ok: false, failures: [`no lab folder labs/${String(nn).padStart(2, '0')}-*`], summary };
  summary.lab = dirName;
  const labJson = await readJson(path.join(labsDir, dirName, 'lab.json'));
  const segmentIds = (labJson.coach?.segments ?? []).map((s) => s.id);
  const segmentTargets = Object.fromEntries((labJson.coach?.segments ?? []).map((s) => [s.id, s.target_seconds]));
  if (!segmentIds.length) fail(`${dirName}/lab.json has no coach.segments`);

  const ajv = new Ajv({ allErrors: true, strict: true });
  ajv.addFormat('date-time', (s) => !Number.isNaN(Date.parse(s)));
  const validate = ajv.compile(await loadSchema(labsDir));

  const dryrunDir = path.join(labsDir, dirName, 'coaching', 'dryrun');
  if (!(await exists(dryrunDir))) {
    fail(`${dirName}/coaching/dryrun/ is missing`);
    return { ok: false, failures, summary };
  }

  const reports = {};
  for (const variant of VARIANTS) {
    const base = path.join(dryrunDir, variant);
    const files = {
      transcript: `${base}.md`,
      report: `${base}.report.json`,
      reportMd: `${base}.report.md`,
      rerun: `${base}.rerun.report.json`,
    };
    let missing = false;
    for (const [kind, p] of Object.entries(files)) {
      if (!(await exists(p))) {
        fail(`${variant}: ${kind} file missing (${path.relative(labsDir, p)})`);
        missing = true;
      }
    }
    if (missing) continue;

    const transcript = parseTranscript(await fs.readFile(files.transcript, 'utf8'));
    let report;
    let rerun;
    try {
      report = await readJson(files.report);
      rerun = await readJson(files.rerun);
    } catch (err) {
      fail(`${variant}: report JSON unreadable: ${err.message}`);
      continue;
    }
    const reportMd = await fs.readFile(files.reportMd, 'utf8');

    for (const [label, r] of [
      ['report', report],
      ['rerun', rerun],
    ]) {
      if (!validate(r)) {
        for (const e of validate.errors) fail(`${variant}.${label}: schema ${e.instancePath || '/'} ${e.message}`);
      }
    }
    if (failures.some((f) => f.startsWith(`${variant}.`))) continue;

    const v = `${variant}`;
    if (report.lab.number !== labJson.number) fail(`${v}: report.lab.number ${report.lab.number} != ${labJson.number}`);
    if (report.lab.coach !== labJson.coach?.skill) fail(`${v}: report.lab.coach ${report.lab.coach} != ${labJson.coach?.skill}`);
    if (report.mode !== 'dry-run') fail(`${v}: mode must be dry-run`);

    // Timing table
    const seen = report.timing.map((t) => t.segment);
    for (const id of segmentIds) if (!seen.includes(id)) fail(`${v}: timing is missing segment "${id}"`);
    for (const id of seen) if (!segmentIds.includes(id)) fail(`${v}: timing has unknown segment "${id}"`);
    if (new Set(seen).size !== seen.length) fail(`${v}: duplicate timing segments`);
    const durations = segmentDurations(transcript);
    for (const t of report.timing) {
      if (segmentTargets[t.segment] != null && t.target_seconds !== segmentTargets[t.segment]) {
        fail(`${v}: ${t.segment} target_seconds ${t.target_seconds} != lab.json ${segmentTargets[t.segment]}`);
      }
      if (t.delta_seconds !== t.actual_seconds - t.target_seconds) fail(`${v}: ${t.segment} delta_seconds must be actual - target`);
      const want = expectedVerdict(t.delta_seconds, report.run.timing_tolerance_seconds);
      if (t.verdict !== want) fail(`${v}: ${t.segment} verdict "${t.verdict}" should be "${want}" (delta ${t.delta_seconds}, tolerance ${report.run.timing_tolerance_seconds})`);
      if (durations[t.segment] != null && Math.abs(durations[t.segment] - t.actual_seconds) > TIMING_SLACK_SECONDS) {
        fail(`${v}: ${t.segment} actual_seconds ${t.actual_seconds} disagrees with transcript markers (${durations[t.segment]} s)`);
      } else if (durations[t.segment] == null) {
        fail(`${v}: transcript has no "--- segment: ${t.segment} ---" block with marked lines`);
      }
    }

    // Stems and caveat
    if (report.stems.length !== 3) fail(`${v}: exactly three stems required`);
    if (report.clarity.caveat !== CAVEAT) fail(`${v}: clarity.caveat must be "${CAVEAT}"`);
    if (!reportMd.includes(CAVEAT)) fail(`${v}: report.md must contain "${CAVEAT}"`);

    // Scores
    const s = report.scores;
    const sum = s.accuracy.score + s.structure.score + s.customer_relevance.score + s.brevity_and_fluency.score + s.recovery.score;
    if (sum !== s.total) fail(`${v}: scores.total ${s.total} != sum of parts ${sum}`);
    const weightSum = report.must_mention.reduce((a, m) => a + m.weight, 0);
    if (weightSum !== ACCURACY_SHARE) fail(`${v}: must-mention weights sum to ${weightSum}, expected ${ACCURACY_SHARE}`);
    for (const m of report.must_mention) {
      if (!segmentIds.includes(m.belonged_in)) fail(`${v}: must_mention ${m.id} belonged_in "${m.belonged_in}" is not a segment`);
    }

    // Planted omissions, fillers, pauses
    const planted = transcript.data;
    if (Array.isArray(planted.planted_omissions)) {
      const missed = report.must_mention.filter((m) => !m.mentioned).map((m) => m.id).sort();
      const want = [...planted.planted_omissions].map(String).sort();
      if (JSON.stringify(missed) !== JSON.stringify(want)) fail(`${v}: missed must-mention ids [${missed}] != planted omissions [${want}]`);
    } else {
      fail(`${v}: transcript front matter needs planted_omissions (use [] for none)`);
    }
    if (Number.isInteger(planted.planted_fillers)) {
      const counted = countFillers(transcript.learnerText).total;
      if (counted !== planted.planted_fillers) fail(`${v}: transcript contains ${counted} filler(s) but front matter plants ${planted.planted_fillers}`);
      if (Math.abs(report.fillers_and_pauses.filler_count - planted.planted_fillers) > 1) {
        fail(`${v}: filler_count ${report.fillers_and_pauses.filler_count} not within ±1 of planted ${planted.planted_fillers}`);
      }
    } else {
      fail(`${v}: transcript front matter needs planted_fillers`);
    }
    const plantedPauses = Array.isArray(planted.planted_long_pauses) ? planted.planted_long_pauses.map(String) : [];
    for (const at of plantedPauses) {
      const want = toSeconds(at);
      if (want == null) {
        fail(`${v}: planted_long_pauses entry "${at}" is not mm:ss`);
        continue;
      }
      if (!transcript.pauses.some((p) => toSeconds(p.at) === want)) fail(`${v}: transcript has no "[${at}] (pause N s)" line for the planted pause`);
      if (!report.fillers_and_pauses.long_pauses.some((p) => Math.abs(toSeconds(p.at) - want) <= TIMING_SLACK_SECONDS)) {
        fail(`${v}: planted long pause at ${at} not reported`);
      }
    }

    // Stability
    const drift = {};
    for (const key of ['accuracy', 'structure', 'customer_relevance', 'brevity_and_fluency', 'recovery', 'total']) {
      const a = key === 'total' ? report.scores.total : report.scores[key].score;
      const b = key === 'total' ? rerun.scores.total : rerun.scores[key].score;
      drift[key] = Math.abs(a - b);
      if (drift[key] > MAX_DRIFT) fail(`${v}: ${key} moved by ${drift[key]} between runs (max ${MAX_DRIFT})`);
    }

    reports[variant] = report;
    summary.variants[variant] = {
      total: report.scores.total,
      rerun_total: rerun.scores.total,
      missed: report.must_mention.filter((m) => !m.mentioned).map((m) => m.id),
      fillers: report.fillers_and_pauses.filler_count,
      long_pauses: report.fillers_and_pauses.long_pauses.map((p) => p.at),
    };
  }

  // Ordering across variants
  if (VARIANTS.every((vv) => reports[vv])) {
    const [a, b, c] = VARIANTS.map((vv) => reports[vv].scores.total);
    if (a - b < MIN_GAP) fail(`ordering: strong (${a}) must exceed mediocre (${b}) by ≥${MIN_GAP}`);
    if (b - c < MIN_GAP) fail(`ordering: mediocre (${b}) must exceed off-track (${c}) by ≥${MIN_GAP}`);
  }

  return { ok: failures.length === 0, failures, summary };
}

// ---------------------------------------------------------------------------
// Markdown rendering of a report (the fixed gap-report template)

export function renderReportMarkdown(r) {
  const L = [];
  L.push(`# Articulation gap report — lab ${String(r.lab.number).padStart(2, '0')} ${r.lab.slug} (${r.lab.coach})`);
  L.push('');
  L.push(`Learner: **${r.learner}** · mode: ${r.mode}${r.run.run_index ? ` · run ${r.run.run_index}` : ''} · ${r.run.started_at} · timing: ${r.run.timing_method} (±${r.run.timing_tolerance_seconds} s)${r.run.transcript ? ` · transcript: \`${r.run.transcript}\`` : ''}`);
  L.push('');
  L.push(`## Scores — ${r.scores.total}/100`);
  L.push('');
  L.push('| Dimension | Score | Anchor |');
  L.push('|---|---:|---|');
  for (const [k, label] of [
    ['accuracy', 'Accuracy'],
    ['structure', 'Structure'],
    ['customer_relevance', 'Customer relevance'],
    ['brevity_and_fluency', 'Brevity and fluency'],
    ['recovery', 'Recovery'],
  ]) {
    L.push(`| ${label} | ${r.scores[k].score}/${r.scores[k].max} | ${r.scores[k].anchor} |`);
  }
  L.push('');
  L.push('## Timing vs target');
  L.push('');
  L.push('| Segment | Target | Actual | Delta | Verdict |');
  L.push('|---|---:|---:|---:|---|');
  for (const t of r.timing) {
    L.push(`| ${t.label ?? t.segment}${t.question ? ` — “${t.question}”` : ''} | ${t.target_seconds} s | ${t.actual_seconds} s | ${t.delta_seconds >= 0 ? '+' : ''}${t.delta_seconds} s | ${t.verdict} |`);
  }
  L.push('');
  L.push('## Structure (problem → approach → evidence → next step)');
  L.push('');
  for (const [k, label] of [
    ['problem', 'Problem'],
    ['approach', 'Approach'],
    ['evidence', 'Evidence'],
    ['next_step', 'Next step'],
  ]) {
    const p = r.structure[k];
    L.push(`- **${label}** — ${p.status}${p.quote ? `: “${p.quote}”` : ''}`);
  }
  if (typeof r.structure.order_held === 'boolean') L.push(`- Update order (Outcome → Evidence → Risk → Next action → Ask) held: ${r.structure.order_held ? 'yes' : 'no'}`);
  L.push('');
  L.push('## Fillers and pauses');
  L.push('');
  const f = r.fillers_and_pauses;
  L.push(`- Fillers: ${f.filler_count} in ${f.spoken_minutes} spoken min (${f.filler_rate_per_minute}/min)${f.fillers.length ? ` — ${f.fillers.map((x) => `${x.word} ×${x.count}`).join(', ')}` : ''}`);
  L.push(`- Tag questions: ${f.tag_questions}${f.tag_question_examples?.length ? ` (${f.tag_question_examples.map((x) => `“${x}”`).join(', ')})` : ''}`);
  L.push(`- Pauses over 8 s: ${f.long_pauses.length ? f.long_pauses.map((p) => `${p.seconds} s at [${p.at}]${p.segment ? ` in ${p.segment}` : ''}`).join('; ') : 'none'}`);
  L.push('');
  L.push('## Missing key points');
  L.push('');
  for (const m of r.must_mention) {
    L.push(`- [${m.mentioned ? 'x' : ' '}] ${m.point} (${m.weight})${m.mentioned ? (m.evidence_quote ? ` — “${m.evidence_quote}”` : '') : ` — missed; belonged in ${m.belonged_in}`}`);
  }
  L.push('');
  L.push(`## Clarity and pronunciation (${r.clarity.caveat})`);
  L.push('');
  L.push(`- Misrecognised words: ${r.clarity.misrecognised_words.join(', ') || 'none'}`);
  L.push(`- Repeated words: ${r.clarity.repeated_words.join(', ') || 'none'}`);
  L.push(`- Coach asked “did you say…?”: ${r.clarity.clarification_requests.length ? r.clarity.clarification_requests.join('; ') : 'never'}`);
  L.push(`- Article/plural slips: ${r.clarity.article_plural_slips.join('; ') || 'none'}`);
  if (r.clarity.sentences_to_rerecord?.length) L.push(`- Re-record: ${r.clarity.sentences_to_rerecord.map((x) => `“${x}”`).join('; ')}`);
  L.push('');
  L.push('## Three stems for next time');
  L.push('');
  for (const s of r.stems) L.push(`1. ${s}`);
  L.push('');
  L.push(`## Compared with your previous run`);
  L.push('');
  L.push(r.previous_run_comparison);
  L.push('');
  L.push(`_All clarity lines are ${r.clarity.caveat}; timings are ±${r.run.timing_tolerance_seconds} s._`);
  L.push('');
  return L.join('\n');
}

function parseArgs(argv) {
  const opts = {};
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--labs') opts.labsDir = path.resolve(argv[++i]);
    else if (a === '--json') opts.json = true;
    else if (a === '--render') opts.render = path.resolve(argv[++i]);
    else if (a === '--help' || a === '-h') {
      console.log('usage: node labs/coach-dryrun.mjs <nn> [--labs <dir>] [--json] | --render <report.json>');
      process.exit(0);
    } else rest.push(a);
  }
  const nn = rest.find((r) => /^\d{1,2}$/.test(r));
  if (opts.render) return opts;
  if (nn == null) {
    console.error('usage: node labs/coach-dryrun.mjs <nn>   (e.g. npm run coach:dryrun -- 05)');
    process.exit(2);
  }
  return { ...opts, nn };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.render) {
    fs.readFile(opts.render, 'utf8')
      .then((t) => process.stdout.write(renderReportMarkdown(JSON.parse(t))))
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
  } else runDryrunChecks(opts)
    .then((r) => {
      if (opts.json) {
        console.log(JSON.stringify(r, null, 2));
      } else {
        console.log(`coach:dryrun ${r.summary.lab ?? opts.nn}`);
        for (const [v, s] of Object.entries(r.summary.variants)) {
          console.log(`  ${v.padEnd(10)} total ${String(s.total).padStart(3)} (rerun ${s.rerun_total})  missed [${s.missed.join(', ')}]  fillers ${s.fillers}  pauses [${s.long_pauses.join(', ')}]`);
        }
        if (r.ok) console.log('  OK');
        else {
          console.log(`  FAILED (${r.failures.length}):`);
          for (const f of r.failures) console.log(`   - ${f}`);
        }
      }
      process.exit(r.ok ? 0 : 1);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
