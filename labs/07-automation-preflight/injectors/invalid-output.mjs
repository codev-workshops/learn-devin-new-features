// Injector: writes both "run" and "items" and corrupts STATE_FILE. The run must fail, save no state, and not retry.
import { writeFileSync } from 'node:fs';

writeFileSync(process.env.STATE_FILE, JSON.stringify({ corrupted: true }));
writeFileSync(process.env.OUTPUT_FILE, JSON.stringify({ run: true, items: [] }));
