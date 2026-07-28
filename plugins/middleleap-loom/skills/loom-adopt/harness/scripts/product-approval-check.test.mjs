// Tests for the product-approval gate (PA1/PA2). Node built-in runner: `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateKeyPairSync, sign as edSign } from 'node:crypto';
import { checkApprovals, evaluate, run, pa1Roles } from './product-approval-check.mjs';
import { canonicalDecisionPayload, roleBindingHash, sha256 } from '../core/approval-attestations.mjs';
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

test('a plan with NEITHER PA gate compiles no product-approval requirements', () => {
  assert.deepEqual(evaluate(PASSPORT, { ...PLAN, required_gates: ['D', 'Q'] }, REGISTRY), []);
});

// PA2 is a product-approval route too — the one that grants permission to LAUNCH. Testing PA1
// alone meant a plan compiling PA2 without PA1 (which a conditional profile adding PA2 to a lower
// tier can produce) returned early and skipped EVERYTHING: ownership, the PA2 section set, the
// approver roles and every attestation on the launch gate.
test('a PA2-only plan still checks the launch approval, ownership and sections', () => {
  const pa2Only = { ...PLAN, required_gates: ['D', 'Q', 'PA2'] };
  const passport = {
    ...PASSPORT,
    sections: { ...PASSPORT.sections, ownership: { product_owner: 'nobody-at-all', accountable_executive: 'nobody-either' } },
    pa2: { decision: 'approved', approvals: [] },
  };
  const findings = evaluate(passport, pa2Only, REGISTRY);
  assert.ok(findings.some((f) => /ownership\.product_owner/.test(f)), 'ownership must still resolve');
  assert.ok(findings.some((f) => /PA2: no approval for required role/.test(f)), `PA2 roles unchecked: ${findings}`);
  // …and PA1's own checks stay off, because PA1 is not compiled.
  assert.ok(!findings.some((f) => /· PA1/.test(f)), `PA1 must not be demanded: ${findings}`);
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

// First existing candidate, or null — the bundle and an adopted repo hold these in different
// places, and the approval example is bundle-only (studied, never copied).
const FIND = (...candidates) => candidates.map((c) => `${HARNESS}/${c}`).find(existsSync) || null;

test('run() wires the whole path end to end in a real repo layout', (t) => {
  // evaluate() proves the logic; this proves the WIRING — that run() finds the approvals
  // directory, loads both issuer registries, digests the passport off disk, and threads them in.
  const srcs = {
    passport: FIND('change-example/product-passport.json', 'docs/governance/changes/CHG-2026-0042/product-passport.json'),
    approval: FIND('approval-attestation-example/pa1-risk-second-line.json'),
    identities: FIND('governance/identities.template.json', 'docs/governance/identities.json'),
    // The example's own registries — bundle-only, and marked `demo: true` so the gate refuses
    // them. The governance/ templates deliberately carry no working key material.
    attIssuers: FIND('approval-attestation-example/attestation-issuers.example.json'),
    asrIssuers: FIND('approval-attestation-example/assertion-issuers.example.json'),
  };
  if (Object.values(srcs).some((p) => !p)) {
    t.skip('bundle-only fixtures absent in this layout');
    return;
  }
  const dir = mkdtempSync(join(tmpdir(), 'pa-'));
  try {
    const base = join(dir, 'docs/governance/changes/CHG-2026-0042');
    const gov = join(dir, 'docs/governance');
    mkdirSync(join(base, 'approvals'), { recursive: true });
    const plan = { ...J('change-example/control-plan.json', 'docs/governance/changes/CHG-2026-0042/control-plan.json') };
    plan.required_capabilities = { ...plan.required_capabilities, approval_attestation: { required: true } };
    writeFileSync(join(base, 'control-plan.json'), JSON.stringify(plan));
    writeFileSync(join(base, 'change-envelope.json'), JSON.stringify({ change_id: 'CHG-2026-0042', control_plan: 'control-plan.json' }));
    cpSync(srcs.passport, join(base, 'product-passport.json'));
    cpSync(srcs.identities, join(gov, 'identities.json'));
    cpSync(srcs.attIssuers, join(gov, 'attestation-issuers.json'));
    cpSync(srcs.asrIssuers, join(gov, 'assertion-issuers.json'));
    // rc.38 (flow-plan Phase 4.1): this fixture's plan is MUTATED above (approval_attestation is
    // switched on), and required_capabilities is inside the per-role binding — correctly, because a
    // capability set is part of the route the approver was shown. So the shipped record's
    // binding_hash does not describe THIS plan and must be re-derived, which means re-signing.
    // The issuer ids and their `"demo": true` markings are kept: the point of the assertion below
    // is that a demo anchor is refused even when the cryptography is perfect, so only the KEY is
    // fresh, and only its public half is ever written.
    {
      const rec = JSON.parse(readFileSync(srcs.approval, 'utf8'));
      rec.bound_to.binding_hash = roleBindingHash(plan, rec.role, rec.bound_to);
      const payload = canonicalDecisionPayload(rec);
      rec.subject.assertion.nonce = sha256(payload);
      const keys = [['assertion-issuers.json', rec.subject.assertion.issuer], ['attestation-issuers.json', rec.transcription.attestation.issuer]];
      const signed = keys.map(([file, id]) => {
        const { publicKey, privateKey } = generateKeyPairSync('ed25519');
        const p = join(gov, file);
        const reg = JSON.parse(readFileSync(p, 'utf8'));
        const entry = (reg.issuers || []).find((e) => e.id === id);
        entry.verify = { ...entry.verify, public_key: publicKey.export({ type: 'spki', format: 'pem' }).toString() };
        assert.equal(entry.demo, true, `${id} must stay marked demo — the refusal is what this test asserts`);
        writeFileSync(p, JSON.stringify(reg, null, 2));
        return edSign(null, Buffer.from(payload, 'utf8'), privateKey).toString('base64');
      });
      rec.subject.assertion.signature = signed[0];
      rec.transcription.attestation.signature = signed[1];
      writeFileSync(join(base, 'approvals/pa1-risk-second-line.json'), JSON.stringify(rec, null, 2));
    }

    const { findings, count } = run(dir);
    assert.equal(count, 1);
    // The role that carries a real attestation is satisfied — nothing is reported against it
    // beyond the demo-anchor refusal, which is the harness refusing its own reference keys.
    const real = findings.filter((f) => !/is marked `"demo": true`/.test(f));
    assert.ok(!real.some((f) => /risk-second-line/.test(f)), `risk-second-line should verify:\n${real.join('\n')}`);
    assert.ok(findings.some((f) => /risk-second-line.*is marked `"demo": true`/.test(f)),
      'a demo anchor must be refused through run() too, not only in the unit path');
    // The other compiled PA1 roles have no attestation, and the gate says so for each.
    for (const role of ['product-owner', 'accountable-executive']) {
      assert.ok(findings.some((f) => f.includes(role) && /no approval attestation/.test(f)), `expected ${role} to be refused`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the PA2 stage is attested in its own right — a PA1 record cannot grant permission to launch', () => {
  // Without this, changing the stage argument on the PA2 call site to 'PA1' passes the suite —
  // and a PA1 decision would satisfy permission to launch.
  const pa1Only = {
    schema: 'loom.approval-attestation/v1',
    change_id: PLAN.change_id, stage: 'PA1', outcome: 'approved', role: 'compliance',
    subject: { registry_id: 'comp-imran' },
  };
  const pa2 = { decision: 'approved', approvals: (PLAN.required_approver_roles || []).map((role) => ({ role, by: 'po-fatima' })) };
  const f = evaluate({ ...PASSPORT, pa2 }, ATTESTED_PLAN, REGISTRY, { records: [pa1Only] });
  assert.ok(f.some((x) => /PA2 · compliance: no approval attestation/.test(x)),
    `a PA1 record must not answer for PA2:\n${f.join('\n')}`);
});

test('a plan requiring attestation but compiling no PA gate is a defect, not a pass', () => {
  const noPa = { ...ATTESTED_PLAN, required_gates: ['D', 'Q'] };
  const f = evaluate(PASSPORT, noPa, REGISTRY, {});
  assert.ok(f.some((x) => /compiles neither PA1 nor PA2 \(gates: D, Q\)/.test(x)), `expected a finding, got: ${JSON.stringify(f)}`);
  // …and without the capability it stays silent, as before.
  assert.deepEqual(evaluate(PASSPORT, { ...PLAN, required_gates: ['D', 'Q'] }, REGISTRY, {}), []);
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

// --- role quorum and delegation, through the approval path (rc.38 · flow-plan Phase 4.5) ------

const QREG = {
  groups: { builders: '', 'second-line': '' },
  identities: [
    { id: 'risk-a', kind: 'human', roles: ['risk-second-line'], groups: ['second-line'] },
    { id: 'risk-b', kind: 'human', roles: ['risk-second-line'], groups: ['second-line'] },
    { id: 'eng-1', kind: 'human', roles: ['engineering'], groups: ['builders'] },
    { id: 'dep-1', kind: 'human', roles: [], groups: [] },
  ],
  quorum: { 'risk-second-line': 2 },
};

test('a quorum role needs K DISTINCT holders — one name twice is one approval', () => {
  const one = checkApprovals([{ role: 'risk-second-line', by: 'risk-a' }], ['risk-second-line'], QREG, 'q', 'PA1', {});
  assert.ok(one.findings.some((f) => /needs a quorum of 2 distinct holders — 1 recorded/.test(f)));
  assert.deepEqual(one.missing, ['risk-second-line']);

  const twice = checkApprovals(
    [{ role: 'risk-second-line', by: 'risk-a' }, { role: 'risk-second-line', by: 'risk-a' }],
    ['risk-second-line'], QREG, 'q', 'PA1', {});
  assert.ok(twice.findings.some((f) => /1 recorded \(risk-a\)/.test(f)));

  const two = checkApprovals(
    [{ role: 'risk-second-line', by: 'risk-a' }, { role: 'risk-second-line', by: 'risk-b' }],
    ['risk-second-line'], QREG, 'q', 'PA1', {});
  assert.deepEqual(two.findings, []);
  assert.deepEqual(two.missing, []);
});

test('EVERY approval in a quorum is resolved, not just the first', () => {
  const f = checkApprovals(
    [{ role: 'risk-second-line', by: 'risk-a' }, { role: 'risk-second-line', by: 'eng-1' }],
    ['risk-second-line'], QREG, 'q', 'PA1', {}).findings;
  assert.ok(f.some((x) => /eng-1 does not hold the required role/.test(x)));
  assert.ok(f.some((x) => /eng-1 is in the builders group/.test(x)));
});

test('a deputy satisfies a required role, and the deputy approval is announced', () => {
  const reg = structuredClone(QREG);
  delete reg.quorum;
  reg.identities.find((i) => i.id === 'risk-a').delegates = [
    { to: 'dep-1', from: '2026-07-01', until: '2026-12-31', granted_by: 'risk-b' },
  ];
  const notices = [];
  const res = checkApprovals([{ role: 'risk-second-line', by: 'dep-1' }], ['risk-second-line'], reg, 'q', 'PA1',
    { notices, now: Date.parse('2026-07-28T00:00:00Z') });
  assert.deepEqual(res.findings, []);
  assert.ok(notices.some((n) => /BY DELEGATION from risk-a/.test(n)));
});

test('with no quorum declared the default is 1 — every existing passport is unaffected', () => {
  const reg = structuredClone(QREG);
  delete reg.quorum;
  assert.deepEqual(checkApprovals([{ role: 'risk-second-line', by: 'risk-a' }], ['risk-second-line'], reg, 'q', 'PA1', {}).findings, []);
});
}
