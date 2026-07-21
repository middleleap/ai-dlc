// The loop-closing gate — Run/Operations → Discovery. The double diamond builds the thing; a
// regulated system also runs, and Run produces signals (incidents, SLO breaches, drift, CVEs,
// regulatory change, materialised risk) that must feed back — not fall on the floor. Discovery
// is evidence-gated (D2: every claim traces to a logged signal), so an operational signal is
// just a signal that originated in production. This gate enforces the feedback wire over an
// operations-signal log:
//
//   Every signal must be TRIAGED (routed) and TRACEABLE (the route resolves to real follow-up).
//
// Routes and what each must trace to:
//   - spec-fix   → a delivery follow-up (link a PR / spec-change)      — stays in Delivery
//   - register   → a data-risk register update (cite a DR-* risk)      — Continuous Assurance
//   - discovery  → a discovery run (link its slug), or status:triaging — re-enters Discovery
//   - accepted   → a stated justification (a conscious no-op)          — closed with a reason
//
// An empty log is valid (operations may not have started). A signal with no route is the
// failure this gate exists to prevent. Run from repo root:
//   `node scripts/operations-signal-check.mjs` (exit 1 on any finding).
import { existsSync, readFileSync } from 'node:fs';
import process from 'node:process';

const MANIFEST_LOCATIONS = ['docs/governance/operations-signal.json', 'operations-signal.json'];

// ADOPT: the operational signal taxonomy and how each routes back into the loop.
export const TYPES = new Set(['incident', 'slo-breach', 'drift', 'cve', 'regulatory', 'near-miss', 'customer-signal', 'risk-materialised']);
export const SEVERITIES = new Set(['low', 'medium', 'high', 'critical']);
export const ROUTES = new Set(['spec-fix', 'register', 'discovery', 'accepted']);

const nonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;

/** Findings (one per untriaged/untraceable signal). Empty ⇒ every signal is routed and traceable. */
export function evaluate(manifest) {
  const signals = manifest && manifest.signals;
  if (!Array.isArray(signals)) return ['operations-signal manifest has no `signals` array'];
  if (signals.length === 0) return []; // an empty operations log is valid

  const findings = [];
  for (const s of signals) {
    const id = (s && s.id) || '(unnamed signal)';
    if (!TYPES.has(s.type)) { findings.push(`${id}: type must be one of ${[...TYPES].join('|')} (got ${JSON.stringify(s.type)})`); }
    if (!SEVERITIES.has(s.severity)) { findings.push(`${id}: severity must be low|medium|high|critical (got ${JSON.stringify(s.severity)})`); }
    // high/critical signals must carry evidence so a reviewer can reconstruct them.
    if ((s.severity === 'high' || s.severity === 'critical') && !nonEmpty(s.evidence_ref)) {
      findings.push(`${id}: ${s.severity} signal needs an evidence_ref`);
    }
    if (!ROUTES.has(s.route)) {
      findings.push(`${id}: not triaged — route must be spec-fix|register|discovery|accepted (got ${JSON.stringify(s.route)}); a signal must not fall on the floor`);
      continue; // route drives the traceability checks
    }
    switch (s.route) {
      case 'discovery':
        if (!nonEmpty(s.link) && s.status !== 'triaging') {
          findings.push(`${id}: routed to discovery but links no run and is not status:triaging — the Run→Discovery edge is broken`);
        }
        break;
      case 'register':
        if (!/^DR-/.test(String(s.link || ''))) findings.push(`${id}: routed to register but does not cite a DR-* risk in link`);
        break;
      case 'spec-fix':
        if (!nonEmpty(s.link)) findings.push(`${id}: routed to spec-fix but links no PR / spec-change`);
        break;
      case 'accepted':
        if (!nonEmpty(s.justification)) findings.push(`${id}: accepted (no action) needs a justification`);
        break;
    }
  }
  return findings;
}

function run(cwd = process.cwd()) {
  const path = MANIFEST_LOCATIONS.map((p) => `${cwd}/${p}`).find(existsSync);
  if (!path) return []; // operations not yet wired — the feedback seam is optional until Run begins
  let manifest;
  try { manifest = JSON.parse(readFileSync(path, 'utf8')); }
  catch (e) { return [`operations-signal manifest is not valid JSON: ${e.message}`]; }
  return evaluate(manifest);
}

// CLI (skipped when imported by the test suite).
if (import.meta.url === `file://${process.argv[1]}`) {
  const findings = run();
  if (findings.length) {
    process.stderr.write('\nOperations → Discovery feedback gate — FAIL\n\n');
    for (const f of findings) process.stderr.write(`  - ${f}\n`);
    process.stderr.write('\nEvery operational signal must be triaged and traceable, so Run feeds back into\nthe loop. See ../loom/references/operations.md.\n');
    process.exit(1);
  }
  process.stdout.write('Operations → Discovery feedback gate — OK\n');
}
