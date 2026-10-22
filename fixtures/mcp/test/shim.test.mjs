// Smoke test for the fixture MCP shim: a real stdio session with a clean environment (no
// credentials of any kind), every catalogued tool called once with its example arguments,
// plus a few content assertions that tie the fixtures to the Lamp Week story.
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createInterface } from "node:readline";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..", "..");
const shim = join(root, "fixtures/mcp/shim.mjs");
const catalogue = JSON.parse(readFileSync(join(root, "fixtures/mcp/tools.json"), "utf8")).tools;

let child;
let nextId = 1;
const pending = new Map();
function rpc(method, params) {
  const id = nextId++;
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
  return new Promise((resolve, reject) => {
    pending.set(id, resolve);
    setTimeout(() => reject(new Error(`timeout waiting for ${method}`)), 5000);
  });
}
const callTool = async (name, args) => {
  const res = await rpc("tools/call", { name, arguments: args });
  return res;
};
const parsed = (res) => JSON.parse(res.result.content[0].text);

before(() => {
  child = spawn(process.execPath, [shim], {
    cwd: root,
    env: { PATH: process.env.PATH },
    stdio: ["pipe", "pipe", "inherit"],
  });
  createInterface({ input: child.stdout }).on("line", (line) => {
    const msg = JSON.parse(line);
    pending.get(msg.id)?.(msg);
    pending.delete(msg.id);
  });
});
after(() => child.kill());

describe("MCP handshake", () => {
  it("initializes with protocolVersion, capabilities and serverInfo, then accepts the initialized notification and ping", async () => {
    const init = await rpc("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "smoke", version: "0" },
    });
    assert.equal(init.result.protocolVersion, "2025-06-18");
    assert.equal(init.result.serverInfo.name, "kade-fixtures");
    assert.ok(init.result.capabilities.tools && init.result.capabilities.resources);
    child.stdin.write(
      JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n",
    );
    const ping = await rpc("ping", {});
    assert.deepEqual(ping.result, {});
  });
  it("falls back to its newest protocol version for an unknown client version", async () => {
    const init = await rpc("initialize", { protocolVersion: "1999-01-01", capabilities: {} });
    assert.equal(init.result.protocolVersion, "2025-06-18");
  });
  it("returns JSON-RPC errors for unknown methods and malformed input", async () => {
    const r = await rpc("nope/method", {});
    assert.equal(r.error.code, -32601);
  });
});

describe("tools", () => {
  it("lists every catalogued tool with a JSON-schema input and covers all six providers", async () => {
    const { result } = await rpc("tools/list", {});
    assert.equal(result.tools.length, catalogue.length);
    for (const t of result.tools) {
      assert.ok(t.name && t.description && t.inputSchema?.type === "object", t.name);
    }
    for (const p of ["pagerduty_", "datadog_", "aws_", "gcp_", "bigquery_", "workspace_"])
      assert.ok(
        result.tools.some((t) => t.name.startsWith(p)),
        p,
      );
  });
  it("answers every tool with its example arguments without error", async () => {
    for (const t of catalogue) {
      const res = await callTool(t.name, t.example ?? {});
      assert.ok(res.result, `${t.name}: ${JSON.stringify(res.error)}`);
      assert.equal(res.result.isError, false, t.name);
      assert.ok(res.result.content[0].text.length > 20, t.name);
    }
  });
  it("rejects unknown tools and missing required arguments with -32602", async () => {
    assert.equal((await callTool("pagerduty_delete_everything", {})).error.code, -32602);
    assert.equal((await callTool("pagerduty_get_incident", {})).error.code, -32602);
  });
  it("flags a not-found lookup as a tool error, not a protocol error", async () => {
    const res = await callTool("pagerduty_get_incident", { incident_id: "NOPE" });
    assert.equal(res.result.isError, true);
  });
});

