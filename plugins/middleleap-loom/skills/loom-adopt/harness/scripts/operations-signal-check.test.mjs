// Tests for the operations → discovery feedback gate. Node built-in runner: `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate } from './operations-signal-check.mjs';

const BASE = { id: 'OPS-1', source: 'pagerduty', type: 'incident', severity: 'medium', summary: 'x', route: 'spec-fix', link: 'PR-1234' };
const one = (over) => ({ signals: [{ ...BASE, ...over }] });

test('a valid, triaged, traceable signal passes', () => {
  assert.deepEqual(evaluate(one()), []);
});

test('an empty operations log is valid (Run may not have started)', () => {
  assert.deepEqual(evaluate({ signals: [] }), []);
});

test('a signal with no route is untriaged — the failure this gate prevents', () => {
  assert.match(evaluate(one({ route: undefined }))[0], /not triaged|fall on the floor/);
});

test('an unknown type is rejected', () => {
  assert.ok(evaluate(one({ type: 'meteor' })).some((x) => /type must be one of/.test(x)));
});

test('a bad severity is rejected', () => {
  assert.ok(evaluate(one({ severity: 'spicy' })).some((x) => /severity must be/.test(x)));
});

test('discovery route needs a linked run unless triaging', () => {
  assert.ok(evaluate(one({ route: 'discovery', link: '', status: 'resolved' })).some((x) => /Run→Discovery edge is broken/.test(x)));
  assert.deepEqual(evaluate(one({ route: 'discovery', link: 'revoke-latency' })), []);
  assert.deepEqual(evaluate(one({ route: 'discovery', link: '', status: 'triaging' })), []);
});

test('register route must cite a DR-* risk', () => {
  assert.ok(evaluate(one({ route: 'register', link: 'something' })).some((x) => /cite a DR-\* risk/.test(x)));
  assert.deepEqual(evaluate(one({ route: 'register', link: 'DR-1' })), []);
});

test('spec-fix route must link a PR / spec-change', () => {
  assert.ok(evaluate(one({ route: 'spec-fix', link: '' })).some((x) => /links no PR/.test(x)));
});

test('accepted (no-op) needs a justification', () => {
  assert.ok(evaluate(one({ route: 'accepted', link: '', justification: '' })).some((x) => /needs a justification/.test(x)));
  assert.deepEqual(evaluate(one({ route: 'accepted', justification: 'within error budget' })), []);
});

test('a high/critical signal needs an evidence_ref', () => {
  assert.ok(evaluate(one({ severity: 'critical', evidence_ref: '' })).some((x) => /needs an evidence_ref/.test(x)));
  assert.deepEqual(evaluate(one({ severity: 'critical', evidence_ref: 'incident/4471.md' })), []);
});

test('a missing signals array is a finding', () => {
  assert.match(evaluate({})[0], /no `signals` array/);
});

test('an empty log is valid before launch — and a finding once anything is in production (1.12)', () => {
  assert.deepEqual(evaluate({ signals: [] }), []);
  assert.deepEqual(evaluate({ signals: [] }, { inProduction: false }), []);
  const f = evaluate({ signals: [] }, { inProduction: true });
  assert.equal(f.length, 1);
  assert.match(f[0], /EMPTY while a governed change is in production/);
});

/* ---- rc.37 · flow-plan Phase 3.3: the two fields that make Run measurable ---- */

test('FLOW — caused_by_change must resolve to a governed change; a ghost id fails', () => {
  const ids = new Set(['CHG-2026-0042']);
  assert.deepEqual(evaluate(one({ caused_by_change: 'CHG-2026-0042' }), { changeIds: ids }), []);
  const f = evaluate(one({ caused_by_change: 'CHG-9999-0001' }), { changeIds: ids });
  assert.ok(f.some((x) => /does not resolve to a governed change/.test(x)), f.join('\n'));
  assert.ok(evaluate(one({ caused_by_change: 42 }), { changeIds: ids }).some((x) => /must be a change_id string/.test(x)));
});

test('FLOW — with no changes tree the attribution is NOT verified, and says so (never a silent pass)', () => {
  const notices = [];
  assert.deepEqual(evaluate(one({ caused_by_change: 'CHG-2026-0042' }), { changeIds: null, notices }), []);
  assert.ok(notices.some((n) => /NOT verified/.test(n)), notices.join('\n'));
});

test('FLOW — resolved_at must parse, and may not precede detection', () => {
  const withDates = (over) => one({ detected: '2026-07-14T00:00:00Z', ...over });
  assert.deepEqual(evaluate(withDates({ resolved_at: '2026-07-14T04:00:00Z' })), []);
  assert.ok(evaluate(withDates({ resolved_at: 'later' })).some((x) => /is not a timestamp/.test(x)));
  assert.ok(evaluate(withDates({ resolved_at: '2026-07-13T00:00:00Z' })).some((x) => /precedes detected/.test(x)));
});

test('FLOW — both fields stay OPTIONAL: a signal without them is unchanged', () => {
  assert.deepEqual(evaluate(one(), { changeIds: new Set() }), []);
});
