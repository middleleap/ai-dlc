# AML & Fraud Guidelines

> Regenerated from public sources 9 Jun 2026 (original file lost) — provenance & full verification history: `verification-log.md`. Cross-check time-sensitive figures against the community hub / OF Confluence before relying on them.

Sources: CBUAE Open Finance Regulation C 3/2025 Article 30 (verified on rulebook.centralbank.ae); the Risk object specification in the community-standards repo (`tech/tpp-standards/v2.1/.../personal-identifiable-information/risk`, verified Jun 2026); the **AML and Fraud Guidelines** page on the OF Confluence space ([page 124747798](https://openfinanceuae.atlassian.net/wiki/spaces/OF/pages/124747798/AML+and+Fraud+Guidelines), document **Version 1.1**, marked "provisional and subject to change" — anonymously readable, re-verified 10 Jun 2026). Items not in a fetched source remain marked "(verify against source)".

## Table of Contents
1. [Regulatory Basis](#regulatory-basis)
2. [Suspicious Activity Reporting — CBUAE AML GO Portal](#suspicious-activity-reporting--cbuae-aml-go-portal)
3. [Risk Information Block (Verified Schema)](#risk-information-block-verified-schema)
4. [Confirmation of Payee as a Fraud Control](#confirmation-of-payee-as-a-fraud-control)
5. [High-Risk Country Exclusions](#high-risk-country-exclusions)
6. [Payment Limits as Fraud Controls](#payment-limits-as-fraud-controls)
7. [Transaction Monitoring — Split of Responsibilities](#transaction-monitoring--split-of-responsibilities)
8. [Suspicious Activity Handling Workflow](#suspicious-activity-handling-workflow)
9. [Implementation Checklist](#implementation-checklist)

---

## Regulatory Basis

**Article 30, OF Regulation C 3/2025 (verified):**
1. Open Finance Providers **and the API Hub** must have comprehensive, effective internal AML/CFT policies, procedures and controls ensuring compliance with the UAE AML Laws and Regulations as amended.
2. Open Finance Providers **and the API Hub** must have **robust fraud control policies and systems**, addressing identification and access-control requirements.

Supporting provisions: Article 31 (technology risk, cyber incident response), Article 22(10) (data destruction subject to AML retention duties), Article 13 (5-year record keeping). The detailed operational rules sit in the **AML & Fraud Guidelines** within the Catalogue of Standards (OF Confluence).

## Suspicious Activity Reporting — CBUAE AML GO Portal

- Verified 10 Jun 2026 (AML and Fraud Guidelines, OF Confluence, doc v1.1): TPPs must "Report any suspicious activities via the **AML GO portal of CBUAE**" (section 2.2, Suspicious Transactions Monitoring). LFIs report to authorities via their established protocols — the guidelines state there is **no need to develop additional Open Finance-specific procedures** on the LFI side.
- This is in addition to participants' existing statutory STR/SAR obligations to the UAE Financial Intelligence Unit (goAML platform) under the AML Laws — Open Finance reporting does not replace FIU filing.
- Both LFIs and TPPs retain their own institutional AML reporting duties; deemed-licence banks report through their existing compliance functions.
- Nebras, as API Hub operator, is itself subject to Article 30 and reports platform-level suspicious patterns (verify against source).

## Risk Information Block (Verified Schema)

The `Risk` object is **mandatory fraud-prevention data**, required in the PII payload at both **POST /par** (consent staging) and **POST /payments** (payment initiation). Verified from the v2.1 TPP Standards on the community hub:

- **TPPs must populate every field that is known or derivable from their system** — omitting available data degrades the LFI's fraud scoring.
- Schema enforces `additionalProperties: false` — **errata2 tightened this across the Risk tree on POST /payments, /payment-consents and /file-payments**: undeclared Risk fields now fail validation (breaking change recorded in api-specs `supporting/breaking-changes`). `AccountType` enum is now `[Retail, SME, Corporate]`.
- Like all PII, the Risk object is **encrypted inside the JWE** and readable only by the destination LFI.

| Section | Key fields (verified) |
|---------|----------------------|
| `DebtorIndicators.Authentication` | AuthenticationChannel (Web/App), Knowledge/Possession/Inherence factors (`IsUsed`, `Type` — e.g. Password, SMSOTP, FaceRecognition, Passkey, SecureEnclaveKey), ChallengeOutcome (Pass / NotPerformed), AuthenticationFlow (MFA), AuthenticationValue (delegated SCA JWS), ChallengeDateTime |
| `DebtorIndicators.GeoLocation` | Latitude, Longitude |
| `DebtorIndicators.DeviceInformation` / `BrowserInformation` | DeviceType, OS + version, **DeviceBindingId, BindingStatus, BindingDuration**, ConnectionType; or UserAgent, IsCookiesEnabled, PixelRatio |
| `DebtorIndicators.AppInformation` / `BiometricCapabilities` | AppVersion, PackageName, BuildNumber; SupportsBiometric, BiometricTypes |
| `DebtorIndicators.AccountRiskIndicators` | UserOnboardingDateTime, LastAccountChangeDate, **SuspiciousActivity** (e.g. NoSuspiciousActivity), TransactionHistory (LastDay / LastYear counts) |
| `TransactionIndicators` | **IsCustomerPresent** (Customer Present flag), **IsContractPresent** (Creditor Contract flag — true for subscription/recurring under contract), **Channel** (Web/Mobile), ChannelType (ECommerce / InApp / RecurringPayment), SubChannelType, PaymentProcess (durations, session and 24h attempt/failure counts) |
| `TransactionIndicators.MerchantRisk` | DeliveryTimeframe, ReorderItemsIndicator, IsGiftCardPurchase, IsDeliveryAddressMatchesBilling, AddressMatchLevel |
| `CreditorIndicators` | AccountType (Retail/Corporate), IsCreditorPrePopulated, IsVerifiedByTPP, IsCreditorConfirmed, **MerchantDetails** (MerchantId, MerchantName, MerchantCategoryCode) |
| `DestinationDeliveryAddress` | RecipientType, RecipientName, NationalAddress (for goods delivery) |

Usage pattern by scenario (verified examples): merchant e-commerce (customer present, merchant details + delivery address), A2A transfer (customer present, no contract), subscription/recurring (customer NOT present, `IsContractPresent: true`, auth ChallengeOutcome NotPerformed), delegated SCA (TPP-side MFA with AuthenticationValue JWS).

## Confirmation of Payee as a Fraud Control

- **CoP is mandatory before all payments** — the primary APP-fraud (authorised push payment) control in the ecosystem.
- Endpoints (verified): TPP-facing on the Hub — `POST /discovery` + `POST /confirmation` (v2.1 CoP spec); LFI-side Ozone Connect responder — `POST /customers/action/cop-query` (called by the Hub). Name object: `fullName` mandatory for personal accounts; `firstName`/`lastName` optional.
- CoP outcome feeds `CreditorIndicators.IsCreditorConfirmed` in the Risk block — the LFI sees whether the payee was name-checked before execution.
- Pricing reinforces usage: CoP bundled with a payment within 2 hours costs 0.5 fils vs 2.5 fils standalone; corporate CoP is free (see `pricing-model.md`).
- v2.1 removed the ConfirmationOfPayeeResponse requirement from international-payment creditor PII (domestic: IBAN only) — see `standards-versions.md`.

## High-Risk Country Exclusions

- **10 high-risk countries are excluded** from Open Finance international payments (verify against source — the public AML and Fraud Guidelines page, doc v1.1, contains **no country list or exclusion text**; the list, aligned to FATF high-risk/sanctions designations, likely lives in the Standards/Operational Guidelines or CBUAE notices, e.g. Notice 3057/2025 on fraud prevention, attachment-only on Confluence).
- LFIs must reject international payment initiations to excluded destinations; TPPs should pre-filter at UX level to avoid failed initiations.
- The exclusion list is updateable by the guidelines without a standards version bump — re-check before each international-payments release.

## Payment Limits as Fraud Controls

| Control | Value | Source rule |
|---------|-------|------------|
| International payments to a **new beneficiary** | **AED 15,000 limit for 48 hours after beneficiary creation** — per customer, per TPP, per bank, for the **sum** of multiple payments; TPP imposes it | Verified 10 Jun 2026: Limitation of Liability Model (OF Confluence, doc v2.1) — TPP liability AED 1,000 + direct losses for failure to impose. Rule ID "A12.1" and any 24h variant not verified — supersedes the earlier "first-time international / 24h" wording |
| Payment initiation window | 10 minutes (A15–A17) | Standards (verify against source — not in the public specs or Confluence pages) |
| Multi-payment creditors | 2–10 creditors per payment (A10.1) | Standards v2.1 (verified in v2.1 change log) |
| Maximum first-24h payment amounts | Updated in v2.1 Limits & Constants | Verify current values on the hub |

The `PaymentProcess` attempt/failure counters in the Risk block (session + last-24h) give LFIs velocity signals to enforce these and their own limits.

## Transaction Monitoring — Split of Responsibilities

| Party | Responsibilities |
|-------|------------------|
| **TPP** | Populate the Risk block fully and truthfully; KYC/CDD on its own customers per AML Laws; device binding and session monitoring; velocity checks before initiation; pre-filter excluded countries; report suspicious activity (AML GO + own FIU duties); set `SuspiciousActivity` indicator honestly |
| **LFI** | Final fraud scoring and transaction screening using the Risk block + own customer profile; sanctions/watchlist screening; SCA enforcement (or validation of delegated SCA evidence); execute/reject decisions; statutory STR filing; consumer reimbursement processes per the liability model |
| **Nebras (API Hub)** | Platform-level pattern monitoring across participants; Article 30 AML/fraud controls on the hub itself; Trust Framework integrity (certificates, participant identity); audit trail provision for investigations; platform incident response (Article 31) |

Liability alignment: a fraud loss traced to a falsified or negligently empty Risk block sits with the TPP; one traced to an LFI ignoring presented risk signals sits with the LFI (see `liability-framework.md`).

## Suspicious Activity Handling Workflow

1. **Detection** — TPP-side (device, velocity, behavioural) or LFI-side (scoring, screening) or platform-side (Nebras pattern monitoring).
2. **Immediate action** — reject or hold the initiation; LFIs may return payment status Rejected; do not tip off the customer where AML Laws prohibit it.
3. **Flag in-band** — subsequent requests for the customer should carry `SuspiciousActivity` set accordingly in `AccountRiskIndicators`.
4. **Report** — file via the AML GO portal of CBUAE (verified — AML and Fraud Guidelines, OF Confluence, doc v1.1) and discharge statutory FIU (goAML) STR obligations in parallel.
5. **Preserve evidence** — consent records, Risk payloads, transaction logs; minimum 5-year retention (Article 13), and AML Laws may require longer (Article 22(10) defers destruction duties to AML retention).
6. **Cooperate** — full access for CBUAE supervision (Article 32); Nebras provides hub-side audit trails for inter-participant investigations.

## Implementation Checklist

- [ ] AML/CFT policies cover Open Finance flows explicitly (Article 30(1))
- [ ] Fraud control systems address identification + access control (Article 30(2))
- [ ] Risk block populated with every known/derivable field at /par and /payments
- [ ] CoP called before every payment; result reflected in CreditorIndicators
- [ ] Excluded-country list ingested and enforced (re-verify the 10-country list)
- [ ] AED 15,000 / 48h new-beneficiary limit on international payments enforced (per customer, per TPP, per bank)
- [ ] AML GO portal reporting wired into compliance workflow (portal verified; confirm onboarding mechanics with Nebras / compliance)
- [ ] FIU goAML STR process unaffected and running in parallel
- [ ] 5+ year retention for consent, Risk and transaction records
- [ ] Cyber incident response plan covers fraud-driven scenarios (Article 31)
