// The operational-readiness gate — R1–R6 (Loom 2.0 §7.4). Build-time green says nothing
// about run-the-bank readiness: an untested rollback, an expired DR exercise, or a
// kill-switch nobody has flipped is a production incident on a timer. This gate validates
// docs/governance/services/<service-id>.json:
//
//   R1 criticality + ownership + on-call · R2 continuity (RTO/RPO, BCP/DR exercised) ·
//   R3 rollback drilled + kill-switch tested — WITH FRESHNESS WINDOWS (a drill from two
//   years ago is history, not readiness) · R4 capacity/stress evidence · R5 third-party
//   continuity + exit for critical services · R6 reconciliation, failed-transaction
//   recovery, complaints readiness, regulatory-notification triggers.
//
// Freshness is checkable; the TRUTH of a drill is an attestation — state it honestly. The
// shipped template FAILS until adopted (its dates are ADOPT placeholders), like the
// CODEOWNERS template: a copied-but-never-exercised readiness file must not read green.
//
// Run from the repo root: `node scripts/operational-readiness-check.mjs`.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export const SERVICES_DIR = 'docs/governance/services';
export const CRITICALITIES = ['critical', 'important', 'standard'];
// ADOPT: your freshness policy (days). An exercise older than its window blocks production.
export const WINDOWS = { bcp_dr: 365, rollback: 180, kill_switch: 90, capacity: 365 };

const DAY = 24 * 60 * 60 * 1000;

function fresh(findings, label, dateStr, windowDays, now) {
  if (!(typeof dateStr === 'string' && dateStr.trim())) { findings.push(`${label}: no date recorded — unexercised is not ready`); return; }
  const t = Date.parse(dateStr);
  if (Number.isNaN(t)) { findings.push(`${label}: ${JSON.stringify(dateStr)} is not a date (unadopted template?)`); return; }
  const age = Math.floor((now - t) / DAY);
  if (age > windowDays) findings.push(`${label}: last exercised ${dateStr} — ${age}d ago exceeds the ${windowDays}d freshness window (STALE)`);
}

/** Findings for one service-readiness artifact. Empty ⇒ the service is production-ready on paper AND exercised. */
export function evaluate(r, now = Date.now()) {
  const findings = [];
  const id = r?.service_id || '(no service_id)';
  if (!r?.service_id) findings.push('service readiness has no service_id');

  // R1 — criticality, ownership, escalation.
  if (!CRITICALITIES.includes(r?.criticality)) findings.push(`${id}: criticality must be ${CRITICALITIES.join('|')} (got ${JSON.stringify(r?.criticality)})`);
  for (const f of ['owner', 'on_call']) {
    if (!(typeof r?.[f] === 'string' && r[f].trim())) findings.push(`${id}: no ${f} — a service nobody owns pages nobody`);
  }

  // R2 — continuity.
  for (const f of ['rto_minutes', 'rpo_minutes']) {
    if (!(Number.isFinite(r?.[f]) && r[f] >= 0)) findings.push(`${id}: ${f} must be a number — disruption tolerance is a commitment, not a vibe`);
  }
  if (!r?.bcp_dr?.plan_ref) findings.push(`${id}: no BCP/DR plan_ref`);
  fresh(findings, `${id}: BCP/DR exercise`, r?.bcp_dr?.last_exercised, WINDOWS.bcp_dr, now);

  // R3 — rollback + kill-switch, drilled and fresh.
  if (!r?.rollback?.procedure_ref) findings.push(`${id}: no rollback procedure_ref`);
  fresh(findings, `${id}: rollback drill`, r?.rollback?.last_drilled, WINDOWS.rollback, now);
  if (!(typeof r?.kill_switch?.owner === 'string' && r.kill_switch.owner.trim())) findings.push(`${id}: kill-switch has no owner`);
  fresh(findings, `${id}: kill-switch test`, r?.kill_switch?.last_tested, WINDOWS.kill_switch, now);

  // R4 — capacity.
  if (!r?.capacity?.stress_test_ref) findings.push(`${id}: no capacity/stress test reference`);
  fresh(findings, `${id}: capacity test`, r?.capacity?.last_run, WINDOWS.capacity, now);

  // R5 — third-party continuity (critical services must be able to leave).
  if (r?.criticality === 'critical') {
    const deps = r?.third_parties;
    if (!Array.isArray(deps)) findings.push(`${id}: critical service declares no third_parties array (empty is a valid declaration)`);
    else deps.forEach((d, i) => {
      for (const f of ['name', 'continuity', 'exit_strategy']) {
        if (!(typeof d?.[f] === 'string' && d[f].trim())) findings.push(`${id}: third_parties[${i}] missing ${f} — a critical dependency without an exit is a trap`);
      }
    });
  }

  // R6 — customer + financial integrity on the way down.
  for (const f of ['reconciliation', 'failed_transaction_recovery', 'complaints_readiness', 'regulatory_notification_triggers']) {
    if (!(typeof r?.[f] === 'string' && r[f].trim())) findings.push(`${id}: no ${f}`);
  }
  return findings;
}

const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };

export function run(cwd = process.cwd()) {
  const dir = `${cwd}/${SERVICES_DIR}`;
  if (!existsSync(dir)) return { findings: [], count: 0 }; // no services declared yet — the envelope gate demands them at production states
  const findings = [];
  let count = 0;
  for (const name of readdirSync(dir).filter((n) => n.endsWith('.json'))) {
    count++;
    const r = readJson(`${dir}/${name}`);
    if (!r) { findings.push(`${name}: not parseable JSON`); continue; }
    findings.push(...evaluate(r));
  }
  return { findings, count };
}

// CLI (skipped when imported by the test suite).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { findings, count } = run();
  if (findings.length) {
    process.stderr.write('\nOperational-readiness gate (R1–R6) — FAIL\n\n');
    for (const f of findings) process.stderr.write(`  - ${f}\n`);
    process.stderr.write('\nAn expired DR exercise, an undrilled rollback, or an untested kill-switch blocks\nproduction. Freshness is checkable; the truth of a drill is your attestation.\n');
    process.exit(1);
  }
  process.stdout.write(`Operational-readiness gate — OK (${count} service${count === 1 ? '' : 's'})\n`);
}
