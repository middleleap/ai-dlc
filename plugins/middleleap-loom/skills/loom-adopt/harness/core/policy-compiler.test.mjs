// Tests for the policy compiler. Node built-in runner: `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { compile, loadProfiles, resolveBindings, canonical, planHash, TIERS } from './policy-compiler.mjs';

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

// ---- rc.8 WS3: the institution profile composes with base + jurisdiction + product ----

test('WS3 — an institution profile ADDS brainkit-conformance + provenance + owner, composing on top', () => {
  const inst = profile('institutions/meridian-trust');
  const env = envelope({ required_profiles: ['regulated-bank', 'uae-bank', 'lending', 'meridian-trust'] });
  const plan = compile(env, [...ALL.slice(0, 3), inst]).plan;
  assert.ok(plan.required_gates.includes('brainkit-conformance'), 'institution profile adds its gate family');
  assert.ok(plan.required_evidence.includes('brainkit-provenance'), 'institution profile adds its evidence type');
  assert.ok(plan.required_approver_roles.includes('institutional-context-owner'), 'institution profile adds its approver role');
  // Institution profiles only ADD — base + product requirements survive intact.
  for (const g of ['D', 'Q', 'PA1', 'A', 'PA2']) assert.ok(plan.required_gates.includes(g), `institution profile must not drop base gate ${g}`);
  assert.ok(plan.pa2_sections.includes('affordability-assessment'), 'lending requirements still present');
});

test('WS3 — a generic repo with no institution profile is unaffected (backward compatible)', () => {
  const generic = compile(envelope(), ALL.slice(0, 3)).plan;
  assert.ok(!generic.required_gates.includes('brainkit-conformance'));
  assert.ok(!generic.required_evidence.includes('brainkit-provenance'));
  assert.ok(!generic.required_approver_roles.includes('institutional-context-owner'));
});

test('WS3 — brainkit-conformance is mandatory even at the low tier once the profile is named', () => {
  const inst = profile('institutions/meridian-trust');
  const env = envelope({ change_type: 'documentation', risk_tier: 'low', required_profiles: ['regulated-bank', 'meridian-trust'] });
  const plan = compile(env, [ALL[0], inst]).plan;
  assert.ok(plan.required_gates.includes('brainkit-conformance'), 'even a low-tier documentation change conforms to institutional context');
});

// ---- rc.8 WS4: bind the plan to exact profile content, hashed recursively ----

test('WS4 — canonical serialization is order-independent and recursive', () => {
  assert.equal(canonical({ b: 1, a: { d: 2, c: 3 } }), canonical({ a: { c: 3, d: 2 }, b: 1 }));
  assert.notEqual(canonical({ a: { c: 1 } }), canonical({ a: { c: 2 } }));
  assert.equal(canonical([{ b: 1, a: 2 }]), '[{"a":2,"b":1}]'); // array order preserved, keys sorted
});

test('WS4 — planHash covers NESTED profile_binding content (the flat-replacer bug is dead)', () => {
  const plan = compile(envelope(), ALL.slice(0, 3), [
    { profile: 'acme-bank', kind: 'institution', version: '1.3.0', digest: 'sha256:aaaa' },
  ]).plan;
  const tampered = { ...plan, profile_bindings: [{ ...plan.profile_bindings[0], digest: 'sha256:bbbb' }] };
  // The new recursive hash SEES the nested digest change…
  assert.notEqual(planHash(tampered), plan.plan_hash, 'a nested binding change must change the hash');
  // …whereas the old top-level replacer array was a whitelist that dropped nested keys entirely,
  // so both objects would have hashed identically. This asserts we are no longer doing that.
  const flat = (p) => { const { plan_hash, ...rest } = p; return JSON.stringify(rest, Object.keys(rest).sort()); };
  assert.equal(flat(tampered), flat(plan), 'the OLD flat serializer was blind to the nested change (documents the bug)');
});

test('WS4 — a plan carries a sorted profile_bindings list; the hash is deterministic', () => {
  const bindings = [
    { profile: 'uae-bank', kind: 'jurisdiction', version: null, digest: 'sha256:2' },
    { profile: 'acme-bank', kind: 'institution', version: '1.0.0', digest: 'sha256:1' },
  ];
  const a = compile(envelope(), ALL.slice(0, 3), bindings).plan;
  const b = compile(envelope(), ALL.slice(0, 3), [...bindings].reverse()).plan;
  assert.deepEqual(a.profile_bindings.map((x) => x.profile), ['acme-bank', 'uae-bank']); // sorted
  assert.equal(a.plan_hash, b.plan_hash); // binding input order does not affect the hash
  assert.equal(a.plan_hash, planHash(a));
});

test('WS4 — resolveBindings pins content: a one-byte profile change changes its digest and the plan hash', () => {
  const dir = mkdtempSync(join(tmpdir(), 'loom-profiles-'));
  try {
    mkdirSync(join(dir, 'profiles', 'institutions'), { recursive: true });
    const write = (v) => writeFileSync(join(dir, 'profiles', 'institutions', 'acme.json'),
      JSON.stringify({ profile: 'acme', kind: 'institution', version: '1.0.0', note: v }));
    write('alpha');
    const first = resolveBindings(['acme'], dir).bindings;
    write('alphb'); // one byte
    const second = resolveBindings(['acme'], dir).bindings;
    assert.notEqual(first[0].digest, second[0].digest, 'a profile content change must change its binding digest');
    const env = envelope({ required_profiles: ['acme'] });
    assert.notEqual(
      compile(env, ALL.slice(0, 3), first).plan.plan_hash,
      compile(env, ALL.slice(0, 3), second).plan.plan_hash,
      'a changed binding digest must make the compiled plan hash change (stale-plan detection)');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
