// Stage the adapter-evidence worked example into a repository root, and generate the signed
// observations that make `scripts/adapter-evidence-check.mjs` VERIFY something instead of counting
// declarations.
//
//   node adapter-evidence-example/observe.mjs --dest <root>
//   node adapter-evidence-example/observe.mjs --dest <root> --borrow        # AD-R13
//   node adapter-evidence-example/observe.mjs --dest <root> --self-attest   # AD-R19 / AD-R20 / AD-R18
//   node adapter-evidence-example/observe.mjs --dest <root> --stale 5       # AD-R21 / AD-R23
//   node adapter-evidence-example/observe.mjs --dest <root> --self-declare  # AD-R09
//
// WHY THE OBSERVATIONS ARE GENERATED AND NOT COMMITTED. Two reasons, and each on its own would be
// enough.
//
//   FRESHNESS. `notion-pa-decision` tightens its window to three days. A committed, statically
//   dated record would verify for three days and then fail every build afterwards for a reason
//   with nothing to do with the change under review — at which point somebody deletes it and the
//   gate goes back to reporting `no adapters mounted`, which is the vacuum this directory exists
//   to close. `drift-example/observe.mjs` made the same call for the same reason.
//
//   KEYS. An observation is only worth verifying if a registered issuer signed it, and AD-R17
//   refuses a `"demo": true` anchor outright — so unlike `approval-attestation-example/`, this
//   example cannot ship a marked-and-refused public half and still demonstrate an ACTIVE stream.
//   The key has to be real. A real key committed to the bundle is a live root of trust in every
//   repository that copied it, and this bundle shipped one once and removed it. So each pair is
//   generated in memory here, the public half is written only into the staging root, and the
//   private half is never serialised at all. `adapter-evidence-example/` contains no key material
//   in any form; its `docs/governance/attestation-issuers.json` ships with an empty `issuers`
//   array and a comment saying why.
//
// TWO DESTINATIONS, AND THE RULE THAT SEPARATES THEM. A BARE ROOT (no identity registry, no
// catalog, no issuer registry) gets the whole example: four declarations, both registries, and a
// forge observation so the delegated stream has something to delegate TO. An EXISTING REPOSITORY
// gets only the two directories this example owns — `docs/governance/adapters/` (additively) and
// `docs/governance/adapter-evidence/`. It is not this script's business to seed a second-line-owned
// identity registry, to add controls to somebody's catalog, or to file forge observations into a
// repository that has its own platform-activation story.
//
// WHAT IT REFUSES TO STAGE, AND WHY IT SAYS SO. Three collisions, each printed with its reason,
// because a staging script that silently dropped a stream would produce a smaller, greener report
// than the repository deserves — the same class of lie as a vacuous gate.
//
//   · AN ADAPTER_ID ALREADY MOUNTED WITH DIFFERENT CONTENT. Overwriting it is a real decision with
//     consequences beyond this gate: `scripts/adapter-evidence-check.test.mjs` asserts that the
//     SHIPPED reference adapters read as pre-D5.3 (`stream === false`), and it finds them at
//     `docs/governance/adapters/` when run from an adopted layout. Replacing
//     `github-branch-protection.json` there with its D5.3 form turns that test red. So the upgrade
//     is never done behind the operator's back.
//   · A CONTROL ALREADY CLAIMED BY A DIFFERENT ADAPTER — AD-R05. Two adapters claiming one control
//     make their evidence interchangeable, which is finding F4 re-entered from the other side.
//   · A CONTROL THE DESTINATION CATALOG DOES NOT CARRY. `scripts/adapter-check.mjs` refuses it as a
//     mapping to nothing. `notion-activation` names FLOOR-SEAM, which the harness deliberately does
//     not ship; `--add-floor-seam-control` models the adopting institution adding its own.
import { generateKeyPairSync, sign as edSign } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { verifySignatureOver } from '../core/attestations.mjs';
import { evidenceHash, evidenceRecord } from '../core/floor-adapters.mjs';
import { activationHash } from '../scripts/platform-activation-check.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = `${HERE}/docs/governance`;
const SEAM_OBSERVER = 'infosec-noor';
const SEAM_ISSUER = 'seam-observer-noor';
const FORGE_OBSERVER = 'padmin-zoe';
const FORGE_ISSUER = 'forge-observer-zoe';
const DAY = 86_400_000;

const J = (p) => JSON.parse(readFileSync(p, 'utf8'));
const W = (p, o) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, `${JSON.stringify(o, null, 2)}\n`); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const say = (s) => process.stdout.write(`${s}\n`);
const die = (s) => { process.stderr.write(`${s}\n`); process.exit(2); };

