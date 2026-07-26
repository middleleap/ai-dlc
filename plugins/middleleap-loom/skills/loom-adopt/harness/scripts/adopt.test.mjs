// The installer contract (Loom 2.0-rc.8 WS1). copy-manifest.json is the single source of truth
// for what the Loom lays into an adopting repo, and rc.8 makes it real in CI: the adoption
// dry-run installs THROUGH adopt.mjs, not a hand-maintained `cp` list. These tests pin the
// property that makes that safe — the installer is manifest-driven, so a new entry lands in the
// adopted layout with no per-entry code or CI change, and the generated copy table cannot
// silently drop one.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, readFileSync, appendFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// adopt.mjs and copy-manifest.json are BUNDLE-ONLY — the installer is not itself installed into
// an adopting repo. In an adopted layout scripts/*.test.mjs still runs, so skip cleanly there
// (the doc-integrity gate uses the same "inert where the bundle is absent" pattern).
const ADOPT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'adopt.mjs');
if (!existsSync(ADOPT)) {
  test('adopt.mjs installer contract (bundle-only — skipped in an adopted layout)', { skip: true }, () => {});
} else {
const { install, loadManifest, copyTable, bundleVersion } = await import(ADOPT);

const withTempDest = (fn) => {
  const dest = mkdtempSync(join(tmpdir(), 'loom-adopt-'));
  try { return fn(dest); } finally { rmSync(dest, { recursive: true, force: true }); }
};

test('every manifest entry resolves to a real source (adopt.mjs installs clean)', () => {
  // A wrong source path was invisible while CI copied files by hand; running the real installer
  // in CI makes it a build failure — this test makes it a unit failure too.
  const report = withTempDest((dest) => install(dest, { dryRun: true }));
  const missing = report.filter((r) => r.status === 'source-missing');
  assert.equal(missing.length, 0, `source-missing entries: ${missing.map((m) => m.source).join(', ')}`);
});

test('a new copy-manifest entry lands in the adopted layout with no parallel CI copy line', () => {
  // WS1's core promise: adding an entry to the manifest is SUFFICIENT for it to appear in the
  // adopted layout. If this ever needed a companion `cp` line, the manifest would not be the
  // source of truth it claims to be.
  const manifest = loadManifest();
  const synthetic = { source: 'copy-manifest.json', dest: 'docs/governance/_ws1-probe.json', kind: 'file', seam: 'WS1 probe' };
  const augmented = { ...manifest, entries: [...manifest.entries, synthetic] };
  withTempDest((dest) => {
    const report = install(dest, { manifest: augmented });
    const landed = report.find((r) => r.dest === synthetic.dest);
    assert.ok(landed && landed.status !== 'source-missing', 'synthetic entry did not install');
    assert.ok(existsSync(join(dest, synthetic.dest)), 'synthetic dest file was not written');
  });
});

test('the generated copy table lists every manifest entry (docs cannot silently drop one)', () => {
  const manifest = loadManifest();
  const table = copyTable(manifest);
  for (const e of manifest.entries) {
    const src = e.kind === 'glob' ? `${e.source}/${e.glob}` : e.source;
    assert.ok(table.includes(src), `copy table is missing entry source ${src}`);
  }
});

test('re-running the installer is idempotent (second run reports already-current, never source-missing)', () => {
  withTempDest((dest) => {
    install(dest); // first run writes
    const second = install(dest); // second run over the same tree
    assert.equal(second.filter((r) => r.status === 'source-missing').length, 0);
    const files = second.filter((r) => r.status === 'already-current' || r.status === 'adopt-pending');
    assert.ok(files.length > 0, 'a second install should find unchanged files already-current');
  });
});

// --- the version stamp and safe upgrade (rc.18) -----------------------------------------------
//
// The property: following loom-adopt step 3 and then upgrading must not destroy the work. Before
// the stamp, `scripts/discovery-link-check.mjs` (set FEATURE to your story-id convention) and
// `.claude/hooks/pii-guard.sh` (your jurisdiction's PII shapes) were overwritten on every re-run,
// silently. These are end-to-end against the real manifest, because the failure was end-to-end.

test('the installer stamps the adoption with the bundle version and what it installed', () => {
  withTempDest((dest) => {
    install(dest);
    const stamp = JSON.parse(readFileSync(join(dest, '.loom/adoption.json'), 'utf8'));
    assert.equal(stamp.bundle_version, bundleVersion());
    assert.ok(Object.keys(stamp.files).length > 50, 'the stamp should cover the managed tree');
    assert.ok(stamp.files['scripts/discovery-link-check.mjs'], 'globbed files are stamped per file, not per entry');
    assert.equal(stamp.history.at(-1).version, bundleVersion());
  });
});

test('AN ADOPTER EDIT SURVIVES A RE-RUN, with the upstream version beside it', () => {
  withTempDest((dest) => {
    install(dest);
    const edited = join(dest, 'scripts/discovery-link-check.mjs');
    appendFileSync(edited, '\n// MY-PROJECT story-id convention\n');
    const report = install(dest);
    assert.match(readFileSync(edited, 'utf8'), /MY-PROJECT/, 'the adopter edit was destroyed');
    assert.ok(existsSync(`${edited}.loom-new`), 'the new upstream version should be dropped beside it');
    assert.ok(report.some((r) => r.status === 'local-edit-preserved'), 'the report must say what it preserved');
  });
});

test('one customised file does not freeze its neighbours in the same entry', () => {
  withTempDest((dest) => {
    install(dest);
    appendFileSync(join(dest, 'scripts/discovery-link-check.mjs'), '\n// mine\n');
    rmSync(join(dest, 'scripts/sast-check.mjs'));
    install(dest);
    assert.ok(existsSync(join(dest, 'scripts/sast-check.mjs')), 'a sibling in the same glob should still be installed');
    assert.match(readFileSync(join(dest, 'scripts/discovery-link-check.mjs'), 'utf8'), /mine/);
  });
});

test('a preserved file stays preserved across MANY runs (the stamp is not overwritten with the edit)', () => {
  withTempDest((dest) => {
    install(dest);
    const edited = join(dest, 'scripts/discovery-link-check.mjs');
    appendFileSync(edited, '\n// mine\n');
    install(dest); install(dest); install(dest);
    assert.match(readFileSync(edited, 'utf8'), /mine/, 'a later run clobbered it — the stamp recorded the wrong digest');
  });
});

test('--force overwrites an edit, and is the ONLY way to', () => {
  withTempDest((dest) => {
    install(dest);
    const edited = join(dest, 'scripts/discovery-link-check.mjs');
    appendFileSync(edited, '\n// mine\n');
    install(dest, { force: true });
    assert.doesNotMatch(readFileSync(edited, 'utf8'), /mine/, '--force should overwrite');
  });
});

test('a pre-stamp adoption preserves rather than guesses', () => {
  withTempDest((dest) => {
    install(dest);
    rmSync(join(dest, '.loom'), { recursive: true, force: true }); // adopted before stamping existed
    const edited = join(dest, 'scripts/sast-check.mjs');
    appendFileSync(edited, '\n// theirs\n');
    const report = install(dest);
    assert.match(readFileSync(edited, 'utf8'), /theirs/, 'unknown provenance must not be overwritten');
    assert.ok(report.some((r) => r.status === 'unverifiable-preserved'), 'and it must be reported as unverifiable, not as a clean update');
  });
});

test('a dry run writes nothing at all — not even the stamp', () => {
  withTempDest((dest) => {
    install(dest, { dryRun: true });
    assert.ok(!existsSync(join(dest, '.loom/adoption.json')));
    assert.ok(!existsSync(join(dest, 'scripts/sast-check.mjs')));
  });
});
}
