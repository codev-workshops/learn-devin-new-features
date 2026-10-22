import type { Currency, Money } from "@kade/contracts";

/** Money is carried as decimal strings; all arithmetic happens in integer cents. */
export function toCents(amount: string): number {
  const match = /^(-?)(\d+)\.(\d{2})$/.exec(amount);
  if (!match) throw new Error(`Not a money amount: ${amount}`);
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 100 + Number(match[3]));
}

export function fromCents(cents: number): string {
  const rounded = Math.round(cents);
  const sign = rounded < 0 ? "-" : "";
  const abs = Math.abs(rounded);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export function money(cents: number, currency: Currency): Money {
  return { amount: fromCents(cents), currency };
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new Error("Currency mismatch");
  return money(toCents(a.amount) + toCents(b.amount), a.currency);
}

export function mulMoney(m: Money, quantity: number): Money {
  return money(toCents(m.amount) * quantity, m.currency);
}

/** Half-up rounding to the cent, the rule the seed spec uses for the Lamp Week promotion. */
export function roundHalfUp(cents: number): number {
  return Math.floor(cents + 0.5);
}

export function formatMoney(m: Money, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: m.currency }).format(
    toCents(m.amount) / 100,
  );
}
