// The architecture-assurance gate — A1–A5 (Loom 2.0 §7.2). Before the delivery loop
// commits to a design, the design must carry structured assurance: data & privacy (A1),
// a threat model covering the product AND the AI harness itself (A2), operational
// resilience (A3), model & AI risk (A4), core & financial integrity (A5). This gate
// verifies the architecture-assurance.json artifact for every governed change whose
// compiled plan requires the A gates:
//
//   every required A-section is present and complete ·
//   every A2 threat traces to a CONTROL and a TEST (threat → control → test) ·
//   a material finding still open blocks — backlog creation waits for the answer.
//
// Run from the repo root: `node scripts/architecture-assurance-check.mjs`.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export const CHANGES_DIR = 'docs/governance/changes';
export const SECTIONS = ['A1-data-privacy', 'A2-security-threat-model', 'A3-operational-resilience', 'A4-model-risk', 'A5-financial-integrity'];

/** Findings for one architecture-assurance artifact. */
export function evaluate(assurance, changeId = '(no id)') {
  const findings = [];
  if (!assurance) return [`${changeId}: architecture-assurance.json missing — the plan requires the A gates`];
  for (const s of SECTIONS) {
    const sec = assurance[s];
    if (!sec || typeof sec !== 'object' || Object.keys(sec).length === 0) {
      findings.push(`${changeId} · ${s}: section missing or empty`);
      continue;
    }
    if (sec.status !== 'complete') {
      findings.push(`${changeId} · ${s}: status is ${JSON.stringify(sec.status)} — an incomplete assurance section blocks delivery`);
    }
  }
  // A2: threat → control → test, or it is a worry, not assurance.
  const threats = assurance['A2-security-threat-model']?.threats;
  if (Array.isArray(threats)) {
    if (threats.length === 0) findings.push(`${changeId} · A2: no threats listed — a product with an AI harness has threats; name them`);
    threats.forEach((t, i) => {
      for (const f of ['threat', 'control', 'test']) {
        if (!(typeof t[f] === 'string' && t[f].trim())) {
          findings.push(`${changeId} · A2 threat ${i} (${t.threat || 'unnamed'}): no ${f} — every threat traces to a control and a test`);
        }
      }
    });
  } else if (assurance['A2-security-threat-model']) {
    findings.push(`${changeId} · A2: no threats array — the threat model must enumerate its threats`);
  }
  // Material open findings block.
  for (const f of assurance.findings || []) {
    if (f.materiality === 'material' && f.status === 'open') {
      findings.push(`${changeId}: material finding ${f.id || '(unnamed)'} is OPEN — a material unresolved A-gate blocks backlog creation`);
    }
  }
  return findings;
}

const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };

export function run(cwd = process.cwd()) {
  const dir = `${cwd}/${CHANGES_DIR}`;
  if (!existsSync(dir)) return { findings: [], count: 0 };
  const findings = [];
  let count = 0;
  for (const name of readdirSync(dir)) {
    const base = `${dir}/${name}`;
    const envelope = readJson(`${base}/change-envelope.json`);
    if (!envelope) continue;
    const plan = readJson(`${base}/${envelope.control_plan || 'control-plan.json'}`);
    if (!(plan?.required_gates || []).includes('A')) continue;
    count++;
    const required = existsSync(`${base}/architecture-assurance.json`);
    findings.push(...evaluate(required ? readJson(`${base}/architecture-assurance.json`) : null, envelope.change_id));
  }
  return { findings, count };
}

// CLI (skipped when imported by the test suite).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { findings, count } = run();
  if (findings.length) {
    process.stderr.write('\nArchitecture-assurance gate (A1–A5) — FAIL\n\n');
    for (const f of findings) process.stderr.write(`  - ${f}\n`);
    process.stderr.write('\nA threat without a control and a test is a worry, not assurance; a material open\nfinding blocks backlog creation. See docs/loom-2.0-plan.md §7.2.\n');
    process.exit(1);
  }
  process.stdout.write(`Architecture-assurance gate — OK (${count} governed change${count === 1 ? '' : 's'})\n`);
}
