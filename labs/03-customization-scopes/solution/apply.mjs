#!/usr/bin/env node
// Copy the reference layers into a repo tree. Folders are stored as dot-devin/ and dot-github/ so
// that nothing inside labs/ is ever discovered as a live rule, skill or CODEOWNERS file.
import { cpSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const LAYERS = path.join(HERE, 'layers');

export function applyLayers(target) {
  const copied = [];
  for (const name of readdirSync(LAYERS)) {
    const dest = path.join(target, name.replace(/^dot-/, '.'));
    cpSync(path.join(LAYERS, name), dest, { recursive: true });
    copied.push(path.relative(target, dest));
  }
  return copied;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const target = path.resolve(process.argv[2] ?? '.');
  if (!existsSync(path.join(target, 'package.json'))) {
    process.stderr.write(`refusing to copy: ${target} does not look like the repo root\n`);
    process.exit(2);
  }
  for (const p of applyLayers(target)) process.stdout.write(`copied ${p}\n`);
}
