# Articulation gap report — lab 04 plugin-engineering (coach-04-plugin-engineering)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T10:00:00Z · timing: markers (±5 s) · transcript: `labs/04-plugin-engineering/coaching/dryrun/mediocre.md`

## Scores — 55/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 18/30 | Three of five points; the revision surprise was described without saying a revision replaces the bundle, and the proposal flow was missing. (anchors: 27–30 every point with a file or scope named; 15–20 three of five; under 10 one point) |
| Structure | 14/25 | Framing opened with the manifest before the outcome; the update had no provenance, guarantee or ask headings. (anchors: 22–25 all parts in order; 13–17 parts present but weak; under 8 problem only) |
| Customer relevance | 11/20 | Named the hook and the token location; no brand-team or checklist number. (anchors: 16–20 reviewer's questions answered with files, scopes and counts; 10–13 some; under 6 feature talk) |
| Brevity and fluency | 8/15 | Framing, checkpoint-70 and objection-2 over, update under; six fillers and a 12 s pause. (anchors: 11–15 segments on target, under 1 filler/min; 6–8 two or more segments off; under 4 most segments off) |
| Recovery | 4/10 | Objection 1 called the hook a guarantee (capped at 5); objection 2 had a boundary but no number (capped at 4). (anchors: 7–10 acknowledge → boundary → evidence → offer held with numbers; 4–6 partial; under 3 no pattern) |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 75 s | +15 s | over |
| Think-aloud checkpoint (T+20) | 45 s | 40 s | -5 s | on |
| Think-aloud checkpoint (T+70) | 45 s | 64 s | +19 s | over |
| Three-minute security-reviewer update | 180 s | 150 s | -30 s | under |
| Objection 1 (technical) — “A plugin is one more supply chain to secure. Why should I let it run in every session?” | 90 s | 92 s | +2 s | on |
| Objection 2 (commercial) — “Why not just hand each brand team a playbook and skip the packaging?” | 90 s | 105 s | +15 s | over |

## Structure (problem → approach → evidence → next step)

- **Problem** — weak: “So I started with the manifest, plugin.json”
- **Approach** — present: “The plugin has the release skill and the incident skill, plus the rule, the hook, the subagent and the MCP”
- **Evidence** — weak: “I uploaded the full folder again and it was fine”
- **Next step** — weak: “Basically it's ready for the organization”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 6 in 8.8 spoken min (0.68/min) — actually ×1, basically ×3, so yeah ×1, um ×1
- Tag questions: 1 (“It's easier for everyone in the long run, that's the point, right?”)
- Pauses over 8 s: 12 s at [03:00] in checkpoint-70

## Missing key points

- [x] One plugin ships both procedures as skills together with the freeze rule, the push guard hook, the reviewer subagent and the incident MCP (8) — “The plugin has the release skill and the incident skill, plus the rule, the hook, the subagent and the MCP, all in one plugin”
- [x] Repository installs follow the branch unless pinned to a SHA, uploads stay pinned to what was uploaded, and a skills-only repo needs no manifest (6) — “Repo installs follow the branch unless you pin a SHA, uploads are fixed, and the Lumen repo works without a manifest”
- [ ] A new uploaded revision replaces the whole bundle, so a partial zip removes every file it left out (6) — missed; belonged in checkpoint-70
- [x] The MCP credential is connected after install through a secret reference and never written into the plugin files (5) — “you connect the credential after install, it's not written into the plugin files”
- [ ] Engineers without edit rights can only propose; an admin approves the diff before the shared plugin changes (5) — missed; belonged in objection-1

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: I think (×2)
- Coach asked “did you say…?”: never
- Article/plural slips: "some files were not there" — say how many: "six files were removed"
- Re-record: “So I started with the manifest, plugin.json, and basically the name has to be lowercase…”; “It's easier for everyone in the long run, that's the point, right?”

## Three stems for next time

1. "Every brand team gets…" — first sentence of the framing, before any file name.
1. "A new revision replaces…" — say what the partial zip removed, with the count.
1. "The hook is not a guarantee because…" — name where it runs before the reviewer asks.

## Compared with your previous run

First recorded run for dryrun on lab 04; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
