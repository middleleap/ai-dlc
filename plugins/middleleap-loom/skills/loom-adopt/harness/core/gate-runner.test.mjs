// Tests for the gate runner's selection logic. Node built-in runner: `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { select, LANES } from './gate-runner.mjs';

const RUNNER = resolve(dirname(fileURLToPath(import.meta.url)), 'gate-runner.mjs');

const CAT = { controls: [
  { control_id: 'CORE-1', mechanism_ref: 'scripts/a.mjs', lane: 'pr', always: true },
  { control_id: 'SCOPED-1', mechanism_ref: 'scripts/b.mjs', lane: 'pr', paths: ['docs/governance/changes/', 'profiles/'] },
  { control_id: 'SCOPED-2', mechanism_ref: 'scripts/c.mjs', lane: 'pr', paths: ['docs/governance/model-manifest.json'] },
  { control_id: 'UNSCOPED', mechanism_ref: 'scripts/d.mjs', lane: 'pr' },
  { control_id: 'REL-1', mechanism_ref: 'scripts/e.mjs', lane: 'release' },
  { control_id: 'DOC-ONLY', doc_ref: 'runbook.md', lane: 'pr' },
  { control_id: 'LIB-1', mechanism_ref: 'core/lib.mjs', lane: 'pr', execute: false, execute_note: 'library — enforced via scripts/b.mjs' },
  { control_id: 'CORE-1B', mechanism_ref: 'scripts/a.mjs', lane: 'pr', always: true },
] };

const ids = (r) => r.run.flatMap((g) => g.ids).sort();
const skippedIds = (r) => r.skipped.map((s) => s.id).sort();

test('always-on core runs whatever the diff; out-of-scope controls skip WITH a recorded reason', () => {
  const r = select(CAT, { lane: 'pr', changedPaths: ['README.md'] });
  assert.deepEqual(ids(r), ['CORE-1', 'CORE-1B', 'UNSCOPED']);
  assert.deepEqual(skippedIds(r), ['LIB-1', 'REL-1', 'SCOPED-1', 'SCOPED-2']);
  for (const s of r.skipped) assert.ok(s.reason.length > 0, 'every skip carries a reason');
});

test('a diff touching a scoped path implicates its control', () => {
  const r = select(CAT, { lane: 'pr', changedPaths: ['docs/governance/changes/CHG-1/change-envelope.json'] });
  assert.ok(ids(r).includes('SCOPED-1'));
  assert.ok(!ids(r).includes('SCOPED-2'));
});

test('an UNKNOWN diff fails open: everything in the lane runs', () => {
  const r = select(CAT, { lane: 'pr', changedPaths: null });
  assert.deepEqual(ids(r), ['CORE-1', 'CORE-1B', 'SCOPED-1', 'SCOPED-2', 'UNSCOPED']);
  assert.deepEqual(skippedIds(r), ['LIB-1', 'REL-1']); // only the other lane + the library skip
});

test('lanes separate: a release run skips pr controls (recorded) and runs release ones', () => {
  const r = select(CAT, { lane: 'release', changedPaths: ['README.md'] });
  assert.deepEqual(ids(r), ['REL-1']);
  assert.ok(r.skipped.every((s) => /lane:pr|enforced via/.test(s.reason)));
});

test('a control with no path scope runs by default — declaring a scope is the opt-in', () => {
  const r = select(CAT, { lane: 'pr', changedPaths: ['nothing/relevant.txt'] });
  assert.ok(ids(r).includes('UNSCOPED'));
});

test('a file scope matches the file and its children, never a sibling that shares the prefix (rc.33)', () => {
  // SCOPED-2 is scoped to the exact file docs/governance/model-manifest.json. A raw prefix
  // match also implicated docs/governance/model-manifest.json.bak — a sibling, not the file.
  const exact = select(CAT, { lane: 'pr', changedPaths: ['docs/governance/model-manifest.json'] });
  assert.ok(ids(exact).includes('SCOPED-2'), 'the exact file must implicate its control');
  const sibling = select(CAT, { lane: 'pr', changedPaths: ['docs/governance/model-manifest.json.bak'] });
  assert.ok(!ids(sibling).includes('SCOPED-2'), 'a shared-prefix sibling must NOT implicate the control');
  const dirLike = select(CAT, { lane: 'pr', changedPaths: ['docs/governance/changesets/x.json'] });
  assert.ok(!ids(dirLike).includes('SCOPED-1'), 'changesets/ must not satisfy a changes/ scope');
});

