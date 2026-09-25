# Worked example — Meridian Trust, Cross-Bank Money (the PFM view as a TPP)

*Meridian Trust is a fictional UAE bank used in Loom demonstrations. This pack is the one assembled at the "Investment case assembled" step of the discovery run `cross-bank-money` and taken to Gate 2 as the content of the `permission-to-develop` (PA1) receipt. It is written at the run's fidelity — problem, direction and obligations, no delivery design — and every figure in it is the run's own (`research-log.md` signals `S-001`–`S-011`). Obligations and risks are cited by their register ids from `open-finance-obligations.json`; article numbers are deliberately not quoted, because the register says they are to be verified by each owner against the current Regulation and Standards before citation.*

| | |
|---|---|
| **Product Name / Initiative** | Cross-Bank Money — a consolidated "what I have, what I owe, and when" view for a Meridian customer who holds accounts, cards or loans at other banks, built with Meridian acting as a **Third Party Provider (data recipient)** on the national Open Finance platform under the customer's own consent |
| **Request Type** | New ☑ — Meridian exercises the TPP / data-recipient role for the first time in a retail customer journey. **Customer-initiated payment (moving money between banks to cover a due date, framing hypothesis H3) is not in this request.** It is framed in the run, refuted for prototyping beyond a labelled affordance (S-011), and will be filed as a later **Amendment** to this NPA under its own obligations — see 1.1 and 4.5 |
| **Date** | [DD-MMM-2026] |
| **Discovery run** | `cross-bank-money` · D1–D9 green · hand-off recorded |

## 1. Business Rationale and Objectives

**1.1** A Meridian salary-account customer who holds a card, a loan or savings elsewhere cannot see their whole position in one place before a due date, and Meridian can only answer for its own products. The consequences are on record: wrong or late decisions, repeat contact-centre enquiries (roughly one in nine account enquiries are cross-bank "what do I owe" questions, S-002), and manual liability letters that are stale within the month (S-003). Strategic intent `SI-03`: "be the bank customers turn to for everyday money decisions." Three framings were tested — **H1** customers want to *know* their consolidated position more than they want Meridian to *act* for them (S-009); **H2** they would trust Meridian to show another bank's data if the consent is theirs to give and withdraw (S-004, S-005); **H3** a minority want Meridian to move money between banks (S-006, S-007, S-009). H1 and H2 are confirmed and are this proposition. **H3 is a separate proposition with its own obligations, deliberately excluded here; it returns as an Amendment, not as scope creep in this pack.** The sponsor's proposed app (S-006) was recorded as a direction, not as the problem's answer (D4).

**1.2** At problem fidelity. Cost lines named, not priced: platform participation in the data-recipient role, certification for that role, the consent-lifecycle control (`CTRL-003`), the certification-before-exposure and platform-dependency control (`CTRL-004`), monitoring and support. Benefit lines: reduced cross-bank enquiries reaching the contact centre; fewer manual liability letters; retained customers who return within a due-date window. The run set no total-cost-of-change band (`handoff.md`); figures are supplied by `business-case.md` where the institution's threshold requires one, and must share the model hash with the capital case. No ECL or capital line: this is a data proposition, not a balance-sheet product.

**1.3** Nobody owns the receiving-consent journey today (S-005). Certification evidence for the data-recipient role does not yet exist and gates any pilot exposure. The journey depends on the national platform and on other participants' data quality and availability. Liability for a wrong balance shown to the customer is not yet allocated between Meridian, the other bank and the platform (uncovered risk, `data-governance.md`). Customer trust in showing another bank's data is confirmed as a direction only under consent controls (S-011).

**1.4** One place to see the whole position the week before salary day: what is due in the next seven days, what is available across banks, and every commitment with its date. The customer sees exactly what Meridian sees and can switch it off. No document upload, no phone call, no stale letter. Persona (synthetic): "Noura" — salary at Meridian, card at bank B, car finance at bank C, checks balances the day before each due date.

**1.5** Consumer-protection KPIs, from the run's success measures: cross-bank "what do I owe" enquiries reaching the contact centre — baseline ~1 in 9 account enquiries (S-002), target halved among opted-in customers, measured by disposition codes on the opted-in cohort against a control; manual liability letters per month — baseline to be counted (S-003), target reduced for opted-in customers; customers who opt in and return within a due-date window — a stated share of the pilot cohort, agreed before pilot. Added by this pack: consent withdrawal rate; complaints per thousand opted-in customers; wrong-balance incidents reported by customers (target zero, every one investigated). Owner: retail product sponsor; reviewed monthly; reported to the NPA committee at the ninety-day post-implementation review.

