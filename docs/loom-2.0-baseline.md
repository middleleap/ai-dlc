# Loom 2.0 — recorded baseline (release 1.9.1)

**Date:** 2026-07-22 · **Recorded against:** `middleleap-loom` 1.9.1
Companion to `docs/loom-2.0-plan.md` §0/§13. This is the measured state the
2.0 release train starts from — future reviews diff against this file.

## Verified state

| Check | Result |
|---|---|
| Plugin version (`plugin.json` = `marketplace.json`) | 1.9.1 in both |
| `node scripts/validate-marketplace.mjs` | pass |
| Adopted-layout dry-run (`.github/workflows/validate.yml`) | 106/106 tests green |
| Six bundled gates on shipped templates (control-plane, model-provenance, evidence-seal, data-lifecycle, operations-signal, discovery-link) | all green *after* the ADOPT step; control-plane now **fails by design on the unadopted template** |
| Packaging contaminants (`.DS_Store` etc.) | none |

## Scorecard baseline (three-state model, superseded in 1.10)

Per `plugins/middleleap-loom/skills/loom/references/bank-grade-gap.md`, across
~47 assessed capabilities: **~15 Enforced · ~17 Named-only · ~15 Absent.**
Release 1.10 replaces this three-state grading with the five-state model
(Absent / Defined / Mechanically validated / Platform enforced /
Organisationally enforced) and moves the state of record into the control
catalog. Honest note for the re-grading: most rows currently marked
"Enforced" are gates that validate *declarations* — under the five-state
model they will grade **Mechanically validated**, not Platform enforced.

## False greens fixed in 1.9.1

- The placeholder CODEOWNERS team (`@your-org/…`) passed the control-plane
  gate. Now: a placeholder-only owner **fails** the gate, with a unit test
  and a CI negative test proving the unadopted template is rejected.
- `bank-grade-gap.md` graded "Q1b anti-reward-hacking gate — Enforced" for
  the bundle; no Q1b CI script ships (only the `test-tripwire.sh` hook).
  Re-graded Named-only; the gate itself ships in 1.10.

## Known false greens remaining (scheduled for 1.10)

- `model-provenance-check.mjs` accepts `result: "pass"` /
  `threshold_met: true` as declarations — no evaluation artifact, hash,
  identity resolution, or builder/validator separation.
- `evidence-seal-check.mjs` verifies chain integrity and completeness-by-type
  but not the *semantics* of sealed artifacts, and nothing binds the bundle
  to the released commit.
- Q2/Q4 scanner fills, history-aware secrets scanning, SBOM/provenance
  verification are "ADOPT" seams with no output validation.
- `operations-signal-check.mjs` passes green on the shipped template even
  though an empty manifest should fail once a production authorization
  exists (rule lands in 1.12).

## 1.10 addendum — truthful enforcement, delivered

Of the four remaining false greens above, 1.10 closed the first three:

- **Model provenance:** eval blocks now require dataset/runner versions, a
  timestamp, and the report artifact by `ref` + `sha256` — re-hashed by the
  gate. A declared pass without its report fails.
- **Evidence seal:** the manifest must carry `release_commit`, and every
  sealed artifact is verified *semantically* — failing tests, non-PASS
  verdicts, error-level SARIF, or a critical vulnerability fail even when
  the chain is byte-intact. Required types grew to nine (adds sast, sbom,
  dependency-audit, provenance).
- **Q-gates:** `test-integrity-check.mjs` (Q1b), `sast-check.mjs` (Q2
  output validation), `secrets-scan.mjs` (tree + history), and
  `supply-chain-check.mjs` (SBOM/audit/provenance) now ship, each with unit
  tests and a CI negative bypass test.
- **New:** the five-state maturity model is canon; the control catalog
  (`control-catalog.template.json` + `control-catalog-check.mjs`) is the
  state of record and cannot overstate itself; `CONTROL_TARGETS` covers
  every bundled gate, hook, workflow, and governance manifest.

Still open, by design: the operations-manifest fails-after-launch rule and
the second-line hold (1.12); identity resolution against a registry and
builder/validator group separation (1.11, needs the identity-registry seam).
Scorecard after 1.10: **~17 mechanically validated · ~17 defined · ~15
absent · 0 platform enforced · 0 organisationally enforced (as shipped).**