// Generated in memory, public half only. The private key is never written, never printed, never
// returned — it exists inside this process and is collected when it exits.
const keypair = () => {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  return { pem: publicKey.export({ type: 'spki', format: 'pem' }).toString(), sign: (payload) => edSign(null, Buffer.from(payload, 'utf8'), privateKey).toString('base64') };
};

// ── Where to stage ───────────────────────────────────────────────────────────────────────────────
const destArg = opt('--dest');
if (!destArg) {
  die('usage: node adapter-evidence-example/observe.mjs --dest <root> [--add-floor-seam-control] [--borrow|--self-attest|--stale <days>|--self-declare]\n'
    + '\n--dest is REQUIRED and never defaults to the working directory: this script writes dated,\n'
    + 'signed records and public keys, and none of that belongs in a git tree meant to stay clean.');
}
const DEST = resolve(destArg);
// Refuse to write into the bundle itself. The Loom harness root is the one carrying the installer
// and its manifest — an adopted repo has neither, so this identifies the bundle without banning the
// legitimate `--dest <adopted-root>` case where the example sits one level down inside it.
if (existsSync(`${DEST}/copy-manifest.json`) && existsSync(`${DEST}/adopt.mjs`)) {
  die(`refusing to stage into ${DEST}: that is the Loom harness bundle, and generated evidence must never land in it. Stage into a scratch directory or an adopted repository root.`);
}
if (DEST === HERE || DEST.startsWith(`${HERE}/`)) {
  die(`refusing to stage into ${DEST}: that is inside the example itself. The committed fixtures are the declaration half; everything dated or signed lives outside the tree.`);
}

const G = `${DEST}/docs/governance`;
const REGISTRIES = ['identities.json', 'control-catalog.json', 'attestation-issuers.json'];
const bareRoot = REGISTRIES.every((n) => !existsSync(`${G}/${n}`));
mkdirSync(`${G}/adapters`, { recursive: true });
mkdirSync(`${G}/adapter-evidence`, { recursive: true });

say(bareRoot
  ? `  destination BARE ROOT — seeding the whole example (registries, four declarations, both observations)`
  : `  destination EXISTING REPOSITORY — augmenting docs/governance/adapters/ and adapter-evidence/ only; its registries, catalog and platform-activation records are its own`);

for (const name of REGISTRIES) {
  if (!bareRoot) continue;
  W(`${G}/${name}`, J(`${FIXTURES}/${name}`));
  say(`  seeded      ${name} — from the example fixtures`);
}

const catalog = existsSync(`${G}/control-catalog.json`) ? J(`${G}/control-catalog.json`) : null;
if (flag('--add-floor-seam-control') && catalog && !catalog.controls.some((c) => c.control_id === 'FLOOR-SEAM')) {
  // The adopting institution's act, modelled — not the harness's. core/floor-adapters.mjs is explicit
  // that FLOOR-SEAM is a control the institution adds and owns, so this is opt-in and never default.
  catalog.controls.push(J(`${FIXTURES}/control-catalog.json`).controls.find((c) => c.control_id === 'FLOOR-SEAM'));
  W(`${G}/control-catalog.json`, catalog);
  say('  added       FLOOR-SEAM to the destination catalog (--add-floor-seam-control) — the adopting institution\'s own control, so stream 4 can mount');
}
// A destination with no catalog at all leaves adapter-check lenient, so nothing is refused on that
// ground; `null` here means "cannot rule anything out", not "carries every control".
const controlIds = catalog ? new Set(catalog.controls.map((c) => c.control_id)) : null;

// ── Stage the declarations, refusing the three collisions and naming each ────────────────────────
const mountedById = new Map();
const mountedByControl = new Map();
for (const name of readdirSync(`${G}/adapters`).filter((n) => n.endsWith('.json'))) {
  const a = (() => { try { return J(`${G}/adapters/${name}`); } catch { return null; } })();
  if (!a?.adapter_id) continue;
  mountedById.set(a.adapter_id, a);
  if (a.satisfies_control) mountedByControl.set(a.satisfies_control, a.adapter_id);
}

