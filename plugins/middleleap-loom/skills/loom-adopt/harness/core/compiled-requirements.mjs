// Compiled requirements — the execution root (Loom 2.0-rc.7 W1). The policy compiler decides
// which gates, evidence and capabilities a change must carry; this module is the single place
// that AGGREGATES those decisions across every governed change, so the gate runner and the
// individual gates read one source of truth instead of hardcoding optionality.
//
//   families  — the union of every active change's compiled `required_gates`
//               (D · PA1 · A · Q · PA2 · R · product-eval · assurance-cadence · decision-log)
//   evidence  — the union of every active change's compiled `required_evidence`
//   changes   — [{ change_id, families, evidence }] so a gate can say WHO requires it
//
// It reads each change's STORED control-plan.json — which `change-envelope-check` already
// reconciles against a fresh compile (a stale plan fails there), so reading it here is safe
// and does not re-run the compiler. A change with no plan contributes nothing (the envelope
// gate reports the missing plan); it never silently lowers a requirement.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export const CHANGES_DIR = 'docs/governance/changes';
// Production states — once a change reaches one, cadence-style capabilities apply even if the
// plan predates them (mirrors the silence-after-launch rule).
export const PRODUCTION_STATES = new Set(['production-authorized', 'in-production']);

const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };

/** Aggregate compiled requirements across all governed changes. */
export function aggregateRequirements(cwd = process.cwd()) {
  const families = new Set();
  const evidence = new Set();
  const changes = [];
  let anyInProduction = false;
  const dir = `${cwd}/${CHANGES_DIR}`;
  if (!existsSync(dir)) return { families, evidence, changes, anyInProduction };
  for (const name of readdirSync(dir)) {
    const base = `${dir}/${name}`;
    const envelope = readJson(`${base}/change-envelope.json`);
    if (!envelope) continue;
    if (PRODUCTION_STATES.has(envelope.current_state)) anyInProduction = true;
    const plan = readJson(`${base}/${envelope.control_plan || 'control-plan.json'}`);
    if (!plan) continue;
    const fam = new Set(plan.required_gates || []);
    const ev = new Set(plan.required_evidence || []);
    for (const f of fam) families.add(f);
    for (const e of ev) evidence.add(e);
    changes.push({ change_id: envelope.change_id || name, state: envelope.current_state, families: [...fam], evidence: [...ev] });
  }
  return { families, evidence, changes, anyInProduction };
}

/** Which change_ids require a given gate family — for a gate to name WHO makes it mandatory. */
export function requiredBy(agg, family) {
  return agg.changes.filter((c) => c.families.includes(family)).map((c) => c.change_id);
}

// CLI: print the aggregated requirements (diagnostic).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const agg = aggregateRequirements();
  process.stdout.write(JSON.stringify({
    families: [...agg.families].sort(),
    evidence: [...agg.evidence].sort(),
    anyInProduction: agg.anyInProduction,
    changes: agg.changes,
  }, null, 2) + '\n');
}