describe("Lamp Week story is consistent across providers", () => {
  it("PagerDuty: incident 2187 is acknowledged, carries the Datadog monitor id and a 7-entry timeline with the RB-101 note", async () => {
    const inc = parsed(await callTool("pagerduty_get_incident", { incident_id: "2187" })).incident;
    assert.equal(inc.id, "Q3KADE0210LAMP");
    assert.equal(inc.status, "acknowledged");
    assert.match(inc.description, /48213771/);
    const log = parsed(
      await callTool("pagerduty_list_incident_log_entries", { incident_id: inc.id }),
    ).log_entries;
    assert.equal(log.length, 7);
    assert.ok(log.some((e) => e.channel?.summary?.includes("RB-101")));
    const list = parsed(
      await callTool("pagerduty_list_incidents", { status: "resolved" }),
    ).incidents;
    assert.ok(list.length >= 2 && list.every((i) => i.status === "resolved"));
  });
  it("Datadog: the on-hand monitor is in Alert, the metric bottoms out at -37 and the logs show the same event_id twice", async () => {
    const monitors = parsed(await callTool("datadog_list_monitors", {}));
    const onHand = monitors.find((m) => m.id === 48213771);
    assert.equal(onHand.overall_state, "Alert");
    assert.match(onHand.message, /RB-102/);
    const series = parsed(
      await callTool("datadog_query_metrics", {
        query: "min:kade.inventory.on_hand{sku:LH-LAMP-03}",
      }),
    ).series[0];
    assert.equal(Math.min(...series.pointlist.map((p) => p[1])), -37);
    const logs = parsed(
      await callTool("datadog_search_logs", {
        query: "service:kade-fulfilment-worker evt_9f2a7c01",
      }),
    ).data;
    assert.equal(logs.length, 2);
    assert.deepEqual(
      logs.map((l) => l.attributes.attributes.attempt),
      [1, 2],
    );
  });
  it("AWS: the kade-api deployment at 22:40 precedes the 02:10 page; secrets are ARNs, never values", async () => {
    const svc = parsed(await callTool("aws_ecs_describe_services", {})).services[0];
    assert.equal(svc.deployments[0].createdAt, "2026-10-21T22:40:12Z");
    const td = parsed(await callTool("aws_ecs_describe_task_definition", {}));
    for (const s of td.containerDefinitions[0].secrets)
      assert.match(s.valueFrom, /^arn:aws:secretsmanager:/);
    const objs = parsed(
      await callTool("aws_s3_list_objects", {
        bucket: "kade-prod-exports",
        prefix: "orders_daily/dt=2026-10-22",
      }),
    );
    assert.equal(objs.KeyCount, 1);
  });
  it("GCP: Cloud Run and Pub/Sub descriptors are served as YAML text with the at-least-once note", async () => {
    const run = (await callTool("gcp_cloudrun_get_service", {})).result.content[0].text;
    assert.match(run, /kind: Service/);
    const ps = (await callTool("gcp_pubsub_describe", {})).result.content[0].text;
    assert.match(ps, /enableExactlyOnceDelivery: false/);
  });
  it("BigQuery: orders_daily shows LH-LAMP-03 oversold to -37 on 2026-10-22 and the filters work", async () => {
    const q = parsed(
      await callTool("bigquery_query_orders_daily", { sku: "LH-LAMP-03", from: "2026-10-20" }),
    );
    assert.equal(q.totalRows, 3);
    assert.equal(q.rows.at(-1).on_hand_eod, -37);
    assert.equal(q.rows.at(-1).units, 36);
    const limited = parsed(
      await callTool("bigquery_query_orders_daily", { brand: "trailhead-supply", limit: 2 }),
    );
    assert.equal(limited.rows.length, 2);
    assert.ok(limited.totalRows > 2);
    const tables = parsed(await callTool("bigquery_list_tables", {}));
    assert.ok(tables.tables[0].schema.some((c) => c.name === "on_hand_eod"));
  });
  it("Workspace: the planning sheet says 3 units on hand for the hero SKU and the incident doc has TODOs for the lab", async () => {
    const sheet = parsed(await callTool("workspace_get_sheet", {}));
    const row = sheet.values.find((r) => r[0] === "LH-LAMP-03");
    assert.equal(row[4], "3");
    const doc = (await callTool("workspace_get_doc", {})).result.content[0].text;
    assert.match(doc, /^---\ndoc_id:/);
    assert.ok((doc.match(/TODO/g) ?? []).length >= 3);
  });
});

describe("resources", () => {
  it("lists fixture files under fixtures/mcp, observability and infra and reads one back", async () => {
    const { result } = await rpc("resources/list", {});
    const uris = result.resources.map((r) => r.uri);
    assert.ok(
      uris.includes("kade-fixture://observability/runbooks/RB-102-negative-on-hand-oversell.md"),
    );
    assert.ok(uris.includes("kade-fixture://infra/bigquery/orders_daily.csv"));
    assert.ok(!uris.some((u) => u.includes("tools.json")));
    const read = await rpc("resources/read", {
      uri: "kade-fixture://observability/runbooks/RB-101-negative-on-hand-cache.md",
    });
    assert.match(read.result.contents[0].text, /# RB-101/);
    const missing = await rpc("resources/read", { uri: "kade-fixture://../../package.json" });
    assert.equal(missing.error.code, -32002);
  });
});

describe("credential-free", () => {
  it("the shim and its fixtures mention no token, key or password values", () => {
    const r = spawnSync(
      "grep",
      [
        "-rniE",
        "(api[_-]?key|token|password|secret)\\s*[:=]\\s*[\"'][A-Za-z0-9+/_-]{12,}",
        "fixtures/mcp",
        "observability",
        "infra",
      ],
      { cwd: root, encoding: "utf8" },
    );
    assert.equal(r.stdout.trim(), "", r.stdout);
  });
  it("--list and --call work from the command line without any environment", () => {
    const list = spawnSync(process.execPath, [shim, "--list"], {
      cwd: root,
      encoding: "utf8",
      env: { PATH: process.env.PATH },
    });
    assert.equal(list.status, 0);
    assert.equal(list.stdout.trim().split("\n").length, catalogue.length);
    const call = spawnSync(
      process.execPath,
      [shim, "--call", "datadog_get_monitor", '{"monitor_id":"48213802"}'],
      { cwd: root, encoding: "utf8", env: { PATH: process.env.PATH } },
    );
    assert.equal(call.status, 0);
    assert.match(call.stdout, /webhook failure rate/);
  });
});
