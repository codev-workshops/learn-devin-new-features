import type { Currency, Money } from "@harbourline/contracts";

/**
 * Money helpers. Amounts cross the API boundary as decimal strings, but the arithmetic below
 * runs on JavaScript floats with half-up rounding — see PLANTED.md (`float-totals`).
 */
export function roundHalfUp(value: number): number {
  return Math.round(value * 100) / 100;
}

export function toAmount(value: number): string {
  const rounded = roundHalfUp(value);
  return (Object.is(rounded, -0) ? 0 : rounded).toFixed(2);
}

export function money(value: number | string, currency: Currency): Money {
  return { amount: toAmount(Number(value)), currency };
}

export interface BrandPricing {
  currency: Currency;
  pricing: "tax_exclusive" | "tax_inclusive";
  taxRate: number;
  freeShippingOver: number | null;
  shippingFlat: number;
}

export interface LineInput {
  unitPrice: number;
  quantity: number;
}

export interface ComputedTotals {
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  currency: Currency;
  taxIncluded: boolean;
}

export function computeTotals(lines: LineInput[], brand: BrandPricing): ComputedTotals {
  const subtotal = roundHalfUp(lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0));
  const hasLines = lines.length > 0;
  if (brand.pricing === "tax_exclusive") {
    const tax = roundHalfUp(subtotal * brand.taxRate);
    const shipping = hasLines ? brand.shippingFlat : 0;
    return {
      subtotal,
      discount: 0,
      tax,
      shipping,
      total: roundHalfUp(subtotal + tax + shipping),
      currency: brand.currency,
      taxIncluded: false,
    };
  }
  const tax = roundHalfUp(subtotal - subtotal / (1 + brand.taxRate));
  const freeShipping = brand.freeShippingOver !== null && subtotal >= brand.freeShippingOver;
  const shipping = hasLines && !freeShipping ? brand.shippingFlat : 0;
  return {
    subtotal,
    discount: 0,
    tax,
    shipping,
    total: roundHalfUp(subtotal + shipping),
    currency: brand.currency,
    taxIncluded: true,
  };
}

export function totalsToApi(t: ComputedTotals) {
  return {
    subtotal: money(t.subtotal, t.currency),
    discount: money(t.discount, t.currency),
    tax: money(t.tax, t.currency),
    shipping: money(t.shipping, t.currency),
    total: money(t.total, t.currency),
    currency: t.currency,
    taxIncluded: t.taxIncluded,
  };
}
