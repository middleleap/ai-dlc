# UAE consumer-AI governance route

Loom 2.4 closes one dangerous applicability gap: for the shipped `uae-bank` jurisdiction,
a medium-or-higher **new product** or **material product change** with
`flags.model_involved: true` automatically acquires the `ai-decision-system` product profile.
The classifier supplies facts; jurisdiction policy derives the control route. A change cannot
obtain a lighter plan merely because its author forgot to list the AI profile.

This is deliberately not a claim that every software change using an engineering assistant is
a consumer-AI product. Those changes retain the base regulated-bank model-risk requirements.
An adopter may broaden the automatic rules to reflect its own inventory and risk appetite.

## Regulatory basis

The source is the CBUAE **Guidance Note on Consumer Protection and Responsible Adoption and Use
of Artificial Intelligence and Machine Learning by Licensed Financial Institutions**, issued
11 February 2026:

- [Guidance overview and scope](https://rulebook.centralbank.ae/en/rulebook/guidance-note-consumer-protection-and-responsible-adoption-and-use-artificial-intelligence)
- [Transparency and explainability](https://rulebook.centralbank.ae/en/rulebook/4-transparency-and-explainability)
- [Data quality, privacy and security](https://rulebook.centralbank.ae/en/rulebook/5-data-quality-privacy-and-security)
- [Human oversight and consumer protection](https://rulebook.centralbank.ae/en/rulebook/7-human-oversight-and-consumer-protection)
- [Model Management Standards](https://rulebook.centralbank.ae/en/rulebook/model-management-standards)

The obligation register remains an **illustrative mapping**. An adopting institution must have
Legal and Compliance validate applicability, interpretation and effective dates against its own
products, permissions and supervisory communications.

## What compiles

The automatic profile adds three joined capabilities:

1. `ai_governance` — `ai-governance-check.mjs` binds each implicated model role to its shipping
   model/prompt pin, accountable human, oversight and intervention path, non-AI alternative,
   customer review route, Arabic and English disclosure, monitoring, incident response,
   privacy/security and third-party assessments, and re-hashed stress evidence.
2. `fairness_evaluation` — the fairness record must cover the implicated model roles and the
   exact pins that ship.
3. `decision_contestability` — the explanation and contest route must cover those same roles.

`change-envelope.model_roles` provides that scope. If any change requiring a capability omits
the field, the gates fail open to **all** covered-tier manifest roles; omission can widen required
coverage but can never narrow it.

## What a green build does not prove

A green gate proves that governed records exist, join to the shipping pins, and meet their
declared structural rules. It does not prove that:

- a disclosure reached a customer or was understood;
- human intervention was meaningful or timely;
- an alternative route was actually available;
- the monitored population was representative or the chosen fairness metric was sufficient;
- production telemetry, incident response, data controls or third-party controls operated; or
- the regulator accepts the institution's interpretation.

Those are platform and organisational outcomes. The institution must observe, bypass-test,
retain and independently challenge them before graduating any control beyond
`mechanically-validated`.
