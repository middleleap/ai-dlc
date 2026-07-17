---
name: open-finance-uae
description: Expert guidance on UAE Open Finance regulatory requirements, Al Tareq platform integration, CBUAE compliance, and Standards versions/errata (current v2.1-final + errata3). Use when working on UAE Open Finance projects including TPP licensing, LFI obligations, API specs (Bank Data Sharing, Bank Service Initiation, Insurance), consent management, security (FAPI 2.0, mTLS, SCA, partial encryption, certificate rotation), liability frameworks, Nebras platform operations, CAAP authentication, and AlTareq brand/CX (consent screen design, payment buttons, progress bar, CX certification). Triggers on queries about CBUAE regulations, Al Tareq, Nebras, Open Finance UAE, TPP/LFI requirements, deemed licenses, standards versions, errata, payment initiation, data sharing, multi-payments, bulk payments, dynamic account opening, Ozone Connect, API Hub resource server, PSU consent lifecycle, Postman collections, OpenAPI spec fetching/errata resolution, "Pay by bank using AlTareq", and UAE financial services API compliance.
---

# UAE Open Finance Expert

Expert knowledge base for UAE's Open Finance ecosystem covering CBUAE regulations, Standards versions (v2.1-final production, errata3 current), Al Tareq platform requirements, implementation guidance, testing/certification, commercial model, roadmap, and CAAP authentication.

> **Last verified against sources: 13 July 2026 (version/errata pass; full audit 10 June 2026).** Full audit trail, provenance, and resolved items: `references/verification-log.md`. Re-verify standards/errata level, pricing, and metrics before relying on time-sensitive figures — start with `python3 scripts/check_current.py`.

## Quick Reference

| Aspect | Detail |
|--------|--------|
| Regulation | CBUAE Circular C 03/2025 (10 July 2025) |
| Current Standards | **v2.1-final** (base 7 Jan 2026) + **errata3** (register-published by 13 Jul 2026; scope: intl-payments creditor, 2 specs) |
| Post-Publication Register | Release Notes (platform deployments) + Errata (doc corrections); current errata = **v2.1-errata3** (auth-endpoints + bank-initiation only; other specs resolve to errata2/errata1/base) |
| API Hub Version | **v8** (current; v7 = v2.0, v6 = v1.2 legacy) |
| Platform | Al Tareq (consumer brand) / Nebras (operator) |
| Auth Method | CAAP (Centralized Auth) via AlTareq app + EFR + UAE Pass |
| API Hub | Ozone-powered, centralized infrastructure (ISO/IEC 27001:2022 certified) |
| Mandatory | All licensed banks, insurance companies, insurance brokers |
| TPP Capital | AED 1,000,000 minimum |
| API Hub Capital | AED 20,000,000 minimum |
| SLAs | 99.5% uptime · 500ms API response · 3s payment execution · 5s FX quote · 500ms payment status (canonical table: `references/technical-specs.md` — update there first) |
| Support | support@nebrasopenfinance.ae / Service Desk Portal |

## Architecture Invariants (never violate these)

The UAE model is **centralised** — do not import UK/EU Open Banking assumptions. Guiding split: **API Hub = control plane; LFI = execution layer.**

1. **Strict mediation** — TPPs NEVER call LFIs directly. All traffic flows `TPP → API Hub → LFI → API Hub → TPP`.
2. **Centralised consent** — consents are created, stored, and managed ONLY in the API Hub (single source of truth). LFIs MUST NOT maintain independent consent state.
3. **Token issuance** — ONLY the API Hub issues access tokens. LFIs never issue tokens.
4. **AuthN vs AuthZ** — the PSU authenticates **at the LFI**; the **API Hub** is the authorization server. Never conflate the two.
5. **Trust model** — LFIs trust the API Hub for token/consent validation; no independent re-validation.
6. **OpenAPI is the source of truth** — never invent fields, endpoints, or enums. Fetch the spec (see `references/repositories.md`); resolve errata (highest errata wins per file) before quoting a `standards/` field.

