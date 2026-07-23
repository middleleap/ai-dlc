// The installer contract (Loom 2.0-rc.8 WS1). copy-manifest.json is the single source of truth
// for what the Loom lays into an adopting repo, and rc.8 makes it real in CI: the adoption
// dry-run installs THROUGH adopt.mjs, not a hand-maintained `cp` list. These tests pin the
// property that makes that safe — the installer is manifest-driven, so a new entry lands in the
// adopted layout with no per-entry code or CI change, and the generated copy table cannot
// silently drop one.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
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
const { install, loadManifest, copyTable } = await import(ADOPT);

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
}
