## Customer brief

Hello — I am the external security auditor Harbourline has hired ahead of its payment-provider renewal. Harbourline runs two brands, **Lumen Home** (USD) and **Trailhead Supply** (EUR), on one Node API and one PostgreSQL database. Every request names its brand in the `X-Harbourline-Brand` header. Last quarter a Lumen merchandiser opened a Trailhead order by pasting its link. Harbourline says that was a one-off. I need proof, not reassurance.

What I need from you:

1. **Proof that no endpoint leaks across brands.** That means every route the API serves, not a sample. For each endpoint I want a verdict: can a caller from one brand read or change a row that belongs to the other brand? Back each verdict with a file and line I can check.
2. **Confirmed leaks fixed, and each fix verified by someone other than whoever wrote it.** I will not accept "the fixer's tests pass" as verification.
3. **A cost I can put in my report.** Harbourline wants to use Devin's dynamic workflows to do this in parallel. Finance wants a number per agent, not a monthly total.

You have **seven calendar days** before my report goes to the payment provider. Today you have one three-hour working block. Finance has said the first run must be small: try the method on a slice before paying for the whole API.

## Stakeholders and constraints

- **The auditor (me)** signs off on evidence. I read diffs, test names, run logs and cost tables. I do not read prompts.
- **Harbourline's platform lead** owns `main` and has a freeze on it. No fix lands on `main` this week. Every remediation goes on a throwaway branch and is closed without merging. The known defects stay in the baseline because other teams train on them.
- **Harbourline's finance lead** approves ACU spend. They want to see the slice cost before they approve the full run.
- **Brand merchandisers** (one per brand) can confirm what they should and should not be able to see.
- **Forbidden:** changes on `main`, changes to `packages/contracts/`, real credentials, and any production database.
- **Output:** a short audit note covering endpoint count, verdicts, the fix branch, the verifier's verdict, and per-agent ACU. Bring the workflow's execution graph and run log. Keep the note out of commits.
