import Constants from "expo-constants";

import { createHttpApi, type KadeApi } from "./client";
import { createMockFetch } from "../mocks/mockFetch";
import { MockStore } from "../mocks/store";

export type ApiMode = "mock" | "live";

export interface ApiConfig {
  mode: ApiMode;
  baseUrl: string;
}

export function readApiConfig(): ApiConfig {
  const extra = (Constants.expoConfig?.extra ?? {}) as { apiMode?: string; apiBaseUrl?: string };
  const env = process.env;
  const mode = (env.EXPO_PUBLIC_API_MODE ?? extra.apiMode ?? "mock") === "live" ? "live" : "mock";
  const baseUrl = env.EXPO_PUBLIC_API_BASE_URL ?? extra.apiBaseUrl ?? "http://10.0.2.2:3001";
  return { mode, baseUrl };
}

/** `mock` (default) serves the seed fixture in-process; `live` talks to services/api. */
export function createApi(config: ApiConfig = readApiConfig()): KadeApi {
  if (config.mode === "live") {
    return createHttpApi(config.baseUrl, (input, init) => fetch(input, init));
  }
  return createHttpApi("", createMockFetch(new MockStore({ now: new Date() })));
}

export * from "./client";
export * from "./money";
export * from "./types";
