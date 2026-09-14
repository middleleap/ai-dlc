// The Meridian scenario, mounted into a real adoption: both discovery runs pass every applicable
// gate under the Meridian brand with the obligations register mounted (D6 asks for OB-* ids), the
// D4 refusal fires when the sponsor's app idea is written into the problem statement, the stopped
// run yields a well-formed discovery-stopped record decided by a human, and the registers still
// pass their own gates after the rows are added.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mountMeridian } from './mount.mjs';

const H = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const A = mkdtempSync(join(tmpdir(), 'meridian-scenario-'));
execFileSync(process.execPath, [join(H, 'adopt.mjs'), '--dest', A, '--tier', 'full'], { stdio: 'ignore' });
cpSync(join(H, 'register-example'), join(A, 'docs/governance/data-risk-register'), { recursive: true });
{ const p = join(A, 'docs/governance/obligations.json'); const ob = JSON.parse(readFileSync(p, 'utf8')); for (const x of ob.obligations) { x.illustrative = false; x.article = 'demo fixture'; } writeFileSync(p, JSON.stringify(ob, null, 2)); }
const ids = mountMeridian(A);
const { validateRun } = await import(join(H, 'discovery/gates/validate.mjs'));
const { readOutcome, discoveryStoppedRecord } = await import(join(H, 'core/loop-attestations.mjs'));
const OPTS = { registerDir: join(A, 'docs/governance/data-risk-register'), brandPath: join(A, 'discovery/brand/design.md'), obligationsPath: join(A, 'docs/governance/obligations.json') };
const fails = (r) => r.gates.filter((g) => g.status === 'fail').map((g) => `${g.id}: ${(g.issues || []).join('; ')}`);
process.on('exit', () => rmSync(A, { recursive: true, force: true }));

test('cross-bank-money passes D1–D9 under the Meridian brand with obligations mounted', () => {
  const r = validateRun(join(A, 'discovery/runs/cross-bank-money'), OPTS);
  assert.ok(r.ok, fails(r).join('\n'));
  for (const id of ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9']) assert.equal(r.gates.find((g) => g.id === id)?.status, 'pass', id);
});

test('the sponsor\'s app idea written into the problem statement is refused by D4', () => {
  const run = join(A, 'discovery/runs/cross-bank-money');
  const p = join(run, 'problem-statement.md');
  const original = readFileSync(p, 'utf8');
  try {
    writeFileSync(p, original + '\n\nWe will build the PFM app on a new transfers endpoint with a React front end.\n');
    const r = validateRun(run, OPTS);
    const d4 = r.gates.find((g) => g.id === 'D4');
    assert.equal(d4.status, 'fail');
    assert.ok(d4.issues.some((i) => /endpoint|tech-stack/.test(i)), d4.issues.join('; '));
  } finally { writeFileSync(p, original); }
});

test('cross-bank-money-stopped passes its applicable gates and yields a discovery-stopped record', () => {
  const run = join(A, 'discovery/runs/cross-bank-money-stopped');
  const r = validateRun(run, OPTS);
  assert.ok(r.ok, fails(r).join('\n'));
  const outcome = readOutcome(run);
  assert.equal(outcome.outcome, 'stopped');
  const rec = discoveryStoppedRecord('cross-bank-money-stopped', outcome);
  assert.equal(rec.hypotheses.find((h) => h.id === 'H2')?.verdict, 'refuted');
  assert.equal(rec.decided_by, 'po-fatima');
});

test('the registers accept the Meridian rows (obligations and catalog gates green)', () => {
  for (const s of ['scripts/obligations-check.mjs', 'scripts/control-catalog-check.mjs']) execFileSync(process.execPath, [s], { cwd: A, stdio: 'ignore' });
  assert.ok(ids.obligations.length >= 6);
  assert.equal(ids.control, 'PAYMENT-STATUS');
});
