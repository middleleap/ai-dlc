// The CI-catalog closure gate. The control catalog is the STATE OF RECORD — bank-grade-gap.md
// says so in as many words ("where they disagree, the catalog wins"). Two things read it and
// nothing was checking that it was complete:
//
//   core/gate-runner.mjs   selects ONLY catalogued controls. A gate the CI workflow runs but the
//                          catalog does not carry is a gate that DISAPPEARS the moment an adopter
//                          takes ci.yml's own advice and switches to the risk-proportionate
//                          runner. Not skipped-with-a-reason — never considered.
//   scripts/generate-scorecard.mjs  counts the catalog. An uncatalogued gate is a control the
//                          method enforces and does not claim, which is the honest direction to
//                          be wrong in, but still wrong.
//
// This gate makes that divergence a build failure, in one direction: **every gate the workflow
// runs must be in the catalog.** The converse is deliberately NOT checked — a catalogued control
// may legitimately run in another lane, on a schedule, or via another gate (`execute: false`),
// and control-catalog-check already refuses a mechanism_ref that cites a ghost.
//
//   node scripts/ci-catalog-check.mjs [--ci <path>]
//
// REPORTS ARE EXEMPT, EXPLICITLY AND LOUDLY. The Loom's rule is that cost is a signal for humans
// and never a merge control, so `token-report.mjs` runs in CI and has no catalog entry — correctly,
// because a catalog entry would assert it is a control. That exemption is a named list below and
// it is PRINTED on every run, pass or fail. A silent exemption list is how the thing this gate
// exists to prevent comes back wearing a different hat.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import process from 'node:process';

const HARNESS = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// An adopted repo carries the workflow at the GitHub path; the bundle carries the reference copy.
export const CI_LOCATIONS = ['.github/workflows/ci.yml', resolve(HARNESS, 'ci/ci.yml')];
export const CATALOG_LOCATIONS = [
  'docs/governance/control-catalog.json',
  'control-catalog.json',
  resolve(HARNESS, 'governance/control-catalog.template.json'),
];

// Report-only tools: run by CI, deliberately NOT controls. Each carries its reason, and both the
// name and the reason are printed on every run.
export const REPORT_ONLY = new Map([
  ['scripts/token-report.mjs', 'cost telemetry — a report, never a merge gate (delivery-harness.md §Record)'],
]);

/** Every `node <path>.mjs` invocation in a workflow, in file order, de-duplicated. */
export function gatesInWorkflow(yaml) {
  const found = new Set();
  for (const m of yaml.matchAll(/^\s*(?:-\s*)?node\s+((?:scripts|core|discovery)\/[A-Za-z0-9._/-]+\.mjs)/gm)) {
    found.add(m[1]);
  }
  // Also catch gates invoked mid-line in a multi-command `run:` block.
  for (const m of yaml.matchAll(/(?:^|\s|&&\s*)node\s+((?:scripts|core|discovery)\/[A-Za-z0-9._/-]+\.mjs)/g)) {
    found.add(m[1]);
  }
  return [...found];
}

/**
 * Findings (one per uncatalogued gate). Pure: takes the workflow text and the parsed catalog.
 * A gate counts as catalogued when ANY control names it as its mechanism_ref.
 */
export function evaluate(yaml, catalog) {
  const controls = Array.isArray(catalog?.controls) ? catalog.controls : [];
  const mechanisms = new Set(controls.map((c) => c && c.mechanism_ref).filter((r) => typeof r === 'string'));
  const findings = [];
  for (const gate of gatesInWorkflow(yaml)) {
    if (mechanisms.has(gate)) continue;
    if (REPORT_ONLY.has(gate)) continue;
    findings.push(
      `${gate} is run by the CI workflow but has no control-catalog entry — core/gate-runner.mjs ` +
        `selects only catalogued controls, so this gate would not run at all on the risk-proportionate ` +
        `path. Add a control with mechanism_ref "${gate}" (and its lane/paths), or add it to REPORT_ONLY ` +
        `in scripts/ci-catalog-check.mjs with the reason it is not a control.`,
    );
  }
  return findings;
}

const firstExisting = (paths) => paths.find((p) => existsSync(p)) || null;

export function main(argv = process.argv.slice(2)) {
  const ciFlag = argv.indexOf('--ci');
  const ciPath = ciFlag >= 0 ? argv[ciFlag + 1] : firstExisting(CI_LOCATIONS);
  const catalogPath = firstExisting(CATALOG_LOCATIONS);

  process.stdout.write('\nCI-catalog closure gate — every enforced gate is in the state of record\n\n');

  if (!ciPath || !existsSync(ciPath)) {
    // No workflow is not a failure: an adoption may not have wired CI yet. Say so.
    process.stdout.write(`  no CI workflow found (looked in ${CI_LOCATIONS.join(', ')}) — nothing to close over\n\n`);
    return 0;
  }
  if (!catalogPath) {
    process.stdout.write('CI-catalog closure gate — FAIL\n\n  - no control catalog found — there is no state of record to close over\n\n');
    return 1;
  }

  let catalog;
  try {
    catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  } catch (err) {
    process.stdout.write(`CI-catalog closure gate — FAIL\n\n  - ${catalogPath} is not valid JSON: ${err.message}\n\n`);
    return 1;
  }

  const yaml = readFileSync(ciPath, 'utf8');
  const findings = evaluate(yaml, catalog);
  const gates = gatesInWorkflow(yaml);

  // The exemptions are printed whether or not anything failed — never a silent carve-out.
  const exempt = gates.filter((g) => REPORT_ONLY.has(g));
  if (exempt.length) {
    process.stdout.write('  report-only, deliberately not controls:\n');
    for (const g of exempt) process.stdout.write(`    · ${g} — ${REPORT_ONLY.get(g)}\n`);
    process.stdout.write('\n');
  }

  if (findings.length) {
    process.stdout.write('CI-catalog closure gate — FAIL\n\n');
    for (const f of findings) process.stdout.write(`  - ${f}\n`);
    process.stdout.write('\nThe catalog is the state of record; a gate outside it is enforced but unclaimed,\nand invisible to the gate runner and the scorecard. See core/gate-runner.mjs.\n\n');
    return 1;
  }

  process.stdout.write(
    `  ${gates.length - exempt.length} gate(s) in ${ciPath} — all present in ${catalogPath}\n\n` +
      'CI-catalog closure gate — OK\n\n',
  );
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) process.exit(main());
