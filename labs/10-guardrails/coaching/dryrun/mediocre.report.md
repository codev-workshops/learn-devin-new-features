# Articulation gap report — lab 10 guardrails (coach-10-guardrails)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T10:00:00Z · timing: markers (±5 s) · transcript: `labs/10-guardrails/coaching/dryrun/mediocre.md`

## Scores — 55/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 18/30 | Three of five points; the running-session question was answered as if every session changed at once, and the write paths were never named. (anchors: 27–30 every point with a host, level or profile named; 15–20 three of five; under 10 one point) |
| Structure | 14/25 | Framing opened with the JSON file before the outcome; the update had no timing, coverage or ask headings. (anchors: 22–25 all parts in order; 13–17 parts present but weak; under 8 problem only) |
| Customer relevance | 11/20 | Named the floor and the two destinations; no host names, no admin role, no numbers. (anchors: 16–20 CISO's questions answered with hosts, levels and dates; 10–13 some; under 6 feature talk) |
| Brevity and fluency | 8/15 | Framing, checkpoint-45 and objection-2 over, update under; six fillers and an 11 s pause. (anchors: 11–15 segments on target, under 1 filler/min; 6–8 two or more segments off; under 4 most segments off) |
| Recovery | 4/10 | Objection 1 said AI Guardrails would stop traffic (capped at 5); objection 2 gave no number (capped at 4). (anchors: 7–10 acknowledge → boundary → evidence → offer held with numbers; 4–6 partial; under 3 no pattern) |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 72 s | +12 s | over |
| Think-aloud checkpoint (T+10) | 45 s | 40 s | -5 s | on |
| Think-aloud checkpoint (T+45) | 45 s | 65 s | +20 s | over |
| Three-minute CISO update | 180 s | 155 s | -25 s | under |
| Objection 1 (technical) — “A profile is config — what stops a developer turning it off?” | 90 s | 86 s | -4 s | on |
| Objection 2 (commercial) — “This will block legitimate npm installs.” | 90 s | 106 s | +16 s | over |

## Structure (problem → approach → evidence → next step)

- **Problem** — weak: “So I made three profiles in a JSON file”
- **Approach** — present: “The enterprise one is mandatory, which means it's a floor nobody below can loosen”
- **Evidence** — weak: “I re-ran the resolver with the new file and it shows the API host only”
- **Next step** — weak: “It's basically ready, so yeah”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 6 in 8.7 spoken min (0.69/min) — actually ×1, basically ×2, so yeah ×1, you know ×1, um ×1
- Tag questions: 1 (“If something breaks we can actually add hosts later, that's fine, right?”)
- Pauses over 8 s: 11 s at [02:40] in checkpoint-45

## Missing key points

- [x] The enterprise profile is mandatory, so it is a floor nobody below can loosen, while a recommended profile is only a default a lower level may replace (8) — “The enterprise one is mandatory, which means it's a floor nobody below can loosen. Recommended would just be a default”
- [x] Network and MCP access are separate allowlists: npm and the PayGate sandbox go in the host list and the MCP list stays empty until a server is approved (6) — “MCP is its own allowlist, separate from network, so the MCP list stays empty and npm and PayGate sandbox go in hosts”
- [ ] A session already running keeps the profile it resolved until it wakes or reboots, while new sessions get the change straight away (6) — missed; belonged in checkpoint-45
- [x] Child sessions are governed by their parent's chain, so delegating work cannot step outside the floor (5) — “child sessions follow the parent's chain, so helpers can't get around it”
- [ ] Write paths are closed in the profile itself: GitHub CLI token removed, git access level, and Devin MCP read-only for automations (5) — missed; belonged in objection-1

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: I think (×1)
- Coach asked “did you say…?”: never
- Article/plural slips: "everyone gets it" — say which sessions: "new sessions now, running sessions on their next wake"
- Re-record: “So I made three profiles in a JSON file, kade-floor, kade-dev and kade-automation…”; “If something breaks we can actually add hosts later, that's fine, right?”

## Three stems for next time

1. "From today every session can reach…" — say the outcome before the file name.
1. "A session already running keeps…" — answer the T+45 question with the wake rule.
1. "Guardrails screen messages, not…" — keep the two features apart before the CISO does it for you.

## Compared with your previous run

First recorded run for dryrun on lab 10; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
