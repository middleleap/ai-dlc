// The idempotent Loom installer (Loom 2.0-rc.7 W4). Reads copy-manifest.json — the single
// source of truth — and lays the machinery into an adopting repo, emitting an ADOPTION REPORT
// (source → destination → seam → status). Re-running is safe: unchanged files report
// `already-current`, changed files `updated`, new files `installed`, and *.template files that
// still carry ADOPT placeholders `adopt-pending` (the installer copies a template but never
// fakes its activation — that stays the adopter's honest work).
//
// This same manifest drives the CI dry-run and generates the copy table in loom-adopt/SKILL.md
// (a doc-integrity check fails the build on drift), so the instructions can never lag the
// machinery again.
//
// SAFE RE-RUN IS NOT THE SAME AS IDEMPOTENT (rc.18). "Re-running is safe" was true of the
// machinery and false of the adopter: every managed file was overwritten unconditionally,
// including the ones loom-adopt's own step 3 instructs them to edit — the story-id convention in
// `scripts/discovery-link-check.mjs`, the jurisdiction's PII shapes in `.claude/hooks/pii-guard.sh`.
// Following the instructions and then upgrading destroyed the work, silently. So the installer now
// keeps a stamp (`.loom/adoption.json`) recording what IT installed, and a file that has since
// diverged is preserved with the new upstream version dropped beside it as a `.loom-new` sidecar.
// The reasoning is in core/adoption-stamp.mjs; --force is the documented way to overwrite anyway.
//
// ADOPTION TIERS (rc.24). A full adoption lands 200+ ADOPT markers across 70+ files on day one,
// which is a cliff, not an on-ramp — and it grows every release. `--tier core|governed|full`
// stages it. Two rules keep the split honest:
//
//   MACHINERY IS ALWAYS INSTALLED, at every tier. Only what an adopter must FILL IN is tiered.
//   The burden was never the gates — a gate whose input file is absent is silent — and tiering
//   the `scripts/*.mjs` glob would reintroduce exactly the failure its comment warns about: a
//   per-file list that silently drops new gates. So every tier gets every gate.
//
//   WHAT MAY BE DEFERRED WAS DETERMINED BY TEST, NOT BY TASTE. Each deferred entry was removed
//   from a real adoption and its gates confirmed silent. Two are NOT deferrable and sit in core
//   however inconvenient: `data-lifecycle.json` and `model-manifest.json` fail CLOSED when
//   absent. That is correct — in this method the agent is a model and data has a lifecycle —
//   so core is the smallest adoption that is safe, not the smallest that installs.
//
//   node adopt.mjs [--dest <repo-root>] [--tier core|governed|full] [--report json]
//                  [--print-table] [--dry-run] [--force]
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, cpSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { CLASS, STAMP_PATH, classifyFile, emptyStamp, isSafeToWrite, nextStamp, notesBetween } from './core/adoption-stamp.mjs';

const HARNESS = dirname(fileURLToPath(import.meta.url));
const MANIFEST = join(HARNESS, 'copy-manifest.json');
const PLUGIN_JSON = resolve(HARNESS, '../../../.claude-plugin/plugin.json');
const UPGRADE_NOTES = join(HARNESS, 'upgrade-notes.json');
const PLACEHOLDER = /@your-org\/|ADOPT:/;

const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const shaOrNull = (p) => (existsSync(p) && statSync(p).isFile() ? sha(p) : null);
const isTemplatePending = (p) => { try { return PLACEHOLDER.test(readFileSync(p, 'utf8')); } catch { return false; } };
const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };

export function loadManifest() { return JSON.parse(readFileSync(MANIFEST, 'utf8')); }

// Cumulative: adopting `governed` means core + governed. An entry with no tier is core, so a
// manifest entry added without one lands in every adoption rather than silently in none.
export const TIERS = ['core', 'governed', 'full'];
export const tierIncludes = (adopted, entryTier) =>
  TIERS.indexOf(entryTier ?? 'core') <= TIERS.indexOf(adopted);
export const entriesForTier = (manifest, tier) => manifest.entries.filter((e) => tierIncludes(tier, e.tier));

/** This bundle's version, from the plugin manifest — never hard-coded, so it cannot drift. */
export function bundleVersion() { return readJson(PLUGIN_JSON)?.version ?? null; }
export function loadUpgradeNotes() { return readJson(UPGRADE_NOTES) ?? { versions: [] }; }
export function readStamp(destRoot) { return readJson(resolve(destRoot, STAMP_PATH)) ?? null; }

