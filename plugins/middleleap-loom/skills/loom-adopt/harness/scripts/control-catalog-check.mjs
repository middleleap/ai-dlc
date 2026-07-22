// The control-catalog gate (1.10). The catalog — docs/governance/control-catalog.json — is
// the source of record for control state, replacing any hand-graded scorecard. A catalog is
// only trustworthy if it cannot overstate itself, so this gate enforces the five-state
// grammar and the receipts each state demands:
//
//   absent                    — a note saying so (a gap named, not hidden)
//   defined                   — the governing document exists (doc_ref)
//   mechanically-validated    — the validating mechanism exists (mechanism_ref)
//   platform-enforced         — mechanism + a negative bypass test + activation evidence
//   organisationally-enforced — all of the above + a named independent owner
//
// A control claiming a state without its receipts FAILS the build — the catalog cannot
// drift above the truth. Run from the repo root: `node scripts/control-catalog-check.mjs`.
import { existsSync, readFileSync } from 'node:fs';
import process from 'node:process';

const CATALOG_LOCATIONS = ['docs/governance/control-catalog.json', 'control-catalog.json'];

export const STATES = ['absent', 'defined', 'mechanically-validated', 'platform-enforced', 'organisationally-enforced'];

/** Findings (one per violation). `exists` is injectable for tests. */
export function evaluate(catalog, exists = existsSync) {
  const findings = [];
  const controls = catalog && catalog.controls;
  if (!Array.isArray(controls) || controls.length === 0) {
    return ['catalog has no `controls` — there is no control state of record'];
  }
  const seen = new Set();
  for (const c of controls) {
    const id = c && c.control_id;
    if (!id) { findings.push('a control has no control_id'); continue; }
    if (seen.has(id)) findings.push(`${id}: duplicate control_id`);
    seen.add(id);
    if (!(typeof c.objective === 'string' && c.objective.trim())) findings.push(`${id}: no objective`);
    if (!(typeof c.owner_role === 'string' && c.owner_role.trim())) findings.push(`${id}: no owner_role`);
    if (![1, 2, 3].includes(c.line)) findings.push(`${id}: line must be 1, 2 or 3 (got ${JSON.stringify(c.line)})`);
    if (!STATES.includes(c.state)) { findings.push(`${id}: state must be one of ${STATES.join('|')} (got ${JSON.stringify(c.state)})`); continue; }

    // Receipts by state — a state without its receipts is an overstated catalog.
    const need = (field, why) => {
      if (!(typeof c[field] === 'string' && c[field].trim())) findings.push(`${id}: claims ${c.state} but has no ${field} — ${why}`);
    };
    if (c.state === 'absent') need('note', 'an absent capability must be named, not hidden');
    if (c.state === 'defined') need('doc_ref', 'defined means the governing document exists');
    if (c.state === 'mechanically-validated' || c.state === 'platform-enforced' || c.state === 'organisationally-enforced') {
      need('mechanism_ref', 'the validating mechanism must be named');
    }
    if (c.state === 'platform-enforced' || c.state === 'organisationally-enforced') {
      need('test_ref', 'platform-enforced requires a negative bypass test');
      need('activation_evidence', 'platform-enforced requires evidence the platform control is active');
    }
    if (c.state === 'organisationally-enforced') need('independent_owner', 'organisational enforcement requires a named independent owner');

    // Any referenced file must actually exist — a catalog may not cite ghosts.
    for (const field of ['mechanism_ref', 'test_ref', 'doc_ref']) {
      const ref = c[field];
      if (typeof ref === 'string' && ref.trim() && !exists(ref)) {
        findings.push(`${id}: ${field} ${ref} does not exist — the catalog cites a ghost`);
      }
    }
  }
  return findings;
}

// CLI (skipped when imported by the test suite).
if (import.meta.url === `file://${process.argv[1]}`) {
  const path = CATALOG_LOCATIONS.map((p) => `${process.cwd()}/${p}`).find(existsSync);
  let findings;
  if (!path) findings = [`no control catalog found (looked in ${CATALOG_LOCATIONS.join(', ')}) — there is no control state of record`];
  else {
    try { findings = evaluate(JSON.parse(readFileSync(path, 'utf8'))); }
    catch (e) { findings = [`control catalog is not valid JSON: ${e.message}`]; }
  }
  if (findings.length) {
    process.stderr.write('\nControl-catalog gate — FAIL\n\n');
    for (const f of findings) process.stderr.write(`  - ${f}\n`);
    process.stderr.write('\nThe catalog is the control state of record: every state needs its receipts, and no\ncited mechanism, test, or document may be missing. See ../loom/references/bank-grade-gap.md.\n');
    process.exit(1);
  }
  process.stdout.write('Control-catalog gate — OK\n');
}
