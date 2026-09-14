# UAE Open Finance Standards Versions

> **Last verified: 31 August 2026** (community hub Release Notes & Errata register + erratas-registry source re-check; prior passes 17 Aug / 13 Jul / 10 Jun 2026) against the community hub Release Notes & Errata register, the erratas-registry source, and the OF Confluence errata pages. Current production standard is **v2.1-final** with **errata3** (spec-register effective 8 Jul 2026 for the original 2 corrections, **21 Aug 2026 for 3 corrections added since the 17 Aug pass**; doc-level effective 30 Jun 2026; supersedes errata2 of 7 May 2026 for the touched specs). No errata4 and no v2.2 published as of 31 Aug 2026 — errata3 itself grew in place; the community hub does not mint a new errata number for additions to an open group, so watch section counts, not just the number. **Repo-level update 3 Sep 2026 (authenticated api-specs tree read):** `v2.2-rc1` was cut to `main` on 21 Aug 2026 (pre-release — see the v2.2-rc1 section below) and `uae-insurance-openapi.yaml` was copied into the errata3 folder on 15 Aug 2026; neither is in the register yet. Note: live API traffic is still dominated by v1.2 and v2.0 (v2.1 adoption nascent as of May 2026 data) — "Superseded" below means "not for new builds," not "out of live use."

