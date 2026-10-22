// Runs node-pg-migrate with DATABASE_URL resolved the same way the API resolves it:
// process env first, then the repo-root .env, then the local-dev default.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const workspace = resolve(here, "..");
const repoRoot = resolve(workspace, "..", "..");
const envFile = join(repoRoot, ".env");

if (!("DATABASE_URL" in process.env) && existsSync(envFile)) {
  for (const raw of readFileSync(envFile, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const [key, ...rest] = line.split("=");
    if (key.trim() !== "DATABASE_URL") continue;
    process.env.DATABASE_URL = rest.join("=").trim(); // first occurrence wins, like src/config.ts
    break;
  }
}
if (!("DATABASE_URL" in process.env))
  process.env.DATABASE_URL = "postgres://harbourline:harbourline@localhost:5432/harbourline";

const direction = process.argv[2] ?? "up";
// Run the package's bin script through the current Node binary (no .bin shim, so it also works on Windows).
const require = createRequire(import.meta.url);
const pkgDir = dirname(require.resolve("node-pg-migrate/package.json"));
const bin = join(pkgDir, require("node-pg-migrate/package.json").bin["node-pg-migrate"]);
const result = spawnSync(
  process.execPath,
  [
    bin,
    "--migrations-dir",
    join(repoRoot, "db", "migrations"),
    "--migration-file-language",
    "sql",
    direction,
    ...process.argv.slice(3),
  ],
  { stdio: "inherit", cwd: workspace, env: process.env },
);
process.exit(result.status ?? 1);
