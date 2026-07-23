// Tests for the model-provenance gate. Node built-in runner: `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate } from './model-provenance-check.mjs';

// A high-tier model that satisfies every check — the fixture others mutate.
const HIGH = {
  role: 'delivery-loop',
  provider: 'example',
  model_id: 'example-model@2026-01',
  prompt_version: 'harness@1.4.0',
  risk_tier: 'high',
  eval: {
    suite: 'evals/delivery-loop',
    ran_at: '2026-07-20',
    dataset_version: 'evalset@3',
    runner_version: 'loom-eval-runner@1.2.0',
    result: 'pass',
    threshold_met: true,
    evaluated_model_id: 'example-model@2026-01',
    evaluated_prompt_version: 'harness@1.4.0',
    report: { ref: 'docs/governance/evidence/eval-report-delivery-loop.json', sha256: 'ab'.repeat(32) },
  },
  validated_by: 'model-risk (2nd line)',
  runtime: {
    monitoring: ['decision-vs-outcome drift', 'override rate'],
    suspension: 'suspend to manual on override rate > 15% over 2 weeks',
    fallback: 'manual underwriting queue on model/provider outage',
  },
};
const manifest = (m) => ({ models: [{ ...HIGH, ...m }] });

test('a fully-pinned, evaluated, validated high-tier model passes', () => {
  assert.deepEqual(evaluate(manifest()), []);
});

test('a low-tier model needs no eval or validation', () => {
  assert.deepEqual(evaluate({ models: [{ role: 'summariser', model_id: 'x@1', prompt_version: 'p@1', risk_tier: 'low' }] }), []);
});

test('a medium-tier model requires an eval and an independent validation (runbook §2.2)', () => {
  const f = evaluate({ models: [{ role: 'facilitator', model_id: 'x@1', prompt_version: 'p@1', risk_tier: 'medium' }] });
  assert.ok(f.some((x) => /has no eval block/.test(x)), 'medium needs an eval');
  assert.ok(f.some((x) => /no independent validation/.test(x)), 'medium needs validated_by');
});

test('a floating model_id is not a pin', () => {
  const f = evaluate(manifest({ model_id: 'latest' }));
  assert.ok(f.some((x) => /model_id is not pinned/.test(x)));
});

test('a floating prompt_version is not a pin', () => {
  assert.match(evaluate(manifest({ prompt_version: '' }))[0], /prompt_version is not pinned/);
});

test('an unknown risk tier is rejected', () => {
  assert.match(evaluate(manifest({ risk_tier: 'critical' }))[0], /risk_tier must be one of/);
});

test('a high-tier model with no eval fails', () => {
  const f = evaluate(manifest({ eval: undefined }));
  assert.ok(f.some((x) => /has no eval block/.test(x)));
});

test('a failing eval threshold fails', () => {
  const f = evaluate(manifest({ eval: { ...HIGH.eval, threshold_met: false } }));
  assert.ok(f.some((x) => /did not pass its threshold/.test(x)));
});

test('a stale eval (pin mismatch) is caught', () => {
  const f = evaluate(manifest({ eval: { ...HIGH.eval, evaluated_model_id: 'example-model@2025-09' } }));
  assert.ok(f.some((x) => /stale eval/.test(x)));
});

test('a high-tier model with no independent validation fails', () => {
  const f = evaluate(manifest({ validated_by: '   ' }));
  assert.ok(f.some((x) => /no independent validation/.test(x)));
});

test('an eval with no dataset/runner/timestamp identification is a claim, not evidence (1.10)', () => {
  const f = evaluate(manifest({ eval: { ...HIGH.eval, dataset_version: undefined, runner_version: '' } }));
  assert.ok(f.some((x) => /no dataset_version/.test(x)));
  assert.ok(f.some((x) => /no runner_version/.test(x)));
});

test('an eval without a hashed report artifact fails — `result: pass` alone is the false green (1.10)', () => {
  const f = evaluate(manifest({ eval: { ...HIGH.eval, report: undefined } }));
  assert.ok(f.some((x) => /no report \{ref, sha256\}/.test(x)));
  const g = evaluate(manifest({ eval: { ...HIGH.eval, report: { ref: 'x.json', sha256: 'not-a-hash' } } }));
  assert.ok(g.some((x) => /no report \{ref, sha256\}/.test(x)));
});

