// The change-envelope gate (Loom 2.0 §4–5). The envelope is the governed change object —
// the root of the traceability chain from mandate to outcome. This gate enforces, for every
// change under docs/governance/changes/<id>/:
//
//   classification is complete (an unclassified change is blocked) ·
//   the stored control plan RECONCILES with a fresh compile (plan_hash match — a stale or
//   hand-edited plan fails, so classification-time rigor survives to execution time) ·
//   the classifier is a HUMAN with classification authority (the agent cannot set or lower
//   a risk tier; the envelope directory is CODEOWNERS-owned by a non-builder group) ·
//   state transitions carry their receipts (PA1 before develop, A before delivery,
//   PA2 before launch) · production authorization is COMPOUND (1.12): PA2 + R-gate-green
//   readiness for every declared service + the second-line release hold RELEASED by a
//   second-line human (missing hold = held, fail closed) + externally-anchored, issuer-
//   verified evidence at high/critical tiers ·
//   exemptions have an owner, rationale, compensating control, expiry, second-line approval.
//
// Run from the repo root: `node scripts/change-envelope-check.mjs`.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import process from 'node:process';
import { compile, loadProfiles, resolveBindings, planHash } from '../core/policy-compiler.mjs';
import { loadRegistry, identityOf } from './identity-registry-check.mjs';
import { evaluate as evaluateReadiness, SERVICES_DIR } from './operational-readiness-check.mjs';
import { loadIssuers, verifyAnchorAttestation } from '../core/attestations.mjs';
import { pathToFileURL } from 'node:url';

export const CHANGES_DIR = 'docs/governance/changes';
export const STATES = ['classified', 'permission-to-develop', 'in-delivery', 'delivery-complete',
  'permission-to-launch', 'operationally-ready', 'production-authorized', 'in-production'];
export const CLASSIFIER_ROLES = ['product-owner', 'risk-second-line'];
export const ANCHOR_REQUIRED_TIERS = new Set(['high', 'critical']);

const at = (state) => STATES.indexOf(state);

/**
 * Findings for one change. `files` gives the sibling artifacts already parsed:
 * { plan, passport, architecture (booleans/objects) }; `registry` resolves identities.
 */
export function evaluate(envelope, { plan, passport, architectureExists, registry, freshPlan, readiness, hold, evidence } = {}) {
  const findings = [];
  const id = envelope?.change_id || '(no id)';
  if (!STATES.includes(envelope?.current_state)) {
    findings.push(`${id}: current_state must be one of ${STATES.join('|')} (got ${JSON.stringify(envelope?.current_state)})`);
    return findings;
  }
  const state = envelope.current_state;

  // Reconciliation, both halves: the stored plan's CONTENT must match its own hash (a
  // hand-edit that keeps the old hash is still an edit), and that hash must match a fresh
  // compile (a stale plan is not this envelope's plan).
  if (!plan) findings.push(`${id}: no stored control plan — run the policy compiler (an unplanned change is blocked)`);
  else {
    if (planHash(plan) !== plan.plan_hash) {
      findings.push(`${id}: stored control plan content does not match its own plan_hash — the plan was edited by hand after compilation`);
    }
    if (freshPlan && plan.plan_hash !== freshPlan.plan_hash) {
      findings.push(`${id}: stored control plan does not reconcile with a fresh compile (stored ${String(plan.plan_hash).slice(0, 12)}… ≠ compiled ${freshPlan.plan_hash.slice(0, 12)}…) — the plan is stale`);
    }
  }
  const effective = freshPlan || plan;

  // The classifier is a human with authority — the agent cannot set or lower the tier.
  const clsBy = envelope.classification?.classified_by;
  if (!clsBy) findings.push(`${id}: classification.classified_by missing — a classification must have a named, resolvable owner`);
  else if (registry) {
    const who = identityOf(registry, clsBy);
    if (!who) findings.push(`${id}: classifier ${clsBy} is not in the identity registry`);
    else {
      if (who.kind === 'agent') findings.push(`${id}: classifier ${clsBy} is an AGENT — the agent cannot set or lower the risk tier`);
      if (!(who.roles || []).some((r) => CLASSIFIER_ROLES.includes(r))) {
        findings.push(`${id}: classifier ${clsBy} holds none of the classification roles (${CLASSIFIER_ROLES.join(', ')})`);
      }
    }
  }

  // State receipts — a state without its gate evidence is a self-declaration.
  if (effective) {
    const gates = new Set(effective.required_gates || []);
    if (at(state) >= at('permission-to-develop') && gates.has('PA1') && passport?.pa1?.decision !== 'approved') {
      findings.push(`${id}: state ${state} requires PA1 approved — the product passport says ${JSON.stringify(passport?.pa1?.decision)} (a high-risk change cannot enter Develop without PA1)`);
    }
    if (at(state) >= at('in-delivery') && gates.has('A') && !architectureExists) {
      findings.push(`${id}: state ${state} requires architecture assurance (A1–A5) — architecture-assurance.json is missing (an unresolved A-gate blocks backlog creation)`);
    }
    if (at(state) >= at('permission-to-launch') && gates.has('PA2') && passport?.pa2?.decision !== 'approved') {
      findings.push(`${id}: state ${state} requires PA2 approved — the product passport says ${JSON.stringify(passport?.pa2?.decision)}`);
    }

    // Operational readiness: every declared service must be R-gate green (1.12).
    if (at(state) >= at('operationally-ready')) {
      const services = envelope.service_ids;
      if (!Array.isArray(services) || services.length === 0) {
        findings.push(`${id}: state ${state} but the envelope declares no service_ids — readiness of nothing is not readiness`);
      }
      for (const s of readiness?.missing || []) {
        findings.push(`${id}: state ${state} requires operational readiness for service ${s} — docs/governance/services/${s}.json is missing`);
      }
      for (const f of readiness?.findings || []) findings.push(`${id}: ${f}`);
    }

    // Production authorization is COMPOUND (1.12): PA2 + readiness (above) + the second-line
    // hold released by a second-line human + externally-attested evidence for high tiers.
    // "A human approved" is not production authorization.
    if (at(state) >= at('production-authorized')) {
      if (!hold) {
        findings.push(`${id}: state ${state} with no release-hold.json — a missing hold means HELD (fail closed), and only the second line releases it`);
      } else {
        if (hold.status !== 'released') {
          findings.push(`${id}: state ${state} but the second-line release hold is ${JSON.stringify(hold.status)} — builders and agents cannot release it`);
        }
        if (registry) {
          const who = identityOf(registry, hold.by);
          if (!who || who.kind === 'agent' || !(who.groups || []).includes('second-line')) {
            findings.push(`${id}: release hold ${hold.status} by ${JSON.stringify(hold.by)} — the hold is operated only by a second-line HUMAN identity`);
          }
        }
      }
      if (ANCHOR_REQUIRED_TIERS.has(envelope.risk_tier)) {
        if (!evidence?.anchor) {
          findings.push(`${id}: ${envelope.risk_tier}-tier production authorization requires externally-anchored evidence — the evidence manifest has no anchor`);
        } else {
          for (const f of evidence.attestationFindings || []) findings.push(`${id}: ${f}`);
        }
      }
    }
  }

  // Exemptions: owned, reasoned, compensated, expiring, second-line approved. Expired blocks.
  for (const ex of envelope.exemptions || []) {
    const label = `${id}: exemption ${ex.control || '(unnamed)'}`;
    for (const f of ['control', 'owner', 'rationale', 'compensating_control', 'expires', 'approved_by']) {
      if (!(typeof ex[f] === 'string' && ex[f].trim())) findings.push(`${label} — missing ${f}`);
    }
    if (ex.expires && !Number.isNaN(Date.parse(ex.expires)) && Date.parse(ex.expires) < Date.now()) {
      findings.push(`${label} — EXPIRED ${ex.expires}: an expired exemption blocks the change`);
    }
    if (registry && ex.approved_by) {
      const who = identityOf(registry, ex.approved_by);
      if (!who || !(who.groups || []).includes('second-line')) {
        findings.push(`${label} — approved_by ${ex.approved_by} is not a second-line identity (exemptions need independent approval)`);
      }
    }
  }
  return findings;
}

