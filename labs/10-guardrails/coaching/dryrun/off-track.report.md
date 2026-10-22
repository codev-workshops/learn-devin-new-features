# Articulation gap report — lab 10 guardrails (coach-10-guardrails)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T10:00:00Z · timing: markers (±5 s) · transcript: `labs/10-guardrails/coaching/dryrun/off-track.md`

## Scores — 21/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 5/30 | One point, half-said: the separate MCP list; the floor was set to recommended, which is the opposite of the brief. (anchors: 27–30 every point with a host, level or profile named; 15–20 three of five; under 10 one point) |
| Structure | 6/25 | No outcome, no evidence and no ask; the update was two sentences. (anchors: 22–25 all parts in order; 13–17 parts present but weak; under 8 problem only) |
| Customer relevance | 5/20 | Feature talk; no hosts, levels, roles or dates. (anchors: 16–20 CISO's questions answered with hosts, levels and dates; 10–13 some; under 6 feature talk) |
| Brevity and fluency | 3/15 | Most segments off target; ten fillers and two pauses over 8 s. (anchors: 11–15 segments on target, under 1 filler/min; 6–8 two or more segments off; under 4 most segments off) |
| Recovery | 2/10 | Neither objection had a boundary or evidence; objection 1 relied on AI Guardrails (capped at 5) and objection 2 had no number (capped at 4). (anchors: 7–10 acknowledge → boundary → evidence → offer held with numbers; 4–6 partial; under 3 no pattern) |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 100 s | +40 s | over |
| Think-aloud checkpoint (T+10) | 45 s | 65 s | +20 s | over |
| Think-aloud checkpoint (T+45) | 45 s | 20 s | -25 s | under |
| Three-minute CISO update | 180 s | 130 s | -50 s | under |
| Objection 1 (technical) — “A profile is config — what stops a developer turning it off?” | 90 s | 37 s | -53 s | under |
| Objection 2 (commercial) — “This will block legitimate npm installs.” | 90 s | 22 s | -68 s | under |

## Structure (problem → approach → evidence → next step)

- **Problem** — missing
- **Approach** — weak: “I set it to recommended so teams aren't blocked”
- **Evidence** — missing
- **Next step** — missing
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 10 in 6.2 spoken min (1.61/min) — actually ×1, basically ×3, so yeah ×1, you know ×1, like ×1, um ×3
- Tag questions: 1 (“Teams can if they need to, it's recommended, that's the point, no?”)
- Pauses over 8 s: 14 s at [01:50] in checkpoint-10; 13 s at [05:10] in update

## Missing key points

- [ ] The enterprise profile is mandatory, so it is a floor nobody below can loosen, while a recommended profile is only a default a lower level may replace (8) — missed; belonged in framing
- [x] Network and MCP access are separate allowlists: npm and the PayGate sandbox go in the host list and the MCP list stays empty until a server is approved (6) — “I put npm in the network list and the MCP list is separate I guess, it's empty”
- [ ] A session already running keeps the profile it resolved until it wakes or reboots, while new sessions get the change straight away (6) — missed; belonged in checkpoint-45
- [ ] Child sessions are governed by their parent's chain, so delegating work cannot step outside the floor (5) — missed; belonged in update
- [ ] Write paths are closed in the profile itself: GitHub CLI token removed, git access level, and Devin MCP read-only for automations (5) — missed; belonged in objection-1

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: stuff (×2)
- Coach asked “did you say…?”: never
- Article/plural slips: "a lot of options" — name them: "five restrictions"; "the token thing" — say "the GitHub CLI token"
- Re-record: “Um, so security profiles are basically a feature in settings…”; “They get it, actually.”; “The guardrails would catch it, basically.”

## Three stems for next time

1. "From today every session can reach…" — start with the two hosts.
1. "Mandatory means…" — the CISO asked for a floor; say why recommended is not one.
1. "The profile is enforced by… and guardrails screen…" — one sentence each, never swapped.

## Compared with your previous run

First recorded run for dryrun on lab 10; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
