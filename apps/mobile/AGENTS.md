# AGENTS.md — apps/mobile (Harbourline mobile)

Expo SDK 54 · React Native 0.81 · Expo Router 6 · TypeScript strict. Read the root `AGENTS.md` first.

## Layout

| Path                           | What                                                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `src/app/`                     | Expo Router routes only: `index` (brand picker), `shop/` tabs (catalog, cart, orders), `product/[sku]`, `order/[orderId]` |
| `src/api/`                     | Typed client for `packages/contracts/openapi.yaml` (`client.ts`), money helpers, `createApi()` mode switch                |
| `src/mocks/`                   | `MockStore` (contract routes over the seed fixture), `mockFetch` transport, `handlers.ts` (MSW, tests only)               |
| `src/mocks/fixtures/seed.json` | Generated from the frozen `seed-spec.yaml` by `scripts/build-fixtures.mjs`; never edit by hand                            |
| `src/state/`                   | `HarbourlineProvider` (brand session, cart, haptics on add) and `useAsync`                                                |
| `modules/harbourline-haptics/` | Optional Expo module: Swift `UIImpactFeedbackGenerator` on iOS, `requireOptionalNativeModule` + no-op fallback            |
| `test/`                        | Jest (`jest-expo`): money, MockStore, client over MSW, haptics fallback, screens via Testing Library                      |

## Rules

- Build against `@harbourline/contracts` (resolved to its TypeScript source by `metro.config.js`, `tsconfig.json` and `jest.config.js`). Money stays a two-decimal string + currency; convert with `toMinor`/`fromMinor` only inside `src/api/money.ts` and `src/mocks/store.ts`.
- `EXPO_PUBLIC_API_MODE=mock` (default) serves the seed in-process; `live` talks to `services/api` at `EXPO_PUBLIC_API_BASE_URL` (default `http://10.0.2.2:3001`, the Android emulator's host loopback).
- Regenerate the fixture after a seed-spec change: `pnpm fixtures`. `pnpm build` fails if `seed.json` drifts.
- `android/` and `ios/` are generated (`pnpm exec expo prebuild`); configure native behaviour in `app.json`. Never edit them by hand.
- Do not build iOS from Linux. `modules/harbourline-haptics/ios` is compiled and verified only by the macOS (W4-13) child.
- Lint/format are workspace-local (`eslint.config.mjs`, `.prettierignore`) because the root ignores `apps/**`.

## Commands

```bash
pnpm --filter @harbourline/mobile test        # jest --ci
pnpm --filter @harbourline/mobile run lint    # prettier --check, eslint, tsc --noEmit
pnpm --filter @harbourline/mobile run build   # fixture check + expo export (android)
pnpm --filter @harbourline/mobile run android # prebuild + build + install on the running emulator
```
