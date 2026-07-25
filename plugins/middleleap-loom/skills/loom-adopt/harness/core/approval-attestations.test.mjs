// Tests for the approval-attestation contract. Node built-in runner: `node --test`.
//
// These are the negative tests the Factory Floor plan's goal G2 names: an agent's click is void,
// an unregistered human is refused, a service key cannot vouch for a person, a replayed decision
// is rejected, and content mutated after the decision breaks the binding. They run on REAL
// ed25519 material — a signature test that never verifies a signature is a field check.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import {
  SCHEMA_ID,
  canonicalDecisionPayload,
  verifyApprovalAttestation,
  attestationRequired,
  sha256,
} from './approval-attestations.mjs';
import { resolveApprover, identityOf } from '../scripts/identity-registry-check.mjs';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// --- fixtures: two SEPARATE key namespaces, which is the point of the contract ---------------
const pem = (kp) => kp.publicKey.export({ type: 'spki', format: 'pem' });
const IDP = generateKeyPairSync('ed25519');       // the institution's identity provider
const BRIDGE = generateKeyPairSync('ed25519');    // the transcribing service
const ROGUE = generateKeyPairSync('ed25519');

const ASSERTION_ISSUERS = { issuers: [{ id: 'bank-idp', mechanism: 'ed25519', verify: { public_key: pem(IDP) } }] };
const SERVICE_ISSUERS = {
  issuers: [
    { id: 'svc-floor-bridge', mechanism: 'ed25519', verify: { public_key: pem(BRIDGE) } },
    // the same key material registered as a SERVICE issuer under an IdP-looking name
    { id: 'bank-idp-service-copy', mechanism: 'ed25519', verify: { public_key: pem(IDP) } },
  ],
};

const REGISTRY = {
  groups: { builders: ['eng-sam', 'svc-floor-bridge'], 'second-line': ['risk-lena'] },
  identities: [
    { id: 'risk-lena', kind: 'human', roles: ['risk-second-line'], groups: ['second-line'] },
    { id: 'eng-sam', kind: 'human', roles: ['engineering'], groups: ['builders'] },
    { id: 'po-fatima', kind: 'human', roles: ['product-owner'], groups: [] },
    { id: 'agent-loom-delivery', kind: 'agent', roles: [], groups: ['builders'] },
    { id: 'svc-floor-bridge', kind: 'agent', roles: [], groups: ['builders'] },
  ],
};

const PLAN = { change_id: 'CHG-2026-0117', plan_hash: 'plan-hash-abc', risk_tier: 'high' };
const PASSPORT_DIGEST = sha256('{"the":"passport as committed"}');

/** A complete, correctly-signed approval — the shape everything else deviates from. */
function validRecord(over = {}) {
  const base = {
    schema: SCHEMA_ID,
    change_id: 'CHG-2026-0117',
    stage: 'PA1',
    outcome: 'approved',
    role: 'risk-second-line',
    subject: {
      registry_id: 'risk-lena',
      idp_subject: 'idp|0f3c9a11-immutable',
      assertion: { mechanism: 'ed25519', issuer: 'bank-idp', subject: 'idp|0f3c9a11-immutable', expires_at: '2099-01-01T00:00:00Z' },
    },
    bound_to: {
      plan_hash: 'plan-hash-abc',
      passport_digest: PASSPORT_DIGEST,
      source_sha: 'a3f9c21bd4e5f60718293a4b5c6d7e8f90123456',
    },
    origin: { system: 'notion', workspace_id: 'ws_1', page_id: 'pg_1', event_id: 'evt_1', nonce: 'nonce-1' },
    validity: { issued_at: '2026-07-25T09:00:00Z', expires_at: '2099-01-01T00:00:00Z', revoked: false },
    transcription: { by: 'svc-floor-bridge' },
  };
  // Merge the nested blocks against the DEFAULTS (a blanket spread would clobber them).
  return {
    ...base,
    ...over,
    subject: {
      ...base.subject,
      ...over.subject,
      assertion: { ...base.subject.assertion, ...over.subject?.assertion },
    },
    bound_to: { ...base.bound_to, ...over.bound_to },
    origin: { ...base.origin, ...over.origin },
    validity: { ...base.validity, ...over.validity },
    transcription: { ...base.transcription, ...over.transcription },
  };
}

