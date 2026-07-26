// Derive the approvals-surface worked example (Factory Floor WS5 · D5.1).
//
// WHY THIS EXISTS. `scripts/approval-surface-check.mjs` reported
//
//     OK (0 approval surfaces against their compiled plans, 2 catalog-B forms …)
//
// on every push. Zero. The D5.4 half of the gate did real work — two forms ship in `floor/` — but
// the D5.1 half verified nothing about a surface, because no repository contained one. That is the
// same hole `freeze-stamp-check` had before a real frozen artifact was staged beside it, and the
// same one `drift-check` had before `drift-example/observe.mjs`. A green gate that proves nothing
// is worse than a red one: it is a control everybody believes in.
//
//   node approval-surface-example/derive.mjs PA1          → the surface, on stdout
//   node approval-surface-example/derive.mjs PA2
//   node approval-surface-example/derive.mjs PA2 --break drop-section
//
// Prints one surface to stdout; notices and the derivation's own reasoning go to stderr. The caller
// decides where it lands — `drift-example/observe.mjs`'s arrangement, for the same reason: the gate
// reads `floor/approvals/*.json` relative to the working directory, and only the caller knows which
// working directory it is about to check.
//
// WHY IT IS DERIVED AND NOT COMMITTED. Two reasons, and the second is the load-bearing one.
//
//   1. A surface binds `plan_hash`, and AS-R10 fails the moment the page and the plan disagree.
//      `plan_hash` changes whenever a profile gains a field — it changed twice while this bundle
//      was being written, and `approval-attestation-example/regenerate.mjs` exists because the
//      attestation example hit exactly that wall. A committed surface would start failing every
//      build for a reason unrelated to the change under review, somebody would delete it, and the
//      gate would go back to reporting zero.
//   2. The module's first design property is DERIVED, NEVER DRAWN. A committed surface is a
//      hand-drawn page with a provenance story attached: it would be edited when the deriver
//      changed, not regenerated, and the gate would then be checking a fiction against a plan. The
//      example has to be produced the way the thing it demonstrates is produced, or it demonstrates
//      something else.
//
// WHICH PLAN IT DERIVES FROM. The gate's own `loadPlans(cwd)` — the exact plans
// `approval-surface-check.mjs` will check the surface against, read from the same files by the same
// code. Deriving from a second copy of the plan is how a surface and a gate come to disagree about
// a hash that both of them computed correctly. Only when the working directory compiles no change
// at all does this fall back to the bundled `change-example/`, and it says so on stderr.
//
// WHAT THIS DOES NOT DEMONSTRATE. No page was created anywhere. There is no workspace, no vendor
// API, no grant: `writable_by: []` on an evidence block is the layout an adopter must configure,
// and whether a workspace actually withholds edit rights is an activation observation (WS6/D6.3),
// not a property of a JSON file. This exercises the gate and shows the shape. It is not evidence
// that an approvals database exists, and nothing here approves anything — the surface says so
// itself, verbatim, on the page and on every section.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import {
  STAGES,
  deriveApprovalSurface,
  digestOf,
  roleSection,
  verifyApprovalSurface,
} from '../core/floor-approval-surface.mjs';
import { CHANGES_DIR, loadPlans } from '../scripts/approval-surface-check.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const BUNDLED_PLAN = resolve(HERE, '..', 'change-example', 'control-plan.json');

const die = (msg, code = 2) => { process.stderr.write(`${msg}\n`); process.exit(code); };
const note = (msg) => process.stderr.write(`  · ${msg}\n`);

/**
 * The mutations, each one a way a real approvals page goes wrong, each one named after the rule it
 * must trip. THE DIGEST IS RECOMPUTED AFTER EVERY MUTATION — deliberately. Leaving it stale would
 * make every break fail on AS-R10 ("this is not the surface that was derived") and prove nothing
 * about the rule under test; recomputing it produces a page that is perfectly self-consistent and
 * disagrees only with the plan, which is precisely the hand-drawn page these rules exist to refuse.
 */
const BREAKS = new Map([
  ['drop-section', {
    expect: 'AS-R03',
    what: 'the section for the last compiled role is deleted, and the role list tidied to match',
    why: 'the refusal then arrives at the product-approval gate, for a role nobody was ever asked about',
    apply: (surface) => {
      const gone = surface.sections.pop();
      surface.roles = surface.roles.filter((r) => r !== gone.role);
      return `dropped the ${gone.role} section`;
    },
  }],
  ['invented-role', {
    expect: 'AS-R04',
    what: 'a section is added for a role the plan does not compile at this stage',
    why: 'a page that invents an approver teaches the institution a role set the compiler never agreed to',
    apply: (surface) => {
      const role = 'shariah-committee';
      surface.sections.push(roleSection(role));
      surface.roles = [...surface.roles, role];
      return `added a ${role} section`;
    },
  }],
  ['evidence-writable', {
    expect: 'AS-R05',
    what: 'the first evidence block becomes editable by the approver reading it',
    why: 'an approver who can edit their evidence has chosen what they are shown, and an approval over a self-selected pack is an opinion with a signature on it',
    apply: (surface) => {
      const block = surface.sections[0].evidence[0];
      block.read_only = false;
      block.writable_by = ['approver'];
      return `made ${surface.sections[0].role}'s ${block.evidence} block approver-writable`;
    },
  }],
  ['strip-banner', {
    expect: 'AS-R01',
    what: 'the page-level non-authoritative banner is removed (the sections keep theirs)',
    why: 'that sentence is the only thing standing between a tidy approval page and a decision nobody signed',
    apply: (surface) => { delete surface.banner; return 'removed the page banner'; },
  }],
  ['stale-plan-hash', {
    expect: 'AS-R10',
    what: 'the page keeps a plan_hash from an earlier compilation',
    why: 'this is what actually happens: a profile gains a field, the plan recompiles, and the page silently binds last month\'s roles',
    apply: (surface) => {
      surface.plan_hash = `${'0'.repeat(16)}${String(surface.plan_hash).slice(16)}`;
      return 'aged the plan_hash by one compilation';
    },
  }],
]);

