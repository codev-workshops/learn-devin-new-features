#!/usr/bin/env node
// Kadé fixture MCP shim — a tiny Model Context Protocol server (stdio, JSON-RPC 2.0, newline
// delimited) that serves the PagerDuty, Datadog, AWS, GCP, BigQuery and Google Workspace
// fixtures under fixtures/mcp, observability/ and infra/. Zero dependencies, read-only, no
// credentials. Labs point Devin at it when the live integration is not available:
//
//   { "mcpServers": { "kade-fixtures": { "command": "node", "args": ["fixtures/mcp/shim.mjs"] } } }
//
// Methods: initialize, notifications/initialized, ping, tools/list, tools/call,
// resources/list, resources/read. Tool catalogue: fixtures/mcp/tools.json.
import { createInterface } from "node:readline";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const root = resolve(here, "..", "..");
const PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];
const SERVER_INFO = { name: "kade-fixtures", version: "0.1.0" };
const RESOURCE_ROOTS = ["fixtures/mcp", "observability", "infra"];

const text = (rel) => readFileSync(join(root, rel), "utf8");
const json = (rel) => expand(JSON.parse(text(rel)));

// Fixture files may inline other files: {"$file": "path"} (optionally {"$pick": "key"}).
function expand(node) {
  if (Array.isArray(node)) return node.map(expand);
  if (node && typeof node === "object") {
    if (typeof node.$file === "string") {
      const inner = json(node.$file);
      return node.$pick ? inner[node.$pick] : inner;
    }
    const out = {};
    for (const [k, v] of Object.entries(node)) if (k !== "$comment") out[k] = expand(v);
    return out;
  }
  return node;
}

const catalogue = JSON.parse(text("fixtures/mcp/tools.json")).tools;

function parseCsv(rel) {
  const [head, ...lines] = text(rel).trim().split("\n");
  const cols = head.split(",");
  return lines.map((l) => Object.fromEntries(l.split(",").map((v, i) => [cols[i], v])));
}

// Clip a metrics query result to [from, to] (ISO or unix ms) when either bound is given.
function windowed(result, a) {
  const from = a.from
    ? Number(new Date(isNaN(Number(a.from)) ? a.from : Number(a.from)))
    : -Infinity;
  const to = a.to ? Number(new Date(isNaN(Number(a.to)) ? a.to : Number(a.to))) : Infinity;
  if (from === -Infinity && to === Infinity) return result;
  return {
    ...result,
    series: result.series.map((s) => ({
      ...s,
      pointlist: s.pointlist.filter(([t]) => t >= from && t <= to),
    })),
  };
}

const incidents = () => json("fixtures/mcp/pagerduty/incidents.json").incidents;
const findIncident = (id) =>
  incidents().find((i) => i.id === String(id) || String(i.incident_number) === String(id));

