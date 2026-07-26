// Tests for the guardrail-policy gate (rc.13 · WS4): policy honesty + hostile scenarios driven
// through the real Claude Code adapters. Node runner: `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluate } from './guardrail-policy-check.mjs';

const HARNESS = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const allExist = () => true;
// The hooks live at hooks/ in the bundle and .claude/hooks/ in an adopted repo — resolve either.
const HOOKS_DIR = ['.claude/hooks', 'hooks'].map((d) => join(HARNESS, d)).find((d) => existsSync(join(d, 'pii-guard.sh')));
// A policy mechanism resolves in either layout (.claude/hooks/foo.sh ↔ hooks/foo.sh; scripts/… as-is).
const mechExists = (m) => [m, m.replace(/^\.claude\/hooks\//, 'hooks/')].some((x) => existsSync(join(HARNESS, x)));

const guardrail = (over = {}) => ({
  id: 'g1', event: 'before-file-write', decision: 'block', description: 'x',
  coverage: { 'claude-code': { state: 'enforced', mechanism: 'hooks/x.sh' }, ci: { state: 'uncovered' } },
  ...over,
});
const policy = (guardrails) => ({ schema_version: '1.0', runtimes: ['claude-code', 'ci'], events: ['before-file-write', 'before-test-modification'], guardrails });

test('a well-formed, honest policy passes', () => {
  assert.deepEqual(evaluate(policy([guardrail()]), allExist), []);
});

test('an enforced state naming a NON-existent mechanism fails — no implied coverage', () => {
  const f = evaluate(policy([guardrail()]), (m) => m !== 'hooks/x.sh');
  assert.ok(f.some((x) => /does not exist — no implied coverage/.test(x)));
});

test('an uncovered state that names a mechanism fails — no implied protection', () => {
  const g = guardrail({ coverage: { 'claude-code': { state: 'uncovered', mechanism: 'hooks/x.sh' }, ci: { state: 'uncovered' } } });
  assert.ok(evaluate(policy([g]), allExist).some((x) => /uncovered but names a mechanism/.test(x)));
});

test('a blocking guardrail enforced NOWHERE without known_gap fails — no silent gap', () => {
  const g = guardrail({ coverage: { 'claude-code': { state: 'uncovered' }, ci: { state: 'uncovered' } } });
  assert.ok(evaluate(policy([g]), allExist).some((x) => /set known_gap:true to acknowledge/.test(x)));
});

test('a blocking guardrail enforced nowhere WITH known_gap:true is accepted (acknowledged)', () => {
  const g = guardrail({ known_gap: true, coverage: { 'claude-code': { state: 'uncovered' }, ci: { state: 'uncovered' } } });
  assert.deepEqual(evaluate(policy([g]), allExist), []);
});

test('a runtime with no coverage stated fails — every runtime must be declared', () => {
  const g = guardrail({ coverage: { 'claude-code': { state: 'enforced', mechanism: 'hooks/x.sh' } } });
  assert.ok(evaluate(policy([g]), allExist).some((x) => /no coverage declared for runtime "ci"/.test(x)));
});

// The SHIPPED policy must be well-formed and honest, resolving mechanisms in the bundle layout
// (.claude/hooks/foo.sh → hooks/foo.sh).
test('the shipped guardrail policy is honest — every claimed mechanism exists', () => {
  const p = JSON.parse(readFileSync(join(HARNESS, 'guardrails/guardrail-policy.json'), 'utf8'));
  assert.deepEqual(evaluate(p, mechExists), []);
});

// ---- Hostile scenarios through the claude-code adapter (prove `enforced` is REAL) ----
// Skip cleanly in a bare layout with no hooks (same pattern as the attestation/register tests).
const runHook = (script, input, opts = {}) =>
  spawnSync('bash', [join(HOOKS_DIR, script)], { input: JSON.stringify(input), encoding: 'utf8', ...opts }).stdout || '';

test('hostile: a PII-shaped literal is DENIED by the claude-code pii-guard adapter', { skip: !HOOKS_DIR }, () => {
  const out = runHook('pii-guard.sh', { tool_input: { content: 'Emirates ID 784-1990-1234567-1' } });
  assert.match(out, /"permissionDecision":\s*"deny"/);
});

test('hostile: a synthetic (999-prefixed) id is ALLOWED — the guard is not a blunt block', { skip: !HOOKS_DIR }, () => {
  const out = runHook('pii-guard.sh', { tool_input: { content: 'synthetic 999-1990-1234567-1' } });
  assert.doesNotMatch(out, /"permissionDecision":\s*"deny"/);
});

test('hostile: a test-weakening edit is DENIED by the claude-code test-tripwire adapter', { skip: !HOOKS_DIR }, () => {
  // test-tripwire only fires on a spec/test path inside a feature/claude branch.
  const repo = mkdtempSync(join(tmpdir(), 'gr-'));
  try {
    execFileSync('git', ['init', '-q', '-b', 'claude/test'], { cwd: repo });
    const out = runHook('test-tripwire.sh',
      { tool_input: { file_path: 'tests/foo.spec.ts', new_string: 'it.skip("x", () => {})' } },
      { env: { ...process.env, CLAUDE_PROJECT_DIR: repo } });
    assert.match(out, /"permissionDecision":\s*"deny"/);
  } finally { rmSync(repo, { recursive: true, force: true }); }
});

test('the ci-backstop mechanism for every guardrail exists (the enforcement of record is real)', () => {
  const p = JSON.parse(readFileSync(join(HARNESS, 'guardrails/guardrail-policy.json'), 'utf8'));
  for (const g of p.guardrails) {
    for (const [rt, c] of Object.entries(g.coverage)) {
      if (c.state === 'ci-backstop') assert.ok(existsSync(join(HARNESS, c.mechanism)), `${g.id}/${rt} backstop ${c.mechanism} must exist`);
    }
  }
});
