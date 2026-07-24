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

## 2.0-rc.9 addendum — rc.8 hardening (the audit's four gaps closed)

An independent audit of merged rc.8 (`origin/main@3402903`) found the definition of done
unsatisfied on four points, each reproduced and confirmed. rc.9 closes them:

1. **Artifact provenance enforced, not just rendered** — `brainkit-provenance` is now a
   seal-verifiable plan-only evidence type (`requiredTypesFor` demands it when a plan requires it;
   the seal validates the record names its BrainKit and artifacts), and `brainkit-check`
   cross-checks the sealed record against the LIVE package digest and byte-scans every covered
   artifact for the embedded digest. A correct visual with the wrong digest now fails.
2. **Canonical section set is complete and unique** — removing `architecture` from
   `manifest.sections` and resealing used to pass; now every canonical section must be declared
   exactly once, and extra sections need owners too.
3. **Approval is version-bound and versions are semver** — `not-semver` fails, and an approval
   recorded for 1.0.0 does not cover a manifest that now says something else.
4. **Source grounding is positive and per-section** — empty `approved_sources` fails, every
   section maps to at least one register source (`sections[].sources`), and a repo-relative
   source reference that does not exist (a broken D6/domain pointer) fails.

Every new rule carries a negative test reproducing the audit's exact bypass (brainkit suite:
20 cases; seal suite extended). Scorecard unchanged — this hardens the existing BRAINKIT and
HG-0003 controls rather than adding one: still **34 mechanically validated · 6 defined · 7
absent · 0 platform / 0 organisationally enforced** across 47 controls.

## 2.0-rc.11 addendum — the release-evidence plane rebuilt on the artifact digest

Verified against `origin/main@2cf680e` (rc.10). rc.11 is WS1 of the control-plane plan
(`docs/loom-control-plane-plan.md`) — the P0 foundation that moves the assurance subject off the
source commit and onto the **immutable artifact digest**, closing the two verified evidence-plane
defects:

- **F1 (commit self-reference) — closed.** A product eval that names the commit *containing* it
  provably ran before that commit existed. The new `release-subject.json` (verified by
  `release-subject-check.mjs`) is the immutable binding root — a real 40-hex source commit, a
  **digest-pinned** artifact uri (a tag-pinned `:latest` fails), and the trusted builder. The new
  `release-attestation-check.mjs` cross-binds source → artifact → product evals → the sealed anchor
  to **one** artifact digest: each product eval must now carry `evaluated_artifact` matching the
  built digest, a value that exists only *after* the commit — dissolving the self-reference.
- **F2 (symbolic release identifier) — closed.** `evidence-seal-check.mjs` now requires
  `release_commit` to be a 40-hex sha; the shipped `evidence-example` — which passed with
  `release-v-demo` — is **re-cut** against a real commit, the demo ed25519 key rotated and the
  bundle re-sealed (the private key is discarded, as the registry always said it should be).
- **WS1.4 — the lane model extends** from `pr | release | scheduled` to
  `pr | build | release | deploy | scheduled`; the two new controls run in the `release` lane, so
  release-evidence checks stop masquerading as PR-source checks.

Honesty invariant holds: both gates prove the **records** are coherent and agree on the digest and
that the anchor is authentically signed; that the artifact was actually built by that builder from
that commit — and that the *deployed* digest is the authorized one — is the platform's signed
provenance and live observation, which is WS2 (rc.12), recorded honestly as not-yet-observed here.

CI: the adopted dry-run runs the two new gates on the release-subject the build job produces, and
three new negative bypass cases (**15–17**) join the suite: a symbolic `release_commit` fails the
seal, evidence reused for a different artifact digest fails the cross-binding, and a commit-only
eval not bound to the built artifact fails. Scorecard (generated): **36 mechanically validated · 6
defined · 7 absent · 0 platform / 0 organisationally enforced** across 49 controls, 12 flagged
adopter-side. Still gated on adopter-side evidence for 2.0-stable (WS2 platform observation, the
supervised pilot, independent validation, the ofbo back-port).

## 2.0-rc.12 addendum — platform enforcement made real (WS2)

WS2 of the control-plane plan, closing the review's F3 ("platform controls are declared, not
observed") and the residual of F4 (the routine lane had no trusted controller). The Loom used to
validate *declarations about* branch protection; nothing proved the platform prevents bypass, which
is why no control ever graded above mechanically-validated.

- **Platform observation (WS2.1)** — `platform-activation-check.mjs` verifies a read-only observation
  record: the live mechanism is active AND refused a **negative bypass test**, the observer is an
  identity **outside the agent's write authority** (not a builder/agent, resolved against the
  registry), the record is fresh and ed25519-signed by a registered observer issuer.