export const handlers = {
  fileJson: (tool) => json(tool.source),
  fileText: (tool) => text(tool.source),
  pagerdutyListIncidents: (_t, a) => {
    const list = incidents().filter(
      (i) =>
        (!a.status || i.status === a.status) && (!a.service_id || i.service?.id === a.service_id),
    );
    return { incidents: list, total: list.length, more: false };
  },
  pagerdutyGetIncident: (_t, a) => {
    const inc = findIncident(a.incident_id);
    if (!inc) throw new ToolError(`incident ${a.incident_id} not found`);
    return { incident: inc };
  },
  pagerdutyLogEntries: (_t, a) =>
    findIncident(a.incident_id)?.id === "Q3KADE0210LAMP"
      ? json("observability/pagerduty/incident-lamp-week-log-entries.json")
      : { log_entries: [] },
  pagerdutyAlerts: (_t, a) =>
    findIncident(a.incident_id)?.id === "Q3KADE0210LAMP"
      ? json("observability/pagerduty/alerts-lamp-week.json")
      : { alerts: [] },
  datadogListMonitors: (_t, a) =>
    json("fixtures/mcp/datadog/monitors.json").monitors.filter(
      (m) => !a.tag || m.tags.includes(a.tag),
    ),
  datadogGetMonitor: (_t, a) => {
    const m = json("fixtures/mcp/datadog/monitors.json").monitors.find(
      (m) => String(m.id) === String(a.monitor_id),
    );
    if (!m) throw new ToolError(`monitor ${a.monitor_id} not found`);
    return m;
  },
  datadogQueryMetrics: (_t, a) => {
    const q = a.query ?? "";
    if (/on_hand/.test(q)) return json("observability/datadog/metrics-on-hand-lh-lamp-03.json");
    if (/webhooks/.test(q)) return json("observability/datadog/metrics-webhook-failure-rate.json");
    return {
      status: "ok",
      res_type: "time_series",
      query: q,
      series: [],
      note: "no fixture series for this query",
    };
  },
  datadogSearchLogs: (_t, a) => {
    const terms = (a.query ?? "").split(/\s+/).filter((t) => t && !t.includes(":"));
    const svc = /service:([\w-]+)/.exec(a.query ?? "")?.[1];
    const all = json("observability/datadog/logs-worker-0210.json");
    const data = all.data.filter(
      (l) =>
        (!svc || l.attributes.service === svc) &&
        terms.every((t) => l.attributes.message.includes(t)),
    );
    return { ...all, data };
  },
  awsS3ListObjects: (_t, a) => {
    const fx = json("infra/aws/s3-export-bucket.json");
    const Contents = fx.objects.Contents.filter((o) => !a.prefix || o.Key.startsWith(a.prefix));
    return { Name: fx.bucket.Name, Prefix: a.prefix ?? "", KeyCount: Contents.length, Contents };
  },
  bigqueryQueryOrdersDaily: (_t, a) => {
    let rows = parseCsv("infra/bigquery/orders_daily.csv");
    if (a.brand) rows = rows.filter((r) => r.brand === a.brand);
    if (a.sku) rows = rows.filter((r) => r.sku === a.sku);
    if (a.from) rows = rows.filter((r) => r.order_date >= a.from);
    if (a.to) rows = rows.filter((r) => r.order_date <= a.to);
    rows = rows.map((r) => ({
      ...r,
      orders: Number(r.orders),
      units: Number(r.units),
      on_hand_eod: Number(r.on_hand_eod),
      refunded_orders: Number(r.refunded_orders),
      duplicate_webhooks: Number(r.duplicate_webhooks),
    }));
    return {
      table: "kade-prod.analytics.orders_daily",
      totalRows: rows.length,
      rows: rows.slice(0, a.limit ?? 1000),
    };
  },
  workspaceGetSheet: (_t, a) => {
    const idx = json("fixtures/mcp/workspace/index.json");
    const file = idx.sheets[a.spreadsheet_id ?? Object.keys(idx.sheets)[0]];
    if (!file) throw new ToolError(`sheet ${a.spreadsheet_id} not found`);
    return json(file);
  },
  workspaceGetDoc: (_t, a) => {
    const idx = json("fixtures/mcp/workspace/index.json");
    const file = idx.docs[a.doc_id ?? Object.keys(idx.docs)[0]];
    if (!file) throw new ToolError(`doc ${a.doc_id} not found`);
    return text(file);
  },
};

export class ToolError extends Error {}

export function callTool(name, args = {}) {
  const tool = catalogue.find((t) => t.name === name);
  if (!tool) return { error: { code: -32602, message: `Unknown tool: ${name}` } };
  for (const req of tool.inputSchema.required ?? []) {
    if (args[req] === undefined)
      return { error: { code: -32602, message: `Missing required argument: ${req}` } };
  }
  // `match` in tools.json lists the ids a fixture answers for; any other id is a not-found tool error.
  for (const [arg, allowed] of Object.entries(tool.match ?? {})) {
    const given = args[arg];
    if (given === undefined) continue;
    const values = Array.isArray(given) ? given : [given];
    const ok = values.every((v) =>
      allowed.some(
        (x) => String(v) === x || String(v).endsWith(`/${x}`) || String(v).endsWith(`:${x}`),
      ),
    );
    if (!ok) {
      return {
        result: {
          content: [
            {
              type: "text",
              text: `${arg} ${JSON.stringify(given)} not found; fixture has ${allowed.join(", ")}`,
            },
          ],
          isError: true,
        },
      };
    }
  }
  try {
    const out = handlers[tool.handler](tool, args);
    const body = typeof out === "string" ? out : JSON.stringify(out, null, 2);
    return { result: { content: [{ type: "text", text: body }], isError: false } };
  } catch (err) {
    if (err instanceof ToolError)
      return { result: { content: [{ type: "text", text: err.message }], isError: true } };
    throw err;
  }
}

