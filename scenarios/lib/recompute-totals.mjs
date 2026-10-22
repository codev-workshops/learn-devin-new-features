#!/usr/bin/env node
// Exact order-total recomputation in integer cents with banker's rounding — the arithmetic
// the fulfilment worker uses (Python Decimal, ROUND_HALF_EVEN). Reads one Order JSON per line
// on stdin, prints a JSON array with the API totals, the exact totals and a `drift` flag.
//
// Brand rules mirror packages/contracts/seed-spec.yaml#brands (frozen):
//   lumen-home        USD, tax_exclusive 8.25%, flat shipping 7.95
//   trailhead-supply  EUR, tax_inclusive 19%,   flat shipping 5.90, free over 80.00
import { createInterface } from "node:readline";

const BRANDS = {
  "lumen-home": { taxRate: [825, 10000], inclusive: false, shippingFlat: 795, freeOver: null },
  "trailhead-supply": { taxRate: [19, 100], inclusive: true, shippingFlat: 590, freeOver: 8000 },
};

const cents = (money) => {
  const m = /^(-?)(\d+)\.(\d{2})$/.exec(money?.amount ?? "");
  if (!m) throw new Error(`not a Money amount: ${JSON.stringify(money)}`);
  return (m[1] ? -1n : 1n) * (BigInt(m[2]) * 100n + BigInt(m[3]));
};
const fmt = (c) => {
  const neg = c < 0n;
  const a = neg ? -c : c;
  return `${neg ? "-" : ""}${a / 100n}.${String(a % 100n).padStart(2, "0")}`;
};

// round(num / den) half-to-even, all BigInt.
function divHalfEven(num, den) {
  const q = num / den;
  const r = num - q * den;
  const twice = r * 2n;
  if (twice < den) return q;
  if (twice > den) return q + 1n;
  return q % 2n === 0n ? q : q + 1n;
}

export function recompute(order) {
  const rule = BRANDS[order.brand];
  if (!rule) throw new Error(`unknown brand ${order.brand}`);
  const subtotal = order.lines.reduce((s, l) => s + cents(l.unitPrice) * BigInt(l.quantity), 0n);
  const [n, d] = rule.taxRate;
  // inclusive: tax = gross * r / (1 + r)  → subtotal * n / (d + n); exclusive: subtotal * n / d
  const tax = rule.inclusive
    ? divHalfEven(subtotal * BigInt(n), BigInt(d + n))
    : divHalfEven(subtotal * BigInt(n), BigInt(d));
  const shipping =
    rule.freeOver !== null && subtotal >= BigInt(rule.freeOver) ? 0n : BigInt(rule.shippingFlat);
  const total = rule.inclusive ? subtotal + shipping : subtotal + tax + shipping;
  return { subtotal: fmt(subtotal), tax: fmt(tax), shipping: fmt(shipping), total: fmt(total) };
}

async function main() {
  const out = [];
  for await (const line of createInterface({ input: process.stdin })) {
    if (!line.trim()) continue;
    const order = JSON.parse(line);
    const exact = recompute(order);
    const api = {
      subtotal: order.totals.subtotal.amount,
      tax: order.totals.tax.amount,
      shipping: order.totals.shipping.amount,
      total: order.totals.total.amount,
    };
    out.push({
      order: order.id,
      number: order.number,
      api,
      exact,
      drift: api.total !== exact.total || api.tax !== exact.tax,
    });
  }
  process.stdout.write(JSON.stringify(out) + "\n");
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(2);
  });
}