/** Sign a record the way a correct pipeline would: the human binds, then the bridge transcribes. */
function signed(rec, { idpKey = IDP.privateKey, bridgeKey = BRIDGE.privateKey } = {}) {
  const withNonce = { ...rec, subject: { ...rec.subject, assertion: { ...rec.subject.assertion } } };
  withNonce.subject.assertion.nonce = sha256(canonicalDecisionPayload(withNonce));
  const payload = canonicalDecisionPayload(withNonce);
  withNonce.subject.assertion.signature = sign(null, Buffer.from(payload, 'utf8'), idpKey).toString('base64');
  withNonce.transcription = {
    ...withNonce.transcription,
    attestation: { issuer: 'svc-floor-bridge', signature: sign(null, Buffer.from(payload, 'utf8'), bridgeKey).toString('base64') },
  };
  return withNonce;
}

const ctx = (over = {}) => ({
  stage: 'PA1',
  role: 'risk-second-line',
  by: 'risk-lena',
  plan: PLAN,
  passportDigest: PASSPORT_DIGEST,
  registry: REGISTRY,
  issuers: SERVICE_ISSUERS,
  assertionIssuers: ASSERTION_ISSUERS,
  resolveApprover,
  identityOf,
  seen: new Map(),
  now: Date.parse('2026-07-25T10:00:00Z'),
  ...over,
});

const failsWith = (rec, re, c = ctx()) => {
  const findings = verifyApprovalAttestation(rec, c);
  assert.ok(findings.some((f) => re.test(f)), `expected a finding matching ${re}\ngot: ${JSON.stringify(findings, null, 2)}`);
};

// --- the happy path --------------------------------------------------------------------------

test('a correctly signed, correctly bound approval verifies for REAL', () => {
  assert.deepEqual(verifyApprovalAttestation(signed(validRecord()), ctx()), []);
});

test('the canonical payload is deterministic and covers what was approved', () => {
  const p = canonicalDecisionPayload(validRecord());
  for (const bound of ['CHG-2026-0117', 'PA1', 'risk-lena', 'plan-hash-abc', PASSPORT_DIGEST, 'nonce-1', '2026-07-25T09:00:00Z']) {
    assert.ok(p.includes(bound), `payload must bind ${bound}`);
  }
});

test('the claimed decision time is signed — a carrier cannot back-date a decision', () => {
  const rec = signed(validRecord());
  rec.validity = { ...rec.validity, issued_at: '2026-01-01T00:00:00Z' };
  failsWith(rec, /does NOT verify/);
});

test('a newline inside a field cannot forge a different record with the same payload', () => {
  // Delimiter injection: with a bare newline join, a value containing a newline could shift the
  // remaining fields so two DIFFERENT records signed the same string. Encoding makes it one-to-one.
  const a = canonicalDecisionPayload(validRecord({ change_id: 'CHG-1\nPA1', stage: '' }));
  const b = canonicalDecisionPayload(validRecord({ change_id: 'CHG-1', stage: 'PA1' }));
  assert.notEqual(a, b, 'a newline in a field must not be able to impersonate a field boundary');
});

// --- finding F1: the signature must authenticate the HUMAN, not the worker --------------------

test('a record with no subject assertion proves only that a service wrote a file', () => {
  const rec = signed(validRecord());
  delete rec.subject.assertion;
  failsWith(rec, /subject\.assertion missing/);
});

test('a SERVICE key cannot vouch for a human — the bridge signing the assertion is refused', () => {
  const rec = signed(validRecord({ subject: { assertion: { issuer: 'svc-floor-bridge' } } }), { idpKey: BRIDGE.privateKey });
  failsWith(rec, /registered SERVICE attestation issuer|transcribes, it never vouches/);
});

test('an identity-provider key registered as a service issuer is still refused as an assertion issuer', () => {
  const rec = signed(validRecord({ subject: { assertion: { issuer: 'bank-idp-service-copy' } } }));
  failsWith(rec, /registered SERVICE attestation issuer/);
});

test('an unpinned identity provider is not trusted', () => {
  const rec = signed(validRecord({ subject: { assertion: { issuer: 'some-other-idp' } } }));
  failsWith(rec, /not in the assertion-issuers registry/);
});

test('a forged assertion signature does not verify — this is crypto, not a field check', () => {
  const rec = signed(validRecord(), { idpKey: ROGUE.privateKey });
  failsWith(rec, /does NOT verify/);
});

test('an AGENT cannot approve, however well signed the record is', () => {
  const rec = signed(validRecord({ subject: { registry_id: 'agent-loom-delivery' } }));
  failsWith(rec, /is an AGENT — agents prepare evidence, they never approve/, ctx({ by: 'agent-loom-delivery' }));
});

