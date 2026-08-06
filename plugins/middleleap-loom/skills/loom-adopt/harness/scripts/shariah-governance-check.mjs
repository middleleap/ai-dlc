// The Shari'ah governance gate — control SHARIAH-GOV, and the primary reader of the
// `shariah_governance` capability. Until this file existed that capability compiled into plans
// and NOTHING read it, which by the method's own rule makes it a label rather than a control.
//
// WHAT THIS GATE VERIFIES, and the list is deliberately short:
//
//   COMPOSITION  who occupies the Shari'ah seats, and that there are enough of them to be a body
//   PROVENANCE   that each seat carries appointment references somebody OUTSIDE this repository
//                issued — an approval reference, an appointing instrument, a date
//   BINDING      that the composition register and the identity registry describe the SAME body,
//                in both directions, so neither file alone can appoint a scholar
//   THE JOIN     that every engineering projection of a structure points at a real, ACTIVE row in
//                the decision register
//
// WHAT IT CANNOT AND MUST NOT VERIFY: whether any ruling is substantively correct, whether a
// structure conforms to the ruling it cites, or whether anything is permissible. A GREEN GATE OVER
// A WRONG RULING IS POSSIBLE BY DESIGN — SCHOLARS DECIDE SHARI'AH, not this file, and a version of
// this gate that appeared to rule on permissibility would be a defect, not a feature. It reads
// JSON records; it never watches a committee sit, never sees an appointment instrument, and cannot
// tell a genuine approval reference from a well-formed invention. "Structure-conformant" is the
// most this plane ever claims, and this gate does not even claim that — it checks the records that
// a claim would have to rest on.
//
// What it refuses, in order of how badly each ends:
//
//   SG-R00  a compiled plan requires the capability and there is no register at all
//   SG-R01  a committee below the minimum composition — a body that cannot lawfully sit, whose
//           "approval" is not the committee's however many people signed it
//   SG-R02  a seat that does not resolve to a HUMAN holding the committee role in the registry:
//           the register and the registry may not disagree about who sits
//   SG-R03  a seat whose provenance fields are missing or still adoption markers — an untouched
//           template must never read as an appointment
//   SG-R04  a quorum that is absent (so one member's opinion passes as the body's decision), below
//           a majority of the seats, or larger than the number of holders (an outage wearing rigour)
//   SG-R05  a SHADOW SCHOLAR: a registry holder of the committee role with no seat in the disclosed
//           register — someone who can sign approvals from outside the body
//   SG-R06  internal Shari'ah audit outsourced, in fact or in wording. It may not be.
//   SG-R07  a Shari'ah Compliance Function or internal-audit head who does not resolve to a human
//           holding the matching role
//   SG-R08  a structure in the engineering tree citing a decision that does not exist, or is no
//           longer active — the projection of a ruling nobody made, or of one that was replaced
//
// TWO REGISTERS, ONE DECISION. docs/governance/shariah-rulings.json is the DECISION record;
// docs/governance/shariah-structures/ is the engineering PROJECTION of a decision. Two registers
// that can disagree about what the committee approved is exactly the ambiguity SG-R08 closes. Where
// the rulings register is absent the join is reported NOT VERIFIED — a notice, never a silent pass,
// because "nothing checked it" and "it checked out" must not look the same.
//
// MANDATORY-WHEN-COMPILED. Inert — no findings, no notices — for any repository whose compiled
// plans do not require `shariah_governance`; only an Islamic product or institution profile
// compiles it. A conventional adopter must NEVER be failed by a Shari'ah control. The moment a
// plan does require the capability, an absent register is a finding that names the change asking.
//
// Lane: pr. Run from the repo root: `node scripts/shariah-governance-check.mjs` (exit 1 on a finding).
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { aggregateRequirements, capabilityRequired } from '../core/compiled-requirements.mjs';
import { identityOf, loadRegistry, quorumFor } from './identity-registry-check.mjs';

