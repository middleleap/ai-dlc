// Q1b — the test-integrity gate (anti-reward-hacking). An agent under pressure to go green
// has two moves: fix the code, or weaken the test. The test-tripwire hook blocks the second
// move at edit time; this gate is the CI half — it diffs the test surface against the merge
// base and fails when the tests got weaker on the way to green:
//
//   Deleted test files · net assertion loss · added skip/only/todo/expected-failure markers ·
//   newly commented-out assertions.
//
// The approved test-change process (delivery-harness.md): a genuine test defect is fixed in
// the open on a dedicated `-testfix-` branch — on such a branch the findings are reported as
// notices and the gate passes, so the escape hatch is visible, never silent.
//
// Run from the repo root of a git checkout: `node scripts/test-integrity-check.mjs
// [--base <ref>]` (default: merge-base with origin/main, then main). Exit 1 on findings,
// exit 2 when there is no git history to diff against — unverifiable is not a pass.
import { execFileSync } from 'node:child_process';
import process from 'node:process';

// ADOPT: what counts as a test file, and what counts as an assertion, in your stack.
export const TEST_FILE = /(\.|_|\/)(test|spec)s?\.[cm]?[jt]sx?$|(^|\/)tests?\//i;
export const ASSERTION = /\bassert\s*[.(]|\bexpect\s*\(|\.should\b|\bt\.(is|deepEqual|truthy|falsy|throws)\b/g;
export const WEAKENER = /\.(skip|only|todo|failing|fails)\s*\(|\bx(it|describe|test)\s*\(/g;
export const COMMENTED_ASSERTION = /^[ \t]*(\/\/|#).*(\bassert\s*[.(]|\bexpect\s*\()/gm;

const count = (text, re) => (text.match(new RegExp(re.source, re.flags)) || []).length;

/**
 * Findings, given the test surface before and after (Map of path → content).
 * Empty ⇒ the tests did not get weaker.
 */
export function evaluate(baseFiles, headFiles) {
  const findings = [];
  for (const [path, baseText] of baseFiles) {
    const headText = headFiles.get(path);
    if (headText === undefined) {
      findings.push(`${path} — test file deleted (a red bar goes green by fixing the code, never by removing the test)`);
      continue;
    }
    const dAssert = count(headText, ASSERTION) - count(baseText, ASSERTION);
    if (dAssert < 0) findings.push(`${path} — net assertion loss (${dAssert}): assertions were removed or weakened`);
    const dWeak = count(headText, WEAKENER) - count(baseText, WEAKENER);
    if (dWeak > 0) findings.push(`${path} — ${dWeak} skip/only/todo/expected-failure marker(s) added`);
    const dComment = count(headText, COMMENTED_ASSERTION) - count(baseText, COMMENTED_ASSERTION);
    if (dComment > 0) findings.push(`${path} — ${dComment} assertion(s) newly commented out`);
  }
  return findings;
}

const git = (args, opts = {}) => execFileSync('git', args, { encoding: 'utf8', ...opts }).trimEnd();

function collect(ref) {
  // ref === null ⇒ the working tree; else the committed tree at ref.
  const files = new Map();
  const names = (ref ? git(['ls-tree', '-r', '--name-only', ref]) : git(['ls-files'])).split('\n');
  for (const name of names) {
    if (!name || !TEST_FILE.test(name)) continue;
    try {
      files.set(name, ref ? git(['show', `${ref}:${name}`]) : git(['show', `:${name}`]));
    } catch { /* unreadable (e.g. deleted in index) — treated as absent */ }
  }
  return files;
}

export function resolveBase(argv = process.argv) {
  const i = argv.indexOf('--base');
  if (i >= 0 && argv[i + 1]) return argv[i + 1];
  for (const candidate of ['origin/main', 'main', 'origin/master', 'master']) {
    try { return git(['merge-base', candidate, 'HEAD'], { stdio: ['ignore', 'pipe', 'ignore'] }); } catch { /* next */ }
  }
  return null;
}

// CLI (skipped when imported by the test suite).
if (import.meta.url === `file://${process.argv[1]}`) {
  try { git(['rev-parse', '--git-dir'], { stdio: ['ignore', 'pipe', 'ignore'] }); }
  catch {
    process.stderr.write('Test-integrity gate (Q1b) — CANNOT VERIFY: not a git checkout. Unverifiable is not a pass.\n');
    process.exit(2);
  }
  const base = resolveBase();
  if (!base) {
    process.stderr.write('Test-integrity gate (Q1b) — CANNOT VERIFY: no merge base found (pass --base <ref>).\n');
    process.exit(2);
  }
  const findings = evaluate(collect(base), collect(null));
  let branch = '';
  try { branch = git(['rev-parse', '--abbrev-ref', 'HEAD']); } catch { /* detached */ }
  const testfix = /testfix/i.test(branch);
  if (findings.length) {
    const head = testfix
      ? `\nTest-integrity gate (Q1b) — NOTICE (dedicated testfix branch: ${branch})\n\n`
      : '\nTest-integrity gate (Q1b) — FAIL\n\n';
    process.stderr.write(head);
    for (const f of findings) process.stderr.write(`  - ${f}\n`);
    if (!testfix) {
      process.stderr.write('\nA red bar goes green by fixing the code, never by weakening the test. A genuine\ntest defect is fixed in the open on a dedicated -testfix- branch (delivery-harness.md).\n');
      process.exit(1);
    }
  }
  process.stdout.write(`Test-integrity gate (Q1b) — OK (base ${base.slice(0, 12)})\n`);
}
