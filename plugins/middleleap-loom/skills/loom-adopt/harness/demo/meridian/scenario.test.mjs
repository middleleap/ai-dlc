// The Meridian scenario, mounted into a real adoption: both discovery runs pass every applicable
// gate under the Meridian brand with the obligations register mounted (D6 asks for OB-* ids), the
// D4 refusal fires when the sponsor's app idea is written into the problem statement, the stopped
// run yields a well-formed discovery-stopped record decided by a human, and the registers still
// pass their own gates after the rows are added.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mountMeridian, PORTFOLIO } from './mount.mjs';

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

// The portfolio (portfolio/portfolio.json): every mounted run is held to the exact gate state the
// manifest declares. An unfinished run fails the gates for the stages it has not reached; that is
// what the oversight console shows, so the fixture and the picture cannot drift apart.
for (const run of PORTFOLIO.runs) {
  test(`portfolio: ${run.slug} is in its declared state (${run.status}, stage ${run.stage})`, () => {
    const r = validateRun(join(A, 'discovery/runs', run.slug), OPTS);
    const got = Object.fromEntries(r.gates.map((g) => [g.id, g.status]));
    assert.deepEqual(got, run.expect, `${run.slug}: gates ${JSON.stringify(got)}\n${fails(r).join('\n')}`);
  });
}

test('portfolio: the blocked run fails D5 for the reason the fixture says, and only that reason', () => {
  const r = validateRun(join(A, 'discovery/runs/home-finance-top-up'), OPTS);
  const d5 = r.gates.find((g) => g.id === 'D5');
  assert.deepEqual(d5.issues.length, 1, d5.issues.join('; '));
  assert.match(d5.issues[0], /traces to no signal/);
});

test('portfolio: the run awaiting a reaction fails D9 only because nobody has reacted yet', () => {
  const r = validateRun(join(A, 'discovery/runs/plain-language-decline'), OPTS);
  const d9 = r.gates.find((g) => g.id === 'D9');
  assert.equal(d9.issues.length, 1, d9.issues.join('; '));
  assert.match(d9.issues[0], /stakeholder-reaction\.md missing/);
  assert.equal(r.gates.find((g) => g.id === 'D6').verdict, 'conditional');
});

// Every strategic intent a Meridian run cites resolves in the Meridian BrainKit's strategy section.
// No gate reads SI-* yet (the citation is prose the decision authority reads), which is exactly how
// the worked example came to cite SI-03 for weeks while strategy.md approved only SI-01 and SI-02.
const STRATEGY = join(H, 'brainkit-example/institution/brainkit/strategy.md');
test('portfolio: every strategic intent a run cites resolves in the BrainKit strategy', { skip: !existsSync(STRATEGY) && 'brainkit-example is bundle-only' }, () => {
  const approved = new Set([...readFileSync(STRATEGY, 'utf8').matchAll(/`(SI-\d{2})`/g)].map((m) => m[1]));
  for (const run of PORTFOLIO.runs) {
    assert.ok(approved.has(run.strategic_intent), `${run.slug} is declared against ${run.strategic_intent}, which strategy.md does not approve`);
    const dir = join(A, 'discovery/runs', run.slug);
    for (const f of ['intent.md', 'problem-statement.md']) {
      if (!existsSync(join(dir, f))) continue;
      for (const [, id] of readFileSync(join(dir, f), 'utf8').matchAll(/\b(SI-\d{2})\b/g)) {
        assert.ok(approved.has(id), `${run.slug}/${f} cites ${id}, which strategy.md does not approve`);
      }
    }
  }
});

test('portfolio: the operations signal that opened salary-advance is routed and traceable', () => {
  execFileSync(process.execPath, ['scripts/operations-signal-check.mjs'], { cwd: A, stdio: 'pipe' });
  const sig = JSON.parse(readFileSync(join(A, 'docs/governance/operations-signal.json'), 'utf8')).signals;
  assert.ok(sig.some((s) => s.id === 'OPS-2026-0918' && s.link === 'discovery/salary-advance'));
  assert.equal(PORTFOLIO.runs.find((r) => r.slug === 'salary-advance').opened_by, 'OPS-2026-0918');
});
