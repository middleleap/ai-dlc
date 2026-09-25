---
artifact: problem-statement
stage: define
design_profile: discovery/brand/design.md
run: "plain-language-decline"
---

# Problem statement — plain-language-decline

> Define (converge). Gates D1, D3, D4.

## The problem (falsifiable)

> For **a retail customer declined for a personal loan** who **wants to know why and what would
> change the answer**, today **the decline letter gives no reason although the decision records
> one**, which causes **"unexplained decision" complaints, calls that end in escalation, and
> applicants who do not come back**. We know this from **S-001, S-002, S-003, S-004, S-006,
> S-007**.

Framing hypotheses this run tests:

- **H1** — Applicants who are told the main reason in plain language, in the first sentence, complain less than applicants who receive today's letter. (S-003, S-010, S-008)
- **H2** — Applicants who are told what would change the answer are more likely to reapply than to complain. (S-007, S-012)

## Strategic intent

- `SI-02` "Make every customer-facing decision explainable to the customer in plain language" — from Meridian's institutional strategy `[synthetic]`.

## Target user

- Persona (synthetic): "Aisha", 29, salaried for eleven months, applied for a personal loan to pay a course fee, declined on length of employment
- Context / trigger: the day the decline letter arrives, before she calls

## Success measures

A solution would be successful if, and only if:

| Measure | Baseline (today) | Target | How measured |
|---|---|---|---|
| "Unexplained decision" complaints after a personal-loan decline | largest category (S-001) | halved for the pilot cohort | complaints MI, pilot vs control `[synthetic]` |
| Declined applicants who reapply within six months | not tracked today | tracked, and higher than control | lending MI `[synthetic]` |
| Reasons shown that model validation has confirmed | none shown today | every reason shown | model risk management sign-off `[synthetic]` |

## Constraints (boundaries, not solutions)

- Regulatory / governance: the decision is made with a scoring model, so the `ai-decision-system` profile applies and model validation owns every reason shown (S-011); reasons that cannot be disclosed stay undisclosed (S-009); the obligations are cited by id in `data-governance.md`.
- Operational: the decision's reason field exists today and is unused (S-004).
- Out of scope (explicit): changing the credit policy or the model; card and overdraft declines; any appeal process beyond telling the customer how to ask for a review.

## Stakeholders & scope (D3)

| Stakeholder | In/out of scope | Why |
|---|---|---|
| Head of conduct `[synthetic]` | in | owns the measure and the decision to continue |
| Complaints lead `[synthetic]` | in | owns the complaint volume the problem creates |
| Retail credit risk `[synthetic]` | in | owns what the reasons are and what may be disclosed |
| Model risk management `[synthetic]` | in | owns whether a reason shown is true of the model |
| Retail lending operations `[synthetic]` | consulted | produce the letter; do not decide |
| Card and overdraft products `[synthetic]` | out | different decisions, different letters |

> **Not here (D4):** no letter wording as specification, no data model, no technology choice,
> no delivery stories.
