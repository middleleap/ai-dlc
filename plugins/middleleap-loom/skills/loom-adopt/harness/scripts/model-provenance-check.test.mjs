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
    result: 'pass',
    threshold_met: true,
    evaluated_model_id: 'example-model@2026-01',
    evaluated_prompt_version: 'harness@1.4.0',
  },
  validated_by: 'model-risk (2nd line)',
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

test('an empty inventory is a finding', () => {
  assert.match(evaluate({ models: [] })[0], /model inventory is empty/);
  assert.match(evaluate({})[0], /no `models` array|inventory is empty/);
});
