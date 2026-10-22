import test from 'node:test';
import assert from 'node:assert/strict';
import { staleFiles } from './build.mjs';

test('committed lab pages match their sources', () => {
  assert.deepEqual(staleFiles(), []);
});
