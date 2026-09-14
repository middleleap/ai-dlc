// Tests for the demo-scoped payment-status integrity gate. The two shipped contract states are the
// fixtures: the first cut must be REFUSED for the two reasons the demo narrates, the repaired one
// must pass, and the evidence binding must hold (digest, cases, results).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { evaluate, check, REQUIRED_CASES, BOUNDARY } from './payment-status-check.mjs';

// The fixtures sit beside this file in demo/meridian/; when the demo copies the test into an
// adopted tree's scripts/, PAYMENT_STATUS_FIXTURES points back at them.
const H = process.env.PAYMENT_STATUS_FIXTURES || dirname(fileURLToPath(import.meta.url));
const load = (n) => JSON.parse(readFileSync(join(H, n), 'utf8'));
const evidence = readFileSync(join(H, 'payment-status-tests.json'));
const withEvidence = { readEvidence: (ref) => (ref.endsWith('payment-status-tests.json') ? evidence : null) };

test('the first cut is refused: timeout reported as failed, automatic retry', () => {
  const { findings, notices } = evaluate(load('status-contract.first-cut.json'), withEvidence);
  assert.ok(findings.some((f) => f.startsWith('PSI-R02')), findings.join('\n'));
  assert.ok(findings.some((f) => f.startsWith('PSI-R04') && /automatic/.test(f)));
  assert.ok(findings.some((f) => f.startsWith('PSI-R04') && /status_query_before_retry/.test(f)));
  assert.ok(!findings.some((f) => f.startsWith('PSI-R03')), 'the first cut does preserve the reference');
  assert.deepEqual(notices, [BOUNDARY]);
});

test('the recorded agent run\'s output passes, matches its recorded digest, and the boundary notice still prints', () => {
  const run = load('agent-run/run.json');
  const bytes = readFileSync(join(H, run.output.ref));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), run.output.sha256, 'agent output edited since the run was recorded');
  const { findings, notices } = evaluate(JSON.parse(bytes.toString('utf8')), withEvidence);
  assert.deepEqual(findings, []);
  assert.deepEqual(notices, [BOUNDARY]);
});

test('the evidence binding: a changed digest, a missing case, a failed case, a missing file', () => {
  const good = JSON.parse(readFileSync(join(H, load('agent-run/run.json').output.ref), 'utf8'));
  let r = evaluate({ ...good, negative_test: { ...good.negative_test, sha256: 'ab'.repeat(32) } }, withEvidence);
  assert.ok(r.findings.some((f) => /does not match the cited sha256/.test(f)));
  const ev = JSON.parse(evidence.toString());
  const dropped = Buffer.from(JSON.stringify({ ...ev, cases: ev.cases.filter((c) => c.id !== REQUIRED_CASES[2]) }));
  r = evaluate(good, { readEvidence: () => dropped });
  assert.ok(r.findings.some((f) => /no case retry-blocked-until-status-known/.test(f)));
  const failed = Buffer.from(JSON.stringify({ ...ev, cases: ev.cases.map((c) => ({ ...c, result: c.id === 'reference-preserved' ? 'fail' : c.result })) }));
  r = evaluate(good, { readEvidence: () => failed });
  assert.ok(r.findings.some((f) => /reference-preserved is "fail"/.test(f)));
  r = evaluate(good, { readEvidence: () => null });
  assert.ok(r.findings.some((f) => /not found/.test(f)));
});

test('shape: no obligation id, no timeout block, no negative test', () => {
  const { findings } = evaluate({ service_id: 'x', obligation_ids: [], timeout: null });
  assert.ok(findings.some((f) => /cites no obligation id/.test(f)));
  assert.ok(findings.some((f) => /declares no timeout block/.test(f)));
  assert.ok(findings.some((f) => /no negative_test evidence/.test(f)));
});

test('check() reads from the tree and reports a missing contract as a finding', () => {
  const r = check(H, { contract: 'does-not-exist.json' });
  assert.equal(r.examined, 0);
  assert.ok(r.findings[0].startsWith('PSI-R01'));
});
