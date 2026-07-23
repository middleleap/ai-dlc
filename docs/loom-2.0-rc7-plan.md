# Loom 2.0-rc.7 — the composition plan

**Status:** proposed · **Date:** 2026-07-22 · **Owner:** middleleap-loom plugin
**Input:** the 6.8/10 bank-grade review of `origin/main@8805784` (v2.0.0-rc.6), every claim
of which was **verified against the code before this plan was written** — all seven hold.
**Companions:** `loom-2.0-plan.md` (the original architecture), `loom-2.0-baseline.md`
(release-by-release record).

The review's shift in theme is the plan's shift in theme. The first review's problem was
**false greens** — fields pretending to be controls. This review's problem is
**composition** — gates that are individually honest but not yet bound into one system the
policy compiler commands. In the reviewer's words, the remaining work is *"making the
existing gates unavoidable, compositionally complete and institutionally operated"* — not
inventing more gates. rc.7 does the first two; the third is the adopter's (§7).

## 0 · Verified findings (the facts this plan stands on)

Each reviewed defect, confirmed at `8805784`:

| # | Finding | Verified evidence |
|---|---|---|
| F1 | The compiler does not control execution | `core/gate-runner.mjs` has **zero** references to compiled plans; `scripts/evidence-seal-check.mjs` hardcodes `REQUIRED_TYPES`. The original plan's 1.11 exit criterion — "compiled plan vs executed gates reconciliation fails on mismatch" — was shipped as plan-*artifact* reconciliation only |
| F2 | The routine lane is not platform-distinguishable | `routine-change-check.mjs`: no claim → exit 0; qualified claim → exit 0. Same check context, same code — a merge queue keyed on this check cannot tell routine-qualified from ordinary work |
| F3 | Important controls pass when absent | `product-eval-check.mjs` returns OK with no manifest even when governed product changes exist; same hardcoded optionality in assurance cycles, decision log, adapters. F3 is F1 in disguise: optionality is hardcoded where it should be **compiled** |
| F4 | A signed failing assurance cycle passes | `assurance-cycle-check.mjs` accepts step `status: "fail"` as structurally valid and raises no finding — violating 1.10's own rule ("intact is not passing") one gate over from where it was coined |
| F5 | The adoption guide fell behind the machinery | `loom-adopt/SKILL.md:113` still says "all six gates"; the copy table stops at the 1.11 vintage. Same bug class as the 1.10 CI copy-list incident — fixed for CI, never for the human instructions |
| F6 | `validated_by` is declarative | `model-provenance-check.mjs:85` — a bare non-empty-string check, though the identity registry it should resolve against has existed since 1.11 |
| F7 | The self-grade is inconsistent | Catalog: 30 mechanically-validated / 6 defined / 2 absent over 38 controls. Narrative: ~32/~17/~12 over ~62 capabilities, still containing "Threat modelling — Absent" after A2 shipped and "Operational resilience is absent" directly beneath the mechanically-validated R1–R6 row |

Ratings accepted as fair: method 8.2 · mechanical controls 7.5 · supervised pilot (auto-merge
off) 7.5 · standalone production 5.0 · overall 6.8. The 5.0 is by design — the bundle ships
0 platform-enforced / 0 organisationally-enforced controls, and says so.

## 1 · W1 — Make the envelope the execution root (closes F1 + F3)

The one structural change. Everything else in rc.7 is repair; this is composition.

```text
change envelope → compiled control plan → mandatory gates
                                        → mandatory evidence
                                        → mandatory capabilities (evals, cycles, log)
                                        → permitted release state
```

Mechanics:

- **Catalog ↔ compiler binding.** Every catalog control gains a `gate_family` field naming
  the compiler family it implements (`D`, `PA1`, `A`, `Q`, `PA2`, `R`, `product-eval`,
  `assurance-cadence`, `decision-log`). `control-catalog-check` validates the vocabulary.
- **Plan-aware gate runner.** `gate-runner.mjs` loads every envelope under
  `docs/governance/changes/*/`, aggregates their compiled plans, and unions
  plan-required controls with the always-on tamper core and diff-implicated controls.
  A control required by any active plan **cannot be skipped** — the run record says
  `required by CHG-…` instead of a skip reason. Unknown diffs still fail open.
