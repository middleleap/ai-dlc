// W1 — mandatory-when-compiled: a capability optional for a generic repo becomes REQUIRED
// once a compiled plan asks for it, and its absence then fails (closes F3). Node `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run as productEvalRun } from './product-eval-check.mjs';
import { run as decisionLogRun } from './decision-log-check.mjs';
import { run as assuranceCycleRun } from './assurance-cycle-check.mjs';

// A tmp repo with one governed change whose compiled plan requires `families`.
function repoRequiring(families, state = 'in-delivery') {
  const dir = mkdtempSync(join(tmpdir(), 'mwc-'));
  const base = join(dir, 'docs/governance/changes/CHG-1');
  mkdirSync(base, { recursive: true });
  writeFileSync(join(base, 'change-envelope.json'), JSON.stringify({ change_id: 'CHG-1', current_state: state, control_plan: 'control-plan.json' }));
  writeFileSync(join(base, 'control-plan.json'), JSON.stringify({ required_gates: families, required_evidence: [] }));
  return dir;
}
const clean = (d) => rmSync(d, { recursive: true, force: true });

test('product-eval: absent is OK with no requirement, FAILS when a plan requires it', () => {
  const generic = mkdtempSync(join(tmpdir(), 'mwc-'));
  try { assert.deepEqual(productEvalRun(generic).findings, []); } finally { clean(generic); }
  const req = repoRequiring(['product-eval']);
  try {
    const { findings } = productEvalRun(req);
    assert.ok(findings.some((f) => /a compiled plan requires product evals \[CHG-1\]/.test(f)));
  } finally { clean(req); }
});

test('decision-log: absent is OK with no requirement, FAILS when a plan requires it', () => {
  const generic = mkdtempSync(join(tmpdir(), 'mwc-'));
  try { assert.deepEqual(decisionLogRun(generic), []); } finally { clean(generic); }
  const req = repoRequiring(['decision-log']);
  try {
    assert.ok(decisionLogRun(req).some((f) => /a compiled plan requires one \[CHG-1\]/.test(f)));
  } finally { clean(req); }
});

test('assurance-cycle: absent FAILS when a plan requires cadence, or anything is in production', () => {
  const generic = mkdtempSync(join(tmpdir(), 'mwc-'));
  try { assert.deepEqual(assuranceCycleRun(generic).findings, []); } finally { clean(generic); }
  const req = repoRequiring(['assurance-cadence']);
  try {
    assert.ok(assuranceCycleRun(req).findings.some((f) => /requires assurance cadence \[CHG-1\]/.test(f)));
  } finally { clean(req); }
  const prod = repoRequiring([], 'in-production');
  try {
    assert.ok(assuranceCycleRun(prod).findings.some((f) => /in production — silence is not assurance/.test(f)));
  } finally { clean(prod); }
});
