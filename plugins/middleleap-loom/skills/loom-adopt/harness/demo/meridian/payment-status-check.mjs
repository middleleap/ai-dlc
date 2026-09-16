// The payment-status integrity gate — the ONE obligation the Kosli founder demo traces end to
// end (docs/plans/kosli-founder-demo-briefing.md, "Develop": one obligation → an acceptance
// condition → an agent task → an executable check). It is a DEMO-SCOPED control: demo/run-demo.mjs
// --scenario meridian copies it into the adopted tree as scripts/payment-status-check.mjs and
// registers it in that tree's control catalog as PAYMENT-STATUS. It is not in the shipped catalog
// template, so no adopter runs it unless they choose to.
//
// The obligation (OB-AE-MTPOL-PSI-001, demo/meridian/obligation.json): when a payment-initiation
// call times out, the institution must not treat the payment as failed. The reference must be
// preserved, the existing outcome investigated through a status query, and an unsafe retry
// prevented. Those three behaviours are the acceptance condition, and this gate checks the
// service's DECLARED contract plus its RECORDED negative-test evidence:
//
//   PSI-R01  the contract exists, names its service and cites an obligation id
//   PSI-R02  timeout.outcome is `unknown` — a timeout that resolves to `failed` or `succeeded`
//           is a claim the service cannot make
//   PSI-R03  timeout.preserve_reference is true
//   PSI-R04  timeout.status_query_before_retry is true and timeout.retry is not `automatic`
//   PSI-R05  negative_test cites an evidence file that exists, whose sha256 matches, and whose
//           cases cover all three behaviours with result `pass`
//   PSI-R06  BOUNDARY, printed on every run: this gate validates a declaration and a recorded
//           test. It does not observe a payment system, a participant bank, or the platform's
//           status API. That is separate runtime evidence, and it is not claimed here.
//
// Run from the repo root: `node scripts/payment-status-check.mjs [--contract <path>]`.
// Exit 0 when clean, 1 on any finding.
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import process from 'node:process';

export const CONTRACT_DEFAULT = 'docs/governance/services/payment-initiation.status-contract.json';
export const REQUIRED_CASES = ['timeout-resolves-unknown', 'reference-preserved', 'retry-blocked-until-status-known'];
export const BOUNDARY = 'PSI-R06: this gate validates the declared timeout contract and a recorded negative test; it does not observe a payment system, a participant bank or the platform status API';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** Pure evaluation over a parsed contract; `readEvidence(ref)` returns bytes or null. */
export function evaluate(contract, { readEvidence = () => null } = {}) {
  const findings = [];
  const F = (m) => findings.push(m);
  if (!contract || typeof contract !== 'object') return { findings: ['PSI-R01: no status contract — a service that declares nothing about timeouts has not answered the obligation'], notices: [BOUNDARY] };
  if (typeof contract.service_id !== 'string' || !contract.service_id.trim()) F('PSI-R01: contract names no service_id');
  const obs = Array.isArray(contract.obligation_ids) ? contract.obligation_ids.filter((x) => typeof x === 'string' && /^OB-/.test(x)) : [];
  if (!obs.length) F('PSI-R01: contract cites no obligation id (OB-*) — a contract nobody can trace to an obligation is a preference');
  const t = contract.timeout && typeof contract.timeout === 'object' ? contract.timeout : null;
  if (!t) F('PSI-R02: contract declares no timeout block');
  else {
    if (t.outcome !== 'unknown') F(`PSI-R02: timeout.outcome is ${JSON.stringify(t.outcome)} — a timeout resolves to unknown; ${t.outcome === 'failed' ? 'reporting it as failed is an unsupported claim the customer will act on' : 'anything else is a claim the service cannot make'}`);
    if (t.preserve_reference !== true) F('PSI-R03: timeout.preserve_reference is not true — without the original reference the existing outcome cannot be investigated');
    if (t.status_query_before_retry !== true) F('PSI-R04: timeout.status_query_before_retry is not true — a retry before the status is known can move the money twice');
    if (t.retry === 'automatic') F('PSI-R04: timeout.retry is automatic — an unsafe retry is exactly what the obligation forbids');
    else if (typeof t.retry !== 'string' || !t.retry.trim()) F('PSI-R04: timeout.retry is not declared');
  }
  const n = contract.negative_test && typeof contract.negative_test === 'object' ? contract.negative_test : null;
  if (!n || typeof n.ref !== 'string' || !n.ref.trim()) F('PSI-R05: no negative_test evidence cited — a contract nobody has tried to break is a promise');
  else {
    const bytes = readEvidence(n.ref);
    if (!bytes) F(`PSI-R05: negative_test evidence ${n.ref} not found`);
    else {
      if (typeof n.sha256 !== 'string' || sha256(bytes) !== n.sha256.replace(/^sha256:/, '')) F(`PSI-R05: negative_test evidence ${n.ref} does not match the cited sha256 — the evidence changed after the contract cited it`);
      let ev = null;
      try { ev = JSON.parse(bytes.toString('utf8')); } catch { F(`PSI-R05: negative_test evidence ${n.ref} is not JSON`); }
      const cases = Array.isArray(ev?.cases) ? ev.cases : [];
      for (const id of REQUIRED_CASES) {
        const c = cases.find((x) => x && x.id === id);
        if (!c) F(`PSI-R05: negative_test evidence has no case ${id}`);
        else if (c.result !== 'pass') F(`PSI-R05: case ${id} is ${JSON.stringify(c.result)}, not pass`);
      }
    }
  }
  return { findings, notices: [BOUNDARY] };
}

export function check(cwd = process.cwd(), { contract = CONTRACT_DEFAULT } = {}) {
  const p = resolve(cwd, contract);
  if (!existsSync(p)) return { findings: [`PSI-R01: ${contract} not found — the payment-initiation service declares no timeout contract`], notices: [BOUNDARY], examined: 0 };
  let parsed;
  try { parsed = JSON.parse(readFileSync(p, 'utf8')); } catch (e) { return { findings: [`PSI-R01: ${contract} is not JSON — ${e.message}`], notices: [BOUNDARY], examined: 0 }; }
  const { findings, notices } = evaluate(parsed, { readEvidence: (ref) => { const e = resolve(cwd, ref); return existsSync(e) ? readFileSync(e) : null; } });
  return { findings, notices, examined: 1 };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const i = process.argv.indexOf('--contract');
  const r = check(process.cwd(), i > 0 ? { contract: process.argv[i + 1] } : {});
  for (const n of r.notices) process.stdout.write(`NOTICE ${n}\n`);
  if (r.findings.length) { for (const f of r.findings) process.stderr.write(`FINDING ${f}\n`); process.stderr.write(`Payment-status integrity gate — ${r.findings.length} finding(s)\n`); process.exit(1); }
  process.stdout.write(`Payment-status integrity gate — OK (${r.examined} contract)\n`);
}
