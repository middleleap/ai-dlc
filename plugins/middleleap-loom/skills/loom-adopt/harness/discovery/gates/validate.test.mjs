// Tests for the discovery gate validator. Node built-in runner: `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { validateRun, registerMandatory } from './validate.mjs';

// rc.13 WS3 (F5) — the register requirement is DERIVED from compiled policy, not a CLI flag.
function repoWithChange(caps) {
  const dir = mkdtempSync(join(tmpdir(), 'rm-'));
  const base = join(dir, 'docs/governance/changes/CHG-1');
  mkdirSync(base, { recursive: true });
  writeFileSync(join(base, 'change-envelope.json'), JSON.stringify({ change_id: 'CHG-1', current_state: 'in-delivery', control_plan: 'control-plan.json' }));
  writeFileSync(join(base, 'control-plan.json'), JSON.stringify({ required_capabilities: caps }));
  return dir;
}

test('registerMandatory — a compiled data_risk_register requirement makes it mandatory with NO flag (F5)', () => {
  const dir = repoWithChange({ data_risk_register: { required: true } });
  try { assert.equal(registerMandatory(dir, { flag: false }), true); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});

test('registerMandatory — dropping the flag does NOT weaken a compiled requirement', () => {
  const dir = repoWithChange({ data_risk_register: { required: true } });
  try {
    assert.equal(registerMandatory(dir, { flag: false }), true); // flag absent, still mandatory
    assert.equal(registerMandatory(dir, { flag: true }), true);  // flag present, still mandatory
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('registerMandatory — a generic repo (no compiled requirement) is not mandatory unless the flag tightens it', () => {
  const dir = repoWithChange({}); // no capability required
  try {
    assert.equal(registerMandatory(dir, { flag: false }), false); // generic — skip is allowed
    assert.equal(registerMandatory(dir, { flag: true }), true);   // manual tightening still works
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
// The D6 register resolves in either layout: a mounted register (adopted repo) or the bundled
// worked example (in-repo). In a BARE adoption neither exists, so skip cleanly rather than
// crashing at module load — the same "inert where the fixture is absent" pattern adopt.mjs and
// the brainkit tests use, so `adopt.mjs && node --test` is green with no hand-copied fixtures.
const REGISTER_DIR = [
  join(ROOT, 'docs/governance/data-risk-register'),
  join(ROOT, 'register-example'),
].find((d) => existsSync(join(d, 'controls.json')));
const BRAND_PATH = join(ROOT, 'discovery/brand/design.md');

if (!REGISTER_DIR) {
  test('discovery gate validator (data-risk register fixture absent — skipped in a bare adoption)', { skip: true }, () => {});
} else {

// Pick real, resolvable ids from the mounted register so D6 referential integrity passes.
const controls = JSON.parse(readFileSync(join(REGISTER_DIR, 'controls.json'), 'utf8'));
const CTRL = controls[0].control_id;
const taxonomy = JSON.parse(readFileSync(join(REGISTER_DIR, 'risk-taxonomy.json'), 'utf8'));
const DR = taxonomy[0].risk_category_id; // any resolvable category in the mounted register

const FM = 'design_profile: discovery/brand/design.md';

const FILES = {
  'research-log.md': `---\nartifact: research-log\n${FM}\n---\n## Signals\n| S-001 | care queue | revoke ack lag observed | pain | high |\n`,
  'synthesis.md': `---\nartifact: synthesis\n${FM}\n---\n## Themes\n| T-1 | revoke latency erodes trust | S-001 | regulatory + trust risk |\n## Prioritisation\n- **Method:** impact × reach ÷ effort\n`,
  'problem-statement.md': `---\nartifact: problem-statement\n${FM}\n---\n## The problem (falsifiable)\nFor a care agent (synthetic) handling a revoke, today acknowledgement lags, per S-001.\n## Target user\nCare agent, synthetic persona, during a consent revoke.\n## Success measures\n| Measure | Baseline | Target | How |\n| Revoke ack | 12s | under 5s | sim metric |\n## Stakeholders & scope (D3)\n| Care lead | in | owns the queue |\n- Out of scope (explicit): bulk export tooling\n`,
  'data-governance.md': `---\nartifact: data-governance\n${FM}\n---\n## Risk mapping\n| consent record | ${DR} | High | PDPL Art. 5 | ${CTRL} |\n## Residual-risk verdict (D6)\n- **Acceptable for delivery?** Conditional — monitor fee variance\n`,
  'prototype.md': `---\nartifact: prototype\n${FM}\nfidelity: low\nwireframe: wireframe.html\n---\n## What this prototype tests\n| Hypothesis | Region | Positive reaction |\n| H1 — revoke timeliness made visible | ack tile | "the number I chase blind" |\n`,
  'stakeholder-reaction.md': `---\nartifact: stakeholder-reaction\n${FM}\n---\n## Reactions\n| Hypothesis | Stakeholder | Verdict | Reaction | Signal |\n| H1 | care agent (synthetic) | confirmed | "the number I chase blind" | S-001 |\n`,
  'wireframe.html': `<!doctype html><html><head><!-- brand-profile: discovery/brand/design.md@v1 -->\n<style>body{font-family:"Inter","Helvetica Neue",Arial,sans-serif;background:#F7F8FA;color:#0B1221}.primary{background:#1F4DB8;color:#FFFFFF}</style></head><body>wireframe</body></html>`,
  'handoff.md': `---\nartifact: handoff\n${FM}\n---\n## Problem\nRevoke acknowledgement lags.\n## What delivery owns now\nDelivery authors the solution from the validated brief.\n`,
};

function makeRun(overrides = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'disc-run-'));
  const files = { ...FILES, ...overrides };
  for (const [name, content] of Object.entries(files)) {
    if (content === null) continue; // omit this artifact
    writeFileSync(join(dir, name), content);
  }
  return dir;
}

const OPTS = { registerDir: REGISTER_DIR, brandPath: BRAND_PATH };
const gateOf = (res, id) => res.gates.find((g) => g.id === id);

test('a complete run passes all gates', () => {
  const dir = makeRun();
  try {
    const res = validateRun(dir, OPTS);
    assert.ok(res.ok, 'expected ok; failures: ' + JSON.stringify(res.gates.filter((g) => g.status === 'fail')));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('D1 fails without a success measure', () => {
  const dir = makeRun({ 'problem-statement.md': FILES['problem-statement.md'].replace(/## Success measures[\s\S]*?## Stakeholders/, '## Success measures\n## Stakeholders') });
  try { assert.equal(gateOf(validateRun(dir, OPTS), 'D1').status, 'fail'); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});

test('D2 fails when a cited signal is undefined', () => {
  const dir = makeRun({ 'synthesis.md': FILES['synthesis.md'].replace('S-001', 'S-999') });
  try { assert.equal(gateOf(validateRun(dir, OPTS), 'D2').status, 'fail'); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});

test('D3 fails without stakeholders', () => {
  const dir = makeRun({ 'problem-statement.md': FILES['problem-statement.md'].replace(/\| Care lead \| in \| owns the queue \|/, '') });
  try { assert.equal(gateOf(validateRun(dir, OPTS), 'D3').status, 'fail'); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});

test('D4 fails on solutioning (an API route)', () => {
  const dir = makeRun({ 'problem-statement.md': FILES['problem-statement.md'] + '\nWe will add POST /consents to fix it.\n' });
  try { assert.equal(gateOf(validateRun(dir, OPTS), 'D4').status, 'fail'); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});

test('D5 fails without a prioritisation method', () => {
  const dir = makeRun({ 'synthesis.md': FILES['synthesis.md'].replace(/- \*\*Method:\*\*.*/, '') });
  try { assert.equal(gateOf(validateRun(dir, OPTS), 'D5').status, 'fail'); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});

test('D6 fails when a control id does not resolve', () => {
  const dir = makeRun({ 'data-governance.md': FILES['data-governance.md'].replace(CTRL, 'CTRL-DOES-NOT-EXIST') });
  try { assert.equal(gateOf(validateRun(dir, OPTS), 'D6').status, 'fail'); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});

// --- D6 regulatory-driver vocabulary is MOUNTED, not hardcoded (F7) ------------------------
// The built-in driver regex knows one jurisdiction's abbreviations. A document grounded only in
// a Shariah authority's pronouncements or a standard-setter's standards cited none of them and
// failed as "cites no regulatory driver" — about a document that was entirely citation. The
// vocabulary now mounts beside the register; the built-in regex is kept, so the mount can only
// ADD ways to pass.

/** A register directory copied from the mounted one, plus an optional reg-drivers.json. */
function registerWithDrivers(drivers) {
  const dir = mkdtempSync(join(tmpdir(), 'reg-'));
  for (const f of ['risk-taxonomy.json', 'risk-statements.json', 'controls.json', 'residual-risk.json']) {
    if (existsSync(join(REGISTER_DIR, f))) writeFileSync(join(dir, f), readFileSync(join(REGISTER_DIR, f)));
  }
  if (drivers) writeFileSync(join(dir, 'reg-drivers.json'), JSON.stringify(drivers, null, 2));
  return dir;
}

// A data-governance doc whose ONLY grounding is a vocabulary the built-in regex cannot see.
const SHARIAH_ONLY = `---\nartifact: data-governance\n${FM}\n---\n## Risk mapping\n`
  + `| profit presentation | ${DR} | High | HSA resolution; AAOIFI Shari'ah Standard No. 8 | ${CTRL} |\n`
  + '## Residual-risk verdict (D6)\n- **Acceptable for delivery?** Conditional — pending the recorded committee determination\n';

test('D6 fails a document grounded only in an unmounted vocabulary (the defect)', () => {
  const reg = registerWithDrivers(null); // no reg-drivers.json — built-in regex only
  const dir = makeRun({ 'data-governance.md': SHARIAH_ONLY });
  try {
    const g = gateOf(validateRun(dir, { ...OPTS, registerDir: reg }), 'D6');
    assert.ok(g.issues.includes('cites no regulatory driver'), 'expected the false negative: ' + JSON.stringify(g.issues));
  } finally { rmSync(dir, { recursive: true, force: true }); rmSync(reg, { recursive: true, force: true }); }
});

test('D6 accepts the same document once the vocabulary is MOUNTED (no gate edit)', () => {
  const reg = registerWithDrivers(['HSA', "AAOIFI Shari'ah Standard No."]);
  const dir = makeRun({ 'data-governance.md': SHARIAH_ONLY });
  try {
    const g = gateOf(validateRun(dir, { ...OPTS, registerDir: reg }), 'D6');
    assert.equal(g.status, 'pass', 'mounted drivers must resolve: ' + JSON.stringify(g.issues));
  } finally { rmSync(dir, { recursive: true, force: true }); rmSync(reg, { recursive: true, force: true }); }
});

test('D6 mounted terms are LITERALS — a regex metacharacter cannot widen the check', () => {
  // '.*' as a term must match the two characters, not everything. If it were compiled as a
  // pattern, an adopter could retire this gate by mounting one line.
  const reg = registerWithDrivers(['.*', 'HS.']);
  const dir = makeRun({ 'data-governance.md': SHARIAH_ONLY });
  try {
    const g = gateOf(validateRun(dir, { ...OPTS, registerDir: reg }), 'D6');
    assert.ok(g.issues.includes('cites no regulatory driver'), 'escaped literals must not match: ' + JSON.stringify(g.issues));
  } finally { rmSync(dir, { recursive: true, force: true }); rmSync(reg, { recursive: true, force: true }); }
});

test('D6 mounted terms cannot REMOVE the built-in drivers (mount only adds)', () => {
  const reg = registerWithDrivers([]); // an empty vocabulary is not a licence to drop PDPL
  const dir = makeRun(); // the default fixture cites "PDPL Art. 5"
  try { assert.equal(gateOf(validateRun(dir, { ...OPTS, registerDir: reg }), 'D6').status, 'pass'); }
  finally { rmSync(dir, { recursive: true, force: true }); rmSync(reg, { recursive: true, force: true }); }
});

test('D6 is unchanged when no reg-drivers.json is mounted (backward compatible)', () => {
  const reg = registerWithDrivers(null);
  const dir = makeRun();
  try { assert.equal(gateOf(validateRun(dir, { ...OPTS, registerDir: reg }), 'D6').status, 'pass'); }
  finally { rmSync(dir, { recursive: true, force: true }); rmSync(reg, { recursive: true, force: true }); }
});

// --- D6 residual verdict must be a WHOLE word (F7) -----------------------------------------
test('D6 rejects "Not yet." as a verdict (the "no" inside "Not" is not a decision)', () => {
  const dir = makeRun({
    'data-governance.md': FILES['data-governance.md'].replace('Conditional — monitor fee variance', 'Not yet. Two items are unresolved.'),
  });
  try {
    const g = gateOf(validateRun(dir, OPTS), 'D6');
    assert.equal(g.status, 'fail');
    assert.ok(g.issues.includes('no residual-risk verdict'), JSON.stringify(g.issues));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('D6 accepts a real negative verdict', () => {
  const dir = makeRun({
    'data-governance.md': FILES['data-governance.md'].replace('Conditional — monitor fee variance', 'No — escalated, and not deliverable until the determination is recorded'),
  });
  try { assert.equal(gateOf(validateRun(dir, OPTS), 'D6').status, 'pass'); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});

test('D6 skips when the register is not mounted (generic repo)', () => {
  const dir = makeRun();
  try { assert.equal(gateOf(validateRun(dir, { ...OPTS, register: null }), 'D6').status, 'skip'); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});

test('D6 FAILS (not skips) when the register is absent under a regulated profile', () => {
  const dir = makeRun();
  try {
    const g = gateOf(validateRun(dir, { ...OPTS, register: null, requireRegister: true }), 'D6');
    assert.equal(g.status, 'fail');
    assert.ok(g.issues.some((i) => /mandatory under the active regulated profile/.test(i)));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('D7 fails on a raw (non-token) colour in the wireframe', () => {
  const dir = makeRun({ 'wireframe.html': FILES['wireframe.html'].replace('#1F4DB8', '#ABCDEF') });
  try { assert.equal(gateOf(validateRun(dir, OPTS), 'D7').status, 'fail'); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});

test('D7 fails when a markdown artifact omits the design profile', () => {
  const dir = makeRun({ 'handoff.md': FILES['handoff.md'].replace(FM + '\n', '') });
  try { assert.equal(gateOf(validateRun(dir, OPTS), 'D7').status, 'fail'); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});

test('D8 fails without a prototype', () => {
  const dir = makeRun({ 'prototype.md': null });
  try { assert.equal(gateOf(validateRun(dir, OPTS), 'D8').status, 'fail'); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});

test('D8 fails when the wireframe asset is missing', () => {
  const dir = makeRun({ 'wireframe.html': null });
  try { assert.equal(gateOf(validateRun(dir, OPTS), 'D8').status, 'fail'); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});

test('D8 fails when the prototype claims delivery fidelity', () => {
  const dir = makeRun({ 'prototype.md': FILES['prototype.md'].replace('fidelity: low', 'fidelity: high') });
  try { assert.equal(gateOf(validateRun(dir, OPTS), 'D8').status, 'fail'); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});

// --- D8 over-specification reaches the whole prototype, not just the brief -----------------
// Regression: D8 scanned prototype.md alone, so the two surfaces where over-specification
// actually lands — the wireframe a stakeholder reacts to, and the spec JSON it renders from —
// were never checked. A wireframe could name an API route while D8 reported PASS.

test('D8 fails when the WIREFRAME over-specifies (an API route)', () => {
  const dir = makeRun({ 'wireframe.html': FILES['wireframe.html'].replace('<body>wireframe</body>', '<body>wireframe<p>Balances load from GET /accounts/{id}/balances</p></body>') });
  try {
    const g = gateOf(validateRun(dir, OPTS), 'D8');
    assert.equal(g.status, 'fail');
    assert.ok(g.issues.some((i) => /wireframe\.html \(over-specified\).*API route/.test(i)), 'expected the wireframe to be named as the source: ' + JSON.stringify(g.issues));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('D8 fails when the wireframe names a tech-stack choice', () => {
  const dir = makeRun({ 'wireframe.html': FILES['wireframe.html'].replace('<body>wireframe</body>', '<body>wireframe<p>Rendered in React against Postgres</p></body>') });
  try { assert.equal(gateOf(validateRun(dir, OPTS), 'D8').status, 'fail'); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});

test('D8 fails when the SPEC JSON over-specifies, even though the rendered wireframe is clean', () => {
  const dir = makeRun();
  try {
    mkdirSync(join(dir, 'specs'), { recursive: true });
    writeFileSync(join(dir, 'specs/wireframe.prototype.json'), JSON.stringify({ title: 'x', affordance: { label: 'y', text: 'Reads the openapi contract directly' } }, null, 2));
    const g = gateOf(validateRun(dir, OPTS), 'D8');
    assert.equal(g.status, 'fail');
    assert.ok(g.issues.some((i) => /specs\/wireframe\.prototype\.json \(over-specified\)/.test(i)), 'expected the spec file to be named: ' + JSON.stringify(g.issues));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('D8 does NOT fire on the renderer-generated <style> block (no false positive)', () => {
  // The renderer emits style/script from design.md tokens. A keyword there would be a renderer
  // defect, not a run's leak — scanning it would only teach authors to distrust the gate.
  const dir = makeRun({
    'wireframe.html': FILES['wireframe.html'].replace('</style>', '.endpoint{background:#1F4DB8}.node-graphql{color:#0B1221}</style>'),
  });
  try {
    const g = gateOf(validateRun(dir, OPTS), 'D8');
    assert.equal(g.status, 'pass', 'generated CSS must not trip the solutioning scan: ' + JSON.stringify(g.issues));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('D8 still passes a clean prototype with a rendered wireframe and a spec', () => {
  const dir = makeRun();
  try {
    mkdirSync(join(dir, 'specs'), { recursive: true });
    writeFileSync(join(dir, 'specs/wireframe.prototype.json'), JSON.stringify({ title: 'The moment the offer arrives', tiles: [{ label: 'Time to a decision', value: 'This session' }] }, null, 2));
    const res = validateRun(dir, OPTS);
    assert.equal(gateOf(res, 'D8').status, 'pass');
    assert.ok(res.ok, 'a clean run must stay green: ' + JSON.stringify(res.gates.filter((g) => g.status === 'fail')));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('D9 fails when the prototype was shown to no one (no reaction)', () => {
  const dir = makeRun({ 'stakeholder-reaction.md': null });
  try { assert.equal(gateOf(validateRun(dir, OPTS), 'D9').status, 'fail'); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});

test('D9 fails when a framing hypothesis has no recorded reaction', () => {
  // Prototype names H1 and H2, but only H1 was reacted to.
  const dir = makeRun({
    'prototype.md': FILES['prototype.md'].replace('| H1 — revoke timeliness made visible | ack tile | "the number I chase blind" |', '| H1 | ack tile | a |\n| H2 — drift indicator | drift row | b |'),
  });
  try { assert.equal(gateOf(validateRun(dir, OPTS), 'D9').status, 'fail'); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});

test('D9 fails when a reaction cites a signal not in the research log', () => {
  const dir = makeRun({ 'stakeholder-reaction.md': FILES['stakeholder-reaction.md'].replace('S-001', 'S-404') });
  try { assert.equal(gateOf(validateRun(dir, OPTS), 'D9').status, 'fail'); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});

test('D9 skips when there is no prototype to react to', () => {
  const dir = makeRun({ 'prototype.md': null });
  try { assert.equal(gateOf(validateRun(dir, OPTS), 'D9').status, 'skip'); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});
}
