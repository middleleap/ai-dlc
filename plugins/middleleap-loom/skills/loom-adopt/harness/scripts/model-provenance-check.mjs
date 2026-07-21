// HG-0006 — the model-provenance gate (model-risk management). An ungoverned harness runs an
// ungoverned model: no inventory, no pinning, no eval-before-release, no independent challenge.
// Under model-risk standards (SR 11-7, PRA SS1/23, ISO 42001, NIST AI RMF, the EU AI Act) the
// agent IS a model and must be inventoried, tiered, pinned, evaluated, and validated. This gate
// makes the repo-side half of that a merge condition, read from a model manifest:
//
//   Every model role MUST pin its model + prompt version, declare a risk tier, and — at the
//   tiers you require — carry a passing eval RUN AGAINST THAT PIN and an independent validation.
//
// The pin-match check is the anti-stale-eval control: an eval that passed against an older
// model or prompt proves nothing about what ships (cf. Q1b's anti-reward-hacking spirit, one
// layer up). The eval rig itself is domain-specific and the adopter's to build; this gate
// enforces that a release cannot claim green without a fresh, pinned, tier-appropriate eval.
//
// Run from the repo root: `node scripts/model-provenance-check.mjs` (exit 1 on any finding).
import { existsSync, readFileSync } from 'node:fs';
import process from 'node:process';

const MANIFEST_LOCATIONS = ['docs/governance/model-manifest.json', 'model-manifest.json'];

// ADOPT: a floating tag is not a pin — it can move under you between eval and release.
export const FLOATING = new Set(['', 'latest', 'main', 'head', 'stable', 'edge', '*']);
// ADOPT: which risk tiers must carry a passing eval / an independent validation before release.
export const EVAL_REQUIRED_TIERS = new Set(['high']);
export const VALIDATION_REQUIRED_TIERS = new Set(['high']);
const TIERS = new Set(['high', 'medium', 'low']);

const isPinned = (v) => typeof v === 'string' && !FLOATING.has(v.trim().toLowerCase());

/** Findings (one per violation). Empty ⇒ every model role is pinned, tiered, and eval-fresh. */
export function evaluate(manifest) {
  const findings = [];
  const models = manifest && manifest.models;
  if (!Array.isArray(models) || models.length === 0) {
    return ['manifest has no `models` array — the model inventory is empty (HG-0006)'];
  }
  for (const m of models) {
    const role = (m && m.role) || '(unnamed role)';
    if (!isPinned(m.model_id)) findings.push(`${role}: model_id is not pinned (got ${JSON.stringify(m.model_id)})`);
    if (!isPinned(m.prompt_version)) findings.push(`${role}: prompt_version is not pinned (got ${JSON.stringify(m.prompt_version)})`);
    if (!TIERS.has(m.risk_tier)) {
      findings.push(`${role}: risk_tier must be one of high|medium|low (got ${JSON.stringify(m.risk_tier)})`);
      continue; // tier drives the remaining checks
    }
    if (EVAL_REQUIRED_TIERS.has(m.risk_tier)) {
      const e = m.eval;
      if (!e || typeof e !== 'object') {
        findings.push(`${role}: ${m.risk_tier}-tier model has no eval block (eval-before-release required)`);
      } else {
        if (e.result !== 'pass' || e.threshold_met !== true) {
          findings.push(`${role}: eval did not pass its threshold (result=${JSON.stringify(e.result)}, threshold_met=${JSON.stringify(e.threshold_met)})`);
        }
        if (e.evaluated_model_id !== m.model_id || e.evaluated_prompt_version !== m.prompt_version) {
          findings.push(`${role}: stale eval — it was run against a different model/prompt pin than the one shipping`);
        }
      }
    }
    if (VALIDATION_REQUIRED_TIERS.has(m.risk_tier) && !(typeof m.validated_by === 'string' && m.validated_by.trim())) {
      findings.push(`${role}: ${m.risk_tier}-tier model has no independent validation (validated_by) — HG-0006`);
    }
  }
  return findings;
}

function run(cwd = process.cwd()) {
  const path = MANIFEST_LOCATIONS.map((p) => `${cwd}/${p}`).find(existsSync);
  if (!path) return [`no model manifest found (looked in ${MANIFEST_LOCATIONS.join(', ')}) — the model is ungoverned`];
  let manifest;
  try { manifest = JSON.parse(readFileSync(path, 'utf8')); }
  catch (e) { return [`model manifest is not valid JSON: ${e.message}`]; }
  return evaluate(manifest);
}

// CLI (skipped when imported by the test suite).
if (import.meta.url === `file://${process.argv[1]}`) {
  const findings = run();
  if (findings.length) {
    process.stderr.write('\nModel-provenance gate (HG-0006) — FAIL\n\n');
    for (const f of findings) process.stderr.write(`  - ${f}\n`);
    process.stderr.write('\nEvery model role must be pinned, tiered, and (at required tiers) carry a fresh\npassing eval + independent validation. See ../loom/references/model-risk.md.\n');
    process.exit(1);
  }
  process.stdout.write('Model-provenance gate (HG-0006) — OK\n');
}