const staged = new Set();
for (const name of readdirSync(`${FIXTURES}/adapters`).sort()) {
  const a = J(`${FIXTURES}/adapters/${name}`);
  const sitting = mountedById.get(a.adapter_id);
  if (sitting && !same(sitting, a)) {
    say(`  SKIPPED     ${a.adapter_id} — a DIFFERENT declaration with this adapter_id is already mounted (${JSON.stringify(sitting.mechanism ?? 'no mechanism — pre-D5.3')}). Replacing it is an adopter's deliberate upgrade, not a staging side effect: scripts/adapter-evidence-check.test.mjs asserts the shipped reference adapters still read as pre-D5.3 from this very directory, and overwriting one turns that test red.`);
    continue;
  }
  const holder = mountedByControl.get(a.satisfies_control);
  if (holder && holder !== a.adapter_id) {
    say(`  SKIPPED     ${a.adapter_id} — ${a.satisfies_control} is already claimed by the mounted adapter ${JSON.stringify(holder)}. Mounting both is AD-R05: one control claimed twice makes the two streams' evidence interchangeable.`);
    continue;
  }
  if (controlIds && !controlIds.has(a.satisfies_control)) {
    say(`  SKIPPED     ${a.adapter_id} — the destination catalog carries no ${JSON.stringify(a.satisfies_control)} control, so scripts/adapter-check.mjs would refuse it as a mapping to nothing.${a.satisfies_control === 'FLOOR-SEAM' ? ' The seam\'s own liveness is a control an adopting institution must add and own; pass --add-floor-seam-control to model that.' : ''}`);
    continue;
  }
  W(`${G}/adapters/${name}`, a);
  staged.add(a.adapter_id);
  say(`  staged      ${a.adapter_id} → ${a.satisfies_control} (${a.mechanism}, verified by ${a.activation_source})`);
}

if (!staged.has('notion-pa-decision')) {
  die('\nnotion-pa-decision was not staged, so there is nothing to observe and the gate would go back to\ncounting declarations. That stream names PA-GATES, which every shipped catalog carries — a\ndestination that refused it is not the layout this example was written for.');
}

// ── The seam observation — the one this gate verifies itself ─────────────────────────────────────
// No clock is consulted by the gate; the instant lives in the record. Everything dated here is
// dated NOW, which is the whole reason this is a script and not a committed file.
const staleDays = flag('--stale') ? Number(opt('--stale', '5')) : 0;
const at = () => new Date(Date.now() - staleDays * DAY).toISOString();
const probe = (negative, attempted) => ({ negative, attempted, result: 'rejected', tested_at: at() });

const record = evidenceRecord({
  adapterId: 'notion-pa-decision',
  // The borrow, made concrete: HG-0002 belongs to github-codeowners-hold. A record naming it is the
  // F4 substitution itself — a release-hold refusal offered as proof that a human decided.
  control: flag('--borrow') ? 'HG-0002' : 'PA-GATES',
  mechanism: 'human_decision_assertion',
  observation: {
    surface: 'notion',
    workspace_id: 'ws_3f9a2c',
    data_source_id: 'ds_approvals_1',
    window_hours: 24,
    decisions_seen: 6,
    authenticated_decisions: 3,
    bot_authored_dropped: 2,
    unregistered_subject_dropped: 1,
  },
  bypassTests: [
    probe('agent-or-bot-approval', 'submitted a PA1 approval as the integration bot svc-floor-bridge'),
    probe('unregistered-human', 'submitted a PA1 approval as a workspace guest with no identity-map entry'),
    probe('replay', 'resubmitted a previously accepted decision payload with its original nonce'),
    probe('post-decision-mutation', 'edited the approved decision row after the attestation was transcribed'),
  ],
  // Self-attestation, made concrete: the bridge is named in this stream's `observes_identities`, it
  // is an agent, and it is in `builders`. Three independent refusals, all of them correct.
  observedBy: flag('--self-attest') ? 'svc-floor-bridge' : SEAM_OBSERVER,
  observedAt: at(),
});

const seamKey = keypair();
record.attestation = {
  issuer: SEAM_ISSUER,
  // Sign AFTER every mutation, deliberately. An unsigned or wrongly-signed mutation would fail with
  // AD-R16 and prove nothing about AD-R13, AD-R19 or AD-R21 — the negative would be answering a
  // question nobody asked. Every mutated record below is authentic and still refused.
  signature: seamKey.sign(evidenceHash(record)),
};

