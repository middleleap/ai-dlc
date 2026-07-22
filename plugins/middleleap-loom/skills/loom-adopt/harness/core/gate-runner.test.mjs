// Tests for the gate runner's selection logic. Node built-in runner: `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { select, LANES } from './gate-runner.mjs';

const CAT = { controls: [
  { control_id: 'CORE-1', mechanism_ref: 'scripts/a.mjs', lane: 'pr', always: true },
  { control_id: 'SCOPED-1', mechanism_ref: 'scripts/b.mjs', lane: 'pr', paths: ['docs/governance/changes/', 'profiles/'] },
  { control_id: 'SCOPED-2', mechanism_ref: 'scripts/c.mjs', lane: 'pr', paths: ['docs/governance/model-manifest.json'] },
  { control_id: 'UNSCOPED', mechanism_ref: 'scripts/d.mjs', lane: 'pr' },
  { control_id: 'REL-1', mechanism_ref: 'scripts/e.mjs', lane: 'release' },
  { control_id: 'DOC-ONLY', doc_ref: 'runbook.md', lane: 'pr' },
  { control_id: 'LIB-1', mechanism_ref: 'core/lib.mjs', lane: 'pr', execute: false, execute_note: 'library — enforced via scripts/b.mjs' },
  { control_id: 'CORE-1B', mechanism_ref: 'scripts/a.mjs', lane: 'pr', always: true },
] };

const ids = (r) => r.run.flatMap((g) => g.ids).sort();
const skippedIds = (r) => r.skipped.map((s) => s.id).sort();

test('always-on core runs whatever the diff; out-of-scope controls skip WITH a recorded reason', () => {
  const r = select(CAT, { lane: 'pr', changedPaths: ['README.md'] });
  assert.deepEqual(ids(r), ['CORE-1', 'CORE-1B', 'UNSCOPED']);
  assert.deepEqual(skippedIds(r), ['LIB-1', 'REL-1', 'SCOPED-1', 'SCOPED-2']);
  for (const s of r.skipped) assert.ok(s.reason.length > 0, 'every skip carries a reason');
});

test('a diff touching a scoped path implicates its control', () => {
  const r = select(CAT, { lane: 'pr', changedPaths: ['docs/governance/changes/CHG-1/change-envelope.json'] });
  assert.ok(ids(r).includes('SCOPED-1'));
  assert.ok(!ids(r).includes('SCOPED-2'));
});

test('an UNKNOWN diff fails open: everything in the lane runs', () => {
  const r = select(CAT, { lane: 'pr', changedPaths: null });
  assert.deepEqual(ids(r), ['CORE-1', 'CORE-1B', 'SCOPED-1', 'SCOPED-2', 'UNSCOPED']);
  assert.deepEqual(skippedIds(r), ['LIB-1', 'REL-1']); // only the other lane + the library skip
});

test('lanes separate: a release run skips pr controls (recorded) and runs release ones', () => {
  const r = select(CAT, { lane: 'release', changedPaths: ['README.md'] });
  assert.deepEqual(ids(r), ['REL-1']);
  assert.ok(r.skipped.every((s) => /lane:pr|enforced via/.test(s.reason)));
});

test('a control with no path scope runs by default — declaring a scope is the opt-in', () => {
  const r = select(CAT, { lane: 'pr', changedPaths: ['nothing/relevant.txt'] });
  assert.ok(ids(r).includes('UNSCOPED'));
});

test('two controls sharing one mechanism dedupe into a single execution', () => {
  const r = select(CAT, { lane: 'pr', changedPaths: [] });
  const core = r.run.find((g) => g.mechanism === 'scripts/a.mjs');
  assert.deepEqual(core.ids.sort(), ['CORE-1', 'CORE-1B']);
});

test('documented controls (no runnable mechanism) are neither run nor reported skipped', () => {
  const r = select(CAT, { lane: 'pr', changedPaths: null });
  assert.ok(!ids(r).includes('DOC-ONLY'));
  assert.ok(!skippedIds(r).includes('DOC-ONLY'));
});

test('an execute:false control is skipped with its stated reason, never spawned', () => {
  const r = select(CAT, { lane: 'pr', changedPaths: null });
  assert.ok(!r.run.some((g) => g.mechanism === 'core/lib.mjs'));
  const s = r.skipped.find((x) => x.id === 'LIB-1');
  assert.match(s.reason, /enforced via scripts\/b\.mjs/);
});

test('the lanes are exactly pr, release, scheduled', () => {
  assert.deepEqual(LANES, ['pr', 'release', 'scheduled']);
});
