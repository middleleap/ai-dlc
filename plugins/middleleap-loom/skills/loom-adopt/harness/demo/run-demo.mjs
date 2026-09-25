// The end-to-end demo (2.1.0, hardening plan row 2.13; PRD §10). Builds an adopted repository
// from this bundle in a scratch directory, mounts the Kosli provider against the record-and-
// replay FAKE (decision K8 — no org, no token), and walks the whole seam: select → record the
// anchor → post gate results → flush the outbox → read the trail back → the audit package →
// two deliberate refusals (a fabricated id, an unsigned envelope). Every step prints what it
// did and the script exits non-zero the moment a step does not behave as the canon says.
//
//   node demo/run-demo.mjs [--keep] [--real] [--scenario meridian] [--pause]
//
// --pause is presenter mode: the walk stops after every step and waits for Enter before the next
// one, so the person at the keyboard sets the pace and the audience reads each result before the
// screen moves. `q` stops the walk (the tree is kept only with --keep). Pausing needs a terminal:
// without one (CI, a pipe) the flag is announced and ignored, so no run can ever block.
//
// --real runs the same walk against a REAL org: it needs KOSLI_API_TOKEN, KOSLI_ORG in the
// environment and a real `kosli` on PATH (or KOSLI_BIN), and it records the outcome in
// docs/integration-run.md. Until someone has run it, that file says it is OWED — the fake proves
// the harness, never Kosli (core/kosli-fake.mjs header).
//
// --scenario meridian (docs/plans/kosli-founder-demo-briefing.md) adds the ONE obligation the
// founder demo traces: demo/meridian/ registers a Meridian Trust payment-status obligation, its
// register rows and a demo-scoped PAYMENT-STATUS control in the adopted tree; the team's first
// contract FAILS that check, the output of a RECORDED bounded agent run (demo/meridian/agent-run/,
// digest-bound) repairs it, the rerun passes, and the gate record that Kosli receives carries the
// obligation id. The walk ends with scripts/record-join.mjs — the
// one inspectable join from mandate to external record.
//
// EVIDENCE LEGEND — every step is tagged with what kind of evidence it produces, so nothing on
// the screen is mistaken for more than it is:
//   [fixture]            prepared synthetic files copied into the scratch tree
//   [executed check]     a gate mechanism actually ran here, against those files
//   [recorded agent run] the output of a bounded agent task that was run once and kept
//                        (task, transcript, output, digests); replayed here, not re-executed
//   [simulated provider] the record-and-replay fake answered as Kosli; nothing left this machine
//   [live provider]      --real: the official CLI against an org; the read-back is the proof
//   [refusal]            a deliberate negative case the harness must reject
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, readSync, rmSync, writeFileSync } from 'node:fs';
import { generateKeyPairSync } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import process from 'node:process';

const H = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const real = argv.includes('--real');
const keep = argv.includes('--keep');
const pauseAsked = argv.includes('--pause');
const pause = pauseAsked && Boolean(process.stdin.isTTY);
const scenario = argv.includes('--scenario') ? argv[argv.indexOf('--scenario') + 1] : null;
if (scenario && scenario !== 'meridian') { process.stderr.write(`unknown scenario ${scenario}; the only one is meridian\n`); process.exit(2); }
const meridian = scenario === 'meridian';
const A = mkdtempSync(join(tmpdir(), 'loom-demo-'));
// The per-run private key lives OUTSIDE the adopted tree: the secrets gate (Q4-SECRETS) scans the
// tree and its history, and a PEM block committed at step 5 would be a true finding.
const K = mkdtempSync(join(tmpdir(), 'loom-demo-key-'));
const PROVIDER = real ? 'live provider' : 'simulated provider';
let step = 0;
const cleanup = () => { rmSync(K, { recursive: true, force: true }); if (!keep) rmSync(A, { recursive: true, force: true }); };
// Presenter mode: block on the terminal until Enter; `q` ends the walk cleanly (key deleted, tree
// kept only with --keep). Synchronous on purpose — every step below is synchronous too.
const waitForPresenter = () => {
  process.stdout.write('\n     ⏎ next step · q stop  ');
  // One line per pause, read byte by byte so queued keystrokes are not swallowed in a single read.
  // A zero-byte read (Ctrl-D, or stdin gone) counts as Enter: a closed terminal degrades to the
  // unpaused walk rather than ending it — only a typed `q` stops.
  const bytes = [];
  for (;;) {
    const b = Buffer.alloc(1);
    let n = 0;
    try { n = readSync(0, b, 0, 1, null); } catch { n = 0; }
    if (n === 0 || b[0] === 0x0a) break;
    bytes.push(b[0]);
  }
  const typed = Buffer.from(bytes).toString('utf8').trim().toLowerCase();
  if (typed === 'q') { process.stdout.write(`\nstopped by the presenter after step ${step}${keep ? `; tree kept at ${A}` : ''}\n`); cleanup(); process.exit(0); }
};
const say = (s, tag = null) => {
  if (pause && step > 0) waitForPresenter();
  process.stdout.write(`\n[${String(++step).padStart(2, '0')}]${tag ? ` [${tag}]` : ''} ${s}\n`);
};
const fail = (s) => { process.stderr.write(`\nDEMO FAILED at step ${step}: ${s}\n`); process.exit(1); };
const run = (cmd, args, { expect = 0, env = {}, quiet = false } = {}) => {
  const r = spawnSync(cmd, args, { cwd: A, encoding: 'utf8', env: { ...process.env, ...env } });
  if (!quiet) { if (r.stdout) process.stdout.write(r.stdout.split('\n').filter(Boolean).slice(-6).map((l) => `     ${l}\n`).join('')); }
  if (expect !== null && r.status !== expect) fail(`${[cmd, ...args].join(' ')} exited ${r.status}, expected ${expect}\n${r.stderr}`);
  return r;
};
const node = (args, o) => run(process.execPath, args, o);
const J = (p) => JSON.parse(readFileSync(join(A, p), 'utf8'));
const W = (p, o) => writeFileSync(join(A, p), JSON.stringify(o, null, 2) + '\n');

