import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildLabs,
  BuildError,
  findPromptFences,
  findPhraseLeaks,
  extractCoachPhrases,
  splitByH2,
  validateLabJson,
  SECTION_TITLES,
  CAVEAT,
} from '../build.mjs';

const labsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoDir = path.resolve(labsDir, '..');
const sampleDir = path.join(labsDir, '00-sample');

let tmpRoot;
beforeAll(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'kade-labs-'));
});
afterAll(async () => {
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

/** Copy labs/00-sample into a scratch labs dir, optionally mutating files. */
async function scratchLabs(name, mutate = async () => {}) {
  const dir = path.join(tmpRoot, name);
  const repo = path.join(dir, 'repo');
  const labs = path.join(repo, 'labs');
  await fs.mkdir(labs, { recursive: true });
  await fs.cp(sampleDir, path.join(labs, '00-sample'), { recursive: true });
  await mutate({ repo, labs, lab: path.join(labs, '00-sample') });
  return { repo, labs, out: path.join(dir, 'out') };
}

async function expectBuildFailure(opts, pattern) {
  let err;
  try {
    await buildLabs({ ...opts, check: true });
  } catch (e) {
    err = e;
  }
  expect(err).toBeInstanceOf(BuildError);
  expect(err.problems.join('\n')).toMatch(pattern);
  return err;
}

describe('labs/build.mjs on the real labs/ tree', () => {
  it('renders every lab plus the index without writing in --check mode', async () => {
    const r = await buildLabs({ labsDir, repoDir, check: true });
    expect(r.labs).toContain('00-sample');
    expect([...r.pages.keys()].some((p) => p.endsWith(`${path.sep}index.html`))).toBe(true);
  });
});

describe('rendered lab page', () => {
  let html;
  let index;
  beforeAll(async () => {
    const s = await scratchLabs('render');
    const r = await buildLabs({ labsDir: s.labs, repoDir: s.repo, outDir: s.out });
    html = await fs.readFile(path.join(s.out, '00-sample', 'index.html'), 'utf8');
    index = await fs.readFile(path.join(s.out, 'index.html'), 'utf8');
  });

  it('has the eleven sections in order', () => {
    const titles = [...html.matchAll(/<h2 id="section-(\d+)-h"><span class="num" aria-hidden="true">\d+\.<\/span>([^<]+)<\/h2>/g)].map((m) => [Number(m[1]), m[2]]);
    expect(titles.map(([n]) => n)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(titles.map(([, t]) => t)).toEqual(SECTION_TITLES.slice(1));
    expect(html).toContain('<header class="lab">');
  });

  it('is self-contained: no external scripts, styles or images', () => {
    expect(html).not.toMatch(/<script[^>]+src=/);
    expect(html).not.toMatch(/<link[^>]+rel="stylesheet"/);
    expect(html).not.toMatch(/<img/);
  });

  it('keeps the answer and the debrief inside a single <template> and out of the DOM', () => {
    const tplStart = html.indexOf('<template id="answer-template">');
    const tplEnd = html.indexOf('</template>');
    expect(tplStart).toBeGreaterThan(0);
    const outside = html.slice(0, tplStart) + html.slice(tplEnd);
    const inside = html.slice(tplStart, tplEnd);
    for (const probe of ['Worked prompt sequence', 'Model answers to the objections', 'Alternatives considered', 'no-schema-change rule?']) {
      expect(inside).toContain(probe);
      expect(outside).not.toContain(probe);
    }
    expect(inside).toContain('data-slot="answer"');
    expect(inside).toContain('data-slot="debrief"');
  });

  it('exposes a keyboard-operable Show answer button with ARIA state and no persisted state', () => {
    expect(html).toMatch(/<button type="button" class="reveal" id="show-answer" aria-expanded="false" aria-controls="answer-panel debrief-panel">Show answer<\/button>/);
    expect(html).toContain('<div class="answer-panel" id="answer-panel" tabindex="-1"');
    expect(html).not.toMatch(/localStorage|sessionStorage|document\.cookie|location\.hash/);
  });

  it('prints the exact @skills: start line, the mute hint and the transcript caveat in section 8', () => {
    const s8 = html.slice(html.indexOf('id="section-8"'), html.indexOf('id="section-9"'));
    expect(s8).toContain('@skills:coach-00-sample &lt;your-handle&gt;');
    expect(s8).toMatch(/Mute hint/);
    expect(s8).toMatch(/Space/);
    expect(s8).toContain(CAVEAT);
    expect(s8).toContain('T+10 min');
  });

  it('renders header metadata and the credential badge', () => {
    expect(html).toContain('Lab 00 — Read the brief, write the plan');
    expect(html).toContain('badge-fixture');
    expect(html).toContain('20 min');
  });

  it('generates the index from the folders present', () => {
    expect(index).toContain('00-sample/index.html');
    expect(index).toContain('Labs (1)');
  });
});

describe('build rules', () => {
  it('fails when a learner-facing file contains a fenced block tagged prompt', async () => {
    const s = await scratchLabs('prompt-leak', async ({ lab }) => {
      await fs.appendFile(path.join(lab, 'criteria.md'), '\n```prompt\nFix the oversell bug\n```\n');
    });
    await expectBuildFailure({ labsDir: s.labs, repoDir: s.repo }, /criteria\.md:\d+ contains a fenced block tagged "prompt"/);
  });

  it('accepts a prompt fence in answer.md', async () => {
    const s = await scratchLabs('prompt-ok', async ({ lab }) => {
      await fs.appendFile(path.join(lab, 'answer.md'), '\n```prompt\nanother hidden prompt\n```\n');
    });
    await expect(buildLabs({ labsDir: s.labs, repoDir: s.repo, check: true })).resolves.toBeTruthy();
  });

  it('fails when a must-mention point from the dry-run reports appears in a learner-facing file', async () => {
    const s = await scratchLabs('mm-leak', async ({ lab }) => {
      await fs.appendFile(path.join(lab, 'drill.md'), '\nRemember: both brands run on a single shared codebase and database.\n');
    });
    await expectBuildFailure({ labsDir: s.labs, repoDir: s.repo }, /drill\.md leaks a coach must-mention verbatim/);
  });

  it('fails when an objection from the coach skill appears in a learner-facing file', async () => {
    const s = await scratchLabs('objection-leak', async ({ repo, lab }) => {
      const skillDir = path.join(repo, '.devin', 'skills', 'articulation', '00-sample');
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(
        path.join(skillDir, 'SKILL.md'),
        '---\nname: coach-00-sample\n---\n## Must-mention points\n- mm9 (w5): A brand-new secret point only the coach knows\n\n## Objections\n| id | objection | cue |\n|---|---|---|\n| o9 | What happens when the worker is down at two in the morning? | downtime |\n',
      );
      await fs.appendFile(path.join(lab, 'brief.md'), '\nThe CISO will ask: what happens when the worker is down at two in the morning?\n');
    });
    const err = await expectBuildFailure({ labsDir: s.labs, repoDir: s.repo }, /brief\.md leaks a coach objection verbatim/);
    expect(err.problems.join('\n')).not.toMatch(/must-mention/);
  });

  it('fails when brief.md lacks the stakeholders heading', async () => {
    const s = await scratchLabs('no-stakeholders', async ({ lab }) => {
      const brief = await fs.readFile(path.join(lab, 'brief.md'), 'utf8');
      await fs.writeFile(path.join(lab, 'brief.md'), brief.replace('## Stakeholders and constraints', '## People'));
    });
    await expectBuildFailure({ labsDir: s.labs, repoDir: s.repo }, /needs an H2 "## Stakeholders and constraints"/);
  });

  it('fails when a source file is missing or lab.json disagrees with the folder name', async () => {
    const s = await scratchLabs('bad-json', async ({ lab }) => {
      await fs.rm(path.join(lab, 'drill.md'));
      const lab0 = JSON.parse(await fs.readFile(path.join(lab, 'lab.json'), 'utf8'));
      lab0.slug = 'other';
      await fs.writeFile(path.join(lab, 'lab.json'), JSON.stringify(lab0));
    });
    const err = await expectBuildFailure({ labsDir: s.labs, repoDir: s.repo }, /drill\.md is missing/);
    // missing-file problems short-circuit; the slug mismatch is caught once files exist
    expect(err.problems.length).toBeGreaterThan(0);
    expect(validateLabJson({ ...JSON.parse(await fs.readFile(path.join(sampleDir, 'lab.json'), 'utf8')), slug: 'other' }, '00-sample')).toEqual(
      [expect.stringMatching(/slug must be "sample" \(folder 00-sample\)/)],
    );
  });

  it('ignores folders that do not match NN-slug or have no lab.json', async () => {
    const s = await scratchLabs('ignore', async ({ labs }) => {
      await fs.mkdir(path.join(labs, 'coach-dryrun', 'fixtures'), { recursive: true });
      await fs.mkdir(path.join(labs, '99-empty'), { recursive: true });
      await fs.writeFile(path.join(labs, 'coach-dryrun', 'fixtures', 'generic-mediocre.md'), '```prompt\nnot a lab\n```');
    });
    const r = await buildLabs({ labsDir: s.labs, repoDir: s.repo, check: true });
    expect(r.labs).toEqual(['00-sample']);
  });
});

describe('helpers', () => {
  it('findPromptFences matches the prompt tag only, in any case and with tildes', () => {
    expect(findPromptFences('```prompt\nx\n```\n~~~Prompt\ny\n~~~\n```promptly\n```\n```js prompt\n```')).toEqual([1, 4]);
  });

  it('findPhraseLeaks normalises punctuation and case and skips phrases under three words', () => {
    const phrases = [
      { kind: 'objection', text: '“Isn\'t this just a lint rule?”' },
      { kind: 'must-mention', text: 'Ask vs' },
    ];
    expect(findPhraseLeaks('He asked: isn’t this just a LINT rule?! Also Ask vs.', phrases).map((p) => p.kind)).toEqual(['objection']);
  });

  it('extractCoachPhrases reads list items and table rows under the two headings only', () => {
    const md = '## Persona\n- Lumen lead\n## Must-mention points\n- **mm1** — Point one here (w8)\n1. `mm2`: Point two here\n## Timing\n- framing 60\n### Objections (in character)\n| id | objection | cue |\n|---|---|---|\n| o1 | Why not a playbook? | playbook |\n';
    expect(extractCoachPhrases(md)).toEqual([
      { kind: 'must-mention', text: 'Point one here' },
      { kind: 'must-mention', text: 'Point two here' },
      { kind: 'objection', text: 'Why not a playbook?' },
      { kind: 'objection', text: 'playbook' },
    ]);
  });

  it('splitByH2 ignores headings inside fenced code', () => {
    const r = splitByH2('intro\n## A\nbody\n```\n## not a heading\n```\n## B\nmore');
    expect(r.preamble).toBe('intro');
    expect(r.sections.map((s) => s.title)).toEqual(['A', 'B']);
    expect(r.sections[0].body).toContain('## not a heading');
  });
});
