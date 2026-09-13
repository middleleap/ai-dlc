import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { readiness, BASELINE, activationReadiness } from './activation-readiness.mjs';
import { activationHash } from './platform-activation-check.mjs';
import { preflight } from './onboarding-preflight.mjs';

const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const issuers = { issuers: [{ id: 'observer', mechanism: 'ed25519', verify: { public_key: publicKey.export({ type: 'spki', format: 'pem' }).toString() } }] };
const registry = { identities: [{ id: 'admin', kind: 'human', groups: ['platform-admins'] }] };
const now = Date.parse('2026-09-13T00:00:00Z');
const receipt = id => {
  const r = { platform: 'github', repository: 'example/project', satisfies_control: id, mechanism: 'branch_protection', observer_identity: 'admin', observation: { enforce_admins: true }, observed_at: new Date(now - 1000).toISOString(), bypass_test: { attempted: 'direct push', result: 'rejected', tested_at: new Date(now - 1000).toISOString() } };
  r.attestation = { issuer: 'observer', signature: sign(null, Buffer.from(activationHash(r)), privateKey).toString('base64') }; return r;
};
const evaluate = records => readiness({ records, registry, issuers, repository: 'example/project', now });
test('activation baseline is incomplete with zero or partial observations', () => {
  assert.deepEqual(evaluate([]).missing, BASELINE);
  assert.equal(evaluate([receipt('HG-0001')]).ready, false);
});
test('named baseline requires verified receipts for each baseline control', () => {
  assert.equal(evaluate(BASELINE.map(receipt)).ready, true);
  const records = BASELINE.map(receipt); records[0].observation.enforce_admins = false;
  assert.equal(evaluate(records).ready, false);
});
test('another repository, a missing registry and future observations cannot establish readiness', () => {
  const records = BASELINE.map(receipt);
  assert.equal(readiness({ records, registry, issuers, repository: 'other/project', now }).ready, false);
  assert.equal(readiness({ records, registry: null, issuers, repository: 'example/project', now }).ready, false);
  const future = records.map(r => { const v = { ...r, observed_at: new Date(now + 86400000).toISOString() };v.attestation={issuer:'observer',signature:sign(null,Buffer.from(activationHash(v)),privateKey).toString('base64')};return v; });
  assert.equal(evaluate(future).ready, false);
});
test('malformed activation files fail with a useful message', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'loom-activation-'));
  try {
    mkdirSync(join(cwd, 'platform-activation'));writeFileSync(join(cwd, 'platform-activation', 'broken.json'), '{');
    let output = '';const stream = { write: s => output += s };
    assert.equal(activationReadiness(['--platform','github','--repository','example/project'], cwd, stream, stream), 1);
    assert.match(output, /unreadable/);
  } finally { rmSync(cwd, { recursive: true, force: true }); }
});
test('preflight rejects missing jq and unsupported runtime without claiming platform activation', () => {
  const result = preflight('.', { runtime: 'codex', spawn: command => ({ status: command === 'jq' ? 1 : 0 }) });
  assert.equal(result.readyForSetup, false);
  assert.equal(result.checks.find(c => c.id === 'jq').passed, false);
  assert.equal(result.checks.find(c => c.id === 'runtime').passed, false);
  assert.match(result.scope, /No live platform/);
});
const installer = new URL('../adopt.mjs', import.meta.url);
const bundled = existsSync(fileURLToPath(installer));
test('installed public commands handle bundle paths, dry-run, and missing activation evidence', { skip: !bundled }, async () => {
  const { install } = await import(installer.href);
  const cwd = mkdtempSync(join(tmpdir(), 'loom commands '));
  try {
    install(cwd, { tier: 'core' });
    const run = args => spawnSync(process.execPath, ['scripts/loom.mjs', ...args], { cwd, encoding: 'utf8' });
    const absent = run(['adopt']);assert.equal(absent.status, 2);assert.match(absent.stderr, /--bundle/);assert.doesNotMatch(absent.stderr, /MODULE_NOT_FOUND/);
    const dry = run(['adopt','--bundle',fileURLToPath(new URL('.', installer)),'--dry-run']);
    assert.equal(dry.status, 0, dry.stderr);
    assert.equal(run(['activate','--platform','github','--repository','example/project']).status, 1);
    assert.equal(run(['activate','--platform','github']).status, 2);
  } finally { rmSync(cwd, { recursive: true, force: true }); }
});
