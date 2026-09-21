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

## Pass of 17 August 2026 — full source re-verification + Interaction Guide v5.0

Trigger: user-supplied **Nebras Interaction Guide for LFIs and TPPs v5.0 (June 2026)** + request
for a full accuracy pass. Method: OF Confluence REST (anonymous), community-hub pages, registry
sources on raw.githubusercontent.com. GitHub REST API was rate-limited (403) throughout — repo
trees/branches checked via raw-file probes instead.

| Item | Outcome | Files updated |
|---|---|---|
| Interaction Guide | **NEW SOURCE INGESTED**: Confluence page 232751177 ("Nebras Interaction Guide", page v9, updated 29 Jun 2026) declares **v5.0 (June 2026)** current ("replaced with v5"); v4/v3/v1.2/v1.0 PDFs retained. Full digest (service-desk SLAs, P1–P4 priorities, 24/7 line +971 4 328 2979, escalations@/billing@, portal SSO, onboarding SLAs + Docusign 30-day rule, dispute process incl. AEP/Nebras split + Sanadak, billing cycle 5th/10th/30th, notification notice periods, CMR/CAB). Internal inconsistency noted (p.13 chart vs §9.4 SLA table) — §9.4 treated as canonical. "Powered by Unitey" branding | NEW `nebras-interaction-guide.md`; cross-refs in SKILL.md, lfi-integration, technical-specs, liability-framework, aml-fraud-guidelines, pricing-model |
| Errata level | **Still v2.1-final + errata3 — no errata4, no v2.2** (versioned erratas page + erratas-registry.ts). Errata3 effective dates now published: **8 Jul 2026 (spec register) / 30 Jun 2026 (doc-level)**. Registry now ALSO lists **errata1** (insurance quote-read oneOf, effective 10 Apr 2026) — the 10 Jun "no errata1 entries" observation is obsolete. Errata3 affected-spec list adds consent-manager + ozone-connect bank-service-initiation/consent-events (in-place `v2.1.x` corrections) | `standards-versions.md`, SKILL.md, `implementation-roadmap.md`, `api-specifications.md` |
| Doc-level errata register | **RESOLVED (was open from 13 Jul):** Confluence now has **"Standards V2.1 & API Hub V8 - Consolidated Errata"** (page 1366294554, published 30 Jun 2026, edited 8 Jul 2026) consolidating errata1 (16 Mar 2026), errata2 (7 May 2026), errata3 (30 Jun 2026); separate errata1/errata2 pages also exist (both edited 30 Jun 2026). Doc-level vs spec-level dates diverge systematically | `standards-versions.md` |
| API Hub releases | **NEW release 2026.22.0 (effective 6 Jul 2026; registry `effectiveDate: '2026-07-06'`, cross-checked against the rendered register page)**: paymentId restored mandatory on CM GET /payment-log; consent revocation in non-revocable states → **400 (was 204)**; PATCH /consents 500 fix; token error_description RFC 6749 charset | `implementation-roadmap.md`, `standards-versions.md` |
| Trust Framework releases | **2.2.0 (2 Jun) / 2.3.0 (8 Jun) / 2.4.0 (7 Jul 2026) all RELEASED** (were planned at 10 Jun audit); 2.5.0 planned | `implementation-roadmap.md`, `standards-versions.md` |
| CAAP spec | **RESOLVED:** `uae-ozone-connect-caap-operations-openapi.yaml` (v2.1.4) confirmed **on `main`**; `user-operations` 404; `.specs-branch` pin file **removed** (404) — site builds from main again | `repositories.md`, `api-specifications.md`, SKILL.md |
| Pricing | Unchanged: page 124846096 v31 (edit 2 Jun 2026), doc label **Version 1.0 (4 Oct 2024)**; fee figures re-confirmed in body (2.5 fils SI; 0.5 fils balance/CoP within 2h of payment; 38 bps→25 bps + 50 AED cap; 25 fils P2P; 250 fils corporate; 5–12.5 fils quote tiers). Interaction Guide **sample invoice** shows CoP-discounted 0.25 AED — sample-doc anomaly, pricing page stays authoritative | `pricing-model.md` (billing-ops addendum + caveat) |
| Liability | Unchanged: page 124944402 v20, last edit 7 Jan 2026 (after which the 10 Jun verification ran) — amounts stand. v5.0 adds the operational dispute channels (AEP vs Nebras, Sanadak, timelines) | `liability-framework.md` |
| AML page | Unchanged (page 124747798 v11, last edit 23 Jul 2024). v5.0 adds the operational fraud-incident path (helpdesk P2 / systemic P1 / operational pause) | `aml-fraud-guidelines.md` |
| Testing & Certification page | Unchanged (page 124583943 v46, 12 May 2026). v5.0 certification tables match the skill (Hub-held single OIDF FAPI cert renewed per major version; TPP FAPI RP per version; Nebras-issued functional + CX certs) | — |
| Roadmap / Platform Assurance / Brand pages | Unchanged (Roadmap 6259008 v31, 25 Mar 2026; Assurance 405307393 v5, 2 Jun 2026; AlTareq Brand Guidelines 196116611 v9, 27 Feb 2025). NEW: final English **insurance co-branded messaging templates (LFI + TPP)** attached 8 Jul 2026 | `altareq-brand.md` |
| NOT re-verified this pass | Metrics data range / v2.1 adoption (JSON too large for static fetch — still a 31 May 2026 snapshot); postman `fix/api-hub-and-hh-endpoints` merge status (GitHub API 403); live spec YAML diffs beyond existence probes | flagged in `implementation-roadmap.md`, `repositories.md` |

