import { impact, isNativeHapticsAvailable } from "../modules/harbourline-haptics";

describe("harbourline-haptics JS fallback", () => {
  it("reports the native module as unavailable on Android / Jest", () => {
    expect(isNativeHapticsAvailable()).toBe(false);
  });

  it("impact() resolves false without throwing when the Swift module is absent", async () => {
    await expect(impact("medium")).resolves.toBe(false);
  });

  it("delegates to the native module when it is present", async () => {
    const native = { isAvailable: true, impact: jest.fn().mockResolvedValue(true) };
    await expect(impact("heavy", native)).resolves.toBe(true);
    expect(native.impact).toHaveBeenCalledWith("heavy");
  });

  it("swallows native failures so a haptic can never break add-to-cart", async () => {
    const native = { isAvailable: true, impact: jest.fn().mockRejectedValue(new Error("boom")) };
    await expect(impact("light", native)).resolves.toBe(false);
  });
});
