// The policy compiler — Loom 2.0's core (plan §5). A change's risk classification COMPILES
// the path it must take: which gates run, which control functions approve, which evidence
// must exist. Teams do not choose their own route; the classification does.
//
// Profiles are pure DATA (profiles/*.json): a base profile (regulated-bank), jurisdiction
// profiles (jurisdictions/*), and product-type profiles (products/*). Each declares
// requirements per risk tier; the compiler takes the CUMULATIVE UNION up to the envelope's
// tier, then unions across profiles — so a higher tier can only ADD requirements, never
// remove them. Monotonicity is guaranteed by construction and proven by a property test.
//
// The compiled plan is deterministic (sorted, canonically hashed). The change-envelope gate
// recompiles and compares plan_hash on every run — a stored plan that no longer matches its
// inputs fails, so classification-time rigor cannot be defeated at execution time.
//
// This file is control plane (CONTROL_TARGETS): an agent that could edit the compiler could
// compile itself an easier path.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';

export const TIERS = ['low', 'medium', 'high', 'critical'];
export const CHANGE_TYPES = ['documentation', 'software-change', 'new-product', 'material-product-change'];
export const PRODUCT_CHANGE_TYPES = new Set(['new-product', 'material-product-change']);
// plan field ← the key profiles use for it
const FIELD_MAP = {
  required_gates: 'gates',
  required_approver_roles: 'approver_roles',
  required_evidence: 'evidence',
  pa1_sections: 'pa1_sections',
  pa2_sections: 'pa2_sections',
};
const PLAN_FIELDS = Object.keys(FIELD_MAP);

const PROFILE_DIRS = ['profiles', 'profiles/jurisdictions', 'profiles/products'];

/** Resolve profile names to loaded data. Missing profiles are findings, not defaults. */
export function loadProfiles(names, baseDir = process.cwd()) {
  const loaded = [];
  const findings = [];
  for (const name of names || []) {
    const path = PROFILE_DIRS.map((d) => `${baseDir}/${d}/${name}.json`).find(existsSync);
    if (!path) {
      findings.push(`profile ${name} not found under ${PROFILE_DIRS.join(', ')} — an unresolvable profile blocks the change`);
      continue;
    }
    try { loaded.push(JSON.parse(readFileSync(path, 'utf8'))); }
    catch (e) { findings.push(`profile ${name} is not valid JSON: ${e.message}`); }
  }
  return { profiles: loaded, findings };
}

const union = (into, from) => { for (const x of from || []) into.add(x); };

/**
 * Compile the control plan for an envelope against its profiles.
 * Returns { plan, findings } — a non-empty findings list means the change is BLOCKED.
 */
export function compile(envelope, profiles) {
  const findings = [];
  for (const field of ['change_id', 'product_id', 'change_type', 'risk_tier']) {
    if (!(typeof envelope?.[field] === 'string' && envelope[field].trim())) {
      findings.push(`envelope has no ${field} — an unclassified change is blocked`);
    }
  }
  if (envelope?.change_type && !CHANGE_TYPES.includes(envelope.change_type)) {
    findings.push(`unknown change_type ${JSON.stringify(envelope.change_type)} (one of: ${CHANGE_TYPES.join('|')})`);
  }
  const tierIdx = TIERS.indexOf(envelope?.risk_tier);
  if (envelope?.risk_tier && tierIdx < 0) {
    findings.push(`unknown risk_tier ${JSON.stringify(envelope.risk_tier)} (one of: ${TIERS.join('|')})`);
  }
  // Promise 1: a product must not be able to call itself "just a software change" — a
  // new or materially changed product cannot ride the low-risk route.
  if (PRODUCT_CHANGE_TYPES.has(envelope?.change_type) && envelope?.risk_tier === 'low') {
    findings.push('a new or materially changed product cannot be classified low — product changes take the product-governance route');
  }
  if (!Array.isArray(envelope?.required_profiles) || envelope.required_profiles.length === 0) {
    findings.push('envelope names no required_profiles — an unprofiled change is blocked');
  }
  if (findings.length) return { plan: null, findings };

  const acc = Object.fromEntries(PLAN_FIELDS.map((f) => [f, new Set()]));
  for (const p of profiles) {
    // Cumulative union up to the envelope's tier — higher tiers ADD, never remove.
    for (let i = 0; i <= tierIdx; i++) {
      const req = p.requirements?.[TIERS[i]];
      if (req) for (const f of PLAN_FIELDS) union(acc[f], req[FIELD_MAP[f]]);
    }
    for (const cond of p.conditional || []) {
      if (envelope.flags?.[cond.when]) for (const f of PLAN_FIELDS) union(acc[f], cond.adds?.[FIELD_MAP[f]]);
    }
  }
  const plan = {
    change_id: envelope.change_id,
    risk_tier: envelope.risk_tier,
    profiles: [...envelope.required_profiles].sort(),
  };
  for (const f of PLAN_FIELDS) plan[f] = [...acc[f]].sort();
  plan.plan_hash = planHash(plan);
  return { plan, findings: [] };
}

/** Canonical hash of a plan (excluding plan_hash itself). Deterministic across runs. */
export function planHash(plan) {
  const { plan_hash, ...rest } = plan;
  const canonical = JSON.stringify(rest, Object.keys(rest).sort());
  return createHash('sha256').update(canonical).digest('hex');
}

// CLI: compile an envelope's plan. `--write` stores it at the envelope's control_plan path.
if (import.meta.url === `file://${process.argv[1]}`) {
  const [envPath] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  if (!envPath) { process.stderr.write('usage: node core/policy-compiler.mjs <change-envelope.json> [--write]\n'); process.exit(2); }
  const envelope = JSON.parse(readFileSync(envPath, 'utf8'));
  const { profiles, findings: pf } = loadProfiles(envelope.required_profiles);
  const { plan, findings } = compile(envelope, profiles);
  const all = [...pf, ...findings];
  if (all.length) {
    process.stderr.write('\nPolicy compiler — BLOCKED\n\n');
    for (const f of all) process.stderr.write(`  - ${f}\n`);
    process.exit(1);
  }
  if (process.argv.includes('--write')) {
    const out = envPath.replace(/change-envelope\.json$/, envelope.control_plan || 'control-plan.json');
    writeFileSync(out, JSON.stringify(plan, null, 2) + '\n');
    process.stdout.write(`compiled control plan → ${out} (${plan.plan_hash.slice(0, 12)}…)\n`);
  } else {
    process.stdout.write(JSON.stringify(plan, null, 2) + '\n');
  }
}
