/// <reference types="vitest/config" />
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const contractsSrc = fileURLToPath(
  new URL("../../packages/contracts/src/index.ts", import.meta.url),
);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@harbourline/contracts": contractsSrc },
    // apps/mobile pins an older React; the hoisted root copy may be that one, so React and
    // ReactDOM must both resolve from this workspace.
    dedupe: ["react", "react-dom"],
  },
  server: { port: 5173, strictPort: true },
  build: { sourcemap: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
  },
});
