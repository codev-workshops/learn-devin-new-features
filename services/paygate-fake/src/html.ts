import type { CheckoutSession } from "./sessions.js";

const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );

/** The hosted checkout page a shopper is redirected to. Two buttons, no JavaScript needed. */
export function checkoutPage(session: CheckoutSession, knobs: object): string {
  const symbol = session.currency === "EUR" ? "€" : "$";
  const done = session.status !== "pending";
  const back = session.returnUrl
    ? `<p><a href="${esc(session.returnUrl)}">Return to ${esc(session.brand)}</a></p>`
    : "";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>PayGate · ${esc(session.brand)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
 body{font:16px/1.5 system-ui,sans-serif;max-width:32rem;margin:3rem auto;padding:0 1rem;color:#1b1b1f}
 .card{border:1px solid #d9d9e3;border-radius:12px;padding:1.5rem}
 .amount{font-size:2rem;font-weight:600}
 button{font:inherit;padding:.6rem 1.2rem;border-radius:8px;border:1px solid #333;cursor:pointer;margin-right:.5rem}
 .pay{background:#1b5e20;color:#fff;border-color:#1b5e20}
 .meta{color:#666;font-size:.9rem}
 .badge{display:inline-block;padding:.1rem .5rem;border-radius:999px;background:#eee}
</style></head><body>
<p class="meta">PayGate (fake) hosted checkout · session <code>${esc(session.id)}</code></p>
<div class="card">
 <p>${esc(session.brand)} · order <code>${esc(session.orderId)}</code></p>
 <p class="amount">${symbol}${esc(session.amount)} <span class="meta">${esc(session.currency)}</span></p>
 <p>Status: <span class="badge">${esc(session.status)}</span></p>
 ${
   done
     ? back
     : `<form method="post" action="/checkout/${esc(session.id)}/complete">
   <button class="pay" name="outcome" value="succeeded" type="submit">Pay ${symbol}${esc(session.amount)}</button>
   <button name="outcome" value="failed" type="submit">Decline</button>
 </form>`
 }
</div>
<p class="meta">Delivery knobs: ${esc(JSON.stringify(knobs))}. Expires ${esc(session.expiresAt)}.</p>
</body></html>`;
}
