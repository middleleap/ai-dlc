// HG-0003 — the evidence-seal gate. An ungoverned harness self-attests its change records:
// "the tests passed, the reviewers approved" — narrated, not sealed. The decision that closes
// the gap is externally-anchored traceability + tamper-evident evidence: the release bundle is
// SEALED, not narrated. This gate enforces the repo-side half deterministically over an
// evidence manifest (the index the delivery loop writes at step ⑧):
//
//   The evidence entries form an append-only HASH CHAIN, and the required evidence is complete.
//
// Each entry seals `sha256(prev | type | ref | sha256-of-artifact)`, so altering any artifact
// (without recomputing every downstream seal), reordering entries, or dropping one breaks the
// chain and fails the gate. The final seal is the bundle's fingerprint; publishing it to an
// external, append-only, timestamped store (WORM + an RFC-3161 timestamping authority) is what
// makes a fully-recomputed chain detectable too — that anchor is the adopter's, and if recorded
// as `manifest.anchor` this gate checks the chain resolves to it.
//
// Run from the repo root: `node scripts/evidence-seal-check.mjs` (exit 1 on any finding).
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';

const MANIFEST_LOCATIONS = ['docs/governance/evidence/manifest.json', 'evidence-manifest.json'];
const GENESIS = 'GENESIS';

// ADOPT: the evidence every release must carry. Add yours (smoke results, SBOM, attestations).
export const REQUIRED_TYPES = ['tests', 'reviews', 'lineage', 'model-provenance', 'control-plane'];

const sha256 = (s) => createHash('sha256').update(s).digest('hex');
const sha256File = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

/** The seal for one entry, chained onto `prev`. Deterministic and content-addressed. */
export function sealOf(prev, e) {
  return sha256(`${prev}\n${e.type}\n${e.ref}\n${e.sha256}`);
}

/** Fill prev + seal across a list of raw entries ({type, ref, sha256}) → a valid chain. */
export function buildChain(rawEntries) {
  let prev = GENESIS;
  return rawEntries.map((e) => {
    const seal = sealOf(prev, { type: e.type, ref: e.ref, sha256: e.sha256 });
    const out = { ...e, prev, seal };
    prev = seal;
    return out;
  });
}

/**
 * Findings (one per break). Empty ⇒ the bundle is a complete, intact, append-only chain.
 * When `baseDir` is given, each entry's artifact at `ref` (resolved relative to baseDir) is read
 * and its sha256 verified against the manifest — so altering the artifact on disk (not just the
 * manifest) is caught, which is what makes the seal tamper-evident. The CLI always passes it.
 */
export function evaluate(manifest, { requiredTypes = REQUIRED_TYPES, baseDir = null } = {}) {
  const findings = [];
  const entries = manifest && manifest.entries;
  if (!Array.isArray(entries) || entries.length === 0) {
    return ['evidence manifest has no `entries` — the release is narrated, not sealed (HG-0003)'];
  }
  let prev = GENESIS;
  entries.forEach((e, i) => {
    const expectSeal = sealOf(prev, e);
    if (e.prev !== prev) {
      findings.push(`entry ${i} (${e.type}): broken chain — prev pointer ${JSON.stringify(e.prev)} ≠ expected ${JSON.stringify(prev)}`);
    }
    if (e.seal !== expectSeal) {
      findings.push(`entry ${i} (${e.type}): seal mismatch — the entry was altered after sealing, or the chain was reordered`);
    }
    if (baseDir && typeof e.ref === 'string') {
      const p = join(baseDir, e.ref);
      if (!existsSync(p)) {
        findings.push(`entry ${i} (${e.type}): sealed artifact ${e.ref} not found — a sealed bundle must contain its evidence`);
      } else if (sha256File(p) !== e.sha256) {
        findings.push(`entry ${i} (${e.type}): artifact ${e.ref} was altered after sealing — its content sha256 no longer matches the manifest`);
      }
    }
    prev = expectSeal; // continue from the recomputed seal so errors localise, not cascade
  });
  if (typeof manifest.anchor === 'string' && manifest.anchor && manifest.anchor !== prev) {
    findings.push(`external anchor mismatch — the chain resolves to ${prev.slice(0, 12)}… but the anchored seal is ${manifest.anchor.slice(0, 12)}…`);
  }
  const present = new Set(entries.map((e) => e.type));
  for (const t of requiredTypes) if (!present.has(t)) findings.push(`missing required evidence: ${t}`);
  return findings;
}

function run(cwd = process.cwd()) {
  const path = MANIFEST_LOCATIONS.map((p) => `${cwd}/${p}`).find(existsSync);
  if (!path) return [`no evidence manifest found (looked in ${MANIFEST_LOCATIONS.join(', ')}) — the release is unsealed`];
  let manifest;
  try { manifest = JSON.parse(readFileSync(path, 'utf8')); }
  catch (e) { return [`evidence manifest is not valid JSON: ${e.message}`]; }
  return evaluate(manifest, { baseDir: dirname(path) });
}

// CLI (skipped when imported by the test suite).
if (import.meta.url === `file://${process.argv[1]}`) {
  const findings = run();
  if (findings.length) {
    process.stderr.write('\nEvidence-seal gate (HG-0003) — FAIL\n\n');
    for (const f of findings) process.stderr.write(`  - ${f}\n`);
    process.stderr.write('\nThe release evidence bundle must be a complete, intact, append-only hash chain.\nSee ../loom/references/delivery-harness.md (step ⑧) and governance.md (HG-0003).\n');
    process.exit(1);
  }
  process.stdout.write('Evidence-seal gate (HG-0003) — OK\n');
}