function listResourceFiles() {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry);
      if (statSync(p).isDirectory()) {
        if (entry !== "test" && entry !== "node_modules") walk(p);
      } else if (
        /\.(json|md|yaml|csv|sql)$/.test(entry) &&
        entry !== "tools.json" &&
        entry !== "mcp.example.json"
      )
        out.push(relative(root, p));
    }
  };
  for (const r of RESOURCE_ROOTS) if (existsSync(join(root, r))) walk(join(root, r));
  return out.sort();
}
const mime = (p) =>
  p.endsWith(".json")
    ? "application/json"
    : p.endsWith(".csv")
      ? "text/csv"
      : p.endsWith(".yaml")
        ? "application/yaml"
        : p.endsWith(".sql")
          ? "application/sql"
          : "text/markdown";

export function handle(msg) {
  const { id, method, params = {} } = msg;
  const reply = (result) => ({ jsonrpc: "2.0", id, result });
  const fail = (code, message) => ({ jsonrpc: "2.0", id, error: { code, message } });
  switch (method) {
    case "initialize": {
      const v = PROTOCOL_VERSIONS.includes(params.protocolVersion)
        ? params.protocolVersion
        : PROTOCOL_VERSIONS[0];
      return reply({
        protocolVersion: v,
        capabilities: {
          tools: { listChanged: false },
          resources: { subscribe: false, listChanged: false },
        },
        serverInfo: SERVER_INFO,
        instructions:
          "Read-only fixtures for the Kadé Commerce labs: PagerDuty incident 2187 (Lamp Week), Datadog monitors/metrics/logs, AWS ECS/S3, GCP Cloud Run/Pub/Sub, BigQuery orders_daily and the merchandiser Sheet / incident Doc. No credentials are involved; nothing can be changed through this server.",
      });
    }
    case "notifications/initialized":
    case "notifications/cancelled":
      return null;
    case "ping":
      return reply({});
    case "tools/list":
      return reply({
        tools: catalogue.map(({ name, description, inputSchema }) => ({
          name,
          description,
          inputSchema,
        })),
      });
    case "tools/call": {
      const r = callTool(params.name, params.arguments ?? {});
      return r.error ? fail(r.error.code, r.error.message) : reply(r.result);
    }
    case "resources/list":
      return reply({
        resources: listResourceFiles().map((p) => ({
          uri: `kade-fixture://${p}`,
          name: p,
          mimeType: mime(p),
        })),
      });
    case "resources/read": {
      const uri = String(params.uri ?? "");
      const rel = uri.replace(/^kade-fixture:\/\//, "");
      if (!uri.startsWith("kade-fixture://") || !listResourceFiles().includes(rel))
        return fail(-32002, `Resource not found: ${uri}`);
      return reply({ contents: [{ uri, mimeType: mime(rel), text: text(rel) }] });
    }
    default:
      return id === undefined ? null : fail(-32601, `Method not found: ${method}`);
  }
}

export function serve(input = process.stdin, output = process.stdout) {
  const rl = createInterface({ input, crlfDelay: Infinity });
  rl.on("line", (line) => {
    if (!line.trim()) return;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      output.write(
        JSON.stringify({
          jsonrpc: "2.0",
          id: null,
          error: { code: -32700, message: "Parse error" },
        }) + "\n",
      );
      return;
    }
    const batch = Array.isArray(msg) ? msg : [msg];
    for (const m of batch) {
      const res = handle(m);
      if (res) output.write(JSON.stringify(res) + "\n");
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--list")) {
    for (const t of catalogue) console.log(`${t.name.padEnd(36)} ${t.description}`);
  } else if (process.argv.includes("--call")) {
    const i = process.argv.indexOf("--call");
    const r = callTool(process.argv[i + 1], JSON.parse(process.argv[i + 2] ?? "{}"));
    console.log(r.error ? JSON.stringify(r.error) : r.result.content[0].text);
    process.exitCode = r.error || r.result.isError ? 1 : 0;
  } else {
    serve();
  }
}
