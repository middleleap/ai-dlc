// The adoption status projector (Loom 2.0-rc.14 · WS5). Installation is automated (adopt.mjs);
// configuration, validation, platform activation and organisational approval were not — so an
// adopter had no machine-readable answer to "how far along is this adoption, and what is still
// adopt-pending?". This turns adoption into an explicit FIVE-STAGE state machine, projected from
// the control catalog (the single state of record — this never invents a second ledger):
//
//   installed      the mechanism/document the control ships is present
//   configured     its templates carry no unresolved ADOPT markers (@your-org/, ADOPT:, draft)
//   validated      the catalog grades it mechanically-validated or higher
//   platform       the catalog grades it platform-enforced, or a signed activation names it (WS2)
//   organisation   the catalog grades it organisationally-enforced, or an adoption attestation covers it
//
// `loom status` prints this as a machine-readable JSON (--json) or a human table, plus the
// UNRESOLVED-MARKER INVENTORY — every adopt-pending file, named. `attest-adoption` (adoption-attest.mjs)
// reads this and refuses to sign while any mandatory item is adopt-pending.
//
// Run from the adopted repo root: `node scripts/adoption-status.mjs [--json]`.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const CATALOG_LOCATIONS = ['docs/governance/control-catalog.json', 'control-catalog.json'];
const ACTIVATION_DIR = ['docs/governance/platform-activation', 'platform-activation'];
const ATTEST_LOCATIONS = ['docs/governance/adoption-attestation.json', 'adoption-attestation.json'];
// The scan roots for unresolved-marker detection (config the adopter must fill).
const SCAN_ROOTS = ['docs/governance', 'institution', 'guardrails', 'CODEOWNERS'];
export const MARKER = /@your-org\/|ADOPT:|ADOPT-|"status":\s*"draft"/;

const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };
const find = (cwd, locs) => locs.map((p) => `${cwd}/${p}`).find(existsSync) || null;

/** Every file under `root` (recursive). A single file path returns itself. */
function walk(root) {
  if (!existsSync(root)) return [];
  if (statSync(root).isFile()) return [root];
  const out = [];
  for (const name of readdirSync(root)) {
    const p = join(root, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

/** Files under the scan roots that still carry an ADOPT marker — the unresolved inventory. */
export function unresolvedMarkers(cwd) {
  const hits = [];
  for (const root of SCAN_ROOTS) {
    for (const f of walk(join(cwd, root))) {
      let text; try { text = readFileSync(f, 'utf8'); } catch { continue; }
      if (MARKER.test(text)) hits.push(f.slice(cwd.length + 1));
    }
  }
  return hits.sort();
}

const anyMarkerUnder = (cwd, prefixes, pendingSet) =>
  (prefixes || []).some((p) => [...pendingSet].some((f) => f === p || f.startsWith(p)));

/** Compute the five-stage status of every control, plus the unresolved inventory. */
export function computeStatus(cwd = process.cwd()) {
  const catalogPath = find(cwd, CATALOG_LOCATIONS);
  const catalog = catalogPath ? readJson(catalogPath) : null;
  if (!catalog) return { capabilities: [], unresolved: [], adoptPending: false, error: 'no control catalog' };

  const pending = unresolvedMarkers(cwd);
  const pendingSet = new Set(pending);

  // Which controls a signed platform-activation names, and which an adoption attestation covers.
  const actDir = find(cwd, ACTIVATION_DIR);
  const activated = new Set(actDir ? readdirSync(actDir).filter((f) => f.endsWith('.json')).map((f) => readJson(join(actDir, f))?.satisfies_control).filter(Boolean) : []);
  const attest = readJson(find(cwd, ATTEST_LOCATIONS) || '');
  const orgApproved = new Set(attest?.approved_controls || []);

  const capabilities = catalog.controls.map((c) => {
    const state = c.state;
    const validated = ['mechanically-validated', 'platform-enforced', 'organisationally-enforced'].includes(state);
    const installed = validated || state === 'defined' || Boolean(c.mechanism_ref || c.doc_ref);
    // configured: nothing left adopt-pending under the paths this control governs.
    const configured = installed && !anyMarkerUnder(cwd, c.paths, pendingSet);
    const platform = ['platform-enforced', 'organisationally-enforced'].includes(state) || activated.has(c.control_id);
    const organisation = state === 'organisationally-enforced' || orgApproved.has(c.control_id);
    return { control_id: c.control_id, adopter_side: Boolean(c.adopter_side), installed, configured, validated, platform, organisation };
  });
  return { capabilities, unresolved: pending, adoptPending: pending.length > 0 };
}

const yn = (b) => (b ? 'yes' : '—');

// CLI (skipped when imported by the test suite).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const status = computeStatus();
  if (process.argv.includes('--json')) { process.stdout.write(JSON.stringify(status, null, 2) + '\n'); process.exit(0); }
  if (status.error) { process.stderr.write(`loom status — ${status.error}\n`); process.exit(2); }
  process.stdout.write('\nLoom adoption status\n\n');
  process.stdout.write('| Capability | Installed | Configured | Validated | Platform | Organisation |\n');
  process.stdout.write('|---|---|---|---|---|---|\n');
  for (const c of status.capabilities) {
    const tag = c.adopter_side ? ' *' : '';
    process.stdout.write(`| ${c.control_id}${tag} | ${yn(c.installed)} | ${yn(c.configured)} | ${yn(c.validated)} | ${yn(c.platform)} | ${yn(c.organisation)} |\n`);
  }
  process.stdout.write('\n* adopter-side capability (the bundle cannot ship it — you provide it).\n');
  if (status.unresolved.length) {
    process.stdout.write(`\n${status.unresolved.length} file(s) ADOPT-PENDING (unresolved markers):\n`);
    for (const f of status.unresolved) process.stdout.write(`  · ${f}\n`);
    process.stdout.write('\nFill these before `attest-adoption` — a signed adoption report cannot be produced while any mandatory item is adopt-pending.\n');
  } else {
    process.stdout.write('\nNo unresolved ADOPT markers — configuration is complete.\n');
  }
}
