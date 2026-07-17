# UAE Open Finance — Payments & Consent Business Rules

> Compiled from the TPP Standards business-rule pages (site data files), 10 June 2026.

Business rules the API Hub and LFIs enforce **beyond the OpenAPI schemas** for Standards v2.1: consent lifecycle and identifier rules, multi-payment control parameters, payment-vs-consent matching, the payment status model and rails, beneficiary models, Delegated SCA, the Consent Management Interface (CMI), and the insurance-quotation model. Companion to `api-specifications.md` (endpoints/objects) and `technical-specs.md` (security/infrastructure).

Site URL base: `https://nebras-open-finance.com` — paths below are relative to it.

## Table of Contents
1. [Consent Business Rules](#consent-business-rules)
2. [Opaque Consent Identifiers](#opaque-consent-identifiers)
3. [BaseConsentId Chaining](#baseconsentid-chaining)
4. [Data Permissions on Payment Consents](#data-permissions-on-payment-consents)
5. [Multi-Payment Control Parameters](#multi-payment-control-parameters)
6. [Payment-vs-Consent Matching & SIP Single Use](#payment-vs-consent-matching--sip-single-use)
7. [Authorization & Initiation Rejections](#authorization--initiation-rejections)
8. [Currency & Purpose-Code Constraints](#currency--purpose-code-constraints)
9. [Payment Status Model & Rails](#payment-status-model--rails)
10. [Beneficiary Models](#beneficiary-models)
11. [Delegated SCA](#delegated-sca)
12. [Consent Management Interface (CMI)](#consent-management-interface-cmi)
13. [Insurance Quotation Model](#insurance-quotation-model)

---

## Consent Business Rules

Sources: `/tech/tpp-standards/v2.1/consent/requirements`, `/tech/tpp-standards/v2.1/consent/api-guide`.

- **Three consent URNs:** `urn:openfinanceuae:account-access-consent:v2.1`, `urn:openfinanceuae:service-initiation-consent:v2.1`, `urn:openfinanceuae:insurance-consent:v2.1`. (One site page uses `payment-consent`; the rules files and roles table use `service-initiation-consent` — prefer the latter.)
- **Minimal scoping:** request only permissions genuinely necessary for the live service — speculative/blanket grants are prohibited and assessed in Functional Evidence certification. LFIs may reject at `/par` when `authorization_details` is unsupported or disproportionate (e.g. an unsupported `AccountSubType`).
- **Expiry:** `ExpirationDateTime` ≤ 1 year from creation (Hub rejects beyond) AND must reflect the minimum period the service needs. For payments, `AuthorizationExpirationDateTime` ≤ `ExpirationDateTime`.
- **Screen parity:** the LFI's consent screen renders from the PAR `authorization_details`; the TPP's pre-consent screen must describe exactly the scope submitted to `/par`.
- **Immutability:** after staging, the only `Data` field that may change is `Status` (`Subscription`/`Meta` remain patchable). Any other change ⇒ create a new consent, revoke the old one, link via `BaseConsentId` (see [chaining](#baseconsentid-chaining)).
- **Two independent access conditions** on every resource call: a valid Bearer token (10-minute lifetime) AND consent in `Authorized` state — the Hub rejects all other states.
- **States:** `AwaitingAuthorization`, `Authorized`, `Rejected`, `Revoked`, `Expired`, `Consumed`, `Suspended` — plus **`Paused`, which is TPP-local only** (no Hub state; see [CMI](#consent-management-interface-cmi)). `Consumed` single-use consents are **irrevocable**.
- **Sync duty:** the TPP must keep an accurate local record of every consent (states can change without TPP initiation) and reflect it in its CMI. Mechanisms: polling `GET /account-access-consents/{ConsentId}` / `GET /payment-consents/{ConsentId}` (excessive polling is rate-limited; consent reads use a client-credentials token, not the user token) or consent-status webhooks (no per-consent subscription needed — see `technical-specs.md`).

## Opaque Consent Identifiers

Source: `/knowledge-base/articles/consent-identifiers`.

Values the LFI patches onto a consent (`psuIdentifiers`, `accountIds`) are stored centrally in the API Hub, visible to Hub operators, surface in logs/reports, and outlive sessions — they MUST be opaque, LFI-defined references.

| Rule | Detail |
|---|---|
| Prohibited values | Emirates ID, passport number, any regulated national identifier; full name / DOB / email / mobile; IBAN / account number / card number / PAN; CIF or any internal id mapping 1:1 to regulated data |
| `psuIdentifiers.userId` | Opaque string, **stable per end user across all their consents**, unique within the LFI; UUID v4 recommended |
| `accountIds[]` | Opaque strings **1–40 chars**, `minItems: 1`, each MUST equal the `AccountId` the LFI returns from its `/accounts` APIs, **immutable once issued**; UUID v4 recommended |
| Cardinality | Bank Service Initiation consents: **exactly one element** (the debtor account). Bank Data Sharing: every account the user selected |

## BaseConsentId Chaining

Source: `/knowledge-base/articles/base-consent-id`.

`BaseConsentId` (a.k.a. `consentGroupId`) links related consents of the same user + service into one logical chain for coherent CMI display.

- **Always chain to the root, never to the immediate prior consent**: on continuation (expired consent, service continues) or re-establishment after revocation, set the *original* `ConsentId` as `BaseConsentId`; if the original already had a `BaseConsentId`, reuse that one.
- **Permission expansion:** create a new consent with updated permissions, revoke the old one, link via `BaseConsentId`.
- **Identity guard:** all consents in a chain are assumed to be the same end user — if the LFI sees a different `userId` than the chain's authoriser at authentication, it should reject the new consent. For payments, `BaseConsentId` must reference a prior consent of the same end user; insurance chains must stay within the insurance-consent type.
- Retrieve chains via `?baseConsentId=` on the collection GETs (renders as the "List of Updates" view in the CMI).

## Data Permissions on Payment Consents

Source: `/knowledge-base/articles/payment-account-permissions`.

A service-initiation consent can carry a small data-permission subset — `ReadAccountsBasic`, `ReadAccountsDetail`, `ReadBalances` in its `Permissions[]` — letting the TPP read accounts/balances **with the same payment access token**, with no separate data-sharing consent. Requires widening the requested scope to `accounts payments openid` (vs `payments openid`) in the request JWT, and the BDSP role alongside BSIP. Unlocks `GET /accounts`, `GET /accounts/{AccountId}` (incl. IBAN) and `GET /accounts/{AccountId}/balances` under the payment token; without these permissions the payment token cannot call any account endpoint. (Billing note: these reads are chargeable data calls; the balance call is discountable to 0.5 fils within 2 h of a payment — see `pricing-model.md`.)

## Multi-Payment Control Parameters

Sources: per-type rules under `/tech/tpp-standards/v2.1/banking/service-initiation/`, decision logic in `/knowledge-base/articles/choosing-a-payment-type`. All amounts AED.

Seven payment shapes: SIP (one payment now) plus 6 multi-payment variants = 2 amount answers (**Fixed** = same amount each time; **Variable** = per-payment ceiling) × 3 timing answers (**OnDemand** = TPP triggers; **PeriodicSchedule** = one per recurring period; **DefinedSchedule** = pre-agreed list of dated entries).

| Type | `ConsentSchedule.MultiPayment.PeriodicSchedule` shape | Per-payment rule | Implicit limits |
|---|---|---|---|
| **VariableOnDemand** | `Type:"VariableOnDemand"`; Controls: ≥1 of `MaximumIndividualAmount` / `MaximumCumulativeNumberOfPaymentsPerPeriod` / `MaximumCumulativeValueOfPaymentsPerPeriod`; optional `PeriodStartDate` (not past, ≤ expiry); lifetime caps `MaximumCumulativeNumberOfPayments` / `MaximumCumulativeValueOfPayments` | Amount ≤ MaximumIndividualAmount; period + lifetime counters enforced by the Hub | `PaymentPurposeCode` MAY differ from consent |
| **FixedOnDemand** | `Type:"FixedOnDemand"`; `Amount` required (exact per payment); Controls: ≥1 of per-period count/value caps | Amount must equal consent Amount exactly | — |
| **VariablePeriodicSchedule** | `Type:"VariablePeriodicSchedule"`; `MaximumIndividualAmount` required; `PeriodType` (Week/Month/…) + `PeriodStartDate` required; `MaximumCumulativeNumberOfPayments` required | Amount ≤ MaximumIndividualAmount | **Exactly 1 payment per period** (2nd in same period rejected) |
| **FixedPeriodicSchedule** | `Type:"FixedPeriodicSchedule"`; `Amount` required per period | Exact amount match | 1 payment per period |
| **VariableDefinedSchedule** | `Type:"VariableDefinedSchedule"`; `Schedule[]` non-empty; each entry: unique `PaymentExecutionDate` (today or later), `MaximumIndividualAmount`; **consent expiry must equal the last PaymentExecutionDate** | Amount ≤ entry max for that date | 1 payment per execution date |
| **FixedDefinedSchedule** | `Type:"FixedDefinedSchedule"`; `Schedule[*].Amount` exact per date | Exact amount match per date | 1 payment per execution date |

Use-case mapping: FixedOnDemand = fixed subscriptions/instalments TPP-triggered; VariableOnDemand = metered billing / top-ups / sweeps; FixedPeriodicSchedule = calendar-gated fixed subscriptions/loan repayments; VariablePeriodicSchedule = utility bills within a cap; FixedDefinedSchedule = instalment plans with known (date, amount) pairs; VariableDefinedSchedule = milestone billing with per-date ceilings.

Two implementation traps:
- On the **OnDemand** variants, `PeriodicSchedule.PeriodType` is a **cumulative-cap reference window, not a recurrence schedule** — the TPP still triggers every payment.
- The OpenAPI discriminator is on **`PeriodicSchedule.Type`** (e.g. `"FixedOnDemand"`), not `MultiPayment.Type`; mis-placement ⇒ `400 invalid_message_format`.

LFI capability check: the LFI must advertise the payment type via Trust Framework `ApiMetadata` flags (e.g. `ApiMetadata.SingleInstantPayment.Supported`, per-type flags for the six multi-payment shapes) or consent validation fails — filter on the directory before staging.

## Payment-vs-Consent Matching & SIP Single Use

Source: common service-initiation rules, `/tech/tpp-standards/v2.1/banking/service-initiation/`.

- At `POST /payments` the token-bound ConsentId must match, and `Amount`, `Currency`, `PaymentPurposeCode`, `OpenFinanceBilling`, `DebtorReference` and `CreditorReference` must **exactly match the consent** (amount semantics per type in the table above; VariableOnDemand allows a differing PaymentPurposeCode).
- **SIP allows exactly one `POST /payments` per consent** — single use, then `Consumed`. Submit without undue delay (customer present; token lives 10 minutes); `x-idempotency-key` required (reuse the same key on retries).
- `DebtorAccount`, if provided, must be a valid UAE IBAN at the LFI in a payable state. Debtor account status at payment time: Active ⇒ processed; Inactive/Dormant/Suspended ⇒ `403 Consent.AccountTemporarilyBlocked`; Unclaimed/Deceased/Closed ⇒ `403 Consent.PermanentAccountAccessFailure`.
- PII must conform exactly to the schema (`additionalProperties: false`); the Risk block must be fully populated (monitored by Nebras — see `aml-fraud-guidelines.md`).

## Authorization & Initiation Rejections

Authorization-stage rejections surface on the redirect as `error=invalid_request` with a prescribed `error_description`:

| `error_description` | Context |
|---|---|
| `user_lacks_eligible_accounts` | Data-sharing or payment authorization — user has no eligible accounts (`/tech/tpp-standards/v2.1/banking/data-sharing/`) |
| `user_does_not_own_debtor_account` | Payment authorization — pre-specified `DebtorAccount` not owned by the authenticating user (`/tech/tpp-standards/v2.1/banking/service-initiation/`) |
| `user_lacks_eligible_policies` | Insurance data-sharing authorization — no eligible policies; a consent with zero policies selected must not be authorised (`/tech/tpp-standards/v2.1/insurance/data-sharing/`) |

## Currency & Purpose-Code Constraints

Source: common service-initiation rules, `/tech/tpp-standards/v2.1/banking/service-initiation/`.

- Domestic payments are **AED only**: `CurrencyRequest` must be **absent** on domestic consents.
- `PaymentPurposeCode` must be a recognised **Aani** purpose code (Aani Core list per errata2).
- The domestic creditor must be reachable on **Aani or UAEFTS**; if neither rail can reach it, the payment is rejected pre-rail.

## Payment Status Model & Rails

Source: `/tech/tpp-standards/v2.1/banking/service-initiation/domestic-payments/overview/payment-status`.

Execution modes are **LFI-selected** (the TPP has no choice): **intra-bank** (same LFI), **Aani** (primary instant rail), **UAEFTS** (automatic fallback; ISO 20022 pacs.008 via the Central Bank).

| Status (ISO 20022-aligned) | Code | Meaning |
|---|---|---|
| `Pending` | PDNG | Initial `POST /payments` response |
| `AcceptedSettlementCompleted` | ACSC | Debtor side settled — **non-terminal** |
| `AcceptedWithoutPosting` | ACWP | **Terminal success on Aani** — credit-posting not confirmed |
| `AcceptedCreditSettlementCompleted` | ACCC | **Terminal success on UAEFTS and intra-bank** |
| `Rejected` | RJCT | Terminal failure — see reject codes below |
| `Received` | RCVD | Reserved for bulk/batch files only (bulk/batch not yet documented in v2.1) |

Per-rail paths: intra-bank `Pending → ACCC`; Aani `Pending → ACWP`; UAEFTS `Pending → (ACSC) → ACCC`.

**`RejectReasonCode[].Code` is namespaced by origin** and relayed verbatim by the Hub:

| Namespace | Origin | Examples |
|---|---|---|
| `LFI.*` | Pre-rail / intra-bank | `LFI.InsufficientFunds` |
| `AANI.*` | Aani rail | AC06 blocked account, AC07 closed creditor account, AM04 insufficient funds, AM14 amount exceeds agreed limit, UCRD unknown creditor (authoritative list: Aani Core Service Interface Spec) |
| `FTS.*` | UAEFTS rail | Per UAEFTS codes |

The LFI MAY substitute a prescriptive OF code (e.g. `Consent.TransientAccountAccessFailure`) — handle both shapes. Status delivery: webhook (recommended; requires `subscription.Webhook.IsActive: true` on the payment consent) or polling `GET /payments/{paymentId}` (free of Hub fees; poll early for pre-rail rejects, back off, stop at a terminal status).

## Beneficiary Models

Sources: `/knowledge-base/articles/pii-encryption`, per-type rules under `/tech/tpp-standards/v2.1/banking/service-initiation/`.

Three models for the PII creditor array (`Initiation.Creditor[]`) at `/par`:

| Model | Creditor array | Allowed payment types | At `POST /payments` the creditor must… |
|---|---|---|---|
| **Single** | Exactly 1 entry | All payment types | Exactly match the consent entry |
| **Multiple** | 2–10 pre-approved entries | **VariableOnDemand and Delegated SCA only** | Match one pre-approved entry |
| **Open** | Array omitted | **VariableOnDemand and Delegated SCA only** | Independently pass full creditor validation (fresh creditor per payment) |

Single-beneficiary-only types: SIP, FixedOnDemand, FixedPeriodicSchedule, FixedDefinedSchedule, VariablePeriodicSchedule, VariableDefinedSchedule. Trust Framework support flags are per model: `ApiMetadata.VariableOnDemand.{Single|Multiple|Open}BeneficiariesSupported` (same pattern for `DelegatedAuthentication`) — check before staging. PII encryption mechanics and the /par-vs-/payments shape differences live in `technical-specs.md`.

## Delegated SCA

Sources: `/tech/tpp-standards/v2.1/banking/service-initiation/delegated-sca/`, `/knowledge-base/articles/choosing-a-payment-type`.

Delegated SCA is an optional overlay on the multi-payment variants — the TPP performs SCA itself for each payment instead of redirecting to the LFI.

- `ControlParameters.IsDelegatedAuthentication: true`; for all other multi-payment types it must be false/absent.
- **`ConsentSchedule` must be an empty object `{}`** — no consent-imposed amount caps; the TPP is responsible that each amount was user-approved via its own SCA.
- **MFA evidence in the Risk block** on every `POST /par` and `POST /payments`: `Risk.DebtorIndicators.Authentication` with `ChallengeOutcome=Pass`, `AuthenticationFlow=MFA`, ≥2 of Possession/Knowledge/Inherence with `IsUsed: true` and a valid `Type`, and a recent `ChallengeDateTime`.
- UX: the consent page must state that every payment still needs individual customer authentication; no amounts/schedule are shown at consent stage.
- Beneficiary models: Delegated SCA (with VariableOnDemand) is the only context where multiple (2–10) and open creditor models are allowed.

## Consent Management Interface (CMI)

Source: `/tech/tpp-standards/v2.1/consent/consent-management-interface/` (+ per-type requirement data files). The CMI is mandatory; four journeys: view (dashboard + detail), revoke, pause, reactivate. CX-certified — deviations allowed only if clarity is preserved and documented in the CX certification submission.

**Dashboard tabs and filters:**

| Tab | Consent states shown |
|---|---|
| **Current** | AwaitingAuthorization, Authorized, Suspended, Paused |
| **History** | Rejected, Expired, Revoked (+ Consumed for payments) |

Filters: LFI name, consent type, consent state (dynamically populated).

**Prescribed user-facing labels:**

| Internal value | Displayed label |
|---|---|
| Authorized | "Active" |
| AwaitingAuthorization | "Pending" |
| Revoked | "Cancelled" |
| Other states | Verbatim |
| SIP in `Consumed` | Shows the payment's `paymentStatus` instead: ACSC/ACCC/ACWP → "Successful", Rejected → "Failed" |
| Multi-payment in `Consumed` | "Consumed" |
| Type: data sharing | "Data Sharing" |
| Type: SIP | "Single Payment" |
| Type: any multi-payment | **"Flexi Pay"** |

**Cards & detail:** cards show LFI name, status badge, account/policy count, last data received, expiry; payment cards show masked payer IBAN only if the TPP holds `DebtorAccount`, payment date/amount (amount shows 0.00 while AwaitingAuthorization); multi-payment cards show total paid to date. The detail page replicates what the customer agreed to (permissions/accounts/limits), truncated ConsentId, dates card, "How we are using your data" card (hidden when Rejected); a `BaseConsentId` yields a "List of Updates" view via `?baseConsentId=`.

**Action buttons:**

| Action | Available on | Effect |
|---|---|---|
| Pause | Authorized only; **not for SIP** | **TPP-local state only — NO Hub update** ("Paused ≠ Suspended") |
| Reactivate | Paused | TPP-local |
| Revoke ("Stop Sharing" / "Cancel Permission") | AwaitingAuthorization, Authorized, Suspended, Paused | **Immediate PATCH to the Hub** |
| None | Expired, Rejected, Revoked, Consumed | **Consumed single-use consents are irrevocable — no revoke button** |

A confirmation screen (title, impact description, Confirm, Go back) is mandatory before revoke/pause/reactivate; the effect must be immediate.

## Insurance Quotation Model

Sources: `/tech/tpp-standards/v2.1/insurance/quotation/` (+ quotation rules data file).

**Consent-free:** the entire lifecycle runs on the Client Credentials Grant (scope `insurance`, ISP role) — customer-consent tokens MUST NOT be used. All request bodies are signed (`application/jwt`); no JWE for quotation PII (data-minimisation applies to inline customer identifiers).

| Step | Endpoint | Rules |
|---|---|---|
| Create quote | `POST /{type}-insurance-quotes` (7 sector slugs; other values ⇒ 404 at the Hub) | TPP-generated `QuoteReference` echoed back (persist it AND the LFI-minted `QuoteId`); `QuoteType` ∈ **New / Renewal / Switch** (Renewal references a prior policy; Switch references the incumbent insurer); sector-specific risk data. **`201` = one or more quotes; `204` = LFI declined to quote — surface to the user, do not retry** |
| Poll | `GET /{type}-insurance-quotes/{QuoteId}` | Fallback to webhooks, ≤1/min (Hub may rate-limit); **404 (not 403) for foreign-TPP QuoteIds** to avoid existence leakage |
| Accept (+ subscribe) | `PATCH /{type}-insurance-quotes/{QuoteId}` | Webhook subscription via `Subscription.Webhook{Url ^https://.+, IsActive}`; a later Subscription-only PATCH updates/pauses delivery without re-accepting. Response branches the mode (below) |
| Submit KYC (TPP-Led only) | Second `PATCH` on the same endpoint | After `ApplicationPending`, customer present; `400` with reason on KYC failure; **`409` if called on an LFI-Led quote** |
| Create policy | `POST /{type}-insurance-policies` | Must reference an accepted QuoteId (sector-matched, else 404). **Idempotent: retry with the same QuoteId returns the same policy reference.** `201` then await events — final InsurancePolicyId + Documents arrive via events, not this response |

**LFI-Led vs TPP-Led** (branched by the Accept PATCH response):

- **LFI-Led:** PATCH returns **`204`** — the LFI hosts verification, payment and documents; the TPP observes events.
- **TPP-Led:** PATCH returns **`200`** with `data.PolicyIssuanceAllowed{CustomerVerification, Payment, PolicyDocuments}` — the TPP MUST honour the flags exactly (perform only what is `true`).
- The **204-not-201 rule recurs**: quote creation returning `204` = declined to quote; Accept returning `204` = LFI-Led mode.

**Payment & documents (TPP-Led):**

- On `ApplicationApproved` the LFI emits `BrokerInstructions[].Url` — an LFI-hosted payment page that is **single-use and time-bound; never cache, log, modify, or replay it**.
- On `PolicyIssued`, documents arrive as base64 content + a SHA-256 `Hash` — the TPP MUST **verify the hash against the decoded content before delivering to the customer** (the TPP is the policy-document delivery channel); do not deliver mismatches.

**Quote lifecycle events:** pending-completion (`ApplicationPending`, `ApplicationApproved`, `PaymentRequired`, `PolicyIssued`); completed (`Completed` — carries final Premium {OneYearPremiumExcludingVAT, VATAmount, TotalOneYearPremium, optional TotalPolicyPremium}, PolicyTerm as ISO 8601 duration, CustomerPaidInFull, PolicyCountrySubDivision = issuing Emirate, CustomerSalary banding required for Health, Commission due to the TPP); terminal (`Expired`, `Rejected`, `CustomerCancelled`, `LFICancelled`, optional Reason). Treat events as idempotent (redelivery possible) — key on QuoteId + QuoteStatus + timestamp. Billing: quote creation is tiered 5–12.5 fils by number of LFIs returning quotes; Accept/KYC PATCH and policy creation are flat 2.5 fils; quote GETs are free (see `pricing-model.md`).