if (pauseAsked && !pause) process.stdout.write('--pause needs a terminal on stdin; none here, so the walk runs without stopping\n');
if (pause) process.stdout.write(`presenter mode: the walk stops after every step — Enter runs the next one, q stops${keep ? '' : ' (add --keep to keep the tree on stop)'}\n`);

try {
  say(`adopt the bundle into ${A} (tier full) and copy the worked examples — the same set the CI dry-run stages, so the pr lane is GREEN and every failure below is a deliberate one`, 'fixture');
  node([join(H, 'adopt.mjs'), '--dest', A, '--tier', 'full'], { quiet: true });
  mkdirSync(join(A, 'docs/governance/changes'), { recursive: true });
  cpSync(join(H, 'change-example'), join(A, 'docs/governance/changes/CHG-2026-0042'), { recursive: true });
  cpSync(join(H, 'change-pattern-example'), join(A, 'docs/governance/changes/CHG-2026-0055'), { recursive: true });
  cpSync(join(H, 'register-example'), join(A, 'docs/governance/data-risk-register'), { recursive: true });
  mkdirSync(join(A, 'docs/governance/evidence'), { recursive: true });
  // Every evidence-example JSON, as validate.yml does: the model manifest cites four eval reports
  // by digest (HG-0006), and a hand-picked list left them behind.
  for (const f of readdirSync(join(H, 'evidence-example'))) if (/\.(json|sarif)$/.test(f)) cpSync(join(H, 'evidence-example', f), join(A, f === 'release-subject.json' ? 'docs/governance/release-subject.json' : `docs/governance/evidence/${f}`));
  cpSync(join(H, 'product-eval-example'), join(A, 'product-eval-example'), { recursive: true });
  cpSync(join(H, 'product-eval-example/product-evals.json'), join(A, 'docs/governance/product-evals.json'));
  // The worked operating model (OPERATING-MODEL) and the AI governance trio with their evidence
  // (AI-GOVERNANCE, AI-FAIRNESS, AI-EXPLAINABILITY) replace the ADOPT-placeholder templates.
  cpSync(join(H, 'operating-model-example/operating-model.json'), join(A, 'docs/governance/operating-model.json'));
  for (const f of ['ai-governance.json', 'fairness-evaluations.json', 'decision-contestability.json']) cpSync(join(H, 'ai-governance-example', f), join(A, 'docs/governance', f));
  cpSync(join(H, 'ai-governance-example/ai-evidence'), join(A, 'docs/governance/ai-evidence'), { recursive: true });
  // An empty backlog is a notice, not a finding (HG-0007); the installer ships none on purpose.
  writeFileSync(join(A, 'docs/backlog.yaml'), 'milestones: []\n');
  // The shipped obligations are ILLUSTRATIVE and fail under a regulated profile by design; the
  // demo stands in for the compliance function exactly as the CI dry-run does.
  { const ob = J('docs/governance/obligations.json'); for (const x of ob.obligations) { x.illustrative = false; x.article = 'demo fixture — stands in for the compliance function\'s verified citation'; } W('docs/governance/obligations.json', ob); }
  if (existsSync(join(A, 'CODEOWNERS'))) writeFileSync(join(A, 'CODEOWNERS'), readFileSync(join(A, 'CODEOWNERS'), 'utf8').replace(/@your-org\//g, '@demo-bank/'));

  let M = null; // the Meridian scenario, when chosen
  if (meridian) {
    const { mountMeridian } = await import(pathToFileURL(join(H, 'demo/meridian/mount.mjs')).href);
    M = { obligation: JSON.parse(readFileSync(join(H, 'demo/meridian/obligation.json'), 'utf8')).obligation };
    say('MERIDIAN — mount the scenario: the Meridian brand, its discovery portfolio (six runs; the walk follows two), the Open Finance obligations and their register rows, and the one demo-scoped control. The bundle\'s templates do not move', 'fixture');
    const ids = mountMeridian(A);
    M.ids = ids;
    node(['scripts/obligations-check.mjs'], { quiet: true });
    node(['scripts/control-catalog-check.mjs'], { quiet: true });
    process.stdout.write(`     obligations: ${ids.obligations.join(', ')}\n     traced end to end: ${ids.obligation} → ${ids.registerControl} → ${ids.control} → ${ids.mechanism} (mandate ${ids.mandate})\n     the obligations and catalog gates accept the rows; every owner_role resolves to a human in the registry\n`);
    { const P = JSON.parse(readFileSync(join(H, 'demo/meridian/portfolio/portfolio.json'), 'utf8'));
      process.stdout.write(`     portfolio: ${P.runs.map((r) => `${r.slug} (${r.status}, ${r.strategic_intent})`).join(' · ')}\n`); }

    say('MERIDIAN · DISCOVER — the run cross-bank-money: research log → synthesis → problem statement → data-governance feasibility (citing the Open Finance obligations by id) → prototype → stakeholder reaction → hand-off. D1–D9, under the Meridian brand', 'executed check');
    const v = node(['discovery/gates/validate.mjs', 'discovery/runs/cross-bank-money', '--register', 'docs/governance/data-risk-register', '--brand', 'discovery/brand/design.md', '--obligations', 'docs/governance/obligations.json'], { expect: 0, quiet: true });
    for (const l of v.stdout.split('\n').filter((l) => /\[(PASS|FAIL|SKIP)\]/.test(l))) process.stdout.write(`     ${l.trim()}\n`);
    if ((v.stdout.match(/\[PASS\]/g) || []).length !== 9) fail('the discovery run is not green on all nine gates');
    process.stdout.write('     wireframe: discovery/runs/cross-bank-money/wireframe.html (open it — Meridian brand, synthetic numbers, H3 greyed)\n');

    say('MERIDIAN · DISCOVER — the sponsor\'s app idea, written into the problem statement as if it were the answer, is REFUSED by D4 (no-solutioning boundary). The problem is named; the build is not', 'refusal');
    {
      const p = join(A, 'discovery/runs/cross-bank-money/problem-statement.md');
      const original = readFileSync(p, 'utf8');
      writeFileSync(p, original + '\n\nWe will build the PFM app on a new transfers endpoint with a React front end.\n');
      const r = node(['discovery/gates/validate.mjs', 'discovery/runs/cross-bank-money', '--register', 'docs/governance/data-risk-register', '--brand', 'discovery/brand/design.md', '--obligations', 'docs/governance/obligations.json'], { expect: null, quiet: true });
      writeFileSync(p, original);
      const d4 = r.stdout.split('\n').filter((l) => /D4|endpoint|tech-stack/.test(l));
      if (r.status === 0 || !d4.some((l) => /FAIL/.test(l))) fail('D4 did not refuse the solutioning sentence');
      for (const l of d4) process.stdout.write(`     ${l.trim()}\n`);
      process.stdout.write('     refused, then restored: discovery names the problem; delivery owns the solution\n');
    }

    say('MERIDIAN · DISCOVER — the alternative ending: cross-bank-money-stopped. Same signals, a customer panel that refuted the trust hypothesis, and a STOP recorded by a human product owner — the record Kosli would receive as discovery-stopped', 'executed check');
    const vs = node(['discovery/gates/validate.mjs', 'discovery/runs/cross-bank-money-stopped', '--register', 'docs/governance/data-risk-register', '--brand', 'discovery/brand/design.md', '--obligations', 'docs/governance/obligations.json'], { expect: 0, quiet: true });
    process.stdout.write(`     ${(vs.stdout.match(/\[PASS\]/g) || []).length} gates pass; no hand-off exists for this run\n`);
    const { readOutcome, discoveryStoppedRecord } = await import(pathToFileURL(join(H, 'core/loop-attestations.mjs')).href);
    const rec = discoveryStoppedRecord('cross-bank-money-stopped', readOutcome(join(A, 'discovery/runs/cross-bank-money-stopped')));
    process.stdout.write(`     discovery-stopped: decided by ${rec.decided_by} (human) · ${rec.hypotheses.map((h) => `${h.id} ${h.verdict}`).join(', ')}\n     reason: ${String(rec.reason).slice(0, 140)}…\n`);
  }

  say('choose providers for the five roles the high-tier AI change requires (PS-R06 fires until this is done)', 'executed check');
  const ps = node(['scripts/provider-selection-check.mjs'], { expect: 1, quiet: true });
  if (!/PS-R06: .*external_record/.test(ps.stderr)) fail('PS-R06 did not name external_record before a provider was chosen');
  for (const f of ['sca/snyk.json', 'hardened-runtime/chainguard.json', 'runtime-guardrails/gateway-policy-enforcement.json', 'real-data-controls/kms-field-encryption.json', 'external-record/kosli.json']) cpSync(join(A, 'docs/governance/adapters/providers', f), join(A, 'docs/governance/adapters', f.split('/')[1]));
  const sel = (role, provider, adapter_id) => ({ role, provider, adapter_id, decided_by: 'infosec-noor', decided_at: '2026-09-13', source: 'mt-tech-2026' });
  W('docs/governance/provider-selection.json', { selections: [sel('sca', 'snyk', 'snyk-sca'), sel('hardened-runtime', 'chainguard', 'chainguard-runtime'), sel('runtime-guardrails', 'gateway-policy-enforcement', 'gateway-policy-enforcement'), sel('real-data-controls', 'kms-field-encryption', 'kms-field-encryption'), sel('external-record', 'kosli', 'kosli-external-record')] });
  if (real) { const k = J('docs/governance/adapters/kosli.json'); k.config.org = process.env.KOSLI_ORG || k.config.org; W('docs/governance/adapters/kosli.json', k); }
  node(['scripts/provider-selection-check.mjs']);

  say(real ? 'REAL org: kosli from PATH/KOSLI_BIN, token from KOSLI_API_TOKEN' : 'mount the record-and-replay fake as the kosli binary (decision K8) — from here every provider answer is canned; the harness is being proved, not Kosli', PROVIDER);
  const env = { LOOM_RUNNER_REPOSITORY: 'demo-bank/credit', LOOM_RUNNER_REF: 'refs/heads/main' };
  if (!real) {
    const { createFakeKosli, respond } = await import(pathToFileURL(join(H, 'core/kosli-fake.mjs')).href);
    const fake = createFakeKosli(join(A, '.demo-fake'));
    env.KOSLI_BIN = fake.bin;
    // The fake answers `get trail` with an id for EVERY name the harness will post, so the
    // read-back path is exercised; and it holds exactly one attestation id for the anchor.
    const names = ['seal-anchor', 'risk-class', ...J('docs/governance/control-catalog.json').controls.filter((c) => typeof c.mechanism_ref === 'string' && c.mechanism_ref.endsWith('.mjs') && c.execute !== false && ['pr', 'release'].includes(c.lane || 'pr')).map((c) => `gate.${c.mechanism_ref.replace(/\.mjs$/, '').replace(/[\\/]/g, '-')}`)];
    const rows = names.map((n, i) => ({ attestation_name: n, attestation_type: 'generic', attestation_id: `att-${i + 1}`, status: 'COMPLETE', is_compliant: true, unexpected: false }));
    // The discovery trails hold only discovery records — a trail-specific rule wins over the generic one below,
    // so the read-back for a run never shows gate rows that belong to the change's trail.
    const drow = (n, i) => ({ attestation_name: n, attestation_type: 'generic', attestation_id: `att-d${i + 1}`, status: 'COMPLETE', is_compliant: true, unexpected: false });
    respond(fake.dir, ['get', 'trail', 'cross-bank-money'], { stdout: { name: 'cross-bank-money', compliance_status: { status: 'COMPLETE', is_compliant: true, attestations_statuses: ['intent', 'problem-selected', 'npa-pack', 'npa-approved.pa1', 'reopened-discovery.OPS-2026-0912'].map(drow) } } });
    respond(fake.dir, ['get', 'trail', 'cross-bank-money-stopped'], { stdout: { name: 'cross-bank-money-stopped', compliance_status: { status: 'COMPLETE', is_compliant: true, attestations_statuses: ['intent', 'discovery-stopped'].map(drow) } } });
    respond(fake.dir, ['get', 'trail'], { stdout: { name: 'CHG-2026-0042', compliance_status: { status: 'COMPLETE', is_compliant: true, attestations_statuses: rows } } });
    respond(fake.dir, ['get', 'attestation', '--attestation-id', 'att-1'], { stdout: { attestation_name: 'seal-anchor', attestation_type: 'generic', is_compliant: true, created_at: 1, html_url: 'https://app.kosli.com/demo' } });
    respond(fake.dir, ['get', 'attestation', '--attestation-id', 'forged'], { exit: 1, stderr: 'Error: attestation not found' });
    if (meridian) {
      // The join resolves the PAYMENT-STATUS record by id, so the fake must hold that one too.
      const i = names.indexOf('gate.scripts-payment-status-check');
      if (i < 0) fail('PAYMENT-STATUS is not in the adopted catalog');
      respond(fake.dir, ['get', 'attestation', '--attestation-id', `att-${i + 1}`], { stdout: { attestation_name: 'gate.scripts-payment-status-check', attestation_type: 'generic', is_compliant: true, created_at: 1, html_url: `https://app.kosli.com/demo/att-${i + 1}` } });
    }
    respond(fake.dir, ['get', 'snapshot'], { stdout: [{ artifact: 'demo-bank/credit:1.4.2', fingerprint: J('docs/governance/release-subject.json').artifact?.digest?.replace(/^sha256:/, '') || 'ab'.repeat(32), flow: 'loom-delivery', replicas: 2, running_since: '2026-09-13T00:00:00Z' }] });
  }

  say('a per-run signing key: the private half is written outside the adopted tree and deleted at exit; the public half joins the issuers registry', 'fixture');
  const keys = generateKeyPairSync('ed25519');
  const keyPath = join(K, 'demo-key.pem');
  writeFileSync(keyPath, keys.privateKey.export({ type: 'pkcs8', format: 'pem' }));
  const reg = J('docs/governance/attestation-issuers.json');
  reg.issuers.push({ id: 'demo-record-signer', mechanism: 'ed25519', description: 'demo per-run record signer', verify: { public_key: keys.publicKey.export({ type: 'spki', format: 'pem' }).toString() } });
  W('docs/governance/attestation-issuers.json', reg);
  const sign = ['--actor', 'agent-loom-delivery', '--record-issuer', 'demo-record-signer', '--record-key', keyPath];

  if (meridian) {
    say(`MERIDIAN — the AI-assisted team's first cut of the payment-initiation timeout contract: a timeout is reported as FAILED and retried automatically. The check refuses it`, 'executed check');
    mkdirSync(join(A, 'docs/governance/services'), { recursive: true });
    cpSync(join(H, 'demo/meridian/status-contract.first-cut.json'), join(A, 'docs/governance/services/payment-initiation.status-contract.json'));
    const first = node(['scripts/payment-status-check.mjs'], { expect: 1, quiet: true });
    const lines = first.stderr.split('\n').filter((l) => l.startsWith('FINDING'));
    if (!lines.some((l) => /PSI-R02/.test(l)) || !lines.some((l) => /PSI-R04/.test(l))) fail('the first cut was refused, but not for the two reasons the obligation names');
    for (const l of lines) process.stdout.write(`     ${l}\n`);
    process.stdout.write('     refused: the acceptance condition is executable, and the team\'s reading of it was wrong\n');

    {
      const runRec = JSON.parse(readFileSync(join(H, 'demo/meridian/agent-run/run.json'), 'utf8'));
      say(`MERIDIAN — repair: the output of a recorded bounded agent run (${runRec.ran_at}, ${runRec.transcript.tool_calls} tool calls; task, transcript and output kept under demo/meridian/agent-run/). Replayed from the record, not re-executed live; the check below IS re-executed`, 'recorded agent run');
      const { createHash } = await import('node:crypto');
      const outPath = join(H, 'demo/meridian', runRec.output.ref);
      const bytes = readFileSync(outPath);
      if (createHash('sha256').update(bytes).digest('hex') !== runRec.output.sha256) fail('the recorded agent output does not match the digest in run.json — the record has been edited since the run');
      const taskBytes = readFileSync(join(H, 'demo/meridian', runRec.task.ref));
      if (createHash('sha256').update(taskBytes).digest('hex') !== runRec.task.sha256) fail('the recorded task does not match the digest in run.json');
      writeFileSync(join(A, 'docs/governance/services/payment-initiation.status-contract.json'), bytes);
      process.stdout.write(`     output sha256:${runRec.output.sha256.slice(0, 12)}… matches run.json; model ${runRec.model.configured} (declared, not attested)\n`);
      for (const l of readFileSync(join(H, 'demo/meridian', runRec.transcript.ref), 'utf8').split('\n').filter((l) => l.startsWith('- `'))) process.stdout.write(`     ${l.slice(0, 150)}${l.length > 150 ? '…' : ''}\n`);
    }

    say('MERIDIAN — rerun the same check over the repaired contract and its recorded negative-test evidence (digest-bound); it passes, and prints its own boundary', 'executed check');
    const again = node(['scripts/payment-status-check.mjs'], { expect: 0, quiet: true });
    if (!/PSI-R06/.test(again.stdout)) fail('the boundary notice did not print');
    process.stdout.write(`     ${again.stdout.split('\n').filter(Boolean).join('\n     ')}\n`);
    node(['--test', 'scripts/payment-status-check.test.mjs'], { quiet: true, env: { PAYMENT_STATUS_FIXTURES: join(H, 'demo/meridian') } });
    process.stdout.write('     the control\'s own negative test (test_ref) passes in the adopted tree\n');
  }

  say('git init + base commit, then re-derive and re-sign the evidence bundle at that commit (rc.36)', 'fixture');
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: A });
  execFileSync('git', ['-c', 'user.email=demo@loom.invalid', '-c', 'user.name=loom-demo', 'add', '-A'], { cwd: A });
  execFileSync('git', ['-c', 'user.email=demo@loom.invalid', '-c', 'user.name=loom-demo', 'commit', '-qm', 'base'], { cwd: A });
  node([join(H, 'evidence-example/regenerate.mjs'), '--dest', A], { quiet: true });
  const releaseCommit = J('docs/governance/evidence/manifest.json').release_commit;
  env.LOOM_RUNNER_SHA = releaseCommit;
  // A deployment record for the deploy lane (as an adopter's deploy job writes it), bound to the
  // re-derived release commit; the fake's snapshot answers with the authorized digest running.
  mkdirSync(join(A, 'docs/governance/deployments'), { recursive: true });
  mkdirSync(join(A, 'docs/governance/services'), { recursive: true });
  // The service readiness record the deploy lane checks the rollout against, its drills signed
  // per run by a fresh observer key (the same shape the CI dry-run builds; a bare date is deprecated).
  rmSync(join(A, 'docs/governance/services/example-service.json'), { force: true });
  {
    const canonical = (v) => Array.isArray(v) ? `[${v.map(canonical).join(',')}]` : (v && typeof v === 'object') ? `{${Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canonical(v[k])).join(',')}}` : JSON.stringify(v);
    const { createHash, sign } = await import('node:crypto');
    const t = JSON.parse(readFileSync(join(H, 'governance/service-readiness.template.json'), 'utf8'));
    const ok = generateKeyPairSync('ed25519');
    const today = new Date().toISOString();
    const observe = (note, attempted) => {
      const rec = { observed_at: today, observation: { note }, negative_test: { attempted, result: 'rejected', tested_at: today }, observer_identity: 'ops-dana' };
      const h = createHash('sha256').update(canonical(rec)).digest('hex');
      rec.attestation = { issuer: 'demo-drill-observer', signature: sign(null, Buffer.from(h, 'utf8'), ok.privateKey).toString('base64') };
      return rec;
    };
    t.bcp_dr.last_exercised = observe('failover to the secondary region in 42m', 'promotion of a stale replica');
    t.rollback.last_drilled = observe('rolled back to vN-1 in 6m', 'writes against the rolled-back schema');
    t.kill_switch.last_tested = observe('decisioning drained to the manual queue in 90s', 'traffic routed through the killed path');
    t.capacity.last_run = observe('2x peak sustained for 1h', 'load beyond the declared ceiling');
    t.progressive_delivery.automated_rollback.last_tested = observe('error-rate breach at 12% auto-reverted', 'ramp advanced while the trigger SLO was breaching');
    W('docs/governance/services/credit-origination.json', t);
    const r2 = J('docs/governance/attestation-issuers.json');
    r2.issuers.push({ id: 'demo-drill-observer', mechanism: 'ed25519', verify: { public_key: ok.publicKey.export({ type: 'spki', format: 'pem' }).toString() } });
    W('docs/governance/attestation-issuers.json', r2);
  }
  if (existsSync(join(H, 'exposure-example/feature-flags.json'))) cpSync(join(H, 'exposure-example/feature-flags.json'), join(A, 'docs/governance/feature-flags.json'));
  const dep = JSON.parse(readFileSync(join(H, 'exposure-example/deployment.json'), 'utf8'));
  dep.release_commit = releaseCommit;
  W('docs/governance/deployments/DEP-2026-0042-01.json', dep);

  if (meridian) {
    const signOnly = sign.slice(2); // the issuer and the key; the actor is named per record — these are human records
    say('MERIDIAN · the record BEFORE code exists — intent (the sponsor\'s own words, po-fatima) and problem-selected (a human choice among H1–H3, the D4 refusal on record) on the discovery trail cross-bank-money; discovery-stopped on the stopped run\'s trail. Each is built from the run\'s own artifact, never typed, and passes the same provenance rules as a gate record', PROVIDER);
    node(['scripts/discovery-attest.mjs', 'intent', '--run', 'cross-bank-money', ...signOnly], { env });
    node(['scripts/discovery-attest.mjs', 'problem-selected', '--run', 'cross-bank-money', '--actor', 'po-fatima', ...signOnly], { env });
    node(['scripts/discovery-attest.mjs', 'discovery-stopped', '--run', 'cross-bank-money-stopped', ...signOnly], { env });

    say('MERIDIAN · the NPA is the content of PA1 — npa-pack (the Business Proposition Form READ: 33 fields, request type New, the obligations it cites by id, its digest) and npa-approved.pa1 (the committee\'s permission to develop with six conditions, attested by the approver) on the same trail', PROVIDER);
    if (!M.ids.npaForm) fail('the NPA form was not mounted — the sibling plugin middleleap-banking-uae is not beside this bundle');
    const np = node(['scripts/discovery-attest.mjs', 'npa-pack', '--run', 'cross-bank-money', '--actor', 'po-fatima', '--proposition', 'NPA-2026-CBM-001', '--json', ...signOnly], { env, quiet: true });
    const npj = JSON.parse(np.stdout);
    const kept = J(npj.kept);
    process.stdout.write(`     npa-pack: ${kept.payload.product?.slice(0, 60)}… · request ${kept.payload.request_type} · ${kept.payload.fields_present}/${kept.payload.fields_expected} fields · ${kept.payload.status} · obligations ${kept.payload.obligations_cited.length} · sha256 ${kept.payload.form_sha256.slice(0, 12)}… · ${npj.result.status}${npj.result.id ? ` as ${npj.result.id}` : ''}\n`);
    if (kept.payload.status !== 'complete' || !kept.controls?.institution?.includes('OB-AE-OFR-CONSENT-001')) fail('the npa-pack record is not complete or does not carry the cited obligations');
    node(['scripts/discovery-attest.mjs', 'npa-approved', '--run', 'cross-bank-money', ...signOnly], { env });

    say('MERIDIAN · REFUSED — the delivery agent tries to record the PA1 approval itself; a decision needs a human actor, and the record is never built, let alone posted', 'refusal');
    const bad = node(['scripts/discovery-attest.mjs', 'npa-approved', '--run', 'cross-bank-money', '--actor', 'agent-loom-delivery', ...signOnly], { expect: 2, env, quiet: true });
    if (!/human/.test(bad.stderr)) fail(`the agent's approval was not refused for being non-human: ${bad.stderr}`);
    process.stdout.write(`     refused: ${bad.stderr.trim().split('\n')[0].slice(0, 150)}\n`);
  }

  say('the seal gate REFUSES while the provider is mounted and the anchor is only in the tree', 'refusal');
  const before = node(['scripts/evidence-seal-check.mjs'], { expect: 1, quiet: true, env });
  if (!/carries no external_record id/.test(before.stderr)) fail('the seal gate did not ask for the external record id');

  say('record the anchor: seal-evidence --record-only posts the signed seal-anchor envelope and writes the id on the manifest', PROVIDER);
  node(['scripts/seal-evidence.mjs', '--record-only', ...sign], { env });
  const xr = J('docs/governance/evidence/manifest.json').external_record;
  if (!xr?.id) fail('no external_record on the manifest');

  say('the seal gate resolves the id at the provider and passes; the release-attestation gate is untouched', PROVIDER);
  node(['scripts/evidence-seal-check.mjs'], { env });
  node(['scripts/release-attestation-check.mjs'], { env });

  say(`post every pr-lane gate result to the trail (gate-runner --record), keeping a copy beside the evidence${meridian ? ' — including PAYMENT-STATUS, whose record carries the obligation id' : ''}`, PROVIDER);
  const gr = node(['core/gate-runner.mjs', '--lane', 'pr', '--record', ...sign, '--emit-dir', 'docs/governance/evidence', '--out', '.demo-gate-run.json'], { expect: null, env, quiet: true });
  const rec = J('.demo-gate-run.json').external_record;
  process.stdout.write(`     ${rec.posted.length} recorded, ${rec.queued.length} queued, ${rec.rejected.length} rejected (lane ${J('.demo-gate-run.json').result}, exit ${gr.status})\n`);
  if (rec.rejected.length) fail(`rejected: ${rec.rejected[0].findings[0]}`);
  {
    const run = J('.demo-gate-run.json');
    const red = run.executed.filter((x) => x.status !== 'pass');
    if (run.result !== 'pass' || red.length) fail(`the pr lane is not green: ${red.map((x) => `${x.controls.join(',')} (${x.mechanism})`).join('; ') || run.result} — the demo stages the CI dry-run's fixture set, so a red gate here is a regression, not colour`);
    process.stdout.write(`     lane ${run.result}: ${run.executed.length} mechanisms executed, ${run.skipped.length} skipped with a reason\n`);
    if (meridian) {
      const ps = existsSync(join(A, 'docs/governance/evidence/records/CHG-2026-0042-gate.scripts-payment-status-check.json')) ? J('docs/governance/evidence/records/CHG-2026-0042-gate.scripts-payment-status-check.json') : null;
      if (!ps) fail('no kept envelope for the PAYMENT-STATUS gate');
      if (!(ps.controls?.institution || []).includes(M.obligation.id)) fail(`the PAYMENT-STATUS record does not carry ${M.obligation.id} (controls.institution = ${JSON.stringify(ps.controls?.institution)})`);
      process.stdout.write(`     PAYMENT-STATUS record: result ${ps.payload.result}, controls.institution ${JSON.stringify(ps.controls.institution)}, actor ${ps.actor.id} (${ps.actor.kind}), runner ${ps.runner.subject}, ${ps.record.status} as ${ps.record.id || '—'}\n`);
    }
  }

  say('flush the outbox (empty when every post succeeded) and read the trail back: expected vs present', PROVIDER);
  node(['scripts/record-flush-outbox.mjs'], { env });
  node(['scripts/record-trail-status.mjs', 'CHG-2026-0042'], { expect: null, env });

  say('compile the route policy and the record types from the catalog; render them in the provider\'s form; verify them', 'executed check');
  node(['scripts/record-policy-compile.mjs', '--render'], { env });
  node(['scripts/record-types-compile.mjs', '--render'], { env });
  node(['scripts/record-policy-compile.mjs', '--verify']);
  node(['scripts/record-types-compile.mjs', '--verify']);

  say('the deploy lane reads what is RUNNING from the provider snapshot, and says so', PROVIDER);
  const dd = node(['scripts/deployed-digest-check.mjs'], { expect: 0, env });
  if (!/confirmed RUNNING/.test(dd.stdout)) fail('the deploy gate did not read the provider snapshot');

  if (meridian) {
    say('MERIDIAN · the record AFTER deploy — an operations signal (OPS-2026-0912: with the view in use, customers still cannot tell whether a transfer completed) is routed discovery by operations (ops-dana); reopened-discovery posts on the cross-bank-money trail, attributed to CHG-2026-0042. The loop closes on the record, not on a slide', PROVIDER);
    node(['scripts/operations-signal-check.mjs'], { quiet: true });
    node(['scripts/discovery-attest.mjs', 'reopened-discovery', '--run', 'cross-bank-money', '--signal', 'OPS-2026-0912', '--actor', 'ops-dana', ...sign.slice(2)], { env });
    node(['scripts/record-trail-status.mjs', 'cross-bank-money', '--flow', 'discovery'], { expect: null, env });
  }

  say('the provenance gate over every kept envelope, and the audit package for the change', 'executed check');
  node(['scripts/provenance-check.mjs'], { env });
  node(['scripts/record-audit.mjs', 'CHG-2026-0042', '--out', 'docs/governance/audit'], { expect: null, env });

  say('DELIBERATE FAILURE 1 — a fabricated record id on the manifest is refused for being unknown to the provider', 'refusal');
  const mp = join(A, 'docs/governance/evidence/manifest.json');
  const m = readFileSync(mp, 'utf8'); writeFileSync(mp, m.replace(xr.id, 'forged'));
  const forged = node(['scripts/evidence-seal-check.mjs'], { expect: 1, quiet: true, env });
  if (!/does NOT hold anchor id forged/.test(forged.stderr)) fail('the forged id was refused, but not for being unknown');
  writeFileSync(mp, m);
  process.stdout.write('     refused: the platform does not hold the id\n');

  say('DELIBERATE FAILURE 2 — an unsigned envelope is refused before it leaves the tree (nothing posted, manifest untouched)', 'refusal');
  const unsigned = node(['scripts/seal-evidence.mjs', '--record-only', '--actor', 'agent-loom-delivery'], { expect: 3, quiet: true, env });
  if (!/unsigned/.test(unsigned.stderr)) fail('the unsigned envelope was refused, but not for being unsigned');
  if (readFileSync(mp, 'utf8') !== m) fail('a refused record rewrote the manifest');
  process.stdout.write('     refused: PR rules run before any post\n');

  if (meridian) {
    say(`MERIDIAN — the join: one inspectable record from mandate to external record (scripts/record-join.mjs CHG-2026-0042 --obligation ${M.obligation.id})`, real ? 'live provider' : 'simulated provider');
    node(['scripts/record-join.mjs', 'CHG-2026-0042', '--obligation', M.obligation.id, '--out', 'docs/governance/audit'], { expect: 0, env });
  }

  if (real) {
    say('record the integration run');
    const md = `# Integration run — ${new Date().toISOString()}\n\nRan demo/run-demo.mjs --real against org ${process.env.KOSLI_ORG || '(KOSLI_ORG unset)'}.\nAnchor recorded as ${xr.id}; ${rec.posted.length} gate records posted; forged id refused; unsigned envelope refused.\n\nFill activation_evidence in docs/governance/adapters/kosli.json from this run.\n`;
    writeFileSync(join(H, 'docs/integration-run.md'), md);
  }
  process.stdout.write(`\nDEMO OK — ${step} steps${keep ? `; tree kept at ${A}` : ''}\n`);
} finally {
  cleanup();
}
