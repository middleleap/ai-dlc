// Tests for the evidence-seal gate. Node built-in runner: `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { evaluate, buildChain, sealOf, REQUIRED_TYPES, SEMANTICS } from './evidence-seal-check.mjs';

const COMMIT = 'commit-v-test';

// Semantically-valid artifact bodies, one per required type (1.10: meaning is verified too).
const VALID = {
  tests: { suite: 'q1', total: 5, passed: 5, failed: 0, commit: COMMIT },
  reviews: { 'hard-stop-reviewer': 'PASS', 'contract-conformance-reviewer': 'CONFORMANT' },
  lineage: { stores: ['audit'], emits_lineage: true, insert_only: true },
  'model-provenance': { gate: 'model-provenance-check', result: 'OK' },
  'control-plane': { gate: 'control-plane-check', result: 'OK' },
  sast: { version: '2.1.0', runs: [{ tool: { driver: { name: 'demo-sast' } }, results: [] }] },
  sbom: { bomFormat: 'CycloneDX', components: [{ type: 'library', name: 'x', version: '1' }] },
  'dependency-audit': { critical: 0, high: 0, moderate: 0, low: 0 },
  provenance: { subject: [{ name: 'app', digest: { sha256: 'ab'.repeat(32) } }], predicate: { builder: { id: 'ci://demo' } } },
};

// Build a real on-disk bundle (artifacts + manifest chained over their true hashes) in a tmp dir.
function realBundle() {
  const dir = mkdtempSync(join(tmpdir(), 'ev-'));
  const raw = REQUIRED_TYPES.map((type) => {
    const ref = `${type}.json`;
    const body = JSON.stringify(VALID[type]) + '\n';
    writeFileSync(join(dir, ref), body);
    return { type, ref, sha256: createHash('sha256').update(body).digest('hex') };
  });
  return { dir, manifest: { release: 'v', release_commit: COMMIT, entries: buildChain(raw) } };
}

// A raw, complete evidence set (one entry per required type) — chain-only, no disk.
const RAW = REQUIRED_TYPES.map((type, i) => ({ type, ref: `evidence/${type}.json`, sha256: `hash${i}` }));
const sealed = () => ({ release: 'v-test', release_commit: COMMIT, entries: buildChain(RAW) });

test('a complete, intact chain passes', () => {
  assert.deepEqual(evaluate(sealed()), []);
});

test('a manifest without a release_commit is unbound evidence', () => {
  const m = sealed();
  delete m.release_commit;
  assert.ok(evaluate(m).some((x) => /release_commit/.test(x)));
});

test('an altered artifact hash (without re-sealing) is caught', () => {
  const m = sealed();
  m.entries[2].sha256 = 'tampered'; // change content, leave the seal as-is
  const f = evaluate(m);
  assert.ok(f.some((x) => /seal mismatch/.test(x)));
});

test('reordering entries breaks the chain', () => {
  const m = sealed();
  [m.entries[0], m.entries[1]] = [m.entries[1], m.entries[0]];
  const f = evaluate(m);
  assert.ok(f.some((x) => /broken chain|seal mismatch/.test(x)));
});

test('dropping a required entry is reported as missing evidence', () => {
  const m = sealed();
  const droppedType = m.entries[m.entries.length - 1].type;
  m.entries.pop();
  const f = evaluate(m);
  assert.ok(f.some((x) => x === `missing required evidence: ${droppedType}`));
});

test('an incomplete bundle names each missing evidence type', () => {
  const m = { release_commit: COMMIT, entries: buildChain([{ type: 'tests', ref: 'evidence/tests.json', sha256: 'h' }]) };
  const f = evaluate(m);
  for (const t of REQUIRED_TYPES.filter((t) => t !== 'tests')) {
    assert.ok(f.some((x) => x === `missing required evidence: ${t}`), `expected missing ${t}`);
  }
});

test('a matching external anchor passes; a wrong one fails', () => {
  const m = sealed();
  const finalSeal = m.entries[m.entries.length - 1].seal;
  assert.deepEqual(evaluate({ ...m, anchor: finalSeal }), []);
  assert.ok(evaluate({ ...m, anchor: 'deadbeef' }).some((x) => /external anchor mismatch/.test(x)));
});