**Actors:** PSU (end customer) · TPP (consumes APIs via Hub only) · LFI (bank/insurer/exchange house/e-wallet/finance house; implements **Ozone Connect**) · API Hub (Nebras-operated, Ozone-powered: authorization server + TPP-facing resource server + gateway + consent store) · Nebras (operator) / AlTareq (brand) / CBUAE (regulator).

**Terminology rule:** "resource server" = the Hub's TPP-facing `rs1.{lfiCode}.{env}.apihub.openfinance.ae` surface ONLY. The LFI's own backend is **"Ozone Connect"** — never call it a resource server.

**Consent lifecycle:** TPP creates consent via PAR → stored in Hub → PSU authenticates at LFI → consent authorised → TPP calls APIs with token → Hub validates consent per request → revocation (via TPP or LFI) synchronises to the Hub immediately.

**Common pitfalls to correct:** "TPP calls the bank directly" (no — Hub-mediated); "the bank issues the token / stores the consent" (no — Hub does both); "customer logs in at the TPP/Hub" (no — at the LFI); "the LFI's resource server" (say Ozone Connect); treating UAE like UK Open Banking (centralised model — correct the assumption).

## Implementation Roadmap (2025–2026+)

| Release | Date | Key Features |
|---------|------|--------------|
| Retail R1 | Sep 2025 | Consent, SIP, CoP, Balance, Customer |
| Retail R2 | Oct 2025 | Transactions, VRP, FRP, Refunds, Delegated SCA |
| Retail R3 + SME R3 | Dec 2025 | International Payments, SME Suite |
| SME R4 | Mar 2026 | Bulk/Batch Payments, Multi-Payments, International |
| Retail R4+ | Apr 2026 | Extended Data (Cards/Loans/Mortgages), Dynamic Account Opening, Insurance Quotes (7 types), v2.1-final uplift |
| Insurance Suite | Q2 2026 | Insurance API Hub integration (Insurance Data Sharing live on community standards May 2026) |
| FX & Remittance | Q2 2026 | FX Quotes, Remittance Payments |
| Pay Request | Q3 2026 | Merchant-initiated payment requests |
| Corporate R5 | Sep 2026 | Full Corporate Suite |

**Live-traffic reality (metrics dashboard, data through 31 May 2026):** the bulk of production API traffic is still served on **v1.2 and v2.0**; **v2.1 adoption is nascent** (~2-3% of successful volume). "Superseded" versions remain in heavy live use — do not assume v2.1 is what an LFI is actually serving without checking. Detailed API Hub release calendar: `references/implementation-roadmap.md`.

## Standards Versions

| Version | Date | Status | API Hub |
|---------|------|--------|---------|
| v1.2-final | Dec 2024 | Superseded (still in heavy live use) | v6 |
| v2.0-final | Apr 2025 | Superseded (still in heavy live use) | v7 |
| **v2.1-final** | **Jan 7 2026** | **✓ CURRENT PRODUCTION** | **v8** |
| v2.1-errata2 | 7 May 2026 | Superseded per-file by errata3 (17 corrections) | v8 |
| **v2.1-errata3** | **by 13 Jul 2026** | **✓ CURRENT ERRATA** (2 corrections: intl-payments creditor, SWIFT SR2026; auth-endpoints + bank-initiation only) | v8 |

**Errata model:** once published, a version's content MUST NOT change without an Errata record. **Release Notes** capture platform deployments that change participant-facing behaviour; **Errata** capture documentation corrections. Use v2.1-final + errata3 for all new builds — but confirm the counterparty's live version first (see live-traffic note above). Full version comparison, errata detail, and migration guidance: `references/standards-versions.md`.

## API Categories