- **Graduation (WS2.2)** — a catalog control may claim `platform-enforced` only with a verified
  observation naming it; `platform-activation-check` fails the build on an overstated claim. The
  bundle still ships **zero** platform-enforced controls (live observation needs adopter
  credentials), so graduation passes trivially here and the negative test proves the overstatement
  fails — the honesty invariant is intact.
- **Routine controller (WS2.3)** — `routine-controller.yml`: a reference auto-merge bot that runs
  under a **separated** identity (disjoint from the coding agent), enables auto-merge only for a
  qualifying routine PR with config-reconciliation green, and records every decision. rc.10 gave the
  platform a clean `routine-qualified` signal; this gives it the controller that acts on it. Shipped
  as a tested reference (`ROUTINE-CONTROLLER`, defined/adopter-side) — running it with a real
  separated bot and merge-queue ruleset is the adopter's.
- **Continuous reconciliation (WS2.4)** — `config-reconciliation-check.mjs` reconciles the approved
  `config-baseline.json` against the live observation and the identity registry, failing on any
  **weakening** drift (removed required check, disabled admin enforcement, re-enabled force-push,
  weakened CODEOWNERS, widened workflow token, swapped OIDC issuer, or an AI identity in an approval
  group). On drift the routine lane fails closed via `routine-envelope.suspended`, so auto-merge
  cannot ride a drifted control plane. `config-baseline.json` and the platform-activation evidence
  are new control-plane targets (owned, not agent-writable).

CI: two new gates on live-signed observations (generated per-run, non-aging), and three new negative
bypass cases (**18–20**): a platform-enforced claim without a receipt, a control-plane weakening, and
a suspended routine lane. Full suite **390 green**; 26 new unit tests. Scorecard (generated): **38
mechanically validated · 7 defined · 7 absent · 0 platform / 0 organisationally enforced** across 52
controls, 13 flagged adopter-side. Platform-*enforced* stays 0 by design: the bundle ships the
observation machinery; the live observation, the separated controller identity and the pilot are the
adopter's — recorded honestly, not gestured at.

## 2.0-rc.13 addendum — compiler-bound regulated requirements (WS3) + runtime-neutral guardrails (WS4)

WS3 and WS4 of the control-plane plan.

**WS3 — bind regulated requirements into the compiler (closes F5).** D6 used to fail-when-absent only
under a CLI flag (`--require-register`), so a CI-config change could weaken a regulated build. Now the
requirement is compiled:
- The policy compiler emits `required_capabilities` — profiles declare capabilities
  (`data_risk_register`, `model_risk`, `shariah_governance`, `consent_management`, `human_oversight`,
  …) as a map with attributes (`minimum_version`, `minimum_tier`, `institution_owned`), merged
  strongest-wins and monotonic by construction (property-tested).
- `compiled-requirements` aggregates capabilities across governed changes; `validate.registerMandatory`
  = `flag OR compiled`. If any change compiles `data_risk_register`, a missing register FAILS D6 with
  **no flag**; the flag survives only as a manual tightening. CI proves it in the adopted layout
  (positive + negative 21: the requirement is genuinely derived, not hardcoded).
- Four product-type profiles (`consumer-lending`, `islamic-product`, `open-finance`,
  `ai-decision-system`), each compiling a distinct capability set; composition proven.

**WS4 — make guardrails runtime-neutral (F6, corrected).** The premise "distributed through a Codex
marketplace" was wrong (this is a Claude Code marketplace), but the substance held: the local hooks are
Claude-Code-specific and the Loom nowhere stated what evaporates elsewhere. Now:
- `guardrails/guardrail-policy.json` states, per guardrail × runtime, exactly what is `enforced`,
  `ci-backstop`, or `uncovered`. `guardrail-policy-check.mjs` verifies the policy is honest — every
  claimed mechanism EXISTS, every uncovered runtime names none, and a blocking guardrail enforced
  nowhere (network-egress) must be flagged `known_gap`. No implied coverage.
- The **capability matrix** (`guardrails/README.md`) is generated from the policy and doc-integrity-
  gated. Hostile scenarios (a PII literal, a test-weakening edit) are driven through the REAL
  Claude Code hooks in the test, proving the `enforced` claims. The CI gates are the enforcement of
  record where a runtime lacks a hook.
- `guardrail-policy.json` is a new control-plane target (owned, not agent-writable).

CI: two new gates, two new negative bypass cases (21 F5-derivation, 22 implied-coverage). Full suite
**411 green** (+20 tests). Version bumped to rc.13. Scorecard (generated): **39 mechanically validated ·
7 defined · 7 absent · 0 platform / 0 organisationally enforced** across 53 controls, 13 flagged
adopter-side. Honesty invariant holds: compiled capabilities beyond `data_risk_register` are emitted but
only D6 consumes one so far (no gate claims to enforce the others), and no guardrail implies coverage a
runtime lacks.
