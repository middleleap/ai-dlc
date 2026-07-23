// Tests for compiled-requirements aggregation. Node built-in runner: `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { aggregateRequirements, requiredBy } from './compiled-requirements.mjs';

// Build a tmp repo with N governed changes, each {id, state, gates, evidence}.
function repo(changes) {
  const dir = mkdtempSync(join(tmpdir(), 'cr-'));
  for (const c of changes) {
    const base = join(dir, 'docs/governance/changes', c.id);
    mkdirSync(base, { recursive: true });
    writeFileSync(join(base, 'change-envelope.json'), JSON.stringify({ change_id: c.id, current_state: c.state || 'in-delivery', control_plan: 'control-plan.json' }));
    writeFileSync(join(base, 'control-plan.json'), JSON.stringify({ required_gates: c.gates || [], required_evidence: c.evidence || [] }));
  }
  return dir;
}

test('with no changes dir, requirements are empty', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cr-'));
  try {
    const agg = aggregateRequirements(dir);
    assert.equal(agg.families.size, 0);
    assert.equal(agg.evidence.size, 0);
    assert.equal(agg.anyInProduction, false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('families and evidence are the UNION across changes', () => {
  const dir = repo([
    { id: 'CHG-1', gates: ['D', 'Q'], evidence: ['tests'] },
    { id: 'CHG-2', gates: ['A', 'product-eval'], evidence: ['sast', 'product-eval'] },
  ]);
  try {
    const agg = aggregateRequirements(dir);
    assert.deepEqual([...agg.families].sort(), ['A', 'D', 'Q', 'product-eval']);
    assert.deepEqual([...agg.evidence].sort(), ['product-eval', 'sast', 'tests']);
    assert.deepEqual(requiredBy(agg, 'product-eval'), ['CHG-2']);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('anyInProduction flips when a change holds a production state', () => {
  const inProd = repo([{ id: 'CHG-9', state: 'in-production', gates: ['D'] }]);
  const notProd = repo([{ id: 'CHG-9', state: 'in-delivery', gates: ['D'] }]);
  try {
    assert.equal(aggregateRequirements(inProd).anyInProduction, true);
    assert.equal(aggregateRequirements(notProd).anyInProduction, false);
  } finally { rmSync(inProd, { recursive: true, force: true }); rmSync(notProd, { recursive: true, force: true }); }
});

test('a change with no plan contributes nothing — it never lowers a requirement', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cr-'));
  try {
    const base = join(dir, 'docs/governance/changes/CHG-X');
    mkdirSync(base, { recursive: true });
    writeFileSync(join(base, 'change-envelope.json'), JSON.stringify({ change_id: 'CHG-X', control_plan: 'control-plan.json' }));
    // no control-plan.json written
    const agg = aggregateRequirements(dir);
    assert.equal(agg.families.size, 0);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
