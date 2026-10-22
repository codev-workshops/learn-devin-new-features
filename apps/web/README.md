# Kadé Commerce web

Two brand storefronts and the merchandiser console in a single Vite app.

| Route group                                       | Pages                                                                                                                       |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `/shop/:brand` (`lumen-home`, `trailhead-supply`) | catalog → collection → product, cart, checkout, PayGate stub (`pay/:paymentId`, mock only), orders, order status + timeline |
| `/admin`                                          | fake brand-header sign-in, inventory (adjust ±1), price lists (edit/save), orders (filter + paging), abandoned carts        |

```bash
npm install                      # from the repo root
npm run dev -w apps/web          # http://localhost:5173, MSW mocks from packages/contracts
VITE_API_MODE=live VITE_API_URL=http://localhost:3001 npm run dev -w apps/web   # real services/api
npm run test -w apps/web         # Vitest + Testing Library (MSW node server)
npm run test:e2e -w apps/web     # Playwright smoke per route group (needs `npm run test:e2e:install` once)
```

Mock mode is fully self-contained: `scripts/gen-mocks.mjs` turns `openapi.yaml` into a route table and `seed-spec.yaml` into a deterministic dataset (60 products, 400 orders, 30 carts); `src/mocks/store.ts` implements every operation in memory with the same validation and error codes as the contract. Lumen Home is USD + 8.25% sales tax + $7.95 shipping; Trailhead Supply is EUR, VAT-inclusive, free shipping from €80.

Planted defects: see `PLANTED.md`.
