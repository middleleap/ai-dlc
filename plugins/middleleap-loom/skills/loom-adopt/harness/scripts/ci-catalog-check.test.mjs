// Tests for the CI-catalog closure gate. Node runner: `node --test`.
//
// The gate's whole value is one assertion, so the tests are mostly about not weakening it:
//
//   1. THE REAL BUNDLE CLOSES. Not a fixture — the shipped ci/ci.yml against the shipped catalog.
//      This is the regression that matters: it is the exact check that was missing when nine
//      Factory Floor gates ran in CI with no catalog entry and the gate runner silently dropped
//      every one of them.
//   2. AGREEMENT WITH THE RUNNER. gate-runner selects on mechanism_ref; this gate closes on
//      mechanism_ref. Asserted against core/gate-runner.mjs's own selection rather than restated,
//      so the two cannot drift apart into a gate that passes while the runner still skips.
//   3. THE EXEMPTION CANNOT GO QUIET. A report-only carve-out must be named AND printed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluate, gatesInWorkflow, main, REPORT_ONLY, CI_LOCATIONS, CATALOG_LOCATIONS } from './ci-catalog-check.mjs';
import { select } from '../core/gate-runner.mjs';

const HARNESS = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BUNDLE_CI = resolve(HARNESS, 'ci/ci.yml');
const BUNDLE_CATALOG = resolve(HARNESS, 'governance/control-catalog.template.json');
const readCatalog = () => JSON.parse(readFileSync(BUNDLE_CATALOG, 'utf8'));

test('the shipped workflow closes over the shipped catalog', () => {
  const findings = evaluate(readFileSync(BUNDLE_CI, 'utf8'), readCatalog());
  assert.deepEqual(findings, [], `uncatalogued CI gates:\n${findings.join('\n')}`);
});

test('every gate the workflow runs is runner-reachable, or exempted with a stated reason', () => {
  // The closure gate's PURPOSE, asserted end to end. Presence in the catalog is not enough: a
  // gate must actually be SELECTABLE by the runner in some lane, or be marked `execute: false`
  // with an `execute_note` saying who runs it instead (Q1B is the real case — it needs a
  // merge-base the runner does not supply, so CI invokes it directly). What this forbids is the
  // third case: catalogued, never selected, and nothing saying so — which reads as covered.
  const catalog = readCatalog();
  const byMechanism = new Map(catalog.controls.filter((c) => c.mechanism_ref).map((c) => [c.mechanism_ref, c]));
  const gates = gatesInWorkflow(readFileSync(BUNDLE_CI, 'utf8'))
    .filter((g) => g.startsWith('scripts/') && !REPORT_ONLY.has(g));
  const reachable = new Set();
  for (const lane of ['pr', 'build', 'release', 'deploy', 'scheduled']) {
    for (const entry of select(catalog, { lane, changedPaths: null }).run.values()) reachable.add(entry.mechanism);
  }
  const silent = gates.filter((g) => {
    if (reachable.has(g)) return false;
    const c = byMechanism.get(g);
    return !(c && c.execute === false && typeof c.execute_note === 'string' && c.execute_note.trim());
  });
  assert.deepEqual(silent, [], `catalogued, never selected by the runner, and no execute_note explaining who runs it:\n${silent.join('\n')}`);
});

test('the nine Factory Floor gates are specifically covered', () => {
  // Named explicitly so a future edit that drops one from the catalog fails HERE, with the
  // reason, rather than only inside the generic closure assertion.
  const mechanisms = new Set(readCatalog().controls.map((c) => c.mechanism_ref));
  for (const gate of [
    'scripts/floor-only-check.mjs',
    'scripts/floor-keeper-check.mjs',
    'scripts/approval-surface-check.mjs',
    'scripts/projection-capability-check.mjs',
    'scripts/freeze-stamp-check.mjs',
    'scripts/drift-check.mjs',
    'scripts/template-parity-check.mjs',
    'scripts/identity-map-check.mjs',
    'scripts/adapter-evidence-check.mjs',
  ]) {
    assert.ok(mechanisms.has(gate), `${gate} lost its catalog entry — the gate runner would stop running it`);
  }
});

test('NEGATIVE — an uncatalogued gate fails, and the finding names the runner consequence', () => {
  const yaml = 'jobs:\n  gates:\n    steps:\n      - run: node scripts/invented-check.mjs\n';
  const findings = evaluate(yaml, { controls: [] });
  assert.equal(findings.length, 1);
  assert.match(findings[0], /scripts\/invented-check\.mjs/);
  assert.match(findings[0], /gate-runner/);
});

test('a report-only tool is exempt, but only via the named list', () => {
  const yaml = '      - run: node scripts/token-report.mjs --check\n';
  assert.deepEqual(evaluate(yaml, { controls: [] }), []);
  assert.ok(REPORT_ONLY.has('scripts/token-report.mjs'));
  assert.match(REPORT_ONLY.get('scripts/token-report.mjs'), /never a merge gate/);
});

test('the exemption list is PRINTED, so a carve-out cannot go quiet', async () => {
  const chunks = [];
  const write = process.stdout.write.bind(process.stdout);
  process.stdout.write = (s) => { chunks.push(s); return true; };
  try {
    main(['--ci', BUNDLE_CI]);
  } finally {
    process.stdout.write = write;
  }
  const out = chunks.join('');
  assert.match(out, /report-only, deliberately not controls/);
  assert.match(out, /token-report\.mjs/);
});

test('gate extraction finds gates in both list and multi-command run blocks', () => {
  const yaml = [
    '      - run: node scripts/a-check.mjs',
    '      - run: |',
    '          node scripts/b-check.mjs',
    '          node scripts/c-check.mjs --flag && node scripts/d-check.mjs',
    '          node core/gate-runner.mjs --lane pr',
    '        # node scripts/not-real.mjs is prose, but a commented gate is still a gate we would rather catch',
  ].join('\n');
  const gates = gatesInWorkflow(yaml);
  for (const g of ['scripts/a-check.mjs', 'scripts/b-check.mjs', 'scripts/c-check.mjs', 'scripts/d-check.mjs', 'core/gate-runner.mjs']) {
    assert.ok(gates.includes(g), `missed ${g}`);
  }
});

test('a missing workflow is not a failure — an adoption may not have wired CI yet', () => {
  const chunks = [];
  const write = process.stdout.write.bind(process.stdout);
  process.stdout.write = (s) => { chunks.push(s); return true; };
  let code;
  try {
    code = main(['--ci', resolve(HARNESS, 'ci/does-not-exist.yml')]);
  } finally {
    process.stdout.write = write;
  }
  assert.equal(code, 0);
  assert.match(chunks.join(''), /nothing to close over/);
});

test('the search locations cover both the adopted and the bundle layout', () => {
  assert.ok(CI_LOCATIONS.some((p) => p === '.github/workflows/ci.yml'));
  assert.ok(CATALOG_LOCATIONS.some((p) => p === 'docs/governance/control-catalog.json'));
});