test('with baseDir, a missing or altered report artifact is caught', async () => {
  const { mkdtempSync, writeFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { createHash } = await import('node:crypto');
  const dir = mkdtempSync(join(tmpdir(), 'mp-'));
  try {
    const missing = evaluate(manifest(), { baseDir: dir });
    assert.ok(missing.some((x) => /report .* not found/.test(x)));
    const body = '{"cases":12,"pass":12}\n';
    writeFileSync(join(dir, 'report.json'), body);
    const good = createHash('sha256').update(body).digest('hex');
    assert.deepEqual(evaluate(manifest({ eval: { ...HIGH.eval, report: { ref: 'report.json', sha256: good } } }), { baseDir: dir }), []);
    const bad = evaluate(manifest({ eval: { ...HIGH.eval, report: { ref: 'report.json', sha256: 'cd'.repeat(32) } } }), { baseDir: dir });
    assert.ok(bad.some((x) => /does not match its declared sha256/.test(x)));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a high-tier model must declare runtime governance — monitoring, suspension, fallback (§10, 2.0-rc)', () => {
  assert.ok(evaluate(manifest({ runtime: undefined })).some((x) => /has no runtime block/.test(x)));
  const partial = evaluate(manifest({ runtime: { monitoring: ['x'] } }));
  assert.ok(partial.some((x) => /runtime.suspension must state/.test(x)));
  assert.ok(partial.some((x) => /runtime.fallback must state/.test(x)));
});

test('a medium-tier model does not require a runtime block (tier-proportionate)', () => {
  const med = { role: 'facilitator', model_id: 'x@1', prompt_version: 'p@1', risk_tier: 'medium',
    eval: { suite: 'e', ran_at: '2026-07-20', dataset_version: 'd@1', runner_version: 'r@1', result: 'pass', threshold_met: true,
      evaluated_model_id: 'x@1', evaluated_prompt_version: 'p@1', report: { ref: HIGH.eval.report.ref, sha256: HIGH.eval.report.sha256 } },
    validated_by: 'mrm' };
  assert.deepEqual(evaluate({ models: [med] }), []);
});

test('an empty inventory is a finding', () => {
  assert.match(evaluate({ models: [] })[0], /model inventory is empty/);
  assert.match(evaluate({})[0], /no `models` array|inventory is empty/);
});

/* ---- W5: validated_by resolves against the identity registry (closes F6) ---- */

const REG = { identities: [
  { id: 'mrm-aisha', kind: 'human', roles: ['model-validator'], groups: ['second-line'] },
  { id: 'eng-omar', kind: 'human', roles: ['engineering'], groups: ['builders'] },
  { id: 'agent-x', kind: 'agent', roles: ['model-validator'], groups: ['builders'] },
  { id: 'risk-lena', kind: 'human', roles: ['risk-second-line'], groups: ['second-line'] },
] };

test('with a registry, validated_by must resolve to a second-line human model-validator', () => {
  assert.deepEqual(evaluate(manifest({ validated_by: 'mrm-aisha' }), { registry: REG }), []);
});

test('free text, an agent, a builder, or the wrong role all fail validation resolution', () => {
  assert.ok(evaluate(manifest({ validated_by: 'Risk' }), { registry: REG }).some((x) => /not a registry identity/.test(x)));
  assert.ok(evaluate(manifest({ validated_by: 'agent-x' }), { registry: REG }).some((x) => /is an AGENT/.test(x)));
  assert.ok(evaluate(manifest({ validated_by: 'eng-omar' }), { registry: REG }).some((x) => /does not hold the model-validator role/.test(x)));
  assert.ok(evaluate(manifest({ validated_by: 'risk-lena' }), { registry: REG }).some((x) => /does not hold the model-validator role/.test(x)));
});

test('without a registry, validated_by stays a presence check (generic repo, backward compatible)', () => {
  assert.deepEqual(evaluate(manifest({ validated_by: 'anything non-empty' })), []);
});