export const CAPABILITY = 'shariah_governance';
export const REGISTER_LOCATIONS = ['docs/governance/issc-register.json', 'issc-register.json'];
export const RULINGS_LOCATIONS = ['docs/governance/shariah-rulings.json', 'shariah-rulings.json'];
export const STRUCTURES_DIRS = ['docs/governance/shariah-structures', 'shariah-structures'];
// The regulatory minimum committee size. FIVE IS A FLOOR, NOT A TARGET: a register carrying four
// describes a body that cannot lawfully sit, and the gate counts seats because that is the one
// thing about a committee a file can honestly count.
export const MINIMUM_MEMBERS = 5;
export const COMMITTEE_ROLE = 'shariah-committee';
export const SCF_ROLE = 'shariah-compliance';
export const AUDIT_ROLE = 'shariah-audit';
export const SEAT_PROVENANCE_FIELDS = ['hsa_approval_ref', 'appointment_instrument', 'appointment_date'];
export const ACTIVE_STATUS = 'active';

const nonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;
/** An untouched template field, or a ref that names nothing. A shipped template is not a decision. */
export const isPlaceholder = (v) => typeof v === 'string' && /^(ADOPT[\s:—-]|TODO|TBD|N\/?A$|none$|<)/i.test(v.trim());
const isNamed = (v) => nonEmpty(v) && !isPlaceholder(v);
const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };
const firstPath = (locs, cwd) => locs.map((p) => join(cwd, p)).find(existsSync) || null;
const plural = (n, one, many) => (n === 1 ? one : many);

/**
 * Findings (fail) and notices (never do) over the parsed composition register.
 *
 * `registry` is the identity registry (null ⇒ nothing resolves, and that is itself a finding rather
 * than a quiet skip: a register of names nobody can resolve is free text with a schema).
 * `rulings` is the parsed decision register, or null for "no register present" — the difference
 * between an unresolvable citation and an unverifiable one, which the join reports differently.
 * `structures` is the flattened structures tree, or null where the repository has none.
 */
