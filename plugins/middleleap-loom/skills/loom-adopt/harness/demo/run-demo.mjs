// The end-to-end demo (2.1.0, hardening plan row 2.13; PRD §10). Builds an adopted repository
// from this bundle in a scratch directory, mounts the Kosli provider against the record-and-
// replay FAKE (decision K8 — no org, no token), and walks the whole seam: select → record the
// anchor → post gate results → flush the outbox → read the trail back → the audit package →
// two deliberate refusals (a fabricated id, an unsigned envelope). Every step prints what it
// did and the script exits non-zero the moment a step does not behave as the canon says.
//
//   node demo/run-demo.mjs [--keep] [--real]
//
// --real runs the same walk against a REAL org: it needs KOSLI_API_TOKEN, KOSLI_ORG in the
// environment and a real `kosli` on PATH (or KOSLI_BIN), and it records the outcome in
// docs/integration-run.md. Until someone has run it, that file says it is OWED — the fake proves
// the harness, never Kosli (core/kosli-fake.mjs header).
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { generateKeyPairSync } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import process from 'node:process';

const H = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const real = argv.includes('--real');
const keep = argv.includes('--keep');
const A = mkdtempSync(join(tmpdir(), 'loom-demo-'));
let step = 0;
const say = (s) => process.stdout.write(`\n[${String(++step).padStart(2, '0')}] ${s}\n`);
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
  say(`adopt the bundle into ${A} (tier full) and copy the worked examples`);
  node([join(H, 'adopt.mjs'), '--dest', A, '--tier', 'full'], { quiet: true });
  mkdirSync(join(A, 'docs/governance/changes'), { recursive: true });
  cpSync(join(H, 'change-example'), join(A, 'docs/governance/changes/CHG-2026-0042'), { recursive: true });
  cpSync(join(H, 'change-pattern-example'), join(A, 'docs/governance/changes/CHG-2026-0055'), { recursive: true });
  cpSync(join(H, 'register-example'), join(A, 'docs/governance/data-risk-register'), { recursive: true });
  mkdirSync(join(A, 'docs/governance/evidence'), { recursive: true });
  for (const f of ['tests.json', 'reviews.json', 'lineage.json', 'model-provenance.json', 'control-plane.json', 'sast.sarif', 'sbom.cdx.json', 'dependency-audit.json', 'provenance.json', 'manifest.json', 'release-subject.json']) if (existsSync(join(H, 'evidence-example', f))) cpSync(join(H, 'evidence-example', f), join(A, f === 'release-subject.json' ? 'docs/governance/release-subject.json' : `docs/governance/evidence/${f}`));
  cpSync(join(H, 'product-eval-example'), join(A, 'product-eval-example'), { recursive: true });
  cpSync(join(H, 'product-eval-example/product-evals.json'), join(A, 'docs/governance/product-evals.json'));
  if (existsSync(join(A, 'CODEOWNERS'))) writeFileSync(join(A, 'CODEOWNERS'), readFileSync(join(A, 'CODEOWNERS'), 'utf8').replace(/@your-org\//g, '@demo-bank/'));

  say('choose providers for the four roles the high-tier change requires (PS-R06 fires until this is done)');
  const ps = node(['scripts/provider-selection-check.mjs'], { expect: 1, quiet: true });
  if (!/PS-R06: .*external_record/.test(ps.stderr)) fail('PS-R06 did not name external_record before a provider was chosen');
  for (const f of ['sca/snyk.json', 'hardened-runtime/chainguard.json', 'real-data-controls/kms-field-encryption.json', 'external-record/kosli.json']) cpSync(join(A, 'docs/governance/adapters/providers', f), join(A, 'docs/governance/adapters', f.split('/')[1]));
  const sel = (role, provider, adapter_id) => ({ role, provider, adapter_id, decided_by: 'infosec-noor', decided_at: '2026-09-13', source: 'mt-tech-2026' });
  W('docs/governance/provider-selection.json', { selections: [sel('sca', 'snyk', 'snyk-sca'), sel('hardened-runtime', 'chainguard', 'chainguard-runtime'), sel('real-data-controls', 'kms-field-encryption', 'kms-field-encryption'), sel('external-record', 'kosli', 'kosli-external-record')] });
  if (real) { const k = J('docs/governance/adapters/kosli.json'); k.config.org = process.env.KOSLI_ORG || k.config.org; W('docs/governance/adapters/kosli.json', k); }
  node(['scripts/provider-selection-check.mjs']);

  say(real ? 'REAL org: kosli from PATH/KOSLI_BIN, token from KOSLI_API_TOKEN' : 'mount the record-and-replay fake as the kosli binary (decision K8)');
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
    respond(fake.dir, ['get', 'snapshot'], { stdout: [{ artifact: 'demo-bank/credit:1.4.2', fingerprint: J('docs/governance/release-subject.json').artifact?.digest?.replace(/^sha256:/, '') || 'ab'.repeat(32), flow: 'loom-delivery', replicas: 2, running_since: '2026-09-13T00:00:00Z' }] });
  }

  say('a per-run signing key: the private half lives in memory only; the public half joins the issuers registry');
  const keys = generateKeyPairSync('ed25519');
  const keyPath = join(A, '.demo-key.pem');
  writeFileSync(keyPath, keys.privateKey.export({ type: 'pkcs8', format: 'pem' }));
  const reg = J('docs/governance/attestation-issuers.json');
  reg.issuers.push({ id: 'demo-record-signer', mechanism: 'ed25519', description: 'demo per-run record signer', verify: { public_key: keys.publicKey.export({ type: 'spki', format: 'pem' }).toString() } });
  W('docs/governance/attestation-issuers.json', reg);
  const sign = ['--actor', 'agent-loom-delivery', '--record-issuer', 'demo-record-signer', '--record-key', keyPath];

  say('git init + base commit, then re-derive and re-sign the evidence bundle at that commit (rc.36)');
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

  say('the seal gate REFUSES while the provider is mounted and the anchor is only in the tree');
  const before = node(['scripts/evidence-seal-check.mjs'], { expect: 1, quiet: true, env });
  if (!/carries no external_record id/.test(before.stderr)) fail('the seal gate did not ask for the external record id');

  say('record the anchor: seal-evidence --record-only posts the signed seal-anchor envelope and writes the id on the manifest');
  node(['scripts/seal-evidence.mjs', '--record-only', ...sign], { env });
  const xr = J('docs/governance/evidence/manifest.json').external_record;
  if (!xr?.id) fail('no external_record on the manifest');

  say('the seal gate resolves the id at the provider and passes; the release-attestation gate is untouched');
  node(['scripts/evidence-seal-check.mjs'], { env });
  node(['scripts/release-attestation-check.mjs'], { env });

  say('post every pr-lane gate result to the trail (gate-runner --record), keeping a copy beside the evidence');
  const gr = node(['core/gate-runner.mjs', '--lane', 'pr', '--record', ...sign, '--emit-dir', 'docs/governance/evidence', '--out', '.demo-gate-run.json'], { expect: null, env, quiet: true });
  const rec = J('.demo-gate-run.json').external_record;
  process.stdout.write(`     ${rec.posted.length} recorded, ${rec.queued.length} queued, ${rec.rejected.length} rejected (lane ${J('.demo-gate-run.json').result}, exit ${gr.status})\n`);
  if (rec.rejected.length) fail(`rejected: ${rec.rejected[0].findings[0]}`);

  say('flush the outbox (empty when every post succeeded) and read the trail back: expected vs present');
  node(['scripts/record-flush-outbox.mjs'], { env });
  node(['scripts/record-trail-status.mjs', 'CHG-2026-0042'], { expect: null, env });

  say('compile the route policy and the record types from the catalog; render them in the provider\'s form; verify them');
  node(['scripts/record-policy-compile.mjs', '--render'], { env });
  node(['scripts/record-types-compile.mjs', '--render'], { env });
  node(['scripts/record-policy-compile.mjs', '--verify']);
  node(['scripts/record-types-compile.mjs', '--verify']);

  say('the deploy lane reads what is RUNNING from the provider snapshot, and says so');
  const dd = node(['scripts/deployed-digest-check.mjs'], { expect: 0, env });
  if (!/confirmed RUNNING/.test(dd.stdout)) fail('the deploy gate did not read the provider snapshot');

  say('the provenance gate over every kept envelope, and the audit package for the change');
  node(['scripts/provenance-check.mjs'], { env });
  node(['scripts/record-audit.mjs', 'CHG-2026-0042', '--out', 'docs/governance/audit'], { expect: null, env });

  say('DELIBERATE FAILURE 1 — a fabricated record id on the manifest is refused for being unknown to the provider');
  const mp = join(A, 'docs/governance/evidence/manifest.json');
  const m = readFileSync(mp, 'utf8'); writeFileSync(mp, m.replace(xr.id, 'forged'));
  const forged = node(['scripts/evidence-seal-check.mjs'], { expect: 1, quiet: true, env });
  if (!/does NOT hold anchor id forged/.test(forged.stderr)) fail('the forged id was refused, but not for being unknown');
  writeFileSync(mp, m);
  process.stdout.write('     refused: the platform does not hold the id\n');

  say('DELIBERATE FAILURE 2 — an unsigned envelope is refused before it leaves the tree (nothing posted, manifest untouched)');
  const unsigned = node(['scripts/seal-evidence.mjs', '--record-only', '--actor', 'agent-loom-delivery'], { expect: 3, quiet: true, env });
  if (!/unsigned/.test(unsigned.stderr)) fail('the unsigned envelope was refused, but not for being unsigned');
  if (readFileSync(mp, 'utf8') !== m) fail('a refused record rewrote the manifest');
  process.stdout.write('     refused: PR rules run before any post\n');

  if (real) {
    say('record the integration run');
    const md = `# Integration run — ${new Date().toISOString()}\n\nRan demo/run-demo.mjs --real against org ${process.env.KOSLI_ORG || '(KOSLI_ORG unset)'}.\nAnchor recorded as ${xr.id}; ${rec.posted.length} gate records posted; forged id refused; unsigned envelope refused.\n\nFill activation_evidence in docs/governance/adapters/kosli.json from this run.\n`;
    writeFileSync(join(H, 'docs/integration-run.md'), md);
  }
  process.stdout.write(`\nDEMO OK — ${step} steps${keep ? `; tree kept at ${A}` : ''}\n`);
} finally {
  rmSync(join(A, '.demo-key.pem'), { force: true });
  if (!keep) rmSync(A, { recursive: true, force: true });
}
