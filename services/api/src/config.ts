import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(here, "..", "..", "..");

/** Loads the repo-root `.env` (never overriding variables already set). */
function loadDotEnv(): void {
  const file = join(repoRoot, ".env");
  if (!existsSync(file)) return;
  for (const raw of readFileSync(file, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadDotEnv();

export const config = {
  databaseUrl: process.env.DATABASE_URL ?? "postgres://kade:kade@localhost:5432/kade",
  port: Number(process.env.API_PORT ?? 3001),
  paygateUrl: process.env.PAYGATE_URL ?? `http://localhost:${process.env.PAYGATE_PORT ?? 3002}`,
  paygateSecret: process.env.PAYGATE_SECRET ?? "kade-local-paygate-secret",
  /** Fixed clock for labs and tests (`KADE_NOW=2026-10-22T12:00:00Z`); defaults to wall time. */
  fixedNow: process.env.KADE_NOW ? new Date(process.env.KADE_NOW) : null,
  version: "0.1.0",
};

export function now(): Date {
  return config.fixedNow ? new Date(config.fixedNow) : new Date();
}
