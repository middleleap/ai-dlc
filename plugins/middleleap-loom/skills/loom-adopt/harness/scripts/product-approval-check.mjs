// The product-approval gate — PA1/PA2 and the P-gate families (Loom 2.0 §7.1). The Loom
// does not replace a bank's New Product Approval process; this gate ORCHESTRATES AND
// EVIDENCES it: the compiled control plan says which passport sections and which control
// functions a product of this risk and type needs, and the gate verifies the product
// passport carries them — with approvals that RESOLVE:
//
//   every required section is present with substance (P1–P8 as data, mounted by profile) ·
//   PA1 (permission to develop): classification-stage sections + PA1 approver roles ·
//   PA2 (permission to launch): every section + every control-function role in the plan ·
//   each approval names a registry identity that is HUMAN, holds the role, and — for
//   second-line roles — is not a builder. A text field with a name does not count.
//
// MANDATORY-WHEN-COMPILED (Factory Floor WS2 · D2.5). When the compiled plan requires the
// `approval_attestation` capability — because the decision is made somewhere other than this
// repository — a resolvable name is no longer sufficient either. Each approval must carry an
// attestation that binds the HUMAN (an identity-provider assertion, not the carrying service's
// key) to the EXACT subject approved (plan hash, content digest, source or artifact), verified
// by `core/approval-attestations.mjs`. This path tightens the gate; it never loosens it, and a
// plan that does not compile the capability behaves exactly as before.
//
// Run from the repo root: `node scripts/product-approval-check.mjs`.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import process from 'node:process';
import { loadRegistry, identityOf, resolveApprover } from './identity-registry-check.mjs';
import { loadIssuers } from '../core/attestations.mjs';
import { loadIdentityMap, mapRequired } from '../core/identity-map.mjs';
import {
  attestationRequired,
  loadApprovals,
  loadAssertionIssuers,
  passportDigest,
  verifyApprovalAttestation,
} from '../core/approval-attestations.mjs';
import { pathToFileURL } from 'node:url';

export const CHANGES_DIR = 'docs/governance/changes';
// Roles whose approvals demand organisational independence from the builders.
export const SECOND_LINE_ROLES = new Set(['risk-second-line', 'compliance', 'model-validator', 'credit-risk', 'data-protection']);
// PA1 needs the owning + challenging functions as a FLOOR; PA2 needs every role the plan compiled.
export const PA1_CORE_ROLES = ['product-owner', 'risk-second-line'];
export const PA1_HIGH_ROLES = ['accountable-executive'];

/**
 * Which roles must have signed by PA1 — permission to develop.
 *
 * The core set is a floor, never a ceiling. It used to be the whole answer, and that was a defect
 * with a very specific shape: a compiled plan could name twelve approver roles while PA1 checked
 * three, and the flat `required_approver_roles` list gave a reader — or an auditor — no way to
 * tell which was which. A profile that adds `shariah-committee` AND a `shariah-applicability`
 * PA1 section plainly means the Shariah function to be involved at PA1; the gate ignored it.
 *
 * So a profile now declares `pa1_approver_roles` for the roles it wants bound at PA1, the compiler
 * unions them into the plan, and the plan says out loud which roles bind where. Roles compiled
 * into `required_approver_roles` but not into this set bind at PA2 — deliberately, and visibly.
 */
export function pa1Roles(plan) {
  const required = plan?.required_approver_roles || [];
  const wanted = [
    ...PA1_CORE_ROLES,
    ...(['high', 'critical'].includes(plan?.risk_tier) ? PA1_HIGH_ROLES : []),
    ...(plan?.pa1_approver_roles || []),
  ];
  return [...new Set(wanted)].filter((r) => required.includes(r)).sort();
}

/**
 * One stage's approvals against the roles the plan compiled.
 *
 * Returns `{ findings, missing }`. `missing` used to be computed here and thrown away into a
 * finding string, which is why nothing in the harness could answer "who is this change waiting
 * on?" — the set existed, once per run, and was immediately unreadable. It is now returned, and
 * scripts/approval-status.mjs (telemetry) reads it rather than reimplementing the derivation
 * against a second, drifting idea of what a required role is.
 */