- **Plan-fed evidence seal.** `evidence-seal-check` takes required types = baseline ∪ the
  aggregated plans' `required_evidence`. A high-tier plan demanding `product-eval` evidence
  makes its absence a seal failure, not a shrug.
- **Mandatory-when-compiled.** `product-eval-check`, `assurance-cycle-check`,
  `decision-log-check`, `adapter-check`: absence stays OK for a generic repo, but once any
  aggregated plan (or, for cadence, any governed change in a production state) requires the
  capability, **absence fails**. The switch is compiled, never hardcoded.
- **Exemption carve-out.** Token telemetry stays a report, never a gate — cost must not
  become a merge control. The review conceded this; the plan preserves it explicitly.

Negative tests (CI): a plan requiring `product-eval` with no manifest fails · a plan-required
gate cannot appear in the runner's skip list · a seal missing plan-required evidence fails.

Exit criterion: **the original 1.11 exit criterion, finally true** — compiled plan vs
executed gates reconciliation fails on mismatch, demonstrated by a negative test.

## 2 · W2 — Split the routine lane into two check contexts (closes F2)

Fix-and-keep, not disable: the gate already carries all the qualification logic; what is
missing is a platform-legible signal, which is a ~20-line change plus CI wiring.

- `routine-change-check.mjs --assert-routine`: exits **0 only for a qualifying claim**;
  no claim and non-qualifying claims exit non-zero. Run as a separate CI job producing the
  distinct required check **`routine-qualified`**.
- The existing default mode stays as the normal-lane check (`normal-human-review`): an
  unqualified *claim* still fails it, ordinary work still passes it.
- Activation runbook gains the merge-queue recipe: **auto-merge requires
  `routine-qualified` specifically**, never the general gate suite.
- Negative activation test in the dry-run: an ordinary PR (no claim) must fail
  `--assert-routine` — proof an ordinary change cannot enter the routine queue.

Exit criterion: the two lanes are distinguishable **by check context alone**, with the
ordinary-PR-rejected probe in CI. Until an adopter wires the queue and records activation
evidence, the lane's catalog state remains mechanically-validated — auto-merge stays a
platform claim the adopter earns.

## 3 · W3 — Honest assurance-cycle semantics (closes F4)

Apply 1.10's semantic rule to 2.0-rc's own gate:

- Step `status: "fail"` **blocks**, unless the record carries a formal risk acceptance —
  `{accepted_by, rationale, expires}` — resolved to a second-line human, unexpired.
  An expired acceptance blocks like no acceptance.
- Step `status: "n/a"` requires a rationale **and** second-line approval — "not applicable"
  is a decision someone accountable made, not a default.
- **Cadence** (mirror of silence-after-launch): the profile declares
  `assurance_cadence_days`; once any governed change holds a production state, the newest
  cycle being older than the cadence — or there being no cycles at all — **fails**.
  "Assurance may not have run" stops being a pass the moment something runs in production.
- Trigger field already exists (`schedule|event`); cadence checks `ran_at` recency.

Negative tests: signed cycle with an unaccepted `fail` step → blocked · `fail` with an
expired acceptance → blocked · production state + stale/missing cycles → blocked.

## 4 · W4 — One copy manifest, three consumers (closes F5)

Kill the drift *class*, not the instance — the same defect broke CI in 1.10 and the
adoption guide now; both had hand-maintained copy lists.

- `harness/copy-manifest.json`: every bundle file → adopted destination → seam type →
  post-copy step (ADOPT substitution, date adoption, chain generation).
- `harness/adopt.mjs` — an idempotent installer driven by the manifest, emitting an
  **adoption report**: file → destination → seam → activation status
  (installed / already-current / ADOPT-pending).
- The CI dry-run consumes the **same manifest** (no more parallel copy scripts).
- The SKILL.md copy table is **generated** from the manifest; a doc-integrity check fails
  CI when the table and manifest disagree. The instructions can no longer lag the machinery
  because they *are* the machinery.

Negative test: add a file to the manifest, don't regenerate the table → CI fails.

## 5 · W5 — Resolve `validated_by` against the registry (closes F6)

The `resolveApprover` treatment every other approval already gets, cheap since 1.11:

