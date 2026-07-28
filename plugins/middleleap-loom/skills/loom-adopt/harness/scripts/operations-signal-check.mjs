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
// rc.37 (flow-plan Phase 3.3) — TWO OPTIONAL FIELDS THAT MAKE RUN MEASURABLE. Change-failure
// rate and MTTR are not derivable from a log that never says which change caused a signal or
// when the signal stopped:
//
//   caused_by_change  the change_id this signal is attributed to. Optional — most signals are
//                     not attributable — but when present it must RESOLVE to a governed change
//                     under docs/governance/changes/. A link to a change that does not exist is
//                     a citation of a ghost, which is the failure mode the whole traceability
//                     chain exists to refuse.
//   resolved_at       when the signal was closed out. Optional (an open signal has none), and
//                     when present it must be a real timestamp at or after `detected` — a signal
//                     that resolved before it was detected is a typo that would silently poison
//                     every MTTR figure computed from it.
//
// Neither field gates anything on its VALUE: scripts/flow-report.mjs reads them, and telemetry
// never blocks a merge. What this gate refuses is a malformed or unresolvable link.
//
// An empty log is valid (operations may not have started). A signal with no route is the
// failure this gate exists to prevent. Run from repo root:
//   `node scripts/operations-signal-check.mjs` (exit 1 on any finding).
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const MANIFEST_LOCATIONS = ['docs/governance/operations-signal.json', 'operations-signal.json'];

// ADOPT: the operational signal taxonomy and how each routes back into the loop.
export const TYPES = new Set(['incident', 'slo-breach', 'drift', 'cve', 'regulatory', 'near-miss', 'customer-signal', 'risk-materialised']);
export const SEVERITIES = new Set(['low', 'medium', 'high', 'critical']);
export const ROUTES = new Set(['spec-fix', 'register', 'discovery', 'accepted']);

const nonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;

/**
 * Findings (one per untriaged/untraceable signal). Empty ⇒ every signal is routed and traceable.
 * `inProduction`: true once any governed change holds a production state — from that moment an
 * EMPTY log is itself a finding (1.12): a live product that has never produced one incident,
 * complaint, drift or SLO measurement means the sensing is missing, not that Run is perfect.
 */
export function evaluate(manifest, { inProduction = false, changeIds = null, notices = null } = {}) {
  const signals = manifest && manifest.signals;
  if (!Array.isArray(signals)) return ['operations-signal manifest has no `signals` array'];
  if (signals.length === 0) {
    return inProduction
      ? ['operations log is EMPTY while a governed change is in production — silence after launch means the sensing is unwired, not that nothing happened']
      : []; // an empty operations log is valid before anything runs
  }

  const findings = [];
  for (const s of signals) {
    const id = (s && s.id) || '(unnamed signal)';
    if (!TYPES.has(s.type)) { findings.push(`${id}: type must be one of ${[...TYPES].join('|')} (got ${JSON.stringify(s.type)})`); }
    if (!SEVERITIES.has(s.severity)) { findings.push(`${id}: severity must be low|medium|high|critical (got ${JSON.stringify(s.severity)})`); }
    // high/critical signals must carry evidence so a reviewer can reconstruct them.
    if ((s.severity === 'high' || s.severity === 'critical') && !nonEmpty(s.evidence_ref)) {
      findings.push(`${id}: ${s.severity} signal needs an evidence_ref`);
    }
    // rc.37 — the two flow fields. Optional; malformed or unresolvable is a finding.
    if (s.caused_by_change !== undefined) {
      if (!nonEmpty(s.caused_by_change)) {
        findings.push(`${id}: caused_by_change must be a change_id string (got ${JSON.stringify(s.caused_by_change)})`);
      } else if (changeIds instanceof Set) {
        if (!changeIds.has(s.caused_by_change)) {
          findings.push(`${id}: caused_by_change ${JSON.stringify(s.caused_by_change)} does not resolve to a governed change under docs/governance/changes/ — a signal cannot be attributed to a change that does not exist`);
        }
      } else {
        // No governed-change tree to resolve against: say so rather than pass quietly. The
        // attribution is unverified, which is a different thing from verified-good.
        notices?.push(`${id}: caused_by_change ${JSON.stringify(s.caused_by_change)} NOT verified — no docs/governance/changes/ tree here to resolve it against`);
      }
    }
    if (s.resolved_at !== undefined) {
      const r = Date.parse(s.resolved_at);
      if (Number.isNaN(r)) findings.push(`${id}: resolved_at ${JSON.stringify(s.resolved_at)} is not a timestamp — an unparseable resolution time makes MTTR fiction`);
      else {
        const d = Date.parse(s.detected);
        if (!Number.isNaN(d) && r < d) findings.push(`${id}: resolved_at ${s.resolved_at} precedes detected ${s.detected} — a signal cannot close before it opens`);
      }
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

/** True once any governed change under docs/governance/changes/ holds a production state. */
export function anyChangeInProduction(cwd = process.cwd()) {
  const dir = `${cwd}/docs/governance/changes`;
  if (!existsSync(dir)) return false;
  const PROD = new Set(['production-authorized', 'in-production']);
  for (const name of readdirSync(dir)) {
    try {
      const env = JSON.parse(readFileSync(`${dir}/${name}/change-envelope.json`, 'utf8'));
      if (PROD.has(env.current_state)) return true;
    } catch { /* the envelope gate reports unparseable envelopes */ }
  }
  return false;
}

/**
 * Every governed change id in the tree — the directory name AND the declared change_id, because
 * a change may be filed under either. Returns null when there is no changes tree at all, which
 * `evaluate` reports as an unverified attribution rather than treating as "no such change".
 */
export function governedChangeIds(cwd = process.cwd()) {
  const dir = `${cwd}/docs/governance/changes`;
  if (!existsSync(dir)) return null;
  const ids = new Set();
  for (const name of readdirSync(dir)) {
    ids.add(name);
    try { ids.add(JSON.parse(readFileSync(`${dir}/${name}/change-envelope.json`, 'utf8')).change_id); }
    catch { /* the envelope gate reports unparseable envelopes */ }
  }
  ids.delete(undefined);
  return ids;
}

function run(cwd = process.cwd()) {
  const inProduction = anyChangeInProduction(cwd);
  const notices = [];
  const path = MANIFEST_LOCATIONS.map((p) => `${cwd}/${p}`).find(existsSync);
  if (!path) {
    return {
      notices,
      findings: inProduction
        ? ['no operations-signal manifest while a governed change is in production — the feedback seam is MANDATORY after launch']
        : [], // operations not yet wired — the feedback seam is optional until Run begins
    };
  }
  let manifest;
  try { manifest = JSON.parse(readFileSync(path, 'utf8')); }
  catch (e) { return { notices, findings: [`operations-signal manifest is not valid JSON: ${e.message}`] }; }
  return { notices, findings: evaluate(manifest, { inProduction, changeIds: governedChangeIds(cwd), notices }) };
}

// CLI (skipped when imported by the test suite).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { findings, notices } = run();
  for (const n of notices) process.stdout.write(`NOTICE: ${n}\n`);
  if (findings.length) {
    process.stderr.write('\nOperations → Discovery feedback gate — FAIL\n\n');
    for (const f of findings) process.stderr.write(`  - ${f}\n`);
    process.stderr.write('\nEvery operational signal must be triaged and traceable, so Run feeds back into\nthe loop. See ../loom/references/operations.md.\n');
    process.exit(1);
  }
  process.stdout.write('Operations → Discovery feedback gate — OK\n');
}
