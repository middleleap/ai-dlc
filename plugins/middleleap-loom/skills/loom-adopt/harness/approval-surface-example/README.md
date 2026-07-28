# The approvals-surface worked example (Factory Floor WS5 · Decision D5.1)

`derive.mjs` generates the PA1 and PA2 approvals surfaces for the bundled `change-example/`'s
compiled control plan, so `scripts/approval-surface-check.mjs` checks a real derived surface against
a real plan instead of reporting that there are none. Without it the D5.1 half of that gate passed
**vacuously** on every push:

```
Approval-surface gate (D5.1 · D5.4) — OK (0 approval surfaces against their compiled plans, 2 catalog-B forms …)
```

Zero. The D5.4 half was doing real work — two catalog-B forms ship in `floor/` and are compared with
the git templates they mirror — but nothing anywhere contained an approvals surface, so none of
AS-R01…AS-R10 had ever run against a file. That is the same hole `freeze-stamp-check` had before
`freeze-example/` was staged beside it, and the same one `drift-check` had before
`drift-example/observe.mjs`.

```
node approval-surface-example/derive.mjs PA1                       # the surface, on stdout
node approval-surface-example/derive.mjs PA2
node approval-surface-example/derive.mjs PA2 --break drop-section   # a page that has stopped matching its plan
node approval-surface-example/derive.mjs --plan <path> --change <id>
```

Run it from the harness root or from an adopted repository; it prints one surface to stdout and its
reasoning to stderr, and the caller decides where it lands. That is `observe.mjs`'s arrangement, for
the same reason: the gate reads `floor/approvals/*.json` relative to the working directory, and only
the caller knows which working directory it is about to check.

## What the gate says in each state

| Staged | Output | Exit |
|---|---|---|
| nothing | `OK (0 approval surfaces against their compiled plans, 2 catalog-B forms …)` — vacuous | 0 |
| `PA1` + `PA2` | `OK (2 approval surfaces against their compiled plans, 2 catalog-B forms …)` | 0 |
| `--break drop-section` | `AS-R03: … no section for compiled role risk-second-line` | 1 |
| `--break invented-role` | `AS-R04: … a section for shariah-committee, which the plan does not compile at PA2` | 1 |
| `--break evidence-writable` | `AS-R05: … not read_only` + `AS-R05: … writable_by is ["approver"]` | 1 |
| `--break strip-banner` | `AS-R01: … the non-authoritative banner is missing or altered` | 1 |
| `--break stale-plan-hash` | `AS-R10: … derived from plan_hash "0000…", but the plan now compiles "ca64…"` | 1 |

The gate reads `floor/approvals/` **and** `docs/governance/changes/` from the working directory, so
both have to be staged: a surface with no plan beside it is AS-R10 (`no compiled control plan …
names it`) plus AS-R03, not a pass. In the adopted layout CI already stages the change; the harness
root ships `floor/` but no `docs/`, so reproducing the table there means staging both and removing
them afterwards.

Both directions, and CI should assert both — an in-step surface must report a **non-zero** count and
pass, and each mutation must fail with **its own** code. A count assertion matters as much as the
failure assertion here: this gate's failure mode was never a wrong answer, it was a right answer
about nothing.

## The five mutations

Each one is a way a real approval page goes wrong, named after the rule it must trip.

| `--break` | Trips | What it does to the page |
|---|---|---|
| `drop-section` | AS-R03 | deletes the section for a role the plan compiles — the refusal then arrives at the product-approval gate, for a role nobody was ever asked about |
| `invented-role` | AS-R04 | adds a `shariah-committee` section the plan never compiled — a page that invents an approver teaches the institution a role set the compiler never agreed to |
| `evidence-writable` | AS-R05 | lets the approver edit the evidence they are judging on — an approval over a self-selected pack is an opinion with a signature on it |
| `strip-banner` | AS-R01 | removes the page-level non-authoritative banner (sections keep theirs, so the page-level check is what fires) |
| `stale-plan-hash` | AS-R10 | keeps a `plan_hash` from an earlier compilation — the case that actually happens |

**The digest is recomputed after every mutation, deliberately.** Leaving it stale would make all five
fail on AS-R10 (`this is not the surface that was derived`) and prove nothing about the rule under
test. Recomputing produces a page that is perfectly *self*-consistent and disagrees only with the
plan — which is exactly the hand-drawn page these rules exist to refuse, and a strictly harder case
than the gate will meet in practice.

