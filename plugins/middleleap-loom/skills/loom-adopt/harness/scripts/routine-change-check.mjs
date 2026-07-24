// HG-0013 — the routine-change lane. The Loom's dark boundary is the PR: the loop runs
// autonomous up to proposal, and a human disposes. That rule is deliberately absolute for
// changes that matter — but applying it identically to a lint fix and an auth rewrite taxes
// the one resource that does not scale (the reviewer) on changes no one needs to read.
//
// This gate is the sanctioned, narrow relaxation. A second-line owner authorizes a small
// CLASS of low-risk changes to auto-merge without per-change human review, for a BOUNDED
// time, via a standing `routine-envelope.json`. A routine change then INHERITS that envelope
// (the deck's capability model: validate the capability once, let conforming use-cases inherit
// approval) instead of being individually classified. Human approval moves from per-change to
// per-envelope; it never disappears. Anything outside the envelope RE-EVALUATES to the normal
// human-merge lane — that is a fallback, not a failure.
//
// Three properties make this safe to run unattended:
//   1. The envelope is second-line-OWNED and EXPIRING — the agent uses it, never edits it
//      (routine-envelope.json is a CONTROL_TARGET; the owner resolves to a human in the
//      second-line group, disjoint from builders per the identity gate).
//   2. A FLOOR denylist in THIS file is absolute — no envelope, however misconfigured, can
//      authorize a change that touches the control plane, the API contract, auth, or
//      migrations. The floor is code, not configuration.
//   3. The lane is CLAIMED, not defaulted. Absent a claim, every PR takes the normal lane.
//      A claim that does not fit the envelope in EVERY respect fails the gate, so a claim can
//      only ever narrow scrutiny to exactly what the second line pre-authorized.
//
// Enforcement of record: a merge-queue/branch ruleset that auto-merges a PR only when this
// gate is among the passing required checks. As shipped this gate is mechanically-validated;
// platform-enforced is the adopter's (activation-runbook + a negative bypass probe).
//
// Run from the repo root: `node scripts/routine-change-check.mjs [--base <ref>]`.
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import process from 'node:process';
import { loadRegistry, identityOf } from './identity-registry-check.mjs';
import { pathToFileURL } from 'node:url';

export const ENVELOPE_PATH = 'docs/governance/routine-envelope.json';
export const CLAIM_PATH = 'docs/governance/routine-claim.json';

// The known routine classes. An envelope may allow a SUBSET of these; it can never invent a
// class outside the set, and a claim must name one the envelope allows.
export const ROUTINE_CLASSES = ['dependency-patch', 'lint-fix', 'doc-fix', 'formatting', 'comment-fix'];

// The absolute floor: paths no routine envelope can ever reach, whatever it declares. This is
// the control plane and the other high-blast-radius surfaces — a change touching any of them
// is not routine BY CONSTRUCTION. ADOPT: append your auth and migration roots; never remove a
// control-plane entry.
export const FLOOR_DENY = [
  '.github/', 'scripts/', 'core/', 'profiles/', 'discovery/gates/',
  'docs/governance/', 'CODEOWNERS', '.claude/hooks/', '.claude/settings.json',
  'institution/', // rc.8: the Institutional BrainKit is never a routine change
  'specs/', 'spec/', // the API contract
  'migrations/', 'auth/', // ADOPT: your auth + schema-migration roots
];

/** Match one path against one pattern: `*.ext`, a `dir/` prefix, or an exact/dir path. */
export function pathMatch(pattern, path) {
  if (pattern.startsWith('*.')) return path.endsWith(pattern.slice(1));
  const p = pattern.startsWith('/') ? pattern.slice(1) : pattern;
  if (p.endsWith('/')) return path === p.slice(0, -1) || path.startsWith(p);
  return path === p || path.startsWith(p + '/');
}
const matchesAny = (patterns, path) => (patterns || []).some((p) => pathMatch(p, path));

/**
 * Pure lane logic. `envelope` is the standing authorization; `claim` is what this PR asserts
 * ({ envelope, class, changed_paths, diff_lines, gates_green }); `registry` resolves the
 * owner; `asOf` is the date the expiry is judged against. Returns findings — [] means the
 * change qualifies for auto-merge; anything else routes it to the normal human-merge lane.
 */
