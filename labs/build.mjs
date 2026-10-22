#!/usr/bin/env node
// Kadé Commerce lab page builder.
//
// Turns every labs/NN-slug/{lab.json,brief.md,criteria.md,drill.md,answer.md}
// into one self-contained static HTML page (11-section template) and
// generates labs/index.html from the folders present.
//
//   node labs/build.mjs            render all labs + index
//   node labs/build.mjs --check    validate and render in memory, write nothing
//   node labs/build.mjs --labs <dir> --out <dir> --repo <dir>
//
// Rules enforced at build time (the build fails, exit 1):
//   * every lab has the five source files and the required lab.json fields;
//   * brief.md has the two H2 headings "Customer brief" and
//     "Stakeholders and constraints";
//   * no learner-facing file (lab.json, brief.md, criteria.md, drill.md)
//     contains a fenced block tagged `prompt`;
//   * no learner-facing file contains a must-mention point or an objection
//     of the lab's articulation coach verbatim (sources: the coach skill
//     under .devin/skills and the lab's dry-run reports);
//   * answer.md is only ever emitted inside a <template>.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const LEARNER_FACING_FILES = ['lab.json', 'brief.md', 'criteria.md', 'drill.md'];
export const SOURCE_FILES = [...LEARNER_FACING_FILES, 'answer.md'];
export const LAB_DIR_PATTERN = /^(\d{2})-([a-z0-9][a-z0-9-]*)$/;
export const CAVEAT = 'transcript-based, approximate';
export const SECTION_TITLES = [
  'Header',
  'Customer brief',
  'Stakeholders and constraints',
  'Starting state and reset',
  'Acceptance criteria',
  'Credential matrix and fixture fallback',
  'Edge cases and injectors',
  'Articulation drill (voice coach)',
  'Show answer',
  'Debrief',
  'References',
];

export class BuildError extends Error {
  constructor(problems) {
    super(`Lab build failed:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
    this.problems = problems;
  }
}

// ---------------------------------------------------------------------------
// Markdown

// Relative links and fragments are fine; absolute URLs must be http(s) or mailto.
// Browsers strip tabs/newlines and leading controls before parsing the scheme, and a
// percent-decoded prefix must not smuggle one past us either: judge the decoded,
// control-stripped form and require any scheme to be http(s) or mailto.
function canonicalHref(href) {
  let decoded = href;
  try {
    decoded = decodeURIComponent(href);
  } catch {
    /* keep the raw href; a malformed escape is not a scheme */
  }
  return decoded.replace(/[\u0000-\u0020\u007f-\u009f]/g, '');
}
const hasScheme = (href) => /^[a-z][a-z0-9+.-]*:/i.test(canonicalHref(href));
const isSafeHref = (href) => !hasScheme(href) || /^(https?|mailto):/i.test(canonicalHref(href));

function makeMarked() {
  const marked = new Marked({ gfm: true, breaks: false });
  marked.use({
    renderer: {
      // Lab content is data, not code: raw HTML is shown literally, images are dropped
      // (pages must be self-contained) and only safe link schemes survive.
      html({ text }) {
        return escapeHtml(text);
      },
      image({ text }) {
        return escapeHtml(text);
      },
      link({ href, title, tokens }) {
        const body = this.parser.parseInline(tokens);
        if (!isSafeHref(href ?? '')) return body;
        const t = title ? ` title="${escapeHtml(title)}"` : '';
        return `<a href="${escapeHtml(href)}"${t} rel="noopener">${body}</a>`;
      },
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const level = Math.min(depth + 2, 6);
        return `<h${level}>${text}</h${level}>\n`;
      },
    },
  });
  return marked;
}

const marked = makeMarked();

export function renderMarkdown(md) {
  return marked.parse(md ?? '');
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Split a markdown document by H2 headings. Returns { preamble, sections: [{title, body}] }. */
export function splitByH2(md) {
  const lines = (md ?? '').split(/\r?\n/);
  const sections = [];
  let current = null;
  const preamble = [];
  let inFence = false;
  for (const line of lines) {
    if (/^(```|~~~)/.test(line)) inFence = !inFence;
    const m = !inFence && /^##\s+(.+?)\s*#*\s*$/.exec(line);
    if (m) {
      current = { title: m[1].trim(), body: [] };
      sections.push(current);
    } else if (current) {
      current.body.push(line);
    } else {
      preamble.push(line);
    }
  }
  return {
    preamble: preamble.join('\n').trim(),
    sections: sections.map((s) => ({ title: s.title, body: s.body.join('\n').trim() })),
  };
}

