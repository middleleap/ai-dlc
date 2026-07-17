# Implementation Roadmap & Release Calendar

> Regenerated from public sources 9 Jun 2026 (original file lost) — provenance & full verification history: `verification-log.md`. Cross-check time-sensitive figures against the community hub / OF Confluence before relying on them.

Sources: SKILL.md roadmap table; community hub [Release Notes & Erratas](https://nebras-open-finance.com/tech/release-notes-and-erratas/) and the API Hub + Trust Framework release registries (verified against `community-standards` repo source, 10 Jun 2026); ecosystem metrics dashboard (log data through 7 Jun 2026).

## Table of Contents
1. [Release Calendar (2025–2026+)](#release-calendar-2025-2026)
2. [Deadlines vs Delivery](#deadlines-vs-delivery)
3. [Standards ↔ API Hub Version Mapping](#standards--api-hub-version-mapping)
4. [Adoption Reality: Live Traffic Mix](#adoption-reality-live-traffic-mix)
5. [API Hub Platform Release Notes (2026)](#api-hub-platform-release-notes-2026)
6. [What's Live](#whats-live)
7. [Staged Delivery Model](#staged-delivery-model)
8. [Stated Community Roadmap Themes](#stated-community-roadmap-themes)

---

## Release Calendar (2025–2026+)

| Release | Date | Key Features |
|---------|------|--------------|
| Retail R1 | Sep 2025 | Consent, Single Instant Payments (SIP), Confirmation of Payee, Balance, Customer data |
| Retail R2 | Oct 2025 | Transactions, VRP, FRP, Refunds, Delegated SCA |
| Retail R3 + SME R3 | Dec 2025 | International Payments, SME Suite |
| SME R4 | Mar 2026 | Bulk/Batch Payments, Multi-Payments, International |
| Retail R4+ | Apr 2026 | Extended Data (Cards/Loans/Mortgages), Dynamic Account Opening, Insurance Quotes (7 types), v2.1-final uplift |
| Insurance Suite | Q2 2026 | Insurance API Hub integration (Insurance Data Sharing expanded on community standards May 2026) |
| FX & Remittance | Q2 2026 | FX Quotes (5-second SLA), Remittance Payments |
| Pay Request | Q3 2026 | Merchant-initiated payment requests |
| Corporate R5 | Sep 2026 | Full Corporate Suite |

All releases are now aligned with **Standards v2.1-final** (7 Jan 2026; current errata: errata3, register-published by 13 Jul 2026) and **API Hub v8**.

Other dated milestones:

| Milestone | Date |
|---|---|
| TPP regularisation deadline (CBUAE) | **16 Sep 2026** — unchanged as of the 8 Jun 2026 source check |
| Ozone ISO/IEC 27001:2022 certificate + Platform Assurance docs published | Jun 2026 |
| v2.1-errata2 published | 7 May 2026 (individual errata sections record effective dates from 28 Apr 2026; some "to be confirmed on merge") |
| v2.1-errata3 published | Register-published by 13 Jul 2026 — 2 corrections, intl-payments creditor restructure (SWIFT SR2026); auth-endpoints + bank-initiation specs only |

## Deadlines vs Delivery

**CBUAE release dates are compliance deadlines, not delivery dates.** The Central Bank sets regulatory requirements and deadlines; the rollout plans on the community hub explicitly state those MUST take precedence over any recommended sequencing, and that it is the LFI's responsibility to assess how to meet its obligations. In practice:

- LFIs stage delivery capability-by-capability and may go live with one capability while another is still in build — the constraint is that **all in-scope capabilities MUST be live by the regulatory compliance deadline**.
- A release appearing in the calendar above does not mean every mandated LFI is live on it (see traffic mix below).
- When checking any institution's plan, distinguish: (a) CBUAE deadline, (b) the institution's committed delivery date, (c) what its production traffic shows it actually serves.

## Standards ↔ API Hub Version Mapping

| Standards Version | API Hub Docs | Publication | Status |
|---|---|---|---|
| v1.0 | v1, v2 | Jun–Jul 2024 | Deprecated |
| v1.1 | v3 | Aug 2024 | Deprecated |
| v1.2 | v4, v5, **v6** | Sep 2024 – Jan 2025 | Superseded — **still in heavy live use** |
| v2.0 | **v7** | 2025 | Superseded — **still in heavy live use** |
| v2.1-final (+ errata2) | **v8 (current)** | Jan 2026 | **Current production standard** |

Shorthand used across the ecosystem: **v6 = v1.2, v7 = v2.0, v8 = v2.1-final**. The community hub's machine-readable version registry currently lists **v2.1 only** as the documented Ozone Connect/TPP Standards version, with a dual-run compatibility map ready for future versions (a v3.0 would dual-run alongside v2.1).

Change management on version transitions: **30-day notice for breaking changes; dual running mandatory** (old + new versions served in parallel for zero-downtime migration).

## Adoption Reality: Live Traffic Mix

Per the ecosystem metrics dashboard (log data now runs through **7 Jun 2026** as of the 10 Jun 2026 audit; the mix below is the **31 May 2026 full-months basis** and will shift only slowly), production API traffic by standards version:

| Version | Approx. successful volume | Share |
|---|---|---|
| v1.2 (Hub v6) | ~140K | Dominant |
| v2.0 (Hub v7) | ~65K | Substantial |
| v2.1 (Hub v8) | ~5K | **Nascent (~2–3%)** |

Implications:

- **Do not assume v2.1 is live** at a given LFI — "superseded" versions carry most real traffic. Confirm the counterparty's actually-served version per integration.
- New builds still target **v2.1-final + errata3**; the gap is between what the standard mandates and what incumbents have migrated.
- The metrics dashboard ([nebras-open-finance.com/metrics](https://nebras-open-finance.com/metrics)) is JS-rendered — figures need a real browser; re-verify before quoting.

## API Hub Platform Release Notes (2026)

From the hub's release-notes register (Release Notes = deployments to operational systems; organised by component, then year — API Hub and Trust Framework are **separate release streams on separate versioning schemes**). API Hub entries in 2026 (source: [`api-hub-releases-registry.ts`](https://github.com/Nebras-Open-Finance/community-standards/blob/main/src/data/api-hub-releases-registry.ts)):

| Release | Effective date | Deployment highlights |
|---|---|---|
| 2026.07.0 | 11 Mar 2026 | **V2.1 Banking API families enabled end-to-end** (the platform moment v2.1 became servable) |
| 2026.13.1 | 20 Apr 2026 | Refresh-token support for multi-authorization on SIP; corrected response mapping for GET /beneficiaries and GET /standing-orders; Sandbox Model Bank pre-populated Debtor Account fix; Account Information v2.1 consent response schema tightening |
| 2026.19.0 | 9 Jun 2026 (pre-production 2 Jun 2026) | **Mandatory `x-fapi-customer-ip-address` header on Product API endpoints**; **60-second authorisation-code expiry for FAPI 2.0 profiles**; Meta object on Statements responses; corrected Model Bank transaction payloads; CoP 500-error fixes (corporate requests, name masking); consent-expiry status-update fix; sandbox data-consistency improvements; idToken handling removed from Admin/Hub Portal flows |

Note the 11 Mar 2026 platform-enablement date vs the 7 Jan 2026 standards publication — a ~2-month lag between "standard published" and "Hub can serve it," before any LFI migration even starts. This is the structural reason traffic adoption trails the calendar. The two bolded 2026.19.0 items are participant-impacting behaviour changes (TPP request headers and auth-code handling) — check integrations against them.

## Trust Framework Release Notes (2026)

The Trust Framework (Raidiam-operated directory) has its **own release stream and versioning**, separate from the API Hub `2026.x` scheme — register at [/tech/release-notes-and-erratas/release-notes/trust-framework/2026](https://nebras-open-finance.com/tech/release-notes-and-erratas/release-notes/trust-framework/2026) (source: [`trust-framework-releases-registry.ts`](https://github.com/Nebras-Open-Finance/community-standards/blob/main/src/data/trust-framework-releases-registry.ts)):

| TF release | Date | Status | Highlights |
|---|---|---|---|
| 2.0.0 | 19 Feb 2026 | Released | API Families via Reference Data; certificate description field; new Auth Server detail experience; federation endpoint visibility |
| 2.1.0 | 2 Apr 2026 | Released | New Application details experience; IDP creation wizard; federation visibility |
| 2.2.0 | 2 Jun 2026 | Planned (still flagged planned at 10 Jun 2026 audit) | Directory version display; server roles; OTP validation in onboarding; cross-org audit-log scope |
| 2.3.0 | 2026 | Planned | Application change history / audit comparison; active-server filter |

Track **both** streams (plus the errata register — see `standards-versions.md`) when assessing platform change impact: directory/portal behaviour (certificates, onboarding, server publication) changes on the TF stream even when no API Hub release ships.

## What's Live

The hub's [Live Ecosystem page](https://nebras-open-finance.com/program/whats-live) lists LFIs currently offering live Open Finance services, filterable by service: **Account Information, Payment Initiation, Confirmation of Payee, Products & Leads, ATMs**.

- LFI services are pulled **live from the Nebras Open Finance directory**; TPP activity is aggregated from **API Hub access logs over a rolling 30-day window**; listed institutions are CBUAE-licensed active participants.
- The page is a JS-rendered SPA — the live LFI/TPP counts and per-institution service lists are **not fetchable statically** (fetched 9 Jun 2026: counts showed the pre-hydration zero state). Use a real browser for a current snapshot.

## Staged Delivery Model

How an LFI's plan maps onto the calendar (see `references/lfi-integration.md` for the full 9-step journey):

| Aspect | Model |
|---|---|
| Unit of delivery | A **capability** (e.g. Retail Data Sharing, SIP, CoP, Multi-Payments), not a whole release |
| Per-capability path | Build (step 3) → certify (step 4) → production validate → publish → live proving (steps 7–9) — independently of other capabilities |
| Recommended order (banking) | Phase 1: consent validate, consent journey, retail DS, retail SIP, refunds, CoP, CMI · Phase 2: multi-payments + products/leads · Phase 3: extended retail data + SME suite · Phase 4: SME multi-payments + multi-authorization |
| Recommended order (insurance) | One **primary insurance type** end-to-end first, then extend to the remaining of the 7 types |
| Hard constraint | All in-scope capabilities live by the CBUAE deadline |
| Ongoing | Version upgrades, new API families, errata, regulatory changes — planned against the API Hub release-notes schedule |

## Stated Community Roadmap Themes

From the community hub homepage ("What's next" — directional, community-stated, not CBUAE commitments):

1. **Machine-readable specification** — OpenAPI + JSON Schema + executable conformance suite
2. **Bulk & Batch Payments** — one consent, many payments (payroll, supplier runs, recurring disbursements)
3. **International Payments, reimagined** — FX transparency, beneficiary verification, SWIFT/instant rails as first-class

## Related References

- `references/standards-versions.md` — full version history and errata detail (do not duplicate here)
- `references/lfi-integration.md` — the integration journey behind each delivery
- `references/testing-certification.md` — certification gates per capability
