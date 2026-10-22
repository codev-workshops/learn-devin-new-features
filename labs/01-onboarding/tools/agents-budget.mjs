#!/usr/bin/env node
// Lists every AGENTS.md Devin can read in this repo, with its size against the per-file
// automatic-inclusion limit (the first 16 KiB of each file). Exit 1 if any file is over.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const LIMIT_BYTES = 16 * 1024;
const SKIP = new Set(['node_modules', '.git', 'dist', 'build', '.venv', '__pycache__', '.pytest_cache', '.ruff_cache']);

export function findAgentsFiles(root) {
  const out = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (!SKIP.has(e.name)) walk(path.join(dir, e.name));
      } else if (e.name === 'AGENTS.md') {
        out.push(path.join(dir, e.name));
      }
    }
  };
  walk(root);
  return out.sort((a, b) => a.split(path.sep).length - b.split(path.sep).length || a.localeCompare(b));
}

export function budget(root) {
  const files = findAgentsFiles(root).map((abs) => {
    const bytes = statSync(abs).size;
    const text = readFileSync(abs, 'utf8');
    const rel = path.relative(root, abs) || 'AGENTS.md';
    const depth = rel.split(path.sep).length - 1;
    let lostHeading = null;
    if (bytes > LIMIT_BYTES) {
      const tail = Buffer.from(text).subarray(LIMIT_BYTES).toString('utf8');
      lostHeading = (tail.match(/^#+ .+$/m) ?? [null])[0];
    }
    return { file: rel, depth, bytes, over: bytes > LIMIT_BYTES, beyondLimit: Math.max(0, bytes - LIMIT_BYTES), lostHeading };
  });
  return { limit: LIMIT_BYTES, files, total: files.reduce((n, f) => n + f.bytes, 0), anyOver: files.some((f) => f.over) };
}

function main() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(process.argv[2] ?? path.join(here, '..', '..', '..'));
  const r = budget(root);
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(r, null, 2));
  } else {
    for (const f of r.files) {
      const pct = ((f.bytes / r.limit) * 100).toFixed(0).padStart(3);
      const flag = f.over ? `  OVER by ${f.beyondLimit} B${f.lostHeading ? ` (first heading not auto-included: ${f.lostHeading})` : ''}` : '';
      console.log(`${String(f.bytes).padStart(6)} B ${pct}%  depth ${f.depth}  ${f.file}${flag}`);
    }
    console.log(`${r.files.length} AGENTS.md files, ${r.total} B in total; limit is ${r.limit} B per file`);
  }
  process.exit(r.anyOver ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
