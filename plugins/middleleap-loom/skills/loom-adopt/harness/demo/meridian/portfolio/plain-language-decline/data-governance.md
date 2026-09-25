---
artifact: data-governance
stage: define
design_profile: discovery/brand/design.md
run: "plain-language-decline"
---

# Data-governance feasibility — plain-language-decline

> Define (converge). Gate D6: every `DR-*`, `CTRL-*` and `OB-*` id below resolves in the mounted
> registers. The explanation obligation is Meridian's own internal policy (fictional), cited by
> id; nothing here paraphrases a regulation from memory.

## Data the direction would touch

| Data element (synthetic) | Classification | Subject | Purpose |
|---|---|---|---|
| The decision's recorded top contributing factors | Personal, derived by a model | The applicant | Source of the reason shown |
| The mapping from a factor to a plain-language reason | Institutional, validated by model risk | — | What the customer is told |
| The applicant's application data (income, employment length, existing debt) | Personal, financial | The applicant | Already held; referenced by the reason, not re-collected |
| Undisclosable indicators (fraud, unreleased bureau flags) | Personal, restricted | The applicant | Must never reach the letter |

## Risk mapping (→ register)

| Data element | `DR-*` category | Inherent rating | Obligation(s) | Mitigating `CTRL-*` |
|---|---|---|---|---|
| A reason shown that the model does not support, or a restricted indicator disclosed | DR-5.1 (DR-5.1-001) | High | OB-AE-MTPOL-EXPL-001 | CTRL-005 |
| Applicant data in any prototype, fixture or letter sample | DR-1.1 (DR-1.1-001) | High | OB-AE-PDPL-DATA-001 | CTRL-001 |

## Residual-risk verdict (gate D6)

- **Residual rating after controls:** Low for DR-5.1-001 with CTRL-005 (validated reason map, restricted factors suppressed); Low for DR-1.1-001 with CTRL-001.
- **Acceptable for delivery?** Conditional — the direction may proceed to a synthetic prototype now, and to delivery only when (1) model risk management has validated the factor-to-reason map; (2) the list of undisclosable factors is owned by retail credit risk and tested as a negative case; (3) the governed AI record for the scoring model names this new use of its output.
- **Conditions / watch-items carried into hand-off:** the three conditions above.

## Uncovered risks

- None identified. The run records that a reason shown is a claim about the model (S-011), which is why CTRL-005 is owned jointly with model risk management rather than by conduct alone.