## Table of Contents
1. [Version History Overview](#version-history-overview)
2. [Standards v1.0-final](#standards-v10-final)
3. [Standards v1.1-final](#standards-v11-final)
4. [Standards v1.2-final](#standards-v12-final)
5. [Standards v2.0-final](#standards-v20-final)
6. [Standards v2.1-final](#standards-v21-final)
7. [Errata & Release Notes Register](#errata--release-notes-register)
8. [Key Differences Between Versions](#key-differences-between-versions)
9. [Implementation Guidance](#implementation-guidance)

---

## Version History Overview

| Version | Publication Date | Status | Key Focus |
|---------|------------------|--------|-----------|
| v1.0-final | Aug 2, 2024 | Deprecated | Initial framework |
| v1.1-final | Nov 1, 2024 | Deprecated | Errata fixes from v1.0 |
| v1.2-final | Dec 20, 2024 | Superseded (heavy live use) | Enhanced features |
| v2.0-final | Apr 4, 2025 | Superseded (heavy live use) | Major uplift |
| v2.1-final | Jan 7, 2026 | Current Production | Enhanced APIs and operational requirements |
| v2.1-errata2 | May 7, 2026 | Superseded per-file by errata3 | Doc corrections to v2.1-final + API Hub v8 (17 sections) |
| **v2.1-errata3** | **Effective 8 Jul 2026 for §1–2 / 21 Aug 2026 for §3–5 (spec register); 30 Jun 2026 (doc-level, §1–2 only as of last Confluence edit)** | **Current Errata** | 5 corrections (grew from 2 since the 17 Aug 2026 pass) — Bank Service Initiation international creditor restructure + Creditor Agent address (SWIFT SR2026); Debtor/Creditor References constrained to ISO 20022/SWIFT `x` character set (OFP-003); idempotency-key query response corrected to signed envelope; ReadStatements + ReadProductFinanceRates permissions extended to Consent Events + CAAP. Errata folders carry auth-endpoints + bank-initiation (+ insurance, copied in 15 Aug 2026 — repo-level, not in the register list); matching in-place corrections in Consent Manager + Ozone Connect bank-service-initiation/consent-events/**CAAP operations (new for §5)** |
| v2.2-rc1 | Repo cut Aug 21, 2026 | Pre-release preview — not for production | `TransactionInformation` required; `DebtorReference` OFP-003 charset (also errata3 §3); webhook `application/jwt`; Sharia, insurance rework, TPP data deletion. Ordering rule in the repo tests: `draftN < rcN < base < errataN` |

**Important**: Always implement against the **latest available version plus its current errata** (v2.1-final + errata3; errata resolve per file — highest errata folder containing the file wins). Deprecated versions should not be used for new implementations. Confirm which version a counterparty LFI actually serves in production — many remain on v1.2/v2.0.

---

## Standards v1.0-final

**Publication**: August 2, 2024  
**Status**: DEPRECATED - Do not use for new implementations

### Structure
```
Common Components/
├── API Security
├── User Experience Principles
├── Consent Setup
├── Consent Management Interfaces
├── Authentication and Authorization
│   ├── Authentication by LFI
│   ├── Centralized Authentication and Authorization (CAAP)
│   └── Strong Customer Authentication Guidelines
├── Event Notifications
└── Pushed Authorization Request Endpoint

Banking/
├── Bank Service Initiation
│   ├── Single Instant Payments
│   ├── Future Dated Payments
│   ├── Multi-Payments (Recurring)
│   └── International Payments
├── Bank Data Sharing
│   ├── Customer Data
│   ├── Account Information
│   └── Transaction History
├── Common Rules and Guidelines
└── Limits and Constants

Insurance/
├── Insurance Data Sharing
└── Insurance Common Rules

Operational Guidelines/
└── Availability, Performance, Usage Benchmarks
```

### Key Features Introduced
- FAPI 2.0 security profile for UAE
- Two authentication approaches: Redirection and Decoupled
- Consent management via CAAP or LFI
- IPP (Instant Payment Platform) as mandatory for domestic payments
- Payment status model (Pending, Rejected, ACSC, ACCC/ACWP, ACWC)
- Risk Information Block for fraud prevention
- Multi-user authorization flows

---

## Standards v1.1-final

**Publication**: November 1, 2024  
**Status**: DEPRECATED - Do not use for new implementations

### Changes from v1.0
- All errata from v1.0 incorporated
- Registration Framework additions
- Trust Framework integration details
- OIDC Federation support specifications
- Enhanced client registration requirements

### Registration Framework Additions
- Entity Identifier equals Client Identifier
- Trust Chain validation requirements
- Automatic registration via OIDC Federation
- mtls_endpoint_aliases requirements per RFC 8705

---

## Standards v1.2-final

**Publication**: December 20, 2024  
**Status**: Superseded — still in heavy live use (API Hub v6)

### Key Enhancements
1. **Strong Customer Authentication Guidelines** - Detailed SCA implementation guidance
2. **Payments with Delegated Authentication** - TPP-managed SCA for certain flows
3. **Customer Data** - Enhanced data sharing specifications
4. **Data Clusters and Permissions** - Granular permission model

### SCA Guidelines Additions
- FIDO2/Webauthn support specifications
- OpenID for Verifiable Credentials (OID4VC) guidance
- Secure Payment Confirmation (SPC) support
- Dynamic linking requirements
- Possession/Knowledge/Inherence factor definitions

### Payments with Delegated Authentication
- Long-lived consent with TPP-managed SCA
- Balance Check permission as consent extension
- Liability framework alignment
- Device binding requirements (NFC, biometrics)

### Errata Updates (v1.2-final-errata1)
- Address objects: `formatted` mandatory; `streetAddress`, `locality`, `region`, `postalCode`, `country` optional
- Name objects in /cop-query: `fullName` mandatory for personal accounts; `firstName`, `lastName` optional

---

## Standards v2.0-final

**Publication**: April 4, 2025
**Status**: Superseded — still in heavy live use; v2.1-final is current (API Hub v7)

### Major Changes from v1.x
1. **Comprehensive API restructuring**
2. **Enhanced consent management**
3. **Improved payment flows**
4. **International payments enhancements**
5. **Confirmation of Payee (CoP) specifications**
6. **Product data and leads APIs**

### API Categories

See `api-specifications.md` for complete API reference.

**v2.0+ New APIs:**
- POST /customers/action/cop-query (Confirmation of Payee)
- GET /payment-consents/{consentId}/refund (Refunds)
- GET /products (Product Discovery)
- POST /leads (Lead Submission)
- GET /atm (ATM Locations)

### Consent Types
- **Single Use Consent**: One-time authorization
- **Long-lived Consent**: Ongoing access with defined validity
- **Payment Consent**: Service initiation authorization
- **Account Access Consent**: Data sharing authorization

---

## Standards v2.1-final

**Publication**: January 7, 2026 (current errata: **errata3**, effective 30 Jun 2026 doc-level / 8 Jul 2026 spec register; errata2 7 May 2026)
**Status**: Current Production - Recommended for all new implementations

### Structure Overview (76 pages across Confluence space)

#### Common Components
- API Security
- FAPI 2.0 Framework
- Registration Framework
- Certificate Standard (incl. **certificate rotation** operational guidance, added Jun 2026)
- UX Principles
- Consent Setup
- Combined Consents
- Authentication and Authorization
- Centralized Authentication and Authorization Platform (CAAP)
- Strong Customer Authentication (SCA)
- Webhooks
- Partial Encryption (incl. **FinanceRates JWE encryption**)

#### Banking: Service Initiation
- Bank Service Initiation with SIP (Single Instant Payments)
- Future Dated Payments (FDP)
- Multi-Payments
- Open Beneficiary + Delegated Authentication
- Bulk/Batch Payments
- International Payments
- FX & Remittance
- Payment Refunds
- Confirmation of Payee (CoP)
- Dynamic Account Opening
- Pay Request
- Payment Status Guidelines

#### Banking: Data Sharing
- Customer Data (expanded for SME/Corporate)
- Mandated Accounts

#### Insurance
- Insurance Data Sharing (expanded May 2026 on community standards)
- Insurance Quote Initiation (7 types)

#### Operational Requirements
- Availability and Performance
- Data Quality
- Change Management
- Problem Resolution
- Fraud Prevention

### Key Changes in v2.1-final

#### Authorization APIs
- **Creditor Property in PII Restructuring**:
  - Domestic: IBAN only
  - International: Removed ConfirmationOfPayeeResponse requirement
- **ConsentSchedule Mandatory Constraints**: Eliminated across all flows

#### Payments
- **File Upload Flow**: Shifted from Authorization Code to Client Credentials grant
- **ConsentSchedule Mandatory**: Removed from payment consent requirements

#### Multi-Payments
- New diagrams for supported payment types
- Reorganized wireframes for clarity
- Enhanced business rules documentation

#### International Payments
- Wireframe correction for GBP currency handling
- Enhanced international flow guidance

#### Payment Refunds
- New business guidance for closed/suspended accounts
- Credit-restricted account handling
- Refund eligibility criteria updates

#### Common Rules & Guidelines
- **Rule A10.1**: Multi-creditor payments 2-10 creditors
- **Debtor/Creditor Reference**: Revised for Structured Reference format
- **Rule 26**: Updated for international payments support

#### Insurance
- Motor vehicle: Engine details now required
- Coverage limits: Maximum 1 year (except life insurance)
- Life insurance: Rider selection enhancements

#### Customer Data
- **ReadParty API**: Expanded for SME and Corporate entities
- **FinanceRates**: JWE encryption implementation

#### Webhooks
- **ConsentSchedule**: Mandatory constraint removed from webhook events

#### Limits & Constants
- Updated maximum payment amounts for first 24-hour period
- Enhanced transaction limits documentation

#### Wireframes
- Multiple structural updates for clarity
- Enhanced user experience flows
- Improved consent and payment initiation diagrams

---

## Errata & Release Notes Register

The post-publication register has two halves, both on the community hub
([Release Notes & Erratas](https://nebras-open-finance.com/tech/release-notes-and-erratas/)):

- **Release Notes** — changes deployed to operational systems (API Hub: OIDC authorization server, Consent Manager, gateway; Trust Framework: directory, certificate authority, roles & scopes via Raidiam). Each entry states what was deployed, the effective date, and the TPP/LFI impact.
- **Erratas** — corrections to published documentation (TPP Standards, LFI Integration Guide, OpenAPI specs), each recording what was corrected, why, and the effective date.

**Rule of thumb**: once a version is published, its existing content MUST NOT change without an associated Errata record. Behaviour-affecting platform deployments go in Release Notes.

### v2.1-errata3 — international creditor restructure (SWIFT SR2026) + 3 corrections added 21 Aug 2026

**§1–2 effective 8 July 2026**, **§3–5 effective 21 August 2026** (added to the same errata3 group after the 17 Aug 2026 pass — the community hub does not bump the errata number for an addition to an open group, so the skill's "errata3" claim stayed technically true while its scope grew stale) per the spec-level register (`erratas-registry.ts`; this addition detected and verified 31 Aug 2026). The **doc-level Confluence record ("Standards V2.1 & API Hub V8 - Consolidated Errata", page 1366294554) was still at page version 5 / last-edit 8 Jul 2026 as of 31 Aug 2026 — it covers only §1–2**; §3–5 have not yet reached the doc-level register, consistent with the register's established spec-runs-ahead-of-doc pattern. Spec folders `dist/standards/v2.1-errata3/` were not re-checked on 31 Aug (GitHub API 403) but were **confirmed on 3 Sep 2026 by an authenticated tree read**: `uae-authorization-endpoints-openapi.yaml` + `uae-bank-initiation-openapi.yaml` + **`uae-insurance-openapi.yaml`** (the insurance file was copied in on 15 Aug 2026 — see the repo-level note below). The registry's affected-spec list for §1–3 names `uae-api-hub-consent-manager-openapi`, `uae-ozone-connect-bank-service-initiation-openapi` and `uae-ozone-connect-consent-events-actions-openapi`; §5 additionally brings in **`uae-ozone-connect-caap-operations-openapi`** (new to the errata3 affected-spec list) — those trees have no errata folders, so all of these land as in-place `v2.1.x` updates rather than new dist/standards folders. **Five corrections:**

1. **International Creditor restructured into Individual and Organization variants (SWIFT SR2026).** *(§1, eff. 8 Jul 2026)* The international `Creditor` on the Bank Service Initiation RAR becomes a `oneOf` of Individual and Organization variants, discriminated by `IdentityType`, carrying structured beneficiary attributes for cross-border payments. New schemas: `AEInternationalCreditorParty`, `AEInternationalIndividualCreditor`, `AEInternationalOrganisationCreditor`, `AEInternationalCreditorName(Component)`, `AEInternationalCreditorEvidence`. **Domestic Creditor schemas unchanged.** Touches PAR, payment-consents (incl. PATCH), payments, Consent Manager, and Consent Events surfaces on both TPP and LFI sides.
2. **International Creditor Agent address aligned onto shared `AEInternationalAddress`.** *(§2, eff. 8 Jul 2026)* `TownName` becomes required and its `maxLength` tightens from 140 to 70; the Creditor Agent address itself remains optional.
3. **Debtor and Creditor References constrained to the ISO 20022/SWIFT `x` character set (proposal OFP-003).** *(§3, eff. 21 Aug 2026 — new since the 17 Aug pass)* Free-text Debtor/Creditor Reference fields (`AECreditorReference`, `AEDebtorReference` and the service-initiation variants) now carry an ISO 20022/SWIFT-compliant character-set pattern. Touches PAR and payment endpoints (TPP and LFI) plus Consent Events.
4. **Idempotency-key query response corrected to the signed envelope.** *(§4, eff. 21 Aug 2026 — new since the 17 Aug pass)* `GET /payments?x-idempotency-key=` now declares its 200 response as `AEIdempotencyKeyQuerySigned` rather than the unsigned `AEIdempotencyKeyQuery`. Scoped to `uae-bank-initiation-openapi` only.
5. **`ReadStatements` and `ReadProductFinanceRates` permission codes extended to Consent Events and CAAP.** *(§5, eff. 21 Aug 2026 — new since the 17 Aug pass)* The two permission codes (already added to the account-access consent enum under errata2 — see verification item #8) are now also added to the permission enums on `uae-ozone-connect-consent-events-actions-openapi` and — newly — `uae-ozone-connect-caap-operations-openapi`.

**Impact:** TPP/LFI building or serving v2.1 **international payments** must adopt the new creditor structures (§1–2); anyone validating **Debtor/Creditor Reference** free-text fields must tighten to the new pattern (§3); anyone reading the **idempotency-key query response** or checking **permission enums on Consent Events/CAAP** should re-diff against the current spec (§4–5) before relying on last-checked field lists. (Detection note: on 13 Jul 2026 the register landing page still summarised "errata2" while the versioned page listed errata3; by 17 Aug 2026 the landing page listed errata1–3 but only §1–2; §3–5 were added to the versioned page (`erratas/v2.1/`) between 17 Aug and 31 Aug 2026 without changing the errata number — trust the versioned page's section count, not just its highest errata number, when checking currency. `scripts/check_current.py` now does this comparison itself as of the 7 Sep 2026 pass, exiting `STALE_SECTIONS` on a mismatch.)

**Repo-level view of the errata3 folder (authenticated api-specs read, 3 Sep 2026):**

- §4 at folder level: `uae-bank-initiation-openapi.yaml` repoints the 200 idempotency-key query responses on **both** `GET /payments` and `GET /file-payments` to `AEIdempotencyKeyQuerySigned` (commit of 15 Aug 2026, internal ref CS-1346, breaking change recorded under `supporting/breaking-changes/standards/v2.1-errata3/`) — the register's §4 text names only `GET /payments`; the spec applies it to file payments as well.
- **Not in the register (PENDING):** `uae-insurance-openapi.yaml` was copied into `v2.1-errata3` on 15 Aug 2026 with the insurance errata applied (per-`QuoteStatus` quote-response subschemas over a shared `AEHealthInsuranceQuoteProperties`, `format: uuid` dropped, `CreditDebitIndicator` on premium adjustments, percentage/ratio schema split). Per-file resolution therefore lands insurance on errata3 too, even though the register's errata3 affected-spec list does not name it — repo ahead of register, or a folder backport the register does not track; verify before citing.

### v2.2-rc1 — pre-release line (repo cut 21 Aug 2026)

`dist/standards/v2.2-rc1/` (promoted from `v2.2-draft1`), with `dist/api-hub/v2.2.x/` and `dist/ozone-connect/v2.2.x/`. Release-candidate content **must not be used as the basis for a production implementation**; it signals what v2.2 will require. Payment-relevant changes so far: `TransactionInformation` required on `AETransaction` (min 1 / max 500 chars, human-readable, placeholders such as `N/A`, `-`, `Unknown` rejected — treat it as untrusted free text in any downstream tooling); `DebtorReference` carries the OFP-003 pattern `^[A-Za-z0-9 \/?:().,'+-]+$` (the same change published as errata3 §3 on the v2.1 line); webhook Event Notification content type corrected to `application/jwt`; consent-manager `GET /psu/{userId}/consents` status becomes a comma-separated `AEConsentStatus` list; `paymentResponse.paymentRail` (`AANI`, `FTS`, `LFI`) on the payment log; `GET /payment-log` paginated. `Risk`, `ChannelType` and the multi-payment control parameters are unchanged.

### Doc-level errata register on Confluence (verified 17 Aug 2026)

The Catalogue of Standards now carries **three doc-level v2.1 errata pages** (label `errata`):
"Standards V2.1 & API Hub V8 - final - errata1" (page 1116045313), "Standards v2.1-final-errata2"
(page 1260355592), and — the one-stop record — **"Standards V2.1 & API Hub V8 - Consolidated
Errata"** (page 1366294554, published 30 Jun 2026, last edit 8 Jul 2026), which consolidates all
three erratas with doc-level effective dates: **errata1 — 16 Mar 2026** (Insurance Data Sharing /
Quote Initiation / Common Rules + API Hub quote-status responses), **errata2 — 7 May 2026**,
**errata3 — 30 Jun 2026**. Note the systematic date skew vs the spec-level registry (errata1:
16 Mar doc vs 10 Apr spec; errata3: 30 Jun doc vs 8 Jul spec) — cite the register that matches
the artefact you are quoting.

### v2.1-errata2 — two registers, read both

v2.1-errata2 is recorded in **two registers that do not mirror each other**. Cite the right one:

**(a) Standards-level (doc) errata** — the OF Confluence errata document (published 7 May 2026; page maintained, last edit Jun 2026). Read in conjunction with **Standards v2.1-final** and **API Hub Documentation v8**. Headline corrections:

1. **LFI Consent Management Interfaces (§2.2 Rules & Guidelines)** — during a multi-user authorization journey the API Hub did not let the LFI retrieve an "Awaiting Authorization" consent's details so the remaining approvers could view and authorize it; errata addresses this capability gap.
2. **Domestic Payments — Aani Core Purpose-of-Payment Codes** — the domestic Purpose Code business rule and the allowed code list were updated to the **Aani Core (Category Purpose) codes per the Aani Core Interface Specifications, September 2025** (superseding the July 2024 list). Always confirm against the current Aani specification.

_(Errata1 preceded this; both are folded into the errata2 register. Confirm the full current errata list on the hub before an implementation cutover.)_

**(b) OpenAPI-level (spec) errata register** — the community hub register
([erratas page](https://nebras-open-finance.com/tech/release-notes-and-erratas/erratas/v2.1/), source
[`src/data/erratas-registry.ts`](https://github.com/Nebras-Open-Finance/community-standards/blob/main/src/data/erratas-registry.ts))
holds **17 sections under `v2.1-errata2`**: 10 effective **28 Apr 2026**, 7 marked
"to be confirmed on merge to main" — a flag the registry kept even after the underlying PR merged on 22 May 2026.
Note the date mismatch with (a): the doc-level errata says "published 7 May 2026" while spec-level sections carry
28 Apr effective dates. _Update 17 Aug 2026: the registry now ALSO carries a **v2.1-errata1 group**
(1 section, effective **10 Apr 2026**, `uae-insurance-openapi` — insurance quote read responses
restructured as a per-status discriminated `oneOf`, flat `AEInsuranceQuoteStatusCodes` enum removed);
the earlier "no errata1 entries in the spec register" observation no longer holds._

| # | Spec / area | Correction | Effective |
|---|---|---|---|
| 1 | Account Information | `Permissions` on consent responses flattened to a flat string array (was array-of-arrays) | 28 Apr 2026 |
| 2 | Account Information | `TrustFrameworkCode` enum on party responses corrected to `FI` (was unemittable `Undefined`) | 28 Apr 2026 |
| 3 | Authorization Endpoints | `POST /token` response restructured as `oneOf` per grant type; `client_credentials` documented; `client_id` now optional (mTLS identifies the client) | 28 Apr 2026 |
| 4 | CoP | 204 response description corrected to "IBAN is not recognised" (was opt-out wording) | 28 Apr 2026 |
| 5 | CoP | `aud` claim on every `*BodySigned` JWT tightened from array to single string | 28 Apr 2026 |
| 6 | Multiple specs | Over-escaped (doubled-backslash) regex patterns corrected — monetary `Amount` across five specs; `rarType` + CoP patterns on Ozone Connect User Operations | 28 Apr 2026 |
| 7 | Webhook Template | `Permissions` flattening mirrored into webhook event payloads | 28 Apr 2026 |
| 8 | Consent Manager | Unused `AERiskExternalAccountIdentificationCode` schema removed | 28 Apr 2026 |
| 9 | Ozone Connect Health Check | `echo-cert` `clientCertificate` described as the caller's mTLS client cert (not server cert); issuer example refreshed | 28 Apr 2026 |
| 10 | Ozone Connect Bank Data Sharing | `GET /accounts/{AccountId}/statements` gains optional `meta` block (`firstAvailableDateTime`/`lastAvailableDateTime`) | 28 Apr 2026 |
| 11 | Payments Risk object | `additionalProperties: false` throughout `AERisk` nested indicator objects; `SupplementaryData` stays open; `AddressLine` bounded 1–70 chars | TBC on merge |
| 12 | Payments Risk object | Creditor-indicator `AccountType` enum corrected to `[Retail, SME, Corporate]` (was a product-category list); Ozone Connect `AEAccountTypeCode` gains `SME` | TBC on merge |
| 13 | Account Information | `AESupplementaryData` opened as an extension point (was closed empty object) on Transaction/Beneficiary/Standing Order | TBC on merge |
| 14 | Consent Manager | `ReadStatements` + `ReadProductFinanceRates` added to `AEAccountAccessConsentPermissionCodes` | TBC on merge |
| 15 | Consent Manager | The three per-consent-type `PATCH /consents/{consentId}` schemas closed (`additionalProperties: false`) to enforce cross-type field separation | TBC on merge |
| 16 | Consent Manager | Payment-log reject-reason casing reverted to lower-case `rejectReasonCode`/`code`/`message` (v2.0.x contract restored) | TBC on merge |
| 17 | Ozone Connect Bank Data Sharing | `GET /accounts/{accountId}/products` description corrected to account-scoped products (200 + empty array when none), not institution-wide catalogue | TBC on merge |

> **Breaking changes for TPPs in errata2:** the Risk tree is tightened with `additionalProperties: false` on
> `POST /payments`, `POST /payment-consents`, and `POST /file-payments` — TPPs sending undeclared Risk
> properties now get validation errors (remedy: remove them or move them under `SupplementaryData`, which is
> intentionally left open) — and the Risk `AccountType` enum changes to **`[Retail, SME, Corporate]`**.
> Accepted breaking changes are recorded per errata, with oasdiff rule and rationale, in the `api-specs` repo
> under [`supporting/breaking-changes/`](https://github.com/Nebras-Open-Finance/api-specs/tree/main/supporting/breaking-changes)
> (see `repositories.md`).

### Release registers: two platform streams

Release Notes (behaviour-affecting deployments) are kept per platform component — **two separate streams**, on different versioning schemes. Track both, plus the errata register, when assessing change impact.

**API Hub (`2026.x` scheme)** — source
[`src/data/api-hub-releases-registry.ts`](https://github.com/Nebras-Open-Finance/community-standards/blob/main/src/data/api-hub-releases-registry.ts);
full table in `implementation-roadmap.md`. Releases to date: **2026.07.0** (11 Mar 2026, v2.1 banking families enabled end-to-end), **2026.13.1** (20 Apr 2026), **2026.19.0** (production 9 Jun 2026; pre-production 2 Jun 2026), **2026.22.0** (effective 6 Jul 2026). Release **2026.19.0** carries two participant-impacting behaviour changes: **mandatory `x-fapi-customer-ip-address` header on Product API endpoints** and **60-second authorisation-code expiry for FAPI 2.0 profiles**. Release **2026.22.0** restores the mandatory `paymentId` on Consent Manager `GET /payment-log` responses, changes consent revocation in non-revocable states to **HTTP 400 (was 204)**, fixes a `PATCH /consents` 500, and constrains token-endpoint `error_description` to RFC 6749-permitted characters.

**Trust Framework (Raidiam directory — own versioning, separate from `2026.x`)** — register at
[/tech/release-notes-and-erratas/release-notes/trust-framework/2026](https://nebras-open-finance.com/tech/release-notes-and-erratas/release-notes/trust-framework/2026), source
[`src/data/trust-framework-releases-registry.ts`](https://github.com/Nebras-Open-Finance/community-standards/blob/main/src/data/trust-framework-releases-registry.ts):

| TF release | Date | Status | Themes |
|---|---|---|---|
| 2.0.0 | 19 Feb 2026 | Released | API Families via Reference Data, certificate description field, new Auth Server detail experience, federation endpoint visibility |
| 2.1.0 | 2 Apr 2026 | Released | New Application details experience, IDP creation wizard, federation visibility |
| 2.2.0 | 2 Jun 2026 | **Released** | Directory version display, server roles, OTP validation in onboarding, cross-org audit-log scope |
| 2.3.0 | 8 Jun 2026 | **Released** | Application change history / audit comparison, authorisation-server filtering, responsive layouts, email validation |
| 2.4.0 | 7 Jul 2026 | **Released** | Audit-log date sorting, external regulatory documents, certificate-authorities management, organization audit trails, expanded search/filtering |
| 2.5.0 | 2026 (TBC) | Planned | Cross-client application management scope, unified Documents view, sortable audit tables, enhanced directory-wide search |

_(Statuses re-verified 17 Aug 2026 against `trust-framework-releases-registry.ts` — 2.2.0/2.3.0 were still "planned" at the 10 Jun 2026 audit and have since shipped.)_

---

## Key Differences Between Versions

### Authentication Evolution
| Aspect | v1.0 | v1.2 | v2.0+ |
|--------|------|------|-------|
| SCA Guidelines | Basic | Enhanced with FIDO2 | Full specification |
| Delegated Auth | Not available | Introduced | Refined |
| CAAP | Basic spec | Enhanced | Production-ready |
| Device binding | Not specified | Defined | Required |

### API Differences
| API | v1.x | v2.0+ |
|-----|------|-------|
| CoP (Confirmation of Payee) | Limited | Full specification |
| Payment Refund | Not available | GET /payment-consents/{consentId}/refund |
| Products | Not available | GET /products |
| Leads | Not available | POST /leads |
| ATM | Not available | GET /atm |

### Consent Management
| Feature | v1.0 | v1.2 | v2.0+ |
|---------|------|------|-------|
| Consent Groups | Basic | Enhanced | Full support |
| Balance Check permission | Not available | Introduced | Standard |
| Event notifications | Basic | Enhanced | Comprehensive |

---

## Implementation Guidance

### Which Version to Implement?

**New LFI Implementations**: Use Standards v2.1-final + errata3

**New TPP Implementations**: Use Standards v2.1-final + errata3

**Existing v2.0-final Implementations**: Plan migration to v2.1-final

**Existing v1.x Implementations**: Plan migration to v2.1-final

> **Live reality:** per the ecosystem metrics dashboard (data to 31 May 2026), most production traffic is still v1.2/v2.0 and v2.1 volume is small. Plan integrations to v2.1+errata3, but expect counterparties to still be running older versions and confirm per LFI.

### Version-Specific API Hub Documentation
| Standards Version | API Hub Docs | Publication | Alignment |
|-------------------|--------------|-------------|-----------|
| v1.0 | v1, v2 | Jun-Jul 2024 | Initial release |
| v1.1 | v3 | Aug 2024 | Registration Framework |
| v1.2 | v4, v5, **v6** | Sep 2024 - Jan 2025 | SCA and Delegated Auth |
| v2.0 | **v7** | 2025 | Major uplift |
| v2.1 | **v8** | **Jan 2026** | **Aligns with Standards v2.1-final (errata2)** |

### API Hub v8 Features
**Core Documentation**
- Bank Open Data OpenAPI
- Bank Product Data OpenAPI
- User Operations OpenAPI
- CAAP sequence diagrams (User Registration, Consent Authorization)
- AlTareq CAAP Integration Guide
- Bank Data Sharing: API Hub v8 to Standards v2.1-final Response Data Mapping

**Testing & Validation Tools**
- Banking Testing Tool
- Insurance Testing Tool
- Ozone Connect Test Cases
- Sample Configuration Files

### Certification Requirements
- LFIs: CX certification screens per version
- TPPs: FAPI 2.0 RP certification
- Both: Renewal with each major standards version

### Migration Considerations
1. Review release notes **and the current errata (errata2)** for breaking changes
2. Update API integrations per new schemas
3. Test in sandbox against new version
4. Obtain updated certifications
5. Coordinate with Nebras for production cutover
