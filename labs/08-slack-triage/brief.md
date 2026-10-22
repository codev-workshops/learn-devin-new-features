## Customer brief

Hi — I run customer support at Harbourline, for both **Lumen Home** (USD) and **Trailhead Supply** (EUR). Since Tuesday my team has pasted the same complaint into `#harbourline-bugs` again and again: *"customer says she was charged twice and got two order-confirmed emails."* Each agent posts it fresh because nobody can tell whether engineering has seen it. Engineering sees a wall of identical messages, tags the wrong team, and the real answer ends up in a DM that support never reads.

What I need from you:

1. **One answer per problem.** However many times my team reports the same thing, engineering looks at it once, and every later report points at that first conversation.
2. **The answer where we asked.** The diagnosis goes back into the thread where support raised it, in words my team can repeat to a customer, with the team that owns the fix tagged.
3. **Fix the routing once.** When an engineer says "not ours", that should stick. I do not want to see the same wrong team tagged tomorrow.
4. **Quiet by default.** Lunch, thank-yous and chatter in the channel get nothing back. If my team stops reading the channel because a bot talks too much, we are worse off than today.
5. **Safe with what we paste.** My team pastes customer tickets verbatim. Some of them are rude, some are strange. Nothing pasted into the channel should be able to make the bot reach out to the internet or leak anything.

We also have a Microsoft Teams workspace for the warehouse team; tell me whether the same setup would work there. You have ninety minutes. At the end I want a short Slack update I can forward to my managers.

## Stakeholders and constraints

- **Me (support lead)** owns the channel and decides what my team will read. I am not an engineer; I read Slack, not code.
- **Engineering owners** (`@harbourline-api`, `@harbourline-fulfilment`, `@harbourline-web`) fix what is routed to them. One of them will correct a routing mistake in a thread.
- **The platform lead** owns `main`. The planted defects stay in the baseline; any demonstration change goes on a throwaway `lab08/*` branch and is deleted without merging.
- **Forbidden:** posting into any shared Slack or Teams channel (use a test channel only you are in, a DM to yourself, or the offline export), real customer data, credentials in any file, changes on `main`, and changes to `packages/contracts/`.
- **Output:** the responder's setup text (kept out of commits), your scratchpad export, the thread write-backs you would post, and the ≤120-word Slack update. Keep notes out of commits.
