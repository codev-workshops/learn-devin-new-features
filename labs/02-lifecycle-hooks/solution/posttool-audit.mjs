#!/usr/bin/env node
// PostToolUse hook for `exec`: append what actually ran (after any rewrite) and whether it succeeded.
import { audit, readStdin } from './lib.mjs';

let event = {};
try {
  event = JSON.parse(readStdin());
} catch {
  audit({ hook: 'PostToolUse', note: 'unparseable input' });
  process.exit(0);
}
const r = event.tool_response ?? {};
audit({ hook: 'PostToolUse', tool: event.tool_name, command: event.tool_input?.command, success: r.success ?? null, error: r.error ?? null });
process.exit(0);