## 1.11 addendum — the bank profile preview, delivered

The product-governance plane (the review's largest named gap) now ships as
mechanically-validated machinery:

- **Policy compiler** (`core/policy-compiler.mjs`): classification compiles
  the path — gates, control functions, evidence, passport sections — from
  pure-data profiles (`regulated-bank` + `uae-bank` jurisdiction + `lending`
  / `payments` product types). Monotonic by construction (cumulative union),
  proven by a property test across profile combinations, tiers, and flags.
  A product change cannot classify itself low; an unclassified or
  unprofiled change is blocked.
- **Change envelope** (`change-envelope-check.mjs`): the governed change
  object. Stored plans are RECONCILED against a fresh compile (hand-edited
  or stale plans fail); the classifier must be a human with classification
  authority (agents cannot set or lower a tier — envelope files are
  CODEOWNERS-owned by the second line); state transitions require receipts;
  exemptions need owner, rationale, compensating control, unexpired expiry,
  and second-line approval; production states cannot be claimed before the
  1.12 machinery exists.
- **PA1/PA2** (`product-approval-check.mjs`): a high-risk product cannot
  enter Develop without PA1 or claim launch without PA2 — sections compiled
  per profile, approvals resolving to HUMAN registry identities holding the
  role; builders cannot issue second-line approvals; `by: "Risk"` fails.
- **A1–A5** (`architecture-assurance-check.mjs`): threat → control → test
  traceability (the threat model covers the AI harness itself); material
  open findings block.
- **Identity registry seam** (`identities.template.json` +
  `identity-registry-check.mjs`): agents hold no approver roles;
  second-line ∩ builders = ∅. The attestation-issuers registry ships as the
  §6 contract; signature *verification* lands in 1.12.

CI dry-run: 8 negative bypass tests (adds: hand-edited control plan,
PA1 revoked mid-develop, agent-signed approval). Worked example:
`change-example/` (CHG-2026-0042, high-tier UAE retail lending,
in-delivery). Scorecard after 1.11: **~22 mechanically validated · ~17
defined · ~15 absent · 0 platform / organisationally enforced (as
shipped).**

## 1.12 addendum — production controls + the risk-scoped gate runner

- **R-gates** (`operational-readiness-check.mjs` + `service-readiness`
  template): R1–R6 with freshness windows (BCP/DR 365d, rollback 180d,
  kill-switch 90d, capacity 365d). The template ships with unparseable
  ADOPT dates — copied-but-never-exercised fails, like the CODEOWNERS
  placeholder. Freshness is checkable; the truth of a drill is the
  adopter's attestation, stated as such.
- **Compound production authorization** (in the envelope gate): the
  1.11 refusal of production states is replaced by receipts — PA2 +
  R-gate-green readiness for every declared service + the second-line
  release hold RELEASED by a second-line human (missing hold = HELD,
  fail closed; builders/agents cannot release it) + anchored,
  issuer-verified evidence at high/critical tiers.
- **Real attestation verification** (`core/attestations.mjs`): ed25519
  in-process — the shipped example anchor is signed by a demo issuer
  whose public key lives in the registry; a flipped byte fails
  (negative-tested). Platform mechanisms (sigstore, CI-OIDC) report
  UNVERIFIED-HERE until wired — an honest gap, not a silent pass.
- **Silence-after-launch**: an empty (or missing) operations-signal
  log FAILS once any governed change holds a production state.
- **Gate runner** (`core/gate-runner.mjs`): lanes (pr · release ·
  scheduled) + path scoping read from the control catalog — governed
  data, not CI editing. The always-on tamper core never skips; an
  unknown diff fails open to running MORE; every skip is recorded with
  its reason. Closes the "15 gates on every PR" efficiency critique
  structurally.
- **Deliberately deferred to 2.0-rc** (recorded as `absent` in the
  catalog, not gestured at): the signed continuous-assurance cycle
  record, and the replayable agent decision log.

CI dry-run: 11 negative bypass tests (adds: stale kill-switch,
production-authorized with the hold still held, empty ops log after
launch) + a runner-skips-are-recorded assertion. Scorecard after 1.12:
**~27 mechanically validated · ~17 defined · ~14 absent · 0 platform /
organisationally enforced (as shipped).**

## 2.0-rc addendum — the release candidate, bundle-side complete

The last bundle-side deliverables of the 2.0 plan, closing the two
`absent` rows 1.12 deferred honestly and adding the remaining §10/§16
machinery:

- **Signed assurance-cycle record** (`assurance-cycle-check.mjs`):
  each continuous-assurance run leaves a record covering all six
  lifecycle steps, signed with real ed25519 over its canonical hash
  and confirmed by a second-line human, with an unresolved-findings
  register — an open, overdue finding blocks. `ASSURANCE-CYCLE` moves
  absent → mechanically-validated.
- **Replayable decision log** (`decision-log-check.mjs`): an
  append-only hash chain of the agent's decisions — editing,
  reordering or dropping an entry breaks the chain; entries must be
  contiguous and reconstructable (actor = agent, decision, rationale,
  inputs, tools, timestamp). Capture is adopter wiring; integrity
  ships. `DECISION-LOG` moves absent → mechanically-validated.
- **Enterprise adapters** (`adapter-check.mjs` + `adapters/`): a
  neutral contract mapping external systems (branch protection, GRC)
  to catalog controls via signed envelopes; a mapping to a
  non-existent control fails; a reference mapping with only ADOPT
  placeholders is reported "declared, not active".
- **High-tier model runtime governance** (extends
  `model-provenance-check`): a high-tier model must declare monitoring
  metrics, a suspension threshold, and an outage fallback.
- **Supervised-pilot playbook** (`runbooks/pilot-playbook.md`): staged
  cohorts + an adversarial checklist mapping each attack to the gate
  that catches it, marked CI-proven vs live.

CI dry-run: **242 tests, 17 gates, 14 negative bypass tests** (adds:
tampered assurance cycle, rewritten decision-log entry, adapter to a
non-existent control). Scorecard after 2.0-rc: **~30 mechanically
validated · ~17 defined · ~12 absent · 0 platform / organisationally
enforced (as shipped).**

## What 2.0-STABLE still needs (adopter-side, not in this repo)

Deliberately gated on evidence from outside a plugin bundle: a
supervised production pilot run end to end, an independent risk
review, internal-audit re-performance of a release assessment, and the
ofbo back-port of every gate change. Until those exist, the honest
status is **release candidate, not certified** — and adoption of the
Loom is not, and does not substitute for, regulatory approval.

## 2.0-rc.7 addendum — composition: the compiler now commands execution

The six workstreams of the rc.7 plan (`docs/loom-2.0-rc7-plan.md`), each closing a verified
review finding:

- **W1 — envelope as execution root (F1+F3):** `core/compiled-requirements.mjs` aggregates
  every governed change's compiled plan into one source of truth; the gate runner makes a
  plan-required control **unskippable** in its lane; the evidence seal derives its required
  types from the plans (a low-tier change seals less, a high-tier more); and product evals,
  assurance cycles, and the decision log flip from hardcoded-optional to
  **mandatory-when-compiled** — absent-OK for a generic repo, absent-FAILS once a plan asks.
  The original 1.11 exit criterion (plan vs execution reconciliation) is finally true.
- **W2 — routine lane split (F2):** `routine-change-check.mjs --assert-routine` is a distinct
  check context that exits 0 only for a qualifying claim, so a merge queue can key auto-merge
  on it; an ordinary PR fails it and cannot enter the routine queue.
- **W3 — honest cycle semantics (F4):** a signed assurance cycle with a `fail` step blocks
  unless a second-line, unexpired risk acceptance covers it; `n/a` needs rationale + approval;
  and once anything is in production, a stale or missing cycle fails.
- **W4 — one copy manifest (F5):** `copy-manifest.json` + the idempotent `adopt.mjs` installer
  drive the CI dry-run AND generate the SKILL.md copy table; the doc-integrity gate fails the
  build on drift, so the adoption guide can never lag the machinery again.
- **W5 — validated_by resolution (F6):** at validation tiers, `validated_by` must resolve to a
  human `model-validator` in the second line, not a builder, not free text.
- **W6 — generated scorecard (F7):** `generate-scorecard.mjs` projects the scorecard from the
  control catalog (one source of truth); adopter-side capabilities (IAM, WORM, DAST, the
  pilot, a live exam) are catalog entries flagged `adopter_side`, and the two stale prose rows
  are gone.

CI dry-run: **299 tests, all gates green, 14 negative bypass tests** (adds: routine-qualified
rejects an ordinary PR, a compiled-plan-required product-eval cannot be absent, a failing
assurance cycle blocks). The gate runner now executes 9 controls on a clean diff (up from 5)
because the compiled plan makes the product-governance families unskippable. Scorecard
(generated): **33 mechanically validated · 6 defined · 7 absent · 0 platform / 0
organisationally enforced (as shipped)** across 46 controls, 12 flagged adopter-side.

Still, honestly: 2.0-stable stays gated on adopter-side evidence — a supervised production
pilot, an independent risk review, internal-audit re-performance, and the ofbo back-port.
The composition critique is closed; institutional operation is the pilot's job, not the
bundle's.

## 2.0-rc.8 addendum — the Institutional BrainKit

Verified against `origin/main@267b606` (rc.7). The rc.8 workstreams add the **institution-owned
seed of the context brain** and compose it through the rc.7 machinery rather than beside it:

- **WS1** — the marketplace adoption dry-run now installs THROUGH `adopt.mjs` from
  `copy-manifest.json` (no parallel CI copy list); a latent manifest path bug (DISCOVERY.md
  resolved one directory too high) is fixed, and a test proves a new manifest entry lands with no
  CI edit.
- **WS4** — `planHash`'s flat top-level replacer (a whitelist that silently dropped every nested
  key) is replaced with a recursive canonical serializer; compiled plans now carry
  `profile_bindings` (profile + kind + version + digest), so a revised profile makes a stored plan
  stale.
