# apps/web — storefront + merchandiser console

React 19 + Vite 7 + React Router 7, TypeScript strict. Owned by W1-web.

- `pnpm --filter @harbourline/web run dev` serves on :5173 with MSW mocks (default). `VITE_API_MODE=live VITE_API_URL=http://localhost:3001 pnpm --filter @harbourline/web run dev` talks to `services/api` instead; the service worker is not registered in live mode.
- Gates: `pnpm --filter @harbourline/web run lint`, `pnpm --filter @harbourline/web run typecheck`, `pnpm --filter @harbourline/web test`, `pnpm --filter @harbourline/web run build`, `pnpm --filter @harbourline/web run test:e2e` (Playwright, builds + previews on :4173).
- `scripts/gen-mocks.mjs` regenerates `src/mocks/generated/{routes,seed}.json` from the frozen contracts; `pnpm --filter @harbourline/web run mocks:check` fails if they drift. `src/mocks/store.test.ts` fails if a contract `operationId` has no MSW handler.
- Money never touches a float: `src/lib/money.ts` works in integer cents and renders decimal strings from `@harbourline/contracts`.
- Fake auth is the three `X-Harbourline-*` headers; the admin login form just stores them in `sessionStorage` (`src/lib/session.ts`).
- Planted accessibility defects are listed in `PLANTED.md`. Never fix them on `main`.
- Do not edit `packages/contracts/**`; if the UI needs a contract change, propose it in the PR description.