/**
 * Decide, then write, one managed file. `key` is the repo-relative destination — the identity the
 * stamp records against. Returns the class and the digest to stamp: the SOURCE digest when we
 * wrote (that is what is now installed there), and the previous stamp entry when we did not, so a
 * preserved file keeps reading as the adopter's on every future run.
 */
function placeFile(src, dst, key, ctx) {
  const sourceDigest = sha(src);
  const currentDigest = shaOrNull(dst);
  const cls = classifyFile({ stampDigest: ctx.stamp.files?.[key], currentDigest, sourceDigest });
  const write = ctx.force || isSafeToWrite(cls);

  if (write) {
    if (!ctx.dryRun) { mkdirSync(dirname(dst), { recursive: true }); cpSync(src, dst); }
    return { cls, stampDigest: sourceDigest, wrote: true };
  }
  // Preserved. Drop the upstream version beside it so the adopter can diff without hunting for
  // the bundle — the same courtesy the `merge` entries already extended to settings.json.
  if (!ctx.dryRun) { mkdirSync(dirname(dst), { recursive: true }); cpSync(src, `${dst}.loom-new`); }
  return { cls, stampDigest: ctx.stamp.files?.[key], wrote: false };
}

/** The generated copy table for loom-adopt/SKILL.md (W4: docs are generated, never hand-kept). */
export function copyTable(manifest = loadManifest()) {
  const rows = manifest.entries.map((e) => {
    const src = e.kind === 'glob' ? `${e.source}/${e.glob}` : e.source;
    const dst = e.kind === 'glob' ? `${e.dest}/` : e.dest;
    return `| \`${src}\` | \`${dst}\` | ${e.tier ?? 'core'} | ${e.seam} |`;
  });
  return ['| Bundle source | Destination | Tier | What it is |', '|---|---|---|---|', ...rows].join('\n');
}

/** Every file under `root`, as paths relative to it (recursive). */
function walkRelative(root, prefix = '') {
  const out = [];
  for (const name of readdirSync(root)) {
    const abs = join(root, name);
    const rel = prefix ? `${prefix}/${name}` : name;
    if (statSync(abs).isDirectory()) out.push(...walkRelative(abs, rel));
    else out.push(rel);
  }
  return out;
}

/** The class the whole entry reports, given what its files did. Worst news wins. */
function rollup(classes, installedCount) {
  if (classes.includes(CLASS.LOCAL_EDIT)) return 'local-edit-preserved';
  if (classes.includes(CLASS.UNVERIFIABLE)) return 'unverifiable-preserved';
  if (classes.includes(CLASS.NEW)) return installedCount > 1 ? `installed ${installedCount} file(s)` : 'installed';
  if (classes.includes(CLASS.UPDATE)) return 'updated';
  return 'already-current';
}

