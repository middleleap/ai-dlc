# Repository map & fetching guide

> Merged from the `uae-open-finance` v0.1 skill on 9 June 2026. Repo layouts and errata folders change — re-list the GitHub tree before relying on exact paths.

The UAE Open Finance ecosystem is published across **four public GitHub repositories** under the
org **`Nebras-Open-Finance`**. This file is the lookup reference for locating and fetching
specific specs, doc pages, and Postman collections. Read it whenever a question needs an exact
file, path, or URL.

> **Org-level framing** (from the [`.github`](https://github.com/Nebras-Open-Finance/.github) org
> profile): the org hosts experimental and reference material that is **"not the official source
> of truth"** — it prototypes content, trials tooling, and gathers feedback before material moves
> upstream. Carry that disclaimer when citing the org; the canonical record remains the OF
> Confluence space (with `api-specs` as the working source of truth for OpenAPI detail).

## Table of contents

- [1. `api-specs` — canonical OpenAPI (source of truth)](#1-api-specs)
- [2. `community-standards` — documentation site](#2-community-standards)
- [3. `postman` — test collections](#3-postman)
- [4. `.github` — org profile, Discussions & policies](#4-github)
- [5. Fetching: raw files and tree listing](#5-fetching)
- [6. Errata resolution algorithm](#6-errata-resolution)

---

## 1. api-specs

**The OpenAPI YAML here is the source of truth.** Everything else is derived from it.

Repo root: `https://github.com/Nebras-Open-Finance/api-specs`

Layout (`dist/` is the published surface):

```
dist/
├── standards/        # APIs the API Hub exposes TO TPPs (TPP-facing)
│   ├── v2.1/                     # base version — YAML files directly inside
│   └── v2.1-errataN/             # targeted corrections; supersede base file-by-file
├── api-hub/          # APIs the API Hub exposes TO LFIs (consent manager, Headless Heimdall)
│   └── v2.1.x/                   # corrected in place; third segment uplifts (v2.1.4 → v2.1.5)
└── ozone-connect/    # APIs LFIs MUST implement for the Hub to call
    └── v2.1.x/                   # corrected in place; no errata folders
```

**Older version trees on `main`:** the layout above shows the v2.1 line, but `main` also carries
the **full v1.2 and v2.0 trees** (`dist/standards/v1.2/`, `v1.2-errata1/`, `v2.0/`,
`v2.0-errata1/` plus matching `api-hub`/`ozone-connect` folders) — relevant because most live
traffic still runs on v1.2/v2.0. Version-only differences to know when resolving a field for
those lines:

- `uae-pushed-authorization-endpoint-openapi.yaml` exists as a **standalone PAR spec in
  v1.2/v2.0** (folded into the authorization-endpoints spec in v2.1).
- `uae-tpp-onboarding-openapi.yaml` and `uae-tpp-reports-openapi.yaml` sit under **`standards/`
  in v1.2/v2.0** (moved to `dist/api-hub/v2.1.x/` in v2.1).
- v1.2 api-hub/ozone-connect files use a **`cbuae-` prefix** (e.g.
  `cbuae-headless-heimdall-openapi.yaml`, `cbuae-consent-manager-openapi.yaml`) — a deliberate
  convention per the repo's `CONTRIBUTING.md`.

**Naming convention:** spec files are named `uae-<domain>-openapi.yaml`. Examples that have been
observed in `dist/standards/v2.1/`:

- `uae-account-information-openapi.yaml` — Data Sharing / Account Information (AIS)
- `uae-atm-openapi.yaml` — ATM locator

The full set spans these functional domains (filenames follow the same pattern; **list the tree
to confirm exact names for a given version** — they change across versions/errata):

- Data sharing / account information (AIS)
- Service initiation / payments (PIS)
- Confirmation of payee (CoP)
- Products & leads
- ATMs
- Consent
- Token
- Registration
- Trust framework
- Webhooks

Governance folders (not part of the published API surface, useful for "why did this change"
questions):

- `supporting/breaking-changes/standards/vX.Y-errataN/<spec-basename>/breaking-changes.yaml` —
  knowingly-accepted breaking changes within an errata (oasdiff rule, endpoints, sign-off,
  rationale). Six files on `main` as of 10 Jun 2026, each signed off — notably the **errata2
  Risk-tree tightening** (`additionalProperties: false` on `POST /payments`, `/payment-consents`,
  `/file-payments`) and the **`AccountType` enum → `[Retail, SME, Corporate]`** change; full
  detail in `standards-versions.md`. Raw URL pattern:
  `https://raw.githubusercontent.com/Nebras-Open-Finance/api-specs/main/supporting/breaking-changes/<folder>/breaking-changes.yaml`.
- `supporting/future-updates/{standards,ozone-connect}/vN.0/<spec-basename>/future-updates.yaml`
  — design changes deferred to the next major. Forward-looking backlog, not enforced. Current
  **v3.0 backlog** ([tree](https://github.com/Nebras-Open-Finance/api-specs/tree/main/supporting/future-updates)):
  `TrustFrameworkCode` rename **`FI` → `cbuae_kyc`** plus new **`uae_pass`** and **`emirates_id`**
  trust-framework values (resulting enum `[cbuae_kyc, uae_pass, emirates_id]` on the parties
  endpoints, mirrored on the Ozone Connect verified-claims schemas), and the **deprecated
  uppercase `OTHER`** branch dropped from `AEExternalFinancialInstitutionIdentificationCode`
  (anyOf collapses to `[BICFI, Other]`).

**Branches:** `main` is published/authoritative. Other branches are drafts of future content
(e.g. a forthcoming `v2.2`) and are not authoritative until Nebras announces ecosystem review.

**Website spec branch:** the community site does NOT necessarily render specs from `main` — it
pins a branch in `community-standards/.specs-branch` (raw fetch it to check; value on 10 Jun 2026:
`caap-refactor`, which carries the CAAP Operations spec not yet on `main`). When the site and
`main` disagree, check this file first. Two nuances
([compare view](https://github.com/Nebras-Open-Finance/api-specs/compare/main...caap-refactor)):

- **CAAP Operations is a rename of User Operations** — the branch's single unique commit renames
  `main`'s `uae-ozone-connect-user-operations-openapi.yaml` to
  `uae-ozone-connect-caap-operations-openapi.yaml` (expanded with accounts + insurance-policy
  GETs; data-sharing and insurance specs correspondingly slimmed). Same artifact, refactored: on
  the site user-operations no longer exists as a spec; on `main` the reverse. Don't look for both.
- **The branch is not stale on errata:** it sits 1 ahead / 2 behind `main`, but the missing
  commits are only the errata2 merge commits — the **errata2 content is fully present on the
  branch**, so the rendered site reflects current errata.

**Viewing a spec nicely:** paste the raw YAML URL into the Redocly viewer
(`https://redocly.github.io/redoc/`).

---

## 2. community-standards

Developer & implementer documentation site (Vite + Vue 3, prerendered). **Experimental — not
the official source of truth.** Good for prose explanations, onboarding steps, and how the
pieces fit; defer to `api-specs` for any concrete API detail.

Repo root: `https://github.com/Nebras-Open-Finance/community-standards`

Pages live under `src/pages/`. Key technical areas:

- **TPP Standards** — `src/pages/tech/tpp-standards/`
  - Version-agnostic: trust framework, security (FAPI auth, mTLS, DPoP, PAR, tokens, headers),
    registration, sandbox, production.
  - Per-version (`v2.1/`): getting started + Postman, consent (create/authorise/exercise/revoke,
    lifecycle, consent management interface), banking APIs (data sharing, confirmation of payee,
    service initiation, products & leads, ATMs), webhooks.
- **LFI Integration Guide** — `src/pages/tech/lfi-api-hub/`
  - Version-agnostic: getting started (org/admin sign-up, C3 application, certificates), admin
    portal, connectivity, consent manager, Headless Heimdall reference UI, trust framework,
    production (testing, certification, live-proving).
  - Per-version (`v2.1/`): API Hub (consent manager, Headless Heimdall — APIs the Hub exposes TO
    the LFI), Ozone Connect (APIs the LFI implements — banking, consent events, health check),
    consent journey, consent management interface.
- **API Specifications index** — `src/pages/tech/api-specs/v2.1/` (grouped TPP / API Hub /
  Ozone Connect). Specs themselves are fetched at build time from the `api-specs` repo, not
  stored here.
- **Release Notes & Errata** — `src/pages/tech/release-notes-and-erratas/`
- **Metrics & Monitoring** — `src/pages/metrics.vue` (ecosystem dashboard). The underlying data
  is committed static JSON under
  [`public/api/`](https://github.com/Nebras-Open-Finance/community-standards/tree/main/public/api):
  `api-log.json` (~47.5k rows: `date`, `lfinamekey`, `tppname`, `httpmethod`, `url` — version-revealing,
  e.g. `open-finance/payment/v2.0/payments` — `tppresponsecodegroup`, `totalapicalls`,
  `executiontime` ms), `auth-log.json` (auth-journey calls), `payments-log.json` (`paymentpurposecode`,
  `status`, `paymentconsenttype`, `amount`, `count`). Data range 1 Nov 2025 → **7 Jun 2026** as of
  10 Jun 2026 (appended weekly). Two further files are **build-time-fetched and gitignored** —
  `public/api/trust-framework.json` (participant org registry: type LFI/TPP/Authority,
  `isProduction`, go-live dates) and `public/api/github-stats.json` — so they exist only on the
  built site (`https://nebras-open-finance.com/api/*.json`), not in the repo.
- **Trust Framework directory spec** — `public/openapi/trust-framework.yaml` (Raidiam directory APIs: participants, organisations, software statements, auth servers, api families, token; not version-bound).

`CLAUDE.md` at the repo root is the authoritative statement of architecture, invariants, and
terminology — the Architecture Invariants section of SKILL.md is distilled from it. Fetch it if
you need the exact normative wording
([raw](https://raw.githubusercontent.com/Nebras-Open-Finance/community-standards/main/CLAUDE.md)).
Two Hub responsibilities stated there that are easy to miss: the Hub **enriches requests**
(customerId, accountIds, TPP information) before proxying to the LFI; and the LFI returns errors
per the LFI (Ozone Connect) OpenAPI while the **Hub maps errors to the TPP standard and
normalizes responses** — error mapping/response normalization are Hub responsibilities, not LFI
ones.

Internal site links are `vue-router` route paths mirroring the file layout (e.g.
`/tech/tpp-standards/v2.1/banking/data-sharing/api-guide/`). A directory `index.vue` →
trailing-slash route; sibling `foo.vue` → `/foo`.

---

## 3. postman

Postman collections to test TPP and LFI implementations against the trust framework.

Repo root: `https://github.com/Nebras-Open-Finance/postman`

Published surface (import either into Postman):

- `banking.postman_collection.json`
- `insurance.postman_collection.json`

`supporting/` (not needed by consumers): Newman flow tests (`tests/banking`, `tests/insurance`,
`tests/helpers`), `certs.example/config.example.js`, gitignored `certs/`, and gitignored
reference specs under `open-api-standards/`.

Setup, environment URLs, certificate/key items, collection variables, and the
`x-fapi-interaction-id` rule are detailed in `technical-specs.md` (and section 7 below).

**Pending change (10 Jun 2026):** unmerged branch
[`fix/api-hub-and-hh-endpoints`](https://github.com/Nebras-Open-Finance/postman/tree/fix/api-hub-and-hh-endpoints)
(commit 8 Jun 2026, "fix CM variable and HH requests") rewrites ~4,500 lines across **both**
collections (Consent Manager variable + Headless Heimdall requests). `main` is unchanged since
22 May 2026, but a material update is queued — **pull the latest collections (and check whether
this branch has merged) before any certification run.**

---

## 4. .github

Org-level meta repo — profile, community, and security policies.

Repo root: `https://github.com/Nebras-Open-Finance/.github`

- **Org profile** (`profile/README.md`) — the canonical org-level framing quoted at the top of
  this file: the org hosts experimental and reference material, **not the official source of
  truth**; it prototypes content, trials modern tooling, and gathers feedback before material
  moves upstream.
- **Discussions hub** — this repo is the source repository for org-level
  [Discussions](https://github.com/orgs/Nebras-Open-Finance/discussions). Enabled but empty as
  of 10 Jun 2026 (no public threads yet).
- **Org default policies** — `CODE_OF_CONDUCT.md`, `SECURITY.md` (the vulnerability-reporting
  path for anything in the org), `SUPPORT.md`, and default issue templates (`bug_report.yml`).
  Route security reports per `SECURITY.md`; routine support goes via the Service Desk (section 7).

---

## 5. Fetching

**Preferred: use the bundled script** — `python3 scripts/fetch_spec.py --list` (inventory with effective errata levels) or `python3 scripts/fetch_spec.py <substring>` (errata-resolved YAML). The manual method below is the fallback.

**Raw file contents:**

```
https://raw.githubusercontent.com/Nebras-Open-Finance/<repo>/main/<path>
```

Examples:

```
https://raw.githubusercontent.com/Nebras-Open-Finance/api-specs/main/dist/standards/v2.1/uae-account-information-openapi.yaml
https://raw.githubusercontent.com/Nebras-Open-Finance/community-standards/main/CLAUDE.md
https://raw.githubusercontent.com/Nebras-Open-Finance/postman/main/banking.postman_collection.json
```

**Listing exactly what files exist** (filenames, errata folders, and versions DO change — always
confirm rather than guessing a filename):

```
https://api.github.com/repos/Nebras-Open-Finance/api-specs/git/trees/main?recursive=1
```

Swap the repo name for `community-standards` or `postman` as needed. The response is JSON with a
`tree` array of `{ path, type }`; filter `type == "blob"` and the `dist/standards/<version>/`
prefix to enumerate the specs for a version.

If a fetch fails because network access is disabled in the environment, say so explicitly,
answer from the skill snapshot (flagged as possibly stale), and give the user the repo path so
they can confirm upstream.

---

## 6. Errata resolution

For `standards/` (TPP-facing) specs, resolve the effective file before quoting any field:

1. Determine the version line the user cares about (default `v2.1`).
2. List the tree and collect every `dist/standards/v2.1*` folder: the base `v2.1/` plus any
   `v2.1-errata1/`, `v2.1-errata2/`, …
3. For the spec file in question, the **highest-numbered errata that contains that file wins**;
   if no errata contains it, fall back to the base `v2.1/` file. Resolution is **per file** — an
   errata folder may correct only some specs.

For `api-hub/` and `ozone-connect/`, there are no errata folders: take the file in the
`vMAJOR.MINOR.x/` folder directly (the `info.version` third segment and the `info.description`
changelog tell you what changed and when).


## 7. Postman collection setup

1. Install Postman and sign in.
2. **Import** → select `banking.postman_collection.json` or `insurance.postman_collection.json` from the `postman` repo.
3. **Configure mTLS** (Settings → Certificates → Add Certificate):
   - **Host** = the LFI domain under test (no protocol prefix). Patterns:
     - Model Bank (Sandbox): `*.altareq1.sandbox.apihub.openfinance.ae`
     - Model Insurer (Sandbox): `*.altareq2.sandbox.apihub.openfinance.ae`
     - LFI Pre-Production: `*.[LFI CODE].preprod.apihub.openfinance.ae`
   - **Port** = blank (defaults to 443)
   - **CRT file** = Transport Certificate (`.pem`); **KEY file** = Transport Key (`.key`)
   - One certificate entry per host pattern if testing multiple LFIs.
4. **Verify** by calling the **TPP Registration** endpoint: `204` confirms mTLS and credentials. A `400` or SSL handshake error usually means the certificate Host pattern doesn't match the LFI domain exactly.

### Collection variables

| Variable | Description |
| --- | --- |
| `clientId` | Application's client ID |
| `redirectUri` | Registered redirect URI |
| `signingKeyId` | `kid` of the client signing key |
| `signingKey` | Contents of the signing private key (`.key`) |
| `discoveryUri` | Discovery endpoint for the target LFI |
| `baseUri` | Base resource server URI for the target LFI |

### Support tickets

Trust-framework and onboarding issues go through the Nebras **Service Desk Portal** (`https://servicedesk.nebrasopenfinance.ae` — confirm against the current `postman` repo README). Always include the `x-fapi-interaction-id` (and Consent ID where relevant); without it, support cannot locate the transaction.
