#!/usr/bin/env node
// Builds labs/src/**/lab.md into self-contained HTML pages under labs/.
// Usage: node scripts/labs/build.mjs [--check]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LabError, crossCheck, loadCatalog, loadLabs } from './lib.mjs';
import { renderIndexPage, renderLabPage } from './render.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function buildAll(root = ROOT) {
  const srcDir = path.join(root, 'labs', 'src');
  const assets = {
    css: fs.readFileSync(path.join(srcDir, '_shared', 'lab.css'), 'utf8'),
    js: fs.readFileSync(path.join(srcDir, '_shared', 'lab.js'), 'utf8'),
  };
  const catalog = loadCatalog(srcDir);
  const labs = loadLabs(srcDir);
  crossCheck(catalog, labs);
  const outputs = new Map();
  for (const lab of labs) outputs.set(path.join(root, 'labs', `${lab.folder}.html`), renderLabPage(lab, assets));
  outputs.set(path.join(root, 'labs', 'index.html'), renderIndexPage(catalog, labs, assets));
  return outputs;
}

export function staleFiles(root = ROOT) {
  const outputs = buildAll(root);
  const stale = [];
  for (const [file, html] of outputs) {
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== html) stale.push(path.relative(root, file));
  }
  const expected = new Set(outputs.keys());
  for (const name of fs.readdirSync(path.join(root, 'labs'))) {
    const file = path.join(root, 'labs', name);
    if (name.endsWith('.html') && !expected.has(file)) stale.push(`${path.relative(root, file)} (orphaned)`);
  }
  return stale;
}

function main() {
  const check = process.argv.includes('--check');
  try {
    if (check) {
      const stale = staleFiles();
      if (stale.length) {
        console.error(`Lab pages are out of date. Run "npm run labs:build" and commit:\n  ${stale.join('\n  ')}`);
        process.exitCode = 1;
        return;
      }
      console.log('Lab pages are up to date.');
      return;
    }
    const outputs = buildAll();
    for (const name of fs.readdirSync(path.join(ROOT, 'labs'))) {
      const file = path.join(ROOT, 'labs', name);
      if (name.endsWith('.html') && !outputs.has(file)) fs.rmSync(file);
    }
    for (const [file, html] of outputs) fs.writeFileSync(file, html);
    console.log(`Built ${outputs.size} lab page(s).`);
  } catch (error) {
    if (error instanceof LabError) {
      console.error(error.message);
      process.exitCode = 1;
      return;
    }
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
