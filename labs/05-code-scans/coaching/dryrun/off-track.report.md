# Articulation gap report — lab 05 code-scans (coach-05-code-scans)

Learner: **dryrun** · mode: dry-run · run 1 · 2026-10-22T11:10:00Z · timing: markers (±5 s) · transcript: `labs/05-code-scans/coaching/dryrun/off-track.md`

## Scores — 22/100

| Dimension | Score | Anchor |
|---|---:|---|
| Accuracy | 8/30 | Scan-type choice and the N+1 shape appear only in passing; the leak, the webhook and the whole lifecycle are missing, and the governance answer is wrong (anchor: 6–10 = one or two points, one inaccuracy). |
| Structure | 6/25 | Feature list instead of a headline; no evidence or next step anywhere (anchor: 5–8 = parts missing). |
| Customer relevance | 4/20 | No yes/no for the CTO and "many, I didn't count" (anchor: 3–5 = no numbers). |
| Brevity and fluency | 3/15 | Twelve fillers, two tag questions, two long pauses; objections far under target (anchor: 2–4). |
| Recovery | 1/10 | Objections dismissed without acknowledgement or evidence (anchor: 0–2). |

## Timing vs target

| Segment | Target | Actual | Delta | Verdict |
|---|---:|---:|---:|---|
| 60-second framing | 60 s | 80 s | +20 s | over |
| Think-aloud checkpoint (T+20) | 45 s | 36 s | -9 s | under |
| Think-aloud checkpoint (T+90) | 45 s | 66 s | +21 s | over |
| Customer update to the CTO | 180 s | 130 s | -50 s | under |
| Objection 1 (technical) — “Our SAST already does this. Why do we need a second scanner?” | 90 s | 26 s | -64 s | under |
| Objection 2 (commercial) — “How many false positives will my platform team have to triage every week?” | 90 s | 16 s | -74 s | under |
| Objection 3 (governance) — “Who approved Devin opening pull requests against our repository?” | 90 s | 26 s | -64 s | under |

## Structure (problem → approach → evidence → next step)

- **Problem** — missing: “so Devin has many scan types, like, twelve of them”
- **Approach** — weak: “Basically we run all of them and see what comes out, no?”
- **Evidence** — missing: “Basically it works”
- **Next step** — missing: “You can just merge them”
- Update order (Outcome → Evidence → Risk → Next action → Ask) held: no

## Fillers and pauses

- Fillers: 12 in 6.3 spoken min (1.9/min) — actually ×2, basically ×3, so yeah ×1, you know ×1, like ×2, um ×3
- Tag questions: 2 (“Basically we run all of them and see what comes out, no? It is very powerful, you know.”, “Actually all of them could go to Devin, right? It can fix everything, basically.”)
- Pauses over 8 s: 14 s at [01:50] in checkpoint-20; 16 s at [05:10] in update

## Missing key points

- [x] Security Swarm for the brand leak and the webhook, a performance scan for the catalog, an accessibility scan for the admin console (5) — “Um, many. I didn't count. Security Swarm for the brand leak and the webhook, a performance scan for the catalog, an accessibility scan for the admin console — those are the ones I picked.”
- [ ] The order detail lookup ignores the caller's brand header, so Lumen staff can read Trailhead orders (5) — missed; belonged in framing
- [ ] The PayGate webhook signature is computed but never compared (4) — missed; belonged in framing
- [x] The Lamp Week collection runs three queries per product, 27 for the eight lamps (4) — “So, the scans ran. Performance said the Lamp Week collection runs three queries per product, 27 for the eight lamps, which is, like, a lot.”
- [ ] One finding assigned to Devin produced a pull request that was closed unmerged (3) — missed; belonged in update
- [ ] One false positive dismissed with a written reason (3) — missed; belonged in update
- [ ] Scan new commits on the unchanged branch found nothing new, as expected (3) — missed; belonged in update
- [ ] Findings exported as SARIF for the existing security dashboard (3) — missed; belonged in update

## Clarity and pronunciation (transcript-based, approximate)

- Misrecognised words: none
- Repeated words: basically (×3)
- Coach asked “did you say…?”: never
- Article/plural slips: "Nobody needs to approve, it is automatic" — inaccurate: a person assigns each finding
- Re-record: “Nobody needs to approve, it is automatic. You can just merge them.”

## Three stems for next time

1. "The risk is… for both brands." — open with what the customer loses, not what the product has.
1. "I will run three scans, not twelve, because…" — choose and justify.
1. "Nothing opens a pull request until a person assigns it" — state the control before you are asked.

## Compared with your previous run

First recorded run for dryrun on lab 05; no previous run to compare with.

_All clarity lines are transcript-based, approximate; timings are ±5 s._
