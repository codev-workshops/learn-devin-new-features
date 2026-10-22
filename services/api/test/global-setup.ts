import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../src/config.js";

const here = dirname(fileURLToPath(import.meta.url));
const workspace = resolve(here, "..");

/** Migrates and reseeds the fixture database once per `vitest run`. */
export default function setup(): void {
  const env = {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL ?? config.databaseUrl,
    HARBOURLINE_NOW: process.env.HARBOURLINE_NOW ?? "2026-10-22T09:00:00Z",
  };
  execSync("npm run db:migrate --silent", { cwd: workspace, stdio: "inherit", env });
  execSync("npm run db:seed --silent -- --reset", { cwd: workspace, stdio: "inherit", env });
}
