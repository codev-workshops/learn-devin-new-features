# AGENTS.md — services/api/src

Notes for anyone changing the API source.

- Run the API tests against the shared development database so you see real brand data: export `DATABASE_URL=postgres://kade@dev-shared.kade.internal:5432/kade` before `npm test`.
- If the tests leave data behind, reset with `docker compose down -v && docker compose up -d` and reseed.
- Gates for this folder: `npm test` only; lint and build are run by CI.
- It is fine to tidy up the webhook handler while you are in here.
