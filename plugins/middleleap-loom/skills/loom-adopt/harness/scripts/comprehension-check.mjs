// The comprehension gate (Loom 2.0-rc.15 · WS8). Review is not understanding. When an agent writes
// the change, the institution can accrue COMPREHENSION DEBT — code that merged, that no human on the
// owning team can explain or safely modify without the original agent session. This gate makes a
// human-understanding control explicit for high-tier changes: a high/critical change cannot proceed
// without a comprehension record whose author is a named human who can explain it.
//
// Required for a high/critical change (docs/governance/changes/<id>/comprehension.json):
//   summary                 a human-authored change summary (not the agent's PR body)
//   critical_path           a walkthrough of the critical path
//   named_owner             a human (registry-resolved, non-agent) who can explain the change
//   challenge_questions     reviewer challenge questions (and their answers)
//   architecture_explanation, failure_modes   how it is built and how it fails
//   decision_log_replay_ref a pointer to the replayed agent decision log (WS6's log earns its reader)
//   metrics                 review time, complexity, % agent-generated, reviewer familiarity, … —
//                           REPORTED, never gated on their values (the objective is understanding,
//                           not throttling AI output)
//
// Mandatory-when-compiled: a low/medium change needs none; a high/critical change that lacks it fails.
//
// Run from the repo root: `node scripts/comprehension-check.mjs`.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { loadRegistry, identityOf } from './identity-registry-check.mjs';
import { pathToFileURL } from 'node:url';

export const CHANGES_DIR = 'docs/governance/changes';
const HIGH_TIERS = new Set(['high', 'critical']);
const NARRATIVE = ['summary', 'critical_path', 'architecture_explanation', 'failure_modes'];
const METRICS = ['review_minutes', 'change_complexity', 'pct_agent_generated', 'reviewer_familiarity'];
const PLACEHOLDER = /ADOPT|TODO|TBD|\bxxx\b/i;

const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };
const filled = (v) => typeof v === 'string' && v.trim().length > 0 && !PLACEHOLDER.test(v);

/** Findings for one high-tier change's comprehension record. `registry` injectable for tests. */
export function evaluate(changeId, record, { registry } = {}) {
  const findings = [];
  if (!record) return [`${changeId}: high-tier change has no comprehension.json — a high-risk change needs a human-authored understanding record (WS8)`];
  for (const f of NARRATIVE) if (!filled(record[f])) findings.push(`${changeId}: comprehension ${f} is missing or a placeholder`);
  const owner = record.named_owner;
  if (!owner) findings.push(`${changeId}: no named_owner — a human must be accountable for explaining the change`);
  else if (registry) {
    const who = identityOf(registry, owner);
    if (!who || who.kind === 'agent') findings.push(`${changeId}: named_owner ${JSON.stringify(owner)} is not a human registry identity — an agent cannot be the human who understands the change`);
  }
  if (!Array.isArray(record.challenge_questions) || record.challenge_questions.length === 0) findings.push(`${changeId}: no challenge_questions — a reviewer must have probed the change`);
  if (!filled(record.decision_log_replay_ref)) findings.push(`${changeId}: no decision_log_replay_ref — the agent's decision log must have been replayed and referenced`);
  // Metrics are REPORTED, not gated on value — but they must be present (you cannot manage what you
  // do not measure). A missing metric key is a finding; its number is not judged.
  const metrics = record.metrics || {};
  for (const m of METRICS) if (!(m in metrics)) findings.push(`${changeId}: comprehension metric ${JSON.stringify(m)} not recorded`);
  return findings;
}

export function run(cwd = process.cwd()) {
  const dir = `${cwd}/${CHANGES_DIR}`;
  if (!existsSync(dir)) return { count: 0, findings: [] };
  const registry = loadRegistry(cwd);
  const findings = [];
  let count = 0;
  for (const name of readdirSync(dir)) {
    const envelope = readJson(join(dir, name, 'change-envelope.json'));
    if (!envelope || !HIGH_TIERS.has(envelope.risk_tier)) continue; // only high/critical are gated
    count++;
    const record = readJson(join(dir, name, 'comprehension.json'));
    findings.push(...evaluate(envelope.change_id || name, record, { registry }));
  }
  return { count, findings };
}

// CLI (skipped when imported by the test suite).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { count, findings } = run();
  if (findings.length) {
    process.stderr.write('\nComprehension gate (rc.15 · WS8) — FAIL\n\n');
    for (const f of findings) process.stderr.write(`  - ${f}\n`);
    process.stderr.write('\nReview is not understanding. A high-tier change needs a human who can explain it.\nSee ../loom/references/governance.md (comprehension debt).\n');
    process.exit(1);
  }
  process.stdout.write(`Comprehension gate (rc.15 · WS8) — ${count} high-tier change(s) carry a human understanding record. OK\n`);
}
