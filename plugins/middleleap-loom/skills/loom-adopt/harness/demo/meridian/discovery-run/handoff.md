---
artifact: handoff
stage: handoff
design_profile: discovery/brand/design.md
run: "cross-bank-money"
licenses: []
---

# Delivery hand-off — cross-bank-money

> The boundary object. Delivery-ready iff gates D1–D9 are green and this contains **no**
> delivery design. Problem in, solution authored later. `licenses:` is empty on purpose: this
> demo run admits no backlog item; a real run names the items it licenses.

## Problem (from `problem-statement.md`)

- **Problem:** a Meridian customer with products at other banks cannot see their whole position before a due date, and Meridian can only answer for its own slice.
- **Target user:** the salary-account customer with a card, loan or savings elsewhere, the week before salary day.
- **Success measures:** cross-bank enquiries halved for opted-in customers; manual liability letters reduced; a stated share of the pilot cohort returning within a due-date window.
- **Explicitly out of scope:** moving money between banks (H3); advice or recommendations; business customers.

## Data-governance position (from `data-governance.md`, D6)

- **Residual-risk verdict:** Conditional — Medium for the consolidated view under CTRL-003 and CTRL-004; Low for non-production data under CTRL-001.
- **Conditions delivery inherits:** a named owner for the receiving-consent journey; certification evidence for the data-recipient role before any pilot exposure; the platform dependency on the outsourcing register; H3 excluded; every cited obligation verified by its owner against the current Regulation and Standards.

## Direction, made tangible (from `prototype.md`)

- **Prototype:** `prototype.md` + `wireframe.html` — *direction, not specification*.
- **Validated framing hypotheses:** H1 (know the consolidated position) confirmed; H2 (trust under the customer's own consent) confirmed as a direction under consent controls.
- **Open questions for Develop:** consent-journey ownership; certification path and timing for the data-recipient role; liability allocation for a wrong balance shown.

## Funding position (from `business-case.md`, where the institution requires one)

- **Decision requested / recorded:** continue to a synthetic prototype and a delivery plan under the conditions above — no business case required at this threshold for the demo run.
- **Total-cost-of-change band delivery must land inside:** not set for the demo.

## Gate status

| Gate | D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 |
|---|---|---|---|---|---|---|---|---|---|
| Pass? | yes | yes | yes | yes | yes | yes | yes | yes | yes |

## What delivery owns now

The right diamond authors the solution from scratch against the delivery contract. This brief
informs; it does not design. The obligations it cites become controls the compiled route
requires; the first of them to be traced end to end is OB-AE-MTPOL-PSI-001 when H3 is
eventually taken up — and until then, H3 stays a greyed affordance.
