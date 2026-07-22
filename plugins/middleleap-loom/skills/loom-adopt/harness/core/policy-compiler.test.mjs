// Tests for the policy compiler. Node built-in runner: `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile, loadProfiles, planHash, TIERS } from './policy-compiler.mjs';

const HARNESS = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const profile = (p) => JSON.parse(readFileSync(`${HARNESS}/profiles/${p}.json`, 'utf8'));
const ALL = [profile('regulated-bank'), profile('jurisdictions/uae-bank'), profile('products/lending'), profile('products/payments')];

const envelope = (over = {}) => ({
  change_id: 'CHG-T-1', product_id: 'PRD-T', change_type: 'new-product', risk_tier: 'high',
  required_profiles: ['regulated-bank', 'uae-bank', 'lending'],
  flags: {}, ...over,
});

test('PROPERTY — monotonicity: a higher tier only ever ADDS requirements, for every profile combination', () => {
  const combos = [[ALL[0]], [ALL[0], ALL[1]], [ALL[0], ALL[2]], [ALL[0], ALL[1], ALL[2]], [ALL[0], ALL[1], ALL[3]], ALL];
  const flagSets = [{}, { islamic: true }, { model_involved: true, personal_data: true, third_party: true }];
  for (const profiles of combos) {
    for (const flags of flagSets) {
      let prev = null;
      for (const tier of TIERS) {
        const { plan, findings } = compile(envelope({ risk_tier: tier, change_type: tier === 'low' ? 'software-change' : 'new-product', flags }), profiles);
        assert.deepEqual(findings, []);
        if (prev) {
          for (const field of ['required_gates', 'required_approver_roles', 'required_evidence', 'pa1_sections', 'pa2_sections']) {
            for (const item of prev[field]) {
              assert.ok(plan[field].includes(item),
                `${tier} dropped ${field}:${item} required at a lower tier (profiles: ${profiles.map((p) => p.profile)}, flags: ${JSON.stringify(flags)})`);
            }
          }
        }
        prev = plan;
      }
    }
  }
});

test('an unclassified change is blocked', () => {
  const { plan, findings } = compile(envelope({ risk_tier: undefined }), ALL);
  assert.equal(plan, null);
  assert.ok(findings.some((f) => /no risk_tier — an unclassified change is blocked/.test(f)));
});

test('a product change cannot ride the low-risk route', () => {
  const { findings } = compile(envelope({ change_type: 'new-product', risk_tier: 'low' }), ALL);
  assert.ok(findings.some((f) => /cannot be classified low/.test(f)));
});

test('a documentation change at low tier compiles the light path', () => {
  const { plan, findings } = compile(envelope({ change_type: 'documentation', risk_tier: 'low', required_profiles: ['regulated-bank'] }), [ALL[0]]);
  assert.deepEqual(findings, []);
  assert.deepEqual(plan.required_gates, ['D', 'Q']);
  assert.ok(!plan.required_approver_roles.includes('risk-second-line'));
  assert.deepEqual(plan.pa1_sections, []);
});

test('a high-tier product compiles PA1 + A + PA2 with control functions', () => {
  const { plan } = compile(envelope(), ALL.slice(0, 3));
  for (const g of ['D', 'Q', 'PA1', 'A', 'PA2']) assert.ok(plan.required_gates.includes(g), `missing gate ${g}`);
  for (const r of ['risk-second-line', 'compliance', 'legal', 'operations', 'information-security', 'accountable-executive', 'credit-risk']) {
    assert.ok(plan.required_approver_roles.includes(r), `missing approver ${r}`);
  }
  assert.ok(plan.pa2_sections.includes('affordability-assessment'), 'lending profile adds affordability');
  assert.ok(plan.pa2_sections.includes('key-facts-statement'), 'uae profile adds KFS');
});

test('conditionals fire on flags: islamic adds Shariah, model adds validator', () => {
  const base = compile(envelope(), ALL.slice(0, 3)).plan;
  assert.ok(!base.required_approver_roles.includes('shariah-committee'));
  const islamic = compile(envelope({ flags: { islamic: true } }), ALL.slice(0, 3)).plan;
  assert.ok(islamic.required_approver_roles.includes('shariah-committee'));
  assert.ok(islamic.pa2_sections.includes('shariah-approval'));
  assert.ok(islamic.pa2_sections.includes('profit-rate-structure'), 'lending islamic conditional');
  const model = compile(envelope({ flags: { model_involved: true } }), ALL.slice(0, 3)).plan;
  assert.ok(model.required_approver_roles.includes('model-validator'));
});

test('different product profiles compile different requirements', () => {
  const lending = compile(envelope({ required_profiles: ['regulated-bank', 'uae-bank', 'lending'] }), [ALL[0], ALL[1], ALL[2]]).plan;
  const payments = compile(envelope({ required_profiles: ['regulated-bank', 'uae-bank', 'payments'] }), [ALL[0], ALL[1], ALL[3]]).plan;
  assert.ok(lending.pa2_sections.includes('affordability-assessment'));
  assert.ok(!payments.pa2_sections.includes('affordability-assessment'));
  assert.ok(payments.pa2_sections.includes('duplicate-transaction-controls'));
  assert.ok(!lending.pa2_sections.includes('duplicate-transaction-controls'));
});

test('the plan is deterministic and its hash is canonical', () => {
  const a = compile(envelope(), ALL.slice(0, 3)).plan;
  const b = compile(envelope(), ALL.slice(0, 3)).plan;
  assert.deepEqual(a, b);
  assert.equal(a.plan_hash, planHash(a));
  const tampered = { ...a, required_gates: a.required_gates.filter((g) => g !== 'PA1') };
  assert.notEqual(planHash(tampered), a.plan_hash);
});

test('a missing profile blocks the change', () => {
  const { findings } = loadProfiles(['regulated-bank', 'no-such-profile'], HARNESS);
  assert.ok(findings.some((f) => /no-such-profile not found/.test(f)));
});