## Pass of 31 August 2026 — errata3 grew from 2 to 5 corrections since 17 Aug

Trigger: weekly scheduled re-check of the community hub Release Notes & Errata register (the
"ecosystem watcher" cadence). Method: `check_current.py` (register-only fallback — GitHub API
403 rate-limited as usual) plus a manual fetch of `erratas/v2.1/`, the `erratas-registry.ts`
source, and the doc-level Confluence "Consolidated Errata" page (1366294554).

| Item | Outcome | Files updated |
|---|---|---|
| `check_current.py` verdict | **FRESH** — it only compares the stated errata *number* (`v2.1-errata3` in both SKILL.md and the register), so it correctly reported no change. **This is a real blind spot**: it cannot detect an existing errata group growing new sections without a number bump. Not fixed this pass (flagged for a follow-up); cross-check `standards-versions.md`'s section count manually until it is | — |
| errata3 scope | **STALE — 3 new corrections found**, effective **21 Aug 2026** (4 days after the 17 Aug pass), not yet reflected in the skill: **§3** Debtor/Creditor References constrained to the ISO 20022/SWIFT `x` character set (proposal OFP-003); **§4** idempotency-key query response corrected to the signed envelope `AEIdempotencyKeyQuerySigned` (`uae-bank-initiation-openapi` only); **§5** `ReadStatements`/`ReadProductFinanceRates` permission codes extended to `uae-ozone-connect-consent-events-actions-openapi` and — newly added to the errata3 affected-spec list — `uae-ozone-connect-caap-operations-openapi`. errata3 is now 5 sections total (was 2 as of 17 Aug); §1–2 unchanged (eff. 8 Jul 2026, intl-creditor restructure) | `standards-versions.md`, SKILL.md, `api-specifications.md`, `technical-specs.md` |
| Doc-level Confluence register | **Still at page version 5 / last edit 8 Jul 2026** — covers only §1–2. §3–5 exist only in the spec-level register as of this pass; the systematic spec-runs-ahead-of-doc lag noted on 13 Jul/17 Aug continues | `standards-versions.md` |
| NOT re-verified this pass | `dist/standards/v2.1-errata3/` folder tree itself (GitHub API 403); whether §3–5 changes are already live on API Hub v8 production (Release Notes not checked this pass — see `implementation-roadmap.md` for the last-known API Hub release, 2026.22.0 / 6 Jul 2026, and Trust Framework release, 2.4.0 / 7 Jul 2026 with 2.5.0 still TBC as of this pass); full site/Confluence re-audit (scoped to errata register only this pass, unlike the 17 Aug full pass) | flagged above |

