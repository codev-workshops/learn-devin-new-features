// Node 22 provides fetch/Response/Headers globally; msw/node and the typed client rely on them.
if (typeof globalThis.fetch !== "function") {
  throw new Error("Jest must run on Node >= 22 (global fetch required)");
}

jest.mock("expo-modules-core", () => {
  const actual = jest.requireActual("expo-modules-core");
  return { ...actual, requireOptionalNativeModule: () => null };
});

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiMode: "mock" } } },
}));