export function evaluate({ register, registry = null, rulings = null, structures = null } = {}) {
  const findings = [];
  const notices = [];
  const canResolve = Boolean(registry);
  if (!canResolve) {
    findings.push('SG-R02: no identity registry to resolve the Shari\'ah seats against — an ISSC register whose members resolve to nothing is a list of names, and a name is not an approver (see governance/identities.template.json)');
  }

  /* ── SG-R01/R02/R03 — the seats ─────────────────────────────────────────────────────────── */
  const members = Array.isArray(register?.members) ? register.members : null;
  if (!members) {
    findings.push(`SG-R01: the ISSC register carries no \`members\` array — a composition register with no composition answers the one question it exists to answer with silence, and the quorum is then checked against nothing`);
  } else {
    if (members.length < MINIMUM_MEMBERS) {
      findings.push(`SG-R01: the register carries ${members.length} ${plural(members.length, 'seat', 'seats')}; the minimum committee composition is ${MINIMUM_MEMBERS} — a committee below the minimum cannot lawfully sit, and an approval collected from it is not the committee's approval however many people signed`);
    }
    const seen = new Set();
    for (const m of members) {
      const id = m?.identity_id;
      const label = nonEmpty(id) ? id : '(unnamed seat)';
      if (!nonEmpty(id)) {
        findings.push('SG-R02: a seat names no identity_id — an empty seat still counts toward the composition, which is how a committee of four is made to look like five');
      } else {
        if (seen.has(id)) {
          findings.push(`SG-R02: ${id} occupies two seats — one person counted twice is a committee of ${MINIMUM_MEMBERS - 1} wearing ${MINIMUM_MEMBERS} names`);
        }
        seen.add(id);
        if (canResolve) {
          const who = identityOf(registry, id);
          if (!who) {
            findings.push(`SG-R02: seat ${id} does not resolve in the identity registry — the two files may not disagree about who sits, and an unresolvable member cannot be the person whose approval was counted`);
          } else {
            if (who.kind !== 'human') {
              findings.push(`SG-R02: seat ${id} is an ${who.kind} identity — agents prepare evidence and never approve; scholars decide Shari'ah, and a committee seat is a person`);
            }
            if (!(who.roles || []).includes(COMMITTEE_ROLE)) {
              findings.push(`SG-R02: seat ${id} does not hold ${COMMITTEE_ROLE} in the identity registry — approvals resolve against the registry, so a seat here that carries no role there is a member who cannot sign and a signer nobody appointed`);
            }
          }
        }
      }
      for (const field of SEAT_PROVENANCE_FIELDS) {
        const v = m?.[field];
        if (!nonEmpty(v)) {
          findings.push(`SG-R03: seat ${label} carries no ${field} — this is the trail an auditor follows from a signature back to an approved appointment, and a seat without it is an assertion that someone sits`);
        } else if (isPlaceholder(v)) {
          findings.push(`SG-R03: seat ${label}: ${field} is still an adoption marker (${JSON.stringify(v)}) — an untouched template must never read as an appointment`);
        }
      }
    }
  }

  /* ── SG-R04/R05 — quorum, and the body's edges ──────────────────────────────────────────── */
  if (canResolve) {
    const holders = (registry.identities || []).filter((i) => i.kind === 'human' && (i.roles || []).includes(COMMITTEE_ROLE));
    const seats = members ? members.length : 0;
    const majority = Math.floor(seats / 2) + 1;
    const declared = registry.quorum?.[COMMITTEE_ROLE];
    if (!Number.isInteger(declared) || declared < 1) {
      findings.push(`SG-R04: the identity registry declares no quorum for ${COMMITTEE_ROLE} (got ${JSON.stringify(declared)}) — the default is ONE, and one member's signature is a member's opinion, never the committee's decision. Quorum lives in the identity registry so there is exactly one number to disagree about`);
    } else {
      const effective = quorumFor(registry, COMMITTEE_ROLE);
      if (seats > 0 && effective < majority) {
        findings.push(`SG-R04: the quorum for ${COMMITTEE_ROLE} is ${effective} of ${seats} ${plural(seats, 'seat', 'seats')}; a majority is ${majority} — a minority quorum lets the smaller half of a committee speak for the whole of it`);
      }
      if (declared > holders.length) {
        findings.push(`SG-R04: the quorum for ${COMMITTEE_ROLE} is ${declared} but only ${holders.length} human ${plural(holders.length, 'identity holds', 'identities hold')} the role — an unsatisfiable quorum blocks every Islamic change forever, which reads as rigour and functions as an outage`);
      }
    }
    if (members) {
      const seated = new Set(members.map((m) => m?.identity_id).filter(nonEmpty));
      for (const h of holders) {
        if (seated.has(h.id)) continue;
        findings.push(`SG-R05: ${h.id} holds ${COMMITTEE_ROLE} in the identity registry but occupies no seat in the ISSC register — a scholar who can sign approvals from outside the disclosed body is exactly the hole the register exists to close. Seat them, or remove the role`);
      }
    }
  }

  /* ── SG-R06 — internal Shari'ah audit may not be outsourced ─────────────────────────────── */
  const ia = register?.internal_audit;
  if (ia?.outsourced !== false) {
    findings.push(`SG-R06: internal_audit.outsourced is ${JSON.stringify(ia?.outsourced)} and must be literally false — internal Shari'ah audit MAY NOT be outsourced. Absent, "false" as a string, and "co-sourced" are the three ways that rule is broken while looking answered`);
  }
  if (canResolve && nonEmpty(ia?.lead_identity_id)) {
    const lead = identityOf(registry, ia.lead_identity_id);
    if (lead?.external === true) {
      findings.push(`SG-R06: internal_audit lead ${ia.lead_identity_id} is declared external:true in the identity registry — a co-sourced firm's partner in the third-line slot is the outsourcing the rule forbids, wearing an employee's label`);
    }
  }

  /* ── SG-R07 — the two standing desks ────────────────────────────────────────────────────── */
  for (const line of [
    { key: 'scf', role: SCF_ROLE, what: 'the Shari\'ah Compliance Function (second line, continuous monitoring)' },
    { key: 'internal_audit', role: AUDIT_ROLE, what: 'internal Shari\'ah audit (third line)' },
  ]) {
    const id = register?.[line.key]?.lead_identity_id;
    if (!isNamed(id)) {
      findings.push(`SG-R07: ${line.key}.lead_identity_id names nobody (${JSON.stringify(id)}) — ${line.what} with no named head is a box on an org chart, and the records it is supposed to file have no owner`);
      continue;
    }
    if (!canResolve) continue; // already reported once; per-desk repetition adds noise, not information
    const who = identityOf(registry, id);
    if (!who) {
      findings.push(`SG-R07: ${line.key} lead ${id} does not resolve in the identity registry — ${line.what} headed by an unresolvable name`);
      continue;
    }
    if (who.kind !== 'human') {
      findings.push(`SG-R07: ${line.key} lead ${id} is an ${who.kind} identity — ${line.what} is held by a person who can be asked what they found`);
    }
    if (!(who.roles || []).includes(line.role)) {
      findings.push(`SG-R07: ${line.key} lead ${id} does not hold ${line.role} in the identity registry — the desk and the role must be the same claim, or an approval demanding ${line.role} is satisfied by somebody this register never named`);
    }
  }

  /* ── SG-R08 — the two-registers join ────────────────────────────────────────────────────── */
  if (Array.isArray(structures) && structures.length > 0) {
    if (rulings === null) {
      notices.push(`the two-registers join is NOT VERIFIED: ${structures.length} structure ${plural(structures.length, 'entry cites', 'entries cite')} an ISSC decision and there is no ${RULINGS_LOCATIONS[0]} to resolve them against. This is not a pass — nothing here has checked that the committee ever issued what these structures implement`);
    } else {
      const byId = new Map((rulings.rulings || []).filter((r) => nonEmpty(r?.ruling_id)).map((r) => [r.ruling_id, r]));
      for (const s of structures) {
        if (s.unreadable) {
          findings.push(`SG-R08: structure ${s.label} is not readable JSON — an unparseable structure entry is not a bound one, and a gate that skipped it would report the binding as checked`);
          continue;
        }
        const ref = s.issc_decision_ref;
        if (!isNamed(ref)) {
          findings.push(`SG-R08: structure ${s.label} names no issc_decision_ref (${JSON.stringify(ref)}) — a structure in the engineering tree with no ruling behind it is an implementation of nobody's decision`);
          continue;
        }
        const ruling = byId.get(ref);
        if (!ruling) {
          findings.push(`SG-R08: structure ${s.label} cites ISSC decision ${JSON.stringify(ref)}, which is no ruling_id in ${RULINGS_LOCATIONS[0]} — the rulings register is the DECISION record and this tree is the PROJECTION of a decision; a projection of nothing is precisely the ambiguity this join closes`);
          continue;
        }
        if (ruling.status !== ACTIVE_STATUS) {
          // superseded and withdrawn are not the same failure: one moved, the other is gone.
          const replacement = [...byId.values()].find((r) => r.supersedes === ref || (Array.isArray(r.supersedes) && r.supersedes.includes(ref)));
          const next = replacement
            ? ` ${replacement.ruling_id} replaces it — re-bind this structure to that ruling.`
            : ' Nothing in the register replaces it, so this structure is bound to a decision that no longer stands.';
          findings.push(`SG-R08: structure ${s.label} cites ruling ${ref}, whose status is ${JSON.stringify(ruling.status)}, not ${JSON.stringify(ACTIVE_STATUS)} —${next}`);
        }
      }
    }
  }

  return { findings, notices };
}

