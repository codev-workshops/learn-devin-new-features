// The manifest, briefs, scripts and seed-spec plants must agree with each other.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  accessSync,
  constants,
  existsSync,
  readFileSync,
  readdirSync,
  mkdtempSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { parse as parseYaml } from "yaml";
import { root, scenarios } from "./helpers.mjs";

const manifest = JSON.parse(readFileSync(join(scenarios, "scenarios.json"), "utf8"));
const seed = parseYaml(readFileSync(join(root, "packages/contracts/seed-spec.yaml"), "utf8"));
const plantIds = new Set(seed.planted_edge_cases.map((p) => p.id));

describe("scenarios.json", () => {
  it("lists every injector script that exists and nothing else", () => {
    const listed = manifest.injectors
      .map((i) => i.script)
      .filter(Boolean)
      .map((s) => s.replace(/^scenarios\//, ""));
    const onDisk = readdirSync(scenarios)
      .filter((f) => f.endsWith(".sh") && f !== "lab-reset.sh")
      .concat(["bad-migration.patch"]);
    assert.deepEqual(listed.sort(), onDisk.sort());
  });
  it("points every plant at a seed-spec planted_edge_cases id with matching labs", () => {
    for (const inj of manifest.injectors) {
      if (!inj.plant) continue;
      assert.ok(plantIds.has(inj.plant), `${inj.id}: unknown plant ${inj.plant}`);
      const plant = seed.planted_edge_cases.find((p) => p.id === inj.plant);
      assert.deepEqual(inj.labs, plant.labs, `${inj.id}: labs differ from seed-spec`);
    }
  });
  it("ships a brief as data for every injector, in the customer's voice with money impact", () => {
    for (const inj of manifest.injectors) {
      const brief = JSON.parse(readFileSync(join(scenarios, inj.brief), "utf8"));
      assert.ok(
        Array.isArray(brief.voice) && brief.voice.length >= 2,
        `${inj.id}: brief needs 2+ paragraphs`,
      );
      assert.match(brief.impact.money.amount, /^\d+\.\d{2}$/);
      assert.ok(["USD", "EUR"].includes(brief.impact.money.currency));
      assert.ok(brief.stakeholders.length >= 2 && brief.constraints.length >= 1 && brief.deadline);
      for (const lab of inj.labs)
        assert.ok(brief.labs.includes(lab), `${inj.id}: brief does not list lab ${lab}`);
    }
  });
  it("gives lab authors a ready lab.json injector row (name, behaviour; command may be null for facilitator actions)", () => {
    for (const inj of manifest.injectors) {
      assert.ok(inj.lab.name && inj.lab.behaviour, inj.id);
      assert.ok(inj.lab.command === null || inj.lab.command.includes("scenarios/"), inj.id);
    }
  });
  it("names the deliberately wrong runbook and the right one, and both exist", () => {
    const wr = manifest.injectors.find((i) => i.id === "wrong-runbook");
    assert.ok(existsSync(join(root, wr.wrong_runbook)));
    assert.ok(existsSync(join(root, wr.correct_runbook)));
    assert.notEqual(wr.wrong_runbook, wr.correct_runbook);
  });
  it("contains no copyable Devin prompt (labs are promptless)", () => {
    const text =
      readFileSync(join(scenarios, "scenarios.json"), "utf8") +
      readdirSync(join(scenarios, "briefs"))
        .map((f) => readFileSync(join(scenarios, "briefs", f), "utf8"))
        .join("");
    assert.doesNotMatch(text, /```prompt/);
  });
});

describe("scripts", () => {
  it("are executable and pass bash -n", () => {
    for (const f of readdirSync(scenarios).filter((f) => f.endsWith(".sh"))) {
      accessSync(join(scenarios, f), constants.X_OK);
      const r = spawnSync("bash", ["-n", join(scenarios, f)], { encoding: "utf8" });
      assert.equal(r.status, 0, `${f}: ${r.stderr}`);
    }
  });
  it("only talk to the OpenAPI contract: no psql, no docker, no direct DB URL", () => {
    for (const f of readdirSync(scenarios).filter((f) => f.endsWith(".sh"))) {
      const text = readFileSync(join(scenarios, f), "utf8");
      assert.doesNotMatch(text, /\bpsql\b|docker |postgres:\/\//, `${f} reaches past the contract`);
    }
  });
  it("use only paths that exist in packages/contracts/openapi.yaml", () => {
    const openapi = parseYaml(readFileSync(join(root, "packages/contracts/openapi.yaml"), "utf8"));
    const templates = Object.keys(openapi.paths).map(
      (p) => new RegExp("^" + p.replace(/\{[^}]+\}/g, "[^/?]+") + "(\\?|$)"),
    );
    const sources = [
      "oversell.sh",
      "duplicate-webhook.sh",
      "abandoned-carts.sh",
      "rounding-drift.sh",
      "lib/common.sh",
    ]
      .map((f) => readFileSync(join(scenarios, f), "utf8"))
      .join("\n");
    const used = [
      ...sources.matchAll(/api (?:GET|POST|DELETE|PATCH|PUT) "?(\/[A-Za-z0-9_$./{}?=&-]+)"?/g),
    ].map((m) => m[1].replace(/\$\{?[A-Za-z_]+\}?/g, "x"));
    assert.ok(used.length >= 8);
    for (const u of used)
      assert.ok(
        templates.some((t) => t.test(u)),
        `${u} is not in the contract`,
      );
  });
});

describe("bad-migration.patch", () => {
  it("applies to an empty tree, adds a migration that drops the NOT NULL default, and reverts cleanly", () => {
    const dir = mkdtempSync(join(tmpdir(), "harbourline-badmig-"));
    const git = (...a) => spawnSync("git", a, { cwd: dir, encoding: "utf8" });
    assert.equal(git("init", "-q").status, 0);
    assert.equal(git("apply", "--check", join(scenarios, "bad-migration.patch")).status, 0);
    assert.equal(git("apply", join(scenarios, "bad-migration.patch")).status, 0);
    const file = join(dir, "db/migrations/1761094800000_orders-currency-nullable.sql");
    const sql = readFileSync(file, "utf8");
    assert.match(sql, /ALTER TABLE orders ALTER COLUMN currency DROP NOT NULL/);
    assert.match(sql, /DROP DEFAULT/);
    assert.match(sql, /-- Up Migration[\s\S]*-- Down Migration/);
    assert.equal(git("apply", "-R", join(scenarios, "bad-migration.patch")).status, 0);
    assert.ok(!existsSync(file));
  });
  it("also applies on top of an existing db/migrations directory", () => {
    const dir = mkdtempSync(join(tmpdir(), "harbourline-badmig-"));
    spawnSync("git", ["init", "-q"], { cwd: dir });
    spawnSync("mkdir", ["-p", join(dir, "db/migrations")]);
    writeFileSync(
      join(dir, "db/migrations/1761000000000_init.sql"),
      "-- Up Migration\nCREATE TABLE orders (currency text NOT NULL DEFAULT 'USD');\n",
    );
    const r = spawnSync("git", ["apply", join(scenarios, "bad-migration.patch")], {
      cwd: dir,
      encoding: "utf8",
    });
    assert.equal(r.status, 0, r.stderr);
  });
});

describe("lab-reset.sh", () => {
  it("reverts an applied bad-migration.patch, clears recorded state and prints the lab's starting state", () => {
    const stateDir = mkdtempSync(join(tmpdir(), "harbourline-state-"));
    writeFileSync(join(stateDir, "oversell.jsonl"), '{"at":"x"}\n');
    // Apply the patch to the real working tree, then let lab-reset revert it.
    const applied = spawnSync("git", ["apply", "scenarios/bad-migration.patch"], {
      cwd: root,
      encoding: "utf8",
    });
    assert.equal(applied.status, 0, applied.stderr);
    try {
      const r = spawnSync("bash", ["scenarios/lab-reset.sh", "02"], {
        cwd: root,
        encoding: "utf8",
        env: { ...process.env, HARBOURLINE_SCENARIO_STATE_DIR: stateDir },
      });
      assert.equal(r.status, 0, r.stderr);
      assert.match(r.stdout, /reverted scenarios\/bad-migration.patch/);
      assert.match(r.stdout, /clearing 1 recorded run\(s\) of oversell/);
      assert.match(r.stdout, /starting state: \.devin\/hooks\.v1\.json/);
      assert.ok(
        !existsSync(join(root, "db/migrations/1761094800000_orders-currency-nullable.sql")),
      );
      assert.equal(readdirSync(stateDir).length, 0);
    } finally {
      spawnSync("git", ["apply", "-R", "--check", "scenarios/bad-migration.patch"], { cwd: root })
        .status === 0 &&
        spawnSync("git", ["apply", "-R", "scenarios/bad-migration.patch"], { cwd: root });
    }
  });
  it("is a no-op for an unknown lab and rejects a bad lab number", () => {
    const ok = spawnSync("bash", ["scenarios/lab-reset.sh", "99"], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, HARBOURLINE_SCENARIO_STATE_DIR: mkdtempSync(join(tmpdir(), "s-")) },
    });
    assert.equal(ok.status, 0);
    assert.match(ok.stdout, /no lab-specific steps for lab 99/);
    assert.equal(spawnSync("bash", ["scenarios/lab-reset.sh", "5"], { cwd: root }).status, 2);
  });
});