## Pass of 3 September 2026 — wire-schema verification (api-specs only)

Trigger: a build needed the exact home for custom data in the Risk block. Method: the two
payment specs at `dist/standards/v2.1-errata3/` read directly from raw.githubusercontent.com,
repo tree and commit history via an **authenticated** `gh api` call (no 403s — closes the 31 Aug
"folder tree not re-checked" item). The community-hub register and Confluence were **not**
re-checked this pass — items marked PENDING below need that.

| Item | Outcome | Files updated |
|---|---|---|
| Risk block structure | **VERIFIED**: `AERisk` (bank-initiation) and `…RichAuthorizationRequests.AERisk` (authorization-endpoints) are identical: exactly `DebtorIndicators`, `DestinationDeliveryAddress`, `TransactionIndicators`, `CreditorIndicators`, `additionalProperties: false`. **No root-level `Risk.SupplementaryData`.** Each of the three indicator objects carries a free-form `SupplementaryData` object — the only extension points. `ChannelType` is a closed seven-value enum; `SubChannelType` eight values; `CreditorIndicators.AccountType` = Retail/SME/Corporate | `aml-fraud-guidelines.md`, `payments-and-consent-rules.md`, SKILL.md |
| PII envelope | **VERIFIED**: `PersonalIdentifiableInformation` is `AEJWEPaymentPII` (JWE compact string over a JWS; example header `RSA-OAEP` / `A256GCM`) on both the `/par` consent object and `POST /payments`; decrypted content is `{Initiation, Risk}`. Consent-side creditor list is `Initiation.Creditor[]` inside the seal | (already stated; no change) |
| ControlParameters | **VERIFIED** closed schema: `IsDelegatedAuthentication?` + `ConsentSchedule.{SinglePayment\|MultiPayment\|FilePayment}`; MultiPayment = lifetime `MaximumCumulativeValueOfPayments` / `…NumberOfPayments` + `PeriodicSchedule` (discriminator `Type`; `VariableOnDemand` → `PeriodType`, `PeriodStartDate`, `Controls{MaximumIndividualAmount, MaximumCumulativeValueOfPaymentsPerPeriod, MaximumCumulativeNumberOfPaymentsPerPeriod}`, `minProperties: 1`). Matches `payments-and-consent-rules.md` | — |
| Paths | **VERIFIED** v2.1 TPP surface: `POST /par`, `GET`/`PATCH /payment-consents/{ConsentId}` (revoke = PATCH, `RevokedBy: TPP \| TPP.InitiatedByUser`), `POST /payments` (`application/jwt`), `GET /payments/{PaymentId}`, `/file-payments`. SKILL.md API Categories row had listed `/domestic-payments`, `/multi-payments`, `/bulk-payments` as paths — corrected (they are consent/payment *types*) | SKILL.md |
| errata3 folder tree | **CONFIRMED at folder level** (closes the 31 Aug open item): `dist/standards/v2.1-errata3/` = `uae-authorization-endpoints-openapi.yaml` + `uae-bank-initiation-openapi.yaml` + **`uae-insurance-openapi.yaml`** (copied in 15 Aug 2026 with the insurance errata applied — per-QuoteStatus quote subschemas, `format: uuid` dropped, `CreditDebitIndicator`, percentage/ratio split). The bank-initiation file carries the §4 signed idempotency-key response (`AEIdempotencyKeyQuerySigned`, on `GET /file-payments` as well as `GET /payments`; breaking change recorded under `supporting/breaking-changes/standards/v2.1-errata3/`). **PENDING**: the insurance file is not in the register's errata3 affected-spec list — repo ahead of register, or a folder-level backport the register does not track | `standards-versions.md`, SKILL.md |
| v2.2-rc1 | **NEW LINE DETECTED**: `dist/standards/v2.2-rc1/` promoted from `v2.2-draft1` on 21 Aug 2026, with `api-hub/v2.2.x` and `ozone-connect/v2.2.x`. Pre-release; content summarised from the promotion commit (its `DebtorReference` OFP-003 pattern is the same change as errata3 §3). `check_current.py` previously ignored `-rcN` folders silently — it now reports pre-release lines. It still does **not** count sections, so the 31 Aug blind spot (an errata group growing in place) remains open | `standards-versions.md`, `repositories.md`, SKILL.md, `scripts/check_current.py` |
| JWE `alg` wording | **OPEN — minor**: `technical-specs.md` states `RSA-OAEP-256` (from the hub encryption guide); the errata3 spec's `AEJWEPaymentPII` example header decodes to `{"alg":"RSA-OAEP","enc":"A256GCM"}`. Both are RSA-OAEP family; confirm which the Hub/LFI JWKS actually advertise before hard-coding either | flagged here only |
| NOT verified this pass | Register / Confluence status of v2.2-rc1 and of the insurance file in the errata3 folder; `servers` base paths; anything outside the two payment specs | — |

