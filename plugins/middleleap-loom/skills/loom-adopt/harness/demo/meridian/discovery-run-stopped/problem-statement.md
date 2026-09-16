---
artifact: problem-statement
stage: define
design_profile: discovery/brand/design.md
run: "cross-bank-money-stopped"
---

# Problem statement — cross-bank-money-stopped

> Define (converge). The single problem worth solving. Gates D1 (Problem framing), D3 (Scope &
> stakeholders), D4 (No-solutioning boundary — the sponsor's app idea, S-006, is *not* in here).

## The problem (falsifiable)

> For **a Meridian salary-account customer who holds a card, a loan or savings at other banks**
> who **is deciding, before a due date, what they owe and whether they can cover it**, today
> **they cannot see their whole position in one place and Meridian can only answer for its own
> products**, which causes **wrong or late decisions, repeat contact-centre enquiries and
> manual liability letters that are stale within the month**. We know this from **S-001, S-002,
> S-003, S-004, S-009**.

Framing hypotheses this run tests:

- **H1** — Customers want to *know* their consolidated position (balances, due dates, total exposure) more than they want Meridian to *act* for them. (S-009)
- **H2** — Customers would trust Meridian to show data from their other banks, if the consent is theirs to give and withdraw. (S-004, S-005)
- **H3** — A minority want Meridian to move money between their banks to cover a due date; this is a separate proposition with its own obligations, not the starting authorisation. (S-006, S-007, S-009)

## Strategic intent

- `SI-03` "Be the bank customers turn to for everyday money decisions" — from Meridian's institutional strategy `[synthetic]`; the decision authority reads this line, no gate does.

## Target user

- Persona (synthetic): "Noura", salary account at Meridian, credit card at bank B, car finance at bank C; checks balances the day before each due date
- Context / trigger: the week before salary day, deciding what to pay first and whether anything will bounce

## Success measures

A solution would be successful if, and only if:

| Measure | Baseline (today) | Target | How measured |
|---|---|---|---|
| Cross-bank "what do I owe" enquiries reaching the contact centre | ~1 in 9 account enquiries (S-002) | halved among customers who opt in | contact-centre disposition codes, opted-in cohort vs control `[synthetic]` |
| Manual liability letters issued per month | baseline to be counted (S-003) | reduced for opted-in customers | branch operations log `[synthetic]` |
| Customers who opt in and return within a due-date window | none (capability does not exist) | a stated share of the pilot cohort, agreed before pilot | product analytics on the pilot cohort `[synthetic]` |

## Constraints (boundaries, not solutions)

- Regulatory / governance: Meridian acts as a data recipient only under a customer's consent that is scoped, time-bound and revocable; receiving another bank's data carries the personal-data obligations in the register; any payment initiation is a separate proposition under its own obligations (S-007). The obligations are cited by id in `data-governance.md`, not paraphrased here.
- Operational: nobody owns the receiving-consent journey today (S-005); the platform admits an AI-assisted team only behind executable constraints (S-008)
- Out of scope (explicit): moving money between banks (H3 is *framed* here and *not* prototyped beyond a labelled affordance); advice or product recommendation; anything for business customers

## Stakeholders & scope (D3)

| Stakeholder | In/out of scope | Why |
|---|---|---|
| Retail product sponsor `[synthetic]` | in | owns the ambition and the decision to fund or stop |
| Head of contact centre `[synthetic]` | in | owns the enquiry cost the problem creates |
| Open Finance programme lead `[synthetic]` | in | owns Meridian's participation on the national platform |
| Second-line risk `[synthetic]` | in | owns the risk position before anything is built |
| Data-protection officer `[synthetic]` | in | owns the lawful basis and consent position |
| Platform owner `[synthetic]` | in | owns what the AI-assisted team may receive and touch |
| Branch operations lead `[synthetic]` | consulted | affected by the letters; does not decide |
| Business-banking product `[synthetic]` | out | different customer, different obligations |

> **Not here (D4):** no screens as specification, no data model, no technology choice, no
> delivery stories. The sponsor's proposed app (S-006) is recorded as a direction for the
> prototype and the hand-off, not as this problem's answer.
