// Tests for the comprehension gate (rc.15 · WS8). Node runner: `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate } from './comprehension-check.mjs';

const REGISTRY = { identities: [{ id: 'eng-omar', kind: 'human', groups: ['builders'] }, { id: 'agent-x', kind: 'agent' }] };
const record = (over = {}) => ({
  summary: 'a real human summary of the change',
  critical_path: 'request → score → overlay → write',
  architecture_explanation: 'stateless service behind the origination API',
  failure_modes: 'fails closed on stale features',
  named_owner: 'eng-omar',
  challenge_questions: [{ q: 'what if stale?', a: 'fails closed' }],
  decision_log_replay_ref: 'docs/governance/decision-log.json',
  metrics: { review_minutes: 95, change_complexity: 'high', pct_agent_generated: 78, reviewer_familiarity: 'medium' },
  ...over,
});
const ev = (r) => evaluate('CHG-1', r, { registry: REGISTRY });

test('a complete comprehension record for a high-tier change passes', () => {
  assert.deepEqual(ev(record()), []);
});

test('a high-tier change with NO comprehension record fails (mandatory-when-compiled)', () => {
  assert.ok(ev(null).some((f) => /has no comprehension.json/.test(f)));
});

test('a placeholder narrative field fails', () => {
  assert.ok(ev(record({ summary: 'TODO' })).some((f) => /summary is missing or a placeholder/.test(f)));
});

test('an agent named as the owner fails — an agent cannot be the human who understands', () => {
  assert.ok(ev(record({ named_owner: 'agent-x' })).some((f) => /is not a human registry identity/.test(f)));
});

test('an unresolved named_owner fails', () => {
  assert.ok(ev(record({ named_owner: 'ghost' })).some((f) => /is not a human registry identity/.test(f)));
});

test('missing challenge questions fail', () => {
  assert.ok(ev(record({ challenge_questions: [] })).some((f) => /no challenge_questions/.test(f)));
});

test('a missing decision-log replay reference fails', () => {
  assert.ok(ev(record({ decision_log_replay_ref: '' })).some((f) => /no decision_log_replay_ref/.test(f)));
});

test('a missing metric key fails (measured, though its value is not judged)', () => {
  const r = record(); delete r.metrics.pct_agent_generated;
  assert.ok(ev(r).some((f) => /metric "pct_agent_generated" not recorded/.test(f)));
});

test('a metric value is NOT judged — a high pct_agent_generated still passes', () => {
  assert.deepEqual(ev(record({ metrics: { review_minutes: 5, change_complexity: 'low', pct_agent_generated: 100, reviewer_familiarity: 'low' } })), []);
});
