// Tests for the product-approval gate (PA1/PA2). Node built-in runner: `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluate, run } from './product-approval-check.mjs';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { existsSync } from 'node:fs';

const HARNESS = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Fixtures resolve in BOTH layouts: the bundle and an adopted repo.
const J = (...candidates) => {
  const p = candidates.map((c) => `${HARNESS}/${c}`).find(existsSync);
  if (!p) throw new Error(`fixture not found: ${candidates.join(' | ')}`);
  return JSON.parse(readFileSync(p, 'utf8'));
};
// In a BARE adoption the worked-example change is in neither layout; skip cleanly rather than
// throw at module load. The pure evaluate() logic still runs wherever the example is mounted.
const EXAMPLE_PRESENT = ['change-example/control-plan.json', 'docs/governance/changes/CHG-2026-0042/control-plan.json']
  .some((c) => existsSync(`${HARNESS}/${c}`));
if (!EXAMPLE_PRESENT) {
  test('product-approval gate (worked-example change is bundle-only — skipped in an adopted layout)', { skip: true }, () => {});
} else {
const PLAN = J('change-example/control-plan.json', 'docs/governance/changes/CHG-2026-0042/control-plan.json');
const PASSPORT = J('change-example/product-passport.json', 'docs/governance/changes/CHG-2026-0042/product-passport.json');
const REGISTRY = J('governance/identities.template.json', 'docs/governance/identities.json');

test('the shipped worked example passes PA1', () => {
  assert.deepEqual(evaluate(PASSPORT, PLAN, REGISTRY), []);
});

test('a missing passport blocks a product change', () => {
  assert.match(evaluate(null, PLAN, REGISTRY)[0], /product passport missing/);
});

test('PA1 approved over a missing required section is not an approval', () => {
  const { 'credit-risk-appetite': _, ...sections } = PASSPORT.sections;
  const f = evaluate({ ...PASSPORT, sections }, PLAN, REGISTRY);
  assert.ok(f.some((x) => /required section credit-risk-appetite is missing/.test(x)));
});

test('PA1 without the second-line approval fails', () => {
  const pa1 = { ...PASSPORT.pa1, approvals: PASSPORT.pa1.approvals.filter((a) => a.role !== 'risk-second-line') };
  const f = evaluate({ ...PASSPORT, pa1 }, PLAN, REGISTRY);
  assert.ok(f.some((x) => /no approval for required role risk-second-line/.test(x)));
});

test('a free-text approver does not count; an AGENT approver never counts', () => {
  const freeText = { ...PASSPORT.pa1, approvals: PASSPORT.pa1.approvals.map((a) => a.role === 'risk-second-line' ? { ...a, by: 'Risk' } : a) };
  assert.ok(evaluate({ ...PASSPORT, pa1: freeText }, PLAN, REGISTRY).some((x) => /not in the registry/.test(x)));
  const agent = { ...PASSPORT.pa1, approvals: PASSPORT.pa1.approvals.map((a) => a.role === 'product-owner' ? { ...a, by: 'agent-loom-delivery' } : a) };
  assert.ok(evaluate({ ...PASSPORT, pa1: agent }, PLAN, REGISTRY).some((x) => /never approve/.test(x)));
});

test('a BUILDER cannot issue second-line approval even holding the role', () => {
  const registry = JSON.parse(JSON.stringify(REGISTRY));
  registry.identities.push({ id: 'risk-mole', kind: 'human', roles: ['risk-second-line'], groups: ['builders'] });
  const pa1 = { ...PASSPORT.pa1, approvals: PASSPORT.pa1.approvals.map((a) => a.role === 'risk-second-line' ? { ...a, by: 'risk-mole' } : a) };
  const f = evaluate({ ...PASSPORT, pa1 }, PLAN, registry);
  assert.ok(f.some((x) => /a builder cannot issue second-line approval/.test(x)));
});

test('PA2 approved demands every compiled control-function role and the full section set', () => {
  const pa2 = { decision: 'approved', approvals: [{ role: 'product-owner', by: 'po-fatima' }] };
  const f = evaluate({ ...PASSPORT, pa2 }, PLAN, REGISTRY);
  assert.ok(f.some((x) => /PA2: no approval for required role compliance/.test(x)));
  assert.ok(f.some((x) => /PA2: required section key-facts-statement is missing/.test(x)));
});

test('ownership must resolve: product owner and accountable executive by role', () => {
  const sections = { ...PASSPORT.sections, ownership: { product_owner: 'eng-omar', accountable_executive: 'exec-rashid' } };
  const f = evaluate({ ...PASSPORT, sections }, PLAN, REGISTRY);
  assert.ok(f.some((x) => /ownership\.product_owner.*does not hold the required role/.test(x)));
});

test('a plan with no PA1 gate compiles no product-approval requirements', () => {
  assert.deepEqual(evaluate(PASSPORT, { ...PLAN, required_gates: ['D', 'Q'] }, REGISTRY), []);
});

// --- mandatory-when-compiled: attestation-backed approvals (Factory Floor WS2 · D2.5) ---------
// The capability activates from the compiled plan, never from a CI flag. It TIGHTENS the gate:
// a plan that does not compile it behaves exactly as it did before this path existed.

const ATTESTED_PLAN = { ...PLAN, required_capabilities: { 'approval_attestation': { required: true } } };

test('without the compiled capability the gate is unchanged — no attestation is demanded', () => {
  assert.deepEqual(evaluate(PASSPORT, PLAN, REGISTRY, {}), []);
});

test('with the capability compiled, a named approver alone is no longer enough', () => {
  const f = evaluate(PASSPORT, ATTESTED_PLAN, REGISTRY, { records: [] });
  assert.ok(f.some((x) => /no approval attestation — an approval recorded only as a name in a file is a claim, not evidence/.test(x)));
});

test('the attestation must match the stage and role it is offered for', () => {
  const stray = {
    schema: 'loom.approval-attestation/v1',
    change_id: PLAN.change_id, stage: 'PA2', outcome: 'approved', role: 'risk-second-line',
    subject: { registry_id: 'risk-lena' },
  };
  const f = evaluate(PASSPORT, ATTESTED_PLAN, REGISTRY, { records: [stray] });
  // PA1 finds no record for its stage — the PA2 record does not answer for PA1.
  assert.ok(f.some((x) => /PA1 · risk-second-line: no approval attestation/.test(x)));
});

test('run() wires the whole path end to end in a real repo layout', () => {
  // evaluate() proves the logic; this proves the WIRING — that run() finds the approvals
  // directory, loads both issuer registries, digests the passport off disk, and threads them in.
  const dir = mkdtempSync(join(tmpdir(), 'pa-'));
  try {
    const base = join(dir, 'docs/governance/changes/CHG-2026-0042');
    const gov = join(dir, 'docs/governance');
    mkdirSync(join(base, 'approvals'), { recursive: true });
    const plan = { ...J('change-example/control-plan.json', 'docs/governance/changes/CHG-2026-0042/control-plan.json') };
    plan.required_capabilities = { ...plan.required_capabilities, approval_attestation: { required: true } };
    writeFileSync(join(base, 'control-plan.json'), JSON.stringify(plan));
    writeFileSync(join(base, 'change-envelope.json'), JSON.stringify({ change_id: 'CHG-2026-0042', control_plan: 'control-plan.json' }));
    cpSync(`${HARNESS}/change-example/product-passport.json`, join(base, 'product-passport.json'));
    cpSync(`${HARNESS}/approval-attestation-example/pa1-risk-second-line.json`, join(base, 'approvals/pa1-risk-second-line.json'));
    for (const [src, dst] of [
      ['governance/identities.template.json', 'identities.json'],
      ['governance/attestation-issuers.template.json', 'attestation-issuers.json'],
      ['governance/assertion-issuers.template.json', 'assertion-issuers.json'],
    ]) cpSync(`${HARNESS}/${src}`, join(gov, dst));

    const { findings, count } = run(dir);
    assert.equal(count, 1);
    // The role that carries a real attestation is satisfied — nothing is reported against it.
    assert.ok(!findings.some((f) => /risk-second-line/.test(f)), `risk-second-line should verify:\n${findings.join('\n')}`);
    // The other compiled PA1 roles have no attestation, and the gate says so for each.
    for (const role of ['product-owner', 'accountable-executive']) {
      assert.ok(findings.some((f) => f.includes(role) && /no approval attestation/.test(f)), `expected ${role} to be refused`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('an attestation that does not bind the compiled plan hash is refused', () => {
  const rec = {
    schema: 'loom.approval-attestation/v1',
    change_id: PLAN.change_id, stage: 'PA1', outcome: 'approved', role: 'risk-second-line',
    subject: { registry_id: 'risk-lena', idp_subject: 'idp|x', assertion: { mechanism: 'ed25519', issuer: 'bank-idp' } },
    bound_to: { plan_hash: 'a-stale-hash', passport_digest: 'sha256:whatever' },
    origin: { system: 'notion', event_id: 'e1', nonce: 'n1' },
    transcription: { by: 'svc-floor-bridge' },
  };
  const f = evaluate(PASSPORT, { ...ATTESTED_PLAN, plan_hash: 'the-real-hash' }, REGISTRY, { records: [rec] });
  assert.ok(f.some((x) => /plan_hash does not match the compiled plan/.test(x)));
});
}
