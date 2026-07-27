// The brownfield assessment (rc.27). Every entry point the Loom had assumed a greenfield repo:
// `adopt.mjs` installs, `loom status` reads the control catalog. Neither answers the question an
// existing codebase actually asks — *where do I stand, and what would adopting cost me?* — and
// "point it at your repo and find out" is the most common real adoption shape there is.
//
//   node assess.mjs --dest <repo-root> [--json]
//
// WHAT IT IS, and the line it does not cross. This reports what it can OBSERVE in a repository
// and recommends a starting tier. It is not a grade, not a score, and emphatically not a
// statement that anything is controlled: a file existing is not a control operating. The method's
// whole complaint about itself has been claims outrunning evidence, so this tool separates the
// three kinds of statement it can make and never lets them blur:
//
//   OBSERVED    a file is present, a gate ran here and passed  — checkable, stated flatly
//   INFERRED    "this looks like a regulated codebase"          — a guess, labelled as one
//   UNKNOWABLE  branch protection, IAM, whether the tests mean anything, whether those
//               CODEOWNERS teams are real people who review — printed EVERY run, because a
//               report that lists only what it can see reads as if that were everything
//
// WHY IT RECOMMENDS `core` ALMOST ALWAYS. Raising a tier is one flag and the deferred gates are
// already installed and silent; starting too high is the cliff `--tier` exists to remove. So the
// bar for recommending higher is not "this repo looks sophisticated" but "this repo already
// carries the governance data that tier requires" — observed, not impressions.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import process from 'node:process';
import { install, loadManifest, bundleVersion, readStamp } from './adopt.mjs';
import { TIERS, entriesForTier } from './adopt.mjs';

const HARNESS = dirname(fileURLToPath(import.meta.url));

const has = (root, p) => existsSync(join(root, p));
const read = (root, p) => { try { return readFileSync(join(root, p), 'utf8'); } catch { return null; } };
const listDir = (root, p) => { try { return readdirSync(join(root, p)); } catch { return []; } };

/** Signals that a repository is governed by something beyond ordinary engineering practice. */
export const REGULATED_SIGNALS = [
  'docs/governance/data-risk-register',
  'docs/governance/control-catalog.json',
  'docs/governance/identities.json',
  'compliance',
  'docs/compliance',
  'docs/regulatory',
];

/** Governance data whose PRESENCE is what would justify starting above `core`. */
export const GOVERNED_SIGNALS = [
  'docs/governance/identities.json',
  'docs/governance/model-manifest.json',
  'docs/governance/data-lifecycle.json',
  'docs/governance/product-evals.json',
];

/**
 * Base profiles this bundle actually ships. Read rather than assumed: recommending a profile the
 * adopter does not have would be the same defect this tool is careful about everywhere else —
 * naming something without checking it exists. `standard` arrives in a later bundle than
 * `regulated-bank`, so which of them is available genuinely varies.
 */
export function availableBases(harness = HARNESS) {
  const out = [];
  for (const f of listDir(harness, 'profiles')) {
    if (!f.endsWith('.json')) continue;
    try {
      const p = JSON.parse(readFileSync(join(harness, 'profiles', f), 'utf8'));
      if (p.kind === 'base' && typeof p.profile === 'string') out.push(p.profile);
    } catch { /* a malformed profile is the catalog gate's problem, not this tool's */ }
  }
  return out.sort();
}

