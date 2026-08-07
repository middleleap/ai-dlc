// Data-risk register loader for D6 referential integrity. Pure Node.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DEFAULT_DIR = 'docs/governance/data-risk-register';

function load(dir, file) {
  const p = join(dir, file);
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : [];
}

/**
 * The vocabulary of regulatory drivers this institution actually answers to, mounted beside the
 * register as `reg-drivers.json`: a FLAT ARRAY OF LITERAL TERMS, e.g.
 *
 *   ["HSA", "AAOIFI", "Shari'ah Standard No.", "ISSC resolution"]
 *
 * D6 ships with a built-in driver regex, and that regex knows one jurisdiction's abbreviations.
 * A document grounded ONLY in a Shariah authority's pronouncements or a standard-setter's
 * standards cited none of them, so D6 reported "cites no regulatory driver" about a document
 * whose every line was a citation. The wrong fix is to edit the regex per jurisdiction — that is
 * gate LOGIC absorbing adopter DATA, which is the seam this harness exists to keep open.
 *
 * Terms are LITERALS, never patterns: the D6 check regex-escapes them, so a mounted term can
 * only ever ADD a way to pass, never rewrite the built-in check into something weaker.
 */
function loadDrivers(dir) {
  const raw = load(dir, 'reg-drivers.json');
  return Array.isArray(raw) ? raw.filter((t) => typeof t === 'string' && t.trim()) : [];
}

/** Build resolvable id sets from the register JSON. Returns null if the register isn't
 *  mounted (so D6 can degrade gracefully on a seam-less run). */
export function loadRegister(dir = DEFAULT_DIR) {
  if (!existsSync(join(dir, 'risk-taxonomy.json'))) return null;
  const taxonomy = load(dir, 'risk-taxonomy.json');
  const statements = load(dir, 'risk-statements.json');
  const controls = load(dir, 'controls.json');
  const drivers = loadDrivers(dir); // absent file → [] → D6 behaves exactly as before

  const drIds = new Set();
  for (const r of taxonomy) {
    if (r.risk_category_id) drIds.add(r.risk_category_id); // DR-2.1
    if (r.risk_domain_id) drIds.add(r.risk_domain_id);     // DR-2
  }
  for (const r of statements) if (r.risk_id) drIds.add(r.risk_id); // DR-2.1-001

  const ctrlIds = new Set();
  for (const c of controls) if (c.control_id) ctrlIds.add(c.control_id);

  return { drIds, ctrlIds, taxonomy, statements, controls, drivers };
}
