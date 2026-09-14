// The `loom` adoption CLI (Loom 2.0-rc.14 · WS5) — a thin dispatcher over the adoption state
// machine. Adoption is five stages; each subcommand advances or reports one:
//
//   loom version                   which Loom this repository is running, and what it has customised
//   loom adopt --bundle <harness>  install from an explicit complete bundle (safe upgrades)
//   loom preflight                 check local runtime prerequisites without changing settings
//   loom configure                 list setup tasks, owners, inputs and checks
//   loom verify                    run the bundled gates → mechanically-validated
//   loom gates                     the pr-lane gate run CI would do, locally, against the merge
//                                  base (rc.34) — same runner, same catalog, same recorded skips
//   loom compile <envelope-path>   the policy compiler, forwarded (rc.34)
//   loom seal                      derive + verify the evidence manifest (rc.35, seal-evidence.mjs)
//   loom activate --platform github --repository org/repo  verify baseline activation evidence
//   loom attest-adoption           verify the signed adoption report (fails while anything is adopt-pending)
//   loom status                    the five-stage matrix + unresolved inventory (machine or human)
//
// Run from the adopted repo root: `node scripts/loom.mjs <command> [args]`.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync, realpathSync } from 'node:fs';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { preflightCommand } from './onboarding-preflight.mjs';
import { verifyProject } from './project-config-check.mjs';
import { brainkitCommand } from './brainkit-reuse.mjs';
import { configureCommand } from './configuration-tasks.mjs';
import { activationReadiness } from './activation-readiness.mjs';
import { STAMP_PATH } from '../core/adoption-stamp.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const node = (script, args = []) => spawnSync(process.execPath, [resolve(HERE, script), ...args], { stdio: 'inherit' }).status ?? 1;

// The merge base the CI workflow supplies to the runner, computed locally: origin/main first,
// a local main as the fallback. Null (no git, no such ref) means the diff is unknown.
function mergeBase() {
  for (const ref of ['origin/main', 'main']) {
    const r = spawnSync('git', ['merge-base', ref, 'HEAD'], { encoding: 'utf8' });
    if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
  }
  return null;
}

/**
 * Which Loom is installed here, and which managed files the adopter has since made their own.
 * Read-only, and it answers from the stamp rather than from any file's contents — the version
 * question ("what am I running?") had no answer at all before rc.18.
 */
export function versionReport(cwd = process.cwd(), out = process.stdout) {
  const path = resolve(cwd, STAMP_PATH);
  if (!existsSync(path)) {
    out.write(`\nNo adoption stamp at ${STAMP_PATH}.\n\nEither this repository has not adopted the Loom, or it adopted before stamping existed\n(2.0.0-rc.18). Re-run the installer from the bundle to stamp it:\n  node <plugin>/skills/loom-adopt/harness/adopt.mjs --dest .\n\n`);
    return 1;
  }
  let stamp;
  try { stamp = JSON.parse(readFileSync(path, 'utf8')); } catch (err) {
    out.write(`\n${STAMP_PATH} is not valid JSON: ${err.message}\n\n`);
    return 1;
  }
  const files = stamp.files || {};
  const customised = Object.keys(files).filter((rel) => {
    const abs = resolve(cwd, rel);
    if (!existsSync(abs) || !statSync(abs).isFile()) return false;
    return createHash('sha256').update(readFileSync(abs)).digest('hex') !== files[rel];
  }).sort();

  out.write(`\nLoom ${stamp.bundle_version || '(unknown)'}\n`);
  out.write(`  adoption tier   ${stamp.tier || '(pre-tier adoption — treated as full)'}\n`);
  out.write(`  first adopted   ${stamp.first_adopted_at || '—'}\n`);
  out.write(`  last installed  ${stamp.updated_at || '—'}\n`);
  out.write(`  managed files   ${Object.keys(files).length}\n`);
  if (customised.length) {
    out.write(`\n${customised.length} managed file(s) you have edited (an upgrade preserves these):\n`);
    for (const f of customised) out.write(`  · ${f}\n`);
  } else {
    out.write('\nNo managed file has been edited since it was installed.\n');
  }
  const history = stamp.history || [];
  if (history.length > 1) {
    out.write('\nUpgrade history:\n');
    for (const h of history) out.write(`  ${h.version.padEnd(14)} ${h.at}\n`);
  }
  out.write('\n');
  return 0;
}