/** The change_ids whose compiled plans require the capability — so a finding can name WHO asked. */
export const requiringChanges = (agg) =>
  (agg?.changes || []).filter((c) => c.capabilities?.[CAPABILITY]?.required).map((c) => c.change_id);

/**
 * The structures tree, flattened to `[{ label, issc_decision_ref }]`, or null where absent.
 *
 * Tolerant of both shapes an adopter reaches for — one file per structure, or one file holding a
 * `structures` array — because a gate that silently ignored the shape it did not expect would
 * report an unchecked tree as a checked one. Comment-only files (every key underscore-prefixed)
 * are skipped: a header is not a structure.
 */
export function loadStructures(cwd = process.cwd()) {
  const dir = firstPath(STRUCTURES_DIRS, cwd);
  if (!dir) return null;
  const out = [];
  for (const name of readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
    const full = join(dir, name);
    if (!statSync(full).isFile()) continue;
    const doc = readJson(full);
    if (!doc) { out.push({ label: name, unreadable: true }); continue; }
    const rows = Array.isArray(doc.structures) ? doc.structures : [doc];
    rows.forEach((s, i) => {
      if (!s || typeof s !== 'object' || Array.isArray(s)) return;
      if (Object.keys(s).every((k) => k.startsWith('_'))) return;
      out.push({ label: s.structure_id || (rows.length > 1 ? `${name}#${i}` : name), issc_decision_ref: s.issc_decision_ref });
    });
  }
  return out;
}

