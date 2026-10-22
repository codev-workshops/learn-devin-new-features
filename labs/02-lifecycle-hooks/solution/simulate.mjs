#!/usr/bin/env node
// Offline replay of Devin CLI lifecycle hooks: feeds one event to the hooks in a hooks.v1.json
// exactly as the docs describe (stdin JSON, exit 0/2/other, decision, updatedInput, timeout)
// and prints what the agent would see. Fixture path for learners without the Devin CLI.
//
//   node labs/02-lifecycle-hooks/solution/simulate.mjs --config .devin/hooks.v1.json \
//        --event PreToolUse --tool exec --command 'pnpm db:seed -- --reset'
//
// Two behaviours the docs do not state are ASSUMED and labelled in the output:
// a config that does not parse loads no hooks (fail-open), and a hook that exceeds its
// timeout is killed and treated like a non-blocking error.
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(HERE, '..', '..', '..');
const TOOL_EVENTS = new Set(['PreToolUse', 'PostToolUse', 'PermissionRequest']);

export function loadConfig(file) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch (err) {
    return { hooks: {}, notes: [`config not readable (${err.code}): no hooks loaded`] };
  }
  try {
    return { hooks: JSON.parse(text), notes: [] };
  } catch (err) {
    return { hooks: {}, malformed: true, notes: [`config is not valid JSON (${err.message}): no hooks loaded — fail-open (ASSUMED; check with /hooks)`] };
  }
}

export function matcherMatches(matcher, toolName, notes = []) {
  if (matcher == null || matcher === '') return true;
  const list = Array.isArray(matcher) ? matcher : [matcher];
  return list.some((m) => {
    if (m === '') return true;
    try {
      return new RegExp(m).test(toolName ?? '');
    } catch (err) {
      notes.push(`matcher ${JSON.stringify(m)} is not a valid regex (${err.message}): it matches nothing`);
      return false;
    }
  });
}

function runCommand(command, stdin, timeoutSeconds, env) {
  return new Promise((resolve) => {
    const child = spawn('bash', ['-c', command], { env, stdio: ['pipe', 'pipe', 'pipe'], detached: true });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        process.kill(-child.pid, 'SIGKILL');
      } catch {
        child.kill('SIGKILL');
      }
    }, timeoutSeconds * 1000);
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr, timedOut });
    });
    child.stdin.on('error', () => {});
    child.stdin.end(stdin);
  });
}

export async function simulate({ config, event, toolName, toolInput = {}, extra = {}, projectDir = REPO_ROOT, env = {} }) {
  const { hooks, notes, malformed } = typeof config === 'string' ? loadConfig(config) : { hooks: config, notes: [] };
  const payload = { hook_event_name: event, session_id: 'simulated-session', prompt_id: 'simulated-prompt', ...extra };
  if (TOOL_EVENTS.has(event)) Object.assign(payload, { tool_name: toolName, tool_input: toolInput });
  const result = { event, tool_name: toolName, outcome: 'allow', input: { ...toolInput }, hooks_run: [], notes: [...notes], malformed: !!malformed };
  const groups = Array.isArray(hooks?.[event]) ? hooks[event] : [];
  for (const group of groups) {
    if (TOOL_EVENTS.has(event) && !matcherMatches(group.matcher, toolName, result.notes)) continue;
    for (const hook of group.hooks ?? []) {
      if (hook.type !== 'command') {
        result.notes.push(`hook type ${hook.type} not simulated`);
        continue;
      }
      payload.tool_input = result.input;
      const timeout = Number(hook.timeout) > 0 ? Number(hook.timeout) : 60;
      const r = await runCommand(hook.command, JSON.stringify(payload), timeout, { ...process.env, DEVIN_PROJECT_DIR: projectDir, ...env });
      const run = { command: hook.command, exit: r.code, timed_out: r.timedOut, stderr: r.stderr.trim() };
      result.hooks_run.push(run);
      if (r.timedOut) {
        result.notes.push(`hook exceeded its ${timeout}s timeout and was killed: treated as a non-blocking error (ASSUMED; the docs do not state timeout behaviour)`);
        if (result.outcome === 'allow') result.outcome = 'timeout';
        continue;
      }
      let out = null;
      try {
        out = r.stdout.trim() ? JSON.parse(r.stdout.trim().split('\n').at(-1)) : null;
      } catch {
        out = null;
      }
      if (r.code === 2 || out?.decision === 'block') {
        result.outcome = 'block';
        result.reason = out?.reason ?? r.stderr.trim();
        return result;
      }
      if (r.code !== 0) {
        result.notes.push(`hook exited ${r.code}: logged as an error, does not block`);
        if (result.outcome === 'allow') result.outcome = 'error';
        continue;
      }
      const updated = out?.hookSpecificOutput?.updatedInput;
      if (event === 'PreToolUse' && updated && typeof updated === 'object') {
        result.input = { ...result.input, ...updated };
        result.outcome = 'rewrite';
      }
      if (out?.hookSpecificOutput?.additionalContext) result.additional_context = out.hookSpecificOutput.additionalContext;
    }
  }
  return result;
}

function parseArgs(argv) {
  const o = { event: 'PreToolUse', tool: 'exec', config: path.join(REPO_ROOT, '.devin', 'hooks.v1.json') };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--config') o.config = path.resolve(argv[++i]);
    else if (a === '--event') o.event = argv[++i];
    else if (a === '--tool') o.tool = argv[++i];
    else if (a === '--command') o.command = argv[++i];
    else if (a === '--input') o.input = JSON.parse(argv[++i]);
    else if (a === '--stop-hook-active') o.stopActive = true;
  }
  return o;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const o = parseArgs(process.argv.slice(2));
  const toolInput = o.input ?? (o.command != null ? { command: o.command } : {});
  const extra = o.event === 'Stop' ? { stop_hook_active: !!o.stopActive } : {};
  simulate({ config: o.config, event: o.event, toolName: o.tool, toolInput, extra }).then((r) => {
    console.log(JSON.stringify(r, null, 2));
    process.exit(r.outcome === 'block' ? 2 : 0);
  });
}
