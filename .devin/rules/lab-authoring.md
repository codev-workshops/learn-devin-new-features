---
description: Authoring and editing lab pages under labs/
trigger: glob
globs: labs/**
---

- Edit `labs/src/NN-slug/lab.md`, never `labs/*.html`. Run `npm run labs:build`, then `npm run labs:test`.
- Required sections, in order: Goal, Prerequisites, Customer scenario, Acceptance criteria, Expected evidence, Guided version, Unguided version, Edge cases and failure injection, Facilitator notes, Solution rubric, Articulation exercises.
- The customer scenario is the customer's words, not a prompt. Model prompts go inside `:::answer` blocks.
- Every lab needs a no-admin fallback in front matter and at least one failure-injection exercise.
- No raw HTML in markdown; the builder rejects it.
