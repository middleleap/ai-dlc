// The identity-registry gate (Loom 2.0 §8). Approvals mean nothing if "who" is a free-text
// field. The registry — docs/governance/identities.json, CODEOWNERS-owned by a non-builder
// group — is the repo-side contract every approver/validator/classifier field resolves
// against. This gate enforces the registry's own invariants:
//
//   every identity has an id, a kind (human|agent) and known groups ·
//   AGENTS HOLD NO APPROVER ROLES (they build; they never approve) ·
//   second-line membership is DISJOINT from builders (you cannot challenge your own work).
//
// DELEGATION AND QUORUM (rc.38 · flow-plan Phase 4.5). The registry named exactly one human per
// role, so a role holder on leave stopped every change needing that role — and the pressure that
// creates is not "wait", it is "put someone else's name in the file". Two mechanisms, both
// RE-PRICING approval rather than removing it:
//
//   delegates  — an identity may name deputies: `[{to, from, until, granted_by}]`. The deputy
//                inherits the delegator's roles FOR THE WINDOW, and inherits every disjointness
//                rule with them: a deputy is still human, still never an agent, and a second-line
//                delegator may not deputise a builder. Delegation EXPIRES (the exemption idiom:
//                a grant with no end date is a permanent transfer wearing a temporary word), and
//                is granted by an independent second-line human who is neither party.
//   quorum     — `"quorum": { "<role>": K }` requires ANY K of the role's holders to approve
//                instead of the default 1. The default is 1 everywhere it is not stated, and K
//                may only be raised: a quorum is a TIGHTENING, and a `K` below 1 is refused.
//
// Neither loosens anything. Delegation moves WHO may approve, inside a window a second-line human
// signed for; quorum moves HOW MANY must.
//
// Run from the repo root: `node scripts/identity-registry-check.mjs`.
import { existsSync, readFileSync } from 'node:fs';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export const REGISTRY_LOCATIONS = ['docs/governance/identities.json', 'identities.json'];
export const KINDS = ['human', 'agent'];
export const DELEGATION_FIELDS = ['to', 'from', 'until', 'granted_by'];

