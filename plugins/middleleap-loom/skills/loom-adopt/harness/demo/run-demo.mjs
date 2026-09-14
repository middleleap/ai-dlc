// The end-to-end demo (2.1.0, hardening plan row 2.13; PRD §10). Builds an adopted repository
// from this bundle in a scratch directory, mounts the Kosli provider against the record-and-
// replay FAKE (decision K8 — no org, no token), and walks the whole seam: select → record the
// anchor → post gate results → flush the outbox → read the trail back → the audit package →
// two deliberate refusals (a fabricated id, an unsigned envelope). Every step prints what it
// did and the script exits non-zero the moment a step does not behave as the canon says.
//
//   node demo/run-demo.mjs [--keep] [--real] [--scenario meridian]
//
// --real runs the same walk against a REAL org: it needs KOSLI_API_TOKEN, KOSLI_ORG in the
// environment and a real `kosli` on PATH (or KOSLI_BIN), and it records the outcome in
// docs/integration-run.md. Until someone has run it, that file says it is OWED — the fake proves
// the harness, never Kosli (core/kosli-fake.mjs header).
//
// --scenario meridian (docs/plans/kosli-founder-demo-briefing.md) adds the ONE obligation the
// founder demo traces: demo/meridian/ registers a Meridian Trust payment-status obligation, its
// register rows and a demo-scoped PAYMENT-STATUS control in the adopted tree; the team's first
// contract FAILS that check, a scripted repair fixes it, the rerun passes, and the gate record
// that Kosli receives carries the obligation id. The walk ends with scripts/record-join.mjs — the
// one inspectable join from mandate to external record.
//
// EVIDENCE LEGEND — every step is tagged with what kind of evidence it produces, so nothing on
// the screen is mistaken for more than it is:
//   [fixture]            prepared synthetic files copied into the scratch tree
//   [executed check]     a gate mechanism actually ran here, against those files
//   [scripted repair]    this script edited a file to stand in for an agent task — NOT a
//                        recorded agent run
//   [simulated provider] the record-and-replay fake answered as Kosli; nothing left this machine
//   [live provider]      --real: the official CLI against an org; the read-back is the proof
//   [refusal]            a deliberate negative case the harness must reject
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { generateKeyPairSync } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import process from 'node:process';

const H = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const real = argv.includes('--real');
const keep = argv.includes('--keep');
const scenario = argv.includes('--scenario') ? argv[argv.indexOf('--scenario') + 1] : null;
if (scenario && scenario !== 'meridian') { process.stderr.write(`unknown scenario ${scenario}; the only one is meridian\n`); process.exit(2); }
const meridian = scenario === 'meridian';
const A = mkdtempSync(join(tmpdir(), 'loom-demo-'));
// The per-run private key lives OUTSIDE the adopted tree: the secrets gate (Q4-SECRETS) scans the
// tree and its history, and a PEM block committed at step 5 would be a true finding.
const K = mkdtempSync(join(tmpdir(), 'loom-demo-key-'));
const PROVIDER = real ? 'live provider' : 'simulated provider';
let step = 0;
const say = (s, tag = null) => process.stdout.write(`\n[${String(++step).padStart(2, '0')}]${tag ? ` [${tag}]` : ''} ${s}\n`);
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
    M = JSON.parse(readFileSync(join(H, 'demo/meridian/obligation.json'), 'utf8'));
    say(`MERIDIAN — register the one obligation the demo traces: ${M.obligation.id} → ${M.register.control.control_id} → catalog control ${M.control.control_id} → ${M.control.mechanism_ref} (mandate ${M.mandate_ref})`, 'fixture');
    // The obligation joins the register the OBLIGATIONS gate already checks; its risk and control
    // join the data-risk register so the ids resolve; the control joins the adopted catalog with
    // its mechanism and test copied beside the other scripts. Nothing in the bundle's templates moves.
    { const ob = J('docs/governance/obligations.json'); ob.obligations.push(M.obligation); W('docs/governance/obligations.json', ob); }
    const R = 'docs/governance/data-risk-register';
    for (const [file, row] of [['risk-taxonomy.json', M.register.taxonomy], ['risk-statements.json', M.register.statement], ['controls.json', M.register.control], ['residual-risk.json', M.register.residual]]) { const rows = J(`${R}/${file}`); rows.push(row); W(`${R}/${file}`, rows); }
    { const cat = J('docs/governance/control-catalog.json'); cat.controls.push(M.control); W('docs/governance/control-catalog.json', cat); }
    cpSync(join(H, 'demo/meridian/payment-status-check.mjs'), join(A, 'scripts/payment-status-check.mjs'));
    cpSync(join(H, 'demo/meridian/payment-status-check.test.mjs'), join(A, 'scripts/payment-status-check.test.mjs'));
    cpSync(join(H, 'demo/meridian/payment-status-tests.json'), join(A, 'docs/governance/evidence/payment-status-tests.json'));
    node(['scripts/obligations-check.mjs'], { quiet: true });
    node(['scripts/control-catalog-check.mjs'], { quiet: true });
    process.stdout.write(`     obligation and catalog gates accept the registration; owner_role ${M.obligation.owner_role} resolves to a human in the registry\n`);
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

    say('MERIDIAN — repair: timeout → unknown, status query before any retry, retry idempotent on the original reference. This script writes the fix; it stands in for the agent task and is labelled as such', 'scripted repair');
    cpSync(join(H, 'demo/meridian/status-contract.repaired.json'), join(A, 'docs/governance/services/payment-initiation.status-contract.json'));

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
  rmSync(K, { recursive: true, force: true });
  if (!keep) rmSync(A, { recursive: true, force: true });
}