function copyEntry(e, destRoot, ctx) {
  const src = resolve(HARNESS, e.source);
  const dst = resolve(destRoot, e.dest);
  if (!existsSync(src)) return { ...e, status: 'source-missing', stamped: {} };
  const stamped = {};

  if (e.kind === 'file' && e.adopt === 'merge') {
    // NEVER clobber a merge-file the adopter may already own (e.g. .claude/settings.json). An
    // identical file is already-current; a DIFFERENT existing file is preserved untouched and the
    // Loom's version is dropped beside it as a .loom.json sidecar for the adopter to merge by hand
    // — which is also when the hooks activate (that consent is the point, per SKILL.md). This
    // predates the stamp and stays as it is: consent, not provenance, is what it protects.
    if (existsSync(dst)) {
      if (sha(src) === sha(dst)) return { source: e.source, dest: e.dest, seam: e.seam, status: 'already-current', stamped: { [e.dest]: sha(src) } };
      const sidecar = dst.replace(/\.json$/, '') + '.loom.json';
      if (!ctx.dryRun) { mkdirSync(dirname(sidecar), { recursive: true }); cpSync(src, sidecar); }
      return { source: e.source, dest: `${e.dest} (sidecar: ${e.dest.replace(/\.json$/, '')}.loom.json)`, seam: e.seam, status: 'merge-required', stamped: {} };
    }
    if (!ctx.dryRun) { mkdirSync(dirname(dst), { recursive: true }); cpSync(src, dst); }
    return { source: e.source, dest: e.dest, seam: e.seam, status: 'installed', stamped: { [e.dest]: sha(src) } };
  }

  if (e.kind === 'file') {
    const r = placeFile(src, dst, e.dest, ctx);
    if (r.stampDigest !== undefined) stamped[e.dest] = r.stampDigest;
    let status = rollup([r.cls], 1);
    // A template that landed but still carries its placeholders is adopt-pending, as before —
    // but only when we actually wrote it; a preserved template is the adopter's, not pending.
    if (e.adopt === 'template' && r.wrote && (ctx.dryRun ? isTemplatePending(src) : isTemplatePending(dst))) status = 'adopt-pending';
    return { source: e.source, dest: e.dest, seam: e.seam, status, stamped };
  }

  // Directories and globs are many files under one manifest entry; each is classified on its own
  // so one customised gate in scripts/ does not freeze the other forty.
  const names = e.kind === 'dir'
    ? walkRelative(src)
    : readdirSync(src).filter((f) => matchGlob(e.glob, f) && statSync(join(src, f)).isFile());
  const classes = [];
  let installed = 0;
  for (const name of names) {
    const key = `${e.dest}/${name}`;
    const r = placeFile(join(src, name), join(dst, name), key, ctx);
    if (r.stampDigest !== undefined) stamped[key] = r.stampDigest;
    classes.push(r.cls);
    if (r.wrote) installed++;
  }
  return { source: e.source, dest: e.dest, seam: e.seam, status: rollup(classes, names.length), stamped };
}

function matchGlob(glob, name) {
  if (glob.startsWith('*.')) return name.endsWith(glob.slice(1));
  return glob === name;
}

/**
 * Install the whole manifest into destRoot; returns the adoption report. A caller may inject
 * a manifest (the test suite proves a new entry lands with no parallel CI copy line — WS1).
 *
 * `force` overwrites files the adopter has edited — destructive by definition, so it is never
 * the default and the report says what it stepped on.
 */
export function install(destRoot, { dryRun = false, manifest = loadManifest(), force = false, stamp = null, version = undefined, tier = undefined, now = new Date().toISOString() } = {}) {
  const previous = stamp ?? readStamp(destRoot) ?? emptyStamp();
  // A re-run keeps the tier already adopted unless one is named — an upgrade must never silently
  // demote a repository to core and start reporting its governed templates as missing.
  // rc.33: a FIRST run with no --tier lands `core`, not `full`. Defaulting to full handed every
  // unflagged first-time adopter the 200-marker cliff the tiering exists to remove — the header
  // above and assess.mjs both argue for core, and now the default agrees with them. `--tier full`
  // is one flag away and assess.mjs prints the cost of each tier before you choose.
  const adoptedTier = tier ?? previous.tier ?? 'core';
  if (!TIERS.includes(adoptedTier)) throw new Error(`unknown tier ${adoptedTier} — expected ${TIERS.join('|')}`);
  const ctx = { stamp: previous, force, dryRun };
  const report = entriesForTier(manifest, adoptedTier).map((e) => copyEntry(e, destRoot, ctx));

  const installedDigests = Object.assign({}, ...report.map((r) => r.stamped || {}));
  const resolvedVersion = version === undefined ? bundleVersion() : version;
  const written = {
    ...nextStamp({
      previous,
      version: resolvedVersion,
      installed: installedDigests,
      manifestDigest: existsSync(MANIFEST) ? sha(MANIFEST) : null,
      now,
    }),
    tier: adoptedTier,
  };
  if (!dryRun) {
    const stampPath = resolve(destRoot, STAMP_PATH);
    mkdirSync(dirname(stampPath), { recursive: true });
    writeFileSync(stampPath, JSON.stringify(written, null, 2) + '\n');
  }
  return Object.assign(report, { stamp: written, previousVersion: previous.bundle_version, tier: adoptedTier });
}

