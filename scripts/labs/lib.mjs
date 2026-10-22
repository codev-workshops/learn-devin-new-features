import fs from 'node:fs';
import path from 'node:path';
import { Marked } from 'marked';
import YAML from 'yaml';

export const REQUIRED_SECTIONS = [
  'Goal',
  'Prerequisites',
  'Customer scenario',
  'Acceptance criteria',
  'Expected evidence',
  'Guided version',
  'Unguided version',
  'Edge cases and failure injection',
  'Facilitator notes',
  'Solution rubric',
  'Articulation exercises',
];

// Content in these sections is a spoiler, so all of it must sit inside answer blocks.
export const ANSWER_ONLY_SECTIONS = ['Facilitator notes', 'Solution rubric'];
// The unguided track must offer at least one hidden model answer.
export const SECTIONS_NEEDING_ANSWER = ['Unguided version'];

const LEVELS = ['foundation', 'intermediate', 'advanced'];
const STATUSES = ['draft', 'pilot', 'ready'];
const ANSWER_OPEN = /^:::\s*answer(?:\s+(.*))?$/;
const ANSWER_CLOSE = /^:::\s*$/;

export class LabError extends Error {}

export const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

export const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const isIsoDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));

function createMarkdown() {
  return new Marked({ gfm: true, async: false });
}

export function renderMarkdown(source, where) {
  const md = createMarkdown();
  const tokens = md.lexer(source);
  md.walkTokens(tokens, (token) => {
    if (token.type === 'html') {
      throw new LabError(`${where}: raw HTML is not allowed in lab sources (found ${JSON.stringify(token.raw.trim().slice(0, 40))})`);
    }
    if (token.type === 'link' && /^\s*javascript:/i.test(token.href)) {
      throw new LabError(`${where}: javascript: links are not allowed`);
    }
  });
  return md.parser(tokens);
}

export function splitFrontMatter(source, where) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(source);
  if (!match) throw new LabError(`${where}: missing YAML front matter`);
  let data;
  try {
    data = YAML.parse(match[1], { schema: 'core' });
  } catch (error) {
    throw new LabError(`${where}: invalid front matter YAML: ${error.message}`);
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new LabError(`${where}: front matter must be a mapping`);
  return { data, body: match[2] };
}

export function validateMeta(meta, folder, where) {
  const errors = [];
  const need = (key, ok, message) => {
    if (!ok(meta[key])) errors.push(`${key} ${message}`);
  };
  need('number', (v) => Number.isInteger(v) && v > 0 && v < 100, 'must be an integer between 1 and 99');
  need('slug', (v) => typeof v === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v), 'must be kebab-case');
  for (const key of ['title', 'feature', 'summary', 'fallback']) {
    need(key, (v) => typeof v === 'string' && v.trim().length > 0, 'must be a non-empty string');
  }
  need('level', (v) => LEVELS.includes(v), `must be one of ${LEVELS.join(', ')}`);
  need('status', (v) => STATUSES.includes(v), `must be one of ${STATUSES.join(', ')}`);
  need('durationMinutes', (v) => Number.isInteger(v) && v >= 15 && v <= 480, 'must be an integer between 15 and 480');
  need('lastVerified', isIsoDate, 'must be a YYYY-MM-DD date');
  need(
    'docs',
    (v) =>
      Array.isArray(v) &&
      v.length > 0 &&
      v.every((doc) => doc && typeof doc.title === 'string' && typeof doc.url === 'string' && /^https:\/\//.test(doc.url)) &&
      v.some((doc) => doc.url.startsWith('https://docs.devin.ai/')),
    'must list {title, url} https links including at least one https://docs.devin.ai/ page',
  );
  if (errors.length) throw new LabError(`${where}: invalid front matter:\n  - ${errors.join('\n  - ')}`);
  const expectedFolder = `${String(meta.number).padStart(2, '0')}-${meta.slug}`;
  if (folder !== expectedFolder) throw new LabError(`${where}: folder must be named ${expectedFolder}`);
}

// Splits a section body into content and answer blocks.
export function splitBlocks(body, where) {
  const blocks = [];
  let buffer = [];
  let answer = null;
  const flush = () => {
    const text = buffer.join('\n');
    if (text.trim()) blocks.push({ kind: 'content', markdown: text });
    buffer = [];
  };
  body.split(/\r?\n/).forEach((line, index) => {
    const open = ANSWER_OPEN.exec(line.trim());
    if (open && !answer) {
      flush();
      answer = { kind: 'answer', title: (open[1] || 'Answer').trim(), lines: [], line: index + 1 };
      return;
    }
    if (open && answer) throw new LabError(`${where}: nested answer block (line ${index + 1})`);
    if (answer && ANSWER_CLOSE.test(line.trim())) {
      const markdown = answer.lines.join('\n');
      if (!markdown.trim()) throw new LabError(`${where}: empty answer block "${answer.title}"`);
      blocks.push({ kind: 'answer', title: answer.title, markdown });
      answer = null;
      return;
    }
    if (!answer && ANSWER_CLOSE.test(line.trim())) throw new LabError(`${where}: closing ::: without an open answer block (line ${index + 1})`);
    (answer ? answer.lines : buffer).push(line);
  });
  if (answer) throw new LabError(`${where}: answer block "${answer.title}" is not closed`);
  flush();
  return blocks;
}

