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

// rc.8 WS3: institution profiles compose alongside base + jurisdiction + product. The dir a
// profile is found in gives its default kind (a profile may still declare its own `kind`).
const PROFILE_DIRS = ['profiles', 'profiles/jurisdictions', 'profiles/products', 'profiles/institutions'];
const KIND_BY_DIR = {
  profiles: 'base',
  'profiles/jurisdictions': 'jurisdiction',
  'profiles/products': 'product',
  'profiles/institutions': 'institution',
};

/** Resolve a profile name to { path, dir } under the profile dirs, or null. */
function findProfile(name, baseDir) {
  for (const d of PROFILE_DIRS) {
    const path = `${baseDir}/${d}/${name}.json`;
    if (existsSync(path)) return { path, dir: d };
  }
  return null;
}

/** Resolve profile names to loaded data. Missing profiles are findings, not defaults. */
export function loadProfiles(names, baseDir = process.cwd()) {
  const loaded = [];
  const findings = [];
  for (const name of names || []) {
    const hit = findProfile(name, baseDir);
    if (!hit) {
      findings.push(`profile ${name} not found under ${PROFILE_DIRS.join(', ')} — an unresolvable profile blocks the change`);
      continue;
    }
    try { loaded.push(JSON.parse(readFileSync(hit.path, 'utf8'))); }
    catch (e) { findings.push(`profile ${name} is not valid JSON: ${e.message}`); }
  }
  return { profiles: loaded, findings };
}

/**
 * rc.8 WS4 — bind the plan to the EXACT content of every profile it compiled from, not just
 * their names. Each binding is { profile, kind, version, digest }; the digest is over the
 * profile's canonical content, so any change to a profile makes a stored plan stale (the
 * change-envelope gate recompiles and compares). This is what lets a BrainKit or institution
 * profile revision force recompilation instead of silently riding an old plan.
 */
export function resolveBindings(names, baseDir = process.cwd()) {
  const bindings = [];
  const findings = [];
  for (const name of names || []) {
    const hit = findProfile(name, baseDir);
    if (!hit) { findings.push(`profile ${name} not found under ${PROFILE_DIRS.join(', ')} — cannot bind an unresolvable profile`); continue; }
    let data;
    try { data = JSON.parse(readFileSync(hit.path, 'utf8')); }
    catch (e) { findings.push(`profile ${name} is not valid JSON: ${e.message}`); continue; }
    const kind = typeof data.kind === 'string' ? data.kind : (KIND_BY_DIR[hit.dir] || 'base');
    const binding = {
      profile: name,
      kind,
      version: typeof data.version === 'string' ? data.version : null,
      digest: 'sha256:' + createHash('sha256').update(canonical(data)).digest('hex'),
    };
    bindings.push(binding);
  }
  bindings.sort((a, b) => a.profile.localeCompare(b.profile));
  return { bindings, findings };
}

const union = (into, from) => { for (const x of from || []) into.add(x); };

/**
 * Compile the control plan for an envelope against its profiles.
 * `bindings` (rc.8 WS4) pins the exact profile content the plan compiled from; pass the output
 * of resolveBindings(envelope.required_profiles). Tests may omit it (an empty binding set is a
 * valid, if unpinned, plan). Returns { plan, findings } — a non-empty findings list means BLOCKED.
 */
export function compile(envelope, profiles, bindings = []) {
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
  // rc.8 WS4: pin the exact profile content the plan compiled from.
  plan.profile_bindings = [...bindings].sort((a, b) => a.profile.localeCompare(b.profile));
  plan.plan_hash = planHash(plan);
  return { plan, findings: [] };
}

/**
 * Canonical JSON serialization — recursive, object keys sorted at EVERY depth. rc.8 WS4 replaces
 * the old top-level `JSON.stringify(rest, keys)` replacer, which was a whitelist that silently
 * DROPPED any nested key (e.g. a profile_binding's digest) from the serialization — so a change
 * to nested content did not change the hash. This function hashes the whole tree, so it does.
 */
export function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  const keys = Object.keys(value).filter((k) => value[k] !== undefined).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
}

/** Canonical hash of a plan (excluding plan_hash itself). Deterministic across runs and depths. */
export function planHash(plan) {
  const { plan_hash, ...rest } = plan;
  return createHash('sha256').update(canonical(rest)).digest('hex');
}

// CLI: compile an envelope's plan. `--write` stores it at the envelope's control_plan path.
if (import.meta.url === `file://${process.argv[1]}`) {
  const [envPath] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  if (!envPath) { process.stderr.write('usage: node core/policy-compiler.mjs <change-envelope.json> [--write]\n'); process.exit(2); }
  const envelope = JSON.parse(readFileSync(envPath, 'utf8'));
  const { profiles, findings: pf } = loadProfiles(envelope.required_profiles);
  const { bindings, findings: bf } = resolveBindings(envelope.required_profiles);
  const { plan, findings } = compile(envelope, profiles, bindings);
  const all = [...pf, ...bf, ...findings];
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
