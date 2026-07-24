// The release-attestation gate (Loom 2.0-rc.11 — WS1). The release-subject gate proves the
// subject is coherent; the evidence-seal gate proves the bundle is intact; the attestations module
// proves the anchor is signed. This gate is the CROSS-BINDING that makes them one chain: it proves
// source, artifact, evaluations and the sealed anchor all name the SAME immutable artifact digest —
// so evidence cannot be reused for a different build, and an eval against the source head that
// never touched the built artifact cannot pass (closes F1: the eval binds to the artifact digest,
// a value that exists only AFTER the commit, dissolving the self-reference).
//
//   source binds     evidence manifest.release_commit == release-subject.source.commit
//   artifact binds    the sealed provenance's subject digest == release-subject.artifact.digest
//   evals bind        every product eval names release-subject.artifact.digest (evaluated_artifact)
//   anchor is signed  the evidence anchor verifies against an approved registry issuer
//
// Release lane. Absence of a release-subject is OK for a generic repo, but once any governed change
// is in production a production release MUST be artifact-bound (mandatory-when-compiled).
//
// Honesty (rc.2 invariant): this proves the RECORDS agree on the digest and the anchor is
// authentically signed. It does NOT observe the live registry or the running deployment — that is
// the platform's job (WS2 activation adapters). A public bundle binds the evidence; the live
// observation is the adopter's.
//
// Run from the repo root: `node scripts/release-attestation-check.mjs` (exit 1 on any finding).
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { aggregateRequirements } from '../core/compiled-requirements.mjs';
import { verifyAnchorAttestation, loadIssuers } from '../core/attestations.mjs';
import { evaluate as evaluateSubject } from './release-subject-check.mjs';
import { pathToFileURL } from 'node:url';

const SUBJECT_LOCATIONS = ['docs/governance/release-subject.json', 'release-subject.json'];
const MANIFEST_LOCATIONS = ['docs/governance/evidence/manifest.json', 'evidence-manifest.json', 'evidence-example/manifest.json'];
const PRODUCT_LOCATIONS = ['docs/governance/product-evals.json', 'product-evals.json', 'product-eval-example/product-evals.json'];

const bare = (d) => (typeof d === 'string' ? d.replace(/^sha256:/, '') : d);
const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };
const find = (cwd, locs) => locs.map((p) => `${cwd}/${p}`).find(existsSync) || null;

/**
 * Cross-binding findings. Empty ⇒ source, artifact, evals and the anchor all name one digest.
 * Pure over already-loaded records so it is unit-testable without a filesystem.
 */
export function evaluate({ subject, manifest, provenanceArtifact, productEvals, issuers, anyInProduction = false }) {
  const findings = [];
  if (!subject) {
    if (anyInProduction) findings.push('no release-subject.json, but a governed change is in production — a production release must be bound to an immutable artifact (rc.11)');
    return findings;
  }
  // The subject must itself be coherent before anything binds to it.
  for (const f of evaluateSubject(subject, { anyInProduction })) findings.push(`release subject: ${f}`);
  const digest = subject.artifact && subject.artifact.digest;

  // 1. source binds to evidence.
  if (!manifest) findings.push('no evidence manifest to bind the subject to — the release is unsealed');
  else if (manifest.release_commit !== subject.source?.commit) {
    findings.push(`evidence manifest release_commit ${JSON.stringify(manifest.release_commit)} ≠ release-subject source.commit ${JSON.stringify(subject.source?.commit)} — the sealed evidence is not the subject's source`);
  }

  // 2. artifact binds to evidence: the sealed provenance names the subject's artifact digest.
  if (subject.artifact !== null) {
    if (!provenanceArtifact) findings.push('the evidence bundle seals no provenance naming the artifact — source cannot bind to the artifact digest');
    else {
      const subs = Array.isArray(provenanceArtifact.subject) ? provenanceArtifact.subject : [];
      const digests = subs.map((s) => bare(s?.digest?.sha256)).filter(Boolean);
      if (!digests.includes(bare(digest))) {
        findings.push(`the sealed provenance names ${JSON.stringify(digests)}, none of which is the release-subject artifact digest ${JSON.stringify(bare(digest))} — evidence for a different build`);
      }
    }
  }

  // 3. evals bind to the artifact digest (closes F1). If products are declared, each eval must name
  //    the built artifact — not merely a commit the eval could predate.
  if (productEvals && Array.isArray(productEvals.products) && subject.artifact !== null) {
    for (const p of productEvals.products) {
      const id = p?.product_id || '(unnamed product)';
      const ea = p?.eval?.evaluated_artifact;
      if (!ea) findings.push(`${id}: eval declares no evaluated_artifact — an artifact-bound release evals the built digest, not a commit that predates it`);
      else if (bare(ea) !== bare(digest)) findings.push(`${id}: eval evaluated_artifact ${JSON.stringify(bare(ea))} ≠ the released artifact digest ${JSON.stringify(bare(digest))} — a stale/other-build eval`);
    }
  }

  // 4. the anchor is authentically signed by an approved issuer.
  if (manifest) for (const f of verifyAnchorAttestation(manifest, issuers)) findings.push(f);

  return findings;
}

export function run(cwd = process.cwd()) {
  const subjectPath = find(cwd, SUBJECT_LOCATIONS);
  const { anyInProduction } = aggregateRequirements(cwd);
  if (!subjectPath) return { present: false, findings: evaluate({ subject: null, anyInProduction }) };

  const subject = readJson(subjectPath);
  const manifestPath = find(cwd, MANIFEST_LOCATIONS);
  const manifest = manifestPath ? readJson(manifestPath) : null;
  let provenanceArtifact = null;
  if (manifest && Array.isArray(manifest.entries)) {
    const prov = manifest.entries.find((e) => e.type === 'provenance');
    if (prov) provenanceArtifact = readJson(join(dirname(manifestPath), prov.ref));
  }
  const productPath = find(cwd, PRODUCT_LOCATIONS);
  const productEvals = productPath ? readJson(productPath) : null;
  const issuers = loadIssuers(cwd) || loadIssuers(`${cwd}/..`);

  return { present: true, findings: evaluate({ subject, manifest, provenanceArtifact, productEvals, issuers, anyInProduction }) };
}

// CLI (skipped when imported by the test suite).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { present, findings } = run();
  if (!present && findings.length === 0) {
    process.stdout.write('Release-attestation gate — no release-subject.json; nothing to cross-bind. OK\n');
    process.exit(0);
  }
  if (findings.length) {
    process.stderr.write('\nRelease-attestation gate (rc.11 · WS1) — FAIL\n\n');
    for (const f of findings) process.stderr.write(`  - ${f}\n`);
    process.stderr.write('\nSource, artifact, evaluations and the sealed anchor must all name ONE immutable artifact\ndigest. See ../loom/references/supply-chain-security.md and the release lane in ci/ci.yml.\n');
    process.exit(1);
  }
  process.stdout.write('Release-attestation gate (rc.11 · WS1) — source→artifact→evals→anchor bound to one digest. OK\n');
}
