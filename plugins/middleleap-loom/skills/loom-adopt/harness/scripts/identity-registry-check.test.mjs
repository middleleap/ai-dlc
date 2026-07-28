// Tests for the identity-registry gate. Node built-in runner: `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, resolveApprover } from './identity-registry-check.mjs';

const REG = {
  groups: { builders: '', 'second-line': '' },
  identities: [
    { id: 'agent-1', kind: 'agent', roles: [], groups: ['builders'] },
    { id: 'eng-1', kind: 'human', roles: ['engineering'], groups: ['builders'] },
    { id: 'risk-1', kind: 'human', roles: ['risk-second-line'], groups: ['second-line'] },
  ],
};

test('a sound registry passes', () => {
  assert.deepEqual(evaluate(REG), []);
});

test('an agent holding approver roles is a finding', () => {
  const reg = { ...REG, identities: [...REG.identities, { id: 'agent-2', kind: 'agent', roles: ['compliance'], groups: [] }] };
  assert.ok(evaluate(reg).some((f) => /agent-2: an agent identity holds approver roles/.test(f)));
});

test('builders ∩ second-line must be empty', () => {
  const reg = { ...REG, identities: [...REG.identities, { id: 'both-1', kind: 'human', roles: ['risk-second-line'], groups: ['builders', 'second-line'] }] };
  assert.ok(evaluate(reg).some((f) => /both-1: is in BOTH builders and second-line/.test(f)));
});

test('duplicate ids, unknown groups and bad kinds are findings', () => {
  const reg = {
    groups: { builders: '' },
    identities: [
      { id: 'x', kind: 'human', roles: [], groups: [] },
      { id: 'x', kind: 'robot', roles: [], groups: ['ghosts'] },
    ],
  };
  const f = evaluate(reg);
  assert.ok(f.some((x) => /duplicate identity id/.test(x)));
  assert.ok(f.some((x) => /unknown group ghosts/.test(x)));
  assert.ok(f.some((x) => /kind must be human\|agent/.test(x)));
});

test('resolveApprover: free text, unknown ids, agents, and missing roles all fail', () => {
  assert.match(resolveApprover(REG, 'Risk', 'risk-second-line', 'x')[0], /not in the registry/);
  assert.match(resolveApprover(REG, '', 'risk-second-line', 'x')[0], /no identity given/);
  assert.ok(resolveApprover(REG, 'agent-1', undefined, 'x').some((f) => /never approve/.test(f)));
  assert.ok(resolveApprover(REG, 'eng-1', 'compliance', 'x').some((f) => /does not hold the required role/.test(f)));
  assert.deepEqual(resolveApprover(REG, 'risk-1', 'risk-second-line', 'x'), []);
});

// --- delegation and quorum (rc.38 · flow-plan Phase 4.5) -------------------------------------
//
// Both mechanisms exist to remove the single-named-human bus factor WITHOUT touching separation
// of duties, so every test below is about a rule the deputy inherits, or a window that closes.

const NOW = Date.parse('2026-07-28T00:00:00Z');
const DREG = (delegates, extra = {}) => ({
  groups: { builders: '', 'second-line': '', 'platform-admins': '' },
  identities: [
    { id: 'agent-1', kind: 'agent', roles: [], groups: ['builders'] },
    { id: 'eng-1', kind: 'human', roles: ['engineering'], groups: ['builders'] },
    { id: 'risk-1', kind: 'human', roles: ['risk-second-line'], groups: ['second-line'], delegates },
    { id: 'risk-2', kind: 'human', roles: ['risk-second-line'], groups: ['second-line'] },
    { id: 'risk-3', kind: 'human', roles: ['risk-second-line'], groups: ['second-line'] },
    { id: 'dep-1', kind: 'human', roles: [], groups: [] },
    { id: 'grantor', kind: 'human', roles: ['compliance'], groups: ['second-line'] },
  ],
  ...extra,
});
const LIVE = [{ to: 'dep-1', from: '2026-07-20', until: '2026-08-20', granted_by: 'grantor' }];

test('a live delegation supplies the role, and SAYS it did', () => {
  const notices = [];
  const reg = DREG(LIVE);
  assert.deepEqual(evaluate(reg, { now: NOW }), []);
  assert.deepEqual(resolveApprover(reg, 'dep-1', 'risk-second-line', 'x', { notices, now: NOW }), []);
  assert.ok(notices.some((n) => /holds risk-second-line BY DELEGATION from risk-1 until 2026-08-20/.test(n)),
    'a deputy approval must never be indistinguishable from the holder\'s own');
});

