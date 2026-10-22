import { describe, expect, it } from "vitest";
import { formatMoney, fromCents, mulMoney, roundHalfUp, toCents } from "./money";

describe("money", () => {
  it("round-trips decimal strings through integer cents", () => {
    expect(toCents("12.50")).toBe(1250);
    expect(fromCents(1250)).toBe("12.50");
    expect(fromCents(5)).toBe("0.05");
    expect(fromCents(-105)).toBe("-1.05");
    expect(() => toCents("12.5")).toThrow();
  });
  it("multiplies without floats", () => {
    expect(mulMoney({ amount: "0.10", currency: "USD" }, 3).amount).toBe("0.30");
  });
  it("rounds half up", () => {
    expect(roundHalfUp(2.5)).toBe(3);
    expect(roundHalfUp(2.4999)).toBe(2);
  });
  it("formats per locale", () => {
    expect(formatMoney({ amount: "1234.50", currency: "USD" }, "en-US")).toBe("$1,234.50");
    expect(formatMoney({ amount: "89.90", currency: "EUR" }, "de-DE")).toMatch(/^89,90\s€$/);
  });
});
