#!/usr/bin/env node
// Workspace script runner used by the root package.json.
//
//   node scripts/ws.mjs run <script> --all [--parallel]        run <script> in every workspace that defines it
//   node scripts/ws.mjs run <script> -w <path> [--required]    run <script> in one workspace
//                                 [--fallback <file>]          ...or `node <file>` when the workspace has no such script
//   ... -- <args>                                              arguments forwarded to the script
//
// Unlike `npm run <script> --workspaces --if-present`, this never fails on an
// empty tree ("No workspaces found!"), so the root gates stay green while
// workspaces are still being added by other waves.
import { spawn } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rootPkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

function parseArgs(argv) {
  const opts = {
    all: false,
    parallel: false,
    required: false,
    workspace: null,
    fallback: null,
    passthrough: [],
  };
  const sep = argv.indexOf("--");
  const own = sep === -1 ? argv : argv.slice(0, sep);
  opts.passthrough = sep === -1 ? [] : argv.slice(sep + 1);
  const [command, script, ...rest] = own;
  for (let i = 0; i < rest.length; i += 1) {
    const a = rest[i];
    if (a === "--all") opts.all = true;
    else if (a === "--parallel") opts.parallel = true;
    else if (a === "--required") opts.required = true;
    else if (a === "-w" || a === "--workspace") opts.workspace = rest[++i];
    else if (a === "--fallback") opts.fallback = rest[++i];
    else throw new Error(`ws.mjs: unknown option ${a}`);
  }
  if (command !== "run" || !script)
    throw new Error("usage: ws.mjs run <script> (--all | -w <path>) [options] [-- args]");
  if (!opts.all && !opts.workspace) throw new Error("ws.mjs: pass --all or -w <path>");
  return { script, ...opts };
}

function expandWorkspaces(patterns) {
  const out = [];
  for (const pattern of patterns) {
    if (pattern.endsWith("/*")) {
      const base = join(root, pattern.slice(0, -2));
      if (!existsSync(base)) continue;
      for (const entry of readdirSync(base, { withFileTypes: true })) {
        if (entry.isDirectory() && existsSync(join(base, entry.name, "package.json"))) {
          out.push(join(pattern.slice(0, -2), entry.name));
        }
      }
    } else if (existsSync(join(root, pattern, "package.json"))) {
      out.push(pattern);
    }
  }
  return out.sort();
}

function readScripts(ws) {
  const file = join(root, ws, "package.json");
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8")).scripts ?? {};
}

function runCommand(cmd, args, cwd, label) {
  return new Promise((resolveRun) => {
    const child = spawn(cmd, args, { cwd, stdio: "inherit", env: process.env });
    child.on("exit", (code, signal) => resolveRun({ label, code: code ?? (signal ? 1 : 0) }));
    child.on("error", (err) => {
      console.error(`[ws] ${label}: ${err.message}`);
      resolveRun({ label, code: 1 });
    });
  });
}

function npmRun(ws, script, passthrough) {
  const args = ["run", script];
  if (passthrough.length) args.push("--", ...passthrough);
  return runCommand(
    process.platform === "win32" ? "npm.cmd" : "npm",
    args,
    join(root, ws),
    `${ws} › ${script}`,
  );
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const workspaces = expandWorkspaces(rootPkg.workspaces ?? []);

  if (opts.all) {
    const targets = workspaces.filter((ws) => readScripts(ws)?.[opts.script]);
    if (targets.length === 0) {
      console.log(
        `[ws] ${opts.script}: no workspace defines this script yet (${workspaces.length} workspace(s) present) — nothing to do`,
      );
      return 0;
    }
    console.log(`[ws] ${opts.script}: ${targets.join(", ")}`);
    const results = opts.parallel
      ? await Promise.all(targets.map((ws) => npmRun(ws, opts.script, opts.passthrough)))
      : await targets.reduce(
          async (prev, ws) => [...(await prev), await npmRun(ws, opts.script, opts.passthrough)],
          Promise.resolve([]),
        );
    const failed = results.filter((r) => r.code !== 0);
    for (const r of results) console.log(`[ws] ${r.code === 0 ? "ok  " : "FAIL"} ${r.label}`);
    return failed.length ? 1 : 0;
  }

  const ws = opts.workspace;
  const scripts = readScripts(ws);
  if (scripts?.[opts.script]) {
    return (await npmRun(ws, opts.script, opts.passthrough)).code;
  }
  if (opts.fallback && existsSync(join(root, opts.fallback))) {
    console.log(`[ws] ${ws} has no "${opts.script}" script; running node ${opts.fallback}`);
    return (
      await runCommand(
        process.execPath,
        [join(root, opts.fallback), ...opts.passthrough],
        root,
        opts.fallback,
      )
    ).code;
  }
  const why =
    scripts === null
      ? `workspace ${ws} is not present`
      : `workspace ${ws} has no "${opts.script}" script`;
  if (opts.required) {
    console.error(
      `[ws] ${why}. It is delivered by a later wave — see AGENTS.md (script contracts).`,
    );
    return 1;
  }
  console.log(`[ws] ${why} yet — skipping (delivered by a later wave; see AGENTS.md)`);
  return 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err.message);
    process.exit(2);
  },
);
