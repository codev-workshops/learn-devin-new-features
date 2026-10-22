# apps/web — storefront + merchandiser console

React 19 + Vite 7 + React Router 7, TypeScript strict. Owned by W1-web.

- `npm run dev -w apps/web` serves on :5173 with MSW mocks (default). `VITE_API_MODE=live VITE_API_URL=http://localhost:3001 npm run dev -w apps/web` talks to `services/api` instead; the service worker is not registered in live mode.
- Gates: `npm run lint -w apps/web`, `npm run typecheck -w apps/web`, `npm test -w apps/web`, `npm run build -w apps/web`, `npm run test:e2e -w apps/web` (Playwright, builds + previews on :4173).
- `scripts/gen-mocks.mjs` regenerates `src/mocks/generated/{routes,seed}.json` from the frozen contracts; `npm run mocks:check -w apps/web` fails if they drift. `src/mocks/store.test.ts` fails if a contract `operationId` has no MSW handler.
- Money never touches a float: `src/lib/money.ts` works in integer cents and renders decimal strings from `@harbourline/contracts`.
- Fake auth is the three `X-Harbourline-*` headers; the admin login form just stores them in `sessionStorage` (`src/lib/session.ts`).
- Planted accessibility defects are listed in `PLANTED.md`. Never fix them on `main`.
- Do not edit `packages/contracts/**`; if the UI needs a contract change, propose it in the PR description.
