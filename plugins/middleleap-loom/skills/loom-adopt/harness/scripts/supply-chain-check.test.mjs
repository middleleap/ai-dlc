// Tests for the Q4 supply-chain gate. Node built-in runner: `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate } from './supply-chain-check.mjs';

const GOOD = {
  sbom: { bomFormat: 'CycloneDX', specVersion: '1.5', components: [{ type: 'library', name: 'left-pad', version: '1.3.0' }] },
  audit: { critical: 0, high: 0, moderate: 2, low: 5 },
  provenance: { subject: [{ name: 'app.tar', digest: { sha256: 'ab'.repeat(32) } }], predicate: { builder: { id: 'https://ci.example/builder' } } },
};

test('a complete, in-policy bundle passes', () => {
  assert.deepEqual(evaluate(GOOD), []);
});

test('each missing artifact is its own finding', () => {
  const findings = evaluate({ sbom: null, audit: null, provenance: null });
  assert.equal(findings.length, 3);
  assert.match(findings[0], /no SBOM/);
  assert.match(findings[1], /no dependency-audit/);
  assert.match(findings[2], /no build provenance/);
});

test('an empty SBOM inventory fails', () => {
  const findings = evaluate({ ...GOOD, sbom: { bomFormat: 'CycloneDX', components: [] } });
  assert.equal(findings.length, 1);
  assert.match(findings[0], /no components/);
});

test('a critical vulnerability fails the policy', () => {
  const findings = evaluate({ ...GOOD, audit: { critical: 1, high: 0 } });
  assert.equal(findings.length, 1);
  assert.match(findings[0], /1 critical/);
});

test('an audit report without counts is not evidence', () => {
  const findings = evaluate({ ...GOOD, audit: { status: 'ok' } });
  assert.match(findings[0], /does not state critical\/high/);
});

test('provenance without digests or builder fails', () => {
  const findings = evaluate({ ...GOOD, provenance: { subject: [{ name: 'x' }] } });
  assert.equal(findings.length, 2);
  assert.match(findings[0], /sha256/);
  assert.match(findings[1], /no builder/);
});
