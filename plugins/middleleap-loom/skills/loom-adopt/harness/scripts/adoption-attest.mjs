// The adoption-attestation gate (Loom 2.0-rc.14 · WS5). `loom attest-adoption` produces a SIGNED
// adoption report — the machine-checkable claim "this repository has adopted the Loom to stage N".
// This gate verifies it, and its central rule closes F7's gap: a signed adoption report cannot be
// produced while ANY mandatory item is adopt-pending. Installation being automated is not adoption;
// an attestation over a half-configured repo would be a false green.
//
//   · the live status (adoption-status.mjs) must have NO adopt-pending mandatory items,
//   · the attestation must be signed by a REGISTERED issuer (ed25519) over its canonical hash,
//   · the attester must resolve to a non-agent identity (an agent cannot certify its own adoption),
//   · the attestation must be fresh.
//
// Honesty (rc.2 invariant): the bundle ships the verifier; the signature is produced adopter-side by
// the adopter's key when they run `attest-adoption` on a fully-configured repo.
//
// Run from the adopted repo root: `node scripts/adoption-attest.mjs`.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import process from 'node:process';
import { loadIssuers, verifySignatureOver } from '../core/attestations.mjs';
import { computeStatus } from './adoption-status.mjs';
import { pathToFileURL } from 'node:url';

const ATTEST_LOCATIONS = ['docs/governance/adoption-attestation.json', 'adoption-attestation.json'];
const IDENTITY_LOCATIONS = ['docs/governance/identities.json', 'identities.json'];
const DAY = 86_400_000;

function canonical(v) {
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
  if (v && typeof v === 'object') return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}`;
  return JSON.stringify(v);
}
export function attestationHash(record) {
  const { attestation, ...rest } = record;
  return createHash('sha256').update(canonical(rest)).digest('hex');
}

/** Findings ([] ⇒ the adoption is fully configured and authentically attested). */
export function evaluate(status, attestation, { issuers, registry, now = Date.now(), maxAgeDays = 365 } = {}) {
  const findings = [];
  // The gate's reason for being: no signature over an adopt-pending repo.
  if (status?.adoptPending) {
    findings.push(`adoption is not complete — ${status.unresolved.length} item(s) still adopt-pending; a signed adoption report cannot be produced until they are resolved`);
    for (const f of status.unresolved.slice(0, 10)) findings.push(`  adopt-pending: ${f}`);
  }
  if (!attestation) { findings.push('no adoption-attestation.json — run `attest-adoption` on a fully-configured repo to produce one'); return findings; }

  if (!attestation.attested_at || Number.isNaN(Date.parse(attestation.attested_at))) findings.push('attestation has no ISO-8601 attested_at');
  else if (now - Date.parse(attestation.attested_at) > maxAgeDays * DAY) findings.push('adoption attestation is stale — re-attest');

  const who = (registry?.identities || []).find((i) => i.id === attestation.attested_by);
  if (!attestation.attested_by) findings.push('attestation names no attested_by');
  else if (registry && (!who || who.kind === 'agent')) findings.push(`attested_by ${JSON.stringify(attestation.attested_by)} does not resolve to a human identity — an agent cannot certify its own adoption`);

  findings.push(...verifySignatureOver(attestationHash(attestation), attestation.attestation, issuers, 'adoption attestation'));
  return findings;
}

export function run(cwd = process.cwd()) {
  const status = computeStatus(cwd);
  const attPath = ATTEST_LOCATIONS.map((p) => `${cwd}/${p}`).find(existsSync);
  const attestation = attPath ? JSON.parse(readFileSync(attPath, 'utf8')) : null;
  const issuers = loadIssuers(cwd) || loadIssuers(`${cwd}/..`);
  const idPath = IDENTITY_LOCATIONS.map((p) => `${cwd}/${p}`).find(existsSync);
  const registry = idPath ? JSON.parse(readFileSync(idPath, 'utf8')) : null;
  return evaluate(status, attestation, { issuers, registry });
}

// CLI (skipped when imported by the test suite).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const findings = run();
  if (findings.length) {
    process.stderr.write('\nAdoption-attestation gate (rc.14 · WS5) — NOT ATTESTED\n\n');
    for (const f of findings) process.stderr.write(`  - ${f}\n`);
    process.stderr.write('\nInstallation is not adoption. Resolve every adopt-pending item, then sign the adoption\nreport with your organisation\'s key. See docs/governance/activation-runbook.md.\n');
    process.exit(1);
  }
  process.stdout.write('Adoption-attestation gate (rc.14 · WS5) — fully configured and authentically attested. OK\n');
}
