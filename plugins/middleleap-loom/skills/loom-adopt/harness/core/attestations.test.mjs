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
