# UAE Open Finance Technical Specifications — Security & Infrastructure

> Regenerated from public sources 9 Jun 2026 (original file lost) — provenance & full verification history: `verification-log.md`. Cross-check time-sensitive figures against the community hub / OF Confluence before relying on them.

Security profile, certificates, environments, traceability, and NFRs for Standards **v2.1-final + errata3** (API Hub v8; errata3 touches auth-endpoints + bank-initiation only). Companion to `api-specifications.md` (endpoints/objects), `payments-and-consent-rules.md` (business rules), and `standards-versions.md` (version history).

## Table of Contents
1. [Security Model Overview](#security-model-overview)
2. [FAPI Profile, PAR & Tokens](#fapi-profile-par--tokens)
3. [Message Signing (JWS) & Partial Encryption (JWE)](#message-signing--encryption)
4. [Certificates & Rotation](#certificates--rotation)
5. [Authentication: CAAP, SCA & Delegated SCA](#authentication-caap-sca--delegated-sca)
6. [Environments & URL Patterns](#environments--url-patterns)
7. [Traceability — x-fapi-interaction-id](#traceability)
8. [Standard Headers](#standard-headers)
9. [NFRs / SLAs](#nfrs--slas)
10. [Rate Limits & Caching](#rate-limits--caching)

---

## Security Model Overview

Aligned with **OpenID Connect + FAPI** (Financial-grade API), adapted from UK Open Banking for the UAE (Emirates ID identity, Islamic-finance products). The Standards define a **UAE FAPI 2.0 security profile**; TPPs certify against it as OIDF Relying Parties.

Architectural invariants (do not blur):

- The **API Hub** (Ozone-powered, centralized) is the **OIDC Authorization Server** and issues **all** tokens — LFIs do not run their own AS for Open Finance.
- The **customer (PSU) authenticates at the LFI** (or via CAAP) — never at the Hub or the TPP.
- The Hub validates **token + consent on every request** before proxying to the LFI's Ozone Connect endpoints.
- **mTLS everywhere** on the trust-framework surface: a client transport certificate is required for every API call.

### Roles → Scopes & Consent URNs

Technical Access Scopes are assigned at organisation onboarding per the CBUAE licence and **fixed at application registration** — to change roles: disable the app, create a new one, re-register with each LFI (site: `/tech/tpp-standards/trust-framework/roles`).

| Role | User-consented scopes | `authorization_details` type (URN) | App-only scopes (client_credentials only) |
|---|---|---|---|
| **BSIP** (Bank Service Initiation Provider) | `openid payments` | `urn:openfinanceuae:service-initiation-consent:*` | `confirmation-of-payee` |
| **BDSP** (Bank Data Sharing Provider) | `openid accounts` | `urn:openfinanceuae:account-access-consent:*` | `atm`, `products` |
| **ISP** (Insurance Service Provider) | `openid insurance` | `urn:openfinanceuae:insurance-consent:*` | — |

User-consented APIs use `client_credentials` (consent staging) + `authorization_code` + `refresh_token`; app-only APIs use `client_credentials` only. A payment consent carrying `ReadAccountsBasic/Detail` or `ReadBalances` widens the scope to `accounts payments openid` and needs the BDSP role too (see `payments-and-consent-rules.md`).

## FAPI Profile, PAR & Tokens

| Element | Requirement |
|---|---|
| Profile | UAE FAPI 2.0 profile (Standards "API Security" / community-standards security pages). Note: spec security-scheme prose still cross-references FAPI 1.0 Part 2 Advanced for the private_key_jwt rule — read the Standards security section as authoritative |
| Client authentication | `private_key_jwt` client assertion at `/token` and `/par` (no client secrets) |
| Authorization staging | **PAR** (`POST /open-finance/auth/v2.1/par`) → `request_uri` → authorization redirect/decoupled flow. Request objects are signed JWTs |
| Rich Authorization Requests | Consent detail carried as RAR objects; **max 2 RAR objects per PAR** (Combined Consents, 5 scenarios) |
| Token endpoint | `POST /open-finance/auth/v2.1/token`; grant types (verified in `uae-authorization-endpoints-openapi.yaml` v2.1-errata2, 10 Jun 2026 — the three request schemas at `/token`): `client_credentials` (consent staging, file upload per v2.1), `authorization_code` (user-authorized access), **`refresh_token`** (long-lived consents). Requests MUST be `application/x-www-form-urlencoded` |
| Token lifetimes | Access token **10 minutes** (`expires_in: 600`) — refresh proactively; **refresh token valid for the lifetime of the consent** (invalidated at consent `ExpirationDateTime`). Authorization codes are single-use; exchange within seconds; reject callbacks arriving > ~10 min after /par initiation; validate `state` AND `iss` on every callback. The /token response also returns the Consent object with current Status (`AwaitingAuthorization` for multi-auth payment consents) (site: `/tech/tpp-standards/security/tokens/`, `/security/fapi/handling-callback`) |
| Scopes | Verified in spec securitySchemes (insurance spec, v2.1-errata1): client-credentials scopes `openid`, `confirmation-of-payee`, `accounts`, `insurance` ("Right to read insurance policies"), `tpp-reports`, `fx`, `account-opening`; plus `payments` (bank-initiation spec) and `atm` (ATM spec). User-token scopes (`accounts`, `insurance`, `payments`) are **parameterized with the ConsentId** |
| Sender constraint | Verified (10 Jun 2026): **no DPoP anywhere in the v2.1 specs** — client auth is `private_key_jwt` client assertion (`client_assertion_type` jwt-bearer) at `/par` and `/token`, with mTLS at transport level on the trust-framework surface. Treat DPoP mentions in third-party material as not applicable to v2.1 |
| Flows | Redirection and Decoupled authentication approaches (since v1.0); CAAP as centralized alternative |
| Certification | TPPs: OIDF FAPI 2.0 RP certification (paid to OIDF directly). LFIs: no individual FAPI certification — the API Hub holds platform certification |

### JWT Claim Rules

Two distinct signed JWTs per flow — the **Request Object (JAR)** sent to `/par` as `request=`, and the **Client Assertion** sent to both `/par` and `/token` as `client_assertion=`. Mixing their claim rules (especially `jti`, `sub`) is the top cause of 400s. (Site: `/knowledge-base/articles/jwt-claims`, `/tech/tpp-standards/security/fapi/request-jwt`, `/security/tokens/client-assertion`.)

| Rule | Detail |
|---|---|
| JOSE header | `alg` MUST be **PS256** — the only accepted algorithm (ES256/RS256/HS256 rejected); `kid` = the Signing certificate's Trust-Framework-assigned kid (case-sensitive); `typ` optional |
| `aud` | The Authorization Server's **issuer** value from `.well-known/openid-configuration` — NOT the `/token` or `/par` URL |
| Request Object | `iss` = `client_id` = ClientId; `iat` required; **`exp` ≤ `nbf` + 10 minutes (hard cap); recommended `nbf` + 300 s** — the security pages state a 5-minute max, so use 300 s; set `nbf` slightly before `iat` for clock skew (e.g. iat − 10 s); `redirect_uri` exact match to a registered value; `nonce` + `state` random UUIDs; `response_type=code`; `code_challenge_method=S256` (PKCE S256 only); `max_age` capped at 3600 |
| Client Assertion | `sub` = `iss` = `client_id` (empty/omitted `sub` rejected); **`jti` = fresh UUID per assertion** (reuse rejected — replay detection); `exp` ≤ 5 min; freshly generated per request |
| Payment PII | For payment consents the `pii` field inside `authorization_details` is itself a JWE — the Request JWT is signed but NOT encrypted; only the PII is (see below) |

## Message Signing & Encryption

| Mechanism | Where it applies |
|---|---|
| **JWS request signing** | CoP `/confirmation` and `/discovery` requests are signed (`signed...Request` operations); payment payloads have `...Signed` request variants |
| **JWS response signing** | Resource responses offered as `...Signed` schemas with content type `application/jwt` alongside plain JSON |
| **JWE webhook payloads** | Event notifications arrive as a serialized **signed then encrypted JWT**, content type `application/jwe`; TPP must decrypt (own encryption key), verify signature, then ack 202/204 — full claim checks below |
| **PII end-to-end encryption (payments)** | ALL payment PII — creditor(s), optional debtor account, Risk block — is encrypted TPP→LFI; see below |
| **Partial encryption — FinanceRates** | v2.1 encrypts FinanceRates (and insurance premium/payment-detail fields) as JWE inside otherwise-plain payloads; error codes `JWE.DecryptionError` / `JWE.InvalidHeader` surface failures |
| **JWE algorithms** | `alg: RSA-OAEP-256`, `enc: A256GCM`; encrypt to the recipient's JWKS key with `"use": "enc"` (never a `sig` key); all signed JWTs need `iat`/`nbf`/`exp` (site: `/tech/tpp-standards/security/fapi/message-encryption`) |
| **Error surface** | `JWS.InvalidSignature`, `JWS.Malformed`, `JWS.InvalidClaim`, `JWS.InvalidHeader` (400) — see error model in `api-specifications.md` |

### PII End-to-End Encryption (Payments)

Payment PII is **sign-then-encrypt, end-to-end TPP→LFI** (site: `/knowledge-base/articles/pii-encryption`, `/tech/tpp-standards/v2.1/banking/service-initiation/personal-identifiable-information/`):

- Sign the PII JSON as a JWS (PS256, standard claims `iat`/`exp`/`jti`/`iss`/`sub`/`aud`), then encrypt to a **compact JWE with `RSA-OAEP-256` / `A256GCM`** (Nested JWT) using the LFI's current `"use": "enc"` JWKS key. Sent as `PersonalIdentifiableInformation` (`AEJWEPaymentPII`) at both `POST /par` and `POST /payments`; each encryption is fresh.
- **Nebras/the API Hub routes the blob but cannot read, inspect, or validate it** — only the LFI decrypts (privacy-by-design). Consequence: a successful `/par` only means the Hub accepted the request, NOT that the LFI could decrypt/validate the PII — PII errors surface as payment-level rejections, and a consent accepted by one LFI may be rejected by another.
- **Shape differs by stage:** `/par` carries `Initiation.Creditor[]` (0–10 entries) + optional `Initiation.DebtorAccount`; `/payments` carries flat `Initiation.CreditorAccount`/`CreditorAgent`/`Creditor{Name,PostalAddress}`/`ConfirmationOfPayeeResponse` and **no DebtorAccount** (fixed by the consent).
- Field rules: `CreditorAccount.SchemeName` must be `IBAN` domestically ("AccountNumber" invalid), valid UAE IBAN, `Name.en` or `.ar` required; `DebtorAccount.SchemeName` always `IBAN`. Where CoP ran, the full raw JWS from `/confirmation` goes into `ConfirmationOfPayeeResponse` in the creditor entry.
- **BIC derivation:** `CreditorAgent` absent ⇒ the LFI derives the BIC from the IBAN; provided ⇒ the LFI must accept both 8- and 11-char BICs, must not reject on length, and validates consistency with the IBAN (truncating to 8 for Aani where needed). Confirm each LFI's exact field expectations during onboarding (e.g. 8 vs 11-char BIC, whitespace/encoding in creditor names).
- Beneficiary models (single / 2–10 / open) and creditor-matching rules: see `payments-and-consent-rules.md`.

### Webhook FAPI Claim Checks

On every webhook JWE (site: `/tech/tpp-standards/security/fapi/receiving-events`): read `kid` from the JWE header to select the TPP private key (keep retired keys until in-flight events drain) → decrypt → verify the inner JWS against the Hub JWKS → validate claims: `iss` must match the LFI owning the consent (cross-check `Meta.ConsentId` — prevents cross-LFI replay), `aud` contains your client_id, `exp` in the future, `nbf`, `jti` tracked for replay, `Meta.ConsentId` known. `EventType` ∈ `Resource.Created` / `Resource.Updated` / `Resource.Deleted`. **Consent-status events need NO per-consent subscription** (they fire from the Trust Framework webhook registration); **payment-status events require `subscription.Webhook.IsActive: true` on the payment consent**; insurance quote events are subscribed per-quote (see `api-specifications.md` §Webhooks).

## Certificates & Rotation

Issued/managed through the **Trust Framework** (participant directory + certificate authority, operated on Raidiam — verify vendor naming against source). Register the organisation, nominate Organisation Admins, create applications, upload keys.

| Item | Purpose |
|---|---|
| **Transport certificate + key** (`.pem`/`.key`) | mTLS on every API call (required) |
| **Signing key** (+ `kid`) | JWS request objects, client assertions, signed payloads (required) |
| **Encryption key** | JWE decryption of webhooks / partially-encrypted fields — **optional, but required to receive webhook events** |
| `ClientId` / `RedirectURI` | Registered application identity and callback |

**Validity & CSR rules** (site: `/tech/tpp-standards/trust-framework/certificates/`): certificates are **valid 13 months**; the TPP holds its private keys and rotates each certificate itself (overlap pattern — issue new alongside old, both `kid`s resolvable, cut over, retire). Requirements: **2048-bit RSA unencrypted key + SHA-256 CSR**; CSR subject MUST be `C=AE`, `O=` org legal name in the Trust Framework, `OU=` Organisation ID in the TF, `CN=` application Client ID (UUID). Production key generation must be in an HSM or equivalent. Each certificate gets a TF-assigned **`kid`** (case-sensitive) — always sign JWTs with the Signing certificate's kid. SAN extensions are for **LFI server certificates only**; TPP client certs use CN=ClientId, no SAN.

Dynamic client registration with each LFI's authorization server via `/tpp-registration` (software statement from the Trust Framework); a `204` on the registration call is the standard "mTLS + credentials are good" smoke test.

**Certificate rotation:** an operational guide for LFIs/TPPs (published Jun 2026 via community-standards) covers rotating **transport and signing** material without service interruption — staged dual-key publication in the directory (JWKS), then cutover, then retire. Treat transport and signing rotations as independent exercises; the most common signing-rotation failure is a new cert with the old `kid` in the JWT header (or vice versa).

## Authentication: CAAP, SCA & Delegated SCA

- **CAAP** (Centralized Authentication and Authorization Platform): the user authenticates via the **AlTareq mobile app**, anchored on **EFR** (Emirates Face Recognition) and **UAE Pass**. One registration works across all LFIs; CAAP also hosts centralized consent management. API Hub v8 ships CAAP sequence diagrams (User Registration, Consent Authorization) and the AlTareq CAAP Integration Guide.
- **LFI-led SCA**: redirection or decoupled authentication at the LFI, meeting the SCA Guidelines (two of possession/knowledge/inherence, dynamic linking; FIDO2/WebAuthn, OID4VC, and Secure Payment Confirmation supported since v1.2).
- **Delegated SCA** (v1.2+): TPP-managed SCA for long-lived payment consents — device binding (NFC/biometrics) required; liability shifts per the liability framework. Balance Check permission rides as a consent extension.
- SCA/auth failures carry liability compensation (AED 500) — see `liability-framework.md`.

## Environments & URL Patterns

General host shape: `https://{auth1|as1|rs1}.{lfiCode}.{sandbox|preprod|prod}.apihub.openfinance.ae` — `auth1.*` = OIDC issuer/discovery surface, **`as1.*` = Authorization Server endpoints (`/par` + `/token`, per the published `pushed_authorization_request_endpoint`/`token_endpoint` values in the discovery document)**, `rs1.*` = resource server (TPP-facing API Hub surface, also DCR `/tpp-registration`). Always resolve endpoints from `.well-known/openid-configuration` rather than constructing hosts; `mtls_endpoint_aliases` values are currently identical to the top-level values (prefer the alias, fall back to top-level — site: `/knowledge-base/articles/mtls-endpoint-aliases`). Note (verified 10 Jun 2026): the OpenAPI `servers:` blocks carry **relative base paths only** (`/open-finance/{auth|account-information|account-opening|fx|insurance}/v2.1`) — hosts come from the environment docs, so confirm the **production** host pattern against current docs before relying on it (sandbox/preprod patterns below are documented).

| Environment | Discovery | AS endpoints (`/par`, `/token`) | API base |
|---|---|---|---|
| Model Bank (sandbox) | `https://auth1.altareq1.sandbox.apihub.openfinance.ae/.well-known/openid-configuration` | `https://as1.altareq1.sandbox.apihub.openfinance.ae` | `https://rs1.altareq1.sandbox.apihub.openfinance.ae` |
| Model Insurer (sandbox) | `https://auth1.altareq2.sandbox.apihub.openfinance.ae/.well-known/openid-configuration` | `https://as1.altareq2.sandbox.apihub.openfinance.ae` (verify against source) | `https://rs1.altareq2.sandbox.apihub.openfinance.ae` |
| LFI pre-production | `https://auth1.[LFI CODE].preprod.apihub.openfinance.ae/.well-known/openid-configuration` | per discovery document | `https://rs1.[LFI CODE].preprod.apihub.openfinance.ae` |

Full endpoint URL = API base + spec server path + endpoint, e.g. `https://rs1.altareq1.sandbox.apihub.openfinance.ae/open-finance/account-information/v2.1/accounts`.

mTLS host patterns for tooling (e.g. Postman certificates): `*.altareq1.sandbox.apihub.openfinance.ae`, `*.altareq2.sandbox.apihub.openfinance.ae`, `*.[LFI CODE].preprod.apihub.openfinance.ae` — one certificate entry per host pattern.

## Traceability

Every request carries **`x-fapi-interaction-id`**: an RFC 4122 **UUIDv4, unique per request**, echoed back in the response header of the same name. It is the end-to-end correlation key across TPP, LFI, and platform logs — never reuse a value across calls.

Failure modes (site: `/knowledge-base/articles/request-headers`, `/tech/tpp-standards/security/request-headers`):
- **A malformed (non-UUIDv4) value is silently discarded** — the request does NOT fail, but the Hub stores nothing, so your logged id matches nothing Hub-side and end-to-end tracing dies silently.
- If omitted, the Hub generates one — knowable only from the response header, so log lines written before the response have no id.
- **Log the interaction id when composing the request**, not on response, so it exists even if the request never returns.

When raising a support ticket (Service Desk / support@nebrasopenfinance.ae), always include the `x-fapi-interaction-id` (request, and response if available) — **required** to locate the transaction — plus the **ConsentId** for consent/resource issues. Without the interaction id, investigation is significantly delayed.

## Standard Headers

| Header | Direction | Notes |
|---|---|---|
| `authorization` | Request | Bearer token (RFC 6750) — mandatory |
| `x-fapi-interaction-id` | Both | UUIDv4 correlation id; echoed by server; mandatory on responses |
| `x-fapi-auth-date` | Request | When the customer last authenticated with the TPP |
| `x-fapi-customer-ip-address` | Request | Set when the customer is present (ties to Risk Information Block Customer Present flag) |
| `x-customer-user-agent` | Request | Customer device user agent |
| `x-idempotency-key` | Request | Payment / file-payment POSTs; also usable as a GET query for resource lookup |
| `Retry-After` | Response | On `429`, seconds to wait |

## NFRs / SLAs

| Metric | Target | Reference |
|---|---|---|
| Platform/LFI uptime | 99.5% | Operational Guidelines |
| API response time | 500 ms | Availability & Performance |
| Payment execution | 3 s | — |
| Payment status response | 500 ms | Rule A20 |
| FX quote response | 5 s | — |
| Payment initiation window | 10 minutes | Rules A15–A17 |
| International payments to a new beneficiary | AED 15,000 cap for **48 hours after beneficiary creation** (per customer, per TPP, per bank; sum of multiple payments) | Verified 10 Jun 2026 in the OF Confluence **Limitation of Liability Model** (doc v2.1); rule ID "A12.1" not verified |
| Breaking-change notice | 30 days + dual running | Change Management |

SLA breaches map to liability compensation amounts (e.g. execute-within-SLA failure AED 200–350) — see `liability-framework.md`. Stress testing against these NFRs is a certification gate (`testing-certification.md`).

## Rate Limits & Caching

- **Rate limiting** is signalled via `429` + `Retry-After`; specific published quotas per TPP/endpoint are not in the public specs (verify against source — usage benchmarks live in the Operational Guidelines).
- **Caching:** open-data endpoints (`/products`, `/atms`) return `Meta.LastUpdatedDateTime` / `TotalRecords` to support client-side caching; no explicit HTTP cache-control regime is published in the specs (verify against source). Consent-protected data should not be cached beyond the consent's permissions and validity.
- Data-sharing fees are volume-based (per 100 lines) — over-fetching has direct cost; prefer date-bounded transaction queries (see `pricing-model.md`).
