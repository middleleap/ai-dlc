// Tests for the operational-readiness gate (R1–R6). Node built-in runner: `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, WINDOWS } from './operational-readiness-check.mjs';

const NOW = Date.parse('2026-07-22');
const days = (n) => new Date(NOW - n * 86400000).toISOString().slice(0, 10);

const READY = {
  service_id: 'svc-x',
  criticality: 'critical',
  owner: 'ops-dana',
  on_call: 'rotation-1',
  rto_minutes: 240,
  rpo_minutes: 15,
  bcp_dr: { plan_ref: 'dr.md', last_exercised: days(30) },
  rollback: { procedure_ref: 'rb.md', last_drilled: days(20) },
  kill_switch: { owner: 'ops-dana', last_tested: days(10) },
  capacity: { stress_test_ref: 'stress.md', last_run: days(40) },
  third_parties: [{ name: 'bureau', continuity: 'cache-degrade', exit_strategy: 'secondary contract' }],
  reconciliation: 'daily',
  failed_transaction_recovery: 'replay from audit',
  complaints_readiness: 'scripts published',
  regulatory_notification_triggers: 'outage > 2h',
};

test('a fresh, complete readiness file passes', () => {
  assert.deepEqual(evaluate(READY, NOW), []);
});

test('FRESHNESS — an expired DR exercise, stale rollback drill, or old kill-switch test blocks', () => {
  const staleDr = evaluate({ ...READY, bcp_dr: { ...READY.bcp_dr, last_exercised: days(WINDOWS.bcp_dr + 10) } }, NOW);
  assert.ok(staleDr.some((x) => /BCP\/DR exercise.*STALE/.test(x)));
  const staleRb = evaluate({ ...READY, rollback: { ...READY.rollback, last_drilled: days(WINDOWS.rollback + 1) } }, NOW);
  assert.ok(staleRb.some((x) => /rollback drill.*STALE/.test(x)));
  const staleKs = evaluate({ ...READY, kill_switch: { ...READY.kill_switch, last_tested: days(WINDOWS.kill_switch + 1) } }, NOW);
  assert.ok(staleKs.some((x) => /kill-switch test.*STALE/.test(x)));
});

test('the unadopted template placeholder dates fail — copied is not exercised', () => {
  const f = evaluate({ ...READY, kill_switch: { owner: 'x', last_tested: 'ADOPT: date of your last test' } }, NOW);
  assert.ok(f.some((x) => /not a date \(unadopted template\?\)/.test(x)));
});

test('a missing kill-switch owner, RTO, or on-call is a finding', () => {
  const f = evaluate({ ...READY, kill_switch: { last_tested: days(5) }, rto_minutes: undefined, on_call: '' }, NOW);
  assert.ok(f.some((x) => /kill-switch has no owner/.test(x)));
  assert.ok(f.some((x) => /rto_minutes must be a number/.test(x)));
  assert.ok(f.some((x) => /no on_call/.test(x)));
});

test('a critical service needs third-party continuity AND an exit strategy', () => {
  const f = evaluate({ ...READY, third_parties: [{ name: 'bureau', continuity: 'cache' }] }, NOW);
  assert.ok(f.some((x) => /missing exit_strategy.*without an exit is a trap/.test(x)));
  const std = evaluate({ ...READY, criticality: 'standard', third_parties: undefined }, NOW);
  assert.deepEqual(std, []);
});

test('R6 customer/financial fields are required', () => {
  const f = evaluate({ ...READY, reconciliation: '', complaints_readiness: undefined }, NOW);
  assert.ok(f.some((x) => /no reconciliation/.test(x)));
  assert.ok(f.some((x) => /no complaints_readiness/.test(x)));
});
