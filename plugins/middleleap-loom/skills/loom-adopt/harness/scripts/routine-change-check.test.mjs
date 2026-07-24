// Tests for the HG-0013 routine-change lane. Node built-in runner: `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, pathMatch, FLOOR_DENY, ROUTINE_CLASSES } from './routine-change-check.mjs';

const REGISTRY = {
  groups: { 'second-line': {}, builders: {} },
  identities: [
    { id: 'sara-2l', kind: 'human', groups: ['second-line'] },
    { id: 'dev-omar', kind: 'human', groups: ['builders'] },
    { id: 'loom-agent', kind: 'agent', groups: ['builders'] },
  ],
};

const ENVELOPE = {
  envelope_id: 'RTE-T', owner: 'sara-2l', expires: '2026-12-31',
  allowed_classes: ['doc-fix', 'dependency-patch'],
  path_allow: ['docs/', 'package-lock.json', 'CHANGELOG.md'],
  path_deny: ['docs/governance/'],
  max_diff_lines: 40,
  required_green_gates: ['Q1', 'Q1b'],
};
const CLAIM = {
  envelope: 'RTE-T', class: 'doc-fix',
  changed_paths: ['docs/guide.md'], diff_lines: 8, gates_green: ['Q1', 'Q1b', 'Q2'],
};
const ASOF = '2026-07-22';

test('a conforming routine change qualifies (empty findings)', () => {
  assert.deepEqual(evaluate(ENVELOPE, CLAIM, REGISTRY, ASOF), []);
});

test('NEGATIVE — a path outside path_allow does not qualify', () => {
  const f = evaluate(ENVELOPE, { ...CLAIM, changed_paths: ['src/app.js'] }, REGISTRY, ASOF);
  assert.ok(f.some((m) => /outside the envelope's path_allow/.test(m)));
});

test('NEGATIVE — a control-plane path hits the absolute floor even if the envelope allows it', () => {
  // An envelope that recklessly allows everything still cannot reach the control plane.
  const reckless = { ...ENVELOPE, path_allow: ['', 'scripts/', 'docs/'] };
  const f = evaluate(reckless, { ...CLAIM, changed_paths: ['scripts/control-plane-check.mjs'] }, REGISTRY, ASOF);
  assert.ok(f.some((m) => /absolute floor/.test(m)), 'floor is code, not configuration');
});

test('NEGATIVE — the API contract is under the floor', () => {
  const reckless = { ...ENVELOPE, path_allow: ['specs/'] };
  const f = evaluate(reckless, { ...CLAIM, changed_paths: ['specs/openapi.yaml'] }, REGISTRY, ASOF);
  assert.ok(f.some((m) => /absolute floor/.test(m)));
});

test('NEGATIVE — an expired envelope does not qualify', () => {
  const f = evaluate({ ...ENVELOPE, expires: '2026-01-01' }, CLAIM, REGISTRY, ASOF);
  assert.ok(f.some((m) => /expired/.test(m)));
});

test('NEGATIVE — an unparseable expiry does not silently never-expire', () => {
  const f = evaluate({ ...ENVELOPE, expires: 'not-a-date' }, CLAIM, REGISTRY, ASOF);
  assert.ok(f.some((m) => /not a valid date/.test(m)), 'a NaN date must fail, not pass');
});

test('NEGATIVE — an agent-owned envelope is rejected', () => {
  const f = evaluate({ ...ENVELOPE, owner: 'loom-agent' }, CLAIM, REGISTRY, ASOF);
  assert.ok(f.some((m) => /not a human/.test(m)));
});

test('NEGATIVE — a builder-owned envelope is rejected (must be second line)', () => {
  const f = evaluate({ ...ENVELOPE, owner: 'dev-omar' }, CLAIM, REGISTRY, ASOF);
  assert.ok(f.some((m) => /not in the second-line group/.test(m)));
});

test('NEGATIVE — a class the envelope does not allow is rejected', () => {
  const f = evaluate(ENVELOPE, { ...CLAIM, class: 'formatting' }, REGISTRY, ASOF);
  assert.ok(f.some((m) => /not allowed by this envelope/.test(m)));
});

test('NEGATIVE — a class outside the known routine set is rejected', () => {
  const f = evaluate({ ...ENVELOPE, allowed_classes: ['refactor'] }, { ...CLAIM, class: 'refactor' }, REGISTRY, ASOF);
  assert.ok(f.some((m) => /is not a routine class/.test(m)));
});

test('NEGATIVE — a diff over the cap is rejected', () => {
  const f = evaluate(ENVELOPE, { ...CLAIM, diff_lines: 400 }, REGISTRY, ASOF);
  assert.ok(f.some((m) => /over the envelope cap/.test(m)));
});

test('NEGATIVE — a missing required green gate is rejected', () => {
  const f = evaluate(ENVELOPE, { ...CLAIM, gates_green: ['Q1'] }, REGISTRY, ASOF);
  assert.ok(f.some((m) => /required gate Q1b is not recorded green/.test(m)));
});

test('NEGATIVE — an envelope path_deny still bites inside an allowed prefix', () => {
  const f = evaluate(ENVELOPE, { ...CLAIM, changed_paths: ['docs/governance/notes.md'] }, REGISTRY, ASOF);
  // caught by the floor first (docs/governance/), proving defence in depth
  assert.ok(f.some((m) => /floor/.test(m) || /path_deny/.test(m)));
});

test('no envelope at all → normal lane', () => {
  const f = evaluate(null, CLAIM, REGISTRY, ASOF);
  assert.ok(f.some((m) => /no standing authorization/.test(m)));
});

test('pathMatch handles dir prefixes, exacts, and *.ext', () => {
  assert.ok(pathMatch('docs/', 'docs/a/b.md'));
  assert.ok(pathMatch('CHANGELOG.md', 'CHANGELOG.md'));
  assert.ok(!pathMatch('CHANGELOG.md', 'CHANGELOG.md.bak'));
  assert.ok(pathMatch('*.lock', 'pnpm.lock'));
  assert.ok(!pathMatch('docs/', 'src/docs/x'));
});

test('the floor covers every control-plane root', () => {
  for (const root of ['scripts/x.mjs', 'core/y.mjs', '.github/workflows/ci.yml', 'CODEOWNERS', 'profiles/z.json', 'docs/governance/a.json']) {
    assert.ok(FLOOR_DENY.some((p) => pathMatch(p, root)), `floor should cover ${root}`);
  }
});

test('the known routine classes are the closed set', () => {
  assert.deepEqual(ROUTINE_CLASSES, ['dependency-patch', 'lint-fix', 'doc-fix', 'formatting', 'comment-fix']);
});

/* ---- W2: the two check contexts diverge on the same PR (closes F2) ---- */

import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'routine-change-check.mjs');
const runCli = (args, cwd) => spawnSync(process.execPath, [SCRIPT, ...args], { cwd, encoding: 'utf8' });

test('an ordinary PR (no routine claim): normal lane PASSES, routine-qualified FAILS', () => {
  const dir = mkdtempSync(join(tmpdir(), 'rc-')); // no routine-change-claim.json here
  try {
    const normal = runCli(['--base', 'HEAD'], dir);
    assert.equal(normal.status, 0, 'normal-human-review passes an ordinary PR');
    assert.match(normal.stdout, /normal human-merge lane applies/);

    const routine = runCli(['--assert-routine', '--base', 'HEAD'], dir);
    assert.equal(routine.status, 1, 'routine-qualified FAILS an ordinary PR — it cannot enter the queue');
    assert.match(routine.stderr, /NOT routine-qualified/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