**1.6** Exit: withdraw the view from the app; revoke every consent at the platform; delete received data within the consent's retention with a deletion attestation; inform opted-in customers in writing; no customer detriment because the view is additive and Meridian's own account data remains as it was. If the platform dependency fails resilience assessment (`OB-AE-CBUAE-RES-001`), exit before pilot rather than after.

## 2. Product Features and Overview

**2.1** One screen for one customer: "due in the next 7 days", "available across banks", and a commitments table joining Meridian's own accounts with balances, due dates and amounts received from other banks under a consent that carries scope, purpose and expiry, and that the customer can withdraw from a consent tile on the same screen. Read-only. No advice, no recommendation, no product offer. A "move money to cover the 28th" affordance is shown **greyed and labelled not authorised** — it exists to test H3 and to make the boundary visible, not to act.

**2.2** AED; other banks' balances shown in the currency the data carries, unconverted.

**2.3** No fee to the customer. Platform participation costs are borne by the Bank. No Central Bank fee approval is required for this change; if a fee is ever proposed, it returns to this form as an Amendment.

**2.4** None. Withdrawal of consent and removal of the view carry no charge.

**2.5** Not applicable to this change.

## 3. Distribution & Target Market

**3.1** Existing Meridian salary-account customers who hold a card, a loan or savings at other banks; pilot cohort agreed before launch. New-to-bank customers are not in scope for the pilot.

**3.2** UAE, onshore only.

**3.3** Mobile application at launch; web application when the consent journey has a named owner. Not in branch; the contact centre can explain the view and the withdrawal but cannot connect a bank on the customer's behalf.

**3.4** Existing eligible customer; holds an account at a participating bank on the national platform; completes the consent journey; the data-recipient role is certified (`OB-AE-OFS-CERT-001`) before the customer is exposed.

**3.5** Excluded at pilot: business customers (out of scope, different obligations); customers whose other bank is not a participant; jurisdictions excluded under the platform's fraud-prevention rules.

**3.6** In-view disclosure of what is received, from whom, for what purpose, until when, and how to withdraw — the consent tile is the disclosure. Key Facts Statement drafted for the view as a service. Every customer-facing text reviewed by Compliance before pilot; the prototype's wording is a direction, not the approved wording.

## 4. Operating Model

**4.1** Customer opts in → consent initiated with Meridian as data recipient → national platform → account-holding bank authenticates the customer → balances, due dates and amounts returned under the consent record → joined with Meridian's own account data → the view. Received data is bound to the consent record; use outside scope, purpose or expiry is refused; revocation is honoured before the next use and evidenced (`CTRL-003`). No payment rail is connected.

**4.2** Prototype: one low-fidelity screen, disposable, rendered under the Meridian brand profile (`prototype.md`, `wireframe.html`). Reactions on record (`stakeholder-reaction.md`, S-010/S-011): the sponsor and the head of contact centre confirmed H1 — "that is the call; if they can see this, they do not ring us"; second-line risk confirmed H2 as a direction under consent controls with a named owner; the head of contact centre was uncertain about H3 and second-line risk refuted it for prototyping beyond the greyed button. The consent-capture journey itself was deliberately excluded from the prototype because nobody owns it yet (S-005).

**4.3** The national Open Finance platform operator and the account-holding banks. None are Authorised Agents under the CPS: they do not act for the Bank towards the customer. The platform is a critical third-party dependency and is treated as one — resilience assessed, incidents and availability managed, and the dependency recorded on the outsourcing register before pilot (`OB-AE-CBUAE-RES-001`, `CTRL-004`). Data-processing terms per the platform's participation agreement.

**4.4** Contact centre: the view, the consent tile, how withdrawal works and what the centre cannot do on the customer's behalf. Product and data protection: the consent-lifecycle control and the revocation evidence. Compliance: the data-recipient role's obligations.

**4.5** Participation on the national platform in the **data-recipient** role, kept distinct from Meridian's existing data-provider role (`OB-AE-OFR-PART-001`); functional, security and customer-experience certification of that role against the Standards version in force, with evidence before any pilot exposure (`OB-AE-OFS-CERT-001`). No structured-product approval; conventional product, no ISSC involvement. **Payment initiation is not licensed by this NPA:** when H3 is taken up it is an Amendment to this reference, with the payment-initiator role's participation and certification, the payment-status integrity obligation (`OB-AE-MTPOL-PSI-001`) and its data-risk row (`DR-2.1-001`, `CTRL-002`) — cited here so the boundary is on record, not to authorise it.

