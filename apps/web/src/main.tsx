import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { apiMode } from "./lib/api";
import "./styles.css";

async function boot() {
  if (apiMode() === "mock") {
    const { startMocks } = await import("./mocks/browser");
    await startMocks();
  }
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void boot();
