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
//   node adopt.mjs [--dest <repo-root>] [--report json] [--print-table] [--dry-run]
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, cpSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const HARNESS = dirname(fileURLToPath(import.meta.url));
const MANIFEST = join(HARNESS, 'copy-manifest.json');
const PLACEHOLDER = /@your-org\/|ADOPT:/;

const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const isTemplatePending = (p) => { try { return PLACEHOLDER.test(readFileSync(p, 'utf8')); } catch { return false; } };

export function loadManifest() { return JSON.parse(readFileSync(MANIFEST, 'utf8')); }

/** The generated copy table for loom-adopt/SKILL.md (W4: docs are generated, never hand-kept). */
export function copyTable(manifest = loadManifest()) {
  const rows = manifest.entries.map((e) => {
    const src = e.kind === 'glob' ? `${e.source}/${e.glob}` : e.source;
    const dst = e.kind === 'glob' ? `${e.dest}/` : e.dest;
    return `| \`${src}\` | \`${dst}\` | ${e.seam} |`;
  });
  return ['| Bundle source | Destination | What it is |', '|---|---|---|', ...rows].join('\n');
}

function copyEntry(e, destRoot, dryRun) {
  const src = resolve(HARNESS, e.source);
  const dst = resolve(destRoot, e.dest);
  if (!existsSync(src)) return { ...e, status: 'source-missing' };
  let status = 'installed';
  if (e.kind === 'file' && e.adopt === 'merge') {
    // NEVER clobber a merge-file the adopter may already own (e.g. .claude/settings.json). An
    // identical file is already-current; a DIFFERENT existing file is preserved untouched and the
    // Loom's version is dropped beside it as a .loom.json sidecar for the adopter to merge by hand
    // — which is also when the hooks activate (that consent is the point, per SKILL.md).
    if (existsSync(dst)) {
      if (sha(src) === sha(dst)) return { source: e.source, dest: e.dest, seam: e.seam, status: 'already-current' };
      const sidecar = dst.replace(/\.json$/, '') + '.loom.json';
      if (!dryRun) { mkdirSync(dirname(sidecar), { recursive: true }); cpSync(src, sidecar); }
      return { source: e.source, dest: `${e.dest} (sidecar: ${e.dest.replace(/\.json$/, '')}.loom.json)`, seam: e.seam, status: 'merge-required' };
    }
    if (!dryRun) { mkdirSync(dirname(dst), { recursive: true }); cpSync(src, dst); }
    return { source: e.source, dest: e.dest, seam: e.seam, status: 'installed' };
  }
  if (e.kind === 'file') {
    if (existsSync(dst)) status = sha(src) === sha(dst) ? 'already-current' : 'updated';
    if (!dryRun) { mkdirSync(dirname(dst), { recursive: true }); cpSync(src, dst); }
    if (e.adopt === 'template' && (dryRun ? isTemplatePending(src) : isTemplatePending(dst))) status = 'adopt-pending';
  } else if (e.kind === 'dir') {
    if (!dryRun) { mkdirSync(dirname(dst), { recursive: true }); cpSync(src, dst, { recursive: true }); }
    status = existsSync(dst) ? 'updated' : 'installed';
  } else if (e.kind === 'glob') {
    const files = readdirSync(src).filter((f) => matchGlob(e.glob, f) && statSync(join(src, f)).isFile());
    if (!dryRun) { mkdirSync(dst, { recursive: true }); for (const f of files) cpSync(join(src, f), join(dst, f)); }
    status = `installed ${files.length} file(s)`;
  }
  return { source: e.source, dest: e.dest, seam: e.seam, status };
}

function matchGlob(glob, name) {
  if (glob.startsWith('*.')) return name.endsWith(glob.slice(1));
  return glob === name;
}

/** Install the whole manifest into destRoot; returns the adoption report. A caller may inject
 *  a manifest (the test suite proves a new entry lands with no parallel CI copy line — WS1). */
export function install(destRoot, { dryRun = false, manifest = loadManifest() } = {}) {
  return manifest.entries.map((e) => copyEntry(e, destRoot, dryRun));
}

// CLI.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const argv = process.argv;
  const arg = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
  if (argv.includes('--print-table')) { process.stdout.write(copyTable() + '\n'); process.exit(0); }
  const destRoot = resolve(arg('--dest') || process.cwd());
  const dryRun = argv.includes('--dry-run');
  const report = install(destRoot, { dryRun });
  const missing = report.filter((r) => r.status === 'source-missing');
  if (arg('--report') === 'json') { process.stdout.write(JSON.stringify(report, null, 2) + '\n'); }
  else {
    process.stdout.write(`\nLoom adoption report — ${dryRun ? 'DRY RUN, ' : ''}${report.length} entries → ${destRoot}\n\n`);
    for (const r of report) process.stdout.write(`  ${r.status.padEnd(22)} ${r.dest}  · ${r.seam}\n`);
    const pending = report.filter((r) => r.status === 'adopt-pending');
    if (pending.length) process.stdout.write(`\n${pending.length} template(s) ADOPT-PENDING — fill the placeholders and re-run the gates; the installer never fakes activation.\n`);
    const merge = report.filter((r) => r.status === 'merge-required');
    if (merge.length) process.stdout.write(`\n${merge.length} file(s) MERGE-REQUIRED — an existing file was preserved and the Loom's version dropped beside it as a .loom.json sidecar; merge it in by hand (this is also when the hooks activate).\n`);
  }
  process.exit(missing.length ? 1 : 0);
}
