// Injector: a Preflight that waits on a slow dependency for 3 s. Replay it with --timeout 1 to see the event stop.
import { writeFileSync } from 'node:fs';

await new Promise((r) => setTimeout(r, 3000));
writeFileSync(process.env.OUTPUT_FILE, JSON.stringify({ run: true }));