export function parseSections(body, where) {
  const sections = [];
  let intro = [];
  let current = null;
  let inFence = false;
  for (const line of body.split(/\r?\n/)) {
    if (/^(```|~~~)/.test(line.trim())) inFence = !inFence;
    const heading = !inFence && /^##\s+(.+?)\s*$/.exec(line);
    if (heading) {
      current = { title: heading[1], lines: [] };
      sections.push(current);
      continue;
    }
    if (!inFence && /^#\s/.test(line)) throw new LabError(`${where}: use the front matter title instead of a level-1 heading`);
    (current ? current.lines : intro).push(line);
  }
  if (intro.join('').trim()) throw new LabError(`${where}: content before the first section heading is not allowed`);
  const titles = sections.map((section) => section.title);
  if (titles.join('|') !== REQUIRED_SECTIONS.join('|')) {
    const missing = REQUIRED_SECTIONS.filter((title) => !titles.includes(title));
    const extra = titles.filter((title) => !REQUIRED_SECTIONS.includes(title));
    const detail = [
      missing.length ? `missing: ${missing.join(', ')}` : '',
      extra.length ? `unexpected: ${extra.join(', ')}` : '',
      !missing.length && !extra.length ? 'sections are out of order' : '',
    ]
      .filter(Boolean)
      .join('; ');
    throw new LabError(`${where}: sections must be exactly ${REQUIRED_SECTIONS.join(' > ')} (${detail})`);
  }
  return sections.map((section) => {
    const sectionWhere = `${where} [${section.title}]`;
    const blocks = splitBlocks(section.lines.join('\n'), sectionWhere);
    if (!blocks.length) throw new LabError(`${sectionWhere}: section is empty`);
    if (ANSWER_ONLY_SECTIONS.includes(section.title) && blocks.some((block) => block.kind !== 'answer')) {
      throw new LabError(`${sectionWhere}: all content must be inside ":::answer" blocks`);
    }
    if (SECTIONS_NEEDING_ANSWER.includes(section.title) && !blocks.some((block) => block.kind === 'answer')) {
      throw new LabError(`${sectionWhere}: needs at least one ":::answer" block`);
    }
    return {
      id: slugify(section.title),
      title: section.title,
      blocks: blocks.map((block) => ({ ...block, html: renderMarkdown(block.markdown, sectionWhere) })),
    };
  });
}

export function parseLab(source, folder) {
  const where = `labs/src/${folder}/lab.md`;
  const { data, body } = splitFrontMatter(source, where);
  validateMeta(data, folder, where);
  return { meta: data, folder, sections: parseSections(body, where) };
}

export function loadCatalog(srcDir) {
  const file = path.join(srcDir, 'catalog.yaml');
  const data = YAML.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(data?.labs)) throw new LabError('labs/src/catalog.yaml: expected a "labs" list');
  const seen = new Set();
  for (const entry of data.labs) {
    if (!Number.isInteger(entry.number) || typeof entry.slug !== 'string' || typeof entry.title !== 'string') {
      throw new LabError(`labs/src/catalog.yaml: every entry needs number, slug and title (${JSON.stringify(entry)})`);
    }
    if (seen.has(entry.number)) throw new LabError(`labs/src/catalog.yaml: duplicate lab number ${entry.number}`);
    seen.add(entry.number);
  }
  return data.labs;
}

export function loadLabs(srcDir) {
  return fs
    .readdirSync(srcDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d{2}-/.test(entry.name))
    .map((entry) => entry.name)
    .sort()
    .map((folder) => parseLab(fs.readFileSync(path.join(srcDir, folder, 'lab.md'), 'utf8'), folder));
}

export function crossCheck(catalog, labs) {
  for (const lab of labs) {
    const entry = catalog.find((item) => item.number === lab.meta.number);
    if (!entry || entry.slug !== lab.meta.slug) {
      throw new LabError(`labs/src/${lab.folder}/lab.md: lab ${lab.meta.number} (${lab.meta.slug}) is not listed in labs/src/catalog.yaml`);
    }
  }
}
