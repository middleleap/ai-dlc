// discovery-attest: the records the seam carries BEFORE code exists and AFTER deploy — intent,
// problem-selected, discovery-stopped, the two NPA receipts, and reopened-discovery — are built
// from the run's own artifacts (never typed), bound to a run trail, signed, and pass the same
// provenance rules as a gate record. A decision record from an agent is refused.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { intentPayload, problemSelectedPayload, discoveryStoppedPayload, reopenedDiscoveryPayload, npaPackPayload, npaApprovedPayload, envelopeFor, NAMES } from './discovery-attest.mjs';
import { evaluateProvenance, signEnvelope } from '../core/provenance.mjs';

const H = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RUN = join(H, 'demo/meridian/discovery-run');
const STOPPED = join(H, 'demo/meridian/discovery-run-stopped');
const FORM = join(H, '../../../../middleleap-npa-uae/skills/npa-uae/references/example-cross-bank-money.md');
const DECISION = join(H, 'demo/meridian/npa/decision.json');
const SIGNALS = join(H, 'demo/meridian/operations-signal.json');
// The Meridian fixtures are the bundle's own demonstration data; adopt.mjs does not ship them, so in
// an adopted tree (CI's adoption dry-run runs this suite there) these tests skip rather than fail.
const HAVE_FIXTURES = [RUN, STOPPED, DECISION, SIGNALS].every(existsSync);
const fx = { skip: !HAVE_FIXTURES && 'Meridian demo fixtures are not shipped to adopted trees' };
const fxForm = { skip: (!HAVE_FIXTURES && 'Meridian demo fixtures are not shipped to adopted trees') || (!existsSync(FORM) && 'sibling plugin middleleap-open-finance not present') };
const COMMIT = 'a'.repeat(40);
const RUNNER = { subject: 'repo:demo-bank/credit:ref:refs/heads/main', repository: 'demo-bank/credit', ref: 'refs/heads/main', sha: COMMIT };
const REGISTRY = { identities: [
  { id: 'po-fatima', kind: 'human', roles: ['product-owner'] },
  { id: 'exec-rashid', kind: 'human', roles: ['accountable-executive'] },
  { id: 'ops-dana', kind: 'human', roles: ['operations'] },
  { id: 'agent-loom-delivery', kind: 'agent', model: { model_id: 'example-model@2026-01' } },
] };
const keys = generateKeyPairSync('ed25519');
const ISSUERS = { issuers: [{ id: 't-signer', mechanism: 'ed25519', verify: { public_key: keys.publicKey.export({ type: 'spki', format: 'pem' }).toString() } }] };
const signer = { issuer: 't-signer', privateKeyPem: keys.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString() };
const signedOk = (env) => evaluateProvenance(signEnvelope(env, signer), { registry: REGISTRY, issuers: ISSUERS });

test('intent: the sponsor, the strategic intent and the statement come from intent.md, sources from its front-matter', fx, () => {
  const p = intentPayload(RUN);
  assert.equal(p.run, 'cross-bank-money');
  assert.equal(p.sponsor, 'po-fatima');
  assert.equal(p.strategic_intent, 'SI-03');
  assert.match(p.statement, /everyday money decisions/);
  assert.ok(p.sources.includes('S-002'));
});

test('problem-selected: the falsifiable problem, H1–H3, the evidence ids, and that D4 refused solutioning', fx, () => {
  const p = problemSelectedPayload(RUN);
  assert.equal(p.run, 'cross-bank-money');
  assert.match(p.problem, /^For /);
  assert.deepEqual(p.hypotheses.map((h) => h.id), ['H1', 'H2', 'H3']);
  assert.match(p.hypotheses[2].text, /separate proposition/);
  assert.ok(p.evidence.includes('S-001') && p.evidence.includes('S-009'));
  assert.equal(p.refused_solutioning, true);
});

test('discovery-stopped: the stopped run yields a human-decided stop with hypothesis verdicts', fx, () => {
  const p = discoveryStoppedPayload(STOPPED);
  assert.equal(p.outcome, 'stopped');
  assert.equal(typeof p.decided_by, 'string');
  assert.ok(p.hypotheses.length >= 1);
});

