// The assurance-cycle gate (Loom 2.0 §13 — deferred from 1.12, delivered at 2.0-rc).
// Continuous assurance is a six-step lifecycle — Watch → Assess → Check → Test → Evidence →
// Confirm — that re-runs on a schedule and on events. A cycle that leaves no record is a
// meeting, not a control. This gate validates each cycle record under
// docs/governance/assurance-cycles/<cycle-id>.json:
//
//   all six lifecycle steps present, each with a status ·
//   the SIGNED cycle record verifies against a registry issuer (the Confirm step is
//   authenticated human authority, not a checkbox) — signature over the record's canonical
//   hash, real ed25519 (core/attestations.mjs) ·
//   the unresolved-findings register is real: every finding has an owner (resolving to a
//   registry identity), a due date, and a status; an OVERDUE open finding blocks.
//
// The signer must be a HUMAN with second-line authority — an agent runs the cycle and
// prepares the record; a human confirms it. Run from the repo root:
// `node scripts/assurance-cycle-check.mjs`.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import process from 'node:process';
import { loadIssuers, verifySignatureOver } from '../core/attestations.mjs';
import { loadRegistry, identityOf } from './identity-registry-check.mjs';

export const CYCLES_DIR = 'docs/governance/assurance-cycles';
export const STEPS = ['watch', 'assess', 'check', 'test', 'evidence', 'confirm'];
export const STEP_STATUSES = new Set(['pass', 'fail', 'n/a']);

/** Deterministic serialization: keys sorted at EVERY level (not just the top). A flat
 *  key-allowlist replacer would silently drop nested fields — so a tamper deep in `steps`
 *  would not change the hash. This canonicaliser recurses, so the signature covers it all. */
function canonical(v) {
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
  if (v && typeof v === 'object') return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}`;
  return JSON.stringify(v);
}

/** Canonical hash of a cycle record, excluding its own attestation. Deterministic. */
export function cycleHash(record) {
  const { attestation, ...rest } = record;
  return createHash('sha256').update(canonical(rest)).digest('hex');
}

/** Findings for one cycle record. `now` is injectable for tests. */
export function evaluate(record, { issuers, registry, now = Date.now() } = {}) {
  const findings = [];
  const id = record?.cycle_id || '(no cycle_id)';
  if (!record?.cycle_id) findings.push('cycle record has no cycle_id');
  if (!(typeof record?.ran_at === 'string' && record.ran_at.trim())) findings.push(`${id}: no ran_at timestamp`);
  if (!['schedule', 'event'].includes(record?.trigger)) findings.push(`${id}: trigger must be schedule|event (got ${JSON.stringify(record?.trigger)})`);

  // Every lifecycle step present and resolved.
  const steps = record?.steps || {};
  for (const s of STEPS) {
    if (!steps[s]) findings.push(`${id}: lifecycle step ${JSON.stringify(s)} is missing — an assurance cycle runs all six steps`);
    else if (!STEP_STATUSES.has(steps[s].status)) findings.push(`${id}: step ${s} status must be pass|fail|n/a (got ${JSON.stringify(steps[s].status)})`);
  }

  // Unresolved-findings register: owned, dated, statused; overdue-open blocks.
  for (const f of record?.findings || []) {
    const label = `${id}: finding ${f.id || '(unnamed)'}`;
    if (registry && !identityOf(registry, f.owner)) findings.push(`${label} — owner ${JSON.stringify(f.owner)} is not a registry identity`);
    else if (!f.owner) findings.push(`${label} — no owner`);
    if (!f.due) findings.push(`${label} — no due date`);
    if (!['open', 'resolved', 'accepted'].includes(f.status)) findings.push(`${label} — status must be open|resolved|accepted (got ${JSON.stringify(f.status)})`);
    if (f.status === 'open' && f.due && !Number.isNaN(Date.parse(f.due)) && Date.parse(f.due) < now) {
      findings.push(`${label} — OPEN and overdue (${f.due}): an unresolved assurance finding past its due date blocks`);
    }
  }

  // The record is signed, verifies, and the signer is a second-line human (Confirm authority).
  const att = record?.attestation;
  if (!att) findings.push(`${id}: cycle record is unsigned — the Confirm step is authenticated authority, not a checkbox`);
  else {
    findings.push(...verifySignatureOver(cycleHash(record), att, issuers, `cycle ${id}`).map((f) => `${id}: ${f}`));
    if (registry) {
      const who = identityOf(registry, att.confirmed_by);
      if (!who || who.kind === 'agent' || !(who.groups || []).includes('second-line')) {
        findings.push(`${id}: confirmed_by ${JSON.stringify(att.confirmed_by)} is not a second-line human — an agent prepares the cycle, a human confirms it`);
      }
    }
  }
  return findings;
}

const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };

export function run(cwd = process.cwd()) {
  const dir = `${cwd}/${CYCLES_DIR}`;
  if (!existsSync(dir)) return { findings: [], count: 0 }; // no cycles recorded yet — assurance may not have run
  const issuers = loadIssuers(cwd);
  const registry = loadRegistry(cwd);
  const findings = [];
  let count = 0;
  for (const name of readdirSync(dir).filter((n) => n.endsWith('.json'))) {
    count++;
    const record = readJson(`${dir}/${name}`);
    if (!record) { findings.push(`${name}: not parseable JSON`); continue; }
    findings.push(...evaluate(record, { issuers, registry }));
  }
  return { findings, count };
}

// CLI (skipped when imported by the test suite).
if (import.meta.url === `file://${process.argv[1]}`) {
  const { findings, count } = run();
  if (findings.length) {
    process.stderr.write('\nAssurance-cycle gate — FAIL\n\n');
    for (const f of findings) process.stderr.write(`  - ${f}\n`);
    process.stderr.write('\nEach assurance cycle produces a signed record with an unresolved-findings register;\nan agent prepares it, a second-line human confirms it. See ../loom/references/continuous-assurance.md.\n');
    process.exit(1);
  }
  process.stdout.write(`Assurance-cycle gate — OK (${count} cycle${count === 1 ? '' : 's'})\n`);
}
