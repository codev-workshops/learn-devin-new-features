import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseFrontMatter, parseTranscript, VARIANTS } from '../../coach-dryrun.mjs';
import { LEARNER_FACING_FILES } from '../../build.mjs';
import { LAB_DIR, checkAll, listScenarioFiles, loadScenario, parseScenario } from './scenario-check.mjs';

const dryrun = path.join(LAB_DIR, 'coaching', 'dryrun');
const read = (p) => fs.readFileSync(p, 'utf8');
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9€]+/g, ' ').trim();

describe('sealed capstone scenarios', () => {
  it('ships exactly three valid scenarios', () => {
    const results = checkAll();
    expect(Object.keys(results)).toHaveLength(3);
    for (const errors of Object.values(results)) expect(errors).toEqual([]);
  });

  it('each envelope combines an incident, a feature request and a governance constraint', () => {
    for (const file of listScenarioFiles()) {
      const s = parseScenario(read(file));
      expect(s.envelope.Incident).toBeTruthy();
      expect(s.envelope['Feature request']).toBeTruthy();
      expect(s.envelope['Governance constraint']).toBeTruthy();
      expect(s.requirement_change.length).toBeGreaterThan(40);
    }
  });

  it('rejects unknown or path-like scenario ids', () => {
    expect(() => loadScenario('../lab')).toThrow(/unknown scenario/);
    expect(() => loadScenario('nope')).toThrow(/unknown scenario/);
  });

  it('keeps every scenario sealed: no envelope, change or must-mention text in learner-facing files', () => {
    const learner = LEARNER_FACING_FILES.map((f) => norm(read(path.join(LAB_DIR, f)))).join(' ');
    for (const file of listScenarioFiles()) {
      const s = parseScenario(read(file));
      const secrets = [s.envelope.opening, s.envelope.Incident, s.envelope['Feature request'], s.envelope['Governance constraint'], s.requirement_change, ...s.must_mention.map((m) => m.point), ...s.objections.flatMap((o) => [o.question, o.follow_up])];
      for (const text of secrets) expect(learner.includes(norm(text)), text).toBe(false);
      expect(learner.includes(s.id)).toBe(false);
    }
  });
});

describe('capstone coach dry run reads must-mention points from the sealed scenario', () => {
  const drawn = new Set();
  for (const variant of VARIANTS) {
    it(`${variant}: report must-mention list equals its scenario file`, () => {
      const text = read(path.join(dryrun, `${variant}.md`));
      const { data } = parseFrontMatter(text);
      const s = loadScenario(data.scenario);
      drawn.add(s.id);
      const transcript = parseTranscript(text);
      for (const name of [`${variant}.report.json`, `${variant}.rerun.report.json`]) {
        const report = JSON.parse(read(path.join(dryrun, name)));
        expect(report.must_mention.map(({ id, point, weight, belonged_in }) => ({ id, point, weight, belonged_in }))).toEqual(
          s.must_mention.map(({ id, point, weight, belonged_in }) => ({ id, point, weight, belonged_in })),
        );
        expect(report.timing.filter((t) => t.kind === 'objection').map((t) => t.question)).toEqual(s.objections.map((o) => o.question));
        for (const m of report.must_mention.filter((x) => x.mentioned)) expect(transcript.learnerText).toContain(m.evidence_quote);
      }
    });

    it(`${variant}: the T+60 change is delivered verbatim, in character, before the T+90 checkpoint`, () => {
      const text = read(path.join(dryrun, `${variant}.md`));
      const s = loadScenario(parseFrontMatter(text).data.scenario);
      const t = parseTranscript(text);
      const ids = t.segments.map((x) => x.id);
      expect(ids.indexOf('change-60')).toBe(ids.indexOf('checkpoint-90') - 1);
      const change = t.segments.find((x) => x.id === 'change-60');
      expect(change.lines.every((l) => l.speaker === 'COACH')).toBe(true);
      expect(change.lines[0].text).toBe(s.requirement_change);
    });
  }

  it('the three variants draw three different scenarios', () => {
    const ids = VARIANTS.map((v) => parseFrontMatter(read(path.join(dryrun, `${v}.md`))).data.scenario);
    expect(new Set(ids).size).toBe(3);
  });
});
