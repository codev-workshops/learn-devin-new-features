import { createHash } from "node:crypto";

/** mulberry32: tiny deterministic PRNG so the dataset is identical on every machine. */
export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(min: number, maxInclusive: number): number {
    return min + Math.floor(this.next() * (maxInclusive - min + 1));
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)]!;
  }

  weighted<T>(items: readonly T[], weight: (item: T) => number): T {
    const total = items.reduce((s, i) => s + weight(i), 0);
    let roll = this.next() * total;
    for (const item of items) {
      roll -= weight(item);
      if (roll <= 0) return item;
    }
    return items[items.length - 1]!;
  }
}

/** Name-derived UUID (v5-shaped) so ids survive a `--reset`. */
export function uuidFor(name: string): string {
  const hex = createHash("sha1").update(`harbourline:${name}`).digest("hex").slice(0, 32);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `5${hex.slice(13, 16)}`,
    `${((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0")}${hex.slice(18, 20)}`,
    hex.slice(20, 32),
  ].join("-");
}

/** Largest-remainder split of `total` by fractional weights; keys keep insertion order. */
export function apportion<K extends string>(
  total: number,
  weights: Record<K, number>,
): Record<K, number> {
  const keys = Object.keys(weights) as K[];
  const sum = keys.reduce((s, k) => s + weights[k], 0);
  const exact = keys.map((k) => (weights[k] / sum) * total);
  const out = Object.fromEntries(keys.map((k, i) => [k, Math.floor(exact[i]!)])) as Record<
    K,
    number
  >;
  let remaining = total - keys.reduce((s, k) => s + out[k], 0);
  const order = keys
    .map((k, i) => ({ k, frac: exact[i]! - Math.floor(exact[i]!) }))
    .sort((a, b) => b.frac - a.frac || keys.indexOf(a.k) - keys.indexOf(b.k));
  for (const { k } of order) {
    if (remaining <= 0) break;
    out[k] += 1;
    remaining -= 1;
  }
  return out;
}
