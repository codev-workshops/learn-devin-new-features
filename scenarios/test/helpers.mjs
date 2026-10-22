import { spawn, spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

export const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const scenarios = join(root, "scenarios");

// Start the contract stub unless KADE_API_URL already points at a live API (SCENARIOS_LIVE=1).
export async function startApi() {
  if (process.env.SCENARIOS_LIVE === "1" && process.env.KADE_API_URL) {
    return { url: process.env.KADE_API_URL, stop() {} };
  }
  const child = spawn(process.execPath, [join(scenarios, "test/contract-stub.mjs")], {
    stdio: ["ignore", "pipe", "inherit"],
  });
  const port = await new Promise((resolve, reject) => {
    child.stdout.once("data", (d) => resolve(Number(String(d).trim())));
    child.once("exit", (code) => reject(new Error(`stub exited ${code}`)));
  });
  return { url: `http://127.0.0.1:${port}`, stop: () => child.kill() };
}

export function runInjector(script, args, env) {
  const stateDir = mkdtempSync(join(tmpdir(), "kade-scenario-state-"));
  const r = spawnSync("bash", [join(scenarios, script), ...args], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, KADE_SCENARIO_STATE_DIR: stateDir, ...env },
  });
  const resultLine = r.stdout.split("\n").find((l) => l.startsWith("RESULT: "));
  return { ...r, stateDir, result: resultLine ? JSON.parse(resultLine.slice(8)) : null };
}
