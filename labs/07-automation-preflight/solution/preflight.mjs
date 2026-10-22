// Reference Preflight script for lab 07: one investigation per real PayGate delivery failure.
// Contract: read EVENT_FILE, read/write STATE_FILE, write exactly one decision to OUTPUT_FILE.
import { readFileSync, writeFileSync } from 'node:fs';

const PERMANENT = new Set(['signature_mismatch', 'schema_invalid', 'unknown_event_type']);
const KEEP_DAYS = 14;
const MAX_SEEN = 500;

const event = JSON.parse(readFileSync(process.env.EVENT_FILE, 'utf8'));
const body = event.body ?? event.payload ?? event;
let state = {};
try {
  state = JSON.parse(readFileSync(process.env.STATE_FILE, 'utf8') || '{}');
} catch {
  state = {};
}
state.seen ??= {};
state.incidents ??= {};

const now = Date.parse(event.received_at ?? body.occurred_at ?? '') || Date.now();
const finish = (decision) => {
  const cutoff = now - KEEP_DAYS * 86400e3;
  const recent = Object.entries(state.seen).filter(([, t]) => t >= cutoff).sort((a, b) => b[1] - a[1]).slice(0, MAX_SEEN);
  state.seen = Object.fromEntries(recent);
  for (const [k, v] of Object.entries(state.incidents)) if (v.last < cutoff) delete state.incidents[k];
  writeFileSync(process.env.STATE_FILE, JSON.stringify(state));
  writeFileSync(process.env.OUTPUT_FILE, JSON.stringify(decision));
};
const skip = (reason) => finish({ items: [], reason });

if (!body?.notification_id || typeof body.type !== 'string') skip('malformed notification: no notification_id or type');
else if (state.seen[body.notification_id]) skip(`notification ${body.notification_id} already seen`);
else {
  state.seen[body.notification_id] = now;
  if (!body.type.startsWith('delivery.')) skip(`not a delivery notification (${body.type})`);
  else if (!body.event_id) skip('malformed delivery notification: no event_id');
  else {
    const key = `${body.event_id}@${body.replay_seq ?? 1}`;
    const incident = (state.incidents[key] ??= { attempts: [], emitted: false, last: now });
    incident.last = now;
    if (body.type === 'delivery.recovered') {
      incident.recovered = true;
      skip(`${key} recovered on attempt ${body.attempt}`);
    } else if (body.type !== 'delivery.failed') skip(`ignored ${body.type}`);
    else {
      incident.attempts.push(body.attempt);
      const final = Number(body.attempt) >= Number(body.max_attempts ?? 3);
      const permanent = PERMANENT.has(body.error_class);
      if (!final && !permanent) skip(`${key} transient (${body.error_class}) attempt ${body.attempt} of ${body.max_attempts}`);
      else if (incident.emitted) skip(`${key} already under investigation`);
      else {
        incident.emitted = true;
        finish({
          items: [
            {
              id: `paygate:${body.event_id}`,
              version: String(body.replay_seq ?? 1),
              title: `PayGate ${body.event_type} ${body.event_id} for ${body.order_number}: ${body.error_class} (HTTP ${body.http_status}) after attempt ${body.attempt}/${body.max_attempts}`,
            },
          ],
          reason: permanent ? 'non-retryable failure' : 'final retry failed',
        });
      }
    }
  }
}
