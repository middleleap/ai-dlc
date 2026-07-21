// Tests for the evidence-seal gate. Node built-in runner: `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { evaluate, buildChain, sealOf, REQUIRED_TYPES } from './evidence-seal-check.mjs';

// Build a real on-disk bundle (artifacts + manifest chained over their true hashes) in a tmp dir.
function realBundle() {
  const dir = mkdtempSync(join(tmpdir(), 'ev-'));
  const raw = REQUIRED_TYPES.map((type) => {
    const ref = `${type}.json`;
    const body = JSON.stringify({ type, ok: true }) + '\n';
    writeFileSync(join(dir, ref), body);
    return { type, ref, sha256: createHash('sha256').update(body).digest('hex') };
  });
  return { dir, manifest: { release: 'v', entries: buildChain(raw) } };
}

// A raw, complete evidence set (one entry per required type).
const RAW = REQUIRED_TYPES.map((type, i) => ({ type, ref: `evidence/${type}.json`, sha256: `hash${i}` }));
const sealed = () => ({ release: 'v-test', entries: buildChain(RAW) });

test('a complete, intact chain passes', () => {
  assert.deepEqual(evaluate(sealed()), []);
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
  const m = { entries: buildChain([{ type: 'tests', ref: 'evidence/tests.json', sha256: 'h' }]) };
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
