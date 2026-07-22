// Tests for the assurance-cycle gate. Node built-in runner: `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { evaluate, cycleHash, STEPS } from './assurance-cycle-check.mjs';

// A self-contained issuer + registry so the test never depends on the shipped demo key.
const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const ISSUERS = { issuers: [{ id: 'test-signer', mechanism: 'ed25519', verify: { public_key: publicKey.export({ type: 'spki', format: 'pem' }) } }] };
const REGISTRY = { identities: [
  { id: 'risk-lena', kind: 'human', roles: ['risk-second-line'], groups: ['second-line'] },
  { id: 'mrm-aisha', kind: 'human', roles: ['model-validator'], groups: ['second-line'] },
  { id: 'agent-x', kind: 'agent', roles: [], groups: ['builders'] },
] };
const NOW = Date.parse('2026-07-25');

function record(over = {}) {
  const base = {
    cycle_id: 'AC-T-1', ran_at: '2026-07-20T02:00:00Z', trigger: 'schedule',
    steps: Object.fromEntries(STEPS.map((s) => [s, { status: 'pass' }])),
    findings: [{ id: 'F1', severity: 'medium', owner: 'mrm-aisha', due: '2026-08-15', status: 'open' }],
    ...over,
  };
  return base;
}
function signed(rec, { by = 'risk-lena', key = privateKey } = {}) {
  const r = { ...rec };
  r.attestation = { issuer: 'test-signer', confirmed_by: by, signature: sign(null, Buffer.from(cycleHash(rec), 'utf8'), key).toString('base64') };
  return r;
}
const opts = { issuers: ISSUERS, registry: REGISTRY, now: NOW };

test('a complete, signed, second-line-confirmed cycle passes', () => {
  assert.deepEqual(evaluate(signed(record()), opts), []);
});

test('a missing lifecycle step fails — all six run', () => {
  const rec = record();
  delete rec.steps.test;
  assert.ok(evaluate(signed(rec), opts).some((x) => /step "test" is missing/.test(x)));
});

test('an unsigned cycle is not a control', () => {
  assert.ok(evaluate(record(), opts).some((x) => /unsigned — the Confirm step is authenticated authority/.test(x)));
});

test('a tampered record fails signature verification (the sig is over the hash)', () => {
  const rec = signed(record());
  rec.steps.check.status = 'fail'; // change content after signing
  assert.ok(evaluate(rec, opts).some((x) => /does NOT verify/.test(x)));
});

test('an AGENT or a builder cannot confirm the cycle — only a second-line human', () => {
  assert.ok(evaluate(signed(record(), { by: 'agent-x' }), opts).some((x) => /not a second-line human/.test(x)));
});

test('a finding without owner/due/status is not a register; an OPEN overdue finding blocks', () => {
  const bad = record({ findings: [{ id: 'F2', severity: 'high' }] });
  const f = evaluate(signed(bad), opts);
  assert.ok(f.some((x) => /no due date/.test(x)));
  assert.ok(f.some((x) => /status must be open\|resolved\|accepted/.test(x)));
  const overdue = record({ findings: [{ id: 'F3', severity: 'high', owner: 'mrm-aisha', due: '2026-07-01', status: 'open' }] });
  assert.ok(evaluate(signed(overdue), opts).some((x) => /OPEN and overdue/.test(x)));
});

test('a finding owner outside the registry does not count', () => {
  const rec = record({ findings: [{ id: 'F4', severity: 'low', owner: 'Nobody', due: '2026-09-01', status: 'open' }] });
  assert.ok(evaluate(signed(rec), opts).some((x) => /owner "Nobody" is not a registry identity/.test(x)));
});

test('an unregistered signer does not count however valid the signature', () => {
  const { privateKey: rogue } = generateKeyPairSync('ed25519');
  assert.ok(evaluate(signed(record(), { key: rogue }), opts).some((x) => /does NOT verify|not in the allowed-issuers/.test(x)));
});
