import type { Currency, Money } from "./types";

/** Integer minor units (cents) <-> the contract's two-decimal string. Never a float across a boundary. */
export function toMinor(amount: string): number {
  const match = /^(-?)(\d+)\.(\d{2})$/.exec(amount);
  if (!match) throw new Error(`not a money string: ${amount}`);
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 100 + Number(match[3]));
}

export function fromMinor(minor: number): string {
  const sign = minor < 0 ? "-" : "";
  const abs = Math.abs(minor);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export function money(minor: number, currency: Currency): Money {
  return { amount: fromMinor(minor), currency };
}

const SYMBOL: Record<Currency, string> = { USD: "$", EUR: "€" };

export function formatMoney(m: Money): string {
  const minor = toMinor(m.amount);
  const body = fromMinor(Math.abs(minor)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${minor < 0 ? "-" : ""}${SYMBOL[m.currency] ?? m.currency + " "}${body}`;
}

/** Half-up rounding of `minor * numerator / denominator` to an integer (mirrors the API's rule). */
export function mulRoundHalfUp(minor: number, numerator: number, denominator: number): number {
  const scaled = minor * numerator;
  const q = Math.floor(scaled / denominator);
  const r = scaled - q * denominator;
  return r * 2 >= denominator ? q + 1 : q;
}
