// Tests for attestation verification. Node built-in runner: `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyAnchorAttestation } from './attestations.mjs';

const HARNESS = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const J = (...candidates) => {
  const p = candidates.map((c) => `${HARNESS}/${c}`).find(existsSync);
  return JSON.parse(readFileSync(p, 'utf8'));
};
// The evidence manifest resolves in BOTH layouts: the bundle (evidence-example/) and an adopted
// repo that mounted it (docs/governance/evidence/). In a BARE adoption it is in neither, so skip
// cleanly rather than crash at module load.
//
// The `attestation` check is load-bearing, not defensive. These three tests exercise the SHIPPED
// EXAMPLE's signed anchor — they need the example's own signature to verify against. An adopter
// who follows the adoption guide ("adapt evidence-example/ into docs/governance/evidence/") and
// then assembles a REAL bundle from their own release has a manifest at that path with a
// different anchor and, until they sign it, no attestation at all. Resolving on existence alone
// pointed these tests at that bundle and failed a repository for doing exactly what it was told:
// one assertion failure and two TypeErrors on `MANIFEST.attestation.signature`.
//
// So: run when the manifest carries an attestation to verify, skip when it does not. A mounted
// copy of the example still runs them; an adopter's own unsigned bundle is not this suite's
// business. Found by assembling a real bundle in an adopted repo.
const MANIFEST_PATH = ['evidence-example/manifest.json', 'docs/governance/evidence/manifest.json']
  .map((c) => `${HARNESS}/${c}`).find(existsSync);
const HAS_ATTESTATION = MANIFEST_PATH
  && JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')).attestation !== undefined;
if (!HAS_ATTESTATION) {
  test('attestation verification (no attested manifest resolved — nothing to verify against)', { skip: true }, () => {});
} else {
const MANIFEST = J('evidence-example/manifest.json', 'docs/governance/evidence/manifest.json');
const ISSUERS = J('governance/attestation-issuers.template.json', 'docs/governance/attestation-issuers.json');

test('the shipped example anchor attestation verifies for REAL (ed25519)', () => {
  assert.deepEqual(verifyAnchorAttestation(MANIFEST, ISSUERS), []);
});

test('a flipped signature byte fails — this is crypto, not a field check', () => {
  const sig = Buffer.from(MANIFEST.attestation.signature, 'base64');
  sig[0] ^= 0xff;
  const doctored = { ...MANIFEST, attestation: { ...MANIFEST.attestation, signature: sig.toString('base64') } };
  assert.ok(verifyAnchorAttestation(doctored, ISSUERS).some((f) => /does NOT verify/.test(f)));
});

test('a recomputed anchor no longer matches the signature', () => {
  const doctored = { ...MANIFEST, anchor: 'a'.repeat(64) };
  assert.ok(verifyAnchorAttestation(doctored, ISSUERS).some((f) => /does NOT verify/.test(f)));
});

test('an unregistered issuer does not count, however valid its signature', () => {
  const { privateKey } = generateKeyPairSync('ed25519');
  const signature = sign(null, Buffer.from(MANIFEST.anchor), privateKey).toString('base64');
  const rogue = { ...MANIFEST, attestation: { issuer: 'rogue-signer', signature } };
  assert.ok(verifyAnchorAttestation(rogue, ISSUERS).some((f) => /not in the allowed-issuers registry/.test(f)));
});

test('a missing attestation or anchor is a finding, not a silent pass', () => {
  assert.match(verifyAnchorAttestation({ anchor: 'x' }, ISSUERS)[0], /no attestation/);
  assert.match(verifyAnchorAttestation({ attestation: { issuer: 'demo-anchor-signer' } }, ISSUERS)[0], /no anchor/);
});

test('platform mechanisms report UNVERIFIED-HERE rather than pretending', () => {
  const m = { ...MANIFEST, attestation: { issuer: 'bank-ci', signature: 'whatever' } };
  assert.ok(verifyAnchorAttestation(m, ISSUERS).some((f) => /UNVERIFIED-HERE/.test(f)));
});
}
