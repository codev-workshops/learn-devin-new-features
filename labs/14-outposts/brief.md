## Customer brief

> **From:** Oksana Brandt, CISO, Kadé Commerce
> **To:** Platform engineering
> **Subject:** Devin can stay — if it works inside our VPC
>
> Legal signed off on Devin last quarter on one condition I am now enforcing: the PayGate sandbox keys and our repositories do not leave Kadé infrastructure. Today every Devin session clones the repo onto a Devin-hosted machine, and engineers paste sandbox keys into session secrets. That stops on Friday.
>
> I am told Devin has something called Outposts. Show me, by Friday, a worker image we build and own, running in our VPC, that our engineers reach the same way they reach Devin today — web, Slack, and whatever the default is. Two of them, because the payments team and the storefront team will both be on it at 09:00. Tell me what happens when they are both busy, what happens when one dies overnight, and who keeps that image patched.
>
> If you cannot get an Outpost created, I still want the image, the runbook and the evidence. Tell me plainly which parts you saw run and which parts you could only rehearse.

## Stakeholders and constraints

- **Oksana Brandt (CISO)** — the decision maker. Precise about data paths, unimpressed by marketing words; she will challenge you on three points.
- **Platform engineering (you)** — owns `outpost/` and the hosts the workers run on.
- **Payments and storefront teams** — the two daily users; they start sessions from Slack and from the web app and should not have to learn anything new.
- **Constraints**
  - No credential, worker token or PayGate key is ever baked into an image, committed, or pasted into a chat.
  - Workers get outbound HTTPS only; no inbound ports.
  - The repo is baked into the image so a session starts without a network clone.
  - Workers are long-lived, so sessions get no root.
  - Never ask anyone for credentials to finish the lab; if you lack Outpost permission, take the observer path in the credential matrix.
  - Coaching is started by you, manually, when you are ready.
