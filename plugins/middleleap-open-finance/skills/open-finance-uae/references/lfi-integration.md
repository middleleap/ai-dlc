# LFI Integration Guide — Ozone Connect & API Hub

> Regenerated from public sources 9 Jun 2026 (original file lost) — provenance & full verification history: `verification-log.md`. Cross-check time-sensitive figures against the community hub / OF Confluence before relying on them.

Source: [LFI Integration Guide](https://nebras-open-finance.com/tech/lfi-api-hub) on the community hub (rendered from the `community-standards` repo, verified against repo source 9 Jun 2026). Current guide version: **v2.1** (API Hub v8).

## Table of Contents
1. [Architecture: Where the LFI Sits](#architecture-where-the-lfi-sits)
2. [What an LFI Exposes (Ozone Connect)](#what-an-lfi-exposes-ozone-connect)
3. [What an LFI Consumes (API Hub Services)](#what-an-lfi-consumes-api-hub-services)
4. [UI Obligations vs Headless Components](#ui-obligations-vs-headless-components)
5. [Onboarding: The 9-Step Integration Journey](#onboarding-the-9-step-integration-journey)
6. [Trust Framework Operations](#trust-framework-operations)
7. [Environments](#environments)
8. [Certificate Matrix & Rotation](#certificate-matrix--rotation)
9. [Admin Portal](#admin-portal)
10. [Consent Journey: Failure & Multi-Auth Rules](#consent-journey-failure--multi-auth-rules)
11. [CAAP (Centralized Authentication & Authorization)](#caap-centralized-authentication--authorization)
12. [Payment Rails & Status](#payment-rails--status)
13. [Recommended Rollout Sequencing](#recommended-rollout-sequencing)
14. [Multi-Segment LFIs](#multi-segment-lfis)
15. [Operational Duties](#operational-duties)

---

## Architecture: Where the LFI Sits

UAE Open Finance is **strictly mediated**: TPPs never call LFIs directly. All TPP traffic routes through the **API Hub** (operated by Nebras, with vendor support from Ozone API), which acts as:

- the **OIDC/FAPI 2.0 authorization server** (token issuance),
- the **consent source of truth** (the LFI does NOT maintain independent consent state),
- the **gateway** that enforces schemas and proxies every request to the relevant LFI.

The LFI's role is the **execution layer**: serve account data, execute payments, authenticate customers, and surface consents to customers. Consent state, token issuance, schema enforcement, and TPP-facing routing all live in the Hub.

## What an LFI Exposes (Ozone Connect)

Ozone Connect is the LFI-side API surface the Hub calls on behalf of authorised TPPs.

| Capability | Key endpoints (LFI implements) | Notes |
|---|---|---|
| Consent Events | `POST /consent/action/validate` | Called by Hub **before** a consent is stored; LFI signals which consent types/permissions it supports. Build this first — reject unimplemented types, expand as capabilities go live |
| Bank Data Sharing | `GET /accounts`, `GET /accounts/{AccountId}`, `/balances`, `/transactions`, `/beneficiaries`, `/direct-debits`, `/standing-orders`, `/scheduled-payments`, `/statements`, `/products`, `GET /customer`, `GET /accounts/{AccountId}/customer` | Includes pagination and encrypted FinanceRates (JWE) guides |
| Payment Execution (Service Initiation) | `POST /payments`, `GET /payments/{PaymentId}` | **Rails: intra-bank first; AANI (IPP) primary inter-bank rail; automatic UAEFTS fallback** — see [Payment Rails & Status](#payment-rails--status). Covers SIP, all 6 multi-payment types + Delegated SCA; involves PII decryption (encrypted Debtor Account / Creditor blocks) |
| Refunds | `GET /payment-consents/{ConsentId}/refund` | Depends on a live payment capability |
| Confirmation of Payee (responder) | `POST /customers/action/cop-query` | Direct LFI-exposed API proxied via Hub — **does not use the consent journey**; can be delivered in parallel |
| Health Check | `GET /hello`, `GET /hello-mtls`, `echo-cert` | Used to verify connectivity/mTLS before functional calls |
| Insurance Data Sharing | Per-line policy endpoints (motor, health, home, renters, travel, life, employment) | For insurance-scope LFIs |
| Insurance Quotation | Quote endpoints for 7 types (LFI-led and TPP-led journeys) | For insurance-scope LFIs |
| ATMs / Products & Leads | `GET /atm`, `GET /products`, `POST /leads` | Open-data style endpoints |

## What an LFI Consumes (API Hub Services)

Both services are called with the **`C3-hh-cm-client`** application registered in the Trust Framework, over **mTLS using the C3 transport certificate**; if the Hub is configured for JWT Auth, a signed JWT (Sig4 signing key) is also required in the Authorization header.

### Headless Heimdall Auth Server (consent authorization journey)

Shields the LFI from raw OIDC/FAPI 2.0 — the LFI calls three endpoints at the right points in the customer journey:

| Endpoint | Purpose |
|---|---|
| `GET /auth` | Start of every authorization code grant; Hub validates the FAPI/OIDC request and returns interaction context + decoded consent details |
| `POST /auth/{interactionId}/doConfirm` | After customer authenticates (SCA) and authorizes; Hub updates consent state and issues tokens to the TPP |
| `POST /auth/{interactionId}/doFail` | Authentication failed or customer rejected; Hub error-redirects back to the TPP |

URLs: `https://hh.{lfiCode}.preprod.apihub.openfinance.ae` (pre-prod) / `https://hh.{lfiCode}.apihub.openfinance.ae` (production). `{lfiCode}` is assigned during API Hub onboarding.

### Consent Manager (read/write access to central consent records)

URLs: `https://cm.{lfiCode}.preprod.apihub.openfinance.ae` / `https://cm.{lfiCode}.apihub.openfinance.ae`. Used in three contexts:

1. **Auth journey** — read consent details (`GET /consents/{consentId}`), update state (`PATCH /consents/{consentId}`: status, customer identifiers, account IDs).
2. **Consent Management Interface (CMI)** — `GET /psu/{userId}/consents` (list per customer), `GET /consents/{consentId}`, `POST /consents/{consentId}/action/revoke`, `POST /consent-groups/{consentGroupId}/consents/action/revoke`.
3. **Payment status updates** — for every Open Finance payment, the LFI MUST update status via `PATCH /payment-log/{id}` so the Hub's payment log and the CMI stay accurate. (Insurance equivalent: insurance quote log.)

**Multi-user authorization (errata2):** per Standards v2.1-errata2, the LFI must be able to retrieve an **"Awaiting Authorization"** consent's details so remaining approvers can view and authorize it (e.g. two-signatory SME/corporate accounts). See Multi-Authorization under Service Initiation.

## UI Obligations vs Headless Components

| Surface | Who builds it | Notes |
|---|---|---|
| Consent journey UI (authentication + authorization screens) | **LFI** | Customer authenticates with the LFI (SCA per Standards); LFI presents consent details from the Hub and captures the decision; screens are subject to CX certification and AlTareq brand requirements |
| CAAP hand-off | LFI integrates | Centralized Authentication via the AlTareq app (EFR + UAE Pass); fully documented in the v2.1 LFI guide — see [CAAP](#caap-centralized-authentication--authorization) |
| Consent Management Interface (CMI) | **LFI — mandatory** | In the LFI's digital banking channels (retail and, when in scope, SME); view + revoke active consents, powered by Consent Manager APIs; separate requirements/UX pages exist for Bank Data Sharing, Bank Service Initiation, and Insurance Data Sharing |
| OIDC/FAPI protocol mechanics | **API Hub (headless)** | Headless Heimdall handles PAR validation, token issuance, redirects — LFI never implements raw FAPI server logic |

## Onboarding: The 9-Step Integration Journey

Three phases: **A — Pre-production build & integrate · B — Certification · C — Production launch.** Steps 1, 2, 5, 6 are one-off per environment; steps 3, 4, 7–9 can be run iteratively, capability by capability (e.g. Data Sharing first, Service Initiation later). All in-scope capabilities MUST be live by the regulatory compliance deadline, but the path can be staged.

| # | Step | Done when |
|---|---|---|
| 1 | Onboard to **Sandbox Trust Framework** — register organisation, Organisation Admins + users, upload Client Transport + Client Signing certificates, register application and create the `C3-hh-cm-client`, record contacts | Org visible in sandbox directory with correct LFI role; certs bound; admin + technical user can authenticate |
| 2 | Set up **Pre-Production API Hub** — Prerequisites Questionnaire, connectivity & certificates, application-layer auth, environment-specific config (Ozone Connect base URL, authorization endpoint) | mTLS handshake + end-to-end test request Hub → Ozone Connect → Hub; JWT auth verified |
| 3 | **Develop your Open Finance APIs** — both directions: Ozone Connect (exposed) + Consent Manager / Headless Heimdall (consumed), consent journey + SCA, CMI | Per capability: endpoints match OpenAPI specs; full journey PAR → authorization → tokens → data/payment call → consent visible in CMI; lifecycle events flow both ways |
| 4 | **Test and certify** | See `references/testing-certification.md` (detailed certification content still being finalised on the hub) |
| 5 | Onboard to **Production Trust Framework** — separate instance; production certificates and application registrations; sandbox artefacts are NOT reused | Org listed in production directory; production app + certs registered |
| 6 | Connect to **Production API Hub** | mTLS + authenticated test request succeed; no pre-prod credentials/endpoints remain in production config |
| 7 | **Validate in production** — attestation & self-testing with controlled bank-staff test accounts; full consent/data/payment journeys; verify error mapping, logging, observability | All critical flows succeed; monitoring/alerting live; no real customer traffic processed |
| 8 | **Publish resources** — create authorisation server + register API resources (family, version, endpoints) in the production Trust Framework directory | TPPs can discover the LFI; metadata matches deployed infrastructure |
| 9 | **Live proving with TPPs** — TPP Buddying sessions, full end-to-end with real customers, triage defects | Each buddying TPP reports successful end-to-end flows; defects resolved or formally accepted; ready for general TPP traffic. LFI certification requires **at least 2 TPPs** testing all endpoints |

**API Hub onboarding logistics:** managed through the Nebras Service Desk — email `support@nebrasopenfinance.ae` ("API Hub Onboarding Request — [Org] — [Environment]") naming a **Primary Technical Contact (PTC)**; Nebras raises tickets per stage. Three stages: (1) Prerequisites Questionnaire, (2) Application Layer Authentication — choose from mTLS Only / API Key / Client Credentials Grant / **JWT Auth (recommended)**, (3) Environment-Specific Configuration (certificates, URLs, domain values — repeated per environment).

## Trust Framework Operations

> Source: `https://nebras-open-finance.com/tech/lfi-api-hub/trust-framework/` (29 pages), verified 10 June 2026.

### Directories

| Environment | Web app | OIDC discovery |
|---|---|---|
| Sandbox | `https://web.sandbox.directory.openfinance.ae/` | `https://auth.sandbox.directory.openfinance.ae/.well-known/openid-configuration` |
| Production | `https://web.directory.openfinance.ae/` | `https://auth.directory.openfinance.ae/.well-known/openid-configuration` |

Four functions: trust anchor (participant registry/roles), API discovery portal, keystore, PKI (TLS/signature/encryption certs). An LFI may also exercise TPP capabilities while keeping its LFI classification.

### Onboarding (CBUAE-gated)

- Sandbox onboarding opens once CBUAE confirms **receipt of the licence application or in-principle approval**; production onboarding once the licence is **approved**. Pre-licensing enquiries: `connect@nebrasopenfinance.ae`.
- Sandbox request to `support@nebrasopenfinance.ae` ("Trust Framework Sandbox Onboarding Request — [Org]") with **four attachments**: CBUAE licence/LoI; Organisation Details form; Primary Organisation Admin form; **signed Chief Compliance Officer letter approving the Primary Organisation Admin**.
- The **Primary Organisation Admin** is the main contact with Nebras/CBUAE; during registration they receive the **LFI Participation Agreement** for e-signature — it must be signed by an authorised signatory who can legally bind the organisation before the org can access the Trust Framework.

### Roles

| Role | Purpose | Grant types |
|---|---|---|
| `LFI` | All LFIs; used by the `C3-hh-cm-client` for operational Hub calls — that client must hold the **LFI role only** | client_credentials |
| `BSIP` | Bank service initiation (TPP-style test clients) | client_credentials + authorization_code + refresh_token |
| `BDSP` | Bank data sharing | same as BSIP |
| `ISP` | Insurance data sharing | same as BSIP |

### Certificate specs

- LFI clients need **two** application certificates: Transport (mTLS) + Signing (JWTs). An encryption certificate is **NOT** required for LFI clients — org-level ENC1 keys are server-side platform keys; app-level encryption certs are only for TPPs receiving encrypted webhooks.
- Requirements: **2048-bit RSA unencrypted key; SHA-256 CSR**; CSR subject `C=AE`, `O=<legal name in TF>`, `OU=<Organisation ID>`, `CN=<application Client ID UUID>`. Production key generation must happen in an HSM.
- **Certificates are valid 13 months**; rotate before expiry; you rotate only certs whose private key you hold — Nebras rotates the rest (see [Certificate Matrix & Rotation](#certificate-matrix--rotation)).
- Each cert gets a case-sensitive **`kid`** (shown on the cert detail page); every signed JWT must carry the Signing cert's kid.
- **SAN rule:** server-side transport certs (the ones LFIs present at their API Hub-facing endpoints) MUST carry a SubjectAltName with the DNS hostname (`-addext "subjectAltName=DNS:..."`, OpenSSL ≥1.1.1) — CN is deprecated for hostname validation. TPP/client certs do NOT add a SAN (CN = Client ID).
- `C3-hh-cm-client` creation: LFI role only; logo + redirect URI are required by the form but unused (any valid HTTPS URI, e.g. `https://localhost/callback`); recommend Federation = Enabled, Federation Entity Management Type = Managed. The assigned Client ID (UUID) is used as `client_id`, `iss` and `sub` in every JWT.

### Server & API-resource publication

- The LFI MUST publish its API Hub as a directory "server" (pre-prod Hub → sandbox TF; production Hub → production TF). Required fields: Customer Friendly Server Name (brand-specific), **Issuer** (from the Hub's discovery doc, shape `https://auth1.{lfiCode}.apihub.openfinance.ae`), description, **logo matching the brand**, and **Account Type: Retail / SME / Corporate** (so TPPs pick the right server). Multi-brand institutions register multiple servers.
- API resources sit under the server, one per API family; the TPP-facing base URL is always `rs1.{lfiCode}.(preprod.)apihub.openfinance.ae`. Family schema retrievable via `GET /references/apifamilies`.
- **Gating rule: API resources may only be published to the production Trust Framework after Functional Certification**; sandbox publication anytime.
- "API Hub default" endpoints — delivered wholly by the Hub, no Ozone Connect work, but MUST be included when publishing the family: `GET /account-access-consents(/{ConsentId})`, `GET /payment-consents(/{ConsentId})`, CoP `GET /discovery`.

### Directory API

client_credentials token at the directory (`scope: directory:software`) over mTLS; hosts `https://matls-auth.(sandbox.)directory.openfinance.ae` + `https://matls-api.(sandbox.)directory.openfinance.ae`; `GET /organisations` (filter `Size == "TPP"` vs `"LFI"`), `GET /organisations/{id}/softwarestatements` (SoftwareRoles e.g. BDSP/BSIP).

## Environments

| Trust Framework | Pairs with API Hub | Purpose |
|---|---|---|
| Sandbox | Pre-production Hub | Build, integrate, certify |
| Production | Production Hub | Validation (controlled accounts) → live proving → live traffic |

## Certificate Matrix & Rotation

> Source: API Hub environment-specific configuration pages + Knowledge Base articles "Certificate Rotation" (updated 3 Jun 2026) and "Multi-Segment API Hubs" on `https://nebras-open-finance.com`, verified 10 June 2026.

| Cert | Held by | Type | Role |
|---|---|---|---|
| **C3** | LFI | Client transport | LFI calls Consent Manager + Headless Heimdall (requires the `C3-hh-cm-client` app) |
| **S4** | LFI | Server transport | **The LFI's Ozone Connect server identifies itself to the API Hub** |
| **Sig4** | LFI | Signing (JWT Auth only) | LFI signs JWT Auth headers on Ozone Connect responses / Heimdall + CM requests |
| **Enc1** | LFI | Encryption (org-level) | Decrypts PII / Emirates ID payloads sent to the LFI |
| **S1** | Ozone | Server transport | Identifies the LFI's Hub instance to TPPs |
| **S3** | Ozone | Server transport | Consent Manager & Headless Heimdall identify themselves to the LFI |
| **Sig2** | Ozone | Signing | Hub signs TPP-facing responses incl. id_token |
| **C4** | Ozone | Client transport | Hub identifies itself to the LFI when calling Ozone Connect |
| **Sig3** | Ozone | Signing (JWT Auth only) | Hub signs JWT Auth headers on Ozone Connect requests / Heimdall + CM responses |

- **Who rotates what:** you hold the private key → you rotate; Nebras/Ozone holds it → they rotate (no LFI action). The LFI-held set (C3/S4/Sig4/Enc1) is shared across Hub instances; Ozone-held certs are added per Hub — the LFI certificate burden does not grow with Hub count.
- **Validity:** all Trust Framework certificates expire **13 months** after issue, EXCEPT the **server encryption key (SERVER ENCKEY), which never expires**. The directory emails expiry reminders starting two months before expiry — keep org notification recipients current.
- **Zero-downtime overlap rotation:** (1) generate a fresh 2048-bit RSA key + SHA-256 CSR with the **same subject fields** as the old cert (in production: inside an HSM); (2) upload the CSR / issue the new cert — it gets its own `kid` and is auto-published to the org JWKS; (3) overlap — both kids resolvable and trusted; (4) cut over; (5) verify, then revoke/retire the old cert and destroy the old key per policy.
- **Transport rotation** (incl. S4): deploy to the mTLS-terminating infrastructure (for S4 = the Ozone Connect server); the Hub re-verifies via the health-check endpoints **`/hello-mtls` and `/echo-cert`** — confirm both pass before retiring the old cert. Where the Hub pins the **OU (Organisation ID)** rather than a specific cert, an identical-subject rotation needs no config change on the verifying side.
- **Signing rotation pitfall:** the most common failure is a new cert with the old `kid` in the JWT header (or vice versa) — the header `kid` MUST match the signing key.
- Convention: record who holds the private key in the certificate's description field (e.g. "S4 - I hold Private Key - APIHub-OzoneConnect").

## Admin Portal

> Source: `https://nebras-open-finance.com/tech/lfi-api-hub/v2.1/api-hub/admin-portal/`, verified 10 June 2026.

- One portal per Hub instance per environment at `admin.{lfiCode}(.preprod).apihub.openfinance.ae`. Access is **SSO from the Trust Framework** — TF contact roles (PTC, PBC, STC) grant access automatically; no separate user management.
- Sections: Dashboard, TPP Management, Logs, Reports, Consent Management, Planned Outages.
- **TPP activation (mandatory, 3 steps in order):** after a TPP's `/tpp-registration` succeeds, access is NOT automatic — the LFI MUST activate (1) the TPP, (2) the Software Statement, (3) the Client; all three levels must be active. Blocking at any level stops traffic — do NOT block without Nebras instruction (CBUAE licence revocations are handled centrally by Nebras). **Nebras and Ozone internal clients appear in the list and MUST remain active.**
- **Ozone Health Probe:** an automated client that periodically creates PAR consents to verify Hub health; these are never authorised and auto-expire — filter them out of consent analytics.
- **Logs:** portal audit log (user/action/target/timestamp) + API logs searchable by **`x-fapi-interaction-id`**, returning the full request lifecycle (inbound TPP request → validation/enrichment → outbound to LFI → LFI response → response processing → outbound to TPP). Useful trace headers: `Host`, `X-Original-URL`, `X-Cert-DN`. When a TPP reports an issue, ask for the interaction ID.
- **Reports:** performance report (max/min/avg response time, call counts per endpoint/TPP/response-code, end-to-end including LFI time) plus a separate **LFI Performance report that strips Hub latency** (Hub→Ozone Connect→Hub only — the view that maps to the 500 ms p95 policy target); error-rates report; CSV export.
- **Planned outages:** register downtime windows in the portal; Nebras notifies TPPs; **errors during registered windows are treated sympathetically in performance reporting**. (Maintenance downtime still counts against the 99.5% availability target — see `references/operational-policies.md`.)

## Consent Journey: Failure & Multi-Auth Rules

> Source: `https://nebras-open-finance.com/tech/lfi-api-hub/v2.1/consent-journey/`, verified 10 June 2026.

- The redirect arrives with `client_id`, `response_type`, `request_uri`; the LFI MUST NOT reject redirects carrying extra query params — forward everything to `GET /auth` (Heimdall is the validator).
- **`GET /auth` outcomes:** **200** = proceed; **303** = redirectable failure (send the user to `Location` unmodified); **400** = non-redirectable (render an error page; do NOT redirect to the TPP).
- **PATCH-to-Authorized body:** `status`, `psuIdentifiers` (opaque, LFI-defined), `accountIds` (≥1 for Bank Data Sharing; **exactly one debtor account** for Bank Service Initiation), `insurancePolicyIds` for Insurance Data Sharing (Consent Manager mirrors them into accountIds), `authorizationChannel` (`App`/`Web`).

**`doFail` error table** — all scenarios use `error=access_denied` with `error_description`:

| `error_description` | When | PATCH consent to `Rejected` first? |
|---|---|---|
| `user_failed_to_authenticate` | Initial authentication failed | **No** — identity unconfirmed |
| `user_failed_step_up_authentication` | Step-up authentication failed | **Yes** — MUST PATCH Rejected first |
| `user_account_blocked` | Blocked/suspended/flagged (deceased marker, fraud hold, sanctions) | No |
| LFI internal error / Hub-unreachable / LFI-temporarily-unavailable variants | Technical failures | No (Hub unreachable: best-effort PATCH, then still call doFail) |

Authorization-stage failures (7 scenarios: user declines; no eligible accounts — incl. `IsSingleAuthorization=true` but the user lacks sole authority; consent type unsupported; session expiry; internal error; Hub unreachable; capacity): general rule is **PATCH Rejected before doFail**, except when the Hub is unreachable. Step-2 validate and step-3 event hooks are optional per onboarding config; without validate, the Hub creates all consents immediately.

**Multi-authorization choreography:** the TPP sets `IsSingleAuthorization` and, when false, SHOULD set `AuthorizationExpirationDateTime` (≤ `ExpirationDateTime`) in `authorization_details[].consent`. After the first authorizer the LFI PATCHes **`Meta.MultipleAuthorizers`** (`TotalRequired`, `Authorizations[]` with `AuthorizerId`/`AuthorizerType` (e.g. admin-group)/`AuthorizationStatus` Pending|Approved|Rejected + `AuthorizationDate`), keeps status `AwaitingAuthorization`, and calls doConfirm; PATCHes after each approval; all approved → `Authorized`; any rejection → `Rejected`. The TPP monitors via consent events or `GET /payment-consents/{ConsentId}`, then uses refresh_token → token → pay.

**CMI rules:** the LFI CMI does **not** support Pause/Reactivate — Pause is a TPP-only concept with no Hub consent-state effect. Revoke must be offered for `Authorized`, `AwaitingAuthorization` and `Suspended` with a **single confirmation page** describing impact, then PATCH to `Revoked` via Consent Manager. **Consumed single-use consents are irrevocable** — no revoke button.

## CAAP (Centralized Authentication & Authorization)

> Source: `https://nebras-open-finance.com/tech/lfi-api-hub/v2.1/caap/` (21 pages incl. CAAP Operations API), verified 10 June 2026. **CAAP Operations is fully documented in the v2.1 LFI guide**, and the CAAP OpenAPI spec ships in the main api-specs release tree (`/tech/api-specs/v2.1/ozone-connect/caap`) — earlier "pre-release / caap-refactor branch" framing is stale.

- CAAP is the Nebras-operated alternative to an LFI-built auth UX + CMI: adopting LFIs do NOT build the consent journey UX, the CMI, or direct Heimdall/CM integration, but MUST still build all Ozone Connect data/payment APIs **plus the CAAP Operations endpoints**. Adoption is declared in the Prerequisites Questionnaire (if Yes: no Authorization Endpoint URL, no LFI CMI).
- **Flow:** TPP PAR → Hub calls LFI `POST /consent/actions/validate` (gates the request_uri) → Hub redirects the user to **CAAP** (not the LFI) → CAAP authenticates via **EFR or UAE Pass directly** (Emirates ID established; no LFI involvement) → CAAP calls LFI `POST /users/actions/register/initialize` with the **Emirates ID encrypted under the LFI's ENC1 public key** (LFI decrypts with the ENC1 private key) → LFI returns `providerUserIdentifier.userId` — **MUST be opaque and non-sensitive** (never Emirates ID/CIF/account number/email/phone); stored centrally by the Hub and reused as `psuIdentifiers.userId` → optional LFI OTP challenge (`registrationStatus: AwaitingChallengeResponse` + `challengeId`, completed via `POST /users/actions/register/complete`; **an incorrect OTP returns HTTP 200 with a result indicator, not a 4xx**) → CAAP fetches accounts/policies via CAAP-specific `GET /accounts`, `GET /accounts/{accountId}`, `GET /{type}-insurance-policies` → pre-confirm validate → CAAP completes with Heimdall/CM and the Hub redirects to the TPP.
- Post-consent, users manage/revoke consents **in CAAP**, propagated via the normal consent-events path. The endpoint set also includes `users/actions/challenge/{initialize|complete|query}`, `users/actions/pii/decrypt`, `users/deregister`.
- Commercial terms: the CAAP pricing page is a placeholder — see `references/pricing-model.md`.

## Payment Rails & Status

> Source: `https://nebras-open-finance.com/tech/lfi-api-hub/v2.1/banking/service-initiation/domestic-payments/overview/payment-status`, verified 10 June 2026. This supersedes any earlier "domestic payments execute over IPP only" framing.

- **Three execution modes, chosen by the LFI** (not the Hub/TPP): **intra-bank** (both accounts at the LFI; internal transfer), **AANI** (IPP — primary inter-bank rail when the receiver is reachable), **UAEFTS** (automatic fallback; no TPP/customer involvement). Reject pre-rail for reachability only when the creditor bank is unreachable on both rails (`LFI.CreditorBankNotReachable`).
- **Status enum (ISO 20022-aligned):** `Pending` (PDNG — initial, returned on `POST /payments` 201, never PATCHed back to); `AcceptedSettlementCompleted` (ACSC — rarely written alone); `AcceptedWithoutPosting` (**ACWP — terminal success for AANI**; a positive pacs.002 does not confirm credit posting); `AcceptedCreditSettlementCompleted` (**ACCC — terminal success for intra-bank and UAEFTS**; the CB900 debit confirmation implies creditor settlement through central-bank clearing); `Rejected` (RJCT); `Received` (RCVD — bulk/batch only, not yet documented in v2.1). Terminal statuses are immutable.
- **UAEFTS signals:** ACK = technical accept (stays `Pending`); NAK → `Rejected` with `FTS.<code>`; CB900 → ACCC.
- **Reject-reason namespaces:** `LFI.*` (LFI-originated), `AANI.<code>` (~40-code AANI Core Service Interface Specification; e.g. AC06 blocked, AC07 closed, AM04 insufficient funds, AM14 exceeds limit, UCRD unknown creditor), `FTS.<code>` (UAEFTS). Never transpose namespaces; prefer Open Finance prescriptive codes where defined.
- `paymentTransactionId` is set once from the rail end-to-end reference, then immutable; statuses propagate via `PATCH /payment-log/{paymentId}`.
- Fraud/sanctions/AML screening runs **after** the 201 acknowledgement (may hold/reject/refer) before rail submission — see the Response Time policy in `references/operational-policies.md`.

## Recommended Rollout Sequencing

From the hub's **Recommended Bank Rollout Plan** (guidance only — CBUAE deadlines always take precedence; each phase can go build → certify → live before the next starts):

| Phase | Scope (in order) |
|---|---|
| 1 | Consent Validate → Consent Journey (5 Heimdall/CM endpoints) → Retail Data Sharing (current & savings) → Retail Single Instant Payment → Refunds → CoP → retail CMI |
| 2 | All 6 domestic Multi-Payment types + Delegated SCA → Products & Leads |
| 3 | Extended retail Data Sharing (credit cards, finance, mortgages — schema mapping work, same endpoints) → SME Data Sharing, SME SIP, SME Refunds, SME CoP, SME CMI |
| 4 | SME Multi-Payments (all types) → SME Multi-Authorization (multi-signatory consents) |

A parallel **Recommended Insurance Rollout Plan** exists for insurance-scope LFIs: pick one primary insurance type (largest book / highest TPP demand), deliver it end-to-end through certification and launch, then extend to remaining types.

## Multi-Segment LFIs

Each API Hub instance exposes **one authorization endpoint**, so SME/corporate propositions typically require a **second API Hub instance** alongside retail. The second Hub can point at the same Ozone Connect deployment — route internally on the **`o3-provider-id`** header — and LFI-held certificates (C3, S4, Sig4, Enc1) are shared across Hubs. See the hub Knowledge Base article "Multi-Segment API Hubs".

## Operational Duties

| Duty | Requirement |
|---|---|
| Payment status | `PATCH /payment-log/{id}` for every executed OF payment (Hub payment log + CMI accuracy) |
| Performance / availability | 99.5% uptime; 500ms API response; 3s payment execution; 500ms payment status (per Standards Operational Requirements — see SKILL.md SLAs) |
| Change management | **30-day notice for breaking changes; dual running mandatory** during version transitions (zero-downtime migration) |
| Release tracking | Track [Release Notes & Erratas](https://nebras-open-finance.com/tech/release-notes-and-erratas/) — Release Notes = platform deployments (API Hub, Trust Framework); Erratas = doc corrections. Plan version-upgrade work against the API Hub release schedule |
| Incident & support | Nebras Service Desk / `support@nebrasopenfinance.ae`; incident response + on-call required before live proving (step 9 prerequisite) |
| Monitoring | Error mapping, audit logging, observability confirmed before production validation (step 7) |
| Certificate lifecycle | Rotate transport/signing certificates per the certificate-rotation guide without interrupting service |

## Related References

- `references/testing-certification.md` — certification framework detail
- `references/standards-versions.md` — version history, errata register
- `references/implementation-roadmap.md` — release calendar, version/Hub mapping
