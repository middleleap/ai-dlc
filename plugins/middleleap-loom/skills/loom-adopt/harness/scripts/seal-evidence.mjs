// The evidence collector (flow-plan Phase 2, rc.35 — closes F2's first half). The seal gate has
// carried a correct, tested chain builder since it shipped, and the release skill still told a
// human to "hash-chain the manifest" by hand — a multi-hour ritual of computing digests and
// transcribing verdicts, which is not only toil but the exact "narrated, not sealed" risk the
// gate was built to stop: a hand-typed digest is fabricatable evidence. This CLI derives the
// manifest FROM the artifacts instead:
//
//   walk the evidence directory · hash every artifact · order entries by the seal gate's
//   required-types contract · bind release_commit · chain with the gate's own buildChain() ·
//   set the anchor to the final seal · RE-VERIFY the result with the gate's own evaluate()
//   — and refuse to write anything if that verification fails.
//
// Deriving is not a shortcut; it strengthens the control. The collector never invents evidence
// (an artifact that is absent stays absent and the required-types check refuses the bundle), it
// never edits an artifact (a failing tests.json fails the seal semantics and nothing is written),
// and files it does not recognise as evidence are LISTED, never silently ignored. The gate-run
// record the runner emits (`core/gate-runner.mjs --emit-dir`) is sealed whenever it is present,
// so the most trustworthy artifact CI produces enters the chain instead of expiring as a CI
// artifact.
//
// Run from the repo root (exit 1 = verification refused, exit 2 = cannot even start):
//   node scripts/seal-evidence.mjs [--dir docs/governance/evidence] [--commit <sha>] [--release <id>]
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { buildChain, evaluate, requiredTypesFor, verifyReleaseCommit } from './evidence-seal-check.mjs';
import { aggregateRequirements } from '../core/compiled-requirements.mjs';

export const DEFAULT_DIR = 'docs/governance/evidence';

// Artifact filename → evidence type. The names are the ones the release skill and the worked
// example already use; a file outside this map is not evidence and is reported, not sealed.
export const ARTIFACT_FILES = {
  'tests.json': 'tests',
  'reviews.json': 'reviews',
  'lineage.json': 'lineage',
  'model-provenance.json': 'model-provenance',
  'control-plane.json': 'control-plane',
  'sast.sarif': 'sast',
  'sast.json': 'sast',
  'sbom.cdx.json': 'sbom',
  'sbom.json': 'sbom',
  'dependency-audit.json': 'dependency-audit',
  'provenance.json': 'provenance',
  'brainkit-provenance.json': 'brainkit-provenance',
};

/** The evidence type a filename seals as, or null when the file is not evidence. Any
 * `gate-run*.json` is the runner's emitted record (gate-run.json, gate-run-release.json, …). */
export function typeOfFile(name) {
  if (ARTIFACT_FILES[name]) return ARTIFACT_FILES[name];
  if (/^gate-run[A-Za-z0-9._-]*\.json$/.test(name)) return 'gate-run';
  return null;
}

/**
 * Classify a directory's files into chain entries (ordered by the required-types contract, then
 * every other recognised type in stable name order) and the files left out of the chain.
 * Pure over a file listing so the ordering rule is testable without a filesystem.
 */