- **WS3** — an **institution profile** (`profiles/institutions/`) composes on top of base +
  jurisdiction + product, contributing the `brainkit-conformance` gate, `brainkit-provenance`
  evidence, and the `institutional-context-owner` role — mandatory-when-compiled; a generic repo is
  unaffected.
- **WS2/WS5/WS6** — the canonical BrainKit (`references/brainkit.md`, six adopt-pending templates),
  the `brainkit-init` skill (drafts from approved sources, never invents or approves), and the
  read-the-BrainKit repository-instructions fragment (never overwrites `AGENTS.md`/`CLAUDE.md`).
- **WS7** — `brainkit-check` makes BrainKit integrity a merge condition (approved · sealed · owned ·
  grounded · digest-consistent · D7 projection fresh · plan pins the live digest), wired into the
  catalog, compiler binding, gate runner, CODEOWNERS, control-plane-check, the routine-change floor,
  and CI. A sealed, approved, neutral **Meridian Trust** example gives the green path; a 13-case
  suite covers every negative.
- **WS8** — the D7 seam (`discovery/brand/design.md`) is preserved as a compatibility projection
  that carries the BrainKit id/version/digest into HTML `<meta>` and DOCX/PPTX/XLSX properties;
  existing D7 output is byte-unchanged for a plain brand.
- **WS9** — multi-repo distribution as a digest-pinned local-snapshot model (a runbook + a
  `release_digest` pin verified by `brainkit-check`); no public registry, no live service.

CI: the manifest-driven dry-run runs **314 tests (311 pass, 3 bundle-only skips, 0 fail)** plus the
14 negative-bypass cases and a dedicated BrainKit step (positive path + 13-case negative suite).
Scorecard (generated): **34 mechanically validated · 6 defined · 7 absent · 0 platform / 0
organisationally enforced (as shipped)** across 47 controls, 12 flagged adopter-side. The honesty
invariant holds: no bundled gate claims platform- or organisational-enforcement, and the BrainKit is
*institutionally conformant*, never *regulatorily compliant*. Real institutional BrainKits are
private; the public repo ships schemas, machinery, validators and the fictional example only.
