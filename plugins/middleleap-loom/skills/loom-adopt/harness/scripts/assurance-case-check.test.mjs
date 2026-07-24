// Tests for the assurance-case gate (rc.14 · WS6). Node runner: `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate } from './assurance-case-check.mjs';

const SLA = {
  sources: ['siem', 'model-monitoring'],
  severities: {
    critical: { assessment_hours: 4, remediation_days: 7, requires_containment: true },
    high: { assessment_hours: 24, remediation_days: 30, requires_containment: true },
    low: { assessment_hours: 168, remediation_days: 180, requires_containment: false },
  },
  containment_actions: ['suspend-autonomy', 'block-release', 'rollback', 'model-fallback'],
};
const REGISTRY = { identities: [
  { id: 'risk-lena', kind: 'human', groups: ['second-line'] },
  { id: 'eng', kind: 'human', groups: ['builders'] },
  { id: 'agent-x', kind: 'agent', groups: ['builders'] },
] };
const CONTROLS = new Set(['HG-0006', 'HG-0002']);
const NOW = Date.parse('2026-07-25T00:00:00Z');

function kase(over = {}) {
  return {
    case_id: 'CASE-1',
    signal: { source: 'model-monitoring', severity: 'high', opened_at: '2026-07-24T08:00:00Z' },
    steps: {
      assess: { status: 'done', at: '2026-07-24T14:00:00Z' },
      map_controls: { status: 'done', controls: ['HG-0006'] },
      run_tests: { status: 'done' },
      assemble_evidence: { status: 'done' },
      second_line_decision: { status: 'done', by: 'risk-lena', decision: 'contain' },
      remediation: { status: 'closed', containment: ['model-fallback'] },
    },
    outcome: 'closed',
    ...over,
  };
}
const ev = (k, over = {}) => evaluate(k, { sla: SLA, registry: REGISTRY, controlIds: CONTROLS, now: NOW, ...over });

test('a well-run, contained, second-line-decided case within SLA passes', () => {
  assert.deepEqual(ev(kase()), []);
});

test('an undeclared signal source fails', () => {
  const k = kase(); k.signal.source = 'astrology';
  assert.ok(ev(k).some((f) => /is not a declared assurance source/.test(f)));
});

test('assessment past the severity window fails', () => {
  const k = kase(); k.steps.assess.at = '2026-07-26T08:00:00Z'; // >24h after opened_at
  assert.ok(ev(k).some((f) => /past the 24h window/.test(f)));
});

test('a mapped control not in the catalog fails', () => {
  const k = kase(); k.steps.map_controls.controls = ['NO-SUCH'];
  assert.ok(ev(k).some((f) => /is not in the control catalog/.test(f)));
});

test('a decision by a non-second-line human fails', () => {
  const k = kase(); k.steps.second_line_decision.by = 'eng';
  assert.ok(ev(k).some((f) => /is not a second-line human/.test(f)));
});

test('a high/critical breach with NO containment fails', () => {
  const k = kase(); delete k.steps.remediation.containment;
  assert.ok(ev(k).some((f) => /must be contained/.test(f)));
});

test('an invalid containment action fails', () => {
  const k = kase(); k.steps.remediation.containment = ['ignore-it'];
  assert.ok(ev(k).some((f) => /no valid containment action/.test(f)));
});

test('an OPEN breach past its remediation deadline blocks', () => {
  const old = kase({ outcome: 'open' });
  old.signal.opened_at = '2026-06-01T00:00:00Z'; // >30d before NOW
  old.steps.assess.at = '2026-06-01T06:00:00Z';
  old.steps.remediation = { status: 'open', containment: ['suspend-autonomy'] };
  assert.ok(ev(old).some((f) => /past its 30d remediation deadline/.test(f)));
});

test('an overdue OPEN breach with an unexpired second-line risk acceptance does NOT block', () => {
  const old = kase({ outcome: 'open' });
  old.signal.opened_at = '2026-06-01T00:00:00Z';
  old.steps.assess.at = '2026-06-01T06:00:00Z';
  old.steps.remediation = { status: 'open', containment: ['suspend-autonomy'], risk_acceptance: { accepted_by: 'risk-lena', expires: '2026-12-01T00:00:00Z' } };
  assert.ok(!ev(old).some((f) => /remediation deadline/.test(f)));
});

test('a missing lifecycle step fails', () => {
  const k = kase(); delete k.steps.run_tests;
  assert.ok(ev(k).some((f) => /lifecycle step "run_tests" is missing/.test(f)));
});

test('a low-severity signal needs no containment', () => {
  const k = kase(); k.signal.severity = 'low'; delete k.steps.remediation.containment;
  assert.deepEqual(ev(k), []);
});
