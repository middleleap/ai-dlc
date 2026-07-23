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
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import process from 'node:process';
import { loadRegistry, identityOf } from './identity-registry-check.mjs';

const MANIFEST_LOCATIONS = ['docs/governance/model-manifest.json', 'model-manifest.json'];

// ADOPT: a floating tag is not a pin — it can move under you between eval and release.
export const FLOATING = new Set(['', 'latest', 'main', 'head', 'stable', 'edge', '*']);
// ADOPT: which risk tiers must carry a passing eval / an independent validation before release.
// Default follows the model-risk-operating-model-runbook §2.2 controls-by-tier matrix: eval and
// validation are required at medium AND high (low is optional). Tighten or loosen per your tiering.
export const EVAL_REQUIRED_TIERS = new Set(['high', 'medium']);
export const VALIDATION_REQUIRED_TIERS = new Set(['high', 'medium']);
// ADOPT: which tiers must declare runtime governance (monitoring · suspension · fallback).
// High only by default — a high-risk model that RUNS needs a live control loop (§10, 2.0-rc).
export const RUNTIME_REQUIRED_TIERS = new Set(['high']);
const TIERS = new Set(['high', 'medium', 'low']);

const isPinned = (v) => typeof v === 'string' && !FLOATING.has(v.trim().toLowerCase());

/** Findings (one per violation). Empty ⇒ every model role is pinned, tiered, and eval-fresh.
 *  With `baseDir`, each eval's report artifact is read and its sha256 verified — the CLI
 *  always passes it, so a manifest cannot cite a report that is absent or altered. */
export function evaluate(manifest, { baseDir = null, registry = null } = {}) {
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
        // 1.10 — a declared pass is not evidence. The eval must identify its dataset, runner,
        // and timestamp, and point at the actual REPORT artifact, hashed. (`result: "pass"`
        // alone is exactly the false green this gate exists to kill.)
        for (const field of ['dataset_version', 'runner_version', 'ran_at']) {
          if (!(typeof e[field] === 'string' && e[field].trim())) {
            findings.push(`${role}: eval declares no ${field} — an unidentified eval is a claim, not evidence`);
          }
        }
        const r = e.report;
        if (!r || typeof r.ref !== 'string' || !/^[0-9a-f]{64}$/.test(r.sha256 || '')) {
          findings.push(`${role}: eval has no report {ref, sha256} — the evaluation artifact itself must be sealed, not just its verdict`);
        } else if (baseDir) {
          const p = `${baseDir}/${r.ref}`;
          if (!existsSync(p)) {
            findings.push(`${role}: eval report ${r.ref} not found — a referenced artifact must exist`);
          } else if (createHash('sha256').update(readFileSync(p)).digest('hex') !== r.sha256) {
            findings.push(`${role}: eval report ${r.ref} does not match its declared sha256 — the report was altered after the manifest was written`);
          }
        }
      }
    }
    if (VALIDATION_REQUIRED_TIERS.has(m.risk_tier)) {
      if (!(typeof m.validated_by === 'string' && m.validated_by.trim())) {
        findings.push(`${role}: ${m.risk_tier}-tier model has no independent validation (validated_by) — HG-0006`);
      } else if (registry) {
        // W5 (closes F6): `validated_by: "Risk"` is not validation. With a registry mounted the
        // validator must RESOLVE to a human model-validator in the second line, not a builder —
        // the same treatment every other approval already gets (CBUAE MMS independent validation).
        const who = identityOf(registry, m.validated_by);
        if (!who) findings.push(`${role}: validated_by ${JSON.stringify(m.validated_by)} is not a registry identity — free text is not independent validation`);
        else {
          if (who.kind === 'agent') findings.push(`${role}: validated_by ${m.validated_by} is an AGENT — validation is independent, not self-issued`);
          if (!(who.roles || []).includes('model-validator')) findings.push(`${role}: validated_by ${m.validated_by} does not hold the model-validator role`);
          if (!(who.groups || []).includes('second-line')) findings.push(`${role}: validated_by ${m.validated_by} is not in the second line — validation must be organisationally independent`);
          if ((who.groups || []).includes('builders')) findings.push(`${role}: validated_by ${m.validated_by} is a BUILDER — a builder cannot validate their own model`);
        }
      }
    }
    // 2.0-rc — a model is not just built and validated once; it RUNS. At high tier the
    // manifest must declare the runtime governance: what is monitored, when it is suspended,
    // and what happens when the model or its provider is unavailable. Declaring the plan is
    // the repo-side half; executing the monitoring is the adopter's model-risk function.
    if (RUNTIME_REQUIRED_TIERS.has(m.risk_tier)) {
      const rt = m.runtime;
      if (!rt || typeof rt !== 'object') {
        findings.push(`${role}: ${m.risk_tier}-tier model has no runtime block — a running model needs monitoring, suspension thresholds, and a fallback (§10)`);
      } else {
        if (!(Array.isArray(rt.monitoring) && rt.monitoring.length > 0)) findings.push(`${role}: runtime.monitoring must list the metrics watched in production`);
        if (!(typeof rt.suspension === 'string' && rt.suspension.trim())) findings.push(`${role}: runtime.suspension must state the threshold that suspends the model`);
        if (!(typeof rt.fallback === 'string' && rt.fallback.trim())) findings.push(`${role}: runtime.fallback must state what happens on model/provider outage`);
      }
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
  return evaluate(manifest, { baseDir: cwd, registry: loadRegistry(cwd) });
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
