import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const hook = fileURLToPath(new URL('./block-destructive.mjs', import.meta.url));
const run = (input) => spawnSync(process.execPath, [hook], { input, encoding: 'utf8' }).status;
const event = (command) => JSON.stringify({ tool_name: 'exec', tool_input: { command } });

test('blocks destructive commands with exit code 2', () => {
  for (const command of ['rm -rf /tmp/x', 'rm -fr build', 'psql -c "DROP TABLE users"', 'git push origin main --force', 'git push -f', 'git reset --hard HEAD~1']) {
    assert.equal(run(event(command)), 2, command);
  }
});

test('allows safe commands and fails closed on malformed input', () => {
  for (const command of ['npm test', 'rm build.log', 'git push origin feature/x']) assert.equal(run(event(command)), 0, command);
  assert.equal(run('{not json'), 2);
});
