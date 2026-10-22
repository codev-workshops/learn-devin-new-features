#!/usr/bin/env node
// `pnpm lab:reset -- <nn>` — the universal lab reset.
//
// 1. Re-seeds the lab database: `pnpm db:seed -- --reset` (services/api, delivered by W1-api).
// 2. If scenarios/lab-reset.sh exists (delivered by W1-fixtures), runs it with the lab number so
//    lab-specific injectors are rolled back and the lab's starting state is re-applied.
//
// The script fails loudly when a step is missing instead of pretending the reset happened.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const lab = process.argv.slice(2).find((a) => a !== "--");
if (!lab || !/^\d{2}$/.test(lab)) {
  console.error("usage: pnpm lab:reset -- <nn>   (two-digit lab number, e.g. 05)");
  process.exit(2);
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit", env: process.env });
  return r.status ?? 1;
}

console.log(`[lab:reset] lab ${lab}: re-seeding the lab database`);
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const seed = run(pnpm, ["run", "db:seed", "--", "--reset"]);
if (seed !== 0) process.exit(seed);

const scenarioReset = join(root, "scenarios", "lab-reset.sh");
if (existsSync(scenarioReset)) {
  console.log(`[lab:reset] lab ${lab}: applying scenarios/lab-reset.sh ${lab}`);
  process.exit(run("bash", [scenarioReset, lab]));
}
console.log("[lab:reset] scenarios/lab-reset.sh not present (W1-fixtures) — database reset only");
