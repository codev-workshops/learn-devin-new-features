#!/usr/bin/env node
// PreToolUse hook: reads the event JSON on stdin; exit code 2 blocks the tool call.
// Lab 2 extends this baseline policy.
const BLOCKED = [/\brm\s+-[a-z]*r[a-z]*f\b|\brm\s+-[a-z]*f[a-z]*r\b/i, /\bdrop\s+(table|database)\b/i, /\btruncate\s+table\b/i, /\bgit\s+push\s+(.*\s)?(--force|-f)\b/i, /\bgit\s+reset\s+--hard\b/i];

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (raw += chunk));
process.stdin.on('end', () => {
  let command = '';
  try {
    command = JSON.parse(raw || '{}')?.tool_input?.command ?? '';
  } catch {
    console.error('Policy hook could not parse the event; blocking to fail closed.');
    process.exit(2);
  }
  const rule = BLOCKED.find((pattern) => pattern.test(command));
  if (rule) {
    console.error(`Blocked by policy hook: destructive command matched ${rule}.`);
    process.exit(2);
  }
  process.exit(0);
});