// CLI.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const argv = process.argv;
  const arg = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
  if (argv.includes('--print-table')) { process.stdout.write(copyTable() + '\n'); process.exit(0); }
  const destRoot = resolve(arg('--dest') || process.cwd());
  const dryRun = argv.includes('--dry-run');
  const force = argv.includes('--force');
  const previousStamp = readStamp(destRoot);
  const from = previousStamp?.bundle_version ?? null;
  const to = bundleVersion();
  const tier = arg('--tier');
  if (tier && !TIERS.includes(tier)) {
    process.stderr.write(`unknown --tier ${tier} — expected ${TIERS.join(' | ')}\n`);
    process.exit(2);
  }
  const report = install(destRoot, { dryRun, force, tier });
  const missing = report.filter((r) => r.status === 'source-missing');
  if (arg('--report') === 'json') { process.stdout.write(JSON.stringify({ report: [...report], stamp: report.stamp, from, to, tier: report.tier }, null, 2) + '\n'); }
  else {
    const move = from === null ? `first adoption of ${to}` : from === to ? `re-run of ${to}` : `UPGRADE ${from} → ${to}`;
    const tierMove = previousStamp?.tier && previousStamp.tier !== report.tier ? `tier ${previousStamp.tier} → ${report.tier}` : `tier ${report.tier}`;
    process.stdout.write(`\nLoom adoption report — ${dryRun ? 'DRY RUN, ' : ''}${move}, ${tierMove}, ${report.length} entries → ${destRoot}\n\n`);
    for (const r of report) process.stdout.write(`  ${r.status.padEnd(24)} ${r.dest}  · ${r.seam}\n`);

    const pending = report.filter((r) => r.status === 'adopt-pending');
    if (pending.length) process.stdout.write(`\n${pending.length} template(s) ADOPT-PENDING — fill the placeholders and re-run the gates; the installer never fakes activation.\n`);
    const merge = report.filter((r) => r.status === 'merge-required');
    if (merge.length) process.stdout.write(`\n${merge.length} file(s) MERGE-REQUIRED — an existing file was preserved and the Loom's version dropped beside it as a .loom.json sidecar; merge it in by hand (this is also when the hooks activate).\n`);

    // The two preserved classes are reported separately because they mean different things and
    // want different work: one is "you customised this", the other is "I could not tell".
    const owned = report.filter((r) => r.status === 'local-edit-preserved');
    if (owned.length) {
      process.stdout.write(`\n${owned.length} entr(ies) contain files YOU have edited — preserved, not overwritten:\n`);
      for (const r of owned) process.stdout.write(`  · ${r.dest}\n`);
      process.stdout.write('The new upstream version of each is beside it as `<file>.loom-new`. Diff, take what you\nwant, and delete the sidecar. They stay flagged as yours until your content and ours converge.\n');
    }
    const unverifiable = report.filter((r) => r.status === 'unverifiable-preserved');
    if (unverifiable.length) {
      process.stdout.write(`\n${unverifiable.length} entr(ies) could NOT be verified — preserved:\n`);
      for (const r of unverifiable) process.stdout.write(`  · ${r.dest}\n`);
      process.stdout.write(
        'This adoption predates the version stamp, so an edit of yours and an older copy of ours are\n' +
        'indistinguishable. Everything differing was preserved with a `.loom-new` sidecar. Reconcile\n' +
        'them, or re-run with --force if you know you never customised anything. This happens once:\n' +
        'the stamp written just now means later upgrades can tell the difference.\n',
      );
    }

    // What the next tier would add, so a staged adoption is a visible on-ramp rather than a
    // thing an adopter has to know exists. Counted from the manifest, never hard-coded.
    const nextTier = TIERS[TIERS.indexOf(report.tier) + 1];
    if (nextTier) {
      const manifest = loadManifest();
      const pending = entriesForTier(manifest, nextTier).length - entriesForTier(manifest, report.tier).length;
      process.stdout.write(
        `\nYou are on tier ${report.tier}. \`--tier ${nextTier}\` adds ${pending} more entr(ies) to fill in.\n` +
        'Every gate is already installed and running; the deferred ones are silent until their file exists.\n',
      );
    }

    for (const n of notesBetween(loadUpgradeNotes(), from, to)) {
      process.stdout.write(`\n── ${n.version} · ${n.headline}\n`);
      for (const line of n.notes || []) process.stdout.write(`   ${line}\n`);
      for (const line of n.action_required || []) process.stdout.write(`   ACTION: ${line}\n`);
    }
    if (from && from !== to) process.stdout.write(`\nStamped ${relative(destRoot, resolve(destRoot, STAMP_PATH))}. Run \`node scripts/loom.mjs status --run\` to see what passes now.\n`);
  }
  process.exit(missing.length ? 1 : 0);
}