export function checkApprovals(approvals, requiredRoles, registry, label, stage, att) {
  const findings = [];
  const missing = [];
  const byRole = new Map((approvals || []).map((a) => [a.role, a]));
  for (const role of requiredRoles) {
    const a = byRole.get(role);
    if (!a) { missing.push(role); findings.push(`${label}: no approval for required role ${role}`); continue; }
    findings.push(...checkOne(a, role, registry, label));
    if (att?.required) {
      const rec = (att.records || []).find((r) => r?.stage === stage && r?.role === role);
      findings.push(...verifyApprovalAttestation(rec, {
        stage,
        role,
        by: a.by,
        plan: att.plan,
        passportDigest: att.passportDigest,
        registry,
        issuers: att.issuers,
        assertionIssuers: att.assertionIssuers,
        resolveApprover,
        identityOf,
        seen: att.seen,
        site: att.site,
        now: att.now,
        map: att.map,
        mapRequired: att.mapRequired,
      }, `${label} · ${role}`));
    }
  }
  // Every approval the passport RECORDS is resolved, not only the ones this stage demands. Without
  // this, a role the stage does not require could name an agent, a builder, or an identity that
  // does not exist, and the gate would say OK — which at PA1 was nine of twelve compiled roles,
  // including every Shariah role. A recorded approval is a claim the record makes about a person.
  // "Agents approve nothing" is the method's loudest promise, and an agent's name sitting in an
  // approval slot under a green gate contradicts it whether or not this stage asked for it.
  for (const [role, a] of byRole) {
    if (requiredRoles.includes(role)) continue; // checked above
    findings.push(...checkOne(a, role, registry, `${label} (recorded, not required at this stage)`));
  }
  return { findings, missing };
}

/** One recorded approval: resolves to a human holding the role, and second line ∩ builders = ∅. */
function checkOne(a, role, registry, label) {
  const findings = [...resolveApprover(registry, a.by, role, `${label} · ${role}`)];
  if (registry && SECOND_LINE_ROLES.has(role)) {
    const who = identityOf(registry, a.by);
    if (who && (who.groups || []).includes('builders')) {
      findings.push(`${label} · ${role}: ${a.by} is in the builders group — a builder cannot issue second-line approval`);
    }
  }
  return findings;
}

const hasSubstance = (s) => s && typeof s === 'object' && Object.keys(s).length > 0;

/**
 * Findings for one passport against its compiled plan.
 * `att` carries the attestation material when the plan compiles the capability:
 * { records, issuers, assertionIssuers, passportDigest, seen, now }.
 */
