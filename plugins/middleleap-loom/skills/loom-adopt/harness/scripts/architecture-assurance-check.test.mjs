// Tests for the architecture-assurance gate (A1–A5). Node built-in runner: `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluate, SECTIONS } from './architecture-assurance-check.mjs';

import { existsSync } from 'node:fs';

const HARNESS = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// The fixture resolves in BOTH layouts: the bundle and an adopted repo.
const GOOD_PATH = ['change-example/architecture-assurance.json', 'docs/governance/changes/CHG-2026-0042/architecture-assurance.json']
  .map((c) => `${HARNESS}/${c}`).find(existsSync);
const GOOD = JSON.parse(readFileSync(GOOD_PATH, 'utf8'));

test('the shipped worked example passes A1–A5', () => {
  assert.deepEqual(evaluate(GOOD, 'CHG-X'), []);
});

test('a missing artifact blocks when the plan requires A', () => {
  assert.match(evaluate(null, 'CHG-X')[0], /architecture-assurance\.json missing/);
});

test('each missing or incomplete section is its own finding', () => {
  const { 'A3-operational-resilience': _, ...rest } = GOOD;
  const f = evaluate(rest, 'CHG-X');
  assert.ok(f.some((x) => /A3-operational-resilience: section missing/.test(x)));
  const stale = { ...GOOD, 'A4-model-risk': { ...GOOD['A4-model-risk'], status: 'draft' } };
  assert.ok(evaluate(stale, 'CHG-X').some((x) => /A4-model-risk: status is "draft"/.test(x)));
});

test('TRACEABILITY — a threat without a control or a test fails', () => {
  const a2 = { ...GOOD['A2-security-threat-model'], threats: [{ threat: 'evidence forgery', control: '', test: '' }] };
  const f = evaluate({ ...GOOD, 'A2-security-threat-model': a2 }, 'CHG-X');
  assert.ok(f.some((x) => /no control/.test(x)));
  assert.ok(f.some((x) => /no test/.test(x)));
});

test('an empty threat list is not a threat model', () => {
  const a2 = { ...GOOD['A2-security-threat-model'], threats: [] };
  assert.ok(evaluate({ ...GOOD, 'A2-security-threat-model': a2 }, 'CHG-X').some((x) => /name them/.test(x)));
});

test('a material OPEN finding blocks backlog creation; accepted or minor does not', () => {
  const open = { ...GOOD, findings: [{ id: 'AF-9', materiality: 'material', status: 'open' }] };
  assert.ok(evaluate(open, 'CHG-X').some((x) => /material finding AF-9 is OPEN/.test(x)));
  const accepted = { ...GOOD, findings: [{ id: 'AF-9', materiality: 'material', status: 'accepted' }] };
  assert.deepEqual(evaluate(accepted, 'CHG-X'), []);
});

test('the section set is exactly A1–A5', () => {
  assert.equal(SECTIONS.length, 5);
  assert.ok(SECTIONS.every((s) => /^A[1-5]-/.test(s)));
});
