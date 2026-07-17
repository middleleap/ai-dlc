# Verification log & provenance

This file is the audit trail for the skill's factual claims: where each contested item was
verified, what was corrected, and what remains open. SKILL.md carries only the still-open
items; the full history lives here so the always-loaded file stays lean.

## Provenance of the reference files

- **9 June 2026** — most reference files were **regenerated from public sources** after the
  original files were lost (`aml-fraud-guidelines`, `api-specifications`, `cbuae-regulations`,
  `implementation-roadmap`, `lfi-integration`, `liability-framework`, `technical-specs`,
  `testing-certification`). Content absorbed from the retired `uae-open-finance` v0.1 skill
  was merged the same day (notably `repositories.md`).
- **10 June 2026** — `operational-policies.md` and `payments-and-consent-rules.md` compiled
  from the community-hub policy pages and TPP Standards business-rule pages (site data files).
- **10 June 2026** — full-site coverage audit of nebras-open-finance.com (all 553 source pages)
  plus the 4 GitHub repos; verification pass cleared items 1, 4, 7, 8 and partials below.

Cross-check critical figures against the OF Confluence space / community hub before relying
on them — especially anything time-sensitive (standards/errata level, pricing, metrics).

## Access discovery (how to verify without credentials)

The **OF Confluence space is anonymously readable**: page bodies fetch via
`https://openfinanceuae.atlassian.net/wiki/rest/api/content/{id}?expand=body.storage,version`
and CQL search via `/wiki/rest/api/content/search?cql=...` (no auth). Items still open below
were not found in any public page text, spec, or hub page; each stays flagged
"(verify against source)" in its reference file.

## Verification items (full history, pass of 10 June 2026)

| # | Item | Status | Lives in |
|---|------|--------|----------|
| 1 | Liability compensation schedule + Nebras cap | **RESOLVED 10 Jun 2026** (OF Confluence "Limitation of Liability Model", page 124944402, doc **Version 2.1**, updated 6 Jan 2026): 500/350/500/750/1,000/5,000 all confirmed. **Corrections:** SLA-failure compensation is tiered **350/250/200** by delay; Nebras cap is AED 5M of direct losses **per claim**, not aggregate | `liability-framework.md` |
| 2 | 16 Sep 2026 TPP regularisation deadline | **STILL OPEN**: not present in any anonymously-readable OF Confluence page text, the public rulebook, or the hub (searched 10 Jun 2026); needs an authenticated/CBUAE source | `cbuae-regulations.md`, `implementation-roadmap.md` |
| 3 | AML GO portal | **Portal RESOLVED 10 Jun 2026** (OF Confluence "AML and Fraud Guidelines", page 124747798, doc v1.1, provisional: TPPs "Report any suspicious activities via the AML GO portal of CBUAE"). **STILL OPEN:** the 10 excluded high-risk countries — no list on that page; likely in Standards/Operational Guidelines or CBUAE Notice 3057/2025 (attachment-only) | `aml-fraud-guidelines.md` |
| 4 | AED 15,000 international limit | **RESOLVED with correction 10 Jun 2026** (Limitation of Liability Model, doc v2.1): the limit is **AED 15,000 on international payments to new beneficiaries for 48 hours after beneficiary creation** — per customer, per TPP, per bank, sum of payments (TPP-imposed; breach = AED 1,000 + direct losses). Supersedes the "first-time international / 24h" wording. **STILL OPEN:** rule IDs (A12.1, A15–A17) and the 10-minute initiation window — not in public specs or Confluence | `aml-fraud-guidelines.md`, `technical-specs.md` |
| 5 | SOC 2 exemption via CISO attestation | **STILL OPEN**: no exemption/CISO text in any public source (searched 10 Jun 2026). Adjacent verified material: OF Confluence "Open Finance Platform Assurance" (page 405307393, updated 2 Jun 2026) documents **vendor** assurance only — Ozone API ISO 27001:2022 + SOC 2 Type 2 (Prescient Security), Raidiam ISO 27001 (Amtivo, Nov 2025) + SOC 2 Type II (Moore ClearComm, Sep 2025; next Oct/Nov 2026), CBUAE FAPI 2.0 OIDF certification | `cbuae-regulations.md`, `testing-certification.md` |
| 6 | CoP path | **RESOLVED 9 Jun 2026**: TPP→Hub = `/discovery`+`/confirmation`; Hub→LFI (Ozone Connect) = `/customers/action/cop-query` | `api-specifications.md` |
| 7 | Token grants / insurance scope / DPoP | **RESOLVED 10 Jun 2026** (`uae-authorization-endpoints-openapi.yaml` v2.1-errata2 + `uae-insurance-openapi.yaml` v2.1-errata1): `/token` grants = `authorization_code`, **`refresh_token`**, `client_credentials`; scope name = **`insurance`** (full CC scope list: openid, confirmation-of-payee, accounts, insurance, tpp-reports, fx, account-opening); **no DPoP anywhere in the v2.1 specs** — private_key_jwt client auth + transport mTLS. Residual: spec `servers:` blocks are relative paths only, so the **production** host pattern stays doc-sourced | `technical-specs.md` |
| 8 | Permission variants / POST semantics | **RESOLVED 10 Jun 2026** (specs): permissions enum has **`ReadStatements` only (no Basic/Detail)** and **no ReadTransactionsCredits/Debits variants** (full 21-code enum now in the reference); account opening = `POST /accounts` (+ `GET .../status`, `PATCH .../subscription`); insurance quotes = `POST /{line}-insurance-quotes` + `PATCH .../{QuoteId}` to accept; FX = `POST /fx-quotes` + `PATCH /fx-quotes/{FxQuoteId}` to accept | `api-specifications.md` |
| 9 | S4 role / cert validity / caching | **MOSTLY RESOLVED 10 Jun 2026** (site audit): S4 = LFI's Ozone Connect server transport cert (SAN on LFI server certs only); all TF certs 13-month validity (SERVER ENCKEY never expires); directory/.well-known caching `max-age=900`; insurance-quote polling quota ≤1/min. **STILL OPEN:** per-TPP rate-limit quotas beyond these; resource-API HTTP caching regime | `technical-specs.md`, `lfi-integration.md` |
| 10 | Errata→re-certification policy | **Trigger rule verified 10 Jun 2026** (Testing and Certification Framework page, updated 12 May 2026): "Any FAPI, Functional or CX changes to be re-certified" (change-triggered, not errata-triggered). **STILL OPEN:** insurance functional-evidence page; certification evidence detail (hub pages remain stubs) | `testing-certification.md` |
| 11 | Deemed-licence insurance/PII cover equivalence; OF-specific outsourcing guidance | **STILL OPEN**: no public Confluence/hub text found (searched 10 Jun 2026) | `cbuae-regulations.md`, `liability-framework.md` |