export function evaluate(envelope, claim, registry, asOf) {
  const findings = [];
  if (!envelope) return ['no routine-envelope.json — there is no standing authorization; take the normal lane'];
  const eid = envelope.envelope_id || '(no id)';

  // rc.12 WS2.4: a suspended envelope authorizes nothing. Config-reconciliation (or a human) sets
  // `suspended: true` when the control plane has drifted; the routine lane fails closed until it is
  // restored, so auto-merge cannot ride a weakened platform.
  if (envelope.suspended === true) return [`${eid}: routine lane is SUSPENDED (control-plane drift or manual hold) — every change takes the normal human-review lane until suspension is lifted`];

  // The owner is a human in the second line — never an agent, never a builder.
  const owner = envelope.owner;
  if (!owner) findings.push(`${eid}: envelope has no owner — a routine envelope must be owned by a named second-line human`);
  else if (!registry) findings.push(`${eid}: no identity registry — the owner ${owner} cannot be resolved`);
  else {
    const who = identityOf(registry, owner);
    if (!who) findings.push(`${eid}: owner ${owner} is not in the identity registry`);
    else {
      if (who.kind !== 'human') findings.push(`${eid}: owner ${owner} is not a human — an agent cannot own the routine lane`);
      if (!(who.groups || []).includes('second-line')) findings.push(`${eid}: owner ${owner} is not in the second-line group — the lane must be second-line-owned`);
    }
  }

  // The envelope expires. A stale authorization is no authorization. An unparseable expiry
  // must FAIL, not silently never-expire (`new Date('not-a-date')` is NaN, and every NaN
  // comparison is false — the "bounded in time" property would evaporate without this).
  if (!envelope.expires) findings.push(`${eid}: envelope has no expiry — a routine authorization must be bounded in time`);
  else if (Number.isNaN(new Date(envelope.expires).getTime())) findings.push(`${eid}: envelope expiry ${JSON.stringify(envelope.expires)} is not a valid date — cannot confirm the authorization is in force`);
  else if (asOf && new Date(asOf) > new Date(envelope.expires)) findings.push(`${eid}: envelope expired ${envelope.expires} — re-authorize with the second line`);

  // The claim names a class the envelope allows (and that is a known routine class).
  const cls = claim?.class;
  if (!cls) findings.push(`${eid}: claim names no class`);
  else {
    if (!ROUTINE_CLASSES.includes(cls)) findings.push(`${eid}: class ${JSON.stringify(cls)} is not a routine class (${ROUTINE_CLASSES.join(', ')})`);
    if (!(envelope.allowed_classes || []).includes(cls)) findings.push(`${eid}: class ${cls} is not allowed by this envelope (${(envelope.allowed_classes || []).join(', ') || 'none'})`);
  }

  // Every changed path clears the floor, is inside the allowlist, and outside the denylist.
  const paths = claim?.changed_paths || [];
  if (paths.length === 0) findings.push(`${eid}: claim lists no changed paths — cannot verify the diff is in scope`);
  for (const path of paths) {
    if (matchesAny(FLOOR_DENY, path)) findings.push(`${eid}: ${path} is under the absolute floor (control plane / contract / auth / migrations) — never routine`);
    else if (!matchesAny(envelope.path_allow, path)) findings.push(`${eid}: ${path} is outside the envelope's path_allow`);
    else if (matchesAny(envelope.path_deny, path)) findings.push(`${eid}: ${path} is under the envelope's path_deny`);
  }

  // The diff is small, and every gate the envelope requires is green.
  const max = envelope.max_diff_lines;
  if (typeof max === 'number' && typeof claim?.diff_lines === 'number' && claim.diff_lines > max) {
    findings.push(`${eid}: diff is ${claim.diff_lines} lines, over the envelope cap of ${max}`);
  }
  const green = new Set(claim?.gates_green || []);
  for (const g of envelope.required_green_gates || []) {
    if (!green.has(g)) findings.push(`${eid}: required gate ${g} is not recorded green in the claim`);
  }
  return findings;
}

/** Derive the real changed paths + line count from git, so the lane is judged on the actual
 *  diff, not on what the claim asserts. Returns null if git is unavailable — the caller MUST
 *  treat that as fatal (see check()), never as a fallback to the claim's self-declared paths.
 *  `--no-renames` is essential: with rename detection on, git emits `{src => scripts}/x.mjs`,
 *  a form the FLOOR_DENY patterns do not match, so a rename INTO the control plane would slip. */
