---
name: npa-uae
description: New Product Approval (NPA) for a CBUAE-regulated bank. Use whenever a proposition, business problem, feature or amendment would put a new or changed financial product or service in front of customers — including Open Finance use cases (account aggregation, payment initiation, TPP services), lending and card changes, pricing changes, new channels, third-party or outsourced delivery, and product withdrawals. Provides the Business Proposition Form template every field of an NPA pack needs, the CBUAE anchors behind each field, the sign-off routing, the BAU assessments that run alongside, and how the Loom's discovery harness assembles the pack, takes it through Gate 2, turns approval conditions into controls, and schedules the post-implementation review. Triggers on "NPA", "new product approval", "business proposition form", "product committee", "can we launch this", "does this need approval", "amendment to an existing product", "withdraw a product", or any discovery pass whose selected problem implies a customer-facing product or service change.
---

# New Product Approval — UAE bank

## What this is

CBUAE requires every Licensed Financial Institution to run a strict product and service approval process before a new or updated financial product or service reaches the market, and to apply the Consumer Protection Regulation and Standards to any new product, service, activity or change (CPS Article 3, General Provisions). Banks implement this as a New Product Approval process: a Business Proposition Form completed by the proposing business, reviewed by every risk and control function, and approved by a product committee before build and launch.

This skill gives an agent the form, the meaning of every field, the regulation behind it, and the way the Loom uses it. Read `references/template.md` for the blank form (a Word version is in `assets/`), `references/regulatory-anchors.md` for the CBUAE references per field, and `references/example-connected-accounts.md` for a completed pack.

## When it applies

Anything that changes what a customer is offered, pays, agrees to, or experiences:

