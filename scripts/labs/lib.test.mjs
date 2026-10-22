import test from 'node:test';
import assert from 'node:assert/strict';
import { REQUIRED_SECTIONS, LabError, parseLab, splitBlocks } from './lib.mjs';
import { renderLabPage } from './render.mjs';

const FRONT = `---
number: 2
slug: sample-lab
title: Sample lab
feature: Lifecycle hooks
level: intermediate
status: draft
durationMinutes: 45
lastVerified: 2026-10-22
summary: A sample.
fallback: Use the local fixture.
docs:
  - title: Hooks
    url: https://docs.devin.ai/cli/extensibility/hooks/overview
---
`;

function body(overrides = {}) {
  return REQUIRED_SECTIONS.map((title) => {
    if (title in overrides) return overrides[title] === null ? '' : `## ${title}\n\n${overrides[title]}\n`;
    if (title === 'Facilitator notes' || title === 'Solution rubric' || title === 'Unguided version') {
      return `## ${title}\n\n:::answer ${title} answer\nHidden **text**.\n:::\n`;
    }
    return `## ${title}\n\nVisible text for ${title}.\n`;
  }).join('\n');
}

const parse = (source, folder = '02-sample-lab') => parseLab(source, folder);

test('parses a valid lab and renders hidden answers', () => {
  const lab = parse(FRONT + body());
  assert.equal(lab.sections.length, REQUIRED_SECTIONS.length);
  const html = renderLabPage(lab, { css: 'body{}', js: '' });
  assert.match(html, /<button type="button" class="show-answer" aria-expanded="false" aria-controls="answer-1"/);
  assert.match(html, /<div class="answer-body" id="answer-1" hidden>/);
  assert.equal((html.match(/ hidden>/g) || []).length, 3);
});

test('rejects missing or reordered sections', () => {
  assert.throws(() => parse(FRONT + body({ Goal: null })), /missing: Goal/);
  const swapped = body().replace('## Goal', '## TEMP').replace('## Prerequisites', '## Goal').replace('## TEMP', '## Prerequisites');
  assert.throws(() => parse(FRONT + swapped), /out of order/);
});

test('rejects visible spoilers and unguided sections without answers', () => {
  assert.throws(() => parse(FRONT + body({ 'Solution rubric': 'Visible rubric' })), /must be inside ":::answer" blocks/);
  assert.throws(() => parse(FRONT + body({ 'Unguided version': 'No answer here' })), /needs at least one ":::answer" block/);
});

test('rejects raw HTML and javascript links', () => {
  assert.throws(() => parse(FRONT + body({ Goal: '<script>alert(1)</script>' })), /raw HTML is not allowed/);
  assert.throws(() => parse(FRONT + body({ Goal: '[x](javascript:alert(1))' })), /javascript: links/);
});

test('validates front matter and folder name', () => {
  assert.throws(() => parse(FRONT + body(), '03-sample-lab'), /folder must be named 02-sample-lab/);
  assert.throws(() => parse(FRONT.replace('level: intermediate', 'level: expert') + body()), /level must be one of/);
  assert.throws(() => parse(FRONT.replace('https://docs.devin.ai/cli/extensibility/hooks/overview', 'https://example.com') + body()), /docs.devin.ai/);
  assert.throws(() => parse(body()), LabError);
});

test('answer block syntax errors are reported', () => {
  assert.throws(() => splitBlocks(':::answer A\ntext', 'x'), /is not closed/);
  assert.throws(() => splitBlocks(':::answer A\n:::answer B\n:::', 'x'), /nested answer block/);
  assert.throws(() => splitBlocks('text\n:::', 'x'), /closing ::: without an open answer block/);
  assert.throws(() => splitBlocks(':::answer A\n\n:::', 'x'), /empty answer block/);
  assert.deepEqual(splitBlocks('intro\n:::answer\nsecret\n:::', 'x').map((block) => block.title || block.kind), ['content', 'Answer']);
});

test('headings inside code fences do not start sections', () => {
  const lab = parse(FRONT + body({ Goal: '```md\n## Not a section\n```' }));
  assert.equal(lab.sections[0].title, 'Goal');
});
