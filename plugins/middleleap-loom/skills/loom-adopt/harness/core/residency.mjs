// The residency sign-off gate (Factory Floor WS0 · D0.1 / prerequisite P1).
//
// WHY THIS EXISTS. Every other control in this method is *observed, not declared*. D0.1 was the
// exception: the residency record's §11 carries the two signatures that gate every workstream after
// WS0, its blocking statement says in prose that no workspace may be built and no content of any
// class may reach any floor surface until they are recorded — and nothing read it. An adopter could
// stand a floor up with both signature cells still saying `AWAITING`, and no gate would notice. The
// foundational control of the programme was the one thing running on trust.
//
// WHAT IT REFUSES. In order of how badly each one would end:
//
//   - A floor that exists without a signed record. This is the blocking statement, enforced. The
//     presence of live floor artifacts — approvals, keepers, degradation observations, adapter
//     evidence — while §11 is unsigned is the exact state the record forbids.
//   - A signature that does not resolve to a registry identity. A name in a markdown cell is not an
//     approver; it must be an identity the registry knows, holding the named role.
//   - An AGENT in either cell. Agents prepare evidence; they never approve. The record is a
//     governance decision and no service identity may carry one.
//   - A BUILDER signing. §11 says it outright, and it is the separation the whole method rests on:
//     the people who built the thing do not clear it.
//   - ONE PERSON HOLDING BOTH ROLES. "Roles, not headcount" is right almost everywhere in this
//     method and wrong here — a two-signature record whose point is a second pair of eyes is not
//     satisfied by one pair wearing two hats.
//   - A partially signed record. One signature is not a weaker approval; it is no approval.
//
// WHAT IT CANNOT DO, said plainly because the placement flatters it. It reads a markdown table. It
// can confirm that a decision was recorded by someone entitled to record it — it cannot confirm the
// person read the document, understood the twelve open items, or meant it. The signature is still a
// human act; this gate only stops the act being skipped or forged by someone unqualified.
//
// Mandatory-when-compiled, and additionally mandatory whenever a floor exists: a repo that compiles
// no `residency_approval` capability and runs no floor behaves exactly as it did before this file.
// Tightens, never loosens.

export const CAPABILITY = 'residency_approval';

/** The two roles P1 names. Not widened here — the record says the institution may add its own. */
export const REQUIRED_ROLES = ['data-protection', 'risk-second-line'];

/** The three decisions §11 offers. Anything else in the cell is not a decision. */
export const VERDICTS = ['approve', 'approve with conditions', 'refuse'];

/** A recorded decision that does NOT unblock. Refusal is a valid, signed outcome. */
export const BLOCKING_VERDICTS = ['refuse'];

/** The marker the record uses for a human decision that does not exist yet. */
export const AWAITING = 'AWAITING';

/**
 * Live-floor artifacts. NOT the shipped catalogs — `floor/templates`, `floor/catalog-b` and
 * `floor/catalog-c` are forms the installer copies into every adopting repo, and their presence
 * means only that the Loom was installed. These paths mean a floor is being USED.
 */
export const FLOOR_EVIDENCE = [
  'floor/approvals',
  'docs/governance/floor-keepers.json',
  'docs/governance/floor-degradation',
  'docs/governance/adapter-evidence',
];

