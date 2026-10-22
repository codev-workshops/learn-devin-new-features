#!/usr/bin/env node
// Live path for lab 07: POST the fixture notifications to your own Automation's webhook URL.
//
//   node labs/07-automation-preflight/tools/send-webhook.mjs [--dry-run] [--only ntf_701,ntf_702] [--gap-ms 500]
//
// Reads HARBOURLINE_LAB07_WEBHOOK_URL and HARBOURLINE_LAB07_WEBHOOK_SECRET from your shell (never commit them).
// The secret travels in the X-Webhook-Secret header. --dry-run prints what would be sent.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const value = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const only = value('--only') ? new Set(value('--only').split(',')) : null;
const gap = Number(value('--gap-ms', '500'));
const events = JSON.parse(readFileSync(path.join(HERE, '..', 'fixtures', 'paygate-notifications.json'), 'utf8')).events.filter(
  (e) => !only || only.has(e.body.notification_id),
);

const url = process.env.HARBOURLINE_LAB07_WEBHOOK_URL;
const secret = process.env.HARBOURLINE_LAB07_WEBHOOK_SECRET;
if (!flag('--dry-run') && (!url || !secret)) {
  console.error('send-webhook: set HARBOURLINE_LAB07_WEBHOOK_URL and HARBOURLINE_LAB07_WEBHOOK_SECRET, or pass --dry-run');
  process.exit(2);
}
for (const e of events) {
  if (flag('--dry-run')) {
    console.log(`DRY-RUN POST <webhook-url> ${e.body.notification_id} ${e.body.type} ${e.body.event_id ?? '-'}`);
    continue;
  }
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-webhook-secret': secret }, body: JSON.stringify(e.body) });
  console.log(`POST ${e.body.notification_id} → ${res.status}`);
  await new Promise((r) => setTimeout(r, gap));
}
