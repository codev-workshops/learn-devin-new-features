#!/usr/bin/env node
// Turns the frozen seed spec (packages/contracts/seed-spec.yaml) into the JSON fixture the mock
// API serves. The output is committed so Metro and Jest need no pre-step; `npm test` fails when it
// drifts from the spec (test/fixtures.test.ts).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const here = dirname(fileURLToPath(import.meta.url));
const specPath = resolve(here, "../../../packages/contracts/seed-spec.yaml");
const outPath = resolve(here, "../src/mocks/fixtures/seed.json");

export function buildFixture(specYaml) {
  const spec = parse(specYaml);
  const brands = Object.fromEntries(
    Object.entries(spec.brands).map(([id, b]) => [
      id,
      {
        id,
        name: b.name,
        currency: b.currency,
        pricing: b.pricing,
        taxRate: b.tax_rate,
        locale: b.locale,
        warehouses: b.warehouses,
        freeShippingOver: b.free_shipping_over,
        shippingFlat: b.shipping_flat,
        orderNumberPrefix: b.order_number_prefix,
        collections: b.collections.map((c) => ({
          slug: c.slug,
          name: c.name,
          description: c.description,
          promotion: c.promotion,
        })),
      },
    ]),
  );
  const promotions = Object.fromEntries(
    (spec.price_lists ?? [])
      .filter((p) => p.active_from)
      .map((p) => [
        p.id,
        {
          id: p.id,
          brand: p.brand,
          name: p.name,
          activeFrom: p.active_from,
          activeTo: p.active_to,
        },
      ]),
  );
  const skus = Object.fromEntries(
    Object.entries(spec.skus).map(([brand, list]) => [
      brand,
      list.map((s) => ({
        sku: s.sku,
        name: s.name,
        collection: s.collection,
        price: s.price,
        onHand: s.on_hand,
        safetyStock: s.safety_stock,
        lowStock: s.low_stock ?? false,
        preorder: s.preorder ?? false,
        bundle: s.bundle,
        variants: s.variants,
        ships: s.ships,
      })),
    ]),
  );
  return {
    version: spec.version,
    seed: spec.seed,
    asOf: spec.as_of,
    brands,
    promotions,
    skus,
    orderStatusMix: spec.orders.status_mix,
  };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  if (!existsSync(specPath)) {
    console.error(`seed spec not found at ${specPath}`);
    process.exit(1);
  }
  const fixture = buildFixture(readFileSync(specPath, "utf8"));
  const json = `${JSON.stringify(fixture, null, 2)}\n`;
  if (process.argv.includes("--check")) {
    const current = existsSync(outPath) ? readFileSync(outPath, "utf8") : "";
    if (current !== json) {
      console.error(
        "src/mocks/fixtures/seed.json is out of date; run `npm run fixtures -w apps/mobile`",
      );
      process.exit(1);
    }
    console.log("seed.json is in sync with packages/contracts/seed-spec.yaml");
  } else {
    writeFileSync(outPath, json);
    const count = Object.values(fixture.skus).reduce((n, l) => n + l.length, 0);
    console.log(`wrote ${outPath} (${count} SKUs, ${Object.keys(fixture.brands).length} brands)`);
  }
}
