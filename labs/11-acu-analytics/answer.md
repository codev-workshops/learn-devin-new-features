## Feature fit

There are two independent caps, and each one does a different job. The **organization ACU limit** is set by an enterprise admin per organization and caps the organization's total monthly consumption: cloud sessions run in it, Devin Review billed to it, and Devin Desktop, Windsurf JetBrains and Devin CLI usage of users whose billing organization it is. **Usage policies** cap each member individually: a tier gives each member the same monthly allocation (not a pooled budget), local and cloud usage share one cap, and Devin Review is excluded. A session is blocked if *either* limit is reached, and raising one never lifts the other. Both reset at the start of the contract's monthly billing window — here the 23rd.

Finance's "cap per team" is therefore an organization limit (one organization per brand team already exists), and the tiers are a per-person guardrail inside it. The analytics pages are where you check which number counts what before you put it in front of finance.

## Worked approach

1. Baseline the views: `node labs/11-acu-analytics/tools/acu-sim.mjs --views` → enterprise 8870 ACU; Platform 1770, Lumen 4100, Trailhead 3000 for 23 Oct → 14 Nov.
2. Decision A: `--scenario A` → `RESULT: member=mira org=kade-trailhead blocked by organization limit`. Her meter is 180 of 400; Trailhead is 3000 of 3000.
3. Prove the wrong fix: `--scenario A --override mira=600` → still blocked by organization limit. A per-member override changes only her own meter.
4. Size the fix with the sale: `--scenario A --raise-org kade-trailhead=4000 --inject sale-spike --date 2026-11-20` → 3900 of 4000, allowed. 4000 leaves only 100 ACU of margin; propose 4200 for this window, set by an enterprise admin in Settings → Organizations, and lowered back to 3000 (or a re-sized number) after the 23rd.
5. Decision B: `--scenario B` → `blocked by per-user limit`, 410 of 400 (250 cloud + 160 local; 90 Review not counted). Lumen has 1900 ACU of headroom.
6. Why 400 and not 800: he is in `kade-oncall` (mapped to the 800 On-call tier, priority 1), but an explicit assignment to Brand engineers beats every IdP mapping. Compare `--unassign arjun` (resolves to On-call, 800, permanent until someone reassigns him, and his approval policy becomes Always approve) with `--override arjun=520` (temporary, expires 22 Nov, stays in Brand engineers with manual approval). For a one-month on-call rota the temporary override is the narrow fix; if on-call people should always get 800, remove the stale explicit assignment instead.
7. Injectors: `review-storm` moves only the Lumen organization total (4100 → 4400); `reset-day` shows both meters at 0 and the override gone on 23 Nov; `billing-org-drift` moves Noor's 120 local ACU from Platform to Trailhead; `empty-cycle` prints the billing-cycle message.
8. Write `ACU-DECISION.md` with the ledger, both decisions and the update, then run the drill.

Worked prompts, if you used a Devin session to do the analysis:

```prompt
Read labs/11-acu-analytics/fixtures/kade-consumption.json and the docs pages for organization ACU limits and usage policies. For mira in kade-trailhead and arjun in kade-lumen, tell me which limit blocks each of them today (2026-11-14), using tools/acu-sim.mjs, and quote every RESULT line you rely on. Do not change any real enterprise setting.
```

```prompt
Build a numbers ledger for the finance controller from acu-sim --views (cycle and last-30): value, source view, date range, includes local usage yes/no, includes Devin Review yes/no. Then explain in five sentences why the Enterprise Consumption row for Trailhead and the Trailhead Cloud tab disagree.
```

## Which numbers include local usage

