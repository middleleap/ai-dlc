---
artifact: outcome
stage: define
design_profile: discovery/brand/design.md
run: "cross-bank-money-stopped"
outcome: stopped
decided_by: "po-fatima"
decided_at: "2026-09-09T10:30:00Z"
reason: "The customer panel refuted H2: most participants would not consent to Meridian seeing their other banks' balances, so the consolidated view has no consented basis to proceed on. The problem stands; the direction does not."
evidence_ref: "research-log.md#S-010"
hypotheses:
  - id: H1
    verdict: confirmed
  - id: H2
    verdict: refuted
  - id: H3
    verdict: not-tested
successor_run: ""
---

# Outcome — cross-bank-money-stopped

> A discovery is **allowed to fail**: stopping the wrong direction early is a win, and it is
> recorded as an outcome, not hidden. This is the alternative ending of `cross-bank-money` —
> the same problem, the same signals S-001–S-009, and a stakeholder reaction (S-010, S-011)
> that refuted the trust hypothesis. The harness builds the `discovery-stopped` record from this
> front-matter; a human product owner decided, an agent may only have recommended.

## What was found

H1 held: customers want to know their consolidated position (S-002, S-009, S-010). H2 was
refuted: in the synthetic panel most participants would not consent to Meridian receiving their
other banks' data even with a visible, revocable consent (S-010); the data-protection officer
recorded that without that consent there is no basis to proceed (S-011). H3 was not tested — it
was never authorised for prototyping.

## What would reopen it

Evidence that the trust objection is about the *journey* rather than the *bank* — for instance
a panel reaction to a consent journey that shows the customer exactly what is received and lets
them withdraw in one step — or an operations signal from the contact centre that the enquiry
cost has grown. Either would route here as a `reopened-discovery` record citing this run.
