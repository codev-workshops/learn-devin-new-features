## Customer brief

Hi — this is Dana, CTO of **Harbourline**. Two things landed on my desk on the same morning.

First, a **Lumen Home** merchandiser opened an order link a colleague pasted in chat and saw a **Trailhead Supply** customer's order — lines, totals, shipping country. Same database, same API, different brand. I need to know whether that was a one-off or whether any merchandiser can read any brand's orders, and whether there are more holes of the same family. Our payments partner also asked last quarter whether we verify their webhook signatures; I said yes, and I would like that to be true.

Second, the **Lamp Week** flash-sale collection page on Lumen is slow. It is our biggest week; we expect several times our normal ~400 orders a week. The page was fine with ten products and is not fine now.

We just switched on Devin Code Scans. I want you to use it properly — not as "run it and paste the list" but as a lifecycle: pick the right kinds of scan, read the findings like an engineer, get one real fix proposed by Devin, throw out what is noise with a reason, show me the scan staying current after a change, and give our security team an export they can load into their own tooling. Then explain it to me in three minutes with numbers.

## Stakeholders and constraints

- **Dana (CTO)** — sponsor; wants numbers and a yes/no on "are we leaking across brands".
- **Security lead** — owns the existing SAST pipeline and the dashboard it feeds; sceptical of a second tool.
- **Platform team** — will triage whatever you leave open; their time is the scarce resource.
- **Merchandisers (both brands)** — use the `/admin` console daily, one of them with a screen reader.
- **Forbidden:** merging any fix into `main`. Harbourline's known defects stay in place for the course; any fix Devin proposes goes to a throwaway branch or a PR you close unmerged.
- **Forbidden:** creating Automations or schedules for scans in this lab; every scan run is started by you.
- **Budget:** at most three scans plus one Scan-new-commits run; Normal effort unless you can justify Deep.
- **Deliverable:** evidence for each acceptance criterion (finding links or screenshots, the PR link, the export file) collected in a local `labs/05-code-scans/EVIDENCE.md` that you do not commit.
