# Model risk — governing the agent as a model (HG-0006)

The Loom's controls so far govern the *code* the agent writes. But the agent itself is a
**model**, and under model-risk standards — SR 11-7, PRA SS1/23, ISO 42001, NIST AI RMF, the
EU AI Act — a model that reaches into a regulated SDLC must be inventoried, tiered, pinned,
evaluated, monitored, and independently validated. `governance.md`'s **HG-0006** names the
decision ("the agent is an ungoverned model → AI/model-risk governance for the harness
itself"); this file is how the Loom makes it concrete, and which parts ship as machinery.

The principle, in one line: **you cannot validate, monitor, or reproduce a model you never
pinned.** Provenance is the precondition for every other model-risk control, so it is where
the enforcement starts.

## What the Loom governs — and how

| Model-risk control | How the Loom does it | State |
|---|---|---|
| **Model inventory** | `docs/governance/model-manifest.json` — one entry per model *role*, with provider, model id, prompt/harness version, and risk tier | **Shipped** (seam + template) |
| **Pinning** | `model-provenance-check.mjs` fails the build if any `model_id` / `prompt_version` is floating (`latest`, `main`, a moving range) | **Enforced** (gate) |
| **Tiering** | `risk_tier: high\|medium\|low` on each role; the tier drives which controls are mandatory | **Enforced** (gate) |
| **Eval before release** | For eval-required tiers the manifest must carry a passing eval **run against the shipping pin** — the anti-stale-eval check. The eval *rig* is domain-specific and yours to build; the gate enforces that a release cannot claim green without a fresh, tier-appropriate eval | **Framework shipped** (gate); eval content is the adopter's |
| **Independent validation** | High-tier roles must record `validated_by` (a party independent of the builders); the `model-risk-reviewer` agent is the ② Assess challenge on any model/prompt change | **Named-only** (field + challenge agent ship; the independent *function* is the org's) |
| **Drift monitoring** | `change-watch` (continuous assurance ① Watch) surfaces model/eval drift as a horizon item on a schedule/event | **Partial** (build/event-time; runtime production monitoring still the adopter's) |
| **Provenance in the evidence bundle** | The manifest + eval verdict seal into the release bundle (delivery step ⑧), so a reviewer can reconstruct which model reasoned about what | **Shipped** |
| **Replayable decision log** | Not yet — reconstructing *why* the agent decided, step by step | **Absent** |
| **Fairness / explainability / AI incident response** | Not yet — applicable where the use case demands it | **Absent** |

## The manifest, and the gate

`docs/governance/model-manifest.json` is the seam (a template ships in the loom-adopt harness).
Each role pins its model and prompt version, declares a tier, and — at the required tiers —
carries an eval block whose `evaluated_model_id` / `evaluated_prompt_version` **must match the
pin that ships**. `scripts/model-provenance-check.mjs` runs in CI like any other gate; a
floating pin, a missing or failing eval, a stale eval, or a missing independent validation
blocks merge. `ADOPT:` markers set which tiers require an eval and a validation.

The anti-stale-eval check is the model-risk analogue of Q1b (the anti-reward-hacking gate): a
green recorded against a *different* model or prompt than the one shipping is not evidence, and
the gate treats it as a failure rather than a pass.

## Honest limits

- **The gate enforces provenance, not competence.** It proves an eval was run against the
  shipping pin and met its threshold — it cannot tell you the *threshold was meaningful*. That
  judgement is the `model-risk-reviewer` agent's and, above it, the independent validation
  function's.
- **Independent validation is a function, not a field.** Recording `validated_by` and running a
  challenge agent is hygiene; the control is an organisationally-separate model-risk function.
  That stays the adopter's to stand up.
- **Runtime drift monitoring is out of build-time scope.** `change-watch` catches drift on a
  schedule/event; continuous production monitoring of the live model is a run-the-bank control.

See `governance.md` (HG-0006), `delivery-harness.md` (the Q-gate pattern and step ⑧ evidence
bundle), `continuous-assurance.md` (the Watch/Assess lifecycle), and `bank-grade-gap.md`
(cluster B, where these controls sit on the enforced/named-only/absent scorecard).
