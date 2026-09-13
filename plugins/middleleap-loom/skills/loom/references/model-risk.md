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

States use the five-state maturity model of `bank-grade-gap.md` (absent → defined → mechanically
validated → platform enforced → organisationally enforced). A gate that validates a *declaration*
grades **mechanically validated**, never "enforced" — platform/organisational enforcement is the
adopter's.

| Model-risk control | How the Loom does it | State |
|---|---|---|
| **Model inventory** | `docs/governance/model-manifest.json` — one entry per model *role*, with provider, model id, prompt/harness version, and risk tier | **Mechanically validated** (template + gate) |
| **Pinning** | `model-provenance-check.mjs` fails the build if any `model_id` / `prompt_version` is floating (`latest`, `main`, a moving range) | **Mechanically validated** (gate) |
| **Tiering** | `risk_tier: high\|medium\|low` on each role; the tier drives which controls are mandatory | **Mechanically validated** (gate) |
| **Eval before release** | For eval-required tiers the manifest must carry a passing eval **run against the shipping pin** — the anti-stale-eval check. The eval *rig* is domain-specific and yours to build; the gate enforces that a release cannot claim green without a fresh, tier-appropriate eval | **Mechanically validated** (gate); eval content is the adopter's |
| **Independent validation** | High-tier roles must record `validated_by`, and the gate **resolves it against the identity registry** — free text, an agent, a builder, or a party that is not second-line / `model-validator` all fail; the `model-risk-reviewer` agent is the ② Assess challenge on any model/prompt change | **Mechanically validated** (the field is registry-resolved; the independent *function* is the org's) |
| **Runtime governance** | High-tier roles must declare runtime monitoring, a suspension authority, and a fallback in the manifest; `model-provenance-check.mjs` fails a high-tier role that omits them | **Mechanically validated** (declaration; the live monitoring itself is the adopter's) |
| **Drift monitoring** | `change-watch` (continuous assurance ① Watch) surfaces model/eval drift as a horizon item on a schedule/event | **Defined** — an agent scan is not a mechanical gate under this file's own §1 rule; the high-tier runtime declarations above are the mechanically validated half, and continuous production monitoring is the adopter's |
| **Provenance in the evidence bundle** | The manifest + eval verdict seal into the release bundle (delivery step ⑧), so a reviewer can reconstruct which model reasoned about what | **Mechanically validated** (sealed) |
| **Replayable decision log** | `decision-log-check.mjs` validates an append-only sha256 hash chain of the agent's decisions — contiguous, tamper-evident, each entry reconstructable (2.0-rc); *capture* (writing the entries) is the adopter's harness wiring | **Mechanically validated** (gate); capture is the adopter's |
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

## The reviewers are models too (2.1.0)

HG-0006 used to be applied to the delivery loop and the discovery facilitator and to nothing
else, while the agents that *review* the loop's work — `hard-stop-reviewer`,
`contract-conformance-reviewer`, `risk-reviewer`, `data-governance-reviewer`,
`model-risk-reviewer`, `discovery-boundary-reviewer`, `change-watch`,
`shariah-conformance-reviewer` — sat outside the manifest. A reviewer that says PASS wrongly is
an approval path with a blind spot, so the same four rules now apply to them, held by
`scripts/agent-output-check.mjs` (control `AGENT-OUTPUT`):

- **One output shape.** Every reviewer emits `loom.agent-output/v1`
  (`.claude/agents/agent-output.schema.json`) after its human-readable lines: agent, the pins
  it ran under, the inputs it read, the state of its register, a verdict, a confidence, and
  findings that each carry at least one evidence ref into a file it read.
- **Register absent ⇒ `INSUFFICIENT_EVIDENCE`.** A reviewer whose register (data-risk, model
  manifest, obligations, Shari'ah structures, knowledge pins) is not mounted says it cannot
  judge. It never falls back to prose or memory. This is the one behaviour the fixtures pin
  hardest, because it is the one a model most readily gets wrong.
- **Inventoried.** Every emitting agent is a role in the model manifest, by name or through a
  role's `agents` list; the shipped template carries one `assurance-reviewers` role for all
  eight on one pin. Split it when the pins differ.
- **Evaluated — honestly.** `agents/evals/<agent>/<case>/` ships the specification: a case, its
  inputs, the expected output. The gate validates the fixtures structurally in CI and exits 2
  on `--run` until an adopter wires an eval rig, because a fixture set nobody has run against the
  model is a specification of behaviour, not a measurement of it. The shipped eval report for
  the role says EXAMPLE on its face for the same reason.

What this does not change: a prompt is still not a gate. The reviewer's step stays graded
Defined in `bank-grade-gap.md`; what moved to mechanically validated is the contract around it.

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
(cluster B, where these controls sit on the five-state maturity scorecard).