/** Load the registry from disk, or null. */
export function loadRegistry(cwd = process.cwd()) {
  const path = REGISTRY_LOCATIONS.map((p) => `${cwd}/${p}`).find(existsSync);
  if (!path) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** The registry entry for an id, or undefined. */
export const identityOf = (registry, id) => (registry?.identities || []).find((i) => i.id === id);

const parseTime = (v) => { if (typeof v !== 'string') return null; const t = Date.parse(v); return Number.isNaN(t) ? null : t; };

/**
 * The delegation, if any, by which `id` holds `role` at `now`. Returns
 * `{ from: <delegator id>, until }` or null.
 *
 * A delegation only ever transfers what the DELEGATOR actually holds, so a deputy can never end
 * up with a role nobody granted. The window is closed at both ends and both ends must parse: a
 * malformed window is NOT a delegation (fail closed), never an open-ended one.
 */
export function delegationFor(registry, id, role, now = Date.now()) {
  for (const d of registry?.identities || []) {
    if (!(d.roles || []).includes(role)) continue;      // cannot delegate what you do not hold
    if (d.kind !== 'human') continue;                    // and an agent holds nothing to delegate
    for (const g of d.delegates || []) {
      if (g?.to !== id) continue;
      const from = parseTime(g.from);
      const until = parseTime(g.until);
      if (from === null || until === null) continue;     // unparseable window ⇒ no delegation
      if (now < from || now > until) continue;           // lapsed or not yet live
      return { from: d.id, until: g.until, granted_by: g.granted_by };
    }
  }
  return null;
}

/** How many distinct holders of `role` must approve. Default 1; a quorum may only raise it. */
export function quorumFor(registry, role) {
  const k = registry?.quorum?.[role];
  return Number.isInteger(k) && k > 1 ? k : 1;
}

/**
 * Resolve an approval-ish reference: the id must exist, be HUMAN, and hold the role.
 * Returns findings ([] ⇒ resolves cleanly). `label` names the field for the message.
 *
 * rc.38: the role may be held BY DELEGATION (Phase 4.5). The deputy is still resolved, still
 * human, still never an agent — the delegation only supplies the role, and only inside the window
 * a second-line human granted. Every acceptance is pushed to `opts.notices` when one is supplied:
 * an approval given by a deputy must never be indistinguishable from one given by the holder.
 */
export function resolveApprover(registry, id, role, label, opts = {}) {
  if (!(typeof id === 'string' && id.trim())) return [`${label}: no identity given — a role name or free text is not an approver`];
  const who = identityOf(registry, id);
  if (!who) return [`${label}: identity ${JSON.stringify(id)} is not in the registry — unresolvable approvals do not count`];
  const findings = [];
  if (who.kind === 'agent') findings.push(`${label}: ${id} is an AGENT — agents prepare evidence, they never approve`);
  if (role && !(who.roles || []).includes(role)) {
    const via = who.kind === 'agent' ? null : delegationFor(registry, id, role, opts.now ?? Date.now());
    if (via) {
      opts.notices?.push(`${label}: ${id} holds ${role} BY DELEGATION from ${via.from} until ${via.until} (granted by ${via.granted_by}) — a deputy approval, recorded as one`);
    } else {
      findings.push(`${label}: ${id} does not hold the required role ${role}`);
    }
  }
  return findings;
}

/**
 * Registry-invariant findings. Empty ⇒ the registry is internally sound.
 * `notices` (optional) collects lapsed delegations — inert, so not a failure, but a delegation
 * nobody removed is a grant nobody is tracking, and silence about it is how one comes back to life.
 */
export function evaluate(registry, { notices = null, now = Date.now() } = {}) {
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
  findings.push(...evaluateDelegations(registry, { notices, now }));
  findings.push(...evaluateQuorum(registry));
  return findings;
}

/**
 * rc.38 (flow-plan Phase 4.5) — the delegation blocks. A delegate inherits the role AND every
 * rule attached to it, so this is where those rules are asserted at registration time rather than
 * discovered at approval time.
 */
export function evaluateDelegations(registry, { notices = null, now = Date.now() } = {}) {
  const findings = [];
  for (const i of registry?.identities || []) {
    const delegates = i.delegates;
    if (delegates === undefined || delegates === null) continue;
    const label = `${i.id}: delegation`;
    if (!Array.isArray(delegates)) { findings.push(`${label} — delegates must be an ARRAY of {${DELEGATION_FIELDS.join(', ')}}`); continue; }
    if (delegates.length && (i.roles || []).length === 0) {
      findings.push(`${label} — ${i.id} holds no roles, so there is nothing to delegate; a deputy for nobody is a name with unexplained standing`);
    }
    if (delegates.length && i.kind !== 'human') {
      findings.push(`${label} — an ${i.kind} identity cannot delegate approval authority it may never hold`);
    }
    for (const g of delegates) {
      if (!g || typeof g !== 'object' || Array.isArray(g)) { findings.push(`${label} — each entry must be an object {${DELEGATION_FIELDS.join(', ')}}`); continue; }
      const who = `${label} to ${JSON.stringify(g.to)}`;
      for (const f of DELEGATION_FIELDS) {
        if (!(typeof g[f] === 'string' && g[f].trim())) findings.push(`${who} — missing ${f}${f === 'until' ? ' (a delegation with no end date is a permanent transfer of authority wearing a temporary word)' : ''}`);
      }
      const to = identityOf(registry, g.to);
      const grantor = identityOf(registry, g.granted_by);
      if (g.to && !to) findings.push(`${who} — the deputy is not in the registry; an unresolvable deputy cannot inherit anything`);
      if (to && to.kind !== 'human') findings.push(`${who} — the deputy is an ${to.kind}; agents build, they never approve, and delegation does not change that`);
      if (g.to === i.id) findings.push(`${who} — an identity cannot deputise itself`);
      // The deputy inherits the delegator's independence. A second-line holder deputising a
      // builder would hand the challenge function to the people being challenged — the exact
      // disjointness the registry asserts for direct membership, asserted for the inherited case.
      if (to && (i.groups || []).includes('second-line') && (to.groups || []).includes('builders')) {
        findings.push(`${who} — a second-line identity cannot deputise a BUILDER: a delegate inherits the independence the role requires, not just its name`);
      }
      // Independent grant, same idiom as an exemption: neither party may authorise the transfer.
      if (g.granted_by && !grantor) findings.push(`${who} — granted_by ${JSON.stringify(g.granted_by)} is not in the registry`);
      else if (grantor && !(grantor.groups || []).includes('second-line')) {
        findings.push(`${who} — granted_by ${g.granted_by} is not a second-line identity; delegating approval authority needs independent approval`);
      }
      if (g.granted_by && (g.granted_by === i.id || g.granted_by === g.to)) {
        findings.push(`${who} — granted_by ${g.granted_by} is a party to the delegation; neither the delegator nor the deputy may authorise it`);
      }
      const from = parseTime(g.from);
      const until = parseTime(g.until);
      if (g.from !== undefined && typeof g.from === 'string' && from === null) findings.push(`${who} — from ${JSON.stringify(g.from)} is not a parseable ISO-8601 timestamp`);
      if (g.until !== undefined && typeof g.until === 'string' && until === null) findings.push(`${who} — until ${JSON.stringify(g.until)} is not a parseable ISO-8601 timestamp`);
      if (from !== null && until !== null && until <= from) findings.push(`${who} — until ${g.until} does not follow from ${g.from}; the window is empty`);
      if (until !== null && until < now) {
        notices?.push(`${i.id} → ${g.to}: the delegation of ${(i.roles || []).join(', ')} LAPSED at ${g.until} and is no longer honoured. Remove it or renew it with a fresh second-line grant`);
      }
    }
  }
  return findings;
}

/**
 * rc.38 — `quorum: { role: K }`. A quorum can only ever demand MORE signatures, and it must be
 * satisfiable: a K larger than the number of humans holding the role is a rule that blocks every
 * change forever, which reads as rigour and functions as an outage.
 */
export function evaluateQuorum(registry) {
  const findings = [];
  const quorum = registry?.quorum;
  if (quorum === undefined || quorum === null) return findings;
  if (typeof quorum !== 'object' || Array.isArray(quorum)) return ['quorum must be an object mapping role → K'];
  for (const [role, k] of Object.entries(quorum)) {
    if (!Number.isInteger(k) || k < 1) {
      findings.push(`quorum for ${role} must be an integer ≥ 1 (got ${JSON.stringify(k)}) — a quorum may only ever raise the number of approvals, never lower it`);
      continue;
    }
    const holders = (registry.identities || []).filter((i) => i.kind === 'human' && (i.roles || []).includes(role));
    if (k > holders.length) {
      findings.push(`quorum for ${role} is ${k} but only ${holders.length} human identit${holders.length === 1 ? 'y holds' : 'ies hold'} it — an unsatisfiable quorum blocks every change that needs the role`);
    }
  }
  return findings;
}

// CLI (skipped when imported by the test suite).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const registry = loadRegistry();
  const notices = [];
  const findings = registry ? evaluate(registry, { notices })
    : [`no identity registry found (looked in ${REGISTRY_LOCATIONS.join(', ')}) — approvals cannot resolve`];
  for (const n of notices) process.stdout.write(`NOTICE: ${n}\n`);
  if (findings.length) {
    process.stderr.write('\nIdentity-registry gate — FAIL\n\n');
    for (const f of findings) process.stderr.write(`  - ${f}\n`);
    process.stderr.write('\nApprovals resolve against the registry: agents never approve, and second line is\ndisjoint from builders. See governance/identities.template.json.\n');
    process.exit(1);
  }
  process.stdout.write('Identity-registry gate — OK\n');
}
