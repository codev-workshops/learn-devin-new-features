## Customer brief

> "Finance wants a cap per team. Trailhead says they'll be blocked in the middle of the Winter Drop."
> — Harbourline finance controller, Friday budget review

Harbourline runs three Devin organizations under one enterprise: **Harbourline Platform**, **Lumen Home** and **Trailhead Supply**. The contract renews its ACU window every month on the 23rd. Last month the enterprise overspent its plan by a little under ten percent, and finance wants a hard number per brand team before the next window opens. Nobody has been blocked yet, and everyone wants to keep it that way.

This morning (Saturday 14 November 2026) two things happened. Trailhead's engineering lead could not start a Devin session even though her own usage is well under what she was told she has. And a Lumen engineer who is on the on-call rota this month was stopped mid-investigation with a message about his personal limit, while Lumen as a whole has used about two thirds of its budget. Trailhead's Winter Drop sale runs **18–20 November** and needs Devin for flash-sale releases.

To make it worse, the finance controller and the Trailhead lead brought two different dashboards to the meeting and their totals do not match. Finance wants to know which number is "the real one" before signing off on any cap.

`labs/11-acu-analytics/fixtures/harbourline-consumption.json` is a fictional copy of that enterprise: organizations and their limits, usage tiers, IdP group mappings, members, and usage split by surface. `labs/11-acu-analytics/tools/acu-sim.mjs` applies the documented limit rules to it (run it with `--help`).

## Stakeholders and constraints

- **Finance controller** — wants a cap per brand team and one number per sentence. Reads a three-minute update and forwards it.
- **Trailhead Supply engineering lead** — blocked this morning; the sale starts on Wednesday. Will not accept "wait for the reset".
- **Lumen Home on-call engineer** — blocked mid-investigation; expects his on-call role to give him more room.
- **Enterprise admin (Platform)** — the only person who can change organization limits, tiers, mappings and overrides. Will ask what exactly to change and until when.

Constraints:

- No change to a real enterprise during the lab. Every limit change is simulated with `acu-sim.mjs` flags; screenshots of your own tenant are read-only and stay in the git-ignored `figures/tenant/` folder.
- Every number you quote must come from a named view or a simulator line, and you must say whether it includes local (Desktop, CLI) usage and Devin Review.
- No Automations, no scheduled reports: finance gets one update from you, today.
- No real customer or employee data. The members in the fixture are fictional.

### Navigation map (where each number lives)

| You want | Go to | Who can open it | Figure |
| --- | --- | --- | --- |
| Usage per organization across the enterprise | Enterprise Settings → Consumption | Enterprise admins (or the View Consumption permission) | [11.7](figures/fig-11-7.svg) |
| One organization's usage by user and repository | Organization Settings → Analytics → Consumption | Organization admins | [11.2](figures/fig-11-2.svg) |
| Switch the analytics layout | Gear icon next to the date picker → Version: Newest / Legacy | Anyone who can open Analytics | [11.1](figures/fig-11-1.svg), [11.5](figures/fig-11-5.svg) |
| Which metrics leave out local usage | The "Cloud only" marker on Newest metric cards; the Cloud and Local tabs | Anyone who can open Analytics | [11.3](figures/fig-11-3.svg) |
| Why a chart is empty | The billing-cycle empty state for ranges outside any contract window | Anyone who can open Analytics | [11.4](figures/fig-11-4.svg) |
| Your own usage and the Request more button | Settings → Personal → My analytics | Users whose role has View Personal Analytics (off by default) | [11.6](figures/fig-11-6.svg) |
| Organization limits | Enterprise Settings → Organizations → pencil icon (Update name and limits) | Enterprise admins | — |
| Tiers, IdP mappings, overrides, requests, members at risk | Enterprise Settings → Usage policies | Manage ACU limits or billing admin permission | [11.8](figures/fig-11-8.svg) |

Every figure is a placeholder captioned *screenshot pending: replace with your tenant's view* until you or your facilitator capture it (see `figures/README.md`).
