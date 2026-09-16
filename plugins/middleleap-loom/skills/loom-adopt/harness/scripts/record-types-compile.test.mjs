// record-types: the NPA pack and its decision are record TYPES like any other — schema and
// pass condition as data, so a provider can judge compliance from the record alone; and adding
// them disturbs none of the gate-family types the catalog derives.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compileTypes } from './record-types-compile.mjs';

test('compiles the npa-pack and npa-approved record types', () => {
  const { types } = compileTypes({ controls: [] }, '{}');
  const pack = types.find((t) => t.name === 'npa-pack');
  const approved = types.find((t) => t.name === 'npa-approved');

  assert.ok(pack, 'npa-pack type is emitted');
  assert.equal(pack.kind, 'npa');
  assert.deepEqual(pack.schema.required, ['proposition_id', 'request_type', 'status']);
  assert.deepEqual(pack.schema.properties.request_type.enum, ['New', 'Amendment', 'Withdrawal']);
  assert.equal(pack.pass.field, 'payload.status');
  assert.deepEqual(pack.pass.in, ['complete']);

  assert.ok(approved, 'npa-approved type is emitted');
  assert.equal(approved.kind, 'npa');
  assert.deepEqual(approved.schema.required, ['proposition_id', 'receipt', 'decision', 'approved_by', 'decided_at']);
  assert.deepEqual(approved.schema.properties.receipt.enum, ['PA1', 'PA2']);
  assert.equal(approved.pass.field, 'payload.decision');
  assert.deepEqual(approved.pass.in, ['approved', 'approved-with-conditions']);
});

test('the npa types carry no catalog controls and do not disturb the gate-family types', () => {
  const catalog = { controls: [{ control_id: 'PA1-01', gate_family: 'PA1' }, { control_id: 'PA2-01', gate_family: 'PA2' }] };
  const { types } = compileTypes(catalog, '{}');
  assert.ok(types.find((t) => t.name === 'loom-gate-pa1'));
  assert.ok(types.find((t) => t.name === 'loom-gate-pa2'));
  const npa = types.filter((t) => t.kind === 'npa');
  assert.equal(npa.length, 2);
  for (const t of npa) assert.deepEqual(t.controls, []);
});

test('every type still has a schema and a pass condition', () => {
  const { types } = compileTypes({ controls: [] }, '{}');
  for (const t of types) {
    assert.equal(typeof t.name, 'string');
    assert.equal(t.schema?.type, 'object', `${t.name} has an object schema`);
    assert.equal(typeof t.pass?.field, 'string', `${t.name} has a pass condition`);
  }
});
