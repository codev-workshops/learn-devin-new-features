# Lab 11 figures

Eight placeholder figures for the analytics clinic. Each SVG is labelled **screenshot pending: replace with your tenant's view**. The official docs do not describe the analytics Version setting, so these figures are the part of the lab that depends on what your tenant actually shows.

| Figure | File | Where to capture it | What it must show |
| --- | --- | --- | --- |
| 11.1 | `fig-11-1.svg` | Organization Settings → Analytics, gear icon next to the date picker | The Version setting with Newest and Legacy |
| 11.2 | `fig-11-2.svg` | Analytics with Version = Newest | The Overview, Cloud, Local and More tabs |
| 11.3 | `fig-11-3.svg` | Any Newest tab | One metric marked "Cloud only" |
| 11.4 | `fig-11-4.svg` | Analytics with a date range before your contract started | The empty state "No billing cycle covers the selected period" |
| 11.5 | `fig-11-5.svg` | Analytics with Version = Legacy | The same date range as 11.2, for comparison |
| 11.6 | `fig-11-6.svg` | Settings → Personal → My analytics | Your own consumption and the Request more button (only if your role has View Personal Analytics) |
| 11.7 | `fig-11-7.svg` | Enterprise Settings → Consumption | Consumption broken down by organization (enterprise admins only) |
| 11.8 | `fig-11-8.svg` | Enterprise Settings → Usage policies → Members | Usage, limit, tier and limit source per member (admins only) |

How to replace one: save your PNG as `figures/tenant/fig-11-N.png` (the folder is git-ignored so tenant data never reaches the repo), crop out names and emails, and refer to it from your `ACU-DECISION.md`. Facilitators who want to ship real figures with the course replace the SVG in a separate PR after redacting every name, organization and number that is not fictional.