// --- arguments ------------------------------------------------------------------------------------

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(name);
  if (i === -1) return null;
  const v = argv[i + 1];
  if (v === undefined || v.startsWith('--')) die(`${name} needs a value`);
  argv.splice(i, 2);
  return v;
};

const planPath = flag('--plan');
const wantChange = flag('--change');
const breakId = flag('--break');
const stage = argv.find((a) => !a.startsWith('--')) || 'PA1';

if (!STAGES.includes(stage)) die(`stage ${JSON.stringify(stage)} is not one of ${STAGES.join(' | ')}`);
if (breakId !== null && !BREAKS.has(breakId)) {
  die(`unknown --break ${JSON.stringify(breakId)}. The mutations are:\n`
    + [...BREAKS].map(([id, b]) => `  ${id.padEnd(17)} ${b.expect}  ${b.what}`).join('\n'));
}

// --- the plan -------------------------------------------------------------------------------------

const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };

function resolvePlan() {
  if (planPath) {
    const plan = readJson(planPath);
    if (!plan) die(`cannot read a compiled control plan at ${planPath}`);
    return { plan, from: planPath };
  }
  // The gate's own loader, over the working directory the gate will be run in.
  const found = loadPlans(process.cwd());
  const wanted = wantChange
    ? found.filter((p) => p.change_id === wantChange)
    : found.filter((p) => (p.plan?.required_gates || []).includes(stage));
  if (wanted.length) {
    if (wanted.length > 1) note(`${wanted.length} compiled plans here compile ${stage}; taking ${wanted[0].change_id}. Pass --change to choose.`);
    return { plan: wanted[0].plan, from: `${CHANGES_DIR}/${wanted[0].change_id} (the plan the gate itself loads)` };
  }
  if (wantChange) die(`no compiled control plan under ${CHANGES_DIR} names ${wantChange}`);
  if (found.length) {
    die(`${found.length} compiled plan(s) under ${CHANGES_DIR}, none of which compiles ${stage}`
      + ` — a page for a gate nobody compiled asks people to approve something no gate will read`);
  }
  // Bundle fallback: no adopted change here, so use the bundle's own worked change. Deliberately
  // last and deliberately loud — silently deriving from a fixture in a repository that has its own
  // plan is how a surface comes to bind a role set belonging to somebody else's change.
  if (!existsSync(BUNDLED_PLAN)) {
    die(`no compiled control plan under ${CHANGES_DIR}, and no bundled change-example beside this script.\n`
      + 'Pass --plan <control-plan.json>, or stage a compiled change first.');
  }
  note(`no compiled change under ${CHANGES_DIR} — falling back to the bundled change-example/control-plan.json`);
  return { plan: readJson(BUNDLED_PLAN), from: 'change-example/control-plan.json (bundled)' };
}

const { plan, from } = resolvePlan();
note(`${stage} · ${plan.change_id} · plan_hash ${String(plan.plan_hash).slice(0, 12)}… · from ${from}`);

// --- derive ---------------------------------------------------------------------------------------

const { surface, findings, notices } = deriveApprovalSurface(plan, { stage });
for (const n of notices) note(n);
if (findings.length) die(`\nDerivation ABORTED — no surface is emitted.\n\n  - ${findings.join('\n  - ')}`, 1);

// A surface that does not verify against the plan it was derived from is a bug in the deriver, not
// in the plan. Emitting one would make the gate's failure look like the example's fault.
const clean = verifyApprovalSurface(surface, plan);
if (clean.length) die(`\nThe derived surface does not verify — this is a bug in the derivation.\n\n  - ${clean.join('\n  - ')}`, 1);

if (breakId !== null) {
  const b = BREAKS.get(breakId);
  const did = b.apply(surface);
  surface._comment = `MUTATED by approval-surface-example/derive.mjs --break ${breakId} — ${b.what}. `
    + `${surface._comment}`;
  // Last, and after every other edit: a digest computed before the final field is written is a
  // stale digest, and AS-R10 would then fire on every break and hide the rule under test.
  surface.digest = digestOf(surface);
  // A mutation that has stopped mutating is the failure this whole directory exists to close: the
  // gate would go green on the negative case and nobody would notice. Refuse to emit one.
  const broken = verifyApprovalSurface(surface, plan);
  if (!broken.some((f) => f.startsWith(`${b.expect}:`))) {
    die(`\n--break ${breakId} (${did}) no longer trips ${b.expect}.\n`
      + `Either the rule has been weakened or the mutation no longer expresses it — either way the\n`
      + `negative case is not being tested any more. Findings raised:\n\n  - ${broken.join('\n  - ') || '(none at all)'}`, 1);
  }
  note(`BROKEN ON PURPOSE: ${did} — expect ${b.expect}. ${b.why}.`);
}

process.stdout.write(`${JSON.stringify(surface, null, 2)}\n`);
