// Runs node-pg-migrate with DATABASE_URL resolved the same way the API resolves it:
// process env first, then the repo-root .env, then the local-dev default.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const workspace = resolve(here, "..");
const repoRoot = resolve(workspace, "..", "..");
const envFile = join(repoRoot, ".env");

if (!process.env.DATABASE_URL && existsSync(envFile)) {
  for (const raw of readFileSync(envFile, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const [key, ...rest] = line.split("=");
    if (key.trim() === "DATABASE_URL") process.env.DATABASE_URL = rest.join("=").trim();
  }
}
process.env.DATABASE_URL ??= "postgres://kade:kade@localhost:5432/kade";

const direction = process.argv[2] ?? "up";
const bin = join(repoRoot, "node_modules", ".bin", "node-pg-migrate");
const result = spawnSync(
  bin,
  [
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