test('reopened-discovery: a signal routed discovery names the run it reopens and the change that sent it back', fx, () => {
  const p = reopenedDiscoveryPayload(SIGNALS, 'OPS-2026-0912');
  assert.equal(p.reopened_run, 'cross-bank-money');
  assert.equal(p.sent_back_by_change, 'CHG-2026-0042');
  assert.equal(p.signal_type, 'customer-signal');
  assert.throws(() => reopenedDiscoveryPayload(SIGNALS, 'OPS-0000'), /not in/);
});

test('npa-pack: the Business Proposition Form is read, not typed — 33 fields, request type, obligations by id, digest', fxForm, () => {
  const p = npaPackPayload(FORM, { propositionId: 'NPA-2026-CBM-001' });
  assert.equal(p.proposition_id, 'NPA-2026-CBM-001');
  assert.equal(p.request_type, 'New');
  assert.equal(p.fields_present, 33);
  assert.equal(p.status, 'complete');
  assert.ok(p.obligations_cited.includes('OB-AE-OFR-CONSENT-001'));
  assert.ok(p.obligations_cited.includes('OB-AE-MTPOL-PSI-001'), 'the boundary obligation is cited too');
  assert.match(p.form_sha256, /^[0-9a-f]{64}$/);
  assert.match(p.product, /Cross-Bank Money/);
});

test('npa-approved: the PA1 decision reads back with its six conditions', fx, () => {
  const p = npaApprovedPayload(DECISION);
  assert.equal(p.receipt, 'PA1');
  assert.equal(p.decision, 'approved-with-conditions');
  assert.equal(p.approved_by, 'exec-rashid');
  assert.equal(p.conditions.length, 6);
});

test('every kind builds an envelope on the run trail that passes the provenance rules once signed', fx, () => {
  const cases = [
    ['intent', intentPayload(RUN), 'po-fatima', 'human'],
    ['problem-selected', problemSelectedPayload(RUN), 'po-fatima', 'human'],
    ['discovery-stopped', discoveryStoppedPayload(STOPPED), 'po-fatima', 'human'],
    ['npa-approved', npaApprovedPayload(DECISION), 'exec-rashid', 'human'],
    ['reopened-discovery', reopenedDiscoveryPayload(SIGNALS, 'OPS-2026-0912'), 'ops-dana', 'human'],
  ];
  for (const [kind, payload, actorId, origin] of cases) {
    const env = envelopeFor(kind, { run: 'cross-bank-money', payload, actor: REGISTRY.identities.find((i) => i.id === actorId), origin, commit: COMMIT, runner: RUNNER });
    assert.equal(env.subject.flow, 'discovery');
    assert.equal(env.subject.trail, 'cross-bank-money');
    assert.equal(env.name, NAMES[kind](payload));
    assert.deepEqual(signedOk(env), [], `${kind}: ${signedOk(env).join('; ')}`);
  }
});

test('a decision record — problem-selected or npa-approved — from an agent is refused before it is built', fx, () => {
  const agent = REGISTRY.identities.find((i) => i.id === 'agent-loom-delivery');
  assert.throws(() => envelopeFor('npa-approved', { run: 'cross-bank-money', payload: npaApprovedPayload(DECISION), actor: agent, origin: 'tool', commit: COMMIT, runner: RUNNER }), /human/);
  assert.throws(() => envelopeFor('problem-selected', { run: 'cross-bank-money', payload: problemSelectedPayload(RUN), actor: agent, origin: 'tool', commit: COMMIT, runner: RUNNER }), /human/);
});

test('npa-pack carries the obligations it cites as controls.institution, never typed', fxForm, () => {
  const payload = npaPackPayload(FORM, { propositionId: 'NPA-2026-CBM-001' });
  const env = envelopeFor('npa-pack', { run: 'cross-bank-money', payload, actor: REGISTRY.identities[0], origin: 'human', commit: COMMIT, runner: RUNNER });
  assert.deepEqual(env.controls.institution, payload.obligations_cited);
  assert.equal(env.controls.controls_source, 'business-proposition-form');
  assert.deepEqual(signedOk(env), []);
});
