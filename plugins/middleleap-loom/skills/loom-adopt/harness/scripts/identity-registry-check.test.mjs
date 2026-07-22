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
