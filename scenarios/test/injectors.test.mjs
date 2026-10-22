// Every injector is run for real (bash + curl + jq) against the contract stub, which carries
// the planted defects; each test asserts the injector's visible symptom and exit code 0.
// Set SCENARIOS_LIVE=1 KADE_API_URL=http://localhost:3001 to run the same suite against services/api.
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { runInjector, startApi } from "./helpers.mjs";

let api;
before(async () => {
  api = await startApi();
});
after(() => api.stop());

const env = () => ({ KADE_API_URL: api.url });

describe("oversell.sh", () => {
  it("lets more checkouts through than units on hand and drives onHand negative", () => {
    const r = runInjector("oversell.sh", ["--concurrency", "20"], env());
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /^SYMPTOM: /m);
    assert.equal(r.result.sku, "LH-LAMP-03");
    assert.equal(r.result.onHandBefore, 3);
    assert.ok(r.result.succeeded > 3, `expected >3 successes, got ${r.result.succeeded}`);
    assert.ok(r.result.onHandAfter < 0, `expected negative onHand, got ${r.result.onHandAfter}`);
    assert.equal(r.result.succeeded + r.result.rejected, 20);
    assert.ok(
      existsSync(join(r.stateDir, "oversell.jsonl")),
      "records what it created for lab-reset",
    );
  });
  it("is idempotent: a second burst reports the same symptom shape", () => {
    const r = runInjector("oversell.sh", ["--concurrency", "5"], env());
    assert.equal(r.status, 0, r.stderr);
    assert.ok(r.result.onHandAfter <= r.result.onHandBefore);
    assert.equal(typeof r.result.succeeded, "number");
  });
});

describe("duplicate-webhook.sh", () => {
  it("gets the same event_id processed twice: two payment_received events, two emails, double decrement", () => {
    const r = runInjector("duplicate-webhook.sh", ["--wait", "5"], env());
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /^SYMPTOM: /m);
    assert.equal(r.result.deliveries, 2);
    assert.ok(r.result.paymentReceivedEvents >= 2);
    assert.ok(r.result.emailQueuedEvents >= 2);
    assert.equal(r.result.onHandBefore - r.result.onHandAfter, 4, "2 units × 2 deliveries");
    assert.match(r.result.eventId, /^evt_dup_[0-9a-f]{8}$/);
  });
});

describe("abandoned-carts.sh", () => {
  it("turns a seeded >48h pending cart into a ghost order (paid, zero lines)", () => {
    const r = runInjector("abandoned-carts.sh", ["--wait", "5"], env());
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /^SYMPTOM: /m);
    assert.ok(r.result.ghostOrders >= 1);
    const ghost = r.result.orders.find((o) => o.ghost);
    assert.equal(ghost.lines, 0);
    assert.notEqual(ghost.status, "pending_payment");
  });
  it("falls back to a fresh cart + checkout when asked (--fresh) and still produces a ghost", () => {
    const r = runInjector(
      "abandoned-carts.sh",
      ["--fresh", "--wait", "5", "--brand", "trailhead-supply"],
      env(),
    );
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.result.ghostOrders, 1);
  });
});

describe("rounding-drift.sh", () => {
  it("finds at least one Trailhead order whose API total drifts from the exact recomputation", () => {
    const r = runInjector("rounding-drift.sh", ["--orders", "40"], env());
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /^SYMPTOM: /m);
    assert.equal(r.result.ordersPlaced, 40);
    assert.ok(r.result.mismatches >= 1);
    for (const d of r.result.drifted) {
      const diff =
        Math.abs(Number(d.apiTotal) - Number(d.exactTotal)) +
        Math.abs(Number(d.apiTax) - Number(d.exactTax));
      assert.ok(diff > 0 && diff < 0.05, `drift should be cents, got ${JSON.stringify(d)}`);
    }
  });
  it("is deterministic for a seed: the same baskets produce the same drift count", () => {
    const a = runInjector("rounding-drift.sh", ["--orders", "15", "--seed", "3"], env());
    const b = runInjector("rounding-drift.sh", ["--orders", "15", "--seed", "3"], env());
    assert.equal(a.result.mismatches, b.result.mismatches);
    assert.deepEqual(
      a.result.drifted.map((d) => d.apiTotal),
      b.result.drifted.map((d) => d.apiTotal),
    );
  });
});

describe("common exit codes", () => {
  it("exits 2 with a clear message when the API is down", () => {
    const r = runInjector("oversell.sh", [], { KADE_API_URL: "http://127.0.0.1:9" });
    assert.equal(r.status, 2);
    assert.match(r.stderr, /API not reachable/);
  });
  it("prints usage with --help", () => {
    for (const s of [
      "oversell.sh",
      "duplicate-webhook.sh",
      "abandoned-carts.sh",
      "rounding-drift.sh",
    ]) {
      const r = runInjector(s, ["--help"], env());
      assert.equal(r.status, 0);
      assert.match(r.stdout, /usage:/);
    }
  });
  it("documents the shared exit codes once, in lib/common.sh", () => {
    const lib = readFileSync(join(process.cwd(), "scenarios/lib/common.sh"), "utf8");
    for (const code of ["EXIT_SYMPTOM=0", "EXIT_USAGE=2", "EXIT_FIXED=3", "EXIT_PENDING=4"])
      assert.match(lib, new RegExp(code));
  });
});
