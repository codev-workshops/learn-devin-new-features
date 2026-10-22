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
    alias: { "@kade/contracts": contractsSrc },
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
