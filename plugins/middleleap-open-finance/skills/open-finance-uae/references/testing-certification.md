# Testing & Certification Framework

> Regenerated from public sources 9 Jun 2026 (original file lost) — provenance & full verification history: `verification-log.md`. Cross-check time-sensitive figures against the community hub / OF Confluence before relying on them.

Sources: SKILL.md certification paths; community hub LFI Integration Guide "Testing & Certification" section (verified against `community-standards` repo source, 9 Jun 2026); `Nebras-Open-Finance/postman` repo. **Note:** the hub's detailed certification pages are published as "coming soon" stubs as of 9 Jun 2026 — the page structure below is verified, the detailed evidence requirements per page are still being finalised by the program.

## Table of Contents
1. [Overview](#overview)
2. [LFI Certification Path](#lfi-certification-path)
3. [TPP Certification Path](#tpp-certification-path)
4. [Test Tooling](#test-tooling)
5. [FAPI Certification Mechanics](#fapi-certification-mechanics)
6. [Certification Environments](#certification-environments)
7. [Re-certification Triggers](#re-certification-triggers)
8. [Platform Assurance: ISO 27001 and SOC 2 Context](#platform-assurance-iso-27001-and-soc-2-context)

---

## Overview

Certification sits at **Phase B** of the integration journey (after pre-production build, before production launch) plus a **production live-proving** stage after go-live setup. The community hub structures the LFI certification section as:

| Group | Pages (hub, `/tech/lfi-api-hub/production/testing-certification/`) | Status (9 Jun 2026) |
|---|---|---|
| Required Certifications | Overview · Functional Evidence — Bank Data Sharing · User Experience Evidence · Performance Testing · Security Validation | Stubs ("coming soon") |
| Production Live Proving | Attestation & Self Testing · TPP Buddying | Stubs ("coming soon") |

The five-step paths below (from SKILL.md, sourced from the official Testing & Certification material) remain the authoritative summary.

## LFI Certification Path

| # | Step | Pass criteria | Detail |
|---|---|---|---|
| 1 | **Functional Testing** | **100% pass** on the Ozone Connect Test Suite + Postman collection | Exercises the LFI's Ozone Connect endpoints (consent events, data sharing, payments, refunds, CoP) against the published OpenAPI schemas. Hub page: "Functional Evidence — Bank Data Sharing" (insurance equivalent expected — verify against source) |
| 2 | **CX Certification** | Nebras validates consent/authentication screens | Screens must follow the Standards UX principles and AlTareq brand requirements (consent setup, authentication, authorization, CMI). Hub page: "User Experience Evidence". Screens are certified **per standards version** |
| 3 | **Penetration Testing** | **No critical or high issues** | Against the LFI's internet-facing Open Finance surfaces. Hub page: "Security Validation" |
| 4 | **Stress Testing** | NFRs compliant with the Standards | Demonstrate the Operational Requirements SLAs (99.5% uptime, 500ms API response, 3s payment execution, 500ms payment status). Hub page: "Performance Testing" |
| 5 | **Live Proving** | **At least 2 TPPs** test all endpoints | Production stage: (a) **Attestation & Self Testing** — LFI runs full journeys in production with controlled bank-staff accounts and attests results; (b) **TPP Buddying** — structured sessions with partner TPPs using real end users; defects resolved or formally accepted before opening to general TPP traffic |

Sequencing note: certification can be done **per capability** — e.g. certify Data Sharing and take it live while Service Initiation is still in build. Each capability passes through steps 1–5 before serving live traffic.

## TPP Certification Path

| # | Step | Pass criteria | Detail |
|---|---|---|---|
| 1 | **FAPI Certification** | OIDF Relying Party certification for the **UAE FAPI 2.0 profile** | See [FAPI Certification Mechanics](#fapi-certification-mechanics) below |
| 2 | **Functional Certification** | Nebras validates API call success | TPP demonstrates correct consent setup (PAR, RAR), token handling, and API consumption against the Hub |
| 3 | **CX Certification** | Nebras validates consent screens | TPP-side consent capture screens per Standards UX principles and AlTareq brand requirements (e.g. "Pay by bank using AlTareq" elements) |
| 4 | **Penetration Testing** | No critical or high issues | Against the TPP's Open Finance application surfaces |
| 5 | **Live Proving** | **At least 1 LFI** — test all endpoints | Production validation with a live LFI before general availability |

## Test Tooling

### Ozone Connect Test Suite

LFI-side conformance suite covering the Ozone Connect endpoints; bundled with the API Hub v8 documentation (alongside the Banking Testing Tool, Insurance Testing Tool, Ozone Connect Test Cases, and sample configuration files). 100% pass required for LFI functional certification.

### Postman Collections — [`Nebras-Open-Finance/postman`](https://github.com/Nebras-Open-Finance/postman)

| Item | Content |
|---|---|
| `banking.postman_collection.json` | Banking: consent/auth flows, data sharing, service initiation, refunds |
| `insurance.postman_collection.json` | Insurance: data sharing, quotation |
| `supporting/certs.example/` | Certificate configuration example (`config.example.js`) |
| `supporting/tests/banking/` | Automated checks: auth-redirect-params, cc-grant-only, data-sharing (incl. pre-auth), payment-consent-refund, service-initiation-domestic |
| `supporting/tests/insurance/` | data-sharing, quotation |

Last substantive change to `main`: **22 May 2026** (scope/PAR auth-alignment fix). Pull latest before any certification run.

## TPP Certification Operations (verified from TPP Standards production pages, 10 Jun 2026)

Two independent gates run in parallel: the **CBUAE licence** and **Nebras certification** — both required before go-live.

| Area | Service Desk ticket type ("Providing certification evidence") |
|---|---|
| Functional Evidence | `TPP Functional Certification Evidence` |
| UX Evidence | `TPP CX Certification Evidence` |
| FAPI Conformance | `TPP FAPI Certification Evidence` |
| Security Validation | `Penetration Test Results` |

- **Functional Evidence template** (Bank Data Sharing live; SI/CoP/Insurance templates pending): proposition overview incl. `OpenFinanceBilling.Purpose`, exact `authorization_details`, justification of **every permission against the endpoint that needs it**, Model Bank 200-OK evidence per endpoint, consent-state handling matrix, minimum-permissions declaration.
- **OIDF test-plan config (FAPI)**: Test Plan `FAPI2-Message-Signing-ID1: Relying Party (client) test`; Sender Constraining `mtls`; Client Auth `private_key_jwt`; Authorization Request `rar`; Request Method `signed_non_repudiation`; FAPI Client Type `oidc`; FAPI Profile `cbuae`; Response Mode `plain_response`. **All test data including private keys becomes public — use dedicated test certificates.** Renewal per major Standards version.
- **Pen test rules**: independent third party, full OF surface, production-like state (staging acceptable); critical/high findings remediated + evidenced pre-go-live; medium/low need a documented remediation plan. Scope includes OAuth/PKCE/token handling, mTLS key protection, consent data access control, injection, storage/transmission, rate limiting/abuse, supply chain.
- **Optional certification — "Access Encrypted Resource Data"**: mandatory before requesting `ReadProductFinanceRates` (banking) or `ReadInsurancePremium` (insurance); the Hub rejects consents carrying these permissions from uncertified TPPs.
- **Live proving**: buddying with a small set of buddy LFIs, **test users only** (no real customers pre-go-live), expected **2 weeks–1 month**, phase is **non-commercial** (no Hub fees, LFI/TPP fees or commissions until go-live approval). Nebras go-live sign-off opens all LFIs + customers + the commercial model; **each newly onboarded LFI after go-live needs its own validation period**.
- **Ongoing conformance**: certified state must be maintained continuously; Nebras may request fresh evidence anytime; material platform/standards/FAPI changes trigger re-certification.

## FAPI Certification Mechanics

| Question | Answer |
|---|---|
| Who certifies? | The **OpenID Foundation (OIDF)** — Relying Party (RP) certification against the UAE FAPI 2.0 profile |
| Who needs it? | **TPPs** (each TPP client). **LFIs do NOT need individual FAPI certification** — the API Hub acts as the centralized authorization server and **holds the platform-level certification**; LFIs sit behind Headless Heimdall and never implement raw FAPI |
| Who pays? | **TPPs pay OIDF directly** (reduced fee for OIDF members) |
| When? | Step 1 of the TPP path, before functional certification |

This is a direct consequence of the centralized-hub architecture: one FAPI implementation (the Hub) serves the whole ecosystem, so protocol certification concentrates at the platform.

## Certification Environments

| Stage | Environment | Notes |
|---|---|---|
| Functional / CX / pen / stress (steps 1–4) | Sandbox Trust Framework + **Pre-production API Hub** | Same certificate and client setup pattern as production (C3-hh-cm-client, mTLS, JWT auth) |
| Production validation | Production Trust Framework + Production Hub, **controlled bank-staff accounts only** | Attestation & self-testing; no real customer traffic |
| Live proving (step 5) | Production, real customers | LFI: ≥2 buddying TPPs; TPP: ≥1 LFI |

Sandbox and production Trust Frameworks are **separate instances** — certificates, applications, and directory entries are not reused, so certification artefacts must be re-established when moving to production.

## Re-certification Triggers

| Trigger | What re-certifies |
|---|---|
| New major Standards version uplift (e.g. v2.0 → v2.1) | Both LFIs and TPPs renew certification; CX screens are certified per version |
| Breaking changes (per Release Notes) | Affected capability re-tested; 30-day notice + mandatory dual running applies during the transition (see change management) |
| New capability launched (staged rollout) | That capability passes steps 1–5 before live traffic — certification is incremental, not one-off |
| Errata | The published trigger rule (verified 10 Jun 2026 — Testing and Certification Framework, OF Confluence, page updated 12 May 2026) is **"Any FAPI, Functional or CX changes to be re-certified"** — i.e. re-certification is change-triggered, not errata-triggered. Documentation-only errata (e.g. v2.1-errata2) therefore do not force re-certification, but errata that change FAPI/functional/CX behaviour do; re-verify schema-affecting corrections against the updated Postman/specs |

## Platform Assurance: ISO 27001 and SOC 2 Context

| Item | Detail |
|---|---|
| Ozone ISO/IEC 27001:2022 certificate | Published on the OF Confluence (Open Finance Platform Assurance section), **June 2026**. Platform-vendor evidence covering the API Hub technology supplier |
| Open Finance Platform Assurance docs | Published alongside the certificate (OF Confluence, Jun 2026) |
| SOC 2 for TPPs | TPP licensing normally expects SOC 2-style assurance. **Banks operating as deemed-license TPPs can request a SOC 2 exemption via CISO attestation** (precedent exists at a major UAE bank; verify with Nebras/CBUAE). The published platform assurance pack + Ozone ISO 27001 certificate strengthen this attestation narrative with platform-level evidence |

Practical posture: a bank deemed-license TPP cites (1) its own ISMS/CISO attestation, (2) the platform's ISO/IEC 27001:2022 certification, and (3) the centralized FAPI/security model (Hub holds protocol certification) when requesting exemption.

## Related References

- `references/lfi-integration.md` — where certification sits in the 9-step journey
- `references/standards-versions.md` — version/errata register driving re-certification
- `references/implementation-roadmap.md` — release calendar and compliance deadlines