| Category | Purpose | Key APIs |
|----------|---------|----------|
| Bank Data Sharing | Account/transaction data | /accounts, /transactions, /cop-query |
| Bank Service Initiation | Domestic, international, multi-payments, bulk/batch | /domestic-payments, /international-payments, /multi-payments, /bulk-payments |
| Dynamic Account Opening | Account creation with KYC | /accounts/open, /kyc-verification |
| Insurance Data Sharing | Policy/claims | /policies, /claims |
| Insurance Quotes | 7 types: Motor, Health, Home, Renters, Travel, Life, Employment | /insurance-quotes |
| FX & Remittance | Quote and execution | /fx-quotes, /remittance-payments |
| Pay Request | Merchant-initiated payments | /pay-requests |
| Product/Metadata | Discovery | /products, /leads, /atm |
| Trust Framework directory | Participant/org/auth-server discovery (Raidiam, unversioned) | /participants, /organisations, /references/apifamilies |
| CAAP Operations (Ozone Connect) | LFI-side CAAP adoption: user reg/challenge, PII decrypt, consent validate/augment | /users/actions/*, /consent/actions/* (spec = ozone-connect user-operations, renamed caap-operations on the site's spec branch; fully documented in the v2.1 LFI guide) |

Complete API reference: `references/api-specifications.md`.

## Certification (summary)

- **LFI path:** functional testing (Ozone Connect Test Suite + Postman, 100% pass) → CX certification (Nebras validates consent/auth screens against the AlTareq brand/CX rules — see `references/altareq-brand.md`) → pen test (no critical/high) → stress test (NFR-compliant) → live proving (≥2 TPPs test all endpoints).
- **TPP path:** OIDF FAPI 2.0 RP certification (TPP pays OIDF directly, reduced for members; LFIs don't certify individually — the API Hub holds platform certification) → functional certification → CX certification → pen test → live proving (≥1 LFI).
- **Re-certification trigger:** "Any FAPI, Functional or CX changes to be re-certified" (change-triggered, not errata-triggered).

Complete framework: `references/testing-certification.md`.

## Commercial Model Quick Reference

> Pricing model doc is **Version 1.0 (4 Oct 2024)** — re-confirmed at version level 8 Jun 2026. If a Version 2.0 is ever published, treat these numbers as stale. Complete model: `references/pricing-model.md`.

**API Hub fees (Nebras):** Payment Initiation 2.5 fils · Balance/CoP (with payment) 0.5 fils · Data Sharing 2.5 fils per 100 lines · Quotes 5–12.5 fils (tiered).

**Payment fees (TPP→LFI):** Merchant Collections 38 bps (Year 1) → 25 bps (Year 5) · P2P/SME 25 fils flat · Corporate 250 fils flat.

## Key Liability Amounts (AED)

| Issue | Compensation |
|-------|--------------|
| Consent state failure | 500 |
| Consent revocation failure | 350 |
| SCA/Auth errors | 500 |
| Data breach | 750 |
| Execute within SLA failure | 200–350 (tiered 350/250/200 by delay) |
| Consumer protection violation | 1,000 |
| Breaking change mismanagement | 5,000 |
| **Nebras max liability** | **5,000,000 per claim** |

Verified 10 Jun 2026 against the OF Confluence "Limitation of Liability Model" (doc v2.1). Complete model: `references/liability-framework.md`.

## Key Implementation Notes

- **Payment rails:** domestic execution mode is LFI-selected (TPP has no choice): **intra-bank** for same-LFI, **AANI (IPP) primary inter-bank rail with automatic UAEFTS fallback**. Status terminals differ per rail (ACWP on AANI, ACCC on UAEFTS/intra-bank). International uses all available LFI rails. Detail: `references/payments-and-consent-rules.md`.
- **Domestic purpose codes:** use the **Aani Core (Category Purpose) codes per Aani Core Interface Specifications (Sep 2025)** — updated by v2.1-errata2. Always confirm against the current Aani specification.
- **Multi-payments:** 6 types — VariableOnDemand, FixedOnDemand (on-demand); VariablePeriodicSchedule, FixedPeriodicSchedule (periodic); VariableDefinedSchedule, FixedDefinedSchedule (defined). Beneficiary models: single (1, all types) / multiple (2–10) / open (array omitted) — multiple + open only for VariableOnDemand and Delegated SCA. Max 10 creditors per payment (A10.1).
- **Bulk/batch payments:** supported for merchant and corporate collections.
- **Consent types:** Single Use (one-time), Long-lived (recurring, max 1 year), Combined Consents (5 scenarios, max 2 RAR objects per PAR), with optional Balance Check permission. States: AwaitingAuthorization, Authorized, Rejected, Suspended, Consumed, Expired, Revoked.
- **Multi-user authorization:** per errata2, the consent-management interface must allow remaining approvers to retrieve and act on an "Awaiting Authorization" consent.
- **CoP (Confirmation of Payee):** mandatory before all payments. `fullName` mandatory for personal accounts.
- **CAAP authentication:** centralized auth via AlTareq mobile app with EFR and UAE Pass, across all LFIs.
- **Fraud prevention:** CoP mandatory · 10 high-risk countries excluded · **Risk Information Block** mandatory (Customer Present flag, Creditor Contract flag, Channel, merchant details). AML: suspicious activity reported via CBUAE AML GO portal. Detail: `references/aml-fraud-guidelines.md`.
- **International payments:** AED 15,000 limit to a **new beneficiary for 48 hours after beneficiary creation** — per customer, per TPP, per bank, sum of payments (TPP-imposed; verified in the Limitation of Liability Model).
- **Timing rules:** 10-minute payment initiation window (A15–A17) · 500ms payment status SLA (A20) · 5-second FX quote SLA.
- **Dynamic Account Opening:** supported; integrates with the 7 insurance quote types.
- **SOC 2 exemption:** banks as deemed-license TPPs can request exemption via CISO attestation (precedent at a major UAE bank; verify with Nebras/CBUAE — still unconfirmed in public sources). Platform-side assurance: Open Finance Platform Assurance docs + Ozone ISO/IEC 27001:2022 certificate (OF Confluence, Jun 2026). See `references/testing-certification.md` (Platform Assurance).
- **Certificate rotation & encryption:** transport/signing key rotation guide and JWE partial/finance-rate encryption covered in `references/technical-specs.md`.
- **Change management:** 30-day notice for breaking changes; dual running mandatory during transitions.

## Reference Routing — read these first

| If the task is... | Read (in order) |
|---|---|
| Building / advising a **TPP** | `api-specifications.md` → `technical-specs.md` → `pricing-model.md` |
| Integrating as an **LFI** (Ozone Connect) | `lfi-integration.md` → `testing-certification.md` → `technical-specs.md` |
| **Certification / go-live** planning | `testing-certification.md` → `lfi-integration.md` (9-step journey) |
| **Business case / commercials** | `pricing-model.md` → `liability-framework.md` → `cbuae-regulations.md` |
| **Regulatory / licensing** question | `cbuae-regulations.md` → `liability-framework.md` |
| **Compliance dates / what's live** | `implementation-roadmap.md` → `standards-versions.md` |
| **Fraud / AML** controls | `aml-fraud-guidelines.md` → `api-specifications.md` (Risk block context) |
| **SLA / data-quality / deprecation policy** | `operational-policies.md` → `liability-framework.md` |
| **Payment/consent business rules, multi-payments, insurance quotes** | `payments-and-consent-rules.md` → `api-specifications.md` |
| **UI / consent screens / AlTareq branding / CX certification** | `altareq-brand.md` → `altareq-cx-requirements.md` → `altareq-journey-screens.md` |
| Exact **field / endpoint / enum** detail | Run `scripts/fetch_spec.py <name>` (errata-resolved live spec); `repositories.md` for the repo map |
| **Version / errata** question | `standards-versions.md` → `implementation-roadmap.md` |
| **Provenance / was this verified?** | `verification-log.md` |

**Fetching live specs:** `python3 scripts/fetch_spec.py --list` shows every v2.1 spec with its effective errata level; `python3 scripts/fetch_spec.py <substring>` fetches the errata-resolved YAML (never quote a base-version field that an errata superseded).

## Still-Open Verification Items

Flag these "(verify against source)" when they matter to an answer. Full history and resolved items: `references/verification-log.md`.

| Item | Status |
|------|--------|
| 16 Sep 2026 TPP regularisation deadline | Not found in any public source; needs authenticated/CBUAE confirmation |
| The 10 excluded high-risk countries (list) | Not published publicly; likely in Standards/Operational Guidelines or CBUAE Notice 3057/2025 |
| Rule IDs (A12.1, A15–A17) and the 10-minute initiation window | Not in public specs or Confluence |
| SOC 2 exemption via CISO attestation | No public text; only vendor-level platform assurance is published |
| Per-TPP rate-limit quotas; resource-API HTTP caching regime | Beyond directory `max-age=900` and quote-polling ≤1/min, unpublished |
| Insurance functional-evidence page; certification evidence detail | Hub pages remain stubs |
| Deemed-licence insurance/PII cover equivalence; OF outsourcing guidance | No public text found |

## Keeping This Skill Current

Volatile facts have one canonical home each — update there first, then sync the Quick Reference here:

| Volatile fact | Canonical location |
|---|---|
| Current standards version / errata level | Quick Reference (here) + `standards-versions.md` |
| NFR / SLA numbers | `technical-specs.md` |
| Pricing / fees | `pricing-model.md` |
| Liability amounts | `liability-framework.md` |
| Roadmap dates / what's live | `implementation-roadmap.md` |

**Staleness check:** `python3 scripts/check_current.py` compares this skill's stated current version/errata against the live `api-specs` repo. When an errata bumps (e.g. errata3), grep the whole skill for the old errata string — it appears in several files — and re-run a verification pass. Log outcomes in `references/verification-log.md`.

## Key Resources

- **Community hub (primary, live):** [nebras-open-finance.com](https://nebras-open-finance.com) — rendered from the `community-standards` repo; the fastest place to find current material. Key sections: [TPP Standards](https://nebras-open-finance.com/tech/tpp-standards) · [LFI Integration Guide](https://nebras-open-finance.com/tech/lfi-api-hub) · [API Specs](https://nebras-open-finance.com/tech/api-specs/) · [Release Notes & Erratas](https://nebras-open-finance.com/tech/release-notes-and-erratas/) (authoritative post-publication register) · [Knowledge Base](https://nebras-open-finance.com/knowledge-base) · [Service Desk](https://nebras-open-finance.com/support-service-desk/). The [Metrics dashboard](https://nebras-open-finance.com/metrics) UI is JS-rendered, but the underlying data is static JSON at `nebras-open-finance.com/api/*.json` (api-log, payments-log, auth-log, trust-framework, github-stats).
- **GitHub:** [Nebras-Open-Finance org](https://github.com/Nebras-Open-Finance) — `community-standards` (docs site, errata, metrics data), `api-specs` (canonical OpenAPI), `postman` (banking + insurance collections). Check `community-standards/commits` for recent changes.
- **Confluence (official):** [OF Space](https://openfinanceuae.atlassian.net/wiki/spaces/OF/overview) — Roadmap, Approved Use Cases, Catalogue of Standards (incl. v2.1-final-errata2), Testing & Certification, Platform Assurance (ISO 27001 evidence), Limitation of Liability, Commercial and Pricing Model, AML & Fraud Guidelines. Anonymously readable via the REST API (see `verification-log.md`).

## Key Contacts

CTO, Nebras — key technical contact for Nebras / Al Tareq platform (also authors the community hub). _(Per deliverable convention, refer to contacts by role rather than personal name in any output.)_
