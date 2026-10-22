import { describe, it, expect, afterAll } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runCalibration, mapSegments, renderCalibrationTable, spliceTable, DEFAULT_LABS_DIR, MAX_SPREAD, TABLE_FILE } from './calibrate.mjs';

const scratch = [];
afterAll(async () => {
  for (const d of scratch) await fs.rm(d, { recursive: true, force: true });
});

async function copyLabs() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'calibrate-'));
  scratch.push(dir);
  await fs.cp(DEFAULT_LABS_DIR, dir, { recursive: true, filter: (src) => !src.includes(`${path.sep}node_modules`) });
  return dir;
}

describe('coach calibration', () => {
  it('maps lab segments onto the generic transcript', () => {
    expect(
      mapSegments([{ id: 'framing' }, { id: 'update-15' }, { id: 'checkpoint-60' }, { id: 'update' }, { id: 'objection-1' }, { id: 'objection-2' }]),
    ).toEqual({ framing: 'framing', 'update-15': 'checkpoint-a', 'checkpoint-60': 'checkpoint-b', update: 'update', 'objection-1': 'objection-1', 'objection-2': 'objection-2' });
  });

  it('passes on the committed reports with every coach graded and the spread in band', async () => {
    const r = await runCalibration({ strict: true });
    expect(r.failures).toEqual([]);
    expect(r.pending).toEqual([]);
    const coached = (await fs.readdir(DEFAULT_LABS_DIR)).filter((d) => /^\d{2}-/.test(d)).length;
    expect(r.rows).toHaveLength(coached);
    expect(r.band.spread).toBeLessThanOrEqual(MAX_SPREAD);
  });

  it('keeps the committed table in sync with the reports', async () => {
    const r = await runCalibration();
    const doc = await fs.readFile(path.join(DEFAULT_LABS_DIR, TABLE_FILE), 'utf8');
    expect(spliceTable(doc, renderCalibrationTable(r))).toBe(doc);
  });

  it('fails when one lab is an outlier', async () => {
    const dir = await copyLabs();
    const p = path.join(dir, 'coach-dryrun', 'reports', '12-oncall.report.json');
    const rep = JSON.parse(await fs.readFile(p, 'utf8'));
    rep.scores.accuracy.score += 20;
    rep.scores.total += 20;
    await fs.writeFile(p, JSON.stringify(rep, null, 2) + '\n');
    const r = await runCalibration({ labsDir: dir });
    expect(r.ok).toBe(false);
    expect(r.failures.join('\n')).toMatch(/spread \d+ > 15: .*highest 52 \(12-oncall\)/);
  });

  it('fails when a report credits a point the generic transcript never names', async () => {
    const dir = await copyLabs();
    const p = path.join(dir, 'coach-dryrun', 'reports', '05-code-scans.report.json');
    const rep = JSON.parse(await fs.readFile(p, 'utf8'));
    rep.must_mention[0].mentioned = true;
    rep.timing[0].actual_seconds = 30;
    await fs.writeFile(p, JSON.stringify(rep, null, 2) + '\n');
    const r = await runCalibration({ labsDir: dir });
    const all = r.failures.join('\n');
    expect(all).toMatch(/05-code-scans: must_mention mm1 marked mentioned/);
    expect(all).toMatch(/05-code-scans: framing actual_seconds 30 disagrees/);
  });

  it('lists a lab with a coach but no report as pending, failing only in strict mode', async () => {
    const dir = await copyLabs();
    await fs.rm(path.join(dir, 'coach-dryrun', 'reports', '14-outposts.report.json'));
    expect((await runCalibration({ labsDir: dir })).pending).toEqual(['14-outposts']);
    expect((await runCalibration({ labsDir: dir, strict: true })).ok).toBe(false);
  });
});