- At validation-required tiers, `validated_by` must resolve to a registry identity that is
  **human**, holds `model-validator`, is in `second-line`, and is **not** in `builders`.
- Graceful only in the true generic case: no registry mounted → current string check plus a
  notice; registry present → resolution is mandatory.
- Templates update (`mrm-aisha`); negative tests: free text → fail · agent → fail ·
  builder-validator → fail.

This is the repo-side half of CBUAE MMS independent validation; the *function* stays the
adopter's, as the model-risk runbook already says.

## 6 · W6 — One scorecard, generated (closes F7)

Make "the catalog wins" mechanical instead of aspirational:

- Narrative-only capabilities (DAST/pentest, WORM store, fairness testing, board oversight,
  supervised pilot, regulator exam, full taxonomy, real-PII surface…) become **catalog
  entries** — state `absent`/`defined`, no mechanism, an `adopter_side: true` flag — so one
  artifact carries the whole truth including what a bundle cannot ship.
- `scripts/generate-scorecard.mjs` renders the scorecard block (counts by state, split
  bundle vs adopter-side) from the catalog; `bank-grade-gap.md` embeds it between markers.
- A doc-integrity check fails CI when the embedded block differs from a fresh generation —
  the same discipline W4 gives the copy table.
- The two stale prose rows (threat modelling "Absent", "operational resilience is absent")
  are corrected in the same pass — the last sed-era leftovers.

Standing rule added to the canon, learned from F4: **every new gate applies the semantic
rule to itself** — statuses it accepts are statuses it judges, and its plan review includes
the question "what does this gate accept that it should refuse?"

## 7 · Explicitly out of scope (adopter-side, unchanged)

The review's remaining preconditions for production authorization are organisational and
platform work no bundle can ship, already documented in the runbooks and the pilot
playbook: real branch protection + IAM + vault + model gateway + DLP + WORM, an
organisationally-independent second line operating the release hold, the MRM function, and
one limited, real-data, reversible supervised pilot with live operational and audit
evidence. rc.7 does not claim any of it; the scorecard keeps saying **0 platform-enforced ·
0 organisationally-enforced as shipped** until an adopter records activation evidence.

## Backlog

| ID | Story | Workstream | Priority |
|---|---|---|---:|
| RC7-01 | `gate_family` vocabulary in catalog + catalog-check validation | W1 | P0 |
| RC7-02 | Plan-aware gate runner: aggregated plans make controls unskippable | W1 | P0 |
| RC7-03 | Evidence seal takes required types from aggregated plans | W1 | P0 |
| RC7-04 | Mandatory-when-compiled for evals, cycles, decision log, adapters | W1 | P0 |
| RC7-05 | `--assert-routine` mode + `routine-qualified` check context + queue recipe | W2 | P0 |
| RC7-06 | Assurance-cycle failure/n-a/cadence semantics | W3 | P0 |
| RC7-07 | Copy manifest + idempotent installer + generated SKILL.md table | W4 | P0 |
| RC7-08 | `validated_by` registry resolution | W5 | P1 |
| RC7-09 | Scorecard generator + doc-integrity gate + adopter-side catalog entries | W6 | P1 |
| RC7-10 | New negative tests wired into the dry-run (one per closed finding) | all | P0 |
| RC7-11 | Visualizations + baseline addendum trued up in the same release | all | P0 |

Every workstream lands in **one release (2.0.0-rc.7)** — they are individually modest, and
the review's authorization list treats 1–5 as a unit. Version bumped in both manifests;
ofbo back-port noted per CLAUDE.md.

## Definition of done for rc.7

1. A compiled plan's requirements are **unavoidable**: gates unskippable, evidence
   mandatory, capabilities present — each with a negative test.
2. The routine lane is distinguishable by check context alone, with an ordinary-PR
   rejection probe.
3. No signed artifact passes while saying "fail" — anywhere, including cycles.
4. The adoption instructions are generated from the same manifest CI installs from.
5. Every approval-shaped field in the bundle resolves against the identity registry.
6. One scorecard source; doc drift fails CI; zero stale prose rows.
7. The next review's composition critique has nothing left to point at — what remains is
   institutional operation, which is the pilot's job, not the bundle's.
