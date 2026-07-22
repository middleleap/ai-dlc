// Q4 — supply-chain output validation. Like Q2, the control is the OUTPUT, not the run:
// a release must carry a real SBOM, a dependency-audit result within policy, and build
// provenance that binds an artifact digest to a builder. This gate validates all three:
//
//   SBOM     — CycloneDX JSON with a non-empty component inventory
//   audit    — critical/high counts within policy (missing report = gap, not pass)
//   provenance — subjects with sha256 digests + a named builder (SLSA-shaped)
//
// Run from the repo root: `node scripts/supply-chain-check.mjs`.
import { existsSync, readFileSync } from 'node:fs';
import process from 'node:process';

export const LOCATIONS = {
  sbom: ['docs/governance/evidence/sbom.cdx.json', 'sbom.cdx.json'],
  audit: ['docs/governance/evidence/dependency-audit.json', 'dependency-audit.json'],
  provenance: ['docs/governance/evidence/provenance.json', 'provenance.json'],
};
// ADOPT: your vulnerability policy for a releasable build.
export const MAX_CRITICAL = 0;
export const MAX_HIGH = 0;

/** Findings across the three artifacts ({sbom, audit, provenance} — null = missing). */
export function evaluate({ sbom, audit, provenance }, { maxCritical = MAX_CRITICAL, maxHigh = MAX_HIGH } = {}) {
  const findings = [];

  if (!sbom) findings.push('no SBOM — the release does not declare what it contains (Q4)');
  else {
    if (sbom.bomFormat !== 'CycloneDX') findings.push(`SBOM bomFormat is ${JSON.stringify(sbom.bomFormat)} — expected CycloneDX`);
    if (!Array.isArray(sbom.components) || sbom.components.length === 0) findings.push('SBOM has no components — an empty inventory is not an inventory');
  }

  if (!audit) findings.push('no dependency-audit report — the Q4 seam is unfilled, which is a gap, not a pass');
  else {
    const crit = audit.critical ?? audit.vulnerabilities?.critical;
    const high = audit.high ?? audit.vulnerabilities?.high;
    if (typeof crit !== 'number' || typeof high !== 'number') findings.push('dependency-audit report does not state critical/high counts');
    else {
      if (crit > maxCritical) findings.push(`${crit} critical vulnerability(ies) exceed the policy maximum of ${maxCritical}`);
      if (high > maxHigh) findings.push(`${high} high vulnerability(ies) exceed the policy maximum of ${maxHigh}`);
    }
  }

  if (!provenance) findings.push('no build provenance — nothing binds the artifact to a builder (Q4)');
  else {
    const subjects = provenance.subject;
    if (!Array.isArray(subjects) || subjects.length === 0 || !subjects.every((s) => s?.digest?.sha256)) {
      findings.push('provenance subjects missing or without sha256 digests');
    }
    const builder = provenance.predicate?.builder?.id ?? provenance.builder?.id;
    if (!builder) findings.push('provenance names no builder — evidence must identify what produced it');
  }

  return findings;
}

const load = (paths, cwd) => {
  const p = paths.map((x) => `${cwd}/${x}`).find(existsSync);
  if (!p) return null;
  return JSON.parse(readFileSync(p, 'utf8')); // a parse error is a legitimate crash-fail
};

// CLI (skipped when imported by the test suite).
if (import.meta.url === `file://${process.argv[1]}`) {
  const cwd = process.cwd();
  let findings;
  try {
    findings = evaluate({
      sbom: load(LOCATIONS.sbom, cwd),
      audit: load(LOCATIONS.audit, cwd),
      provenance: load(LOCATIONS.provenance, cwd),
    });
  } catch (e) { findings = [`supply-chain artifact is not valid JSON: ${e.message}`]; }
  if (findings.length) {
    process.stderr.write('\nSupply-chain gate (Q4: SBOM · audit · provenance) — FAIL\n\n');
    for (const f of findings) process.stderr.write(`  - ${f}\n`);
    process.stderr.write('\nFill the Q4 seams with real SCA/SBOM/provenance producers.\nSee ../loom/references/supply-chain-security.md.\n');
    process.exit(1);
  }
  process.stdout.write('Supply-chain gate (Q4) — OK\n');
}