| Number | Local (Desktop, CLI, JetBrains) | Devin Review | Source |
| --- | --- | --- | --- |
| Per-user limit meter (Usage policies → Members, limit warnings) | yes | **no** | Usage policies docs |
| Organization limit consumption | yes, for users whose billing organization it is | yes | Org ACU limits docs |
| Enterprise Consumption (per organization) | yes, attributed to the billing organization | yes (own Review line) | Enterprise billing, Devin Review docs |
| Org Analytics, Newest → Overview | yes (Oct 7: Active users there include free usage) | shown on its own tab | Release notes Oct 7; verify with Figure 11.2 |
| Org Analytics, Newest → Cloud tab and any metric marked "Cloud only" | **no** | no | Observed in the product (Figure 11.3); not in the docs |
| Org Analytics, Newest → Local tab | yes, only local; no organization filter (Oct 7) | no | Release notes Oct 7 |
| My analytics | your own usage across every organization | check your tenant (Figure 11.6) | Personal Analytics docs |

In the simulator, Trailhead's 3000 is the organization total (cloud 2180 + local 400 + Review 420); the Cloud tab shows 2180; Mira's meter shows 180 because her 60 Review ACU are not counted.

## Why the two dashboards disagree

Finance brought Enterprise Settings → Consumption; the Trailhead lead brought Trailhead's own Analytics on the Cloud tab with "Last 30 days". They differ for four reasons, all visible in the fixture:

