// MSW handlers for Jest: the same MockStore routes, exposed through msw's `http` API so tests
// and the web app can share one mock surface. Not imported by the app bundle (msw is dev-only).
import { http, HttpResponse } from "msw";

import { createMockFetch } from "./mockFetch";
import { MockStore } from "./store";

export const API_BASE = "http://localhost:3001";

export function createHandlers(store: MockStore = new MockStore(), base = API_BASE) {
  const mockFetch = createMockFetch(store);
  return [
    http.all(`${base}/*`, async ({ request }) => {
      const url = new URL(request.url);
      const body =
        request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();
      const res = await mockFetch(url.pathname + url.search, {
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body: body || undefined,
      });
      const text = await res.text();
      return new HttpResponse(text || null, {
        status: res.status,
        headers: text ? { "content-type": "application/json" } : undefined,
      });
    }),
  ];
}

export const handlers = createHandlers();