// ── The forge observation, bare root only ────────────────────────────────────────────────────────
// Why only there: an existing repository owns its platform-activation records, and in the Loom's own
// adoption dry-run one of them is load-bearing in the other direction — negative test #18 flips
// HG-0002 to `platform-enforced` and requires scripts/platform-activation-check.mjs to fail for want
// of a verified observation. Filing one here would turn that negative green, which is the precise
// failure this whole directory is written against.
const forgeRecord = !bareRoot || !staged.has('github-codeowners-hold') ? null : {
  platform: 'github',
  repository: 'example-bank/service',
  satisfies_control: 'HG-0002',
  mechanism: 'codeowners',
  observation: { path: 'docs/governance/changes/*/release-hold.json', owners: ['@example-bank/second-line'], require_code_owner_reviews: true, fetched_at: new Date().toISOString() },
  bypass_test: { attempted: 'write to release-hold.json as svc-floor-freezer', result: 'rejected', tested_at: new Date().toISOString() },
  observer_identity: FORGE_OBSERVER,
  observed_at: new Date().toISOString(),
};
if (forgeRecord) {
  const forgeKey = keypair();
  forgeRecord.attestation = { issuer: FORGE_ISSUER, signature: forgeKey.sign(activationHash(forgeRecord)) };
  W(`${G}/platform-activation/github-codeowners-hold.json`, forgeRecord);
  registerIssuer(FORGE_ISSUER, FORGE_OBSERVER, forgeKey.pem, 'The forge observer. scripts/platform-activation-check.mjs is the verifier of record for every forge mechanism; the adapter-evidence gate reads its verdict and checks only the binding — that a delegation names THIS adapter\'s control and mechanism.');
}

// ── Register the public halves ───────────────────────────────────────────────────────────────────
function registerIssuer(id, identity, pem, description) {
  const reg = existsSync(`${G}/attestation-issuers.json`) ? J(`${G}/attestation-issuers.json`) : { issuers: [] };
  reg.issuers = (reg.issuers || []).filter((i) => i.id !== id);
  reg.issuers.push({
    id,
    mechanism: 'ed25519',
    // `identity` is what binds a signing key to a registry id. Without it the credited observer is
    // free text: one party signs, another is credited, and AD-R18 says exactly that.
    identity,
    description: `${description} Generated fresh by adapter-evidence-example/observe.mjs; the private half was never written to disk. NOT marked "demo": true, because AD-R17 refuses a demo anchor and this observation is meant to verify — which is why no public half of it is committed to the bundle either.`,
    verify: { public_key: pem },
  });
  W(`${G}/attestation-issuers.json`, reg);
}
registerIssuer(SEAM_ISSUER, SEAM_OBSERVER, seamKey.pem, 'The seam observer: information security, outside builders, outside the identities this stream makes a claim about, and NOT the workspace administrator who holds the toggle (threat model G-5).');

const issuers = J(`${G}/attestation-issuers.json`);
const selfCheck = verifySignatureOver(evidenceHash(record), record.attestation, issuers, 'evidence record');
if (selfCheck.length) die(`the record this script just signed does not verify against the key it just registered:\n  - ${selfCheck.join('\n  - ')}`);

W(`${G}/adapter-evidence/notion-pa-decision.json`, record);

// ── The declaration-side mutation ────────────────────────────────────────────────────────────────
if (flag('--self-declare')) {
  const p = `${G}/adapters/github-codeowners-hold.json`;
  if (!existsSync(p)) die('--self-declare needs github-codeowners-hold mounted, and it was not staged here.');
  const a = J(p);
  a.activation_evidence = {
    _comment: 'A block filled in by hand with nothing behind it — the arrangement D5.3 exists to make fail.',
    fetched_at: new Date().toISOString(),
    release_hold_write_probe: 'rejected',
  };
  W(p, a);
  say('  MUTATED     github-codeowners-hold now self-declares activation (--self-declare) — AD-R09');
}

// ── What was produced ────────────────────────────────────────────────────────────────────────────
const mutations = ['--borrow', '--self-attest', '--self-declare'].filter(flag).concat(staleDays ? [`--stale ${staleDays}`] : []);
say('');
say(`  observation docs/governance/adapter-evidence/notion-pa-decision.json`);
say(`              observed_at ${record.observed_at} · observer ${record.observer_identity} · control ${record.satisfies_control}`);
if (forgeRecord) say(`  observation docs/governance/platform-activation/github-codeowners-hold.json (verified by scripts/platform-activation-check.mjs, delegated to by github-codeowners-hold)`);
say(`  issuers     ${[SEAM_ISSUER, forgeRecord ? FORGE_ISSUER : null].filter(Boolean).join(', ')} — public halves only, private keys discarded with the process`);
say(mutations.length
  ? `\n  MUTATED: ${mutations.join(' ')} — the record is authentically signed and must still be REFUSED by the gate.`
  : `\n  ${staged.size} declaration(s) staged. Run the gate from ${DEST}.`);