`--break` also refuses to emit a surface that still verifies. A mutation that has quietly stopped
mutating is the same defect as a gate that passes vacuously, one layer down: the negative case would
go green and nobody would notice.

## Why it is generated rather than committed

Two reasons; the second is the load-bearing one.

**A surface binds `plan_hash`.** AS-R10 fails the moment the page and the plan disagree, and
`plan_hash` changes whenever a profile gains a field — it changed twice while this bundle was being
written. `approval-attestation-example/regenerate.mjs` exists because the attestation example hit
exactly that wall and the only escape was re-signing by hand. A committed surface would start
failing every build for a reason unrelated to the change under review, somebody would delete it, and
the count would go back to zero. Generating it keeps it perpetually in step. `validate.yml` generates
the platform-activation observation, and `observe.mjs` the drift observation, for the same reason.

**Committing it would contradict the thing it demonstrates.** `core/floor-approval-surface.mjs`'s
first design property is DERIVED, NEVER DRAWN. A committed surface is a hand-drawn page with a
provenance story attached: when the deriver changed it would be *edited* rather than regenerated, and
the gate would then be checking a fiction. The example has to be produced the way the thing it
demonstrates is produced, or it demonstrates something else.

## Which plan it derives from

The gate's own `loadPlans(cwd)` — the same plans `approval-surface-check.mjs` will check the surface
against, read from the same files by the same code. Deriving from a second copy is how a page and a
gate come to disagree about a hash both computed correctly. Only when the working directory compiles
no change at all does it fall back to the bundled `change-example/control-plan.json`, and it says so
on stderr; in an adopted repository with a staged change the fallback is never reached, which is why
this works unchanged in the bundle and in the adopted layout.

## Why both stages

Because they bind different role sets, and that is the whole point of D5.1: PA1 binds 3 roles for
this plan (`accountable-executive`, `product-owner`, `risk-second-line` — the core set plus the
high-tier addition), PA2 binds all 12. One page reused across both asks the wrong people at one of
them. A single-stage example would leave `rolesFor()`'s branch untested against a file, and PA2 is
also the only one of the two that exercises a multi-section page with five second-line roles on it.

## What this does NOT demonstrate

**No page was created anywhere.** There is no workspace, no vendor API, no grant. This exercises the
gate and shows the shape; it is not evidence that an approvals database exists.

**`writable_by: []` is a layout, not a permission.** Whether a workspace actually withholds edit
rights from an approver is a platform grant, observed by an activation adapter (WS6/D6.3) — never a
property of a JSON file. A green gate here says the page *declares* the right separation, not that
anything enforces it.

**Nothing here approves anything, and the green line says so.** WS5's entry gate has not passed: it
needs an independent second-line review of the workstream's design, and no such review exists. The
approval of record is a signed envelope verified by `core/approval-attestations.mjs` and merged by a
second-line human — `approval-attestation-example/` is that half, and it is a different example
because it is a different claim.

**The plan is a fixture.** `CHG-2026-0042` is the bundle's synthetic worked change (a UAE retail
credit limit review at a bank that does not exist). A derived surface is only ever as real as the
plan it came from, and a stronger version of this example would derive from an adopter's own
compiled change — which is what it will do, on their first one.

**Nothing asserts the mutations in the bundle's unit tests.** `core/floor-approval-surface.test.mjs`
and `scripts/approval-surface-check.test.mjs` already cover the rules and the pairing over temporary
fixtures; what was missing was the gate doing work *in a repository*, which is a CI dry-run
assertion, not a unit test. If that CI step is ever dropped, this directory silently stops being
checked — the same fragility `drift-example/` carries.

## Not shipped to adopters

Like `freeze-example/`, `drift-example/` and `approval-attestation-example/`, this is the Loom's own
demonstration data rather than adopter machinery, and is deliberately absent from
`copy-manifest.json`. An adopter's first approvals surface should be derived from their own compiled
change, by `node core/floor-approval-surface.mjs <control-plan.json> PA1` — which the installer does
ship.

---

**Companions:** `../core/floor-approval-surface.mjs` (read its header first) ·
`../scripts/approval-surface-check.mjs` · `../change-example/` (the plan it derives from) ·
`../approval-attestation-example/` (where the decision actually becomes one).
