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
