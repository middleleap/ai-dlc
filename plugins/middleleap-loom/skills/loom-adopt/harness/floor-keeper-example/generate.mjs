// Generate the WS6 floor worked example (Factory Floor D6.3 + D6.4), so `floor-keeper-check.mjs`
// has a floor to check instead of reporting `no floor adopted` — which is the same vacuous green
// `freeze-stamp-check` and `drift-check` both had before a worked example was staged beside them.
//
//   node floor-keeper-example/generate.mjs --register              → the grant register (D6.3)
//   node floor-keeper-example/generate.mjs --observation           → a DEGRADED floor, saying so (D6.4)
//   node floor-keeper-example/generate.mjs --observation --live    → a live floor, carrying no banner
//   node floor-keeper-example/generate.mjs --patch-identities docs/governance/identities.json
//   node floor-keeper-example/generate.mjs --register --mutate keeper-grant     (and see it FAIL)
//
// Each artifact is printed to stdout; the caller decides where it lands. `--patch-identities` is the
// one mode that writes, because a registry entry has to be merged into a file that already exists.
//
// WHY THIS IS GENERATED AND NOT COMMITTED. Both artifacts carry an instant and both are refused once
// it goes stale: a grant audit older than GRANT_AUDIT_MAX_AGE_DAYS (30) is FK-R09, and an observation
// older than OBSERVATION_MAX_AGE_DAYS (ONE day) is DG-R08. A committed, statically-dated pair would
// pass on the day it was written and fail every build after that — for a reason having nothing to do
// with the change under review — so somebody would delete it and the gate would go back to passing
// vacuously. That is the exact failure `drift-example/observe.mjs` exists to avoid, and this follows
// it. The freshness windows are not a nuisance here; they are the control. An audit is a photograph,
// and a photograph has a date on it.
//
// WHAT THIS IS NOT. Nobody enumerated a grant and nobody read a credit meter. A real register is
// written after a human opens the sharing dialog of every container and reads it; a real observation
// is written by a watcher that queried the platform. This produces the SHAPE — faithfully enough
// that the gate does real work in both directions — and it is not evidence about any workspace.
// See the README for the full list of what it does not demonstrate.
import { readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { SCHEMA_ID as REGISTER_SCHEMA } from '../core/floor-keeper.mjs';
import { KEEPER_IDENTITY } from '../core/floor-approval-surface.mjs';
import { BANNERS, NOTICE_PLACEMENT, degradationObservation } from '../core/floor-degradation.mjs';

const HOUR = 3600000;
const DAY = 86400000;
const iso = (ms) => new Date(ms).toISOString();
const clone = (v) => JSON.parse(JSON.stringify(v));

/**
 * The keeper identity is IMPORTED, not spelled. `core/floor-approval-surface.mjs` fixes it as a
 * constant precisely so assembly happens under one probeable name, and an example that wrote its own
 * string would be demonstrating a floor nothing else in the harness refers to.
 *
 * The shipped `governance/identities.template.json` declares the projector, the freezer and the
 * bridge — and not this one. So an adopter who runs floor-keepers has to add it, and `--patch-identities`
 * is that step, done the way an adopter would do it: an agent, no roles, first-line.
 */
export const REGISTRY_ENTRY = Object.freeze({
  id: KEEPER_IDENTITY,
  kind: 'agent',
  display: 'Floor-keeper — prefills non-judgment fields, converses and routes; holds NO grant on the approvals database (D6.3)',
  roles: [],
  groups: ['builders'],
});

/**
 * The containers, and the whole point of the example is which one is missing from the grants below.
 *
 * `db-approvals` carries the fields that make an approval an approval, so it is declared
 * authoritative and the keeper holds NO grant on it — not read-only, not comment-only, none. That is
 * not a configuration choice made cautiously; it is the only expressible answer, because the surface
 * grants per database and never per property. "The keeper may fill the evidence but not the approval
 * field" cannot be written as a grant, so it is written as two containers.
 *
 * `db-approval-evidence` is what makes that survivable. D5.1 has the floor-keeper ASSEMBLE the three
 * evidence blocks an approver reads (`EVIDENCE_BLOCKS` in `core/floor-approval-surface.mjs`) — which
 * would require an edit grant exactly where D6.3 forbids one, if the evidence lived on the approval
 * page. It does not: the evidence is a separate database the approval page links to, the keeper
 * writes there, and the separation costs a join rather than the promise.
 */
export const CONTAINERS = Object.freeze([
  {
    id: 'db-discovery-drafts',
    kind: 'database',
    authoritative: false,
    _what: 'Catalog C — the drafting surface for a discovery run. Nothing here is read by a gate; the record arrives by freeze (D4.1).',
    fields: ['Run', 'Status', 'Owner', 'Problem statement', 'Research log link', 'Last synced'],
    prefill: ['Status', 'Last synced'],
  },
  {
    id: 'db-adr-inbox',
    kind: 'database',
    authoritative: false,
    _what: 'Catalog B — decision-routed. An ADR is WRITTEN here and DECIDED in git, so despite the name this container carries no approval field and a keeper may hold a grant on it.',
    fields: ['ADR', 'Blocked story', 'Change', 'Routed to (role)', 'Draft status', 'Mirrors template'],
    prefill: ['Blocked story', 'Change', 'Routed to (role)', 'Mirrors template'],
  },
  {
    id: 'db-approval-evidence',
    kind: 'database',
    authoritative: false,
    _what: 'The three D5.1 evidence blocks, assembled by the keeper and read-only to the approver. It is a SEPARATE container from db-approvals for the one reason this whole register exists: a grant is per container, so evidence the keeper must write and fields it must never touch cannot share one.',
    fields: ['Change', 'Stage', 'Change summary', 'Gate results', 'Decision-log excerpt', 'Assembled at', 'Assembled by'],
    prefill: ['Change summary', 'Gate results', 'Decision-log excerpt', 'Assembled at'],
  },
  {
    id: 'page-floor-home',
    kind: 'page',
    authoritative: false,
    _what: 'The floor\'s landing page. The keeper arranges what is shown here — that is the `views` half of its write scope — and the degradation banner is rendered on it and on every other view besides.',
    fields: ['Notices', 'What still works', 'Manual fallback owner'],
    prefill: ['Notices'],
  },
  {
    id: 'db-approvals',
    kind: 'database',
    authoritative: true,
    _what: 'PA1/PA2. THE container the separation is about: it carries approval fields, it declares itself authoritative, it lists NO prefill, and no keeper appears against it in `keepers[].grants` below. Note that `Approver` and `Decision` are not themselves approval fields by APPROVAL_FIELDS — `Approved by`, `Envelope plan hash` and `Assertion nonce` are what make this container detectable as one. See the README: that detection has a real gap.',
    fields: ['Change', 'Stage', 'Approver (people)', 'Decision', 'Approved by', 'Envelope plan hash', 'Assertion nonce', 'Recorded at'],
  },
]);

/** The register's mutations — each one a thing an adopter could plausibly do, and each a red build. */
export const REGISTER_MUTATIONS = new Map([
  ['keeper-grant', 'give the keeper `can-view` on the approvals database — the headline FK-R03, and the level that looks harmless'],
  ['keeper-role', 'let the register claim a role for the keeper — FK-R02, the agent-as-approver defect entered as data'],
  ['property-scope', 'write a grant scoped to the approval PROPERTY — FK-R05, a protection the platform does not implement'],
  ['stale-audit', 'date the grant audit 45 days back — FK-R09, separation asserted rather than audited'],
]);

/** The observation\'s mutations. Both are ways a paused floor keeps looking like a working one. */
export const OBSERVATION_MUTATIONS = new Map([
  ['paused-but-live', 'report the floor `live` while the agents are paused, and drop the banner — DG-R02, the failure D6.4 is named after'],
  ['self-reconciled', 'have the paused automation\'s own watcher sign the reconciliation — DG-R06, the silence signing its own alibi'],
]);

/**
 * The grant register (`docs/governance/floor-keepers.json`).
 *
 * `now` is injected so the audit's age is a decision of the caller rather than a property of the
 * clock: the honest register is audited a few days ago, not one millisecond ago, and `stale-audit`
 * moves exactly that one number.
 */
export function register({ now = Date.now(), mutate = null } = {}) {
  const auditedAt = mutate === 'stale-audit' ? now - 45 * DAY : now - 3 * DAY;
  const containers = clone(CONTAINERS);
  const keeper = {
    identity: KEEPER_IDENTITY,
    display: REGISTRY_ENTRY.display,
    // Views and conversation: it arranges what is SHOWN and it TALKS. Neither writes a field, which
    // is why those two are the whole of what D6.3 permits.
    write_scope: ['views', 'conversation'],
    grants: [
      { container: 'db-discovery-drafts', level: 'can-edit-content', why: 'prefills Status and Last synced; the judgment fields are typed by the run\'s owner' },
      { container: 'db-adr-inbox', level: 'can-edit-content', why: 'routes the card — who is blocked, which change, which role decides. The decision itself is made by a merge in git' },
      { container: 'db-approval-evidence', level: 'can-edit-content', why: 'assembles the three D5.1 evidence blocks. This is the grant that would otherwise have had to be on db-approvals' },
      { container: 'page-floor-home', level: 'can-edit-content', why: 'arranges the views and renders the degradation notice' },
      // and NOTHING on db-approvals. That absence is the deliverable.
    ],
  };

  if (mutate === 'keeper-grant') {
    keeper.grants.push({ container: 'db-approvals', level: 'can-view', why: 'MUTATION: "it only needs to READ the approvals to know what to route" — the sentence FK-R03 exists for' });
  }
  if (mutate === 'keeper-role') {
    keeper.roles = ['risk-second-line'];
  }
  if (mutate === 'property-scope') {
    keeper.grants.push({ container: 'db-approvals', level: 'can-edit', scope: 'property', property: 'Change summary', why: 'MUTATION: "scoped to the summary property only" — there is no such grant' });
  }

  return {
    _comment: 'The floor-keeper grant register (Factory Floor WS6 · D6.3). It records what each floor-keeper agent holds on each container of the collaboration surface, and it is checked by `scripts/floor-keeper-check.mjs` against one rule: approval fields live in a container no keeper holds ANY grant on. The register is a CLAIM about a workspace nobody here can see — `audit` is the part where a human went and looked, and its freshness is checked because a grant widens in a console in ten seconds.',
    schema: REGISTER_SCHEMA,
    surface: 'notion:workspace/alpha-islamic-bank (a fixture id — see floor-keeper-example/README.md, no such workspace exists)',
    containers,
    keepers: [keeper],
    audit: {
      _comment: 'Somebody opened the sharing dialog of every container listed below and read it. Not a script enumerating grants through the same API surface it is granted on — FK-R09 refuses a machine auditor for that reason, and refuses a keeper auditing itself for the more obvious one.',
      audited_at: iso(auditedAt),
      audited_by: 'infosec-noor',
      method: 'container-by-container read of the sharing dialog in the workspace admin console, witnessed',
      containers_enumerated: containers.map((c) => c.id),
    },
  };
}

/**
 * A degradation observation (`docs/governance/floor-degradation/*.json`).
 *
 * The default is a floor that is DEGRADED and says so — which PASSES the gate, and should: honest
 * degradation is the deliverable of D6.4, and a gate that failed on it would teach adopters to stop
 * writing observations, which is precisely the silence the delivery exists to break. `--live` is the
 * other truthful state, and it is the one that proves the notice rules bite in both directions: a
 * live floor carrying a banner is DG-R04.
 */
export function observation({ now = Date.now(), live = false, mutate = null } = {}) {
  if (live) {
    return {
      ...degradationObservation({
        credits: 'available',
        agents: 'running',
        workers: 'running',
        projection: 'current',
        observedAt: iso(now),
        // The platform admin: reading the credit meter means reading the billing console, and that
        // is an admin's view. Not the keeper — a keeper reporting on the automation it IS would be
        // the declaration the observation exists to replace.
        observedBy: 'padmin-zoe',
      }),
      // Declared AND derived, and they agree. `deriveStatus()` never reads this field; it is here so
      // that a reader of the file sees the same word the surface renders, and so that a record whose
      // observations later change without this field changing is a finding (DG-R02) rather than a
      // quiet disagreement.
      status: 'live',
      // No `notice`. There is no reassuring banner to render, and a banner that appears when nothing
      // is wrong is how readers learn to dismiss the one that matters.
    };
  }

  const observedAt = now;
  const since = now - 6 * HOUR;
  const base = degradationObservation({
    credits: 'exhausted',
    agents: 'paused',
    workers: 'paused',
    // The asymmetry D6.4 turns on: the projector is a bank-hosted service, not a metered Worker
    // (ADR 0002), so the mirror is STILL CURRENT while the labour has stopped. What you can see of
    // the record is true; what an agent would have added is not here and is not queued.
    projection: 'current',
    observedAt: iso(observedAt),
    observedBy: 'padmin-zoe',
    since: iso(since),
  });

  const record = {
    ...base,
    status: 'degraded',
    notice: {
      visible: true,
      dismissible: false,
      placement: NOTICE_PLACEMENT,
      severity: 'degraded',
      banner: BANNERS.get('degraded'),
    },
    reconciliation: {
      _comment: 'What was missed while nothing routed. Run by a human who is not the observer: the watcher says what it saw, somebody else establishes what was missed.',
      ran_at: iso(now - 2 * HOUR),
      ran_by: 'ops-dana',
      note: 'Walked the four keeper-served containers by hand against the change log in git; two ADR cards had not been routed and were routed manually.',
    },
    manual_fallback: {
      runbook: 'docs/governance/runbooks/floor-degradation.md',
      owner: 'ops-dana',
    },
  };

  if (mutate === 'paused-but-live') {
    record.status = 'live';
    delete record.notice;
  }
  if (mutate === 'self-reconciled') {
    record.reconciliation.ran_by = record.observed_by;
  }
  return record;
}

/**
 * Merge the keeper into an identity registry, in place. Idempotent, and it refuses to overwrite an
 * entry that already exists: if a registry already declares this identity, whatever it says there is
 * the adopter's, and an example that silently rewrote it would be editing the very file the whole
 * separation resolves against.
 */
export function patchIdentities(path) {
  let registry;
  try {
    registry = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    process.stderr.write(`cannot read ${path} as an identity registry\n`);
    process.exit(2);
    return;
  }
  if (!Array.isArray(registry?.identities)) {
    process.stderr.write(`${path} has no \`identities\` array — this is not an identity registry\n`);
    process.exit(2);
    return;
  }
  if (registry.identities.some((i) => i?.id === REGISTRY_ENTRY.id)) {
    process.stderr.write(`${path}: ${REGISTRY_ENTRY.id} is already declared — left alone\n`);
    return;
  }
  registry.identities.push(clone(REGISTRY_ENTRY));
  writeFileSync(path, `${JSON.stringify(registry, null, 2)}\n`);
  process.stderr.write(`${path}: added ${REGISTRY_ENTRY.id} (agent, no roles, builders) — the adoption step a floor-keeper needs\n`);
}

const USAGE = `usage:
  node floor-keeper-example/generate.mjs --register [--mutate <name>]
  node floor-keeper-example/generate.mjs --observation [--live] [--mutate <name>]
  node floor-keeper-example/generate.mjs --patch-identities <identities.json>

register mutations:
${[...REGISTER_MUTATIONS].map(([k, v]) => `  ${k.padEnd(16)} ${v}`).join('\n')}

observation mutations:
${[...OBSERVATION_MUTATIONS].map(([k, v]) => `  ${k.padEnd(16)} ${v}`).join('\n')}
`;

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const argv = process.argv.slice(2);
  const flag = (f) => argv.includes(f);
  const value = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : null; };
  const mutate = value('--mutate');

  if (flag('--help') || argv.length === 0) { process.stdout.write(USAGE); process.exit(argv.length === 0 ? 2 : 0); }

  const patch = value('--patch-identities');
  if (flag('--patch-identities')) {
    if (!patch) { process.stderr.write('--patch-identities needs a path\n'); process.exit(2); }
    patchIdentities(patch);
    process.exit(0);
  }

  const wantRegister = flag('--register');
  const wantObservation = flag('--observation');
  if (wantRegister === wantObservation) {
    process.stderr.write('choose exactly one of --register | --observation\n\n' + USAGE);
    process.exit(2);
  }
  // An unknown mutation name is REFUSED rather than ignored. A typo that silently produced the clean
  // fixture would turn a CI assertion of "this must fail" into a test of nothing at all — which is
  // the same class of vacuum this whole example was written to close.
  const known = wantRegister ? REGISTER_MUTATIONS : OBSERVATION_MUTATIONS;
  if (mutate !== null && !known.has(mutate)) {
    process.stderr.write(`unknown mutation ${JSON.stringify(mutate)} for ${wantRegister ? '--register' : '--observation'}\n\n${USAGE}`);
    process.exit(2);
  }
  // Same reasoning: the live record has nothing the observation mutations bite on, so accepting the
  // combination would hand back a CLEAN fixture to a caller who asked for a broken one.
  if (mutate !== null && flag('--live')) {
    process.stderr.write('--live takes no --mutate: the mutations describe a paused floor misrepresenting itself, and a live record has nothing for them to break. Asking for both would return a clean fixture to a caller expecting a red one\n');
    process.exit(2);
  }

  const out = wantRegister
    ? register({ mutate })
    : observation({ live: flag('--live'), mutate });
  process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
}