test('an unregistered human is refused', () => {
  const rec = signed(validRecord({ subject: { registry_id: 'nobody-at-all' } }));
  failsWith(rec, /not in the registry/, ctx({ by: 'nobody-at-all' }));
});

test('an approver who does not hold the role is refused', () => {
  const rec = signed(validRecord({ subject: { registry_id: 'po-fatima' } }));
  failsWith(rec, /does not hold the required role risk-second-line/, ctx({ by: 'po-fatima' }));
});

test('the transcriber may not also be the approver', () => {
  const rec = signed(validRecord({ transcription: { by: 'risk-lena' } }));
  failsWith(rec, /custody and decision must be separable/);
});

test('an unsigned transcription is a finding — custody is evidenced, not assumed', () => {
  const rec = signed(validRecord());
  delete rec.transcription.attestation;
  failsWith(rec, /no attestation/);
});

test('the immutable identity-provider subject is required — a workspace person id is not enough', () => {
  const rec = signed(validRecord());
  delete rec.subject.idp_subject;
  failsWith(rec, /idp_subject missing/);
});

// --- finding F2: bound to the exact thing approved -------------------------------------------

test('an approval whose plan hash does not match the compiled plan is refused', () => {
  const rec = signed(validRecord({ bound_to: { plan_hash: 'plan-hash-STALE' } }));
  failsWith(rec, /plan_hash does not match the compiled plan/);
});

test('content mutated after the decision breaks the binding', () => {
  const rec = signed(validRecord());
  failsWith(rec, /passport_digest does not match/, ctx({ passportDigest: sha256('{"the":"passport, edited later"}') }));
});

test('an assertion nonce that does not bind the payload could be replayed onto another decision', () => {
  const rec = signed(validRecord());
  rec.subject.assertion.nonce = sha256('a different decision entirely');
  failsWith(rec, /does not bind the decision payload/);
});

test('PA1 binds a source state; PA2 binds the built artifact, not a commit', () => {
  const noSha = signed(validRecord({ bound_to: { source_sha: '' } }));
  failsWith(noSha, /PA1 requires bound_to\.source_sha/);
  const pa2 = signed(validRecord({ stage: 'PA2' }));
  failsWith(pa2, /PA2 requires bound_to\.artifact_digest/, ctx({ stage: 'PA2' }));
});

test('the record must agree with the passport it evidences', () => {
  failsWith(signed(validRecord({ stage: 'PA2' })), /stage .* does not match/);
  failsWith(signed(validRecord({ role: 'compliance' })), /role .* does not match/);
  failsWith(signed(validRecord({ outcome: 'rejected' })), /only an approved decision evidences an approval/);
  failsWith(signed(validRecord({ subject: { registry_id: 'po-fatima' } })), /is not the approver named in the passport/);
});

// --- replay, expiry, revocation, schema ------------------------------------------------------

test('a replayed decision nonce is rejected — a nonce is single-use', () => {
  const c = ctx();
  const first = signed(validRecord());
  assert.deepEqual(verifyApprovalAttestation(first, c, 'first'), []);
  const second = signed(validRecord({ origin: { event_id: 'evt_2' } }));
  assert.ok(verifyApprovalAttestation(second, c, 'second').some((f) => /nonce replays first/.test(f)));
});

test('a replayed webhook event id is rejected — webhooks are signals, deduplicated', () => {
  const c = ctx();
  verifyApprovalAttestation(signed(validRecord()), c, 'first');
  const replay = signed(validRecord({ origin: { nonce: 'nonce-2' } }));
  assert.ok(verifyApprovalAttestation(replay, c, 'second').some((f) => /event_id replays first/.test(f)));
});

test('an expired or revoked attestation does not count', () => {
  failsWith(signed(validRecord({ validity: { expires_at: '2026-01-01T00:00:00Z' } })), /expired at/);
  failsWith(signed(validRecord({ validity: { revoked: true } })), /revoked/);
});

// A step-up ID token lives minutes; a gate re-verifies for years. Judging the assertion against
// VERIFICATION time would make every genuine approval rot on a timer — the contract would be
// unusable with the very mechanism it recommends. It is judged against the signed decision time.
test('a short-lived assertion stays valid long after it expired — it is judged at the decision', () => {
  const rec = signed(validRecord({
    validity: { issued_at: '2026-07-19T11:04:07Z' },
    subject: { assertion: { issued_at: '2026-07-19T11:04:00Z', expires_at: '2026-07-19T11:09:00Z' } },
  }));
  // verified a year later — still valid, because the human held a live assertion when they decided
  assert.deepEqual(verifyApprovalAttestation(rec, ctx({ now: Date.parse('2027-07-19T00:00:00Z') })), []);
});