## 5. Risk Considerations

**5.1** The five register obligations the direction cites in `data-governance.md` (D6), each with an owner: `OB-AE-OFR-PART-001` (participation in the role exercised — compliance), `OB-AE-OFR-CONSENT-001` (consent scoped, purpose-bound, time-limited, visible, revocable — data protection), `OB-AE-PDPL-DATA-001` (lawful basis, purpose limitation, minimisation, retention, never in non-production artifacts — data protection), `OB-AE-OFS-CERT-001` (no exposure before certification of the role — information security), `OB-AE-CBUAE-RES-001` (the platform as a governed critical dependency — operations). Every one is marked to be verified against the current Regulation and Standards by its owner before this register is treated as more than a demo fixture.

**5.2** Mis-selling risk if the view is presented as advice or as a promise that nothing will bounce — mitigated by read-only design, no recommendations, and Compliance-reviewed wording. Conflict of interest: none identified; Meridian shows other banks' products without ranking or offering its own.

**5.3 Financial Crime — Yes.** Received account data improves visibility of a customer's position; new exposure is limited to manipulated or synthetic account histories at other banks. Mitigation: platform-authenticated data only; PSRA completed before pilot.

**5.4 Sanctions — No additional exposure.** No new counterparties are paid; existing screening applies to the customer.

**5.5 Fraud — Yes.** Account takeover during the consent journey; social engineering around "connect your other bank". Mitigation: platform strong customer authentication, device binding, the consent tile making every connection visible and revocable. Estimated incremental loss within existing appetite; detailed FRA before pilot.

**5.6 Data Management — Yes.** Balances, due dates and amounts from another bank are personal financial data (`DR-3.1-001`, inherent High, residual Medium under `CTRL-003`); any received data in a prototype, fixture or non-production artifact is `DR-1.1-001` (residual Low under `CTRL-001` — the prototype used synthetic data only). DPIA required and triggered by this pack; purpose limitation and retention bound to the consent; no cross-border transfer.

**5.7 Operational Risk — Yes.** Process: the receiving-consent journey has no owner today — a named owner is a condition of this approval. People: contact-centre training on the view and the withdrawal. System: the consent-bound data path and the joined view. Continuity: the journey depends on the platform and on other participants (`DR-4.1-001`, inherent High, residual Medium under `CTRL-004`); resilience assessment and outsourcing-register entry before pilot.

**5.8 Treasury and Market — No.** No balance-sheet change; the view moves no money.

**5.9 Other — Yes.** Reputational: a wrong balance shown to a customer, with liability between Meridian, the other bank and the platform not yet allocated — the run's one uncovered risk; it does not block a synthetic prototype and must be answered before pilot. Credit risk: none; no lending decision is made from the view.

**5.10 Legal — Yes.** Terms and privacy notice updated for the data-recipient role and the view; the platform participation agreement covers data terms; the liability position in 5.9 needs Legal's answer before pilot.

**5.11 Tax — No.** No fees, no new supplies.

## NPA Committee decision — Approved with conditions (permission to develop, PA1)

The residual-risk verdict from D6 is **Conditional**: the consolidated-view direction may proceed to a synthetic prototype now and to delivery only when —

1. The receiving-consent journey has a **named owner** (S-005).
2. **Certification evidence** for the data-recipient role exists before any pilot exposure (`OB-AE-OFS-CERT-001`).
3. The **platform dependency is on the outsourcing register** with its resilience assessment (`OB-AE-CBUAE-RES-001`).
4. **H3 — customer-initiated payment — is excluded** from the hand-off; the greyed affordance stays greyed until an Amendment is approved.
5. Every obligation cited in 5.1 is **verified by its owner** against the current Regulation and Standards.
6. Post-implementation review at ninety days with the 1.5 KPIs; liability allocation for a wrong balance shown (5.9) answered before pilot.

Permission to launch (PA2) is not granted by this decision; Sections 4 and 5 are re-confirmed against what was built.

*In the Loom these become: (1) a manual control with an owner, refused by the approval-surface gate while the owner field is empty; (2) and (3) `CTRL-004` on the deploy lane — no exposure while certification evidence or the register entry is absent; (4) a scope condition compiled into the control plan, so a payment-initiation change on this spec fails the change-envelope gate until the Amendment's PA1 exists; (5) the obligations register's `last_verified` read by the register gate; (6) the next discovery run's intent, and the obligation the delivery half traces end to end when H3 is taken up: `OB-AE-MTPOL-PSI-001`, a timeout is never a failure.*