- A new product or service, including B2B and wholesale services
- An amendment or variation: pricing, fees, eligibility, features, channels, target segment, terms
- A withdrawal or phase-out
- A new use of an existing capability (an internal TPP capability offered externally is an amendment, not business as usual)
- A new third party or outsourced arrangement in the delivery or distribution of a product
- Open Finance use cases in either role: as LFI (what is shared, consent journeys, fees to TPPs) or as TPP (aggregation, payment initiation, affordability, any service built on another bank's data)

If in doubt, it applies. The cost of an unnecessary light pack is a day; the cost of launching without approval is a supervisory finding.

## How the Loom uses it

In the Loom's regulated-bank profile the New Product Approval is the **content** of the two
product-approval receipts the governance catalog already requires — `PA1` (permission to
develop) and `PA2` (permission to launch). This skill does not add a gate; it tells the agent
what the PA1/PA2 roles in a UAE bank actually sign, and assembles it from the discovery run.

| Loom stage | What happens with the NPA |
|---|---|
| Define — problem statement (D1) | If the framed problem implies a customer-facing product or service change, the run records `npa: required` and the request type (New / Amendment / Withdrawal). |
| Define — data-governance feasibility (D6) | Pre-fills 5.6 (data management) and the DPIA trigger; the `DR-*` categories cited become the pack's data-risk references. |
| Define — prototype and stakeholder reaction (D8, D9) | The customer journey (4.2), channels (3.3) and the disclosure and Key Facts Statement drafts come from the prototype and the recorded reactions. |
| Define — business case (5c, decision-routed) | The Business Proposition Form is assembled alongside `business-case.md`; 1.2 financial projections cite the same model. Sections 1–3 and the risk landscape in Section 5 are complete at problem fidelity; Section 4 stays at journey level (D4 — no solutioning). |
| Hand-off → `permission-to-develop` (PA1) | The NPA committee's first-line decision. Approval, conditions, validity and the PIR date are recorded as a signed, decision-routed record beside the hand-off. Every condition is compiled into the control plan. |
| Delivery — the warp | Conditions that can be expressed mechanically become gates: disclosure wording → a screen-conformance gate; cooling-off → a contract test; a segment restriction → an eligibility rule with a test. Conditions that cannot are listed as manual controls with an owner. |
| `uat-accepted` → `permission-to-launch` (PA2) | Section 4 (operating model, third parties, training, licensing) and Section 5 are re-confirmed against what was built; the second-line functions sign. The PA2 record references the PA1 record and each condition's control. |
| `in-production` | The post-implementation review the NPA requires is the same 90-day PIR the lifecycle already clocks; the 1.5 consumer-protection KPIs are its evidence, and the review opens the next discovery run's intake. |

Evidence produced: `npa-pack` (artefact digest of the form, sign-off roster), `npa-approved`
(committee, date, conditions, validity) at PA1 and again at PA2, and per-condition gate
evidence in delivery. Where the Kosli seam is mounted, these ride the same trail as the rest of
the run.

## Filling the form

The form has five sections and thirty-three fields; `references/template.md` has all of them with the guidance text. Rules the agent follows:

1. **Never leave a field blank.** "Not applicable" is a finding waiting to happen. Write why it does not apply.
2. **Every Section 5 risk question gets Yes or No and a rationale either way.** A "No" without reasoning is returned by the reviewing function.
3. **Name the regulation.** Each field in `references/regulatory-anchors.md` has the CBUAE reference the reviewer will check against. Cite it in the field.
4. **Quantify where the form asks.** Financial projections need a period and an ECL / capital line. Fraud needs an estimated loss. Operational risk needs the process, people, system and continuity impacts separately.
5. **Third parties trigger three questions.** Are they Authorised Agents under the CPS (if yes, an inclusive agreement is mandatory)? Is this outsourcing under the Outsourcing Regulation (if yes, TPRA and notification or approval)? Do they touch personal data (if yes, DPIA and the contractual clauses)?
6. **Islamic products or windows** need the ISSC's approval and the Shari'ah basis disclosed in the KFS; add it to 4.5 and 5.1.
7. **Fees** subject to CBUAE caps or approval go in 2.3 with the approval status; structured products need CBUAE approval before marketing.
8. **Scale the pack, not the rigour.** The Bank's NPA policy decides whether an amendment gets the full form or a short-form variant. When the policy is silent, the agent produces the full form and marks the fields the change does not touch as "unchanged from the approved product, reference [previous NPA ID]".
9. **Remove nothing from Section 5.** A risk function that is not consulted will not approve.

## Readiness checklist before Gate 2

The agent runs this and attaches the result to the `npa-pack` attestation:

- [ ] Request type set and, for amendments, the previous NPA reference given
- [ ] All 33 fields complete; all Section 5 Yes/No answered with rationale
- [ ] Financial projections tie to the capital case model (same hash)
- [ ] Key Facts Statement drafted if the product is consumer-facing
- [ ] Cooling-off applicability stated
- [ ] Fee approval or cap check done where fees are regulated
- [ ] Structured product? CBUAE prior approval flagged
- [ ] Islamic? ISSC approval path and Shari'ah basis stated
- [ ] Third parties classified: Authorised Agent, outsourcing, data processor
- [ ] DPIA / PIA / DMBE triggered where personal data is processed
- [ ] Consumer-protection KPIs defined with thresholds and an owner
- [ ] Exit strategy includes customer communication and data deletion
- [ ] Annexure 1 BAU assessments listed with status
- [ ] Sign-off roster complete by function; names left for humans

## Sign-off routing

Proposed by the product owner; reviewed by the department head; approved by the group head — then the functional reviews the committee expects: Compliance (conduct, consumer protection, regulatory), Financial Crime Compliance (AML/CFT, sanctions, PSRA), Fraud Risk, Operational Risk, Data Protection / Privacy, Information Security, Legal, Tax, Finance, Technology, Credit Risk for any asset product, Treasury for any balance-sheet product, Shari'ah for Islamic products, and Internal Audit informed. The agent pre-populates the roster with functions and leaves names blank; humans sign.

## What the agent must not do

- Must not mark a risk "No" to make the pack lighter.
- Must not invent regulatory article numbers; use `references/regulatory-anchors.md` or say "reference to be confirmed by Compliance".
- Must not include a real institution's name, internal system names, or prior NPA content in a pack for another institution.
- Must not treat NPA approval as build approval or the reverse; Gate 2 needs both the NPA decision and the capital decision.
