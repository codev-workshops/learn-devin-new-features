# Sealed capstone scenarios — facilitators and the capstone coach only

Learners: stop here. Reading any file in this folder disqualifies the envelope it describes; ask your facilitator for a different one.

Each `*.md` file is one sealed envelope. `tools/scenario-check.mjs` parses it at runtime for the coach (`--scenario <id> --json`) and validates all of them in CI (`--check`). None of these files is rendered into `labs/15-capstone/index.html`.

Format (headings are parsed; keep them exact): front matter (`id`, `brand`, `customer`, `role`), `## Envelope`, with three bold-labelled paragraphs **Incident**, **Feature request** and **Governance constraint**; `## Requirement change at T+60`; `## Injected blocker`; `## Must-mention` (table `id | weight | belonged_in | point`, weights sum to 30, `belonged_in` is a segment id from `lab.json`); `## Objections` (three numbered items, each with a `Follow-up:` line); `## Facilitator answer key`.
