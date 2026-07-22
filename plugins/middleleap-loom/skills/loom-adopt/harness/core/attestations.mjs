// The attestation contract's verification half (Loom 2.0 §6). A gate that checks a
// signature field is non-empty is a field check, not a control — verification means
// resolving the issuer in the allowed-issuers registry and cryptographically checking the
// signature against that issuer's verification material.
//
// Reference mechanism shipped here: `ed25519` — the registry entry carries a PEM public
// key, the attestation carries a base64 signature over the evidence anchor, and Node's
// crypto verifies it for real (negative-tested: a flipped byte fails). `sigstore` and
// `github-attestation` entries declare platform mechanisms the adopter wires in CI; this
// module reports them as UNVERIFIED-HERE rather than pretending — an honest gap, not a
// silent pass.
import { createPublicKey, verify as cryptoVerify } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

export const ISSUERS_LOCATIONS = ['docs/governance/attestation-issuers.json', 'attestation-issuers.json'];

export function loadIssuers(cwd = process.cwd()) {
  const path = ISSUERS_LOCATIONS.map((p) => `${cwd}/${p}`).find(existsSync);
  if (!path) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

/**
 * Verify one attestation ({issuer, signature}) over an arbitrary payload STRING against the
 * issuers registry. This is the general primitive: a record counts as authentically signed
 * only when its issuer is registered and the signature cryptographically checks out.
 * `what` labels the payload for the message. Findings ([] ⇒ authentically signed).
 */
export function verifySignatureOver(payload, att, issuers, what = 'payload') {
  if (!att) return [`no attestation — the ${what} is unsigned`];
  const issuer = (issuers?.issuers || []).find((i) => i.id === att.issuer);
  if (!issuer) return [`attestation issuer ${JSON.stringify(att.issuer)} is not in the allowed-issuers registry — an unregistered signer does not count`];
  if (issuer.mechanism === 'ed25519') {
    const pem = issuer.verify?.public_key;
    if (!pem) return [`issuer ${issuer.id}: mechanism ed25519 but no public_key in the registry`];
    let ok = false;
    try {
      ok = cryptoVerify(null, Buffer.from(payload, 'utf8'), createPublicKey(pem), Buffer.from(att.signature || '', 'base64'));
    } catch (e) {
      return [`issuer ${issuer.id}: signature verification errored (${e.message})`];
    }
    if (!ok) return [`attestation signature does NOT verify over the ${what} for issuer ${issuer.id}`];
    return [];
  }
  return [`issuer ${issuer.id}: mechanism ${JSON.stringify(issuer.mechanism)} is verified by the platform (CI), not by this module — wire it per the registry and record activation evidence; until then this attestation is UNVERIFIED-HERE`];
}

/**
 * Verify an evidence manifest's anchor attestation against the issuers registry.
 * Findings ([] ⇒ the anchor is authentically signed by a registered issuer).
 */
export function verifyAnchorAttestation(manifest, issuers) {
  if (!manifest?.attestation) return ['evidence manifest carries no attestation — the anchor is unsigned'];
  if (!manifest?.anchor) return ['evidence manifest has no anchor to attest'];
  return verifySignatureOver(manifest.anchor, manifest.attestation, issuers, 'anchor')
    .map((f) => f.replace('does NOT verify over the anchor', 'does NOT verify over the anchor — the seal is not authentically anchored'));
}
