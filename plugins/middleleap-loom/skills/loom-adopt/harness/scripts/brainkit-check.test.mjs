// Tests for the BrainKit conformance gate (Loom 2.0-rc.8 WS7). Every positive claim has a negative
// bypass: an approved, sealed, owned, grounded BrainKit passes; a draft/expired one used by a
// compiled change, a tampered section, a missing owner, a stale D7 projection, or a plan pinning
// the wrong BrainKit digest all fail. Node built-in runner: `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluate, run, seal, readFrontmatter } from './brainkit-check.mjs';
import { loadBrainkit, livePackageDigest } from '../core/brainkit.mjs';
import { loadRegistry } from './identity-registry-check.mjs';

const HARNESS = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// The example ships in the bundle; in an adopted layout it is absent, so skip cleanly there.
const EXAMPLE = join(HARNESS, 'brainkit-example');

if (!existsSync(EXAMPLE)) {
  test('BrainKit gate (example is bundle-only — skipped in an adopted layout)', { skip: true }, () => {});
} else {
const REGISTRY = loadRegistry(EXAMPLE);
const LIVE = (() => { const bk = loadBrainkit(EXAMPLE); return livePackageDigest(bk.dir, bk.manifest); })();
const brainkit = () => loadBrainkit(EXAMPLE); // fresh manifest object each time (tests mutate copies)

const withTempExample = (fn) => {
  const dir = mkdtempSync(join(tmpdir(), 'brainkit-ex-'));
  try { cpSync(EXAMPLE, dir, { recursive: true }); return fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
};

test('POSITIVE — the sealed, approved Meridian BrainKit passes end to end', () => {
  assert.deepEqual(run(EXAMPLE), []);
});

test('a draft BrainKit used by a compiled change is rejected (unapproved-BrainKit)', () => {
  const bk = brainkit();
  bk.manifest.status = 'draft';
  const f = evaluate(bk, { required: true, registry: REGISTRY });
  assert.ok(f.some((x) => /only an approved BrainKit satisfies a compiled change/.test(x)));
});

test('an expired BrainKit blocks a compiled change', () => {
  const bk = brainkit();
  bk.manifest.expires_at = '2020-01-01';
  const f = evaluate(bk, { required: true, registry: REGISTRY });
  assert.ok(f.some((x) => /expired/.test(x)));
});

test('a not-yet-effective BrainKit blocks a compiled change', () => {
  const bk = brainkit();
  bk.manifest.effective_at = '2999-01-01';
  const f = evaluate(bk, { required: true, registry: REGISTRY });
  assert.ok(f.some((x) => /not yet effective/.test(x)));
});

test('a section owner that does not resolve to a human is rejected', () => {
  const bk = brainkit();
  bk.manifest.owners.identity = 'agent-loom-delivery';
  const f = evaluate(bk, { required: true, registry: REGISTRY });
  assert.ok(f.some((x) => /section identity owner .* does not resolve to a human/.test(x)));
  const bk2 = brainkit();
  delete bk2.manifest.owners.terminology;
  assert.ok(evaluate(bk2, { required: true, registry: REGISTRY }).some((x) => /section terminology has no accountable owner/.test(x)));
});

test('an approval by a non-context-owner (or an agent) is rejected', () => {
  const bk = brainkit();
  bk.manifest.approvals = [{ by: 'eng-omar', at: '2026-07-01' }];
  assert.ok(evaluate(bk, { required: true, registry: REGISTRY }).some((x) => /does not hold the institutional-context-owner role/.test(x)));
  const bk2 = brainkit();
  bk2.manifest.approvals = [{ by: 'agent-loom-delivery', at: '2026-07-01' }];
  assert.ok(evaluate(bk2, { required: true, registry: REGISTRY }).some((x) => /an agent cannot approve institutional context/.test(x)));
});

test('BrainKit-tamper — a one-byte section change without resealing fails the digest check', () => {
  withTempExample((dir) => {
    const p = join(dir, 'institution/brainkit/terminology.md');
    writeFileSync(p, readFileSync(p, 'utf8') + '\n<!-- tamper -->\n');
    const f = run(dir);
    assert.ok(f.some((x) => /section terminology: declared digest does not match/.test(x)), JSON.stringify(f));
  });
});

test('a package_digest that does not match the sections fails', () => {
  const bk = brainkit();
  bk.manifest.package_digest = 'sha256:0000000000000000000000000000000000000000000000000000000000000000';
  const f = evaluate(bk, { required: true, registry: REGISTRY });
  assert.ok(f.some((x) => /package_digest does not match/.test(x)));
});

test('a stale D7 compatibility projection (wrong digest) fails', () => {
  const bk = brainkit();
  const f = evaluate(bk, { required: true, registry: REGISTRY, projection: { brainkit_digest: 'sha256:deadbeef', brainkit_version: '1.0.0' } });
  assert.ok(f.some((x) => /D7 compatibility projection cites BrainKit digest/.test(x)));
});

test('wrong-artifact-provenance — a compiled plan pinning the wrong BrainKit digest fails', () => {
  const bk = brainkit();
  const stale = [{ change_id: 'CHG-X', kind: 'institution', brainkit_digest: 'sha256:staleaaaa' }];
  const f = evaluate(bk, { required: true, registry: REGISTRY, institutionBindings: stale });
  assert.ok(f.some((x) => /pins BrainKit digest .* but the live BrainKit is/.test(x)));
  // sanity: the real live digest passes
  assert.deepEqual(evaluate(bk, { required: true, registry: REGISTRY, institutionBindings: [{ change_id: 'CHG-OK', kind: 'institution', brainkit_digest: LIVE }], projection: readFrontmatter(readFileSync(join(EXAMPLE, 'discovery/brand/design.md'), 'utf8')) }), []);
});

test('WS9 — a mounted snapshot that does not match the pinned release digest fails', () => {
  const bk = brainkit();
  const drifted = [{ change_id: 'CHG-X', kind: 'institution', profile: 'meridian-trust', brainkit_digest: LIVE, release_digest: 'sha256:not-the-release' }];
  const f = evaluate(bk, { required: true, registry: REGISTRY, institutionBindings: drifted });
  assert.ok(f.some((x) => /does not match the release digest pinned by profile meridian-trust/.test(x)));
  // the correct pin passes
  const pinned = [{ change_id: 'CHG-OK', kind: 'institution', profile: 'meridian-trust', brainkit_digest: LIVE, release_digest: LIVE }];
  const proj = readFrontmatter(readFileSync(join(EXAMPLE, 'discovery/brand/design.md'), 'utf8'));
  assert.deepEqual(evaluate(bk, { required: true, registry: REGISTRY, institutionBindings: pinned, projection: proj }), []);
});

test('a compiled change with no BrainKit mounted fails; an unadopted repo is a clean no-op', () => {
  assert.ok(evaluate(null, { required: true }).some((x) => /the institutional BrainKit is not mounted/.test(x)));
  assert.deepEqual(evaluate(null, { required: false }), []);
});

test('seal() round-trips: after sealing, the digests match the files', () => {
  withTempExample((dir) => {
    seal(dir);
    assert.deepEqual(run(dir), []);
  });
});
}
