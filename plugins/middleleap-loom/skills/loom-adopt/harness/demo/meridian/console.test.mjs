// The console's data contract, held to the Meridian estate. scripts/console-data.mjs reads an
// adopted tree into loom.console/v1; this test builds that tree (the scenario plus the estate:
// the approved BrainKit and the change that shipped the view) and requires the generated data to
// agree with portfolio.json — the same declared state scenario.test.mjs holds the runs to — so
// the console cannot show a run anywhere other than where the gates put it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mountMeridian, mountEstate, PORTFOLIO } from './mount.mjs';

const H = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const bundleOnly = !existsSync(join(H, 'brainkit-example'));
const A = mkdtempSync(join(tmpdir(), 'meridian-console-'));
process.on('exit', () => rmSync(A, { recursive: true, force: true }));
let data = null, consoleData = null;
const NOW = Date.parse('2026-09-24T09:00:00Z');
if (!bundleOnly) {
  execFileSync(process.execPath, [join(H, 'adopt.mjs'), '--dest', A, '--tier', 'full'], { stdio: 'ignore' });
  cpSync(join(H, 'register-example'), join(A, 'docs/governance/data-risk-register'), { recursive: true });
  const p = join(A, 'docs/governance/obligations.json'); const ob = JSON.parse(readFileSync(p, 'utf8'));
  for (const x of ob.obligations) { x.illustrative = false; x.article = 'demo fixture'; }
  writeFileSync(p, JSON.stringify(ob, null, 2));
  mountMeridian(A); mountEstate(A);
  ({ consoleData } = await import(join(A, 'scripts/console-data.mjs')));
  data = consoleData(A, { now: NOW });
}
const skip = bundleOnly && 'brainkit-example is bundle-only';

test('the adopted tree carries the generator, and it emits loom.console/v1 with no authority', { skip }, () => {
  assert.ok(existsSync(join(A, 'scripts/console-data.mjs')), 'console-data.mjs must ship to adopters');
  assert.equal(data.schema, 'loom.console/v1');
  assert.equal(data.authority, 'none');
  assert.equal(data.generated_at, '2026-09-24T09:00:00.000Z');
});

for (const run of PORTFOLIO.runs) {
  test(`console: ${run.slug} is where portfolio.json and the gates put it`, { skip }, () => {
    const r = data.runs.find((x) => x.slug === run.slug);
    assert.ok(r, `${run.slug} missing from the console data`);
    assert.equal(r.status, run.status);
    assert.equal(r.stage.id, run.stage);
    assert.deepEqual(Object.fromEntries(r.gates.map((g) => [g.id, g.status])), run.expect, 'gate states are the validator\'s, unsoftened');
    assert.equal(r.sponsor.id, run.owner); assert.ok(r.sponsor.resolves, `${run.owner} must be a human in the identity registry`);
    assert.equal(r.strategic_intent.id, run.strategic_intent); assert.ok(r.strategic_intent.resolves);
    assert.equal(r.product_profile.id, run.profile); assert.ok(r.product_profile.resolves);
  });
}

test('a gate failing on a stage not reached is still FAIL, marked unreached — never softened to pass', { skip }, () => {
  const sme = data.runs.find((r) => r.slug === 'sme-overdraft-decision');
  const d6 = sme.gates.find((g) => g.id === 'D6');
  assert.equal(d6.status, 'fail'); assert.equal(d6.reached, false);
  const home = data.runs.find((r) => r.slug === 'home-finance-top-up');
  assert.deepEqual(home.blocked_by, ['D5']);
});

test('every provenance kind is one of the four, and every sourced file exists', { skip }, () => {
  const kinds = new Set(['record', 'executed-check', 'derived', 'telemetry']);
  const walk = (o) => { if (!o || typeof o !== 'object') return; if (o.file && o.kind) { assert.ok(kinds.has(o.kind), o.kind); if (o.kind === 'record') assert.ok(existsSync(join(A, o.file)), o.file); } for (const v of Object.values(o)) walk(v); };
  walk(data);
});

test('the estate reads: BrainKit sealed and checked, approvals aged by telemetry, maturity reported honestly', { skip }, () => {
  assert.equal(data.brainkit.version, '1.0.1');
  assert.equal(data.registers.obligations.filter((o) => o.article_status === 'owner-verification-pending').length, 5, 'the five Open Finance obligations name a source and leave the article to their owners');
  assert.equal(data.brainkit.check.ok, true);
  assert.deepEqual(data.brainkit.intents.filter((i) => i.pursued).map((i) => i.id), ['SI-01', 'SI-02', 'SI-03', 'SI-04']);
  assert.ok(data.approvals.rows.length > 0 && data.approvals.rows.every((r) => r.change_id === 'CHG-2026-0042' && Number.isFinite(r.age_days)));
  assert.equal(data.control_catalog.counts['organisationally-enforced'], 0, 'the method does not claim organisational enforcement it has not got');
  assert.deepEqual(data.integrity, { unresolved_sponsors: [], unresolved_intents: [], unresolved_profiles: [], stale_reactions: [] });
});

test('integrity: an unregistered sponsor and a prototype edited after its reaction are both reported', { skip }, () => {
  const B = mkdtempSync(join(tmpdir(), 'meridian-console-neg-'));
  try {
    cpSync(A, B, { recursive: true });
    const intent = join(B, 'discovery/runs/salary-advance/intent.md');
    writeFileSync(intent, readFileSync(intent, 'utf8').replace('sponsor: po-fatima', 'sponsor: po-nobody'));
    const brief = join(B, 'discovery/runs/cross-bank-money/prototype.md');
    writeFileSync(brief, readFileSync(brief, 'utf8') + '\nEdited after the reaction.\n');
    const d = consoleData(B, { now: NOW });
    assert.deepEqual(d.integrity.unresolved_sponsors, ['salary-advance: po-nobody']);
    assert.deepEqual(d.integrity.stale_reactions, ['cross-bank-money']);
  } finally { rmSync(B, { recursive: true, force: true }); }
});