/** Pure filesystem observation. No judgement here — `assess` does the interpreting. */
export function observe(root) {
  const codeowners = read(root, 'CODEOWNERS') ?? read(root, '.github/CODEOWNERS');
  const workflows = listDir(root, '.github/workflows').filter((f) => /\.ya?ml$/.test(f));
  let pkg = null;
  try { pkg = JSON.parse(read(root, 'package.json') ?? 'null'); } catch { pkg = null; }
  return {
    isGitRepo: has(root, '.git'),
    stamp: readStamp(root),
    codeowners: codeowners
      ? { present: true, placeholder: /@your-org\//.test(codeowners), teams: [...new Set([...codeowners.matchAll(/@[\w-]+\/[\w-]+/g)].map((m) => m[0]))] }
      : { present: false, placeholder: false, teams: [] },
    workflows,
    testScript: typeof pkg?.scripts?.test === 'string' ? pkg.scripts.test : null,
    regulatedSignals: REGULATED_SIGNALS.filter((p) => has(root, p)),
    governedSignals: GOVERNED_SIGNALS.filter((p) => has(root, p)),
    hasDiscovery: has(root, 'discovery'),
  };
}

/**
 * What a tier would cost, from a real dry-run install: files that would land, and files already
 * present that the installer would PRESERVE rather than overwrite (its collision behaviour, so
 * this is the true answer rather than a guess about it).
 */
export function costOfTier(root, tier, { manifest = loadManifest() } = {}) {
  const report = install(root, { dryRun: true, manifest, tier });
  const collisions = report.filter((r) => r.status === 'unverifiable-preserved' || r.status === 'merge-required' || r.status === 'local-edit-preserved');
  return {
    tier,
    entries: entriesForTier(manifest, tier).length,
    lands: report.filter((r) => r.status === 'installed' || String(r.status).startsWith('installed ')).length,
    collisions: collisions.map((r) => r.dest),
  };
}

/** Interpretation. Every claim carries its kind: observed, inferred, or explicitly unknowable. */
export function assess(obs, available = availableBases()) {
  const observed = [];
  const inferred = [];
  const actions = [];

  if (obs.stamp) {
    observed.push(`already adopted: Loom ${obs.stamp.bundle_version || '(unknown)'}, tier ${obs.stamp.tier || '(pre-tier)'}`);
    actions.push('This is not a brownfield adoption — run `loom version` and re-run the installer to upgrade.');
  }
  if (!obs.isGitRepo) actions.push('Not a git repository. The Loom\'s merge policy, waist gate and history-aware gates all assume git.');

  if (obs.codeowners.present && !obs.codeowners.placeholder && obs.codeowners.teams.length) {
    observed.push(`CODEOWNERS names ${obs.codeowners.teams.length} team(s) — the control-plane gate has something real to check`);
  } else if (obs.codeowners.present) {
    observed.push('CODEOWNERS exists but names no real team (or still carries @your-org placeholders)');
    actions.push('Fill CODEOWNERS with a team the coding agent is not a member of — HG-0002 rests on it.');
  } else {
    actions.push('No CODEOWNERS. This is the single highest-value thing to add: it is what makes "the agent cannot edit its own guardrails" true.');
  }

  if (obs.workflows.length) observed.push(`${obs.workflows.length} CI workflow(s) — the gates have somewhere to run`);
  else actions.push('No CI workflows. Gates that never run are documentation; wire the reference ci.yml.');

  if (obs.testScript) observed.push(`a test script is defined (\`${obs.testScript}\`)`);
  else actions.push('No test script found. Q1/Q1b assume a suite exists to weaken or strengthen.');

  if (obs.hasDiscovery) observed.push('a discovery/ directory already exists — reconcile rather than clobber');

  // INFERRED — a guess from directory names, and labelled as one wherever it is printed.
  const regulated = obs.regulatedSignals.length > 0;
  if (regulated) inferred.push(`regulated posture, from ${obs.regulatedSignals.join(', ')}`);

  // Tier: the bar for going above core is CARRYING the data that tier governs, not looking capable.
  const tier = obs.governedSignals.length >= 2 ? 'governed' : 'core';
  const tierWhy = tier === 'governed'
    ? `already carries ${obs.governedSignals.join(', ')} — the governed tier would have real content to gate, not empty templates`
    : 'core is the smallest adoption that is safe, and raising a tier later is one flag with the gates already installed and silent';

  // Recommend only from the bases this bundle actually ships. `standard` is newer than
  // `regulated-bank`, so naming it unconditionally would point some adopters at a file they do
  // not have — the exact "claim without checking" this tool is built to avoid.
  const bases = new Set(available);
  let profile;
  let profileWhy;
  if (regulated) {
    profile = bases.has('regulated-bank') ? 'regulated-bank' : available[0] ?? null;
    profileWhy = 'inferred from the governance directories above — confirm it; the tool cannot tell a regulator from a folder name';
  } else if (bases.has('standard')) {
    profile = 'standard';
    profileWhy = 'the warp without the regulator-facing apparatus; switch to regulated-bank if an actual regulator is involved';
  } else {
    profile = bases.has('regulated-bank') ? 'regulated-bank' : available[0] ?? null;
    profileWhy = 'the only base this bundle ships. It carries a regulated entity\'s approval apparatus, which may be more than you need — a lighter `standard` base lands in a later bundle';
  }

  return { observed, inferred, actions, available, recommendation: { tier, tierWhy, profile, profileWhy } };
}

/** What this tool structurally cannot see. Printed every run — omitting it is the whole failure mode. */
export const UNKNOWABLE = [
  'whether branch protection is active, and whether the agent identity is outside the approver group',
  'whether the CODEOWNERS teams are real people who actually review',
  'whether the test suite asserts anything meaningful',
  'whether secrets are vaulted, and what the agent identity can reach',
  'anything about your production environment, IAM, or data',
];

export function main(argv = process.argv.slice(2)) {
  const arg = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
  const root = resolve(arg('--dest') || process.cwd());
  if (!existsSync(root)) { process.stderr.write(`no such directory: ${root}\n`); return 2; }

  const obs = observe(root);
  const result = assess(obs);
  const costs = TIERS.map((t) => costOfTier(root, t));

  if (argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify({ root, bundle: bundleVersion(), observations: obs, ...result, costs, unknowable: UNKNOWABLE }, null, 2)}\n`);
    return 0;
  }

  process.stdout.write(`\nLoom assessment — ${root}\n  against bundle ${bundleVersion()}\n\n`);

  process.stdout.write('OBSERVED — checkable facts about this repository\n');
  if (result.observed.length) for (const o of result.observed) process.stdout.write(`  · ${o}\n`);
  else process.stdout.write('  · nothing the Loom recognises yet\n');

  if (result.inferred.length) {
    process.stdout.write('\nINFERRED — a guess from what is on disk, not a finding\n');
    for (const i of result.inferred) process.stdout.write(`  · ${i}\n`);
  }

  process.stdout.write('\nWHAT ADOPTING WOULD COST\n');
  for (const c of costs) {
    const clash = c.collisions.length ? `, ${c.collisions.length} existing file(s) PRESERVED (never overwritten)` : '';
    process.stdout.write(`  ${c.tier.padEnd(9)} ${String(c.lands).padStart(3)} file(s) land${clash}\n`);
  }
  const clashes = costs.find((c) => c.tier === result.recommendation.tier)?.collisions ?? [];
  if (clashes.length) {
    process.stdout.write('\n  Files you already have, at the recommended tier:\n');
    for (const f of clashes) process.stdout.write(`    · ${f}  → yours is kept; the Loom's lands beside it as <file>.loom-new\n`);
  }

  process.stdout.write(`\nRECOMMENDATION\n  tier     ${result.recommendation.tier} — ${result.recommendation.tierWhy}\n`);
  process.stdout.write(`  profile  ${result.recommendation.profile} — ${result.recommendation.profileWhy}\n`);

  if (result.actions.length) {
    process.stdout.write('\nBEFORE OR ALONGSIDE ADOPTING\n');
    for (const a of result.actions) process.stdout.write(`  · ${a}\n`);
  }

  process.stdout.write('\nWHAT THIS ASSESSMENT CANNOT SEE\n');
  for (const u of UNKNOWABLE) process.stdout.write(`  · ${u}\n`);
  process.stdout.write(
    '\nNothing above says a control is operating. A file is not a control; a gate that has never run\n' +
    'is not evidence. This is a starting point for an adoption, not a grade of one.\n\n' +
    `Next:  node ${'adopt.mjs'} --dest ${root} --tier ${result.recommendation.tier} --dry-run\n\n`,
  );
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main());
