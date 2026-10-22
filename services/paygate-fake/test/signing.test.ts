import { describe, expect, it } from "vitest";

import { sign, verify } from "../src/signing.js";

describe("signing", () => {
  it("produces the sha256=<hex> scheme the worker verifies", () => {
    const sig = sign("harbourline-local-paygate-secret", '{"a":1}');
    expect(sig).toMatch(/^sha256=[0-9a-f]{64}$/);
    expect(sign("whsec_test", "{}")).toBe(sign("whsec_test", Buffer.from("{}")));
  });

  it("verifies only the exact body under the right secret", () => {
    const body = JSON.stringify({ event_id: "evt_1" });
    const sig = sign("s", body);
    expect(verify("s", body, sig)).toBe(true);
    expect(verify("s", body + " ", sig)).toBe(false);
    expect(verify("other", body, sig)).toBe(false);
    expect(verify("s", body, undefined)).toBe(false);
    expect(verify("s", body, "sha256=00")).toBe(false);
  });
});
