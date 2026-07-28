// Tests for the change-envelope gate. Node built-in runner: `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkStateHistory, evaluate, STATES, stateHistoryRequired } from './change-envelope-check.mjs';
import { compile, resolveBindings } from '../core/policy-compiler.mjs';

import { existsSync } from 'node:fs';

const HARNESS = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Fixtures resolve in BOTH layouts: the bundle (change-example/, governance/) and an
// adopted repo (docs/governance/changes/CHG-2026-0042/, docs/governance/).
const J = (...candidates) => {
  const p = candidates.map((c) => `${HARNESS}/${c}`).find(existsSync);
  if (!p) throw new Error(`fixture not found: ${candidates.join(' | ')}`);
  return JSON.parse(readFileSync(p, 'utf8'));
};
const EX = (f) => J(`change-example/${f}`, `docs/governance/changes/CHG-2026-0042/${f}`);
// In a BARE adoption the worked-example change is in neither layout; skip cleanly rather than
// throw at module load. The pure evaluate() logic still runs wherever the example is mounted.
const EXAMPLE_PRESENT = ['change-example/control-plan.json', 'docs/governance/changes/CHG-2026-0042/control-plan.json']
  .some((c) => existsSync(`${HARNESS}/${c}`));
if (!EXAMPLE_PRESENT) {
  test('change-envelope gate (worked-example change is bundle-only — skipped in an adopted layout)', { skip: true }, () => {});
} else {
const ENVELOPE = EX('change-envelope.json');
const PLAN = EX('control-plan.json');
const PASSPORT = EX('product-passport.json');
const REGISTRY = J('governance/identities.template.json', 'docs/governance/identities.json');
const PROFILES = [J('profiles/regulated-bank.json'), J('profiles/jurisdictions/uae-bank.json'), J('profiles/products/lending.json')];
// rc.8 WS4: the stored plan is bound to exact profile content, so a fresh compile must resolve
// the same bindings to reconcile. HARNESS is the harness root in both layouts, so profiles/… resolves.
const BINDINGS = resolveBindings(ENVELOPE.required_profiles, HARNESS).bindings;
const fresh = (env = ENVELOPE) => compile(env, PROFILES, BINDINGS).plan;

const ok = (over = {}, ctx = {}) => evaluate({ ...ENVELOPE, ...over }, {
  plan: PLAN, passport: PASSPORT, architectureExists: true, registry: REGISTRY, freshPlan: fresh(), ...ctx,
});

// rc.37 — moving a change's state means RECORDING the transition: the history's last entry is
// current_state, so a test that advances the state advances the record with it (exactly what an
// envelope author now has to do).
const advance = (state, at = '2026-07-30T10:00:00Z', by = 'po-fatima') => ({
  current_state: state,
  state_history: [...ENVELOPE.state_history, { state, at, by }],
});

test('the shipped worked example passes end to end', () => {
  assert.deepEqual(ok(), []);
});

test('TERMINAL — a closed change is valid without plan reconciliation or receipts, but keeps its classifier (rc.34)', () => {
  // A closed change's profiles may have moved on; it must not go red because a profile did,
  // and it must not demand PA receipts for work it abandoned. It contributes nothing to the
  // compiled-requirements aggregate (asserted in core/compiled-requirements.test.mjs).
  const closed = evaluate({ ...ENVELOPE, ...advance('closed') }, { plan: null, freshPlan: null, passport: null, architectureExists: false });
  assert.deepEqual(closed, [], `a closed change must not be re-litigated:\n${closed.join('\n')}`);
  const superseded = evaluate({ ...ENVELOPE, ...advance('superseded') }, {});
  assert.deepEqual(superseded, []);
  // The record of who judged it survives its closure.
  const anonymous = evaluate({ ...ENVELOPE, ...advance('closed'), classification: {} }, {});
  assert.equal(anonymous.length, 1);
  assert.match(anonymous[0], /classified_by/);
});

test('RECONCILIATION — a hand-edited plan fails even when it keeps its old hash', () => {
  // PA1 edited out, plan_hash left untouched: content no longer matches its own hash.
  const doctored = { ...PLAN, required_gates: PLAN.required_gates.filter((g) => g !== 'PA1') };
  const f = ok({}, { plan: doctored });
  assert.ok(f.some((x) => /does not match its own plan_hash/.test(x)));
});

test('RECONCILIATION — a stale stored plan (hash differs from fresh compile) fails', () => {
  const f = evaluate({ ...ENVELOPE, flags: { ...ENVELOPE.flags, islamic: true } }, {
    plan: PLAN, passport: PASSPORT, architectureExists: true, registry: REGISTRY,
    freshPlan: compile({ ...ENVELOPE, flags: { ...ENVELOPE.flags, islamic: true } }, PROFILES, BINDINGS).plan,
  });
  assert.ok(f.some((x) => /does not reconcile with a fresh compile/.test(x)));
});

test('EXIT CRITERION — a high-risk change cannot be past permission-to-develop without PA1', () => {
  const noPa1 = { ...PASSPORT, pa1: { decision: 'pending' } };
  const f = ok({}, { passport: noPa1 });
  assert.ok(f.some((x) => /requires PA1 approved/.test(x)));
});

test('permission-to-launch without PA2 fails', () => {
  const f = ok({ current_state: 'permission-to-launch' });
  assert.ok(f.some((x) => /requires PA2 approved/.test(x)));
});

test('in-delivery without architecture assurance fails when the plan requires A', () => {
  const f = ok({}, { architectureExists: false });
  assert.ok(f.some((x) => /architecture-assurance\.json is missing/.test(x)));
});

test('an AGENT cannot be the classifier; nor can a role-less human', () => {
  const agent = ok({ classification: { ...ENVELOPE.classification, classified_by: 'agent-loom-delivery' } });
  assert.ok(agent.some((x) => /is an AGENT — the agent cannot set or lower the risk tier/.test(x)));
  const engineer = ok({ classification: { ...ENVELOPE.classification, classified_by: 'eng-omar' } });
  assert.ok(engineer.some((x) => /holds none of the classification roles/.test(x)));
});

/* ---- 1.12: compound production authorization ---- */

// This gate sequences on pa2.decision; the full approval/section validation is the
// product-approval gate's job (tested there).
const PA2_OK = { ...PASSPORT, pa2: { decision: 'approved' } };
const READY = { missing: [], findings: [] };
const HOLD_RELEASED = { change_id: 'CHG-2026-0042', status: 'released', by: 'risk-lena', at: '2026-07-21' };
const EVIDENCE_OK = { anchor: 'abc123', attestationFindings: [] };
const prod = (ctx = {}) => ok(advance('production-authorized'), {
  passport: PA2_OK, readiness: READY, hold: HOLD_RELEASED, evidence: EVIDENCE_OK, ...ctx,
});

test('the full compound authorization passes: PA2 + readiness + hold released + anchored evidence', () => {
  assert.deepEqual(prod(), []);
});

test('FAIL CLOSED — a missing release hold means held', () => {
  assert.ok(prod({ hold: null }).some((x) => /missing hold means HELD/.test(x)));
});

test('a held release blocks; a hold released by a builder or an agent does not count', () => {
  assert.ok(prod({ hold: { ...HOLD_RELEASED, status: 'held' } }).some((x) => /release hold is "held"/.test(x)));
  assert.ok(prod({ hold: { ...HOLD_RELEASED, by: 'eng-omar' } }).some((x) => /only by a second-line HUMAN/.test(x)));
  assert.ok(prod({ hold: { ...HOLD_RELEASED, by: 'agent-loom-delivery' } }).some((x) => /only by a second-line HUMAN/.test(x)));
});

test('a high-tier authorization requires anchored, issuer-verified evidence', () => {
  assert.ok(prod({ evidence: { anchor: null } }).some((x) => /no anchor/.test(x)));
  const badSig = prod({ evidence: { anchor: 'abc', attestationFindings: ['attestation signature does NOT verify'] } });
  assert.ok(badSig.some((x) => /does NOT verify/.test(x)));
});

test('unready services block: missing readiness file or R-gate findings', () => {
  assert.ok(prod({ readiness: { missing: ['credit-origination'], findings: [] } })
    .some((x) => /requires operational readiness for service credit-origination/.test(x)));
  assert.ok(prod({ readiness: { missing: [], findings: ['credit-origination: kill-switch test: STALE'] } })
    .some((x) => /kill-switch test: STALE/.test(x)));
});

test('an exemption must be owned, reasoned, compensated, expiring, and second-line approved', () => {
  const bare = ok({ exemptions: [{ control: 'Q2-SAST' }] });
  for (const field of ['owner', 'rationale', 'compensating_control', 'expires', 'approved_by']) {
    assert.ok(bare.some((x) => new RegExp(`missing ${field}`).test(x)), `expected missing ${field}`);
  }
  const expired = ok({ exemptions: [{ control: 'Q2-SAST', owner: 'po-fatima', rationale: 'r', compensating_control: 'c', expires: '2020-01-01', approved_by: 'risk-lena' }] });
  assert.ok(expired.some((x) => /EXPIRED/.test(x)));
  const builderApproved = ok({ exemptions: [{ control: 'Q2-SAST', owner: 'po-fatima', rationale: 'r', compensating_control: 'c', expires: '2999-01-01', approved_by: 'eng-omar' }] });
  assert.ok(builderApproved.some((x) => /not a second-line identity/.test(x)));
});

test('an unknown state is rejected; the state enum matches the plan', () => {
  assert.ok(ok({ current_state: 'shipped' }).some((x) => /current_state must be one of/.test(x)));
  assert.equal(STATES[0], 'classified');
  assert.equal(STATES[STATES.length - 1], 'in-production');
});

/* ---- rc.37 · flow-plan Phase 3.1: state_history, the append-only transition record ---- */

const H = ENVELOPE.state_history;

test('STATE-HISTORY — the shipped worked example carries a well-formed history', () => {
  assert.ok(Array.isArray(H) && H.length >= 3, 'the worked example must demonstrate the field');
  assert.deepEqual(checkStateHistory(ENVELOPE, { registry: REGISTRY }), []);
  assert.equal(H[H.length - 1].state, ENVELOPE.current_state);
});

test('STATE-HISTORY — it must advance in the STATES order; a backwards or repeated state fails', () => {
  const back = checkStateHistory({ ...ENVELOPE, ...advance('classified') }, {});
  assert.ok(back.some((x) => /does not advance the lifecycle/.test(x)), back.join('\n'));
  const repeat = checkStateHistory({ ...ENVELOPE, ...advance('in-delivery') }, {});
  assert.ok(repeat.some((x) => /does not advance the lifecycle/.test(x)));
});

test('STATE-HISTORY — APPEND-ONLY: a timestamp earlier than its predecessor fails', () => {
  const f = checkStateHistory({ ...ENVELOPE, ...advance('delivery-complete', '2026-07-19T00:00:00Z') }, {});
  assert.ok(f.some((x) => /APPEND-ONLY/.test(x)), f.join('\n'));
});

test('STATE-HISTORY — nothing follows a terminal state; closure is not a pause', () => {
  const resumed = {
    current_state: 'in-production',
    state_history: [...H, { state: 'closed', at: '2026-08-01T00:00:00Z' }, { state: 'in-production', at: '2026-08-09T00:00:00Z' }],
  };
  const f = checkStateHistory({ ...ENVELOPE, ...resumed }, {});
  assert.ok(f.some((x) => /recorded after the terminal state closed/.test(x)), f.join('\n'));
});

test('STATE-HISTORY — the history may not be a parallel account: the last entry IS current_state', () => {
  const f = checkStateHistory({ ...ENVELOPE, current_state: 'in-production' }, {});
  assert.ok(f.some((x) => /not a parallel account/.test(x)));
});

test('STATE-HISTORY — an undated transition, an unknown state, and an unresolvable actor all fail', () => {
  const undated = checkStateHistory({ ...ENVELOPE, state_history: [{ state: 'classified', at: 'soon' }], current_state: 'classified' }, {});
  assert.ok(undated.some((x) => /is not an ISO-8601 timestamp/.test(x)));
  const unknown = checkStateHistory({ ...ENVELOPE, state_history: [{ state: 'vibing', at: '2026-07-18T00:00:00Z' }], current_state: 'in-delivery' }, {});
  assert.ok(unknown.some((x) => /is not one of/.test(x)));
  const ghost = checkStateHistory({ ...ENVELOPE, state_history: [...H.slice(0, 2), { ...H[2], by: 'nobody-here' }] }, { registry: REGISTRY });
  assert.ok(ghost.some((x) => /is not in the identity registry/.test(x)), ghost.join('\n'));
});

test('STATE-HISTORY — it must begin where every governed change begins', () => {
  const f = checkStateHistory({ ...ENVELOPE, state_history: H.slice(1) }, {});
  assert.ok(f.some((x) => /begins at "permission-to-develop"/.test(x)), f.join('\n'));
});

test('STATE-HISTORY — REQUIRED at high/critical from the cutover, OPTIONAL before it (no retroactive red)', () => {
  const { state_history, ...noHistory } = ENVELOPE;
  // Classified before the cutover: grandfathered — a NOTICE, never a finding.
  const notices = [];
  assert.deepEqual(checkStateHistory(noHistory, { notices }), []);
  assert.ok(notices.some((n) => /grandfathered/.test(n)), 'a grandfathered high-tier change must be said out loud');
  assert.equal(stateHistoryRequired(noHistory), false);
  // Classified on or after it: required.
  const fresh = { ...noHistory, classification: { ...ENVELOPE.classification, classified_at: '2026-08-01' } };
  assert.equal(stateHistoryRequired(fresh), true);
  assert.ok(checkStateHistory(fresh, {}).some((x) => /requires state_history/.test(x)));
  // A low-tier change is never required to carry one, whenever it was classified.
  assert.equal(stateHistoryRequired({ ...fresh, risk_tier: 'low' }), false);
  assert.deepEqual(checkStateHistory({ ...fresh, risk_tier: 'low' }, {}), []);
  // An unparseable classification date fails toward MORE control, not less.
  assert.equal(stateHistoryRequired({ ...noHistory, classification: {} }), true);
});
}
