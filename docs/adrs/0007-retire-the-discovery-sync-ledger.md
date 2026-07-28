---
artifact: adr
stage: deliver
id: "ADR-0007"
change: "—"
story: "—"
---

# ADR-0007 — Retire the discovery-sync ledger by having ofbo adopt the harness

> **Identifiers.** Gate ids (`D1`–`D9`, `Q1`–`Q5`) and run-level ids (`S-001` signal,
> `T-1` theme, `H1` hypothesis) are expanded in `discovery/GLOSSARY.md`.

> Deliver. An architecture decision the build loop may **not** make for itself. Drafting this
> record is not deciding it; a `proposed` ADR unblocks nothing.

**Status:** proposed · **Date:** 2026-07-28
**Deciders:** the repository owner, jointly with whoever holds architecture authority for
`openfinance-os/ofbo` — this decision binds two repositories and cannot be taken in one.
**Drafted by:** Claude Opus 5, during a session that ran the first-ever reconciliation.

## Context

The Loom's discovery machinery exists twice: here as the generic harness the bundle installs,
and in `openfinance-os/ofbo` as the instantiation it was extracted from on 2026-07-17. The
`discovery-sync` gate (rc.29) was built to count the divergence rather than remember it.

**On 2026-07-28 the reconciliation ran against a real checkout for the first time.** It had
never run before — and the reason is worse than neglect: **`--reconcile` was documented in the
gate's header, in the ledger's own note and in `CLAUDE.md`, and had never been implemented.**
The debt was not unretired, it was *unretirable*. `last_reconciled` was `null` because nothing
could set it.

What the first comparison found, over the 24 machinery paths (ofbo's own runs and rendered
artifacts excluded):

| Verdict | Count | Meaning |
|---|---|---|
| `bundle-ahead` | 11 | We hardened; ofbo never received it |
| `conflict` | **6** | Both sides moved from the shared base |
| `identical` | 4 | Genuinely in sync |
| `upstream-ahead` | 1 | ofbo hardened; **we** never received it |
| `bundle-only` | 1 | Added here |
| `missing-here` | 1 | Upstream only |

Three things follow, and they are the forces on this decision:

1. **Six files need a merge, not a port.** The ledger's whole vocabulary was "owed" — a debt
   settled by copying. For a conflict, copying destroys one side's work. Every further edit on
   either side makes those six harder to resolve, and both repositories are actively worked on.
2. **The divergence runs both ways.** `office.test.mjs` was hardened in ofbo and never came
   back. Until rc.35 the ledger had no state that could express this, so a real gap in *our*
   tree was invisible by construction.
3. **Manual reconciliation has a demonstrated failure rate of 100%.** In the eleven days between
   extraction and measurement, the process ran zero times — because the command to run it did
   not exist, and nobody noticed, because the gate's green tick was about *this* side only.

The ledger's own `direction` field has said the answer since it was written:

> "The long-term fix is for ofbo to ADOPT via adopt.mjs, which retires this ledger entirely: the
> adoption stamp already tells a local edit from an upstream update, so there would be one source
> and nothing to reconcile by hand."

## Decision

**Proposed:** `openfinance-os/ofbo` adopts the Loom harness via `adopt.mjs` rather than
maintaining a forked copy of `discovery/`, and the `discovery-sync` ledger is retired once the
adoption stamp is in place.

Under adoption, `.loom/adoption.json` distinguishes a local edit from an upstream update
per file — the mechanism the ledger was hand-rolling. An ofbo-side customisation is *preserved*
and reported, with the new upstream version written beside it as `<file>.loom-new`. That is
exactly the three-way merge the six conflicts need, performed by machinery that already exists
and is already tested, on every upgrade rather than once nobody remembers to schedule.

The six conflicts are resolved **once**, as part of the adoption, rather than growing.

## Consequences

**Gained.** One source of truth. Divergence handled per-upgrade by tested machinery instead of
by a ledger that describes it. `discovery-sync-check.mjs`, its ledger, its six states and its
tests all delete. The reverse-debt problem disappears rather than being modelled.

**Cost.** A real migration in another repository, owned by people who did not take this
decision. ofbo's instantiation content (CBUAE register, OFBO brand profile, hard-stop
checklists, Q1–Q5 workflows) must be confirmed to survive adoption untouched — it should, since
those are seams the installer never writes, but "should" is not "verified". The six conflicts
must be resolved by someone who understands both sides.

**If rejected**, the honest fallback is to keep the ledger *and schedule the reconciliation* —
because rc.35 made it possible for the first time. An unscheduled reconciliation has already
demonstrated what it does: nothing, for eleven days, silently.

**Not decided here.** Whether ofbo adopts at `core`, `governed` or `full` tier; the migration
sequence; who resolves the six conflicts. Those follow the decision, they do not precede it.

## Alternatives considered

- **Keep hand-reconciling.** Now possible (rc.35 implemented `--reconcile`). Rejected as the
  primary option because it leaves six conflicts growing and depends on someone remembering; but
  it is the correct fallback if adoption is refused, and is strictly better than the status quo.
- **Fork properly — declare the trees independent.** Honest, and cheap today. Rejected because
  it forfeits the reason the harness is generic: hardening found in one instantiation stops
  reaching the other, and the Loom's central claim is that the frame is reusable.
- **Automate a sync bot.** Rejected. A bot that copies cannot resolve a conflict, and would have
  to stop at exactly the six files that need judgement — reproducing this problem with more
  moving parts.
