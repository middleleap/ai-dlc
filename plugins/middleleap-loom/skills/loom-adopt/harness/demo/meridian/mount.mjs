// Mount the Meridian scenario into an ADOPTED tree (demo/run-demo.mjs --scenario meridian, and
// the scenario's own test). Everything is additive to the adopted tree's governed files; nothing
// in the bundle's templates moves:
//
//   · the data-risk register gains the Meridian rows (payment status, consent, platform dependency)
//   · the obligations register gains the payment-status obligation and the Open Finance set
//   · the control catalog gains the demo-scoped PAYMENT-STATUS control, its mechanism and test
//   · discovery/runs/ gains the two runs: cross-bank-money (handed off) and
//     cross-bank-money-stopped (the same discovery, ended without a hand-off)
//   · discovery/brand/design.md becomes the Meridian brand profile (the shipped example), so the
//     runs render and validate under the institution's brand, not the harness's
//
// Returns the ids it registered so the caller can print the chain.
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HERE = dirname(fileURLToPath(import.meta.url));
export const RUNS = ['cross-bank-money', 'cross-bank-money-stopped'];
export const RUN_DIRS = { 'cross-bank-money': 'discovery-run', 'cross-bank-money-stopped': 'discovery-run-stopped' };

const J = (p) => JSON.parse(readFileSync(p, 'utf8'));
const W = (p, o) => writeFileSync(p, JSON.stringify(o, null, 2) + '\n');
const pushAll = (file, rows) => { const cur = J(file); cur.push(...rows); W(file, cur); };

export function mountMeridian(A) {
  const M = J(join(HERE, 'obligation.json'));
  const OF = J(join(HERE, 'open-finance-obligations.json'));
  // Registers.
  const R = join(A, 'docs/governance/data-risk-register');
  pushAll(join(R, 'risk-taxonomy.json'), [M.register.taxonomy, ...OF.register.taxonomy]);
  pushAll(join(R, 'risk-statements.json'), [M.register.statement, ...OF.register.statements]);
  pushAll(join(R, 'controls.json'), [M.register.control, ...OF.register.controls]);
  pushAll(join(R, 'residual-risk.json'), [M.register.residual, ...OF.register.residual]);
  const obPath = join(A, 'docs/governance/obligations.json');
  const ob = J(obPath); ob.obligations.push(M.obligation, ...OF.obligations); W(obPath, ob);
  // The demo-scoped control.
  const catPath = join(A, 'docs/governance/control-catalog.json');
  const cat = J(catPath); cat.controls.push(M.control); W(catPath, cat);
  cpSync(join(HERE, 'payment-status-check.mjs'), join(A, 'scripts/payment-status-check.mjs'));
  cpSync(join(HERE, 'payment-status-check.test.mjs'), join(A, 'scripts/payment-status-check.test.mjs'));
  mkdirSync(join(A, 'docs/governance/evidence'), { recursive: true });
  cpSync(join(HERE, 'payment-status-tests.json'), join(A, 'docs/governance/evidence/payment-status-tests.json'));
  // The discovery runs, under the Meridian brand.
  for (const [slug, dir] of Object.entries(RUN_DIRS)) cpSync(join(HERE, dir), join(A, 'discovery/runs', slug), { recursive: true });
  const brand = [join(A, 'discovery/brand/examples/meridian-trust.design.md'), join(HERE, '../../discovery/brand/examples/meridian-trust.design.md')].find(existsSync);
  if (!brand) throw new Error('the Meridian brand profile (discovery/brand/examples/meridian-trust.design.md) is not in the bundle');
  cpSync(brand, join(A, 'discovery/brand/design.md'));
  // The NPA pack the run assembles at 'Investment case assembled': the npa-uae skill's worked example
  // for this very run (middleleap-banking-uae is a sibling plugin in this repository), plus the
  // committee's PA1 decision. An adopter's tree carries its own form; the demo borrows the skill's.
  const form = join(HERE, '../../../../../../middleleap-banking-uae/skills/npa-uae/references/example-cross-bank-money.md');
  const npaDir = join(A, 'discovery/runs/cross-bank-money/npa');
  mkdirSync(npaDir, { recursive: true });
  if (existsSync(form)) cpSync(form, join(npaDir, 'business-proposition-form.md'));
  cpSync(join(HERE, 'npa/decision.json'), join(npaDir, 'decision.json'));
  // The Run → Discovery edge: one signal routed `discovery`, appended to the adopted operations log.
  const sigPath = join(A, 'docs/governance/operations-signal.json');
  const sig = existsSync(sigPath) ? J(sigPath) : { signals: [] };
  sig.signals = [...(sig.signals || []), ...J(join(HERE, 'operations-signal.json')).signals];
  W(sigPath, sig);
  return {
    mandate: M.mandate_ref,
    obligation: M.obligation.id,
    obligations: [M.obligation.id, ...OF.obligations.map((o) => o.id)],
    registerControl: M.register.control.control_id,
    control: M.control.control_id,
    mechanism: M.control.mechanism_ref,
    runs: RUNS,
    npaForm: existsSync(form) ? 'discovery/runs/cross-bank-money/npa/business-proposition-form.md' : null,
    signal: 'OPS-2026-0912',
  };
}