test('an empty bundle is a finding', () => {
  assert.match(evaluate({ entries: [] })[0], /narrated, not sealed/);
});

test('sealOf is deterministic and chains on prev', () => {
  const e = { type: 'tests', ref: 'a', sha256: 'b' };
  assert.equal(sealOf('GENESIS', e), sealOf('GENESIS', e));
  assert.notEqual(sealOf('GENESIS', e), sealOf('other', e));
});

test('a real on-disk bundle passes when baseDir is given', () => {
  const { dir, manifest } = realBundle();
  try { assert.deepEqual(evaluate(manifest, { baseDir: dir }), []); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});

test('altering an artifact ON DISK (not the manifest) is caught — the seal is tamper-evident', () => {
  const { dir, manifest } = realBundle();
  try {
    writeFileSync(join(dir, `${REQUIRED_TYPES[1]}.json`), '{"tampered":true}\n');
    assert.ok(evaluate(manifest, { baseDir: dir }).some((x) => /altered after sealing/.test(x)));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a sealed artifact missing from disk is a finding', () => {
  const { dir, manifest } = realBundle();
  try {
    rmSync(join(dir, `${REQUIRED_TYPES[0]}.json`));
    assert.ok(evaluate(manifest, { baseDir: dir }).some((x) => /not found/.test(x)));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

/* ---- 1.10 semantic validation: intact bytes are not enough ---- */

function resealed(dir, type, body) {
  // Re-write one artifact and re-seal the WHOLE chain over the new hashes — a perfectly
  // intact chain whose sealed content is bad. Only semantics can catch this.
  writeFileSync(join(dir, `${type}.json`), JSON.stringify(body) + '\n');
  const raw = REQUIRED_TYPES.map((t) => ({
    type: t, ref: `${t}.json`,
    sha256: createHash('sha256').update(JSON.stringify(t === type ? body : VALID[t]) + '\n').digest('hex'),
  }));
  return { release: 'v', release_commit: COMMIT, entries: buildChain(raw) };
}

test('a sealed bundle of FAILING tests fails — intact is not passing', () => {
  const { dir } = realBundle();
  try {
    const m = resealed(dir, 'tests', { ...VALID.tests, failed: 3, passed: 2 });
    assert.ok(evaluate(m, { baseDir: dir }).some((x) => /not clean \(failed=3\)/.test(x)));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('test results from a different commit than the release fail the binding', () => {
  const { dir } = realBundle();
  try {
    const m = resealed(dir, 'tests', { ...VALID.tests, commit: 'some-older-commit' });
    assert.ok(evaluate(m, { baseDir: dir }).some((x) => /not the release commit/.test(x)));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a sealed reviewer verdict that is not PASS/CONFORMANT fails', () => {
  const { dir } = realBundle();
  try {
    const m = resealed(dir, 'reviews', { 'hard-stop-reviewer': 'FAIL', 'contract-conformance-reviewer': 'CONFORMANT' });
    assert.ok(evaluate(m, { baseDir: dir }).some((x) => /hard-stop-reviewer.*not PASS\/CONFORMANT/.test(x)));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a sealed SARIF with an error-level finding fails', () => {
  const { dir } = realBundle();
  try {
    const bad = { version: '2.1.0', runs: [{ tool: { driver: { name: 'demo-sast' } }, results: [{ ruleId: 'sqli', level: 'error', message: { text: 'x' } }] }] };
    const m = resealed(dir, 'sast', bad);
    assert.ok(evaluate(m, { baseDir: dir }).some((x) => /sealed SAST report/.test(x)));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a sealed dependency audit with a critical vulnerability fails', () => {
  const { dir } = realBundle();
  try {
    const m = resealed(dir, 'dependency-audit', { critical: 1, high: 0 });
    assert.ok(evaluate(m, { baseDir: dir }).some((x) => /critical\/high vulnerabilities/.test(x)));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('every required type carries a semantic check — no sealed-but-unread evidence', () => {
  for (const t of REQUIRED_TYPES) assert.ok(SEMANTICS[t], `no semantics for ${t}`);
});
