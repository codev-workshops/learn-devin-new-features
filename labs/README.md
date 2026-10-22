# Kadé Commerce labs

Static, promptless practice labs. Every lab is a folder `labs/NN-slug/` with five source
files; `build.mjs` turns each one into a single self-contained HTML page and generates
`labs/index.html` from the folders present.

```
labs/
  build.mjs                  renderer + build rules (Node ≥ 20, marked only)
  coach-report.schema.json   JSON Schema for articulation gap reports (frozen after W0)
  coach-dryrun.mjs           validates a lab's three dry-run reports
  NN-slug/
    lab.json                 metadata: number, slug, title, duration, credentials, reset, injectors, coach
    brief.md                 "## Customer brief" and "## Stakeholders and constraints"
    criteria.md              observable acceptance criteria
    drill.md                 articulation drill (stems only — never the objections)
    answer.md                worked prompts, pitfalls, model answers, "## Debrief"
    coaching/dryrun/         strong|mediocre|off-track .md transcripts + .report.json/.report.md/.rerun.report.json
```

## Commands

From the repo root (`labs` is an npm workspace) or from `labs/`:

| Command | What it does |
|---|---|
| `npm run labs:build` (root) / `npm run build` (labs) | renders `labs/NN-slug/index.html` for every lab and `labs/index.html` |
| `node labs/build.mjs --check` | runs every rule, writes nothing (use as a lint gate) |
| `npm test` (labs) | Vitest suite for the build rules and the dry-run harness |
| `npm run coach:dryrun -- <nn>` | validates `labs/<nn>-*/coaching/dryrun/` |
| `node labs/coach-dryrun.mjs --render <report.json>` | prints the Markdown form of a report |

Generated pages are git-ignored; open `labs/index.html` straight from `file://`.

## Page template

Eleven sections, always in this order: Header · Customer brief · Stakeholders and
constraints · Starting state and reset · Acceptance criteria · Credential matrix and
fixture fallback · Edge cases and injectors · Articulation drill (voice coach) ·
Show answer · Debrief · References.

`answer.md` (including its `## Debrief`) is emitted only inside
`<template id="answer-template">`, so it is not in the DOM, not searchable and not
printable until the learner presses **Show answer**. The reveal is a plain button
(`aria-expanded`, focus moves to the panel, Escape hides); nothing is persisted, so a
refresh always starts hidden.

## Build rules (the build fails on any of these)

1. A learner-facing file (`lab.json`, `brief.md`, `criteria.md`, `drill.md`) contains a
   fenced block tagged `prompt`. Prompts live in `answer.md` only.
2. A learner-facing file contains, verbatim, a must-mention point or an objection of the
   lab's coach. Sources: the coach skill (`.devin/skills/articulation/NN-slug/SKILL.md`
   or `lab.coach.skill_path`), the dry-run `*.report.json` files and `coaching/must-mention.json`
   if present. Phrases of fewer than three words are ignored.
3. Any source file missing, `lab.json` inconsistent with the folder name (`number`,
   `slug`, `coach.skill = coach-NN-slug`), a non-HTTPS reference, or `brief.md` without
   the two H2 headings.
4. Answer content detected outside the `<template>` in the rendered page.

## Dry-run contract (`coach-dryrun.mjs`)

For lab `nn` it expects, under `coaching/dryrun/`, for each of `strong`, `mediocre`,
`off-track`:

* `<variant>.md` — a transcript with YAML front matter `planted_fillers`,
  `planted_omissions`, `planted_long_pauses`, segments introduced by
  `--- segment: <id> ---` and lines `[mm:ss] COACH:|LEARNER:` (the learner ends a timed
  segment with `Done.`; pauses are `[mm:ss] (pause N s)`).
* `<variant>.report.json` — validates against `coach-report.schema.json`.
* `<variant>.report.md` — the same report rendered (`--render`), must contain the caveat
  `transcript-based, approximate`.
* `<variant>.rerun.report.json` — a second grading of the same transcript.

Checks: every `lab.coach.segments[].id` appears once in `timing`; actual seconds within
±5 s of the transcript markers; delta/verdict consistent; exactly three stems; totals
equal the sum of the five dimensions (30/25/20/15/10); must-mention weights sum to 30;
unmentioned ids equal `planted_omissions`; filler count within ±1 of the plant and the
transcript; every planted long pause reported; rerun drift ≤ 5 per dimension and total;
`strong − mediocre ≥ 15` and `mediocre − off-track ≥ 15`.