test('a LAPSED delegation supplies nothing, and is reported rather than left in the file', () => {
  const reg = DREG([{ to: 'dep-1', from: '2026-01-01', until: '2026-02-01', granted_by: 'grantor' }]);
  assert.ok(resolveApprover(reg, 'dep-1', 'risk-second-line', 'x', { now: NOW }).some((f) => /does not hold the required role/.test(f)));
  const notices = [];
  evaluate(reg, { notices, now: NOW });
  assert.ok(notices.some((n) => /LAPSED at 2026-02-01/.test(n)));
});

test('a delegation not yet live supplies nothing either', () => {
  const reg = DREG([{ to: 'dep-1', from: '2026-12-01', until: '2026-12-31', granted_by: 'grantor' }]);
  assert.ok(resolveApprover(reg, 'dep-1', 'risk-second-line', 'x', { now: NOW }).some((f) => /does not hold the required role/.test(f)));
});

test('a delegation with no end date is refused — a permanent transfer wearing a temporary word', () => {
  const reg = DREG([{ to: 'dep-1', from: '2026-07-20', granted_by: 'grantor' }]);
  assert.ok(evaluate(reg, { now: NOW }).some((f) => /missing until \(a delegation with no end date/.test(f)));
});

test('an unparseable window is NOT a delegation — it fails closed', () => {
  const reg = DREG([{ to: 'dep-1', from: '2026-07-20', until: 'whenever', granted_by: 'grantor' }]);
  assert.ok(evaluate(reg, { now: NOW }).some((f) => /until "whenever" is not a parseable/.test(f)));
  assert.ok(resolveApprover(reg, 'dep-1', 'risk-second-line', 'x', { now: NOW }).some((f) => /does not hold the required role/.test(f)));
});

test('a second-line identity cannot deputise a BUILDER — the deputy inherits the independence', () => {
  const reg = DREG([{ to: 'eng-1', from: '2026-07-20', until: '2026-08-20', granted_by: 'grantor' }]);
  assert.ok(evaluate(reg, { now: NOW }).some((f) => /cannot deputise a BUILDER/.test(f)));
});

test('an AGENT cannot be a deputy', () => {
  const reg = DREG([{ to: 'agent-1', from: '2026-07-20', until: '2026-08-20', granted_by: 'grantor' }]);
  assert.ok(evaluate(reg, { now: NOW }).some((f) => /the deputy is an agent/.test(f)));
});

test('neither party may authorise the delegation, and the grantor must be second line', () => {
  for (const [who, re] of [['risk-1', /is a party to the delegation/], ['dep-1', /is a party to the delegation/], ['eng-1', /is not a second-line identity/]]) {
    const reg = DREG([{ to: 'dep-1', from: '2026-07-20', until: '2026-08-20', granted_by: who }]);
    assert.ok(evaluate(reg, { now: NOW }).some((f) => re.test(f)), who);
  }
});

test('a delegate cannot receive a role the delegator does not hold', () => {
  const reg = DREG(LIVE);
  assert.ok(resolveApprover(reg, 'dep-1', 'compliance', 'x', { now: NOW }).some((f) => /does not hold the required role compliance/.test(f)));
});

test('an unresolvable deputy inherits nothing', () => {
  const reg = DREG([{ to: 'nobody', from: '2026-07-20', until: '2026-08-20', granted_by: 'grantor' }]);
  assert.ok(evaluate(reg, { now: NOW }).some((f) => /the deputy is not in the registry/.test(f)));
});

test('a quorum may only raise the count, and must be satisfiable', () => {
  assert.deepEqual(evaluate(DREG(undefined, { quorum: { 'risk-second-line': 3 } }), { now: NOW }), []);
  assert.ok(evaluate(DREG(undefined, { quorum: { 'risk-second-line': 4 } }), { now: NOW })
    .some((f) => /only 3 human identities hold it — an unsatisfiable quorum/.test(f)));
  for (const bad of [0, -1, 1.5, '2', null]) {
    assert.ok(evaluate(DREG(undefined, { quorum: { compliance: bad } }), { now: NOW })
      .some((f) => /must be an integer ≥ 1/.test(f)), JSON.stringify(bad));
  }
});
