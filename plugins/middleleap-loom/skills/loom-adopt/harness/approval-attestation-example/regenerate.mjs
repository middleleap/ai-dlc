// Regenerate the approval-attestation worked example.
//
// WHY THIS EXISTS. The example record is signed FOR REAL against the bundled CHG-2026-0042 plan
// and passport — that is what makes it worth shipping, because the test suite verifies it rather
// than trusting a hand-written shape. The cost is that it binds `plan_hash`, and `plan_hash`
// changes whenever a profile gains a field. It changed when `pa1_approver_roles` landed, and the
// failure it produced was
//
//     bound_to.plan_hash does not match the compiled plan — the plan changed after the decision
//
// which is the gate working correctly and saying so. But without this script the only way to
// clear it is to regenerate keys and re-sign by hand, from a module header that says the private
// keys were "generated to sign it and DISCARDED". That is a trap, and the second person to hit it
// would have had to reverse-engineer the canonical payload to escape.
//
//   node approval-attestation-example/regenerate.mjs        (run from the harness root)
//
// THE KEYS ARE FRESH ON EVERY RUN AND NEVER WRITTEN TO DISK. Only the public halves reach the
// registries. That is deliberate and is the same rule the bundle enforces elsewhere: the shipped
// `governance/assertion-issuers.template.json` carries no usable trust material, and these example
// anchors stay marked `"demo": true` so the gate REFUSES them. An example that could actually
// authorise something would be a live root of trust in every adopting repository — which this
// bundle shipped once, and does not any more.
import { generateKeyPairSync, sign as edSign } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { canonicalDecisionPayload, passportDigest, roleBindingHash, sha256 } from '../core/approval-attestations.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const H = resolve(HERE, '..');
const J = (p) => JSON.parse(readFileSync(p, 'utf8'));
const W = (p, o) => writeFileSync(p, `${JSON.stringify(o, null, 2)}\n`);

const plan = J(`${H}/change-example/control-plan.json`);
// Use the GATE's own digest function rather than reimplementing it. The digest is over the
// analysis (`sections`) and not the whole file — recording an approval must not invalidate the
// signatures already given, which was defect #1 of the WS2 review. Recomputing that here by hand
// is how an example drifts away from the thing it is supposed to demonstrate, and my first attempt
// did exactly that: `JSON.stringify` where the gate uses a stable stringifier, and a digest that
// verified against nothing.
const digest = passportDigest(`${H}/change-example`);
if (!digest) throw new Error('no passport to digest at change-example/');

const keys = () => generateKeyPairSync('ed25519');
const pem = (k) => k.publicKey.export({ type: 'spki', format: 'pem' }).toString();
const assertionKey = keys();
const bridgeKey = keys();

const rec = {
  _comment: J(`${HERE}/pa1-risk-second-line.json`)._comment,
  schema: 'loom.approval-attestation/v1',
  change_id: 'CHG-2026-0042',
  stage: 'PA1',
  outcome: 'approved',
  role: 'risk-second-line',
  subject: {
    registry_id: 'risk-lena',
    idp_subject: 'idp|8f14e45fceea167a5a36dedd4bea2543',
    assertion: {
      mechanism: 'ed25519',
      issuer: 'demo-assertion-signer',
      subject: 'idp|8f14e45fceea167a5a36dedd4bea2543',
      audience: 'loom-approval-surface',
      acr: 'urn:mace:incommon:iap:silver',
      issued_at: '2026-07-19T11:04:00Z',
      expires_at: '2026-07-19T11:09:00Z',
    },
  },
  bound_to: {
    plan_hash: plan.plan_hash,
    passport_digest: digest,
    source_sha: '4b0bc5c1e2f3a495867d0c1b2a3948576e8f9012',
    control_plan_path: 'control-plan.json',
  },
  // rc.38 (flow-plan Phase 4.1): the narrow binding is added AFTER bound_to exists, because it
  // hashes the subject digests that live there. Generated from the compiled plan — never
  // hand-picked — so it cannot quietly cover less than the role was shown.
  origin: {
    system: 'notion',
    workspace_id: 'ws_3f9a2c',
    page_id: 'pg_7d1e4b',
    data_source_id: 'ds_approvals_1',
    event_id: 'evt_01J8ZQ4K2M',
    nonce: 'n-5260375ec23371475039',
    observed_at: '2026-07-19T11:04:07Z',
  },
  // The assertion's window must contain the SIGNED decision time, not the verification time — a
  // step-up token lives minutes and a gate re-verifies for years. Defect #2 of the WS2 review.
  validity: { issued_at: '2026-07-19T11:04:07Z', expires_at: '2099-01-01T00:00:00Z', revoked: false },
  transcription: { by: 'svc-floor-bridge', transcribed_at: '2026-07-19T11:04:09Z' },
};

// Both signatures are over the SAME canonical payload and mean different things: the human's
// assertion says a person decided; the bridge's attestation says only that it carried the decision
// faithfully. The nonce binds the assertion to this decision so it cannot be replayed onto another.
rec.bound_to.binding_hash = roleBindingHash(plan, rec.role, rec.bound_to);
const payload = canonicalDecisionPayload(rec);
rec.subject.assertion.nonce = sha256(payload);
rec.subject.assertion.signature = edSign(null, Buffer.from(payload, 'utf8'), assertionKey.privateKey).toString('base64');
rec.transcription.attestation = {
  issuer: 'demo-floor-bridge',
  signature: edSign(null, Buffer.from(payload, 'utf8'), bridgeKey.privateKey).toString('base64'),
};
W(`${HERE}/pa1-risk-second-line.json`, rec);

for (const [file, id, key] of [
  ['assertion-issuers.example.json', 'demo-assertion-signer', assertionKey],
  ['attestation-issuers.example.json', 'demo-floor-bridge', bridgeKey],
]) {
  const reg = J(`${HERE}/${file}`);
  const entry = (reg.issuers || []).find((i) => i.id === id);
  if (!entry) throw new Error(`${file}: no issuer ${id} to update — the example's shape changed`);
  entry.verify = { ...entry.verify, public_key: pem(key) };
  if (entry.demo !== true) throw new Error(`${file}: ${id} lost its "demo": true marking — refuse to ship a usable anchor`);
  W(`${HERE}/${file}`, reg);
}

process.stdout.write(`re-signed against plan_hash ${plan.plan_hash.slice(0, 12)}… and passport ${digest.slice(0, 19)}…\n`
  + 'private keys discarded; only the public halves were written, still marked "demo": true\n');
