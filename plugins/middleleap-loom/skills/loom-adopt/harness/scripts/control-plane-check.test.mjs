// Tests for the control-plane integrity gate. Node built-in runner: `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, ownersFor, ruleMatches, parseCodeowners, CONTROL_TARGETS } from './control-plane-check.mjs';

const TARGETS = [
  '.claude/hooks/pii-guard.sh',
  '.claude/settings.json',
  'discovery/gates/validate.mjs',
  '.github/workflows/ci.yml',
  'CODEOWNERS',
];

test('a global owner rule protects every control target', () => {
  const findings = evaluate('* @org/platform-admins\n', TARGETS);
  assert.deepEqual(findings, []);
});

test('specific per-area rules with owners protect their targets', () => {
  const co = [
    '/.claude/ @org/platform',
    '/discovery/gates/ @org/platform',
    '/.github/workflows/ @org/platform',
    '/CODEOWNERS @org/platform',
  ].join('\n');
  assert.deepEqual(evaluate(co, TARGETS), []);
});

test('a control target with no matching rule is reported', () => {
  // Owns everything EXCEPT the workflows directory.
  const co = ['/.claude/ @org/p', '/discovery/ @org/p', '/CODEOWNERS @org/p'].join('\n');
  const findings = evaluate(co, TARGETS);
  assert.equal(findings.length, 1);
  assert.match(findings[0], /\.github\/workflows\/ci\.yml/);
});

test('a later zero-owner rule un-owns a control target (last-match-wins)', () => {
  // Global owner, then a bare pattern that removes ownership of the gates dir.
  const co = ['* @org/platform', '/discovery/gates/'].join('\n');
  const findings = evaluate(co, TARGETS);
  assert.equal(findings.length, 1);
  assert.match(findings[0], /discovery\/gates\/validate\.mjs/);
});

test('an empty CODEOWNERS leaves every target unprotected', () => {
  assert.equal(evaluate('', TARGETS).length, TARGETS.length);
});

test('comments and blank lines are ignored', () => {
  const co = '# platform owns the control plane\n\n*   @org/platform  \n';
  assert.deepEqual(evaluate(co, TARGETS), []);
});

test('extension globs match by basename', () => {
  const rules = parseCodeowners('*.sh @org/sec\n');
  assert.deepEqual(ownersFor(rules, '.claude/hooks/pii-guard.sh'), ['@org/sec']);
  assert.deepEqual(ownersFor(rules, '.claude/settings.json'), []);
});

test('ruleMatches handles global, anchored dir, and exact forms', () => {
  assert.equal(ruleMatches('*', 'anything/at/all'), true);
  assert.equal(ruleMatches('/discovery/gates/', 'discovery/gates/validate.mjs'), true);
  assert.equal(ruleMatches('/discovery/gates/**', 'discovery/gates/validate.mjs'), true);
  assert.equal(ruleMatches('/CODEOWNERS', 'CODEOWNERS'), true);
  assert.equal(ruleMatches('/discovery/gates/', 'discovery/render/x.mjs'), false);
});

test('a placeholder-only owner fails the gate (an unadopted template is not a control)', () => {
  const findings = evaluate('* @your-org/platform-admins\n', TARGETS);
  assert.equal(findings.length, TARGETS.length);
  assert.match(findings[0], /placeholder team @your-org\/platform-admins/);
});

test('a real owner alongside a placeholder still protects the target', () => {
  assert.deepEqual(evaluate('* @your-org/platform-admins @acme-bank/platform\n', TARGETS), []);
});

test('the shipped default control-target list is non-empty and self-protecting', () => {
  assert.ok(CONTROL_TARGETS.length > 0);
  assert.ok(CONTROL_TARGETS.includes('CODEOWNERS'));
  assert.ok(CONTROL_TARGETS.includes('scripts/control-plane-check.mjs'));
});