function findSection(split, title) {
  const want = normalise(title);
  return split.sections.find((s) => normalise(s.title) === want);
}

// ---------------------------------------------------------------------------
// Leak checks

/** Fenced blocks whose info string starts with the word `prompt` (any case). */
export function findPromptFences(text) {
  const hits = [];
  const lines = (text ?? '').split(/\r?\n/);
  lines.forEach((line, i) => {
    const m = /^\s*(```+|~~~+)\s*([^\s`~]+)/.exec(line);
    if (m && m[2].toLowerCase() === 'prompt') hits.push(i + 1);
  });
  return hits;
}

export function normalise(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[`*_~>#|[\]()"'“”‘’]/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const MIN_PHRASE_WORDS = 3;

/**
 * Extract must-mention points and objections from a coach SKILL.md.
 * Any list item or table row under a heading whose text contains
 * "must-mention" / "must mention" or "objection" counts.
 */
export function extractCoachPhrases(skillMarkdown) {
  const phrases = [];
  let active = null;
  for (const raw of (skillMarkdown ?? '').split(/\r?\n/)) {
    const h = /^#{1,6}\s+(.+?)\s*$/.exec(raw);
    if (h) {
      const t = h[1].toLowerCase();
      active = /must[-_ ](mention|say)/.test(t) ? 'must-mention' : /objection/.test(t) ? 'objection' : null;
      continue;
    }
    if (!active) continue;
    const li = /^\s*(?:[-*+]|\d+[.)])\s+(.+)$/.exec(raw);
    if (li) {
      phrases.push({ kind: active, text: stripListDecorations(li[1]) });
      continue;
    }
    const row = /^\s*\|(.+)\|\s*$/.exec(raw);
    if (row) {
      const cells = row[1].split('|').map((c) => c.trim());
      if (cells.every((c) => /^:?-{3,}:?$/.test(c))) continue;
      for (const cell of cells) {
        if (cell && !/^(id|point|weight|cue|objection|kind|#)$/i.test(cell) && !/^\d+$/.test(cell) && !/^[a-z]{1,3}\d+$/i.test(cell)) {
          phrases.push({ kind: active, text: stripListDecorations(cell) });
        }
      }
    }
  }
  return phrases;
}

function stripListDecorations(text) {
  return text
    .replace(/^\*\*[^*]+\*\*\s*[:—-]\s*/, '') // leading bold label
    .replace(/^`[^`]+`\s*[:—-]\s*/, '') // leading code id
    .replace(/^\[?[a-z]{1,3}\d{1,2}\]?\s*[:.)—-]\s*/i, '') // mm1: / [mm1] / o1)
    .replace(/\s*\((?:w(?:eight)?\s*\d+|\d+\s*(?:pts?|points?))\)\s*$/i, '')
    .trim();
}

/** Phrases that the lab's dry-run reports reveal (must-mention points and objection questions). */
export function extractReportPhrases(report) {
  const phrases = [];
  for (const mm of report?.must_mention ?? []) {
    if (mm?.point) phrases.push({ kind: 'must-mention', text: mm.point });
  }
  for (const seg of report?.timing ?? []) {
    if (seg?.kind === 'objection' && seg.question) phrases.push({ kind: 'objection', text: seg.question });
  }
  return phrases;
}

export function findPhraseLeaks(fileText, phrases) {
  const hay = normalise(fileText);
  const leaks = [];
  for (const p of phrases) {
    const needle = normalise(p.text);
    if (!needle || needle.split(' ').length < MIN_PHRASE_WORDS) continue;
    if (hay.includes(needle)) leaks.push(p);
  }
  return leaks;
}

// ---------------------------------------------------------------------------
// lab.json validation

const DIFFICULTIES = ['intro', 'core', 'advanced'];
const BADGES = ['full', 'fixture'];

