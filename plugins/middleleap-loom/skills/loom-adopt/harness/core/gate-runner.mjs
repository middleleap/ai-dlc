// The gate runner (Loom 2.0 — risk-proportionate execution). Running every gate on every
// PR contradicts Promise 1: a documentation fix should not take the route of a lending
// model. The runner reads the CONTROL CATALOG — lane assignment is governed data, not
// ad-hoc CI editing — and executes only what this diff implicates:
//
//   lane   pr | release | scheduled — which trigger a control runs on
//   always the tamper-detection core: never skipped in its lane, whatever the diff
//   paths  path prefixes that implicate the control; a diff touching none of them skips it
//
// Three honesty rules: SKIPPING IS RECORDED, never silent (the run record lists every skip
// and why); an UNKNOWN diff runs everything in the lane (fail open toward more control,
// never less); selection comes from the catalog + compiled plans, so a change cannot talk
// its way onto the light path. This file is control plane (CONTROL_TARGETS).
//
// Run: `node core/gate-runner.mjs --lane pr [--base <ref>] [--out record.json]`.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';

export const LANES = ['pr', 'release', 'scheduled'];
const CATALOG_LOCATIONS = ['docs/governance/control-catalog.json', 'control-catalog.json'];

const runnable = (c) => typeof c.mechanism_ref === 'string' && c.mechanism_ref.endsWith('.mjs');

/**
 * Pure selection: which controls run, which skip (each skip with its reason).
 * `changedPaths === null` means the diff is unknown → run everything in the lane.
 */
export function select(catalog, { lane = 'pr', changedPaths = null } = {}) {
  const run = new Map(); // mechanism → {mechanism, ids[]}
  const skipped = [];
  for (const c of catalog?.controls || []) {
    if (!runnable(c)) continue; // documented/absent controls have nothing to execute
    if (c.execute === false) { skipped.push({ id: c.control_id, reason: c.execute_note || 'not directly executable — enforced via another gate' }); continue; }
    const cLane = c.lane || 'pr';
    if (cLane !== lane) { skipped.push({ id: c.control_id, reason: `lane:${cLane} (this is a ${lane} run)` }); continue; }
    let why = null;
    if (c.always) why = 'always';
    else if (changedPaths === null) why = 'diff unknown — fail open to running';
    else if (Array.isArray(c.paths) && c.paths.some((p) => changedPaths.some((f) => f === p || f.startsWith(p)))) why = 'implicated by diff';
    else if (!Array.isArray(c.paths)) why = 'no path scope declared — runs by default';
    if (!why) { skipped.push({ id: c.control_id, reason: `no implicated paths in this diff (scope: ${c.paths.join(', ')})` }); continue; }
    const entry = run.get(c.mechanism_ref) || { mechanism: c.mechanism_ref, ids: [], args: c.mechanism_args || [] };
    entry.ids.push(c.control_id);
    run.set(c.mechanism_ref, entry);
  }
  return { run: [...run.values()], skipped };
}

function changedSince(base) {
  try {
    return execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  } catch { return null; } // unknown diff → the runner fails open to running everything
}

// CLI (skipped when imported by the test suite).
if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv;
  const arg = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
  const lane = arg('--lane') || 'pr';
  if (!LANES.includes(lane)) { process.stderr.write(`lane must be ${LANES.join('|')}\n`); process.exit(2); }
  const base = arg('--base');
  const path = CATALOG_LOCATIONS.map((p) => `${process.cwd()}/${p}`).find(existsSync);
  if (!path) { process.stderr.write('no control catalog — the runner has no state of record to read\n'); process.exit(2); }
  const catalog = JSON.parse(readFileSync(path, 'utf8'));
  const changedPaths = base ? changedSince(base) : null;
  const { run, skipped } = select(catalog, { lane, changedPaths });

  const executed = [];
  let failed = 0;
  for (const g of run) {
    const t0 = Date.now();
    const r = spawnSync(process.execPath, [g.mechanism, ...g.args], { stdio: 'inherit' });
    const status = r.status === 0 ? 'pass' : 'fail';
    if (status === 'fail') failed++;
    executed.push({ controls: g.ids, mechanism: g.mechanism, status, ms: Date.now() - t0 });
  }
  let head = null;
  try { head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { /* no git */ }
  const record = {
    lane, base: base || null, commit: head,
    changed_paths: changedPaths, executed, skipped,
    result: failed === 0 ? 'pass' : 'fail',
  };
  const out = arg('--out');
  if (out) writeFileSync(out, JSON.stringify(record, null, 2) + '\n');
  process.stdout.write(`\nGate runner [${lane}] — ${record.result.toUpperCase()}: ${executed.length} mechanism(s) run, ${skipped.length} control(s) skipped (recorded${out ? ` → ${out}` : ''})\n`);
  for (const s of skipped) process.stdout.write(`  · skipped ${s.id} — ${s.reason}\n`);
  process.exit(failed === 0 ? 0 : 1);
}