- **Scope.** Enterprise Consumption sums all three organizations (8870); an organization's analytics shows one (Trailhead 3000).
- **Surface.** The Cloud tab and Cloud-only metrics leave out local usage and Review (2180 of Trailhead's 3000).
- **Attribution.** Local usage counts toward the user's billing organization, which falls back to the first organization they can access. Noor's 120 local ACU sit in Platform, not Trailhead, until an admin assigns her billing organization.
- **Date range.** Since Oct 5, "Last 7 / 30 / 90 days" include today and are rolling; the limit works on the billing window that started on the 23rd. Trailhead's last 30 days are 3210, the window is 3000.

A range that lies entirely before the contract started returns "No billing cycle covers the selected period": cycle-based figures have no window to belong to, which is not the same as zero usage.

## Newest vs Legacy

The official docs do not describe the analytics Version setting. What the product shows (plan §8, to be confirmed with Figures 11.1–11.5): the gear icon next to the date picker on Settings → Analytics has a **Version** setting with **Newest** and **Legacy**. Newest groups the page into Overview, Cloud, Local and More tabs and marks some metrics "Cloud only". The Oct 7 release note lists the metric corrections that a Newest-vs-Legacy comparison may expose: ACUs per merged PR counts merged PRs created in the period, "per session user" counts users who started sessions, previous-period comparisons cover the same number of days, trailing averages are usage-weighted, Overview and Local "Active users" include free usage, and the Review tab's repository usage counts only the period's days. Inference, not verified: Legacy keeps the earlier layout and definitions, so the same date range can show different per-PR and per-user figures. Never mix numbers from the two versions in one update.

## The injectors

- **sale-spike**: without a change Trailhead stays blocked through the sale; with 4000 it ends the 20th at 3900. Say the margin out loud and round up.
- **review-storm**: +300 Review ACU raise Lumen to 4400 and leave Arjun's meter at 410. Review is an organization cost, not a personal one; if Review spend matters, it is managed per organization (and Devin Review has its own spend controls).
- **reset-day**: on 23 Nov both meters read 0 and the temporary override has expired, so Arjun is back to 400 and the raised Trailhead limit is still whatever the admin left it at — changing the limit does not reset usage, and the reset does not restore the old limit.
- **empty-cycle**: spring 2026 is before the 23 April contract start; there is no billing cycle to report.
- **billing-org-drift**: assigning Noor's billing organization moves 120 local ACU to Trailhead (3120), which makes Trailhead's overrun bigger, not smaller.

## "A cap per team" — recommendation

Give finance the team cap they asked for with the organization limits they already have: Platform 2500, Lumen 6000, Trailhead 3000 raised to 4200 for this window because of the sale. Keep tiers as the per-person guardrail and fix the two drifts the lab exposed: the stale explicit assignment that overrides on-call people's tier, and members without a billing organization. Set the Trailhead lead's tier approval policy so Request more works during the sale (Always approve up to a ceiling), because requests are never denied automatically and a blocked engineer during a sale is expensive.

## Pitfalls

- Raising the Trailhead lead's personal limit to fix an organization block.
- Telling finance that a tier is a team budget. It is per member.
- Adding Devin Review to someone's personal usage, or leaving it out of the organization's.
- "Wait for the reset" when the reset is three days after the sale.
- Quoting a Cloud-tab number as "total usage".
- Mixing a rolling 30-day number with a billing-window number in one sentence.
- Mixing Newest and Legacy figures.
- Changing a real limit "to test it".

## Recovery moves

- If two numbers disagree, write both in the ledger with their view and range before you explain the gap.
- If you are unsure which limit blocked someone, run `--check <handle> --org <org>` and read both meter lines; the `RESULT:` line names every limit reached.
- If the coach asks "which dashboard is that from?", name the page and the tab, then the date range.

## Model answers to the objections

**"Trailhead will be blocked mid-sale."** — Acknowledge: a blocked flash-sale release is the expensive outcome, and the lead is right that waiting is not an option. Boundary: Trailhead is blocked by its organization limit, not by anyone's personal tier, and the window resets on the 23rd, three days after the sale. Evidence: Trailhead is at 3,000 of 3,000 today; with the 900-ACU sale forecast, a 4,000 limit ends the 20th at 3,900, so I propose 4,200 for this window. Offer: the enterprise admin raises it today, we review the number on the 23rd, and the tier's Request more path stays open for individuals during the sale.

**"Why do the two dashboards show different totals?"** — Acknowledge: two totals for one team is exactly how budgets lose trust. Boundary: they are both right; they count different things. Evidence: Enterprise Consumption shows all three organizations, 8,870; Trailhead's own Cloud tab shows 2,180 because it leaves out 400 local and 420 Review ACU; its last 30 days are 3,210 against 3,000 for the billing window; and 120 local ACU from one Trailhead engineer sit in Platform until her billing organization is set. Offer: for budget decisions we use one view — the organization total for the billing window — and I attach the ledger that says which number includes local usage and Review.

## Debrief

- Which of the two caps did finance actually ask for, and which one did the Trailhead lead hit?
- What would have happened if the admin had raised every Trailhead member's tier instead of the organization limit?
- Which of your ledger numbers would change if you switched the analytics Version to Legacy, and how would you check?
- Alternatives: one organization per team with a pooled limit (wins when teams want hard budgets), tiers only (wins when the risk is one heavy user, not a team), additional usage requests with Always approve (wins when you want spend visible but never blocking). Cost note: the lab itself is read-only and runs offline; a Devin session doing the analysis is typically well under 2 ACU.

## References

- Devin docs — [Enterprise billing](https://docs.devin.ai/admin/billing/enterprise): tracking consumption, organization ACU limits, what members see at the limit. Fetched 2026-10-22.
- Devin docs — [Organization-level ACU limits](https://docs.devin.ai/admin/billing/org-acu-limits): monthly billing window, independent enforcement, billing organization attribution for local usage. Fetched 2026-10-22.
- Devin docs — [Usage policies](https://docs.devin.ai/enterprise/features/usage-policies): tiers, IdP mappings and priority, tier resolution order, overrides, additional usage requests, Review excluded, reset on the contract day. Fetched 2026-10-22.
- Devin docs — [Personal Analytics](https://docs.devin.ai/enterprise/security-access/personal-analytics) and [Usage](https://docs.devin.ai/admin/billing/usage). Fetched 2026-10-22.
- Devin docs — [Devin Review](https://docs.devin.ai/work-with-devin/devin-review): consumption dashboard and Review usage counting toward the organization limit. Fetched 2026-10-22.
- Devin [release notes 2026](https://docs.devin.ai/release-notes/2026): analytics drilldown paging (Sep 30), date ranges include today (Oct 5), analytics metric corrections and Local tab (Oct 7), resolved counts only include fixed findings (Oct 21).
- Not in the docs: the analytics Version setting (Newest / Legacy), the "Cloud only" marker and the billing-cycle empty state — taken from the product as described in the course plan §8; confirm against Figures 11.1–11.5.
