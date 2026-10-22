## Customer brief

Hi — I'm the CISO at Kadé Commerce. Devin sessions now run for both brands, **Lumen Home** and **Trailhead Supply**, every day, and I have no written answer to the first question my auditors ask: *where can those machines talk to, and who decides?*

Here is what I will sign:

1. **Two destinations, nothing else.** A session may install packages from the public npm registry and call the PayGate **sandbox**. Not production PayGate, not GitHub's API, not random websites, and no MCP servers until we approve one.
2. **Nobody switches it off.** A developer, a team lead or a session choosing "no profile" must not get around it. Teams may be stricter than me; never looser.
3. **Robots are stricter than people.** The webhook-triage automation reads code and reports; it does not push, and it does not create other sessions.
4. **No escape hatch through delegation.** If a session spins up helper sessions, they live under the same rules.
5. **Screen what comes in.** People and PR comments will try to talk Devin into leaking things or skipping review. I want to know when that happens, and to stop the obvious ones.
6. **Tell me when a change lands.** If I tighten the rules at 3 p.m., I need to know which sessions are still on the old rules and for how long.

You have seventy-five minutes. Finish with a three-minute update I can repeat to the audit committee in plain language — I care about the difference between what we *require* and what we merely *suggest*.

## Stakeholders and constraints

- **The CISO** (the coach) signs off. She reads the policy matrix and the resolver output, not your prompts. She will ask what is enforced, by whom, and from when.
- **The platform lead** wants `npm install` to keep working in every session and in snapshot builds, and will push back on anything that slows teams down.
- **The payments lead** needs the PayGate sandbox reachable from sessions and from the webhook-triage automation's investigations only when it needs them.
- **The enterprise admin** is the only person who can save an enterprise-wide profile or change guardrail settings. You may not be that person: if you are not an admin, you work offline and hand the admin a change request.
- **Forbidden:** changes on `main`, editing `packages/contracts/`, binding a draft profile to the whole organization before it has been resolved offline, testing against production PayGate, and putting any token in a profile, a fixture or a commit.
- **Output:** your policy matrix as a JSON world in `~/lab10/`, the resolver output for every target, the probe output from one of your own sessions, a guardrail action table for the three messages, and a one-page change request for the admin. Keep all of it out of commits.
