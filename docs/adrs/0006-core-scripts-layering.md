# ADR-0006 — `core/` may import `scripts/`, in exactly three places

**Status:** **proposed** · **Date:** 2026-07-26 · **Decider:** AWAITING — this is an architecture
decision and the drafter is the builder who introduced the inversion; it wants someone who did not.

## Context

Three modules under `core/` import from `scripts/`, which inverts the layering the rest of the
harness follows (`scripts/` are gates; `core/` is the logic they run over):

| module | imports | from |
|---|---|---|
| `core/floor-approval-surface.mjs` | `SECOND_LINE_ROLES`, `pa1Roles` | `scripts/product-approval-check.mjs` |
| `core/floor-mi.mjs` | the seal helpers | `scripts/evidence-seal-check.mjs` |
| `core/floor-ops-signal.mjs` | `TYPES`, `SEVERITIES`, `ROUTES`, `evaluate()` | `scripts/operations-signal-check.mjs` |

It was not designed. Two separate tracks reached it independently while building WS5 and WS6, both
for the same reason: the alternative was a second copy of a table that a gate already owns.

## The forces

**Duplication is the worse failure here.** The floor's approvals page derives its role sections from
`pa1Roles(plan)` — the PA gate's own derivation. Re-deriving them would produce a page that agrees
with the gate today and disagrees after the next policy change, and the disagreement would be
invisible: the page would render, the gate would pass, and they would be checking different things.
Same for the ops routes and the seal. In a governance harness, two tables that silently diverge are
a false green, and false greens are the thing this method exists to refuse.

**The inversion is real, though, and unratified is worse than either.** An inverted import that
nobody decided is one refactor away from becoming a cycle, and an ESM cycle does not fail loudly: it
hoists, survives module init, and hands a caller `undefined` at call time. In this codebase that
means a gate evaluating against an empty role set — a false green again, arrived at from the other
direction.

**What actually makes it safe is a property, not an intention.** The three gates reach only into
*other* `core/` modules — `approval-attestations`, `attestations`, `identity-map`,
`compiled-requirements` — never back into the three `core/floor-*` modules that import them. The
graph is acyclic. That was true by luck, and nothing enforced it.

## Decision

**Ratify the inversion, confined to these three modules, and enforce the property that makes it
safe.**

`core/layering.test.mjs` now asserts three things, each verified to fail on the violation it names:

1. Exactly those three `core/` modules import from `scripts/` — widening the set fails the suite
   and points here, so it becomes a decision rather than a drift.
2. None of the three gates imports a `core/floor-*` module back.
3. The whole `core → scripts → core` graph is walked and asserted acyclic, so (2) staying sufficient
   is not assumed.

## Consequences

**Accepted:** the layering reads inconsistently to a newcomer, and the two module headers now carry
a paragraph explaining why. A reader who tries to "fix" it by reversing the imports will fail test 1
and be sent here.

**Rejected — extract the shared vocabulary down into `core/`.** This is the textbook resolution and
it is genuinely better: `SECOND_LINE_ROLES`, `pa1Roles`, the seal helpers and the ops tables move
into `core/`, and both layers import downward. It is rejected *now*, not on the merits, but because
it touches three gates, three core modules and their suites, and it would be landing inside a change
whose subject is something else. Ratifying with the hazard gated buys the same safety at a fraction
of the blast radius.

**The exit path is therefore open, and this ADR is how it stays open.** When the extraction happens,
it deletes this ADR's reason for existing: tests 1 and 2 become vacuous and should be removed with
it, while test 3 — the acyclicity walk — is worth keeping regardless.

## Scope of this acceptance

This ratifies **a layering exception for three named modules**. It does not:

- establish that `core/` may import `scripts/` generally — test 1 exists precisely to stop that
  reading
- ratify the *contents* of what is imported, only the direction
- substitute for the review any other architecture decision in this repository needs

## Verification

```
node --test core/layering.test.mjs                        3 pass · 0 fail
  · new core→scripts import          → caught (test 1)
  · gate importing core/floor-*      → caught (test 2)
  · both restored, suite green again
```