export function collect(names, requiredTypes) {
  const byType = new Map();
  const unsealed = [];
  for (const name of [...names].sort()) {
    if (name === 'manifest.json') continue; // the output, never its own entry
    const type = typeOfFile(name);
    if (!type) { unsealed.push(name); continue; }
    byType.set(type, [...(byType.get(type) || []), name]);
  }
  const entries = [];
  const seen = new Set();
  for (const type of requiredTypes) {
    seen.add(type);
    for (const ref of byType.get(type) || []) entries.push({ type, ref });
  }
  // Recognised types beyond the contract (gate-run today; a plan-only type an aggregate did not
  // demand) still seal — extra evidence is chained, and the gate's semantics still judge it.
  for (const [type, refs] of [...byType.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    if (seen.has(type)) continue;
    for (const ref of refs) entries.push({ type, ref });
  }
  return { entries, unsealed };
}

const sha256File = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

/**
 * Build the manifest for one evidence directory: hash, order, chain, anchor. Returns everything
 * the CLI needs to verify and report; writes nothing.
 */
export function buildManifest({ cwd = process.cwd(), dir, commit, release = undefined } = {}) {
  const requiredTypes = requiredTypesFor(aggregateRequirements(cwd));
  const names = readdirSync(dir, { withFileTypes: true }).filter((d) => d.isFile()).map((d) => d.name);
  const { entries: rawOrder, unsealed } = collect(names, requiredTypes);
  const raw = rawOrder.map((e) => ({ type: e.type, ref: e.ref, sha256: sha256File(join(dir, e.ref)) }));
  const entries = buildChain(raw);
  const manifest = { release, release_commit: commit, entries };
  if (entries.length) manifest.anchor = entries[entries.length - 1].seal;
  return { manifest, requiredTypes, unsealed };
}

function gitHead(cwd) {
  try { return execFileSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' }).trim(); }
  catch { return null; }
}

export function main(argv = process.argv.slice(2), cwd = process.cwd()) {
  const arg = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
  const dirArg = arg('--dir') || DEFAULT_DIR;
  const dir = isAbsolute(dirArg) ? dirArg : resolve(cwd, dirArg);
  if (!existsSync(dir)) {
    process.stderr.write(`no evidence directory at ${dir} — nothing to seal (pass --dir)\n`);
    return 2;
  }
  const commit = arg('--commit') || gitHead(cwd);
  if (!commit) {
    process.stderr.write('no release commit: not a git checkout and no --commit given — evidence must be bound to the released commit\n');
    return 2;
  }
  // rc.36 (D5): a commit this repository never contained must not be sealed against. In a non-git
  // context the check is NOT performable, and that is said aloud below — never a silent pass.
  const commitCheck = verifyReleaseCommit(commit, cwd);
  if (commitCheck.status === 'failed') {
    process.stderr.write('\nseal-evidence — REFUSED (nothing written)\n\n');
    for (const f of commitCheck.findings) process.stderr.write(`  - ${f}\n`);
    return 1;
  }

  // Preserve an existing manifest's release id (the collector derives evidence, it does not
  // rename the release); a stale attestation over the OLD anchor is dropped LOUDLY — carrying it
  // forward would present a signature over a chain that no longer exists.
  const manifestPath = join(dir, 'manifest.json');
  let previous = null;
  if (existsSync(manifestPath)) {
    try { previous = JSON.parse(readFileSync(manifestPath, 'utf8')); } catch { previous = null; }
  }
  const release = arg('--release') || previous?.release;

  const { manifest, requiredTypes, unsealed } = buildManifest({ cwd, dir, commit, release });

  // The refusal: the gate's own evaluate(), on the collector's own output, BEFORE anything is
  // written. A bundle that would fail verification is never written — there is no state in which
  // this tool has produced a manifest the seal gate rejects.
  const findings = evaluate(manifest, { baseDir: dir, requiredTypes });
  if (findings.length) {
    process.stderr.write('\nseal-evidence — REFUSED (nothing written)\n\n');
    for (const f of findings) process.stderr.write(`  - ${f}\n`);
    process.stderr.write('\nThe collector derives evidence; it never repairs it. Fix what the artifacts report\n(or supply the missing ones), then re-run. See scripts/evidence-seal-check.mjs.\n');
    return 1;
  }

  if (previous?.attestation) {
    process.stdout.write('note: the previous manifest carried an attestation over the OLD anchor — dropped, not copied.\nRe-anchor the new final seal to your external store and re-attest it.\n');
  }
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  if (commitCheck.note) process.stdout.write(`NOTE: ${commitCheck.note}\n`);
  const sealedGateRun = manifest.entries.some((e) => e.type === 'gate-run');
  process.stdout.write(
    `\nseal-evidence — sealed ${manifest.entries.length} artifact(s) at ${commit.slice(0, 12)} → ${manifestPath}\n` +
    `  required-types contract: ${requiredTypes.join(', ')}\n` +
    `  gate-run record: ${sealedGateRun ? 'sealed into the chain' : 'none present (run core/gate-runner.mjs --emit-dir to produce one)'}\n` +
    `  anchor (publish to your external WORM/RFC-3161 store): ${manifest.anchor}\n`,
  );
  if (unsealed.length) {
    process.stdout.write('  not evidence, left OUT of the chain (said aloud, never silent):\n');
    for (const n of unsealed) process.stdout.write(`    · ${n}\n`);
  }
  process.stdout.write('\nverified by evidence-seal-check.evaluate() before writing — re-run the gate any time:\n  node scripts/evidence-seal-check.mjs\n');
  return 0;
}

// CLI (skipped when imported by the test suite).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main());
