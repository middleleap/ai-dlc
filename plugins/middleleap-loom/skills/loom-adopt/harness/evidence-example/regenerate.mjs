// Re-derive and re-sign the evidence bundle IN AN ADOPTED TREE (rc.36, flow-plan Phase 2b).
//
// WHY THIS EXISTS. The committed worked example is signed by the bundle's demo key and bound to a
// fictional commit — and rc.36 closed both holes: the unified attestation stack refuses a
// `demo: true` issuer everywhere (D3), and the seal gate requires `release_commit` to exist in
// the repository and be an ancestor of HEAD (D5). So the static example can no longer pass the
// live gates, ON PURPOSE — it demonstrates the refusal. What CI (and a real adopter) needs is
// the example re-derived at a real commit and re-signed by a real, per-run, NON-demo key:
//
//   1 · stamp the sealed tests.json to the release commit (the semantics bind it),
//   2 · re-derive the manifest with scripts/seal-evidence.mjs (hash → order → chain → anchor →
//       self-verify; the collector refuses to write anything the gate would reject),
//   3 · generate a fresh ed25519 pair, register the PUBLIC half as a non-demo issuer in the
//       adopted attestation-issuers registry, sign the new anchor, discard the private half,
//   4 · stamp docs/governance/release-subject.json's source.commit so the cross-binding holds,
//   5 · re-sign any assurance-cycle records that were demo-signed, with the same per-run key,
//   6 · self-verify the whole result and refuse to finish dirty.
//
// THE KEYS ARE FRESH ON EVERY RUN AND NEVER WRITTEN TO DISK — the same rule as
// approval-attestation-example/regenerate.mjs and the platform-activation observer: only public
// halves reach the registry, so the bundle never ships usable trust material. The COMMITTED
// example in this directory is deliberately left demo-signed and is never touched by this script.
//
//   node evidence-example/regenerate.mjs [--dest <adopted-repo-root>] [--issuer ci-anchor-signer]
//
// Run it from an adopted tree (or point --dest at one) AFTER the release commit exists — the
// evidence binds to HEAD, so seal AFTER committing the release, then commit the sealed manifest.
import { generateKeyPairSync, sign as edSign } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { main as sealEvidence } from '../scripts/seal-evidence.mjs';
import { verifyReleaseCommit } from '../scripts/evidence-seal-check.mjs';
import { verifyAnchorAttestation, verifySignatureOver } from '../core/attestations.mjs';
import { cycleHash } from '../scripts/assurance-cycle-check.mjs';
import { readdirSync } from 'node:fs';

const argv = process.argv.slice(2);
const arg = (name, dflt) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : dflt; };
const dest = resolve(arg('--dest', process.cwd()));
const issuerId = arg('--issuer', 'ci-anchor-signer');

const J = (p) => JSON.parse(readFileSync(p, 'utf8'));
const W = (p, o) => writeFileSync(p, `${JSON.stringify(o, null, 2)}\n`);
const die = (msg) => { process.stderr.write(`regenerate: ${msg}\n`); process.exit(2); };

const evidenceDir = `${dest}/docs/governance/evidence`;
const registryPath = `${dest}/docs/governance/attestation-issuers.json`;
if (!existsSync(evidenceDir)) die(`no evidence directory at ${evidenceDir} — run this in an adopted tree (or pass --dest); the committed example is never regenerated in place`);
if (!existsSync(registryPath)) die(`no attestation-issuers registry at ${registryPath} — the anchor signature needs a registry to be verified against`);

let commit;
try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dest, encoding: 'utf8' }).trim(); }
catch { die('the destination is not a git checkout — the evidence binds to a real commit (D5), so there is nothing honest to stamp'); }

// 1 · The sealed tests.json binds to the release commit (seal semantics); stamp before chaining.
const testsPath = `${evidenceDir}/tests.json`;
if (existsSync(testsPath)) {
  const tests = J(testsPath);
  tests.commit = commit;
  W(testsPath, tests);
}

// 2 · Re-derive the manifest through the collector — it hashes, orders, chains, anchors and
// self-verifies with the gate's own evaluate(), and REFUSES to write on any finding.
if (sealEvidence(['--commit', commit], dest) !== 0) die('seal-evidence refused the bundle — fix what the artifacts report; nothing was re-signed');

// 3 · A fresh, per-run, NON-demo anchor signer. Public half into the registry; private half dies
// with this process.
const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const registry = J(registryPath);
registry.issuers = (registry.issuers || []).filter((i) => i.id !== issuerId);
registry.issuers.push({
  id: issuerId,
  mechanism: 'ed25519',
  description: 'Per-run anchor signer registered by evidence-example/regenerate.mjs — public half only; the private key was generated for one run and discarded',
  verify: { public_key: publicKey.export({ type: 'spki', format: 'pem' }).toString() },
});
W(registryPath, registry);

const manifestPath = `${evidenceDir}/manifest.json`;
const manifest = J(manifestPath);
manifest.attestation = { issuer: issuerId, signature: edSign(null, Buffer.from(manifest.anchor, 'utf8'), privateKey).toString('base64') };
W(manifestPath, manifest);

// 4 · The release subject must name the same source commit or the cross-binding gate refuses.
const subjectPath = `${dest}/docs/governance/release-subject.json`;
if (existsSync(subjectPath)) {
  const subject = J(subjectPath);
  if (subject.source) { subject.source.commit = commit; W(subjectPath, subject); }
}

// 5 · Assurance cycles shipped demo-signed: re-sign each record's canonical hash with the
// per-run key (custody of the signature changes; the record and its confirmed_by do not).
const cyclesDir = `${dest}/docs/governance/assurance-cycles`;
const resigned = [];
if (existsSync(cyclesDir)) {
  for (const name of readdirSync(cyclesDir).filter((n) => n.endsWith('.json'))) {
    const p = `${cyclesDir}/${name}`;
    const cycle = J(p);
    if (!cycle.attestation) continue;
    cycle.attestation = { ...cycle.attestation, issuer: issuerId, signature: edSign(null, Buffer.from(cycleHash(cycle), 'utf8'), privateKey).toString('base64') };
    W(p, cycle);
    resigned.push(name);
  }
}

// 6 · Self-verify — a regeneration that leaves any of it unverifiable must not finish quietly.
const anchorFindings = verifyAnchorAttestation(J(manifestPath), J(registryPath));
if (anchorFindings.length) die(`the re-signed anchor does not verify: ${anchorFindings.join('; ')}`);
const commitCheck = verifyReleaseCommit(commit, dest);
if (commitCheck.status === 'failed') die(`release commit ${commit} failed D5 verification: ${commitCheck.findings.join('; ')}`);
for (const name of resigned) {
  const cycle = J(`${cyclesDir}/${name}`);
  const f = verifySignatureOver(cycleHash(cycle), cycle.attestation, J(registryPath), `cycle ${name}`);
  if (f.length) die(`re-signed assurance cycle ${name} does not verify: ${f.join('; ')}`);
}

process.stdout.write(
  `regenerated at ${commit.slice(0, 12)}: anchor ${manifest.anchor.slice(0, 12)}… signed by ${issuerId} (non-demo, per-run key discarded)\n`
  + `  release-subject source.commit ${existsSync(subjectPath) ? 'stamped' : 'absent — skipped'}\n`
  + `  assurance cycles re-signed: ${resigned.length ? resigned.join(', ') : 'none present'}\n`
  + 'commit the results — the evidence is part of the release record.\n',
);
