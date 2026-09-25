# Operational Policies — Community-Hub Policy Pages

> Compiled from the community-hub policy pages, 10 June 2026.

These are the operative participant-facing policies published under `https://nebras-open-finance.com/policy/` (index categories: Participants / Nebras). They supply the enforcement detail behind the headline SLAs in SKILL.md and the liability amounts in `references/liability-framework.md`. Where a policy and the published Availability, Performance and Usage Benchmarks standard differ (e.g. average vs p95), the policy below is the operative enforcement rule.

## Table of Contents
1. [Ozone Connect Availability Policy](#1-ozone-connect-availability-policy)
2. [Ozone Connect Response Time Policy](#2-ozone-connect-response-time-policy)
3. [Ozone Connect Data Quality Policy](#3-ozone-connect-data-quality-policy)
4. [LFI Major-Version Deprecation Policy](#4-lfi-major-version-deprecation-policy)
5. [Secure Management of Keys and Credentials](#5-secure-management-of-keys-and-credentials)
6. [Changes to Published Documentation](#6-changes-to-published-documentation)
7. [Document Repository Access Model](#7-document-repository-access-model)

---

## 1. Ozone Connect Availability Policy

**URL:** `https://nebras-open-finance.com/policy/ozone-connect-availability` · Applies to: LFIs, Nebras · Updated 22 Apr 2026

### Target

- **99.5% availability per calendar month** across the LFI's Ozone Connect endpoints ≈ **max 3 h 39 m downtime/month**.
- Aligned with the Availability, Performance and Usage Benchmarks standard; the Hub is engineered for higher availability, so the LFI is the dominant factor in end-to-end availability.

### What counts as a failure

| Counts as downtime | Does NOT count |
|---|---|
| 5xx from Ozone Connect | 4xx attributable to TPP/invalid requests |
| TLS connection cannot be established | Sandbox / non-production |
| No response within the Hub's upstream timeout | Downtime caused by the API Hub, the TPP, or the internet |
| Rejection of valid Hub traffic below the LFI's agreed capacity | Upstream payment-rail downtime (e.g. Aani) demonstrably outside the LFI's control |

**Partial outages count** — one endpoint, one API family, or a subset of TPPs being down is still an outage.

### Incident severities and SLAs

| Severity | Definition | Acknowledge | Updates | Close |
|---|---|---|---|---|
| **P1** | Complete outage of an API family; OR degradation affecting ≥25% of requests; OR **any unavailability of payment execution** | **15 min** | every ≤30 min | after ~15 min stable |
| **P2** | Single endpoint/family degradation below the P1 threshold | **1 h** | every ≤2 h | after ~30 min stable |
| **P3** | Isolated issues (few TPPs / narrow requests) | next business day | — | — |

- Each LFI has a **dedicated Nebras incident channel** (not email-only).
- **Nebras cascades incident communications to TPPs — LFIs do not contact TPPs directly during incidents.**
- **Post-incident review:** every P1, and any P2 recurring within 30 days → PIR to Nebras within **5 business days** (timeline, root cause, customer/TPP impact, remediation, preventive actions with owners/dates). Nebras may share anonymised learnings.

### Planned maintenance

- Zero-downtime expected; if unavoidable: ≥**72 h notice** via the Nebras portal, window in a low-traffic period (typically **02:00–05:00 GST**), as short as possible.
- **Maintenance downtime still counts against the 99.5%** — deliberately, there is no permitted offline quota.

### Live-proving sign-off gate

Before sign-off — at initial go-live AND each subsequent major-version go-live — the LFI must demonstrably meet 99.5% over a proving period against real TPP traffic; it stays in proving until met. (The Response Time and Data Quality policies below carry the same gate pattern.)

### Missed target

Formal review with engineering/ops leadership, written remediation plan with owners/dates, enhanced (typically weekly) reporting, regulatory escalation if persistent. Proportionate: a single remediated month ≈ PIR only.

---

## 2. Ozone Connect Response Time Policy

**URL:** `https://nebras-open-finance.com/policy/ozone-connect-response-time` · Applies to: LFIs, Nebras · Updated 22 Apr 2026

### Target — correction to the generic "500ms" headline

- **500 ms at p95, per Ozone Connect endpoint**, measured as **TTLB (Time to Last Byte) from the API Hub issuing the request to the Hub receiving the final byte** — isolating LFI latency from TPP/internet factors.
- The published Benchmarks standard states 500 ms *average*; this policy holds each endpoint to **p95**. Treat the policy as the operative LFI target.
- In scope: all Ozone Connect families (data-sharing reads, `POST /payments`, `POST /payment-consents`, file/refund endpoints, `GET /payments/{id}`, CoP `POST /customers/action/cop-query`, products/leads, insurance, FX, account opening, ATM, user operations, consent events). Out of scope: Hub-operated endpoints (consent reads, authorisation, token), sandbox, Hub/TPP/internet latency, post-response screening time, payment-rail processing, customer authentication time (measured under Consent Journey requirements).

### Payments three-phase model

1. The 500 ms target applies to the **API acknowledgement only** (request received + initial payment status).
2. Fraud/sanctions/compliance **screening runs after the response**; the LFI then updates the payment status (progress to rail, or reject with reason).
3. Rail execution: domestic instant payments are subject to the **Aani scheme rule of 3 seconds end-to-end** (per the Benchmarks standard) — a separate scheme rule, **outside this policy**. The same async pattern applies to file, refund, and FX endpoints.

### Degradation severities

| Severity | Definition |
|---|---|
| **P1** | Payment-execution p95 > **1,000 ms for ≥15 min**, or any family p95 > **1,500 ms for ≥15 min** |
| **P2** | Endpoint p95 > **750 ms for ≥30 min** |
| **P3** | p95 drifting above 500 ms below the P2 threshold |

Ack/update/close SLAs mirror the Availability policy (P1 15-min ack / 30-min updates; P2 1-h ack / 2-h updates; close after ~30 min stable). Nebras cascades to TPPs. PIR for every P1 and recurring P2 within 5 business days (including capacity/data-growth/dependency factors).

### Persistence and proving

- **"Persistently missed"** ≈ the same endpoint missing p95 in 3 consecutive calendar months, OR ≥3 P1/P2 degradations in a rolling 90 days, OR failure to deliver agreed remediation → formal review / remediation plan / weekly reporting / regulatory escalation.
- **Live-proving gate:** 500 ms p95 must be demonstrably met across all in-scope endpoints before sign-off (initial + major-version go-lives).
- Guidance: track per-endpoint, not aggregate; watch **p99 as an early warning** even when p95 is green.

---

## 3. Ozone Connect Data Quality Policy

**URL:** `https://nebras-open-finance.com/policy/ozone-connect-data-quality` · Applies to: LFIs, Nebras · Updated 22 Apr 2026

- **Scope:** response payloads of all data-returning Ozone Connect endpoints (data-sharing reads, products/leads reads, insurance policy data, payment-status data fields within initiation flows). Out of scope: pure action/initiation endpoints (availability/response-time policies govern those).
- **Required fields: 100% delivery** on every response — a missing/null required field is a data-quality defect regardless of upstream cause.
- **Optional fields:** must be delivered wherever the data **"exists and can be mapped"** in the LFI's systems — LFIs are not expected to invent data but ARE expected to deliver data they hold.
- **Accuracy:** values must match the LFI's system of record — field values, units/formats (currency, precision, date-time, enums), and cross-field consistency (e.g. available balance vs booked+pending). Accuracy defects carry the same severity as missing required fields.
- **Real-time freshness:** responses must reflect current system state; caching must be bounded; **end-of-day / overnight-batch propagation is not acceptable** for any in-scope field unless explicitly recorded in the Data Mapping Commitment and agreed with Nebras. Transient divergence windows (EOD cutover) must be disclosed to Nebras and communicated via standard incident/maintenance channels.
- **Data Mapping Commitment (DMC):** at onboarding each LFI records, per endpoint+field, whether it will deliver, on what basis, and with what freshness. The DMC is the reference for Nebras monitoring; under-delivery against it = defect. Reviewed on core-system changes, new endpoints/fields, or monitoring-identified gaps.
- **Live-proving gate** (same pattern as Availability): field presence, accuracy and freshness observed against the DMC + spec before sign-off; applies to initial and major-version go-lives.
- **Monitoring:** required-field presence rate, optional-field presence vs DMC, accuracy/consistency signals, freshness/staleness patterns, and **peer benchmarking across similar LFIs** (outliers are visible). Shortfalls → engagement, DMC updates, remediation plans, regulatory escalation if persistent. Nebras periodically publishes anonymised ecosystem-wide data-quality views.

---

## 4. LFI Major-Version Deprecation Policy

**URL:** `https://nebras-open-finance.com/policy/lfi-deprecation` · Applies to: LFIs, integrators, Nebras · Updated 21 Apr 2026

This is the operational counterpart to the AED 2,500 "failure to manage deprecation" and AED 5,000 "breaking-change mismanagement" liability amounts in `references/liability-framework.md`.

### Dual running

- On a new major version the LFI must operate the prior + new versions **concurrently**, routing per-request on the version the TPP requested — **currently via the `o3-api-uri` header** — with independently maintained implementations (e.g. `/open-finance/v1.2/accounts` vs `/open-finance/v2.1/accounts`).
- Dual running does NOT apply to: first-time implementations (no prior version), minor versions, errata, UI/presentation changes, internal/downstream changes.

### Five-phase pipeline (total envelope ≥ ~17 months)

| Phase | Milestone |
|---|---|
| **Day 0** | New version live + formal ecosystem-wide communication issued **by Nebras** |
| **Month 3** | LFI reports TPP-migration status to Nebras (naming TPPs still raising new consents on the prior version) |
| **Month 5** | Second report; if no new prior-version consents, the LFI may request Nebras approval to restrict |
| **Month 5+ (restriction)** | With Nebras approval, restrict creation of NEW consents on the prior version (existing consents stay valid and honoured) |
| **+12-month sunset** | Prior version must stay operational for a further 12 months so existing consents expire naturally; decommission only after Nebras confirms **zero active consents** |

### Nebras-managed deprecation (escalation at month 6)

If TPPs have not migrated by month 6: Nebras engages directly with blockers, sets individual migration deadlines with written notice, escalates persistent non-compliance to the regulator, and may oversee/adjust the LFI timeline.

### Duties during dual running

Equivalent incident SLAs on both versions; monitoring (availability/error/latency) on both; cross-version change-impact assessment; TPP migration support including sandboxes running both versions; consent-record preservation for the full consent validity regardless of version status. Non-compliance (failure to dual-run or report) → regulatory escalation. Nebras may adjust timelines in exceptional circumstances.

---

## 5. Secure Management of Keys and Credentials

**URL:** `https://nebras-open-finance.com/policy/secure-management` · Applies to: LFIs, TPPs, integrators, Ozone (API Hub), Raidiam (Trust Framework) · Updated 21 Apr 2026

- **Scope:** full key/credential lifecycle (generation, storage, distribution, use, rotation, revocation, destruction), token handling in API/consent flows, KMS/HSM integration, roles and responsibilities.
- **Regulatory anchors:** TDRA UAE Information Assurance Regulation + CBUAE Open Finance guidelines; references NIST FIPS 140-3 CMVP and the UAE National Cybersecurity Strategy.
- **Mandatory/recommended practices:**
  - **FIPS 140-3 certified HSMs** for key generation, signing, encryption and storage.
  - Centralized modern KMS honouring UAE data-governance (data residency, access controls).
  - **Rotate transport and signing keys at least every 13 months** (or more frequently if mandated) — deliberately aligned with the Trust Framework certificate validity period (see `references/lfi-integration.md`, Certificate Matrix).
  - Defined key expiration/recovery/destruction policies; audit logs of all key usage.
  - Phishing-resistant auth: FIDO2/passkeys (customer), OAuth 2.0 + FAPI 2.0 (API), mTLS (client-server).
  - **RBAC + separation of duties** for key access.
  - **BYOK / MYOK permitted** for LFIs using cloud infrastructure.

---

## 6. Changes to Published Documentation

**URL:** `https://nebras-open-finance.com/policy/changes-to-published-content` · Applies to: Nebras · Updated 21 Apr 2026

- Applies to both documentation sets: **TPP — Open Finance Standards** and **LFI — Integration Guide**.
- **Published versions:** any post-publication change to normative/implementation-impacting content only via a formally published Errata; every change **traceable to a specific Errata identifier**; the affected page/section **must visibly display** that it was modified by an Errata (the superseded original text is retained and marked).
- **Unpublished versions** (e.g. `v3.1-rc`, `v3.1-rc-final`): content may change freely without errata (normal review/approval controls still apply); once published, the errata process applies.
- Read alongside the Version Management Policy (`/policy/version-management`) — cadence and release-state rules are tracked in `references/standards-versions.md`.

---

## 7. Document Repository Access Model

**URLs:** `https://nebras-open-finance.com/doc-repository/` · `https://nebras-open-finance.com/doc-repository/how-to-access` (updated 4 Jun 2026) · API: `https://docs.nebras-open-finance.com`

- **Who appears:** public documentation published by each **production** LFI and TPP — sandbox-only participants do not get repository pages. Cards show org name, legal name, type (LFI / TPP / Authority) and go-live date ("Live since …"); an LFI org with a `tppGoLiveDate` is tagged as both LFI and TPP.
- **Browsing** the directory is open (search/filter without sign-in). Opening an organisation's documents page requires **sign-in via the production Trust Framework directory using OpenID Connect** — no separate repository login; session ≈ 1 hour.
- **Two document groups:** **Public** (visible to any signed-in participant — e.g. trade licences, Central Bank licences) and **Private** (visible only to authorised users of that organisation; the tab is hidden otherwise).
- **Private-access roles:** the organisation's **Organisation Administrators** and holders of an **Active Principal Business Contact (PBC)** contact role — assessed per organisation (a role in org A grants nothing in org B). Nebras operators can view every organisation's documents.
- **Scriptable API** at `docs.nebras-open-finance.com`:
  - `GET /` — JSON list of all production organisations (id, name, legalName, type, isProduction, lfiGoLiveDate, tppGoLiveDate, doc links) — **open, no sign-in**.
  - `GET /{id}/public` — list + serve an organisation's public documents — open.
  - `GET /{id}/private` — gated (signed-in + authorised, else auth/permission error). Appending a file name to the path returns the file.
- **Filing duties:** authorised users upload documents against configured document types (file-size cap surfaced in the UI); some document types are **filed monthly** — one file per month, where an upload replaces the existing month's file. Evidence of an operational compliance-document filing duty for production participants; the specific document-type list is configured server-side.

---

## Related References

- `references/lfi-integration.md` — certificate matrix, Admin Portal (planned-outage registration, LFI Performance report), payment rails
- `references/liability-framework.md` — the liability amounts these policies operationalise
- `references/standards-versions.md` — version-management cadence, errata register
- `references/testing-certification.md` — certification steps the live-proving gates attach to