## Pass of 14 September 2026 — weekly ecosystem-watcher re-check + check_current.py fix

Trigger: the recurring weekly ecosystem-watcher cadence (see the 31 Aug 2026 pass).
Method: live fetches (no GitHub-API tree read available this pass — the session's
GitHub access is scoped to this repo only, so `api.github.com` 403s as a permissions
block rather than the usual rate limit; `raw.githubusercontent.com` file reads are
unaffected and were used instead) against the community hub erratas page
(`erratas/v2.1/`), the `community-standards` registry sources (`erratas-registry.ts`,
`api-hub-releases-registry.ts`, `trust-framework-releases-registry.ts`), specific
`dist/standards/` paths on `api-specs` (existence probes), and the doc-level Confluence
"Consolidated Errata" page (anonymous REST).

| Item | Outcome | Files updated |
|---|---|---|
| errata3 scope | **UNCHANGED** — still exactly 5 corrections (§1–5), no §6+, no errata4, on both the versioned register page and `erratas-registry.ts` | — |
| Doc-level Confluence register | **UNCHANGED** — page 1366294554 still at version 5 / last edit 8 Jul 2026 (§1–2 only); §3–5 still spec-only | — |
| API Hub releases | **UNCHANGED** — `2026.22.0` still the latest in `api-hub-releases-registry.ts` | — |
| Trust Framework releases | **UNCHANGED** — `2.5.0` still `planned`, no date, in `trust-framework-releases-registry.ts` | — |
| Pre-release line | **UNCHANGED** — `dist/standards/v2.2-rc1/` still the highest on `main` (`v2.2-rc2`, `v2.2`, `v2.1-errata4` all 404 on raw-file probes) | — |
| `check_current.py` blind spot | **FIXED**: the 31 Aug pass flagged that the script only compares the errata *number* and would miss an existing group growing sections in place — flagged again as still-open on 3 Sep. Added `register_section_count()` (parses the register's "N corrections" badge for the stated errata) and `skill_stated_sections()` (parses the same count from SKILL.md's Quick Reference); when the errata numbers already agree, main() now also compares these counts and reports STALE with a `section_note` on mismatch instead of a false FRESH. Verified against live data this pass: skill=5, register=5 for errata3 (agree, correctly FRESH); register=17 for errata2 (agrees with the known count, confirming the parser) | `scripts/check_current.py`, SKILL.md |
| NOT re-verified this pass | Full site/Confluence audit (scoped to the watcher's usual register + release-registry surfaces, not a full re-verification pass); the `api-specs` git tree via GitHub API (session-scoped access denied it this pass — see Method above); the insurance-file-in-errata3 PENDING item from 3 Sep (not re-checked; still assumed to hold since nothing upstream changed) | flagged above |

## Pass of 21 September 2026 — weekly ecosystem-watcher re-check + check_current.py repo-check fallback

Trigger: the recurring weekly ecosystem-watcher cadence (see the 31 Aug 2026 pass), run from
a scheduled/automated session. Method: `check_current.py` plus manual `curl` re-checks of the
same surfaces the 14 Sep pass used — the community hub `erratas/v2.1/` page, the
`community-standards` registry sources (`erratas-registry.ts`, `api-hub-releases-registry.ts`,
`trust-framework-releases-registry.ts`), and raw-file existence probes against `api-specs`
for `v2.1-errata4`, `v2.2-rc2`, `v2.2`, and `v2.2-rc1`.

| Item | Outcome | Files updated |
|---|---|---|
| errata3 scope | **UNCHANGED** — still exactly 5 corrections (§1–5) on both the register page and `erratas-registry.ts`; no §6+, no errata4 | — |
| API Hub releases | **UNCHANGED** — `2026.22.0` still the latest in `api-hub-releases-registry.ts` | — |
| Trust Framework releases | **UNCHANGED** — `2.5.0` still `planned` (`effectiveDate: '2026'`, no day-level date), still the highest release entry | — |
| Pre-release line | **UNCHANGED** — `dist/standards/v2.2-rc1/` still the highest on `main` (`v2.1-errata4`, `v2.2-rc2`, `v2.2` all 404 on raw-file probes) | — |
| `check_current.py` repo-side check | **New structural finding, fixed this pass**: this session's `api.github.com` call 403s with body `"GitHub access to this repository is not enabled for this session..."` — a **deterministic Claude Code sandboxed-session scope block**, not the unauthenticated rate limit the script's comments assumed. It recurs on every scheduled/automated run (flagged as circumstantial on 14 Sep; now confirmed structural and generalized). Previously this meant `repo_latest`/`prerelease_lines_in_repo` went **fully blank** in exactly the runs this weekly cadence uses — the tool lost the one signal (pre-release visibility) manual passes have relied on `raw.githubusercontent.com` probes to recover by hand every time. Added `probe_repo_fallback()`: when the Tree API errors, the script now existence-probes a small hand-maintained `PRERELEASE_FRONTIER` list (and the next errata folder) via `raw.githubusercontent.com`, which is unaffected by the session scoping. Also split the 403 diagnosis so the two causes (session scope block vs. rate limit) are no longer conflated in `note`. Verified this pass: with the tree call still 403ing, the script now correctly reports `repo latest = v2.1-errata3`, `pre-release on main = v2.2-rc1` instead of nothing | `scripts/check_current.py`, `SKILL.md` |
| NOT re-verified this pass | Doc-level Confluence "Consolidated Errata" page (not re-fetched — no reason to expect it moved given the spec-level register and doc-level page have been in lockstep-lag since 31 Aug); full site/Confluence audit (scoped to the watcher's usual surfaces, as in every pass since 31 Aug) | — |

## Other dated verification notes

- **Pricing model** — OF Confluence "Commercial and Pricing Model" page edited 2 Jun 2026 but the
  document version label remains **1.0 (4 Oct 2024)**; fee schedule re-confirmed unchanged at
  version level on 8 Jun 2026. If a Version 2.0 is ever published, treat all pricing figures as stale.
- **Liability amounts** — verified 10 Jun 2026 against the OF Confluence "Limitation of Liability
  Model" (doc v2.1).
- **Live-traffic snapshot** — metrics dashboard data through 31 May 2026: production traffic
  dominated by v1.2/v2.0; v2.1 adoption ~2-3% of successful volume.
