#!/usr/bin/env node
// Generates the MSW route table and the mock seed dataset from the frozen contracts:
//   packages/contracts/openapi.yaml  -> src/mocks/generated/routes.json
//   packages/contracts/seed-spec.yaml -> src/mocks/generated/seed.json
// `--check` exits 1 when the committed files differ from what the contracts produce.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, "..");
const contracts = resolve(appRoot, "../../packages/contracts");
const outDir = join(appRoot, "src/mocks/generated");
const check = process.argv.includes("--check");

const openapi = parse(readFileSync(join(contracts, "openapi.yaml"), "utf8"));
const seedSpec = parse(readFileSync(join(contracts, "seed-spec.yaml"), "utf8"));

const METHODS = ["get", "post", "put", "patch", "delete"];

function routeTable(spec) {
  const routes = [];
  for (const [path, item] of Object.entries(spec.paths)) {
    for (const method of METHODS) {
      const op = item[method];
      if (!op) continue;
      const security = op.security ?? spec.security ?? [];
      const schemes = new Set(security.flatMap((s) => Object.keys(s)));
      const okStatus = Object.keys(op.responses).find((s) => /^2\d\d$/.test(s)) ?? "200";
      routes.push({
        operationId: op.operationId,
        method: method.toUpperCase(),
        path,
        mswPath: path.replace(/\{(\w+)\}/g, ":$1"),
        tag: op.tags?.[0] ?? "untagged",
        summary: op.summary ?? "",
        successStatus: Number(okStatus),
        auth: {
          brand: schemes.has("brandHeader"),
          user: schemes.has("userHeader"),
          role: schemes.has("roleHeader"),
          paygateSignature: schemes.has("paygateSignature"),
        },
      });
    }
  }
  return routes;
}

function seedDataset(spec) {
  return {
    version: spec.version,
    seed: spec.seed,
    asOf: spec.as_of,
    brands: spec.brands,
    priceLists: spec.price_lists,
    skus: spec.skus,
    users: {
      merchandisers: spec.users.merchandisers,
      admins: spec.users.admins,
      customersPerBrand: 120,
    },
    orders: {
      total: spec.orders.total,
      split: spec.orders.split,
      statusMix: spec.orders.status_mix,
    },
    carts: {
      total: spec.carts.total,
      split: spec.carts.split,
      withPendingPayment: spec.carts.with_pending_payment,
    },
    plantedEdgeCases: spec.planted_edge_cases,
  };
}

const outputs = {
  "routes.json": JSON.stringify(routeTable(openapi), null, 2) + "\n",
  "seed.json": JSON.stringify(seedDataset(seedSpec), null, 2) + "\n",
};

let stale = [];
mkdirSync(outDir, { recursive: true });
for (const [name, content] of Object.entries(outputs)) {
  const file = join(outDir, name);
  const current = existsSync(file) ? readFileSync(file, "utf8") : null;
  if (current === content) continue;
  if (check) stale.push(name);
  else writeFileSync(file, content);
}

if (check && stale.length) {
  console.error(
    `gen-mocks: ${stale.join(", ")} out of date with packages/contracts — run \`npm run mocks:gen -w apps/web\``,
  );
  process.exit(1);
}
if (!check)
  console.log(`gen-mocks: wrote ${Object.keys(outputs).join(", ")} to src/mocks/generated/`);