export function adoptCommand(args) {
  const i = args.indexOf('--bundle');
  if (i >= 0 && (!args[i + 1] || args[i + 1].startsWith('--'))) {
    process.stderr.write('--bundle requires the path to a complete Loom harness directory.\n'); return 2;
  }
  const bundle = i >= 0 ? resolve(args[i + 1]) : resolve(HERE, '..');
  if (!existsSync(resolve(bundle, 'adopt.mjs')) || !existsSync(resolve(bundle, 'copy-manifest.json'))) {
    process.stderr.write('Installation requires the complete plugin bundle. From this repository run:\n  node scripts/loom.mjs adopt --bundle /path/to/plugin/skills/loom-adopt/harness --dry-run\nThen review the report and re-run without --dry-run. Your current repository is the default destination.\n');
    return 2;
  }
  const forwarded = args.filter((_, index) => i < 0 || (index !== i && index !== i + 1));
  return node(resolve(bundle, 'adopt.mjs'), forwarded);
}

export const COMMANDS = {
  'verify-project': (args) => verifyProject(args),
  runtime: async (args) => (await import('./codex-runtime.mjs')).runtimeCommand(args),
  brainkit: (args) => brainkitCommand(args),
  preflight: (args) => preflightCommand(args),
  version: () => versionReport(),
  adopt: (args) => adoptCommand(args),
  status: (args) => node('adoption-status.mjs', args),
  'attest-adoption': (args) => node('adoption-attest.mjs', args),
  configure: (args) => configureCommand(args),
  verify: () => {
    // The mechanically-validated stage: the state-of-record gates must be green.
    let rc = 0;
    for (const g of ['control-catalog-check.mjs', 'control-plane-check.mjs', 'guardrail-policy-check.mjs']) rc |= node(g, []);
    process.stdout.write('\nverify ran the state-of-record gates; `loom gates` runs the full pr lane locally.\n');
    return rc ? 1 : 0;
  },
  gates: (args) => {
    // rc.34 — the local loop that matches CI. Same runner, same catalog, same recorded skips;
    // the merge base is computed the way the workflow supplies it. No base found means an
    // unknown diff, and the runner fails open to running everything in the lane — said aloud.
    const extra = [...args];
    if (!extra.includes('--lane')) extra.unshift('--lane', 'pr');
    if (!extra.includes('--base')) {
      const base = mergeBase();
      if (base) extra.push('--base', base);
      else process.stdout.write('no merge base found (origin/main or main) — unknown diff, so everything in the lane runs\n');
    }
    return node('../core/gate-runner.mjs', extra);
  },
  compile: (args) => node('../core/policy-compiler.mjs', args),
  // rc.35 (flow-plan Phase 2) — the evidence collector: derive the manifest from the artifacts,
  // verified by the seal gate's own evaluate() before anything is written. Never hand-chain.
  seal: (args) => node('seal-evidence.mjs', args),
  activate: (args) => {
    return activationReadiness(args);
  },
};

// CLI (skipped when imported by the test suite).
if (process.argv[1] && existsSync(process.argv[1]) && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const [cmd, ...args] = process.argv.slice(2);
  if (!cmd || !COMMANDS[cmd]) {
    process.stderr.write(`usage: loom <${Object.keys(COMMANDS).join('|')}> [args]\n`);
    process.exit(cmd ? 2 : 0);
  }
  process.exit(await COMMANDS[cmd](args));
}
