# Articulation gap report — lab 04 plugin-engineering (coach-04-plugin-engineering)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T10:00:00Z · timing: markers (±5 s) · transcript: `labs/04-plugin-engineering/coaching/dryrun/off-track.md`

## Scores — 20/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 6/30 | One of five points; the token was placed in the plugin and the revision described as a patch. (anchors: 27–30 every point with a file or scope named; 15–20 three of five; under 10 one point) |
| Structure | 5/25 | No outcome, no evidence, no ask; feature talk throughout. (anchors: 22–25 all parts in order; 13–17 parts present but weak; under 8 problem only) |
| Customer relevance | 5/20 | Did not answer what runs, where it came from or who can change it. (anchors: 16–20 reviewer's questions answered with files, scopes and counts; 10–13 some; under 6 feature talk) |
| Brevity and fluency | 3/15 | Five of six segments off target; eleven fillers and two long pauses. (anchors: 11–15 segments on target, under 1 filler/min; 6–8 two or more segments off; under 4 most segments off) |
| Recovery | 1/10 | Neither objection acknowledged; objection 1 relied on trust in the team, objection 2 on popularity. (anchors: 7–10 acknowledge → boundary → evidence → offer held with numbers; 4–6 partial; under 3 no pattern) |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 114 s | +54 s | over |
| Think-aloud checkpoint (T+20) | 45 s | 23 s | -22 s | under |
| Think-aloud checkpoint (T+70) | 45 s | 75 s | +30 s | over |
| Three-minute security-reviewer update | 180 s | 98 s | -82 s | under |
| Objection 1 (technical) — “A plugin is one more supply chain to secure. Why should I let it run in every session?” | 90 s | 40 s | -50 s | under |
| Objection 2 (commercial) — “Why not just hand each brand team a playbook and skip the packaging?” | 90 s | 120 s | +30 s | over |

## Structure (problem → approach → evidence → next step)

- **Problem** — missing
- **Approach** — weak: “I made a skill for the release checklist”
- **Evidence** — missing
- **Next step** — missing
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 11 in 7.8 spoken min (1.41/min) — actually ×1, basically ×3, you know ×2, like ×2, um ×3
- Tag questions: 1 (“They're better, right? Everyone uses them.”)
- Pauses over 8 s: 15 s at [02:45] in checkpoint-70; 14 s at [06:40] in objection-2

## Missing key points

- [ ] One plugin ships both procedures as skills together with the freeze rule, the push guard hook, the reviewer subagent and the incident MCP (8) — missed; belonged in framing
- [x] Repository installs follow the branch unless pinned to a SHA, uploads stay pinned to what was uploaded, and a skills-only repo needs no manifest (6) — “A repo install keeps up with the branch unless you pin a SHA. Uploads stay as uploaded and skills-only repos need no manifest”
- [ ] A new uploaded revision replaces the whole bundle, so a partial zip removes every file it left out (6) — missed; belonged in checkpoint-70
- [ ] The MCP credential is connected after install through a secret reference and never written into the plugin files (5) — missed; belonged in update
- [ ] Engineers without edit rights can only propose; an admin approves the diff before the shared plugin changes (5) — missed; belonged in objection-1

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: basically (×3)
- Coach asked “did you say…?”: never
- Article/plural slips: none
- Re-record: “And I put the PagerDuty key in the config for now so the demo works.”; “The hook guarantees nobody pushes to main, even in cloud sessions.”; “They're better, right? Everyone uses them.”

## Three stems for next time

1. "Every session will get…" — lead with the outcome, then the contents.
1. "The token is not in the plugin; it is…" — rehearse the credential answer until it is one sentence.
1. "You are right that it is new code…" — acknowledge before you defend.

## Compared with your previous run

First recorded run for dryrun on lab 04; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