const clean = (cell) => String(cell ?? '').replace(/\*\*/g, '').replace(/`/g, '').trim();
const isAwaiting = (v) => new RegExp(`\\b${AWAITING}\\b`, 'i').test(String(v ?? ''));

/**
 * Pull the sign-off rows out of the record. Returns `{ found, rows }`; `found:false` means no row
 * keyed by either required role exists anywhere, which is different from present-but-unsigned and
 * is reported differently.
 */
export function parseSignoff(markdown) {
  const rows = [];
  for (const line of String(markdown ?? '').split('\n')) {
    if (!line.trim().startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map(clean);
    if (cells.length < 4) continue;
    const role = cells[0].toLowerCase();
    // The anchor is the ROLE KEY in the first cell, not the heading above it. Heading text is the
    // first thing a human reformats — the shipped worked example calls its section "The decision",
    // the live record calls it "Sign-off" — whereas a row whose first cell is exactly
    // `data-protection` is the signature row in any layout. Prose tables that merely mention the
    // roles do not match: §10's review-cadence table keys its rows on the trigger, not the role.
    if (!REQUIRED_ROLES.includes(role)) continue;
    if (rows.some((r) => r.role === role)) continue; // first occurrence wins; a later restatement is prose
    rows.push({ role, name: cells[1], identity: cells[2], decision: cells[3], date: cells[4] ?? '' });
  }
  return { found: rows.length > 0, rows };
}

/** Is this record signed by both roles with a non-blocking verdict? Pure; no findings. */
export function isSigned(parsed) {
  if (!parsed?.found) return false;
  return REQUIRED_ROLES.every((role) => {
    const row = parsed.rows.find((r) => r.role === role);
    if (!row) return false;
    const verdict = row.decision.toLowerCase();
    return VERDICTS.some((v) => verdict.startsWith(v))
      && !BLOCKING_VERDICTS.some((v) => verdict.startsWith(v))
      && !isAwaiting(row.decision) && !isAwaiting(row.identity) && !isAwaiting(row.name);
  });
}

const groupsOf = (who) => new Set(who?.groups || []);

/**
 * The gate. `floorArtifacts` is the list of live-floor paths found (empty ⇒ no floor in use);
 * `required` is the compiled-capability answer. Findings empty ⇒ pass.
 */
export function evaluate({ record = null, registry = null, floorArtifacts = [], required = false } = {}) {
  const findings = [];
  const floorInUse = floorArtifacts.length > 0;

  // A repo with no floor and no compiled requirement is none of this gate's business.
  if (record === null && !floorInUse && !required) return findings;

  if (record === null) {
    findings.push(
      floorInUse
        ? `a floor is in use (${floorArtifacts.join(', ')}) but there is no residency record — P1 gates `
          + 'every workstream after WS0, and its blocking statement forbids content on any floor surface'
        : 'a compiled plan requires residency approval but no residency record is present',
    );
    return findings;
  }

  const parsed = parseSignoff(record);
  if (!parsed.found) {
    findings.push(`the residency record has no sign-off rows — no table row is keyed by ${REQUIRED_ROLES.join(' or ')}. The signatures gate everything downstream, so a record without them is a draft`);
    return findings;
  }

  const seen = new Map(); // identity → roles it signed for, to catch one person wearing both hats
  for (const role of REQUIRED_ROLES) {
    const row = parsed.rows.find((r) => r.role === role);
    if (!row) { findings.push(`${role}: no signature row in §11 — the record does not even ask for this signature`); continue; }

    // Unsigned is the ORDINARY state of a drafted record and is not by itself a defect. The
    // blocking statement blocks workspace construction, token issue and floor content — it does not
    // block drafting, and the paper deliverables (D0.2, D0.4, D0.5) are meant to proceed without it.
    // So an unsigned record fails only once something depends on it. A gate that went red the moment
    // a record was drafted would be red for the entire life of every programme that writes one
    // honestly, and a gate that is always red is a gate nobody reads.
    //
    // Everything BELOW this branch is different in kind: those are defects in a signature that was
    // actually recorded, and an unsound signature is unsound whether or not anyone compiled it.
    if (isAwaiting(row.decision) || isAwaiting(row.identity) || isAwaiting(row.name)) {
      if (floorInUse || required) {
        findings.push(`${role}: AWAITING — unsigned, and ${floorInUse ? 'a floor is already in use' : 'a compiled plan requires residency approval'}. Route the record (docs/notion-floor-p1-reviewer-brief.md); never fill a signature cell on someone's behalf`);
      }
      continue;
    }

    const verdict = row.decision.toLowerCase();
    // Longest match first: 'approve with conditions' must not be shortened to 'approve'.
    const matched = [...VERDICTS].sort((a, b) => b.length - a.length).find((v) => verdict.startsWith(v));
    if (!matched) {
      findings.push(`${role}: decision ${JSON.stringify(row.decision)} is not one of ${VERDICTS.join(' / ')} — a note is not a decision`);
      continue;
    }
    if (BLOCKING_VERDICTS.includes(matched)) {
      findings.push(`${role}: REFUSED by ${row.identity}. This gate is doing its job — a refusal is a signed outcome and it blocks. Only the paper deliverables (D0.2, D0.4, D0.5) may proceed`);
      continue;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
      findings.push(`${role}: date ${JSON.stringify(row.date)} is not an ISO date — an undated signature cannot be aged, and §10 requires re-review`);
    }

    if (!registry) {
      findings.push(`${role}: signed by ${row.identity}, but there is no identity registry to resolve it against — a name in a table is not an approver`);
      continue;
    }
    const who = (registry.identities || []).find((i) => i.id === row.identity);
    if (!who) {
      findings.push(`${role}: ${JSON.stringify(row.identity)} is not in the identity registry — unresolvable signatures do not count`);
      continue;
    }
    if (who.kind === 'agent') {
      findings.push(`${role}: ${row.identity} is an AGENT — agents prepare evidence, they never approve, and least of all the record that gates the programme`);
    }
    if (!(who.roles || []).includes(role)) {
      findings.push(`${role}: ${row.identity} does not hold the role ${role} — signing for a role you do not hold is not a signature`);
    }
    if (groupsOf(who).has('builders')) {
      findings.push(`${role}: ${row.identity} is in the builders group — §11 says builders may not sign, and it is the separation the method rests on`);
    }

    const already = seen.get(row.identity);
    if (already) {
      findings.push(`${row.identity} signed as both ${already} and ${role} — "roles, not headcount" holds almost everywhere in this method and not here: a two-signature record whose point is a second pair of eyes is not satisfied by one pair wearing two hats`);
    }
    seen.set(row.identity, role);
  }

  // The blocking statement, enforced. A partially signed record does not partially unblock.
  if (floorInUse && findings.length) {
    findings.push(`a floor is IN USE while the record is not cleanly signed — found ${floorArtifacts.join(', ')}. §11's blocking statement forbids workspace construction, token issue, and content of any class on any floor surface until both signatures are recorded and merged`);
  }
  return findings;
}
