import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runDryrunChecks, parseTranscript, segmentDurations, countFillers, countTagQuestions, parseFrontMatter, renderReportMarkdown, CAVEAT } from '../coach-dryrun.mjs';

const labsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sampleDryrun = path.join(labsDir, '00-sample', 'coaching', 'dryrun');

let tmpRoot;
beforeAll(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'harbourline-dryrun-'));
});
afterAll(async () => {
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

async function scratch(name, mutate) {
  const labs = path.join(tmpRoot, name);
  await fs.mkdir(labs, { recursive: true });
  await fs.cp(path.join(labsDir, 'coach-report.schema.json'), path.join(labs, 'coach-report.schema.json'));
  await fs.cp(path.join(labsDir, '00-sample'), path.join(labs, '00-sample'), { recursive: true });
  const dryrun = path.join(labs, '00-sample', 'coaching', 'dryrun');
  const editJson = async (file, fn) => {
    const p = path.join(dryrun, file);
    const j = JSON.parse(await fs.readFile(p, 'utf8'));
    await fs.writeFile(p, JSON.stringify(fn(j) ?? j));
  };
  await mutate({ labs, dryrun, editJson });
  return runDryrunChecks({ labsDir: labs, nn: '00' });
}

describe('coach:dryrun on labs/00-sample', () => {
  it('is green and reports the three totals in order', async () => {
    const r = await runDryrunChecks({ labsDir, nn: '0' });
    expect(r.failures).toEqual([]);
    expect(r.ok).toBe(true);
    const { strong, mediocre } = r.summary.variants;
    const off = r.summary.variants['off-track'];
    expect(strong.total - mediocre.total).toBeGreaterThanOrEqual(15);
    expect(mediocre.total - off.total).toBeGreaterThanOrEqual(15);
    expect(mediocre.missed).toEqual(['mm2', 'mm5']);
    expect(mediocre.long_pauses).toEqual(['02:10']);
  });

  it('fails for a lab number that has no folder', async () => {
    const r = await runDryrunChecks({ labsDir, nn: '42' });
    expect(r.ok).toBe(false);
    expect(r.failures[0]).toMatch(/no lab folder labs\/42-/);
  });
});

describe('coach:dryrun rules', () => {
  it('rejects a report that does not match the schema', async () => {
    const r = await scratch('schema', ({ editJson }) => editJson('strong.report.json', (j) => void delete j.stems));
    expect(r.failures).toEqual(expect.arrayContaining([expect.stringMatching(/strong\.report: schema .*required property 'stems'/)]));
  });

  it('rejects a timing table that drops a segment', async () => {
    const r = await scratch('segment', ({ editJson }) => editJson('mediocre.report.json', (j) => void (j.timing = j.timing.filter((t) => t.segment !== 'update'))));
    expect(r.failures).toContain('mediocre: timing is missing segment "update"');
  });

  it('rejects timings that disagree with the transcript markers or an inconsistent verdict', async () => {
    const r = await scratch('timing', ({ editJson }) =>
      editJson('strong.report.json', (j) => {
        const f = j.timing.find((t) => t.segment === 'framing');
        f.actual_seconds = 90;
        f.delta_seconds = 30;
        f.verdict = 'on';
      }),
    );
    expect(r.failures).toEqual(
      expect.arrayContaining([expect.stringMatching(/strong: framing verdict "on" should be "over"/), expect.stringMatching(/strong: framing actual_seconds 90 disagrees with transcript markers \(58 s\)/)]),
    );
  });

  it('rejects an ordering gap under 15 points', async () => {
    const r = await scratch('ordering', ({ editJson }) =>
      editJson('mediocre.report.json', (j) => {
        j.scores.accuracy.score = 30;
        j.scores.total = 30 + 16 + 12 + 8 + 6;
      }),
    );
    expect(r.failures).toContain('ordering: strong (86) must exceed mediocre (72) by ≥15');
  });

  it('rejects missed points that differ from the planted omissions', async () => {
    const r = await scratch('omissions', ({ editJson }) => editJson('mediocre.report.json', (j) => void (j.must_mention.find((m) => m.id === 'mm5').mentioned = true)));
    expect(r.failures).toContain('mediocre: missed must-mention ids [mm2] != planted omissions [mm2,mm5]');
  });

  it('rejects a filler count more than ±1 from the planted count, and a transcript whose plant is wrong', async () => {
    const r = await scratch('fillers', async ({ dryrun, editJson }) => {
      await editJson('mediocre.report.json', (j) => void (j.fillers_and_pauses.filler_count = 9));
      const p = path.join(dryrun, 'off-track.md');
      await fs.writeFile(p, (await fs.readFile(p, 'utf8')).replace('planted_fillers: 12', 'planted_fillers: 4'));
    });
    expect(r.failures).toEqual(
      expect.arrayContaining(['mediocre: filler_count 9 not within ±1 of planted 6', 'off-track: transcript contains 12 filler(s) but front matter plants 4']),
    );
  });

  it('rejects a report that forgets the planted long pause', async () => {
    const r = await scratch('pause', ({ editJson }) => editJson('mediocre.report.json', (j) => void (j.fillers_and_pauses.long_pauses = [])));
    expect(r.failures).toContain('mediocre: planted long pause at 02:10 not reported');
  });

  it('rejects a rerun whose score drifts by more than 5', async () => {
    const r = await scratch('drift', ({ editJson }) =>
      editJson('strong.rerun.report.json', (j) => {
        j.scores.structure.score = 15;
        j.scores.total = 27 + 15 + 16 + 12 + 7;
      }),
    );
    expect(r.failures).toEqual(expect.arrayContaining(['strong: structure moved by 8 between runs (max 5)', 'strong: total moved by 9 between runs (max 5)']));
  });

  it('rejects a Markdown report without the caveat and a JSON report with the wrong caveat', async () => {
    const r = await scratch('caveat', async ({ dryrun, editJson }) => {
      await fs.writeFile(path.join(dryrun, 'strong.report.md'), '# report without the caveat\n');
      await editJson('mediocre.report.json', (j) => void (j.clarity.caveat = 'approximate'));
    });
    expect(r.failures).toContain(`strong: report.md must contain "${CAVEAT}"`);
    expect(r.failures).toEqual(expect.arrayContaining([expect.stringMatching(/mediocre\.report: schema \/clarity\/caveat must be equal to constant/)]));
  });

  it('applies the transcript checks to the rerun too', async () => {
    const r = await scratch('rerun-transcript', ({ editJson }) =>
      editJson('mediocre.rerun.report.json', (j) => {
        j.must_mention.find((m) => m.id === 'mm5').mentioned = true;
        const f = j.timing.find((t) => t.segment === 'framing');
        f.actual_seconds = 60;
        f.delta_seconds = 0;
        f.verdict = 'on';
      }),
    );
    expect(r.failures).toEqual(
      expect.arrayContaining(['mediocre.rerun: missed must-mention ids [mm2] != planted omissions [mm2,mm5]', expect.stringMatching(/mediocre\.rerun: framing actual_seconds 60 disagrees with transcript markers \(74 s\)/)]),
    );
  });

  it('rejects a report.md that is out of sync with its JSON even when it carries the caveat', async () => {
    const r = await scratch('stale-md', async ({ dryrun }) => {
      const p = path.join(dryrun, 'strong.report.md');
      await fs.writeFile(p, (await fs.readFile(p, 'utf8')).replace('86/100', '99/100'));
    });
    expect(r.failures).toEqual(expect.arrayContaining([expect.stringMatching(/strong: report\.md is stale — regenerate with --render/)]));
  });

  it('rejects missing fixture files', async () => {
    const r = await scratch('missing', ({ dryrun }) => fs.rm(path.join(dryrun, 'off-track.rerun.report.json')));
    expect(r.failures).toContain('off-track: rerun file missing (00-sample/coaching/dryrun/off-track.rerun.report.json)');
  });
});

describe('transcript parsing', () => {
  it('reads front matter scalars and flow lists', () => {
    const { data, body } = parseFrontMatter('---\nplanted_fillers: 6\nplanted_omissions: [mm2, mm5]\nplanted_long_pauses: ["02:10"]\nok: true\n---\nbody');
    expect(data).toEqual({ planted_fillers: 6, planted_omissions: ['mm2', 'mm5'], planted_long_pauses: ['02:10'], ok: true });
    expect(body).toBe('body');
  });

  it('times segments from Go (or the first learner line) to Done and finds pauses', () => {
    const t = parseTranscript(
      '---\nplanted_fillers: 2\n---\n--- segment: framing ---\n[00:00] COACH: Go.\n[00:04] LEARNER: Actually, um, hello.\n[00:30] (pause 9 s)\n[00:58] LEARNER: Done.\n--- segment: objection-1 ---\n[01:10] COACH: Why?\n[01:15] LEARNER: Because, no?\n[01:40] LEARNER: Done.\n',
    );
    expect(segmentDurations(t)).toEqual({ framing: 58, 'objection-1': 25 });
    expect(t.pauses).toEqual([{ at: '00:30', seconds: 9, segment: 'framing' }]);
    expect(countFillers(t.learnerText)).toEqual({ total: 2, perWord: [{ word: 'actually', count: 1 }, { word: 'um', count: 1 }] });
    expect(countTagQuestions(t.learnerText)).toBe(1);
  });

  it('renders the committed Markdown reports from their JSON (single source of truth)', async () => {
    for (const v of ['strong', 'mediocre', 'off-track']) {
      const json = JSON.parse(await fs.readFile(path.join(sampleDryrun, `${v}.report.json`), 'utf8'));
      const md = await fs.readFile(path.join(sampleDryrun, `${v}.report.md`), 'utf8');
      expect(md).toBe(renderReportMarkdown(json));
    }
  });
});