export function evaluate(passport, plan, registry, att = {}) {
  const findings = [];
  const id = plan?.change_id || '(no id)';
  if (!passport) return [`${id}: product passport missing — a product change without a passport is blocked`];
  const gates = new Set(plan?.required_gates || []);
  // Either PA gate is a product-approval route, and each is evaluated on its OWN presence below.
  // Testing PA1 alone here meant a plan compiling PA2 without PA1 — which the compiler can emit,
  // since a conditional profile may add PA2 to a lower-tier change — returned early and skipped
  // EVERYTHING: ownership, the PA2 section set, the approver roles and every attestation on the
  // one gate that grants permission to launch.
  if (!gates.has('PA1') && !gates.has('PA2')) {
    // No product-approval route compiled at all. If the plan nonetheless requires attestation-backed
    // approvals, say so rather than exiting quietly: a requirement with nowhere to apply reads as
    // satisfied, and a silently inert control is the failure this whole contract exists to avoid.
    return attestationRequired(plan)
      ? [`${id}: the plan requires the ${'approval_attestation'} capability but compiles neither PA1 nor PA2 (gates: ${(plan?.required_gates || []).join(', ') || 'none'}) — the requirement has nothing to apply to, which is a plan defect, not a pass`]
      : [];
  }
  // Mandatory-when-compiled: the attestation path activates from the plan, never from a flag.
  const attCtx = { ...att, required: attestationRequired(plan), plan, seen: att.seen || new Map() };

  // Ownership is named and resolvable, always.
  const own = passport.sections?.ownership;
  for (const [field, role] of [['product_owner', 'product-owner'], ['accountable_executive', 'accountable-executive']]) {
    findings.push(...resolveApprover(registry, own?.[field], role, `${id} · ownership.${field}`));
  }

  // PA1 — permission to develop.
  const pa1Required = pa1Roles(plan);
  if (gates.has('PA1')) {
    if (passport.pa1?.decision === 'approved') {
      for (const section of plan.pa1_sections || []) {
        if (!hasSubstance(passport.sections?.[section])) {
          findings.push(`${id} · PA1: required section ${section} is missing or empty — an approval over absent analysis is not an approval`);
        }
      }
      findings.push(...checkApprovals(passport.pa1.approvals, pa1Required, registry, `${id} · PA1`, 'PA1', attCtx).findings);
    } else if (passport.pa1?.decision && passport.pa1.decision !== 'pending' && passport.pa1.decision !== 'rejected') {
      findings.push(`${id} · PA1: decision must be approved|pending|rejected (got ${JSON.stringify(passport.pa1.decision)})`);
    }
  }

  // PA2 — permission to launch: the full section set, every compiled control function.
  if (gates.has('PA2') && passport.pa2?.decision === 'approved') {
    for (const section of [...(plan.pa1_sections || []), ...(plan.pa2_sections || [])]) {
      if (!hasSubstance(passport.sections?.[section])) {
        findings.push(`${id} · PA2: required section ${section} is missing or empty`);
      }
    }
    findings.push(...checkApprovals(passport.pa2.approvals, plan.required_approver_roles || [], registry, `${id} · PA2`, 'PA2', attCtx).findings);
  }
  return findings;
}

const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };

export function run(cwd = process.cwd()) {
  const dir = `${cwd}/${CHANGES_DIR}`;
  if (!existsSync(dir)) return { findings: [], count: 0 };
  const registry = loadRegistry(cwd);
  // Attestation material is loaded once; `seen` spans every change, so a decision nonce
  // replayed across changes is caught, not just one replayed within a change.
  const issuers = loadIssuers(cwd);
  const identityMap = loadIdentityMap(cwd);
  const assertionIssuers = loadAssertionIssuers(cwd);
  const seen = new Map();
  const findings = [];
  let count = 0;
  for (const name of readdirSync(dir)) {
    const base = `${dir}/${name}`;
    const envelope = readJson(`${base}/change-envelope.json`);
    if (!envelope) continue; // the envelope gate reports this
    const plan = readJson(`${base}/${envelope.control_plan || 'control-plan.json'}`);
    if (!plan) continue; // ditto
    // A plan that requires attestation but compiles no PA gate is still reported (evaluate says
    // so) — skipping it here would restore exactly the silent pass that check exists to close.
    // Either PA gate brings a change into scope: a PA2-only plan is a launch approval to check,
    // not a change to walk past.
    const compiled = plan.required_gates || [];
    if (!compiled.includes('PA1') && !compiled.includes('PA2') && !attestationRequired(plan)) continue;
    count++;
    const att = {
      records: loadApprovals(base).map((a) => a.record),
      issuers,
      assertionIssuers,
      passportDigest: passportDigest(base),
      seen,
      site: name, // the change DIRECTORY — two directories may carry one change_id
      // The P6 join. Loaded once, applied per approval: the map says who a signed subject IS,
      // and the record's own registry_id is only a claim until the two agree.
      map: identityMap,
      mapRequired: mapRequired(plan),
    };
    findings.push(...evaluate(readJson(`${base}/product-passport.json`), plan, registry, att));
  }
  return { findings, count };
}

// CLI (skipped when imported by the test suite).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { findings, count } = run();
  if (findings.length) {
    process.stderr.write('\nProduct-approval gate (PA1/PA2) — FAIL\n\n');
    for (const f of findings) process.stderr.write(`  - ${f}\n`);
    process.stderr.write('\nThe Loom orchestrates and evidences the bank’s product approval — it does not\nreplace it. Approvals must resolve to human identities holding the required role.\n');
    process.exit(1);
  }
  process.stdout.write(`Product-approval gate — OK (${count} product change${count === 1 ? '' : 's'})\n`);
}