test('an assertion that had already expired when the decision was made is refused', () => {
  const rec = signed(validRecord({
    validity: { issued_at: '2026-07-19T12:00:00Z' },
    subject: { assertion: { issued_at: '2026-07-19T11:04:00Z', expires_at: '2026-07-19T11:09:00Z' } },
  }));
  failsWith(rec, /had already expired when the decision was made/);
});

test('an assertion issued after the decision it attests is refused', () => {
  const rec = signed(validRecord({
    validity: { issued_at: '2026-07-19T11:00:00Z' },
    subject: { assertion: { issued_at: '2026-07-19T11:04:00Z', expires_at: '2026-07-19T11:09:00Z' } },
  }));
  failsWith(rec, /issued after the decision it attests/);
});

test('without a signed decision time the assertion window cannot be judged', () => {
  const rec = signed(validRecord({ validity: { issued_at: '' } }));
  failsWith(rec, /without a signed decision time/);
});

test('an unversioned record cannot be verified at all', () => {
  failsWith({ ...signed(validRecord()), schema: 'something.else/v9' }, /is not loom\.approval-attestation\/v1/);
  failsWith(null, /no approval attestation/);
});

test('platform mechanisms report UNVERIFIED-HERE rather than pretending', () => {
  const rec = signed(validRecord({ subject: { assertion: { mechanism: 'oidc-step-up' } } }));
  failsWith(rec, /UNVERIFIED-HERE/);
});

test('with no pinned identity-provider material the assertion is UNVERIFIED-HERE, never a pass', () => {
  failsWith(signed(validRecord()), /UNVERIFIED-HERE/, ctx({ assertionIssuers: null }));
});

// --- mandatory-when-compiled -----------------------------------------------------------------

test('attestation-backed approval is required only when the compiled plan says so', () => {
  assert.equal(attestationRequired({ required_capabilities: { 'approval_attestation': { required: true } } }), true);
  assert.equal(attestationRequired({ required_capabilities: { 'approval_attestation': { required: false } } }), false);
  assert.equal(attestationRequired({}), false);
  assert.equal(attestationRequired(null), false);
});

// --- the SHIPPED worked example ---------------------------------------------------------------
// The bundled record is signed against the bundled plan and passport. Verifying it here is what
// keeps the example honest: if the passport is edited and the example is not re-signed, this
// fails — which is the same binding the gate enforces for a real approval.

const HARNESS = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const F = (p) => `${HARNESS}/${p}`;
const EXAMPLE = F('approval-attestation-example/pa1-risk-second-line.json');
if (!existsSync(EXAMPLE)) {
  test('shipped approval-attestation example (bundle-only — skipped in an adopted layout)', { skip: true }, () => {});
} else {
  const J = (p) => JSON.parse(readFileSync(F(p), 'utf8'));
  const exampleCtx = () => ({
    stage: 'PA1',
    role: 'risk-second-line',
    by: 'risk-lena',
    plan: J('change-example/control-plan.json'),
    passportDigest: sha256(readFileSync(F('change-example/product-passport.json'), 'utf8')),
    registry: J('governance/identities.template.json'),
    issuers: J('governance/attestation-issuers.template.json'),
    assertionIssuers: J('governance/assertion-issuers.template.json'),
    resolveApprover,
    identityOf,
    seen: new Map(),
    now: Date.parse('2026-07-25T00:00:00Z'),
  });

  test('the shipped approval attestation verifies for REAL against the bundled plan and passport', () => {
    assert.deepEqual(verifyApprovalAttestation(JSON.parse(readFileSync(EXAMPLE, 'utf8')), exampleCtx()), []);
  });

  test('editing the approved passport breaks the shipped example — the binding is live, not decorative', () => {
    const c = exampleCtx();
    c.passportDigest = sha256('{"the passport":"as edited after the decision"}');
    assert.ok(verifyApprovalAttestation(JSON.parse(readFileSync(EXAMPLE, 'utf8')), c)
      .some((f) => /passport_digest does not match/.test(f)));
  });

  test('a flipped byte in the shipped assertion signature fails — real crypto, not a field check', () => {
    const rec = JSON.parse(readFileSync(EXAMPLE, 'utf8'));
    const sig = Buffer.from(rec.subject.assertion.signature, 'base64');
    sig[0] ^= 0xff;
    rec.subject.assertion.signature = sig.toString('base64');
    assert.ok(verifyApprovalAttestation(rec, exampleCtx()).some((f) => /does NOT verify/.test(f)));
  });
}
