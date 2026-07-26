// Tests for the product-approval gate (PA1/PA2). Node built-in runner: `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluate, pa1Roles } from './product-approval-check.mjs';

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

// --- the PA1 role gap (found by the Alpha Islamic Bank walkthrough) ----------------------------
//
// A compiled plan could name twelve approver roles while PA1 checked three, and the flat
// `required_approver_roles` list gave a reader no way to tell which was which. Nine roles —
// including every Shariah role — were unchecked at PA1, so an agent, a builder or an identity
// that does not exist could occupy one of those slots under a green gate.

test('a recorded approval is resolved even when this stage does not require that role', () => {
  const plan = { ...PLAN, risk_tier: 'high' };
  const notRequiredAtPa1 = plan.required_approver_roles.find((r) => !pa1Roles(plan).includes(r));
  assert.ok(notRequiredAtPa1, 'the fixture must have a role PA1 does not demand');
  for (const [who, re] of [
    ['agent-loom-delivery', /is an AGENT/],
    ['nobody-at-all', /is not in the registry/],
  ]) {
    const passport = {
      ...PASSPORT,
      pa1: { decision: 'approved', approvals: [...PASSPORT.pa1.approvals.filter((a) => a.role !== notRequiredAtPa1), { role: notRequiredAtPa1, by: who }] },
    };
    const f = evaluate(passport, plan, REGISTRY);
    assert.ok(f.some((x) => new RegExp(notRequiredAtPa1).test(x) && re.test(x)),
      `${who} in the ${notRequiredAtPa1} slot must be refused at PA1:\n${f.join('\n')}`);
    assert.ok(f.some((x) => /recorded, not required at this stage/.test(x)),
      'the finding must say the role was recorded rather than demanded');
  }
});

test('pa1Roles is a floor plus what the plan declares, never more than the plan compiled', () => {
  const base = { risk_tier: 'medium', required_approver_roles: ['product-owner', 'risk-second-line', 'compliance'] };
  assert.deepEqual(pa1Roles(base), ['product-owner', 'risk-second-line']);
  // a profile opts a role in…
  assert.deepEqual(pa1Roles({ ...base, pa1_approver_roles: ['compliance'] }), ['compliance', 'product-owner', 'risk-second-line']);
  // …but it can never bind a role the plan did not compile at all.
  assert.deepEqual(pa1Roles({ ...base, pa1_approver_roles: ['shariah-committee'] }), ['product-owner', 'risk-second-line']);
  // high tier adds the accountable executive, when compiled
  assert.deepEqual(pa1Roles({ risk_tier: 'high', required_approver_roles: ['accountable-executive'] }), ['accountable-executive']);
  assert.deepEqual(pa1Roles({ risk_tier: 'medium', required_approver_roles: ['accountable-executive'] }), []);
});

test('an islamic change binds the Shariah roles at PA1, not only at PA2', () => {
  // The uae-bank and islamic-product profiles add Shariah approver roles AND Shariah PA1 sections.
  // Requiring the analysis at PA1 while nobody with Shariah authority need approve it until PA2
  // is incoherent, so those profiles now declare their roles pa1-binding.
  const plan = {
    risk_tier: 'high',
    required_approver_roles: ['product-owner', 'risk-second-line', 'shariah-committee', 'shariah-board', 'shariah-compliance'],
    pa1_approver_roles: ['shariah-committee', 'shariah-board', 'shariah-compliance'],
  };
  for (const r of ['shariah-committee', 'shariah-board', 'shariah-compliance']) {
    assert.ok(pa1Roles(plan).includes(r), `${r} must bind at PA1`);
  }
});
}