export function run(cwd = process.cwd(), { agg = null } = {}) {
  const aggregate = agg || aggregateRequirements(cwd);
  const required = capabilityRequired(aggregate, CAPABILITY);
  const path = firstPath(REGISTER_LOCATIONS, cwd);
  // INERT. An institution with no Islamic product in flight is not failing this control — it is
  // not subject to it. Nothing is read, nothing is said, and that silence is the whole reason a
  // generic adopter can carry this gate at all.
  if (!required) return { inert: true, required: false, present: Boolean(path), members: 0, findings: [], notices: [] };

  const who = requiringChanges(aggregate);
  const asked = who.join(', ') || 'unknown change';
  if (!path) {
    return {
      inert: false, required, present: false, members: 0, notices: [],
      findings: [`SG-R00: a compiled plan requires the ${CAPABILITY} capability [${asked}] and there is no ${REGISTER_LOCATIONS[0]} — the route says an Islamic product is in flight and nothing in this repository says who the Shari'ah committee is, so no approval it carries can be attributed to a body`],
    };
  }
  const register = readJson(path);
  if (!register) {
    return { inert: false, required, present: true, members: 0, notices: [], findings: [`SG-R00: ${REGISTER_LOCATIONS[0]} is not valid JSON — an unreadable composition register is an absent one [${asked}]`] };
  }
  const rulingsPath = firstPath(RULINGS_LOCATIONS, cwd);
  const rulings = rulingsPath ? readJson(rulingsPath) : null;
  const { findings, notices } = evaluate({
    register,
    registry: loadRegistry(cwd),
    rulings,
    structures: loadStructures(cwd),
  });
  if (rulingsPath && rulings === null) {
    findings.unshift(`SG-R08: ${RULINGS_LOCATIONS[0]} is present but is not valid JSON — the decision register cannot be read, so every citation of it is unresolved rather than resolved`);
  }
  return {
    inert: false, required, present: true,
    members: Array.isArray(register.members) ? register.members.length : 0,
    findings, notices,
  };
}

// CLI (skipped when imported by the test suite).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { inert, findings, notices, members } = run();
  for (const n of notices) process.stdout.write(`NOTICE: ${n}\n`);
  if (findings.length) {
    process.stderr.write('\nShari\'ah governance gate — FAIL\n\n');
    for (const f of findings) process.stderr.write(`  - ${f}\n`);
    process.stderr.write('\nThis gate checks COMPOSITION, PROVENANCE and BINDING records. It rules on no Shari\'ah\nquestion: scholars decide Shari\'ah, and a green gate over a wrong ruling is possible by design.\nSee governance/issc-register.template.json and governance/shariah-rulings.template.json.\n');
    process.exit(1);
  }
  if (inert) {
    process.stdout.write(`Shari'ah governance gate — inert (no compiled plan requires ${CAPABILITY}; nothing read)\n`);
    process.exit(0);
  }
  process.stdout.write(`Shari'ah governance gate — OK (${members} seat${members === 1 ? '' : 's'} recorded${notices.length ? `, ${notices.length} notice(s)` : ''}; composition and provenance only — no Shari'ah question is answered here)\n`);
}
