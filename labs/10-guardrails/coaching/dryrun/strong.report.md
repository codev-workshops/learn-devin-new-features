# Articulation gap report — lab 10 guardrails (coach-10-guardrails)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T10:00:00Z · timing: markers (±5 s) · transcript: `labs/10-guardrails/coaching/dryrun/strong.md`

## Scores — 90/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 28/30 | All five points with hosts, levels and profile names; mm2 said the wildcard aloud as words. (anchors: 27–30 every point with a host, level or profile named; 15–20 three of five; under 10 one point) |
| Structure | 22/25 | Outcome first in the framing and every update heading in order; the ask came last as planned. (anchors: 22–25 all parts in order; 13–17 parts present but weak; under 8 problem only) |
| Customer relevance | 18/20 | Named both hosts, the profile, the admin role and the two Python hosts; no date for the guardrail switch. (anchors: 16–20 CISO's questions answered with hosts, levels and dates; 10–13 some; under 6 feature talk) |
| Brevity and fluency | 13/15 | Every segment on target; one filler. (anchors: 11–15 segments on target, under 1 filler/min; 6–8 two or more segments off; under 4 most segments off) |
| Recovery | 9/10 | Both objections followed acknowledge → boundary → evidence → offer; objection 2 gave 1,302 packages, one host and two build hosts. (anchors: 7–10 acknowledge → boundary → evidence → offer held with numbers; 4–6 partial; under 3 no pattern) |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 58 s | -2 s | on |
| Think-aloud checkpoint (T+10) | 45 s | 44 s | -1 s | on |
| Think-aloud checkpoint (T+45) | 45 s | 47 s | +2 s | on |
| Three-minute CISO update | 180 s | 182 s | +2 s | on |
| Objection 1 (technical) — “A profile is config — what stops a developer turning it off?” | 90 s | 88 s | -2 s | on |
| Objection 2 (commercial) — “This will block legitimate npm installs.” | 90 s | 92 s | +2 s | on |

## Structure (problem → approach → evidence → next step)

- **Problem** — present: “From today every Devin session can reach two places”
- **Approach** — present: “What makes that stick is one word: mandatory”
- **Evidence** — present: “I checked it with the then option”
- **Next step** — present: “My ask: decide on pypi.org and files.pythonhosted.org for the snapshot build”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: yes

## Fillers and pauses

- Fillers: 1 in 8.5 spoken min (0.12/min) — um ×1
- Tag questions: 0
- Pauses over 8 s: none

## Missing key points

- [x] The enterprise profile is mandatory, so it is a floor nobody below can loosen, while a recommended profile is only a default a lower level may replace (8) — “The enterprise profile is a floor that no organization, automation or session can loosen. A recommended profile would only be a default that anyone below can replace”
- [x] Network and MCP access are separate allowlists: npm and the PayGate sandbox go in the host list and the MCP list stays empty until a server is approved (6) — “Network and MCP are separate allowlists. I think npm and star-dot-sandbox-dot-paygate go in the host list, and the MCP list stays empty until you approve a server”
- [x] A session already running keeps the profile it resolved until it wakes or reboots, while new sessions get the change straight away (6) — “A session that is already running keeps the profile it resolved until it wakes or reboots. New sessions get your change straight away”
- [x] Child sessions are governed by their parent's chain, so delegating work cannot step outside the floor (5) — “child sessions are governed by their parent's chain, so delegating work cannot step outside the floor”
- [x] Write paths are closed in the profile itself: GitHub CLI token removed, git access level, and Devin MCP read-only for automations (5) — “the GitHub CLI token is removed, git access is set per level, and automations get Devin MCP read-only”

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: none
- Coach asked “did you say…?”: never
- Article/plural slips: none
- Re-record: “I checked it with the then option: the webhooks host still works now and is blocked after the next wake.”

## Three stems for next time

1. "From today every session can reach…" — keep it as the first sentence; it worked.
1. "The webhooks host keeps working until…" — give the wake rule a time the CISO can plan around.
1. "Log only until…" — put a date on the guardrail switch to Block message.

## Compared with your previous run

First recorded run for dryrun on lab 10; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
