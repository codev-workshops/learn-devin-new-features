// Injector: a stateless script that emits one item per failed notification, keyed by notification_id.
// Every retry becomes its own investigation — the behaviour the customer is complaining about.
import { readFileSync, writeFileSync } from 'node:fs';

const event = JSON.parse(readFileSync(process.env.EVENT_FILE, 'utf8'));
const body = event.body ?? event;
const items = body.type === 'delivery.failed' ? [{ id: body.notification_id, title: `PayGate failure ${body.event_id ?? '?'}` }] : [];
writeFileSync(process.env.OUTPUT_FILE, JSON.stringify({ items }));
