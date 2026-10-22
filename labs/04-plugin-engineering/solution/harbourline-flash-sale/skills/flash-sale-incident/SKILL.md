---
name: flash-sale-incident
description: First-hour procedure when an order, stock or payment alert fires during a Harbourline flash sale. Use when the on-call engineer is paged during a sale window.
argument-hint: "<incident-id>"
---

# Flash-sale incident — first hour

1. **Impact first.** From the incident tools (the `harbourline-incidents` MCP), read the incident and its log entries. State who is hurt, how many orders and how much money, in one sentence.
2. **Freeze holds.** Do not push to `main`. Mitigations go on a branch and through the normal gates, or are configuration changes the release owner approves.
3. **Stock.** If the alert is about stock, compare on-hand, reserved and paid orders for the affected SKUs. An oversell means paid orders exceed on-hand.
4. **Payments.** If the alert is about payments, check for duplicate webhook deliveries before refunding anything.
5. **Update.** Every 15 minutes: Outcome → Evidence → Risk → Next action → Ask.
6. **Close.** Call it mitigated only when the metric that paged has stopped moving for 15 minutes.