## Pass of 13 July 2026 — errata3 detection

| Item | Outcome | Files updated |
|---|---|---|
| Current errata level | **v2.1-errata3 detected and verified published**: `dist/standards/v2.1-errata3/` in the api-specs repo (auth-endpoints + bank-initiation, bank-initiation self-declares `version: v2.1-errata3`), and the community hub **versioned erratas page** (`erratas/v2.1/`) lists the errata3 group with **2 corrections** (international creditor Individual/Organization `oneOf` per SWIFT SR2026; Creditor Agent address on shared `AEInternationalAddress`, TownName required, max 70). **Caveat:** the register **landing page** summary still read "v2.1-errata2" at detection time — the versioned page is the reliable surface; `check_current.py` now scans both. | `standards-versions.md`, `SKILL.md`, `api-specifications.md`, `technical-specs.md`, `implementation-roadmap.md`, `cbuae-regulations.md` |
| check_current.py | Rewritten: cross-checks repo (cut) vs register (published); adds **PENDING** state (repo ahead of register); GitHub 403s now diagnosed as the unauthenticated rate limit (60 req/hr/IP) with register-only fallback rather than an opaque failure. | `scripts/check_current.py` |
| Not re-verified this pass | Confluence doc-level errata register for an errata3 record; effective dates per errata3 section; whether API Hub v8 deployment already emits the new creditor schemas (Release Notes not yet checked). Flag "(verify against source)" where these matter. | — |

## Other dated verification notes

- **Pricing model** — OF Confluence "Commercial and Pricing Model" page edited 2 Jun 2026 but the
  document version label remains **1.0 (4 Oct 2024)**; fee schedule re-confirmed unchanged at
  version level on 8 Jun 2026. If a Version 2.0 is ever published, treat all pricing figures as stale.
- **Liability amounts** — verified 10 Jun 2026 against the OF Confluence "Limitation of Liability
  Model" (doc v2.1).
- **Live-traffic snapshot** — metrics dashboard data through 31 May 2026: production traffic
  dominated by v1.2/v2.0; v2.1 adoption ~2-3% of successful volume.

## Import into middleleap/ai-dlc (17 Jul 2026)

- Imported from the Claude.ai `.skill` export into the `middleleap-open-finance` plugin
  (v2.0.0), replacing the repo's stale copy; the standalone `altareq-brand-guidelines` skill
  was retired in the same change (its content lives here as `altareq-*.md`).
- **Portability fix applied on import:** both `scripts/*.py` used `X | None` return
  annotations, which crash at import time on Python 3.9 (macOS system python). Added
  `from __future__ import annotations` to each. **This fix must be mirrored into the
  canonical Claude.ai copy**, or the next export will re-break it.
- `check_current.py` run live on 17 Jul 2026 after the fix: **FRESH** — skill's v2.1-errata3
  matches the published register and the api-specs repo.
