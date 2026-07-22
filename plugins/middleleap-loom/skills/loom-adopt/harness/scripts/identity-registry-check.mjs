// The identity-registry gate (Loom 2.0 §8). Approvals mean nothing if "who" is a free-text
// field. The registry — docs/governance/identities.json, CODEOWNERS-owned by a non-builder
// group — is the repo-side contract every approver/validator/classifier field resolves
// against. This gate enforces the registry's own invariants:
//
//   every identity has an id, a kind (human|agent) and known groups ·
//   AGENTS HOLD NO APPROVER ROLES (they build; they never approve) ·
//   second-line membership is DISJOINT from builders (you cannot challenge your own work).
//
// Run from the repo root: `node scripts/identity-registry-check.mjs`.
import { existsSync, readFileSync } from 'node:fs';
import process from 'node:process';

export const REGISTRY_LOCATIONS = ['docs/governance/identities.json', 'identities.json'];
export const KINDS = ['human', 'agent'];

/** Load the registry from disk, or null. */
export function loadRegistry(cwd = process.cwd()) {
  const path = REGISTRY_LOCATIONS.map((p) => `${cwd}/${p}`).find(existsSync);
  if (!path) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** The registry entry for an id, or undefined. */
export const identityOf = (registry, id) => (registry?.identities || []).find((i) => i.id === id);

/**
 * Resolve an approval-ish reference: the id must exist, be HUMAN, and hold the role.
 * Returns findings ([] ⇒ resolves cleanly). `label` names the field for the message.
 */
export function resolveApprover(registry, id, role, label) {
  if (!(typeof id === 'string' && id.trim())) return [`${label}: no identity given — a role name or free text is not an approver`];
  const who = identityOf(registry, id);
  if (!who) return [`${label}: identity ${JSON.stringify(id)} is not in the registry — unresolvable approvals do not count`];
  const findings = [];
  if (who.kind === 'agent') findings.push(`${label}: ${id} is an AGENT — agents prepare evidence, they never approve`);
  if (role && !(who.roles || []).includes(role)) findings.push(`${label}: ${id} does not hold the required role ${role}`);
  return findings;
}

/** Registry-invariant findings. Empty ⇒ the registry is internally sound. */
export function evaluate(registry) {
  const findings = [];
  const ids = new Set();
  const identities = registry?.identities;
  if (!Array.isArray(identities) || identities.length === 0) {
    return ['registry has no identities — approvals cannot resolve (Loom 2.0 §8)'];
  }
  const knownGroups = new Set(Object.keys(registry.groups || {}));
  for (const i of identities) {
    if (!i.id) { findings.push('an identity has no id'); continue; }
    if (ids.has(i.id)) findings.push(`${i.id}: duplicate identity id`);
    ids.add(i.id);
    if (!KINDS.includes(i.kind)) findings.push(`${i.id}: kind must be human|agent (got ${JSON.stringify(i.kind)})`);
    for (const g of i.groups || []) if (!knownGroups.has(g)) findings.push(`${i.id}: unknown group ${g}`);
    if (i.kind === 'agent' && (i.roles || []).length > 0) {
      findings.push(`${i.id}: an agent identity holds approver roles (${i.roles.join(', ')}) — agents build, they never approve`);
    }
    const groups = new Set(i.groups || []);
    if (groups.has('second-line') && groups.has('builders')) {
      findings.push(`${i.id}: is in BOTH builders and second-line — independence requires disjoint membership`);
    }
  }
  return findings;
}

// CLI (skipped when imported by the test suite).
if (import.meta.url === `file://${process.argv[1]}`) {
  const registry = loadRegistry();
  const findings = registry ? evaluate(registry)
    : [`no identity registry found (looked in ${REGISTRY_LOCATIONS.join(', ')}) — approvals cannot resolve`];
  if (findings.length) {
    process.stderr.write('\nIdentity-registry gate — FAIL\n\n');
    for (const f of findings) process.stderr.write(`  - ${f}\n`);
    process.stderr.write('\nApprovals resolve against the registry: agents never approve, and second line is\ndisjoint from builders. See governance/identities.template.json.\n');
    process.exit(1);
  }
  process.stdout.write('Identity-registry gate — OK\n');
}
