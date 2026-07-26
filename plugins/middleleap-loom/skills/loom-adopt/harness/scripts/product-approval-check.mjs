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
// Run from the repo root: `node scripts/product-approval-check.mjs`.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import process from 'node:process';
import { loadRegistry, identityOf, resolveApprover } from './identity-registry-check.mjs';
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

function checkApprovals(approvals, requiredRoles, registry, label) {
  const findings = [];
  const byRole = new Map((approvals || []).map((a) => [a.role, a]));
  for (const role of requiredRoles) {
    const a = byRole.get(role);
    if (!a) { findings.push(`${label}: no approval for required role ${role}`); continue; }
    findings.push(...checkOne(a, role, registry, label));
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
  return findings;
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

/** Findings for one passport against its compiled plan. */
export function evaluate(passport, plan, registry) {
  const findings = [];
  const id = plan?.change_id || '(no id)';
  if (!passport) return [`${id}: product passport missing — a product change without a passport is blocked`];
  const gates = new Set(plan?.required_gates || []);
  if (!gates.has('PA1')) return []; // the plan compiled no product-approval route

  // Ownership is named and resolvable, always.
  const own = passport.sections?.ownership;
  for (const [field, role] of [['product_owner', 'product-owner'], ['accountable_executive', 'accountable-executive']]) {
    findings.push(...resolveApprover(registry, own?.[field], role, `${id} · ownership.${field}`));
  }

  // PA1 — permission to develop.
  const pa1Required = pa1Roles(plan);
  if (passport.pa1?.decision === 'approved') {
    for (const section of plan.pa1_sections || []) {
      if (!hasSubstance(passport.sections?.[section])) {
        findings.push(`${id} · PA1: required section ${section} is missing or empty — an approval over absent analysis is not an approval`);
      }
    }
    findings.push(...checkApprovals(passport.pa1.approvals, pa1Required, registry, `${id} · PA1`));
  } else if (passport.pa1?.decision && passport.pa1.decision !== 'pending' && passport.pa1.decision !== 'rejected') {
    findings.push(`${id} · PA1: decision must be approved|pending|rejected (got ${JSON.stringify(passport.pa1.decision)})`);
  }

  // PA2 — permission to launch: the full section set, every compiled control function.
  if (gates.has('PA2') && passport.pa2?.decision === 'approved') {
    for (const section of [...(plan.pa1_sections || []), ...(plan.pa2_sections || [])]) {
      if (!hasSubstance(passport.sections?.[section])) {
        findings.push(`${id} · PA2: required section ${section} is missing or empty`);
      }
    }
    findings.push(...checkApprovals(passport.pa2.approvals, plan.required_approver_roles || [], registry, `${id} · PA2`));
  }
  return findings;
}

const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };

export function run(cwd = process.cwd()) {
  const dir = `${cwd}/${CHANGES_DIR}`;
  if (!existsSync(dir)) return { findings: [], count: 0 };
  const registry = loadRegistry(cwd);
  const findings = [];
  let count = 0;
  for (const name of readdirSync(dir)) {
    const base = `${dir}/${name}`;
    const envelope = readJson(`${base}/change-envelope.json`);
    if (!envelope) continue; // the envelope gate reports this
    const plan = readJson(`${base}/${envelope.control_plan || 'control-plan.json'}`);
    if (!plan) continue; // ditto
    if (!(plan.required_gates || []).includes('PA1')) continue;
    count++;
    findings.push(...evaluate(readJson(`${base}/product-passport.json`), plan, registry));
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
