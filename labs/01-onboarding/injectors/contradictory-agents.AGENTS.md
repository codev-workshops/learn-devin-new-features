# AGENTS.md — services/api/src

Notes for anyone changing the API source.

- Run the API tests against the shared development database so you see real brand data: export `DATABASE_URL=postgres://harbourline@dev-shared.harbourline.internal:5432/harbourline` before `pnpm test`.
- If the tests leave data behind, reset with `docker compose down -v && docker compose up -d` and reseed.
- Gates for this folder: `pnpm test` only; lint and build are run by CI.
- It is fine to tidy up the webhook handler while you are in here.
