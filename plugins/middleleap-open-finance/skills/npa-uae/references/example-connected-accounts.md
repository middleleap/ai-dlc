# Worked example — Meridian Trust, Connected Accounts for Affordability

*Meridian Trust is a fictional UAE bank used in Loom demonstrations. This pack is the one assembled at the "Investment case assembled" step of the discovery harness and taken to Gate 2. Field text is deliberately compact; a real pack runs to several pages per section.*

| | |
|---|---|
| **Product Name / Initiative** | Connected Accounts for Affordability — applicants for personal loans and credit cards may consent to share their accounts at other banks, through the UAE Open Finance platform, so that verified income and commitments inform the credit decision |
| **Request Type** | New ☑ — the Bank acts in its Third Party Provider role for the first time in a retail credit journey |
| **Date** | [DD-MMM-2026] |

## 1. Business Rationale and Objectives

**1.1** 38% of loan and card applications from customers whose salary account is elsewhere are approved; 61% of declines cite insufficient income evidence. Under the Open Finance Regulation the applicant can share twelve months of account data with a consent that expires in ninety days. Verified income replaces document upload and lets the Bank say yes to customers it currently cannot see.

**1.2** Capex: build, TPP certification, platform integration, model validation. Opex: platform API fees at forecast consent volumes, monitoring, support. Benefit: modelled approval uplift from 38% to 52% on the connected segment at current loss rates, as incremental lending revenue over three years; NPV, IRR and sensitivities on consent take-up in the attached model (same hash as the capital case). ECL impact assessed with Credit Risk at portfolio level over the same period.

**1.3** Consent take-up below forecast; applicant distrust of data sharing; dependency on other banks' API availability and data quality; model-risk validation timeline; certification scheduling.

**1.4** No document upload; a decision in minutes rather than days; a decision based on the customer's real financial position; the customer sees exactly what is shared and why and can withdraw consent at any time.

**1.5** Consumer-protection KPIs: consent withdrawal rate; complaints per thousand connected applications; decline reason-code coverage (target 100%); model-driven declines reviewed by a human (target 100%); fraud events per thousand connections; approval-rate and default-rate deltas versus the unconnected cohort. Owner: Head of Retail Lending; reviewed monthly, reported to the NPA committee at the ninety-day PIR.

**1.6** Exit: switch off the connected-accounts option in the application journey; decisions revert to existing inputs; consents revoked at the platform; shared data deleted within the retention period with a deletion attestation; customers informed in writing; no customer detriment because the option is additive.

## 2. Product Features and Overview

**2.1** An optional step in the loan and card application: "connect your accounts". The applicant is taken through the platform's consent journey to one or more other banks, twelve months of balances and transactions are retrieved, categorised into income and committed outgoings, and summarised for the decision engine. The summary informs the decision; it never solely declines. Consent is single-use for the application with a ninety-day ceiling. No lock-in.

**2.2** AED.

**2.3** No fee to the customer. Platform fees are borne by the Bank. Existing product fees unchanged; no Central Bank fee approval required for this change.

**2.4** None. Withdrawal of consent carries no charge.

**2.5** Not applicable to this change; the underlying products' ESG features are unchanged.

## 3. Distribution & Target Market

**3.1** Existing and new retail customers applying for personal loans or credit cards whose primary banking relationship is elsewhere; initial launch limited to salaried UAE residents in one segment.

**3.2** UAE, onshore only.

**3.3** Mobile application and web application journeys. Not available in branch at launch.

**3.4** Applicant meets the existing product eligibility; holds an account at a participating bank on the platform; completes the consent journey successfully.

**3.5** Excluded at launch: non-residents; applicants under 21; customers with an active collections case; jurisdictions excluded under the platform's fraud-prevention rules.

**3.6** In-journey disclosure of what data is shared, why, for how long, and how to withdraw; Key Facts Statement updated; all collateral reviewed by Compliance before launch.

## 4. Operating Model

**4.1** Application journey → consent initiation (Bank as TPP) → platform → account-holding bank authenticates the customer → data returned → categorisation → affordability summary → decision engine → decision with reason codes → human review queue for model-driven declines. Consents and data held in the TPP engine with the existing retention controls.

**4.2** Prototype tested with eight customers and two credit officers; two changes adopted: show what is shared and why before consent, allow a second bank to be added.

**4.3** The Open Finance platform operator; the account-holding banks; no new outsourcing. None are Authorised Agents under the CPS: they do not act for the Bank towards the customer. Data-processing terms per the platform's participation agreement.

**4.4** Credit officers: reading the affordability summary and the reason codes; contact centre: the consent journey and withdrawal; Compliance: annual refresher on Open Finance conduct rules.

**4.5** The Bank's TPP licence and certification (OIDF, Functional, CX, Live Proving) for the data-sharing journey; no structured-product approval; conventional product, no ISSC involvement.

## 5. Risk Considerations

**5.1** Open Finance Regulation and Standards obligations in the TPP role; consent lifecycle and expiry; conformance with the Standards version in force and errata; liability allocation for data errors; CPS suitability and disclosure obligations; model governance expectations for a decision input.

**5.2** Mis-selling risk if staff present connection as mandatory or as guaranteeing approval — mitigated by scripts and Compliance-reviewed collateral. Conflict of interest: none identified.

**5.3 Financial Crime — Yes.** Verified third-party account data improves source-of-funds visibility; new exposure is limited to synthetic or manipulated account histories. Mitigation: platform-authenticated data only, no customer-uploaded statements; PSRA completed.

**5.4 Sanctions — No additional exposure.** Existing screening applies to the applicant; no new counterparties are paid.

**5.5 Fraud — Yes.** Account-takeover during the consent journey; mule-account histories presented as income. Mitigation: platform SCA, device binding, velocity rules, categorisation flags for round-tripped credits. Estimated incremental loss within existing appetite; detailed FRA attached.

**5.6 Data Management — Yes.** Twelve months of another bank's transaction data is personal data processed for a defined purpose. DPIA completed; PIA and DMBE scheduled pre go-live; purpose limitation and ninety-day retention enforced; encryption and access controls per the existing TPP engine baseline; no cross-border transfer.

**5.7 Operational Risk — Yes.** Process: new human review queue for model-driven declines. People: two credit officers trained; no new roles. System: new categorisation service and decision-engine integration; hosted within the existing TPP engine. Continuity: covered by the TPP engine BIA; RTO unchanged.

**5.8 Treasury and Market — No.** No balance-sheet change beyond lending volumes already within plan.

**5.9 Other — Yes.** Credit risk: the affordability model is a new decision input; validated on a golden set, monitored monthly, never the sole reason for a decline. Discussed with Credit Risk. Reputational: data-sharing concerns mitigated by disclosure and withdrawal design.

**5.10 Legal — Yes.** Terms and conditions and privacy notice updated for the connected-accounts option; platform participation agreement covers data terms.

**5.11 Tax — No.** No new fees or supplies.

## NPA Committee decision — Approved with conditions

1. Disclosure wording as submitted, verbatim, on every consent screen.
2. Fourteen-day cooling-off on cards originated through the connected journey.
3. Post-implementation review at ninety days with the 1.5 KPIs.

*In the Loom these become: a deterministic disclosure-conformance gate; a contract test on the card origination path; and the next pass's intent.*
