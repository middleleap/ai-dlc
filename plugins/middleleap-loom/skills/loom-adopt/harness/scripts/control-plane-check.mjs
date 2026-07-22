// HG-0002 — the control-plane integrity gate. An ungoverned agent can edit its own
// guardrails; the decision that closes that gap is an immutable control plane: the hooks,
// gates, workflows, settings, and register live outside the agent's write scope, enforced by
// CODEOWNERS + branch protection. Branch protection is a platform setting (see
// governance/activation-runbook.md); this gate enforces the repo-side half deterministically:
//
//   Every control-plane path MUST be owned in CODEOWNERS by a named group.
//
// CODEOWNERS uses last-match-wins, and a rule with a pattern but no owners *removes*
// ownership. So a control file is "unprotected" if no rule matches it, or the last matching
// rule has zero owners — either way, a change to it would not require Code Owner review. That
// is exactly the failure mode HG-0002 exists to prevent, so this gate fails the build on it.
//
// Run from the repo root: `node scripts/control-plane-check.mjs` (exit 1 on any finding).
import { existsSync, readFileSync } from 'node:fs';
import process from 'node:process';

// ADOPT: the control-plane files the agent must never change without four-eyes — EVERY gate,
// hook, workflow, and governance manifest, not representative samples (1.10: an unlisted gate
// is an unprotected gate). Add yours; remove any this repo doesn't have. Keep CODEOWNERS and
// this gate in the list — a control plane that doesn't protect itself isn't one.
export const CONTROL_TARGETS = [
  '.claude/hooks/pii-guard.sh',
  '.claude/hooks/spec-tripwire.sh',
  '.claude/hooks/test-tripwire.sh',
  '.claude/settings.json',
  'discovery/gates/validate.mjs',
  'scripts/discovery-link-check.mjs',
  'scripts/control-plane-check.mjs',
  'scripts/model-provenance-check.mjs',
  'scripts/evidence-seal-check.mjs',
  'scripts/data-lifecycle-check.mjs',
  'scripts/operations-signal-check.mjs',
  'scripts/test-integrity-check.mjs',
  'scripts/secrets-scan.mjs',
  'scripts/sast-check.mjs',
  'scripts/supply-chain-check.mjs',
  'scripts/control-catalog-check.mjs',
  '.github/workflows/ci.yml',
  'docs/governance/data-risk-register/controls.json',
  'docs/governance/control-catalog.json',
  'docs/governance/model-manifest.json',
  'docs/governance/evidence/manifest.json',
  'CODEOWNERS',
];

const CODEOWNERS_LOCATIONS = ['CODEOWNERS', '.github/CODEOWNERS', 'docs/CODEOWNERS'];

// The shipped template's placeholder owner. A control plane "owned" by @your-org/… is not
// owned by anyone — the gate fails until the ADOPT step replaces it with a real team, so a
// copied-but-never-adopted template cannot read as a green control.
export const PLACEHOLDER_OWNER = /^@your-org(\/|$)/i;

/** Parse CODEOWNERS into ordered rules. Comments and blank lines are dropped. */
export function parseCodeowners(text) {
  const rules = [];
  for (const raw of text.split('\n')) {
    const line = raw.replace(/#.*/, '').trim();
    if (!line) continue;
    const [pattern, ...owners] = line.split(/\s+/).filter(Boolean);
    rules.push({ pattern, owners });
  }
  return rules;
}

/** Does a single CODEOWNERS pattern match a (root-relative, no leading slash) path? */
export function ruleMatches(pattern, path) {
  if (pattern === '*' || pattern === '**') return true; // global default
  let p = pattern.startsWith('/') ? pattern.slice(1) : pattern;
  if (pattern.startsWith('*.')) return path.endsWith(pattern.slice(1)); // *.ext
  if (p.endsWith('/**')) p = p.slice(0, -2); // /dir/** → /dir/
  if (p.endsWith('/')) return path === p.slice(0, -1) || path.startsWith(p);
  return path === p || path.startsWith(p + '/'); // exact file or directory prefix
}

/** Owners of a path under last-match-wins, or [] if unowned. */
export function ownersFor(rules, path) {
  let owners = [];
  for (const rule of rules) if (ruleMatches(rule.pattern, path)) owners = rule.owners;
  return owners;
}

/** Findings (one per unprotected control target). Empty ⇒ the control plane is owned. */
export function evaluate(codeownersText, targets = CONTROL_TARGETS) {
  const rules = parseCodeowners(codeownersText);
  const findings = [];
  for (const target of targets) {
    const owners = ownersFor(rules, target);
    if (owners.length === 0) {
      findings.push(`${target} — not owned in CODEOWNERS (a change would not require Code Owner review)`);
    } else if (owners.every((o) => PLACEHOLDER_OWNER.test(o))) {
      findings.push(`${target} — owned only by the placeholder team ${owners.join(', ')} (replace @your-org/… with a real team the agent is not a member of)`);
    }
  }
  return findings;
}

function run(cwd = process.cwd()) {
  const path = CODEOWNERS_LOCATIONS.map((p) => `${cwd}/${p}`).find(existsSync);
  if (!path) {
    return [`no CODEOWNERS file found (looked in ${CODEOWNERS_LOCATIONS.join(', ')}) — the control plane is unowned`];
  }
  return evaluate(readFileSync(path, 'utf8'));
}

// CLI (skipped when imported by the test suite).
if (import.meta.url === `file://${process.argv[1]}`) {
  const findings = run();
  if (findings.length) {
    process.stderr.write('\nControl-plane integrity gate (HG-0002) — FAIL\n\n');
    for (const f of findings) process.stderr.write(`  - ${f}\n`);
    process.stderr.write('\nEvery control-plane file must be owned in CODEOWNERS so the agent cannot\nchange its own guardrails without human four-eyes. See governance/activation-runbook.md.\n');
    process.exit(1);
  }
  process.stdout.write('Control-plane integrity gate (HG-0002) — OK\n');
}
