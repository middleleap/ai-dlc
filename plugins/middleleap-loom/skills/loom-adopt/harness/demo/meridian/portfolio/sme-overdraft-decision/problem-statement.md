---
artifact: problem-statement
stage: define
design_profile: discovery/brand/design.md
run: "sme-overdraft-decision"
---

# Problem statement — sme-overdraft-decision

> Define (converge). Gates D1, D3, D4. Frozen 23 Sep 2026. The data-governance feasibility
> (stage 4) is the next record; it is not written yet, so D6 is open.

## The problem (falsifiable)

> For **a small-business owner who already banks with Meridian** who **needs an overdraft under
> AED 100,000 to take an order or cover a gap**, today **the decision takes a median of six
> working days, most of it spent collecting documents Meridian does not read or already holds**,
> which causes **lost trade for the owner and rework for the bank**. We know this from **S-001,
> S-002, S-003, S-004, S-005, S-011**.

Framing hypotheses this run tests:

- **H1** — Most of the wait is document collection, not credit judgement, and removing it does not change the approval rate. (S-002, S-003, S-004)
- **H2** — Owners who bank with Meridian would accept a decision based on what Meridian already holds, with a short list of anything missing. (S-011, S-012)
- **H3** — Owners who bank elsewhere would share accounting records to replace the document pack. (S-008) *Held for a later run.*

## Strategic intent

- `SI-01` "Reduce the time a retail customer waits for a credit decision without raising affordability risk" — cited by the business-lending owner; see `intent.md`.

## Target user

- Persona (synthetic): "Hamdan", owns a building-materials trading company, eleven staff, has banked with Meridian for six years; a supplier offers a discount for payment within the week
- Context / trigger: an order that needs working capital before the customer pays

## Success measures

A solution would be successful if, and only if:

| Measure | Baseline (today) | Target | How measured |
|---|---|---|---|
| Median working days to decision, existing customers, under AED 100,000 | 6 (S-001) | 2 | business-lending pipeline report `[synthetic]` |
| First-review approval rate | ~4 in 5 (S-002) | unchanged | credit risk MI `[synthetic]` |
| Applications returned for a missing document | ~1 in 3 (S-010) | halved | operations log `[synthetic]` |

## Constraints (boundaries, not solutions)

- Regulatory / governance: the affordability test and the sector concentration limits do not change (S-007); any change that brings a model into the decision acquires the `ai-decision-system` profile and its governed AI record automatically.
- Operational: three systems hold the same business details today (S-006); the direction must not add a fourth.
- Out of scope (explicit): owners who do not bank with Meridian (H3 is framed, not taken forward); facilities above AED 100,000; any change to pricing; declines driven by sector limits (T-3 is a separate run).

## Stakeholders & scope (D3)

| Stakeholder | In/out of scope | Why |
|---|---|---|
| Business-lending product owner `[synthetic]` | in | owns the problem and the decision to continue |
| Credit risk, business banking `[synthetic]` | in | owns what the decision rests on |
| Second-line risk `[synthetic]` | in | owns the affordability and concentration position |
| Business-lending operations `[synthetic]` | in | owns the rework the problem creates |
| Business relationship managers `[synthetic]` | consulted | carry the customer conversation; do not decide |
| Retail lending `[synthetic]` | out | different customer, different limits |

> **Not here (D4):** no screens as specification, no data model, no technology choice, no
> delivery stories.