export function validateLabJson(lab, dirName) {
  const problems = [];
  const req = (cond, msg) => {
    if (!cond) problems.push(`${dirName}/lab.json: ${msg}`);
  };
  const m = LAB_DIR_PATTERN.exec(dirName);
  req(m, 'folder name must be NN-slug');
  if (m) {
    req(Number(lab.number) === Number(m[1]), `number must be ${Number(m[1])} (folder ${dirName})`);
    req(lab.slug === m[2], `slug must be "${m[2]}" (folder ${dirName})`);
  }
  req(typeof lab.title === 'string' && lab.title.trim(), 'title is required');
  req(typeof lab.feature === 'string' && lab.feature.trim(), 'feature is required');
  req(Number.isInteger(lab.duration_minutes) && lab.duration_minutes > 0, 'duration_minutes must be a positive integer');
  req(DIFFICULTIES.includes(lab.difficulty), `difficulty must be one of ${DIFFICULTIES.join(', ')}`);
  req(Array.isArray(lab.prerequisites), 'prerequisites must be an array');
  req(lab.credentials && BADGES.includes(lab.credentials.badge), `credentials.badge must be one of ${BADGES.join(', ')}`);
  req(lab.credentials && Array.isArray(lab.credentials.matrix), 'credentials.matrix must be an array');
  req(lab.credentials && Array.isArray(lab.credentials.not_exercised), 'credentials.not_exercised must be an array');
  req(lab.scenarios && Array.isArray(lab.scenarios.reset) && lab.scenarios.reset.length > 0, 'scenarios.reset must list at least one command');
  req(lab.scenarios && typeof lab.scenarios.clean_state === 'string', 'scenarios.clean_state is required');
  req(Array.isArray(lab.injectors), 'injectors must be an array');
  for (const [i, inj] of (lab.injectors ?? []).entries()) {
    req(inj && inj.name && inj.behaviour, `injectors[${i}] needs name and behaviour`);
  }
  req(lab.coach && typeof lab.coach.skill === 'string' && /^coach-\d{2}-[a-z0-9-]+$/.test(lab.coach.skill), 'coach.skill must look like coach-NN-slug');
  if (m && lab.coach?.skill) req(lab.coach.skill === `coach-${m[1]}-${m[2]}`, `coach.skill must be coach-${m[1]}-${m[2]}`);
  req(lab.coach && Array.isArray(lab.coach.segments) && lab.coach.segments.length >= 4, 'coach.segments must list framing, checkpoint(s), update and objections');
  const ids = new Set();
  for (const [i, seg] of (lab.coach?.segments ?? []).entries()) {
    req(seg && typeof seg.id === 'string' && /^[a-z0-9-]+$/.test(seg.id), `coach.segments[${i}].id must be kebab-case`);
    req(seg && ['framing', 'checkpoint', 'update', 'objection'].includes(seg.kind), `coach.segments[${i}].kind invalid`);
    req(seg && Number.isInteger(seg.target_seconds) && seg.target_seconds > 0, `coach.segments[${i}].target_seconds must be a positive integer`);
    if (seg?.id) {
      req(!ids.has(seg.id), `coach.segments[${i}].id "${seg.id}" duplicated`);
      ids.add(seg.id);
    }
  }
  req(Array.isArray(lab.references) && lab.references.length > 0, 'references must list at least one official doc');
  for (const [i, ref] of (lab.references ?? []).entries()) {
    req(ref && ref.title && /^https:\/\//.test(ref.url ?? ''), `references[${i}] needs title and https url`);
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Loading

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function readIfExists(p) {
  return (await exists(p)) ? fs.readFile(p, 'utf8') : null;
}

export async function discoverLabDirs(labsDir) {
  const entries = await fs.readdir(labsDir, { withFileTypes: true });
  const dirs = [];
  for (const e of entries) {
    if (!e.isDirectory() || !LAB_DIR_PATTERN.test(e.name)) continue;
    const dir = path.join(labsDir, e.name);
    let hasSource = false;
    for (const name of SOURCE_FILES) if (await exists(path.join(dir, name))) hasSource = true;
    if (hasSource) dirs.push(e.name);
  }
  return dirs.sort();
}

export async function loadLab(labsDir, dirName, repoDir) {
  const dir = path.join(labsDir, dirName);
  const problems = [];
  const files = {};
  for (const name of SOURCE_FILES) {
    const text = await readIfExists(path.join(dir, name));
    if (text === null) problems.push(`${dirName}/${name} is missing`);
    files[name] = text ?? '';
  }
  let lab = {};
  if (files['lab.json']) {
    try {
      lab = JSON.parse(files['lab.json']);
    } catch (err) {
      problems.push(`${dirName}/lab.json is not valid JSON: ${err.message}`);
    }
  }
  if (problems.length) return { dirName, dir, lab, files, problems };

  problems.push(...validateLabJson(lab, dirName));

  const brief = splitByH2(files['brief.md']);
  if (!findSection(brief, 'Customer brief')) problems.push(`${dirName}/brief.md needs an H2 "## Customer brief"`);
  if (!findSection(brief, 'Stakeholders and constraints')) problems.push(`${dirName}/brief.md needs an H2 "## Stakeholders and constraints"`);

  for (const name of LEARNER_FACING_FILES) {
    for (const line of findPromptFences(files[name])) {
      problems.push(`${dirName}/${name}:${line} contains a fenced block tagged "prompt" (prompts belong in answer.md only)`);
    }
  }

  const phrases = await collectCoachPhrases(repoDir, labsDir, dirName, lab);
  for (const name of LEARNER_FACING_FILES) {
    for (const leak of findPhraseLeaks(files[name], phrases)) {
      problems.push(`${dirName}/${name} leaks a coach ${leak.kind} verbatim: "${leak.text}"`);
    }
  }

  return { dirName, dir, lab, files, brief, problems };
}

export async function collectCoachPhrases(repoDir, labsDir, dirName, lab) {
  const phrases = [];
  const m = LAB_DIR_PATTERN.exec(dirName);
  if (!m) return phrases;
  const [, nn, slug] = m;
  const skillCandidates = [
    path.join(repoDir, '.devin', 'skills', 'articulation', `${nn}-${slug}`, 'SKILL.md'),
    path.join(repoDir, '.devin', 'skills', 'articulation', slug, 'SKILL.md'),
    path.join(repoDir, '.devin', 'skills', `coach-${nn}-${slug}`, 'SKILL.md'),
    path.join(repoDir, '.devin', 'skills', `articulation-${slug}`, 'SKILL.md'),
    path.join(repoDir, '.devin', 'skills', `articulation-${nn}-${slug}`, 'SKILL.md'),
  ];
  if (lab?.coach?.skill_path) skillCandidates.unshift(path.resolve(repoDir, lab.coach.skill_path));
  for (const candidate of skillCandidates) {
    const text = await readIfExists(candidate);
    if (text !== null) {
      phrases.push(...extractCoachPhrases(text));
      break;
    }
  }
  const dryrunDir = path.join(labsDir, dirName, 'coaching', 'dryrun');
  if (await exists(dryrunDir)) {
    for (const f of (await fs.readdir(dryrunDir)).filter((f) => f.endsWith('.report.json')).sort()) {
      try {
        phrases.push(...extractReportPhrases(JSON.parse(await fs.readFile(path.join(dryrunDir, f), 'utf8'))));
      } catch {
        /* malformed reports are the dry-run harness's problem, not the page build's */
      }
    }
  }
  const seen = new Set();
  return phrases.filter((p) => {
    const k = `${p.kind}:${normalise(p.text)}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Rendering

const CSS = `
:root{--ink:#1d1d1f;--muted:#5c5f66;--line:#d9dbe0;--bg:#fff;--panel:#f5f6f8;--accent:#0b5fff;--accent-ink:#fff;--warn:#8a4b00;--warn-bg:#fff4e5;--ok:#0a6b3d;--ok-bg:#e7f6ee;--focus:#ff8c00}
@media (prefers-color-scheme:dark){:root{--ink:#e8e8ea;--muted:#a3a6ad;--line:#3a3d44;--bg:#131417;--panel:#1c1e23;--accent:#7aa7ff;--accent-ink:#0b1020;--warn:#ffc777;--warn-bg:#3a2a10;--ok:#7fd6a4;--ok-bg:#10301f}}
*{box-sizing:border-box}
html{font-size:17px;line-height:1.55;-webkit-text-size-adjust:100%}
body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Ubuntu,sans-serif;color:var(--ink);background:var(--bg)}
a{color:var(--accent)}
:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
.skip{position:absolute;left:-999px;top:0;background:var(--accent);color:var(--accent-ink);padding:.5rem 1rem;z-index:10}
.skip:focus{left:1rem;top:1rem}
.wrap{max-width:68rem;margin:0 auto;padding:1.5rem 1.25rem 4rem}
header.lab{border-bottom:1px solid var(--line);padding-bottom:1rem;margin-bottom:1rem}
header.lab h1{margin:.25rem 0 .5rem;font-size:2rem;line-height:1.2}
.crumbs{font-size:.9rem;color:var(--muted)}
.meta{display:flex;flex-wrap:wrap;gap:.5rem 1.25rem;list-style:none;padding:0;margin:.5rem 0}
.meta li{font-size:.95rem}
.meta b{color:var(--muted);font-weight:600}
.badge{display:inline-block;border-radius:999px;padding:.1rem .6rem;font-size:.85rem;font-weight:600;border:1px solid transparent}
.badge-full{background:var(--ok-bg);color:var(--ok)}
.badge-fixture{background:var(--warn-bg);color:var(--warn)}
nav.toc ol{columns:2;column-gap:2rem;padding-left:1.25rem;margin:.5rem 0}
nav.toc li{break-inside:avoid;margin:.15rem 0}
section.lab-section{padding:1.25rem 0;border-bottom:1px solid var(--line)}
section.lab-section>h2{font-size:1.35rem;margin:0 0 .75rem}
section.lab-section>h2 .num{color:var(--muted);font-weight:500;margin-right:.5rem}
h3{font-size:1.1rem;margin:1.25rem 0 .5rem}
table{border-collapse:collapse;width:100%;margin:.75rem 0;font-size:.95rem}
th,td{text-align:left;vertical-align:top;padding:.45rem .6rem;border:1px solid var(--line)}
th{background:var(--panel)}
code,pre{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.92em}
pre{background:var(--panel);padding:.8rem 1rem;overflow:auto;border-radius:6px}
.callout{background:var(--panel);border-left:4px solid var(--accent);padding:.75rem 1rem;margin:.75rem 0;border-radius:0 6px 6px 0}
.callout.warn{border-color:var(--warn)}
.start-line{font-size:1.05rem}
button.reveal{font:inherit;font-weight:600;background:var(--accent);color:var(--accent-ink);border:0;border-radius:6px;padding:.6rem 1.1rem;cursor:pointer}
button.reveal[aria-expanded="true"]{background:var(--panel);color:var(--ink);border:1px solid var(--line)}
.answer-panel{margin-top:1rem}
.answer-panel:empty{display:none}
.answer-panel[tabindex]{outline-offset:6px}
.placeholder{color:var(--muted);font-style:italic}
footer{margin-top:2rem;font-size:.85rem;color:var(--muted)}
.index-table a{font-weight:600}
@media print{nav.toc,button.reveal,.skip{display:none}section.lab-section{break-inside:avoid}}
`;

const JS = `
(function(){
  var btn=document.getElementById('show-answer');
  var tpl=document.getElementById('answer-template');
  var answer=document.getElementById('answer-panel');
  var debrief=document.getElementById('debrief-panel');
  var placeholder=document.getElementById('debrief-placeholder');
  if(!btn||!tpl||!answer||!debrief){return;}
  var shown=false;
  function render(){
    answer.replaceChildren();debrief.replaceChildren();
    if(shown){
      var frag=tpl.content.cloneNode(true);
      var a=frag.querySelector('[data-slot="answer"]');
      var d=frag.querySelector('[data-slot="debrief"]');
      if(a){answer.append.apply(answer,Array.prototype.slice.call(a.childNodes));}
      if(d){debrief.append.apply(debrief,Array.prototype.slice.call(d.childNodes));}
    }
    if(placeholder){placeholder.hidden=shown;}
    btn.setAttribute('aria-expanded',shown?'true':'false');
    btn.textContent=shown?'Hide answer':'Show answer';
    if(shown){answer.focus();}
  }
  btn.addEventListener('click',function(){shown=!shown;render();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&shown){shown=false;render();btn.focus();}});
  window.addEventListener('pageshow',function(e){if(e.persisted&&shown){shown=false;render();}});
})();
`;

function sectionShell(n, title, inner, extraAttrs = '') {
  const id = `section-${n}`;
  return `<section class="lab-section" id="${id}" aria-labelledby="${id}-h"${extraAttrs}>
<h2 id="${id}-h"><span class="num" aria-hidden="true">${n}.</span>${escapeHtml(title)}</h2>
${inner}
</section>`;
}

function renderList(items, map) {
  if (!items?.length) return '<p class="placeholder">None.</p>';
  return `<ul>${items.map((i) => `<li>${map(i)}</li>`).join('')}</ul>`;
}

function renderHeader(lab, dirName) {
  const badgeText = lab.credentials.badge === 'full' ? 'Credentials: full' : 'Credentials: fixture';
  return `<header class="lab">
<p class="crumbs"><a href="../index.html">Kadé Commerce labs</a> › Lab ${pad(lab.number)}</p>
<h1>Lab ${pad(lab.number)} — ${escapeHtml(lab.title)}</h1>
<ul class="meta">
<li><b>Devin feature:</b> ${escapeHtml(lab.feature)}</li>
<li><b>Duration:</b> ${lab.duration_minutes} min</li>
<li><b>Difficulty:</b> ${escapeHtml(lab.difficulty)}</li>
<li><b>Prerequisites:</b> ${lab.prerequisites.length ? lab.prerequisites.map(escapeHtml).join('; ') : 'none'}</li>
<li><span class="badge badge-${lab.credentials.badge}">${badgeText}</span></li>
</ul>
<nav class="toc" aria-label="Sections"><ol>${SECTION_TITLES.map((t, i) => `<li><a href="#section-${i + 1}">${escapeHtml(t)}</a></li>`).join('')}</ol></nav>
</header>`;
}

function renderReset(lab) {
  const cmds = lab.scenarios.reset.map((c) => `<pre><code>${escapeHtml(c)}</code></pre>`).join('');
  return `<p>Run before you start, and again whenever you want the starting state back:</p>${cmds}<h3>What “clean” looks like</h3>${renderMarkdown(lab.scenarios.clean_state)}`;
}

function renderCredentials(lab) {
  const rows = lab.credentials.matrix
    .map(
      (r) => `<tr><td>${escapeHtml(r.integration)}</td><td>${r.required ? 'required' : 'optional'}</td><td>${escapeHtml(r.fixture ?? '—')}</td><td>${escapeHtml(r.note ?? '')}</td></tr>`,
    )
    .join('');
  const table = lab.credentials.matrix.length
    ? `<table><thead><tr><th>Integration</th><th>Needed</th><th>Fixture fallback</th><th>Note</th></tr></thead><tbody>${rows}</tbody></table>`
    : '<p>This lab needs no external credentials.</p>';
  const fixtureOnly = lab.credentials.fixture_only_story ? renderMarkdown(lab.credentials.fixture_only_story) : '';
  const ne = renderList(lab.credentials.not_exercised, escapeHtml);
  return `${table}${fixtureOnly ? `<h3>With fixtures only</h3>${fixtureOnly}` : ''}<h3>Cannot be exercised without live credentials</h3>${ne}`;
}

function renderInjectors(lab) {
  if (!lab.injectors.length) return '<p>No injectors in this lab.</p>';
  const rows = lab.injectors
    .map(
      (i) =>
        `<tr><td><code>${escapeHtml(i.name)}</code></td><td>${i.command ? `<code>${escapeHtml(i.command)}</code>` : '<span class="placeholder">facilitator action</span>'}</td><td>${escapeHtml(i.when ?? 'any time')}</td><td>${escapeHtml(i.behaviour)}</td></tr>`,
    )
    .join('');
  return `<table><thead><tr><th>Injector</th><th>Command</th><th>When</th><th>Behaviour it triggers</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderDrill(lab, drillMd) {
  const handle = lab.coach.handle_hint ?? '<your-handle>';
  const startLine = `@skills:${lab.coach.skill} ${handle}`;
  const segRows = lab.coach.segments
    .map(
      (s) =>
        `<tr><td>${escapeHtml(s.label ?? s.id)}</td><td>${escapeHtml(s.kind)}</td><td>${s.at_minute != null ? `T+${s.at_minute} min` : '—'}</td><td>${formatSeconds(s.target_seconds)}</td></tr>`,
    )
    .join('');
  return `${renderMarkdown(drillMd)}
<h3>Timing table</h3>
<table><thead><tr><th>Segment</th><th>Kind</th><th>When</th><th>Target</th></tr></thead><tbody>${segRows}</tbody></table>
<h3>Start the Devin voice coach</h3>
<div class="callout">
<p class="start-line">In the Devin web app, select this repo in <b>Agent</b> mode, type exactly the line below, then click <b>Start voice call</b>:</p>
<pre><code>${escapeHtml(startLine)}</code></pre>
<p>Replace <code>${handle}</code> with your handle. If the call connects before the skill activates, press Enter first and then start the call in the same session.</p>
<p><b>Mute hint:</b> between checkpoints you may mute and keep working; the call stays connected. Hold <kbd>Space</kbd> to talk if your client offers push-to-talk, and say “done” when you finish a timed segment.</p>
</div>
<div class="callout warn"><p><b>Caveat:</b> clarity and pronunciation feedback from the coach is <b>${CAVEAT}</b>. The coach works from the speech transcript in the session history, not from audio, so it cannot judge intonation, stress or vowel quality. Record yourself and listen back for real pronunciation work.</p></div>`;
}

function renderReferences(lab) {
  return `<ul>${lab.references
    .map(
      (r) =>
        `<li><a href="${escapeHtml(r.url)}" rel="noopener">${escapeHtml(r.title)}</a>${r.date ? ` <span class="placeholder">(${escapeHtml(r.date)})</span>` : ''}${r.note ? ` — ${escapeHtml(r.note)}` : ''}</li>`,
    )
    .join('')}</ul>`;
}

function formatSeconds(s) {
  if (s % 60 === 0) return `${s / 60} min`;
  if (s > 60) return `${Math.floor(s / 60)} min ${s % 60} s`;
  return `${s} s`;
}

export function pad(n) {
  return String(n).padStart(2, '0');
}

export function renderLabPage(loaded) {
  const { lab, files, brief } = loaded;
  const customerBrief = findSection(brief, 'Customer brief');
  const stakeholders = findSection(brief, 'Stakeholders and constraints');
  const answerSplit = splitByH2(files['answer.md']);
  const debriefIdx = answerSplit.sections.findIndex((s) => normalise(s.title) === 'debrief');
  const answerBody = [
    answerSplit.preamble,
    ...answerSplit.sections.filter((_, i) => i !== debriefIdx).map((s) => `## ${s.title}\n\n${s.body}`),
  ]
    .filter(Boolean)
    .join('\n\n');
  const debriefBody = debriefIdx >= 0 ? answerSplit.sections[debriefIdx].body : '';

  const sections = [
    renderHeader(lab, loaded.dirName),
    sectionShell(2, SECTION_TITLES[1], `${brief.preamble ? renderMarkdown(brief.preamble) : ''}${renderMarkdown(customerBrief.body)}`),
    sectionShell(3, SECTION_TITLES[2], renderMarkdown(stakeholders.body)),
    sectionShell(4, SECTION_TITLES[3], renderReset(lab)),
    sectionShell(5, SECTION_TITLES[4], renderMarkdown(files['criteria.md'])),
    sectionShell(6, SECTION_TITLES[5], renderCredentials(lab)),
    sectionShell(7, SECTION_TITLES[6], renderInjectors(lab)),
    sectionShell(8, SECTION_TITLES[7], renderDrill(lab, files['drill.md'])),
    sectionShell(
      9,
      SECTION_TITLES[8],
      `<p>Attempt the lab first. The answer is not in the page until you ask for it, and a refresh hides it again.</p>
<p><button type="button" class="reveal" id="show-answer" aria-expanded="false" aria-controls="answer-panel debrief-panel">Show answer</button></p>
<div class="answer-panel" id="answer-panel" tabindex="-1" aria-live="polite"></div>
<template id="answer-template"><div data-slot="answer">${renderMarkdown(answerBody)}</div><div data-slot="debrief">${renderMarkdown(debriefBody)}</div></template>`,
    ),
    sectionShell(
      10,
      SECTION_TITLES[9],
      `<p class="placeholder" id="debrief-placeholder">Revealed together with the answer (section 9).</p><div class="answer-panel" id="debrief-panel"></div>`,
    ),
    sectionShell(11, SECTION_TITLES[10], renderReferences(lab)),
  ];

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Lab ${pad(lab.number)} — ${escapeHtml(lab.title)} · Kadé Commerce</title>
<style>${CSS}</style>
</head>
<body>
<a class="skip" href="#section-2">Skip to the customer brief</a>
<main class="wrap" id="main">
${sections.join('\n')}
<footer><p>Kadé Commerce practice course · generated by <code>labs/build.mjs</code> from <code>labs/${escapeHtml(loaded.dirName)}/</code>. Do not edit the rendered page.</p></footer>
</main>
<script>${JS}</script>
</body>
</html>
`;
}

export function renderIndexPage(labs) {
  const rows = labs
    .map(
      ({ dirName, lab }) =>
        `<tr><td>${pad(lab.number)}</td><td><a href="${escapeHtml(dirName)}/index.html">${escapeHtml(lab.title)}</a></td><td>${escapeHtml(lab.feature)}</td><td>${lab.duration_minutes} min</td><td>${escapeHtml(lab.difficulty)}</td><td><span class="badge badge-${lab.credentials.badge}">${lab.credentials.badge}</span></td></tr>`,
    )
    .join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Kadé Commerce labs</title>
<style>${CSS}</style>
</head>
<body>
<a class="skip" href="#labs">Skip to the lab list</a>
<main class="wrap">
<header class="lab">
<h1>Kadé Commerce — Devin practice labs</h1>
<p>Promptless labs: each page gives you a customer brief, constraints, a starting state and acceptance criteria — never a prompt. You frame the problem, pick the Devin capability and explain your decisions aloud to the Devin voice coach.</p>
</header>
<section aria-labelledby="labs-h" id="labs">
<h2 id="labs-h">Labs (${labs.length})</h2>
${
  labs.length
    ? `<table class="index-table"><thead><tr><th>#</th><th>Lab</th><th>Devin feature</th><th>Duration</th><th>Difficulty</th><th>Credentials</th></tr></thead><tbody>${rows}</tbody></table>`
    : '<p>No labs found.</p>'
}
</section>
<footer><p>Generated by <code>labs/build.mjs</code> from the folders present under <code>labs/</code>. Do not edit by hand.</p></footer>
</main>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Orchestration

export async function buildLabs({ labsDir = __dirname, outDir = labsDir, repoDir = path.resolve(labsDir, '..'), check = false, log = () => {} } = {}) {
  const dirNames = await discoverLabDirs(labsDir);
  const loaded = [];
  const problems = [];
  for (const dirName of dirNames) {
    const l = await loadLab(labsDir, dirName, repoDir);
    problems.push(...l.problems);
    if (!l.problems.length) loaded.push(l);
  }
  if (problems.length) throw new BuildError(problems);

  const pages = new Map();
  for (const l of loaded) {
    const html = renderLabPage(l);
    assertAnswerHidden(html, l);
    pages.set(path.join(outDir, l.dirName, 'index.html'), html);
  }
  pages.set(path.join(outDir, 'index.html'), renderIndexPage(loaded));

  if (!check) {
    for (const [file, html] of pages) {
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, html, 'utf8');
      log(`wrote ${path.relative(process.cwd(), file)}`);
    }
  } else {
    log(`checked ${loaded.length} lab(s), nothing written`);
  }
  return { labs: loaded.map((l) => l.dirName), pages };
}

/** Defensive: answer text may only appear inside the <template>. */
function assertAnswerHidden(html, loaded) {
  const tplStart = html.indexOf('<template id="answer-template">');
  const tplEnd = html.indexOf('</template>', tplStart);
  if (tplStart < 0 || tplEnd < 0) throw new BuildError([`${loaded.dirName}: answer template missing from rendered page`]);
  const outside = html.slice(0, tplStart) + html.slice(tplEnd);
  const probe = firstMeaningfulSentence(loaded.files['answer.md']);
  if (probe && normalise(outside).includes(normalise(probe))) {
    throw new BuildError([`${loaded.dirName}: answer content found outside the <template>`]);
  }
}

function firstMeaningfulSentence(md) {
  const paragraph = (md ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith('#') && !l.startsWith('```') && !/^[-*+]\s/.test(l) && l.split(' ').length >= 6);
  return paragraph ?? null;
}

function parseArgs(argv) {
  const opts = { check: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--check') opts.check = true;
    else if (a === '--labs') opts.labsDir = path.resolve(argv[++i]);
    else if (a === '--out') opts.outDir = path.resolve(argv[++i]);
    else if (a === '--repo') opts.repoDir = path.resolve(argv[++i]);
    else if (a === '--help' || a === '-h') {
      console.log('usage: node labs/build.mjs [--check] [--labs <dir>] [--out <dir>] [--repo <dir>]');
      process.exit(0);
    } else {
      console.error(`unknown argument: ${a}`);
      process.exit(2);
    }
  }
  if (opts.labsDir && !opts.outDir) opts.outDir = opts.labsDir;
  return opts;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const opts = parseArgs(process.argv.slice(2));
  buildLabs({ ...opts, log: (m) => console.log(m) })
    .then((r) => console.log(`labs:build ok — ${r.labs.length} lab(s): ${r.labs.join(', ') || 'none'}`))
    .catch((err) => {
      console.error(err instanceof BuildError ? err.message : err);
      process.exit(1);
    });
}
