# Articulation gap report — lab 00 sample (coach-00-sample)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T09:00:00Z · timing: markers (±5 s) · transcript: `labs/00-sample/coaching/dryrun/strong.md`

## Scores — 86/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 28/30 | All five points named with a quotable sentence; cost given as engineer-days plus one outage (anchor: 27–30 = every point, one with a number). |
| Structure | 23/25 | Problem, approach, evidence, next step each present and in order; update kept Outcome → Evidence → Risk → Next action → Ask (anchor: 22–25 = all four present, order held). |
| Customer relevance | 17/20 | Four numbers from the brief (two brands, a week, 400 orders, 3% drift) and the Lamp Week deadline absorbed in one line (anchor: 16–18 = numbers from the brief, one assumption flagged). |
| Brevity and fluency | 11/15 | All five segments on target within ±5 s; one filler in 6.6 minutes; no tag questions (anchor: 11–13 = every segment on, fillers under 1/min). |
| Recovery | 7/10 | Both objections followed acknowledge → boundary → evidence → offer; the "how many orders" interruption was answered with one number and the skeleton resumed (anchor: 7–8 = pattern held under interruption). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 58 s | -2 s | on |
| Think-aloud checkpoint (T+10) | 45 s | 40 s | -5 s | on |
| Customer update | 120 s | 118 s | -2 s | on |
| Objection 1 (technical) — “How do you know Devin will respect our no-schema-change rule?” | 90 s | 85 s | -5 s | on |
| Objection 2 (commercial) — “Why pay for an agent to write a plan a senior engineer writes in ten minutes?” | 90 s | 95 s | +5 s | on |

## Structure (problem → approach → evidence → next step)

- **Problem** — present: “a new engineer needs a week to run it and someone reset that shared database on day two”
- **Approach** — present: “I will use Devin's environment setup with a blueprint and a root AGENTS.md”
- **Evidence** — present: “brings up the storefront in under fifteen minutes on a recording”
- **Next step** — present: “open one PR with AGENTS.md, the reset script and a proposed blueprint in docs”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: yes

## Fillers and pauses

- Fillers: 1 in 6.6 spoken min (0.15/min) — actually ×1
- Tag questions: 0
- Pauses over 8 s: none

## Missing key points

- [x] Both brands run on a single shared codebase and database (8) — “Harbourline runs two brands, Lumen Home and Trailhead Supply, on one shared codebase and one shared Postgres database”
- [x] The cost of the chosen problem stated in orders, money or engineer-days (6) — “roughly five engineer-days per hire plus one outage”
- [x] One Devin capability for the first session with one reason it beats an alternative (6) — “environment setup with a blueprint and a root AGENTS.md, because that is the only capability that removes the shared-database risk without touching a migration”
- [x] The proof of success described as an observable artefact rather than a command (5) — “a fresh session, following only the instructions, brings up the storefront in under fifteen minutes on a recording”
- [x] One thing the plan refuses to do because of the schema freeze, main or budget (5) — “on a throwaway branch, never on main”

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: none
- Coach asked “did you say…?”: never
- Article/plural slips: "zero touches of the shared database" — "touch" is uncountable here; "no contact with"
- Re-record: “Ask: I need thirty minutes of the on-call engineer's time”

## Three stems for next time

1. "The risk I am carrying is… and here is how I bound it…" — say the risk before the customer asks.
1. "Specifically, you would see…" — turn every claim into one observable.
1. "That is fair. The boundary is…" — keep the acknowledge → boundary pair under ten seconds.

## Compared with your previous run

First recorded run for dryrun on lab 00; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
