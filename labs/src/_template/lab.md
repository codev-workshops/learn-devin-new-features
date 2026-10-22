---
# Copy this folder to labs/src/NN-slug/ (NN = two-digit lab number from catalog.yaml).
number: 99
slug: example-slug
title: Short lab title
feature: Devin feature under practice
level: intermediate          # foundation | intermediate | advanced
status: draft                # draft | pilot | ready
durationMinutes: 60
lastVerified: 2026-10-22     # date the feature claims were last checked against the docs
summary: One sentence a learner reads in the catalog.
fallback: What a learner without admin access, integrations or a paid feature does instead.
docs:
  - title: Official page name
    url: https://docs.devin.ai/...
---

## Goal

What the learner can do and explain after this lab. Two or three sentences.

## Prerequisites

- Access, permissions and integrations needed, with the no-admin fallback for each.
- Reset command, for example `npm run db:seed -- --reset`.

## Customer scenario

> The customer's words. A business problem, constraints and artifacts. Never a prompt.

## Acceptance criteria

- Observable outcomes. No commands, no prompts.

## Expected evidence

- Links, logs, screenshots or files the learner must be able to show.

## Guided version

Numbered steps for a first attempt. Point at the docs, not at a copyable prompt.

## Unguided version

The same brief with the scaffolding removed. The learner plans and writes the prompt live.

:::answer A strong first prompt
A model prompt and why it works. Hidden until the learner asks.
:::

## Edge cases and failure injection

- How to trigger each failure, and what the learner should observe.

## Facilitator notes

:::answer Facilitator notes
Timing, common mistakes, what to probe in the debrief.
:::

## Solution rubric

:::answer Rubric
| Criterion | Meets | Exceeds |
| --- | --- | --- |
| ... | ... | ... |
:::

## Articulation exercises

- 60-second framing, think-aloud checkpoints, three-minute customer update and two objections.
