#!/usr/bin/env node
// `pnpm lab:start -- <nn>` / `pnpm lab:cleanup -- <nn>` — run a lab's own start or cleanup steps.
//
// Both read labs/<nn>-*/lab.json#scenarios.reset (the commands the lab page lists) so the page and
// the runner never drift. Used directly from a terminal and by the `lab-start` / `lab-cleanup`
// skills in Devin Cloud sessions.
//
//   start   : pnpm install if needed, Postgres up + migrated when the lab touches the database,
//             then every reset command; ends by printing the lab's clean state.
//   cleanup : every reset command (restores the starting state, including steps marked
//             "only if …"), then stops Postgres unless --keep-db.
//
// Options: --dry-run (print the plan, run nothing), --force (run even with uncommitted changes —
// reset commands may discard them), --keep-db (cleanup only).
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [mode, ...rest] = process.argv.slice(2).filter((a) => a !== "--");
const flags = new Set(rest.filter((a) => a.startsWith("--")));
const lab = rest.find((a) => !a.startsWith("--"));
const usage = "usage: node scripts/lab.mjs start|cleanup <nn> [--dry-run] [--force] [--keep-db]";

if (!["start", "cleanup"].includes(mode) || !lab || !/^\d{2}$/.test(lab)) {
  console.error(usage);
  process.exit(2);
}
const labDirName = readdirSync(join(root, "labs")).find((d) => d.startsWith(`${lab}-`));
if (!labDirName || !existsSync(join(root, "labs", labDirName, "lab.json"))) {
  console.error(`[lab:${mode}] no labs/${lab}-*/lab.json`);
  process.exit(2);
}
const spec = JSON.parse(readFileSync(join(root, "labs", labDirName, "lab.json"), "utf8"));
const log = (m) => console.log(`[lab:${mode} ${lab}] ${m}`);

// Lab pages annotate some commands for humans: "cmd (only if …)" and "cmd (must print nothing) — note".
function parseStep(raw) {
  let cmd = raw.replace(/\s+—\s.*$/, "");
  const optional = /\(only if[^)]*\)/i.test(cmd);
  cmd = cmd.replace(/\s*\((?:only if|must|if)\b[^)]*\)/gi, "").trim();
  return { raw, cmd, optional };
}

const steps = spec.scenarios.reset.map(parseStep);
const needsDb = steps.some((s) => /\b(lab:reset|db:seed|db:migrate|db:up)\b/.test(s.cmd));
const plan = [];
if (mode === "start" && !existsSync(join(root, "node_modules")))
  plan.push({ cmd: "pnpm install --frozen-lockfile" });
if (needsDb) plan.push({ cmd: "pnpm db:up" }, { cmd: "pnpm db:migrate" });
for (const s of steps) {
  if (s.optional && mode === "start")
    plan.push({ ...s, skip: "optional step, run by lab:cleanup" });
  else if (!(s.cmd === "pnpm db:up" && needsDb)) plan.push(s);
}
if (mode === "cleanup" && needsDb && !flags.has("--keep-db")) plan.push({ cmd: "pnpm db:down" });

log(`${spec.title ?? labDirName}`);
for (const p of plan) log(`${p.skip ? "skip" : "plan"}: ${p.cmd}${p.skip ? `  (${p.skip})` : ""}`);
if (flags.has("--dry-run")) {
  log("dry run — nothing executed");
  process.exit(0);
}

const dirty = spawnSync("git", ["status", "--porcelain"], {
  cwd: root,
  encoding: "utf8",
}).stdout.trim();
if (dirty && !flags.has("--force")) {
  console.error(
    `[lab:${mode} ${lab}] uncommitted changes — the reset steps may discard them:\n${dirty}`,
  );
  console.error(`[lab:${mode} ${lab}] commit or stash them, or re-run with --force`);
  process.exit(3);
}

for (const p of plan) {
  if (p.skip) continue;
  log(`$ ${p.cmd}`);
  const r = spawnSync("bash", ["-c", p.cmd], { cwd: root, stdio: "inherit", env: process.env });
  if ((r.status ?? 1) !== 0) {
    console.error(`[lab:${mode} ${lab}] step failed (exit ${r.status}): ${p.cmd}`);
    process.exit(r.status ?? 1);
  }
}
log(
  mode === "start"
    ? "ready. Clean state for this lab:"
    : "cleaned up. The lab's starting state is:",
);
console.log(spec.scenarios.clean_state);