test('the CLI refuses a lane with no runnable catalogued controls — an empty lane is a hole (rc.33)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'gr-'));
  try {
    writeFileSync(join(dir, 'control-catalog.json'), JSON.stringify({ controls: [
      { control_id: 'PR-1', mechanism_ref: 'scripts/a.mjs', lane: 'pr', always: true },
    ] }));
    const r = spawnSync(process.execPath, [RUNNER, '--lane', 'build'], { cwd: dir, encoding: 'utf8' });
    assert.equal(r.status, 2, `an empty build lane must exit 2, got ${r.status}\n${r.stderr}`);
    assert.match(r.stderr, /empty lane is a hole/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('two controls sharing one mechanism dedupe into a single execution', () => {
  const r = select(CAT, { lane: 'pr', changedPaths: [] });
  const core = r.run.find((g) => g.mechanism === 'scripts/a.mjs');
  assert.deepEqual(core.ids.sort(), ['CORE-1', 'CORE-1B']);
});

test('documented controls (no runnable mechanism) are neither run nor reported skipped', () => {
  const r = select(CAT, { lane: 'pr', changedPaths: null });
  assert.ok(!ids(r).includes('DOC-ONLY'));
  assert.ok(!skippedIds(r).includes('DOC-ONLY'));
});

test('an execute:false control is skipped with its stated reason, never spawned', () => {
  const r = select(CAT, { lane: 'pr', changedPaths: null });
  assert.ok(!r.run.some((g) => g.mechanism === 'core/lib.mjs'));
  const s = r.skipped.find((x) => x.id === 'LIB-1');
  assert.match(s.reason, /enforced via scripts\/b\.mjs/);
});

/* ---- W1: a compiled plan makes a control's family unskippable in its lane ---- */

const FAMCAT = { controls: [
  { control_id: 'FAM-A', mechanism_ref: 'scripts/a.mjs', lane: 'pr', paths: ['nothing/'], gate_family: 'A' },
  { control_id: 'FAM-R', mechanism_ref: 'scripts/r.mjs', lane: 'release', paths: ['nothing/'], gate_family: 'R' },
] };

test('a path-scoped control whose family a plan requires becomes UNSKIPPABLE, naming the change', () => {
  const reqs = { families: new Set(['A']), changes: [{ change_id: 'CHG-7', families: ['A'] }] };
  const r = select(FAMCAT, { lane: 'pr', changedPaths: ['README.md'], requirements: reqs });
  assert.ok(r.run.some((g) => g.ids.includes('FAM-A')), 'FAM-A must run though the diff implicates nothing');
});

test('without the requirement, the same control skips on an unrelated diff', () => {
  const r = select(FAMCAT, { lane: 'pr', changedPaths: ['README.md'], requirements: { families: new Set(), changes: [] } });
  assert.ok(r.skipped.some((s) => s.id === 'FAM-A'));
});

test('lane separation still holds — a required release-family control does not run in a pr run', () => {
  const reqs = { families: new Set(['R']), changes: [{ change_id: 'CHG-7', families: ['R'] }] };
  const r = select(FAMCAT, { lane: 'pr', changedPaths: ['README.md'], requirements: reqs });
  assert.ok(r.skipped.some((s) => s.id === 'FAM-R' && /lane:release/.test(s.reason)));
});

test('the lanes cover the artifact life: pr, build, release, deploy, scheduled (rc.11 WS1.4)', () => {
  assert.deepEqual(LANES, ['pr', 'build', 'release', 'deploy', 'scheduled']);
});

/* ---- rc.34: tier-aware selection — min_tier is opt-in, and always/mandated override upward ---- */

const TIERCAT = { controls: [
  { control_id: 'HI-ONLY', mechanism_ref: 'scripts/h.mjs', lane: 'pr', min_tier: 'high' },
  { control_id: 'HI-ALWAYS', mechanism_ref: 'scripts/ha.mjs', lane: 'pr', min_tier: 'high', always: true },
  { control_id: 'HI-FAM', mechanism_ref: 'scripts/hf.mjs', lane: 'pr', min_tier: 'high', gate_family: 'PA2', paths: ['nothing/'] },
  { control_id: 'ANY', mechanism_ref: 'scripts/any.mjs', lane: 'pr' },
] };

test('a min_tier control skips below its tier WITH a recorded reason, and runs at or above it', () => {
  const low = { families: new Set(), changes: [], maxTier: 'low' };
  const rLow = select(TIERCAT, { lane: 'pr', changedPaths: null, requirements: low });
  const s = rLow.skipped.find((x) => x.id === 'HI-ONLY');
  assert.ok(s && /min_tier:high/.test(s.reason), 'the skip must name the tier rule');
  assert.ok(ids(rLow).includes('ANY'), 'controls without min_tier are untouched');
  const high = { families: new Set(), changes: [], maxTier: 'high' };
  assert.ok(ids(select(TIERCAT, { lane: 'pr', changedPaths: null, requirements: high })).includes('HI-ONLY'));
});

test('always and plan-mandated controls IGNORE min_tier — the override goes upward, never downward', () => {
  const low = { families: new Set(['PA2']), changes: [{ change_id: 'CHG-1', families: ['PA2'] }], maxTier: 'low' };
  const r = select(TIERCAT, { lane: 'pr', changedPaths: ['README.md'], requirements: low });
  assert.ok(ids(r).includes('HI-ALWAYS'), 'always beats min_tier');
  assert.ok(ids(r).includes('HI-FAM'), 'a plan-mandated family beats min_tier');
});

test('with no aggregated requirements at all, min_tier does not apply — fail open', () => {
  const r = select(TIERCAT, { lane: 'pr', changedPaths: null });
  assert.ok(ids(r).includes('HI-ONLY'));
});
