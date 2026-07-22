// Tests for the Q1b test-integrity gate. Node built-in runner: `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, TEST_FILE } from './test-integrity-check.mjs';

const M = (o) => new Map(Object.entries(o));
const T = 'src/thing.test.mjs';

test('unchanged tests pass', () => {
  const files = M({ [T]: "test('a', () => { assert.equal(1, 1); assert.ok(true); });" });
  assert.deepEqual(evaluate(files, files), []);
});

test('adding tests and assertions passes', () => {
  const base = M({ [T]: 'assert.equal(1, 1);' });
  const head = M({ [T]: 'assert.equal(1, 1); assert.ok(x); expect(y).toBe(2);', 'src/new.test.mjs': 'assert.ok(z);' });
  assert.deepEqual(evaluate(base, head), []);
});

test('a deleted test file is a finding', () => {
  const findings = evaluate(M({ [T]: 'assert.ok(1);' }), M({}));
  assert.equal(findings.length, 1);
  assert.match(findings[0], /deleted/);
});

test('net assertion loss is a finding', () => {
  const base = M({ [T]: 'assert.equal(a, b); assert.ok(c); expect(d).toBe(e);' });
  const head = M({ [T]: 'assert.equal(a, b);' });
  const findings = evaluate(base, head);
  assert.equal(findings.length, 1);
  assert.match(findings[0], /net assertion loss \(-2\)/);
});

test('an added .skip / .only marker is a finding', () => {
  const base = M({ [T]: "test('a', () => assert.ok(1));" });
  const head = M({ [T]: "test.skip('a', () => assert.ok(1));" });
  const findings = evaluate(base, head);
  assert.equal(findings.length, 1);
  assert.match(findings[0], /marker/);
});

test('a newly commented-out assertion is a finding, even when counts hide it', () => {
  const base = M({ [T]: 'assert.ok(a);\nassert.ok(b);' });
  const head = M({ [T]: 'assert.ok(a);\n// assert.ok(b);\nassert.ok(a);' }); // net count unchanged
  const findings = evaluate(base, head);
  assert.equal(findings.length, 1);
  assert.match(findings[0], /commented out/);
});

test('non-test files are outside the surface; test-file shapes are recognised', () => {
  assert.equal(TEST_FILE.test('src/app.mjs'), false);
  assert.equal(TEST_FILE.test('src/app.test.mjs'), true);
  assert.equal(TEST_FILE.test('pkg/foo_spec.js'), true);
  assert.equal(TEST_FILE.test('tests/integration.py'), true);
});