export function gitDiff(base) {
  try {
    const out = execSync(`git diff --numstat --no-renames ${base}...HEAD`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const changed_paths = [];
    let diff_lines = 0;
    for (const line of out.split('\n')) {
      const m = line.match(/^(\d+|-)\t(\d+|-)\t(.+)$/);
      if (!m) continue;
      changed_paths.push(m[3]);
      diff_lines += (m[1] === '-' ? 0 : Number(m[1])) + (m[2] === '-' ? 0 : Number(m[2]));
    }
    return { changed_paths, diff_lines };
  } catch { return null; }
}

export function check(cwd = process.cwd(), base = 'origin/main') {
  if (!existsSync(`${cwd}/${CLAIM_PATH}`)) return { claimed: false, findings: [] };
  const claim = JSON.parse(readFileSync(`${cwd}/${CLAIM_PATH}`, 'utf8'));
  const envelope = existsSync(`${cwd}/${ENVELOPE_PATH}`) ? JSON.parse(readFileSync(`${cwd}/${ENVELOPE_PATH}`, 'utf8')) : null;
  const registry = loadRegistry(cwd);
  // Judge the lane on the REAL git diff, never on the claim's self-declared paths. If git
  // cannot produce the diff (missing base ref, shallow clone, detached worktree), that is
  // fatal for a control whose whole point is "judged on the actual diff" — fail to the normal
  // human-merge lane rather than trusting what the PR author wrote.
  const real = gitDiff(base);
  if (!real) {
    return { claimed: true, findings: [`cannot compute the git diff against ${base} — the routine lane must be judged on the actual diff, not the claim; take the normal human-merge lane`] };
  }
  claim.changed_paths = real.changed_paths;
  claim.diff_lines = real.diff_lines;
  return { claimed: true, findings: evaluate(envelope, claim, registry, new Date()) };
}

// CLI (skipped when imported by the test suite).
//
// Two modes — the split that makes the lane platform-legible (W2, closes F2):
//   default          the normal-lane check: an unqualified CLAIM fails; no claim / ordinary
//                    work passes. This is the required `normal-human-review` status.
//   --assert-routine the routine-qualified check: exits 0 ONLY for a genuinely qualifying
//                    claim; a missing claim or a non-fit both exit non-zero. This is the
//                    separate `routine-qualified` status a merge queue keys auto-merge on.
// A GitHub ruleset cannot read explanatory text — only the exit of a named check — so the two
// outcomes MUST live in two check contexts. Auto-merge requires `routine-qualified`; that an
// ordinary PR fails `--assert-routine` is exactly why it cannot enter the routine queue.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const baseArg = process.argv.indexOf('--base');
  const base = baseArg >= 0 ? process.argv[baseArg + 1] : 'origin/main';
  const assertRoutine = process.argv.includes('--assert-routine');
  const { claimed, findings } = check(process.cwd(), base);

  if (assertRoutine) {
    // routine-qualified: pass ONLY for a qualifying claim.
    if (!claimed) {
      process.stderr.write('Routine-qualified check — no routine claim: this PR is NOT routine-qualified (it takes the normal human-merge lane). FAIL\n');
      process.exit(1);
    }
    if (findings.length) {
      process.stderr.write('\nRoutine-qualified check — a routine claim that DOES NOT QUALIFY\n\n');
      for (const f of findings) process.stderr.write(`  - ${f}\n`);
      process.exit(1);
    }
    process.stdout.write('Routine-qualified check — change fits the second-line envelope; eligible for the auto-merge queue. OK\n');
    process.exit(0);
  }

  // normal-human-review: an unqualified CLAIM fails; no claim / ordinary work passes.
  if (!claimed) {
    process.stdout.write('Routine-change lane (HG-0013) — no claim; normal human-merge lane applies. OK\n');
    process.exit(0);
  }
  if (findings.length) {
    process.stderr.write('\nRoutine-change lane (HG-0013) — DOES NOT QUALIFY (re-evaluate to the normal lane)\n\n');
    for (const f of findings) process.stderr.write(`  - ${f}\n`);
    process.stderr.write('\nDrop the routine claim and take the normal human-merge lane, or bring the change\nwithin the second-line-owned envelope. See governance/routine-envelope.template.json.\n');
    process.exit(1);
  }
  process.stdout.write('Routine-change lane (HG-0013) — change fits the second-line envelope; auto-merge authorized. OK\n');
}
