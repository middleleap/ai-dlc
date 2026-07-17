# UAE Open Finance API Specifications Reference

> Regenerated from public sources 9 Jun 2026 (original file lost) — provenance & full verification history: `verification-log.md`. Cross-check time-sensitive figures against the community hub / OF Confluence before relying on them.

Complete API reference map for Standards **v2.1-final + errata3** (API Hub v8). Canonical source: the `Nebras-Open-Finance/api-specs` repo — `dist/standards/` (TPP-facing), `dist/api-hub/` (Hub→LFI), `dist/ozone-connect/` (LFI implements). For any spec under `dist/standards/`, resolve errata **per file**: highest-numbered errata folder containing the file wins, else fall back to the base `v2.1/` file.

## Table of Contents
1. [Spec File Inventory (v2.1, errata-resolved)](#spec-file-inventory)
2. [Bank Data Sharing](#bank-data-sharing)
3. [Bank Service Initiation](#bank-service-initiation)
4. [Confirmation of Payee](#confirmation-of-payee)
5. [Dynamic Account Opening](#dynamic-account-opening)
6. [Insurance (Data Sharing + Quotes)](#insurance)
7. [FX & Remittance](#fx--remittance)
8. [Product, Leads & ATM](#product-leads--atm)
9. [Authorization Endpoints](#authorization-endpoints)
10. [Event Notifications (Webhooks)](#event-notifications-webhooks)
11. [Trust Framework Directory APIs](#trust-framework-directory-apis)
12. [CAAP Operations (Ozone Connect)](#caap-operations-ozone-connect)
13. [Cross-Cutting Conventions](#cross-cutting-conventions)

---

## Spec File Inventory

Verified against the `api-specs` repo tree (main branch, 9 Jun 2026). Effective version = after per-file errata resolution.

| Spec file (`dist/standards/`) | OpenAPI title | Effective version | Server base path |
|---|---|---|---|
| `uae-account-information-openapi.yaml` | UAE Account Information API | v2.1-errata2 | `/open-finance/account-information/v2.1` |
| `uae-bank-initiation-openapi.yaml` | UAE Payment API | v2.1-errata3 | `/open-finance/payment/v2.1` |
| `uae-confirmation-of-payee-openapi.yaml` | UAE Confirmation of Payee API | v2.1-errata2 | `/open-finance/confirmation-of-payee/v2.1` |
| `uae-authorization-endpoints-openapi.yaml` | UAE Authorization Endpoints API | v2.1-errata3 | `/open-finance/auth/v2.1` |
| `uae-webhook-template-openapi.yaml` | UAE Webhook Template | v2.1-errata2 | TPP-hosted (template) |
| `uae-fx-service-initiation-openapi.yaml` | UAE FX API | v2.1-errata1 | `/open-finance/fx/v2.1` |
| `uae-insurance-openapi.yaml` | UAE Insurance API | v2.1-errata1 | `/open-finance/insurance/v2.1` |
| `uae-account-opening-service-initiation-openapi.yaml` | UAE Account Opening API | v2.1 (base) | `/open-finance/account-opening/v2.1` |
| `uae-atm-openapi.yaml` | UAE ATM API | v2.1 (base) | `/open-finance/atm/v2.1` |
| `uae-product-openapi.yaml` | UAE Product API | v2.1 (base) | `/open-finance/product/v2.1` |

Full URL shape: `https://rs1.{lfiCode}.{env}.apihub.openfinance.ae{server base path}{endpoint}` (see `technical-specs.md` for environments).

LFI-side and Hub-side specs (same repo): `dist/ozone-connect/v2.1.x/` — bank-data-sharing, bank-open-data, bank-products-data, bank-service-initiation, consent-events-actions, health-check, insurance, user-operations. `dist/api-hub/v2.1.x/` — authorisation-server, consent-manager, tpp-onboarding, tpp-reports.

**Not present as standalone v2.1 specs** (give category only; verify against source): **Pay Request** (roadmap Q3 2026 — no published spec on main as of 9 Jun 2026) and a dedicated **Remittance** spec (FX quotes are covered by the FX API; remittance execution rides service initiation — verify against source).

---

## Bank Data Sharing

**Purpose:** consented retrieval of customer, account, balance, transaction, and product-holding data. Spec: `uae-account-information-openapi.yaml`.

| Endpoint | Notes |
|---|---|
| `POST /account-access-consents` | Stage data-sharing consent (TPP client-credentials token) |
| `GET /account-access-consents/{ConsentId}` | Retrieve consent + state |
| `GET /accounts` · `GET /accounts/{AccountId}` | Account list / detail |
| `GET /accounts/{AccountId}/balances` | Balances |
| `GET /accounts/{AccountId}/transactions` | Filter via `fromBookingDateTime` / `toBookingDateTime` query params |
| `GET /accounts/{AccountId}/beneficiaries` · `/direct-debits` · `/standing-orders` · `/scheduled-payments` | Account sub-resources |
| `GET /accounts/{AccountId}/product` | Product holding |
| `GET /accounts/{AccountId}/statements` | Statements (date-filterable) |
| `GET /accounts/{AccountId}/parties` · `GET /parties` | Party data (ReadParty expanded to SME/Corporate in v2.1) |

**Permissions (data clusters)** — verified 10 Jun 2026 against the `AEBankDataSharingConsentPermissionCodes` enum in `uae-account-information-openapi.yaml` (v2.1-errata2), full 21-code list: `ReadAccountsBasic/Detail`, `ReadBalances`, `ReadBeneficiariesBasic/Detail`, `ReadFXTransactionsBasic/Detail`, `ReadFXRemittanceCharges`, `ReadTransactionsBasic/Detail`, `ReadProduct`, `ReadProductFinanceRates`, `ReadScheduledPaymentsBasic/Detail`, `ReadDirectDebits`, `ReadStandingOrdersBasic/Detail`, `ReadStatements`, `ReadPartyUser`, `ReadPartyUserIdentity`, `ReadParty`. Note: **`ReadStatements` has NO Basic/Detail split**, and there are **NO ReadTransactionsCredits/Debits variants** (do not import UK Open Banking permission names). Optional Balance Check permission attaches to payment consents.

**Business rules (from TPP Standards rules tables, 10 Jun 2026):**
- Dependent-permission rule: any data permission requires `ReadAccountsBasic` or `ReadAccountsDetail` in the same consent.
- **AccountSubType support matrix:** beneficiaries / direct-debits / standing-orders / scheduled-payments only for `CurrentAccount` + `Savings`; accounts / balances / transactions / statements / product / parties for all subtypes (CurrentAccount, Savings, CreditCard, Finance, Mortgage). LFI support is discoverable via Trust Framework flags/ApiMetadata — filter before staging consents.
- **Access/status 403s:** AccountId not held by the consenting customer ⇒ `403 Consent.PermanentAccountAccessFailure` (GET /accounts and /parties exempt). Account status: Active/Inactive/Dormant ⇒ data returned; Suspended ⇒ `403 Consent.AccountTemporarilyBlocked`; Unclaimed/Deceased/Closed ⇒ `403 Consent.PermanentAccountAccessFailure`.
- **Pagination contract:** no page params on requests — follow `Links.Next` until absent. Pagination required only for transactions + statements (≥2-year history floor); empty result = 200 + empty array, never 404. Date filters ISO 8601; contradictory range or future `to` ⇒ `400 Resource.InvalidFormat`.
- **Encrypted FinanceRates** (`ReadProductFinanceRates`) requires the optional **"Access Encrypted Resource Data" certification** — the Hub rejects consents carrying it from uncertified TPPs. JWE flow: forward the opaque string to the user's device, user enters LFI-sent OTP (PBES2 password), decrypt locally, display within the JWE `exp` window (~30 min), discard on session end. Same model as insurance `ReadInsurancePremium`.

**Response objects:** `AERead...` envelope = `{ Data, Links, Meta }`; signed variants (`...Signed`, content type `application/jwt`) for JWS-signed responses. FinanceRates fields are JWE-encrypted (partial encryption).

---

## Bank Service Initiation

**Purpose:** payment consents and execution — single instant (SIP), future-dated, multi-payments, international, bulk/batch (file). Spec: `uae-bank-initiation-openapi.yaml` (title "UAE Payment API").

| Endpoint | OperationId | Notes |
|---|---|---|
| `GET /payment-consents?baseConsentId=` | RetrievePaymentConsentsByBaseConsentId | Find consents derived from a base consent |
| `GET /payment-consents/{ConsentId}` | RetrievePaymentConsent | Consent + state |
| `PATCH /payment-consents/{ConsentId}` | PatchPaymentConsent | Consent state transitions (e.g. revoke) |
| `GET /payment-consents/{ConsentId}/refund` | RetrievePaymentConsentRefund | Refund details (v2.0+) |
| `POST /payment-consents/{ConsentId}/file` | UploadFilePaymentConsent | Upload bulk/batch payment instruction file (v2.1: client-credentials grant, not auth-code) |
| `POST /payments` | CreatePayment | Execute payment under an Authorized consent; `x-idempotency-key` required |
| `GET /payments?x-idempotency-key=` | QueryPaymentResource | Idempotency-key lookup — returns `Links` to the existing resource if matched |
| `GET /payments/{PaymentId}` | RetrievePayment | Payment status (500ms SLA, A20) |
| `POST /file-payments` · `GET /file-payments` | CreateFilePayment / QueryFilePaymentResource | Bulk/batch execution + idempotent lookup |
| `GET /file-payments/{PaymentId}` · `/{PaymentId}/report` | RetrieveFilePayment / RetrieveFilePaymentReport | File payment status / processing report |

**Consent payload essentials:** payment type (SIP, FDP, one of 6 multi-payment types, international), ControlParameters (amounts, schedule, validity ≤ 1 year for long-lived), Risk Information Block (mandatory), creditor (domestic: IBAN only in v2.1; **international creditor restructured by errata3**: `oneOf` Individual/Organization variants discriminated by `IdentityType` — schemas `AEInternationalIndividualCreditor` / `AEInternationalOrganisationCreditor` / `AEInternationalCreditorEvidence`, per SWIFT SR2026; Creditor Agent address on shared `AEInternationalAddress`, `TownName` required, max 70 — domestic schemas unchanged), creditor/beneficiary models: single (1) for all payment types; multiple (2–10) and open (creditor array omitted) only for VariableOnDemand + Delegated SCA — see `payments-and-consent-rules.md`. Domestic rails: intra-bank / AANI (primary) / automatic UAEFTS fallback — LFI-selected; purpose codes = Aani Core per errata2. CoP must precede payment. 10-minute initiation window (A15–A17).

**Scopes:** `openid`, `payments` (user token: parameterized with ConsentId), `accounts`. Security schemes: `TPPOAuth2Security` (client credentials, private_key_jwt), `UserOAuth2Security` (authorization code), `LFIWebhookSecurity`.

---

## Confirmation of Payee

**Purpose:** mandatory pre-payment payee verification. Spec: `uae-confirmation-of-payee-openapi.yaml`.

| Endpoint | Notes |
|---|---|
| `POST /confirmation` | Confirm account-holder details (signed request — operationId `ConfirmationOfPayeeConfirmation_signedConfirmationRequest`) |
| `POST /discovery` | Discover which LFI will confirm the payee attributes (signed request) |

Name object: `fullName` mandatory for personal accounts; `firstName`/`lastName` optional. Requests are JWS-signed (`signed...Request` variants).

**Mandatory-CoP trigger rule:** for any A2A transfer where the creditor is unknown to the TPP (e.g. user-entered at payment time), CoP must run **before consent creation**, provided the receiving bank supports CoP. Client-credentials token, scope `confirmation-of-payee`; requests AND responses are compact JWS (`application/jwt`).

**Two-call flow (verified from TPP Standards, 10 Jun 2026):** `POST .../confirmation-of-payee/v2.1/discovery` (Hub, resolved centrally) returns `DiscoveryEndpointUrl` + `ResourceServerUrl` of the **holding LFI**; then register/authenticate with that LFI and call `POST .../confirmation-of-payee/v1.2/confirmation` on its resource server (note the **v1.2 path** for confirmation on the live site). Unknown IBAN ⇒ **204 no body**. Results: `ConfirmationOfPayee.Yes` ⇒ proceed; `.Partial`/`.No` ⇒ **must surface `MaskedName`** to the payer before proceeding (CX-certified screen; result may not be suppressed). Where CoP ran, the full raw JWS goes into `ConfirmationOfPayeeResponse` in the payment-consent creditor PII.

**Two surfaces, both verified (9 Jun 2026):** TPPs call `POST /discovery` + `POST /confirmation` on the API Hub (v2.1 TPP-facing CoP spec). The Hub then calls `POST /customers/action/cop-query` on the LFI — the Ozone Connect responder endpoint (`uae-ozone-connect-bank-data-sharing-openapi.yaml`: "used by Ozone to find customer records from the LFI based on a confirmation of payee query"). Use the right path for your surface.

---

## Dynamic Account Opening

**Purpose:** TPP-initiated account opening with KYC. Spec: `uae-account-opening-service-initiation-openapi.yaml` (title "UAE Account Opening API", v2.1 base — no errata).

| Endpoint | Notes |
|---|---|
| `POST /accounts` | Initiate account opening (verified 10 Jun 2026 in `uae-account-opening-service-initiation-openapi.yaml`, server base `/open-finance/account-opening/v2.1`) |
| `GET /accounts/{AccountId}/status` | Opening status |
| `PATCH /accounts/{AccountId}/subscription` | Status-update subscription (webhook event family: AccountOpening) |

---

## Insurance

**Purpose:** insurance data sharing (policies + payment details) and quote initiation across **7 lines**: motor, health, home, renters, travel, life, employment. Spec: `uae-insurance-openapi.yaml` (v2.1-errata1 effective).

Uniform per-line pattern (substitute `{line}` ∈ employment | health | home | life | motor | renters | travel):

| Endpoint | Notes |
|---|---|
| `POST /insurance-consents` · `GET /insurance-consents/{ConsentId}` | Insurance consent staging / retrieval |
| `GET /{line}-insurance-policies` · `GET /{line}-insurance-policies/{InsurancePolicyId}` | Policy list / detail |
| `GET /{line}-insurance-policies/{InsurancePolicyId}/payment-details` | Premium / payment details (premium fields JWE-encrypted — partial encryption) |
| `POST /{line}-insurance-quotes` | Quote initiation (verified 10 Jun 2026 in `uae-insurance-openapi.yaml`; signed/unsigned request variants) |
| `GET /{line}-insurance-quotes/{QuoteId}` | Quote retrieval (free of API Hub fee per the pricing model) |
| `PATCH /{line}-insurance-quotes/{QuoteId}` | **Accept** the quote — update status to proceed and create the policy (verified; e.g. operationId `MotorInsuranceQuotePatch`) |

v2.1 notes: motor quotes require engine details; coverage max 1 year except life; life supports rider selection. Quotation runs **consent-free on client credentials** (LFI-Led vs TPP-Led via `PolicyIssuanceAllowed`); insurance data-sharing permissions use per-sector blocks with `ReadInsurancePolicies` as the mandatory base, 5-year history, and **no pagination** — full business rules in `payments-and-consent-rules.md`.

---

## FX & Remittance

**Purpose:** FX quote initiation and acceptance. Spec: `uae-fx-service-initiation-openapi.yaml` (title "UAE FX API", v2.1-errata1 effective). 5-second quote-response SLA.

| Endpoint | Notes |
|---|---|
| `POST /fx-quotes` | Request FX quote (verified 10 Jun 2026 in `uae-fx-service-initiation-openapi.yaml`) |
| `GET /fx-quotes/{FxQuoteId}` | Quote retrieval / status (operationId `FxQuote_read`) |
| `PATCH /fx-quotes/{FxQuoteId}` | **Accept** the quote — update status to `Accepted` to proceed with the FX trade (verified; operationId `FxQuote_signedRequest`) |
| `PATCH /fx-quotes/{FxQuoteId}/subscription` | Quote status-update subscription — only for quotes already `Accepted` (webhook event family: FxQuote) |

Remittance payment execution: via service initiation / international payments — no standalone remittance spec on main (verify against source).

---

## Product, Leads & ATM

Open data — no customer consent; TPP client-credentials token.

| Spec | Endpoint | Notes |
|---|---|---|
| `uae-product-openapi.yaml` | `GET /products` | Open product catalogue |
| | `POST /leads` | Lead submission |
| `uae-atm-openapi.yaml` | `GET /atms` | ATM locations, services, accessibility, fees, operating hours; scope `atm`; `Meta.LastUpdatedDateTime` + `TotalRecords` |

---

## Authorization Endpoints

Spec: `uae-authorization-endpoints-openapi.yaml` (v2.1-errata2). The API Hub is the OIDC Authorization Server for all LFIs.

| Endpoint | OperationId | Notes |
|---|---|---|
| `POST /par` | CreatePushedAuthorizationRequestV21 | Pushed Authorization Request — returns `request_uri`; max 2 RAR objects per PAR (combined consents) |
| `POST /token` | CreateAccessTokenRequestV21 | Grants verified 10 Jun 2026 (the three request schemas in the spec): `authorization_code`, `refresh_token`, `client_credentials`; client auth = `private_key_jwt` client assertion; requests MUST be `application/x-www-form-urlencoded` |

---

## Event Notifications (Webhooks)

Spec: `uae-webhook-template-openapi.yaml` — a **template** for the endpoint each TPP hosts; the API Hub pushes notifications to it.

- `POST /` at the TPP's registered webhook URL; acknowledge with **202 or 204, empty body**.
- Wire format: serialized **signed and encrypted JWT**, content type `application/jwe` (the `application/json` schema in the spec is for payload comprehension only).
- Event envelope: `Data` (full replica of the resource at change time) + `Meta` (`EventDateTime`, `EventResource`, `EventType`, ConsentId — or QuoteId for insurance). **`EventType` ∈ `Resource.Created` / `Resource.Updated` / `Resource.Deleted`** (dotted form, verified from the TPP Standards webhooks pages 10 Jun 2026).
- **Subscription model differs by family:** Consent Status events need NO per-consent subscription (fire on every consent status change via the TF webhook registration); Payment Status events require `subscription.Webhook.IsActive: true` on the payment consent; Insurance Quote events subscribe per-quote on the Accept PATCH.
- Consent events carry `RevokedBy` ∈ LFI / TPP / LFI.InitiatedByUser / TPP.InitiatedByUser; BSI consent events may include `PaymentConsumption` (cumulative usage). Payment events carry `RejectReasonCode` on rejection and `PaymentTransactionId` once rail-processed.
- Acknowledge **202 immediately, decrypt asynchronously**; late acks trigger redelivery — handle duplicates idempotently (JWE header `kid` selects the TPP decryption key; keep retired keys until in-flight events drain).
- Event families (`AEWebhookEventTypes`): **AccountOpening, Consent (consented events), FxQuote, Insurance, PaymentInitiation**.

---


## Trust Framework Directory APIs

**Purpose:** the Raidiam-operated directory underpinning the ecosystem — participant discovery, organisation/software-statement registration data, authorisation-server metadata, and the OAuth token endpoint for mTLS-authenticated directory calls. **Not version-bound** to the UAE OF release cycle. Spec: `public/openapi/trust-framework.yaml` in the `community-standards` repo (rendered at [/tech/api-specs/trust-framework/](https://nebras-open-finance.com/tech/api-specs/trust-framework/participants)).

| Endpoint | Purpose |
|---|---|
| `GET /participants` | Participant discovery |
| `POST /token` | OAuth token for directory calls (mTLS) |
| `GET /organisations` | Organisation registry |
| `GET /organisations/{OrganisationId}/softwarestatements` | Software statements |
| `GET /organisations/{OrganisationId}/contacts` | Org contacts |
| `GET /organisations/{OrganisationId}/authorisationservers` | Auth-server metadata |
| `GET /organisations/{OrganisationId}/authorisationservers/{AuthorisationServerId}/apiresources` | Published API resources |
| `GET /references/apifamilies` | API family reference data |

## CAAP Operations (Ozone Connect)

**Purpose:** the Ozone Connect endpoints an LFI must implement **when adopting CAAP** (the centralized auth platform) — user challenge/registration lifecycle, PII decryption, consent validation + augmentation, and CAAP-specific account / per-line insurance-policy GETs that drive the end-user consent journey in the AlTareq app.

**Branch caveat (10 Jun 2026):** spec is `dist/ozone-connect/v2.1.x/uae-ozone-connect-caap-operations-openapi.yaml` (title "Ozone Connect — UAE CAAP Operations API", v2.1.4) on the **`caap-refactor` branch only — not yet on `main`**, i.e. published on the website (which builds from `.specs-branch` = `caap-refactor`) but not yet merged to the authoritative branch. Treat as pre-release; re-check `main` before building.

| Endpoint group | Endpoints |
|---|---|
| Consent | `POST /consent/actions/validate`, `POST /consent/actions/augment` |
| User challenge | `/users/actions/challenge/initialize`, `/challenge/query`, `/challenge/complete` |
| User registration | `/users/actions/register/initialize`, `/register/complete`, `/users/actions/deregister` |
| PII | `POST /users/actions/pii/decrypt` |
| Consent-journey data | `GET /accounts`, `GET /accounts/{accountId}`, `GET /{line}-insurance-policies` (7 lines) |

## Cross-Cutting Conventions

| Convention | Detail |
|---|---|
| Request headers | `authorization` (Bearer, RFC 6750), `x-fapi-interaction-id` (RFC 4122 UUID, echoed back), `x-fapi-auth-date`, `x-fapi-customer-ip-address`, `x-customer-user-agent` |
| Idempotency | `x-idempotency-key` header on payment/file-payment POSTs; `GET /payments?x-idempotency-key=` re-locates the created resource |
| Pagination | `Links` object: `First`, `Prev`, `Next`, `Last` + `Meta`; transactions/statements filtered by date-time query params |
| Error model | `{ Errors: [ { Code, Message, Path, Url } ] }` — `Path` is the JSON Path of the offending field |
| 400 codes | `Consent.Invalid`, `Consent.BusinessRuleViolation`, `Consent.FailsControlParameters`, `Consent.InvalidUserIdentifier`, `JWS.InvalidSignature/Malformed/InvalidClaim/InvalidHeader`, `JWE.DecryptionError/InvalidHeader`, `Body.InvalidFormat`, `Resource.InvalidFormat`, `Event.UnexpectedEvent`, `GenericRecoverableError`, `GenericError` (or namespaced `Org.Code`) |
| 403 codes | `AccessToken.InvalidScope`, `Consent.TransientAccountAccessFailure`, `Consent.AccountTemporarilyBlocked`, `Consent.PermanentAccountAccessFailure` |
| Rate limiting | `429` with `Retry-After` (seconds) header |
| Signed responses | `...Signed` schema variants served as `application/jwt` (JWS) |
| Schema naming | `AE...` prefix (e.g. `AEReadAtms1`, `AEPaymentConsentResponseSigned`); amounts as `{ Amount, Currency }` (ISO 4217, e.g. AED) |

**Fetching specs:** `https://raw.githubusercontent.com/Nebras-Open-Finance/api-specs/main/dist/standards/<version>/<file>`; list the tree via `https://api.github.com/repos/Nebras-Open-Finance/api-specs/git/trees/main?recursive=1`. Rendered docs: [nebras-open-finance.com/tech/api-specs/](https://nebras-open-finance.com/tech/api-specs/).