const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };

export function run(cwd = process.cwd()) {
  const dir = `${cwd}/${CHANGES_DIR}`;
  if (!existsSync(dir)) return { findings: [], count: 0 }; // no governed changes yet — nothing to check
  const registry = loadRegistry(cwd);
  const findings = [];
  let count = 0;
  for (const name of readdirSync(dir)) {
    const base = `${dir}/${name}`;
    const envelope = readJson(`${base}/change-envelope.json`);
    if (!envelope) { findings.push(`${name}: no parseable change-envelope.json`); continue; }
    count++;
    const plan = readJson(`${base}/${envelope.control_plan || 'control-plan.json'}`);
    const passport = readJson(`${base}/product-passport.json`);
    const architectureExists = existsSync(`${base}/architecture-assurance.json`);
    const { profiles, findings: pf } = loadProfiles(envelope.required_profiles, cwd);
    findings.push(...pf.map((f) => `${envelope.change_id}: ${f}`));
    // rc.8 WS4: recompile with the SAME profile-content bindings the plan was written from, so a
    // revised profile (or a BrainKit that an institution profile pins) makes the stored plan stale.
    const { bindings, findings: bf } = resolveBindings(envelope.required_profiles, cwd);
    findings.push(...bf.map((f) => `${envelope.change_id}: ${f}`));
    const { plan: freshPlan, findings: cf } = compile(envelope, profiles, bindings);
    findings.push(...cf.map((f) => `${envelope.change_id}: ${f}`));
    // 1.12 context: R-gate results per declared service, the second-line hold, the evidence anchor.
    const readiness = { missing: [], findings: [] };
    for (const s of envelope.service_ids || []) {
      const sr = readJson(`${cwd}/${SERVICES_DIR}/${s}.json`);
      if (!sr) readiness.missing.push(s);
      else readiness.findings.push(...evaluateReadiness(sr));
    }
    const hold = readJson(`${base}/release-hold.json`);
    const manifest = readJson(`${cwd}/docs/governance/evidence/manifest.json`);
    const evidence = manifest && {
      anchor: manifest.anchor,
      attestationFindings: verifyAnchorAttestation(manifest, loadIssuers(cwd)),
    };
    findings.push(...evaluate(envelope, { plan, passport, architectureExists, registry, freshPlan, readiness, hold, evidence }));
  }
  return { findings, count };
}

// CLI (skipped when imported by the test suite).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { findings, count } = run();
  if (findings.length) {
    process.stderr.write('\nChange-envelope gate — FAIL\n\n');
    for (const f of findings) process.stderr.write(`  - ${f}\n`);
    process.stderr.write('\nThe envelope is the governed change object: classified by a human with authority,\nplanned by the compiler, reconciled at execution, advancing only with receipts.\n');
    process.exit(1);
  }
  process.stdout.write(`Change-envelope gate — OK (${count} governed change${count === 1 ? '' : 's'})\n`);
}
