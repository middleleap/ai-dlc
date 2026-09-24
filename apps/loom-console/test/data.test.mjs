// The console's data contract, held to the Meridian Trust demo installation. src/data.mjs reads a
// Loom installation into loom.console/v1; this test builds that installation (the scenario plus the
// estate: the approved BrainKit and the change that shipped the view) and requires the data to agree
// with portfolio.json — the same declared state the harness's scenario.test.mjs holds the runs to —
// so the console cannot show a run anywhere other than where the gates put it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { consoleData, loadInstallation } from '../src/data.mjs';
import { meridianInstallation, HARNESS } from '../src/demo.mjs';

const bundleOnly = !existsSync(join(HARNESS, 'brainkit-example'));
const NOW = Date.parse('2026-09-24T09:00:00Z');
let A = null, data = null, PORTFOLIO = { runs: [] };
if (!bundleOnly) {
  A = await meridianInstallation();
  ({ PORTFOLIO } = await import(pathToFileURL(join(HARNESS, 'demo/meridian/mount.mjs')).href));
  data = await consoleData(A, { now: NOW });
}
process.on('exit', () => { if (A) rmSync(A, { recursive: true, force: true }); });
const skip = bundleOnly && 'brainkit-example is bundle-only';

test('it emits loom.console/v1 with no authority, from the installation\'s own gate modules', { skip }, () => {
  assert.equal(data.schema, 'loom.console/v1');
  assert.deepEqual(data.reader_modules, ['discovery/gates/validate.mjs', 'discovery/gates/lib.mjs', 'scripts/approval-status.mjs']);
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

test('integrity: an unregistered sponsor and a prototype edited after its reaction are both reported', { skip }, async () => {
  const B = mkdtempSync(join(tmpdir(), 'meridian-console-neg-'));
  try {
    cpSync(A, B, { recursive: true });
    const intent = join(B, 'discovery/runs/salary-advance/intent.md');
    writeFileSync(intent, readFileSync(intent, 'utf8').replace('sponsor: po-fatima', 'sponsor: po-nobody'));
    const brief = join(B, 'discovery/runs/cross-bank-money/prototype.md');
    writeFileSync(brief, readFileSync(brief, 'utf8') + '\nEdited after the reaction.\n');
    const d = await consoleData(B, { now: NOW });
    assert.deepEqual(d.integrity.unresolved_sponsors, ['salary-advance: po-nobody']);
    assert.deepEqual(d.integrity.stale_reactions, ['cross-bank-money']);
  } finally { rmSync(B, { recursive: true, force: true }); }
});

test('a tree that is not a Loom installation is refused, by name', async () => {
  const E = mkdtempSync(join(tmpdir(), 'not-loom-'));
  try { await assert.rejects(loadInstallation(E), /is not a Loom installation: missing discovery\/gates\/validate\.mjs/); }
  finally { rmSync(E, { recursive: true, force: true }); }
});
