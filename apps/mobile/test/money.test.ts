import { formatMoney, fromMinor, mulRoundHalfUp, toMinor } from "@/api/money";

describe("money", () => {
  it("round-trips decimal strings through integer minor units", () => {
    expect(toMinor("129.00")).toBe(12900);
    expect(toMinor("0.05")).toBe(5);
    expect(fromMinor(12905)).toBe("129.05");
    expect(fromMinor(7)).toBe("0.07");
  });

  it("rejects floats and malformed strings", () => {
    expect(() => toMinor("12.5")).toThrow(/not a money string/);
    expect(() => toMinor("abc")).toThrow();
  });

  it("rounds half up like the API", () => {
    expect(mulRoundHalfUp(12900, 825, 10000)).toBe(1064); // 1064.25 -> 1064
    expect(mulRoundHalfUp(10, 5, 100)).toBe(1); // 0.5 -> 1
  });

  it("formats with the brand's currency symbol", () => {
    expect(formatMoney({ amount: "1299.00", currency: "USD" })).toBe("$1,299.00");
    expect(formatMoney({ amount: "5.90", currency: "EUR" })).toBe("€5.90");
  });
});
