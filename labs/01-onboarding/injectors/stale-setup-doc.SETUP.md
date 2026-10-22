# New starter setup (last updated by Jonas)

1. Install Node 18 and Python 3.10.
2. `npm install`, then `pip install -e "services/payroll-worker[dev]"`.
3. Copy `services/api/.env.example` to `services/api/.env`.
4. Ask someone in #eng for the PayGate secret and paste it into the Devin blueprint so sessions have it.
5. If the database looks wrong, run `npm run db:seed -- --reset` with `DATABASE_URL` pointing at `dev-shared.kade.internal`.
6. Run `npm test`. If it is red, it was red before you.
