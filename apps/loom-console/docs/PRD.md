# The Loom Console: PRD

| | |
|---|---|
| **Status** | Draft v0.2 for implementation · 24 Sep 2026 |
| **Owner** | Michael Hartmann (MiddleLeap) |
| **Where it lives** | `apps/loom-console/` in the ai-dlc repository. It is a standalone app, not part of any plugin and not installed into a bank's repository |
| **Reads** | any Loom installation (a repository adopted with `middleleap-loom`), using that installation's own gate code |
| **Built so far (P0)** | the reader (`src/data.mjs` → `loom.console/v1`), a static build, a local read-only server, the Meridian demo, the web UI and 15 tests |
| **Worked example** | the Meridian Trust portfolio in `plugins/middleleap-loom/skills/loom-adopt/harness/demo/meridian/`, run with `loom-console demo` |
| **Prototype snapshot** | `apps/loom-console/docs/prototype.html` |

---

## 1. Problem

A bank that installs the Loom gets skills, hooks, gates and templates in a repository, and a terminal to drive them. That works for the one technical person who runs it (the facilitator). Everyone else who is accountable for what the Loom produces can't see into it without that person, including:

- the sponsor who owns a problem
- second line and the DPO, who must sign
- the accountable executive, who can stop it
- the institutional-context owner, who owns the BrainKit
- internal audit, who has to re-perform it

The questions they ask are simple and recurring. What has been loaded into the brain? How many discovery runs are there, and where does each one stand? Is there a prototype? Where is the PRD? What is waiting on me, and for how long? Today every one of those answers needs a terminal and someone who knows where to look.

The Factory Floor answers part of this for authors, but it is optional, it needs a signed residency record before it can exist, and it is a writing surface. What's missing is a **read-only oversight surface** that every role can open on day one.

## 2. What the console is and is not

**It is** a projection of the repository: a generated, read-only view of the discovery runs, the institutional context they draw on, the approval queue and the installation. It is rebuilt from git on every merge.

**It is not:**

- **An approval surface.** There is no approve, sign or merge action. Decisions stay signed records in git that a second person merges (HG-0001). An approve button would move authority out of the record.
- **An authoring surface.** Authors write on the Factory Floor or with the facilitator.
- **A system of record.** Nothing the console shows is authoritative on the console. Every fact points back to the file it came from.
- **A runtime monitor.** The Loom is a build-time frame, and production controls are the institution's own.

This follows the Factory Floor's four disciplines exactly: git is the system of record, decisions come home by PR, observed not declared, and agents approve nothing. Enforcement is identical whether the console exists or not.

## 3. Users

The console serves the roles in the institution's identity registry (`docs/governance/identities.json`), not invented personas. The role lens maps registry roles to what each person is looking for.

| Console role | Registry roles | Their three questions | Where they decide (never in the console) |
|---|---|---|---|
| Accountable executive | `accountable-executive` | Is discovery effort going where our strategy says? What have I approved, and on what conditions? How mature are the controls, honestly? | HG-0010: cease-use authority over the harness |
| Loom programme owner | none today (see §12, D3) | Where is every run and what is stuck? Who is each item waiting on, and for how long? Are the gates doing the work? | Read-only |
| Product owner | `product-owner` | Where are my runs? Is there a prototype, and where is the PRD? What happens next? | HG-0007: the waist gate |
| Second line · DPO · compliance | `risk-second-line`, `data-protection`, `compliance`, `credit-risk`, `legal` | Which risks have no control? What is waiting on my signature, and for how long? Do our obligations resolve, and are they verified? | HG-0001: four-eyes, signed records |
| Institutional context owner | `institutional-context-owner` | Is the BrainKit approved, sealed and current? Which intents are pursued, and by which runs? What on the radar is due? | BrainKit re-version, reseal, approve in git |
| Platform admin · CIO | `platform-admin`, `information-security`, `enterprise-architect` | What did we install and what is on? Which guardrails run on every change? What is not stood up yet? | HG-0002: immutable control plane |
| Facilitator | `engineering`, `solution-architect` | What do I run next, for whom? Which gate result do I read back? Is every reaction still bound to its prototype? | Owns the record, merges nothing they authored |
| Internal audit · model risk | `internal-audit`, `model-validator` | What happened, when, and who decided? Can I trust this page? Which runs carry a model? | HG-0006: model risk; re-perform |

**Primary user for v1:** the product owner and second line. They have the most recurring questions and today depend most on the facilitator.

## 4. Principles (each one is testable)

- **P1. Generated, never written.** Every value on screen comes from the reader (`src/data.mjs`) reading the installation. Nothing is typed into the page. *Test:* the page renders only from `console.json`, and a fixture run's state in the console equals its declared state (`test/data.test.mjs`).
- **P2. Every fact carries its source.** Each fact has one of four provenance kinds and a file:

  | Kind | Meaning |
  |---|---|
  | `record` | read from a governed file |
  | `executed-check` | a gate the generator ran |
  | `derived` | computed from records |
  | `telemetry` | flags, never blocks |

  *Test:* a walk of the output finds no provenance outside those four kinds, and every `record` file exists.
- **P3. Validator truth, unsoftened.** Gate states are exactly what `discovery/gates/validate.mjs` returned. A gate failing because its stage isn't reached is shown as *fail · not reached*, never as pass or as grey. *Test:* `sme-overdraft-decision` D6 is `fail` with `reached: false`.
- **P4. Honest state before good news.** The control-maturity ladder (absent → defined → mechanically validated → platform enforced → organisationally enforced, from `control-catalog.json`) is on the overview. So is the statement that the Loom is proven on a demo, not in production.
- **P5. No authority.** The console has no write path, holds no token, and makes no call out. Its only actions are navigation and copying a path.
- **P6. Two brands, kept apart.** The console's own chrome is a MiddleLeap product and uses the MiddleLeap design system. Everything it embeds from the installation (wireframes, and later documents and decks) is shown exactly as committed, in the adopter's brand from `discovery/brand/design.md`. Theming the chrome in the adopter's tokens is a P2 option, not a v1 requirement.
- **P7. Zero real PII.** Same hard stop as the harness. The console never renders floor catalog C (lives-on-the-floor) content, because that content never enters the tree.

## 5. Scope

### v1 (MVP): discovery oversight for one repository

| ID | Requirement | Acceptance |
|---|---|---|
| CON-01 | **Overview**: maturity ladder; counts for BrainKit, regulated context, runs and approvals; runs across the double diamond; needs-attention list; integrity checks; portfolio by strategic intent; record trail | Every number traces to a field in `console.json`; each attention item names an owner resolved from the registry |
| CON-02 | **Needs attention** is computed, never typed, from these rules: a gate failing on a reached stage; uncovered risks in live runs; approval rows from `approval-status` aggregated by change; runs awaiting reaction; NPA conditions with no record of being met; obligations pending owner verification; demo stand-in citations; radar reviews due within 30 days; unnamed seats for a profile a run uses; Factory Floor blocked | Adding or removing the triggering record adds or removes the item; there is no hard-coded item |
| CON-03 | **The brain**: BrainKit sections with digests, owners, approvals and the brainkit-check result; register categories, risks and controls; obligations table (owner role, holders, last verified, citation status, citing runs); product profiles with run counts; strategic intents; radar; runs × context matrix | brainkit-check result shown as an executed check; citation status is one of `cited`, `owner-verification-pending`, `demo-stand-in`, `missing` |
| CON-04 | **Discovery runs**: one row per run with stage track, gates (pass, failing, not reached), prototype, PRD or outcome, status and sponsor; filter by status; product-owner filter by sponsor | The stage algorithm is the one in §7.3; the filter never hides a run from a role that asks to "show all" |
| CON-05 | **Run detail**: stage track; the full gate table with issues; the embedded committed wireframe with its prototype digest and reaction binding (bound, stale or none); PRD summary from `handoff.md` or the stop from `outcome.md`; NPA decision and conditions; hypotheses with per-stakeholder verdicts; data-governance verdict with risks, controls, obligations and uncovered risks; next step with the exact validator command | A stale reaction binding shows `STALE`; the wireframe shown is byte-identical to the committed `wireframe.html` |
| CON-06 | **Installation**: bundle version, tier and adoption date; seams mounted; hooks wired; CI steps; governance decisions (HG) with their catalog state; installed reviewer agents | Read from `.loom/adoption.json`, `.claude/settings.json`, `.github/workflows/*`, `control-catalog.json` |
| CON-07 | **Role lens**: a "viewing as" switch for the §3 roles. For each role: a banner with the registry holders, three questions each linked to where the console answers them, where the role decides (HG citation with catalog state), and a "not here yet" gap. Relevant sections are highlighted, others dimmed, and the role's attention items come first. Deep link `#as-<role>` | Switching roles never changes the data, only emphasis and ordering; every role can see everything |
| CON-08 | **Integrity checks** the gates don't make: sponsors not in the registry, intents not in the BrainKit, unknown product profiles, stale reactions | Each has a negative test (`console.test.mjs`) |
| CON-09 | **Provenance UI**: every fact has a tag showing kind and file; clicking copies the path; a legend at the top | P2 test |
| CON-10 | **Build and publish**: `loom-console build --repo <installation> --out <dir>` produces a static site; a job in the adopter's CI (or a MiddleLeap-provided workflow) runs it on every merge to the default branch and publishes to an adopter-hosted, access-controlled location. `loom-console serve` runs it locally, read-only, on 127.0.0.1 | Site footer shows the reader, schema version, commit and time; a failed build keeps the last good site and flags it |

### Not in v1

- Delivery-half views: change envelopes, Q1–Q5, the evidence bundle, the external record join. These are P3.
- Portfolio metrics: cycle time per stage, cost per run (`flow-report`, `token-report`). These are P4.
- Several repositories in one estate. This is P5; the `brainkit-registry.json` adoption inventory is the join.
- Any write, comment, approval or notification.
- Viewer identity inside the console. Access control is the hosting layer's job in v1.

## 6. Architecture

```
  any Loom installation (a bank's repository, the system of record)
     │  discovery/runs/*, institution/brainkit/*, docs/governance/*, profiles/*, .loom/*, .claude/*, .github/*
     │  + the installation's OWN gate code: discovery/gates/validate.mjs, lib.mjs, scripts/approval-status.mjs
     ▼
  apps/loom-console/src/data.mjs     reads the tree; imports and runs the installation's gates;
     │                               tags every fact; writes nothing into the installation
     ▼
  console.json  (loom.console/v1)    the contract between the reader and any UI
     │
     ├── src/build.mjs   → static site: index.html, app.js, app.css, console.json, artifacts/<run>/wireframe.html
     └── src/serve.mjs   → local server on 127.0.0.1: GET/HEAD only, re-reads on refresh, serves only the
                           UI, the data and the wireframes the data names
```

**Standalone, not in the plugin.** The console sits on top of any installation and ships separately from `middleleap-loom`. That has four consequences:

- **The plugin stays a method.** It has no UI dependencies and no hosting concerns.
- **The console runs the installation's own gates.** It never uses a second copy bundled with the app, so it shows exactly what that installation's gates say, at that installation's Loom version.
- **One console build serves many installations,** including different Loom versions. The reader refuses a tree that isn't an installation, and names the missing modules.
- **Release cadences are separate.** A console release never forces a plugin bump, and the reverse.

**Zero dependencies.** Pure Node (≥ 20) and a vanilla ES-module UI, following the harness constraint. The UI has a strict CSP (`default-src 'self'`, no external host, no forms). It loads no web fonts, so the MiddleLeap faces fall back to the system stack unless they are installed.

**Static-first.** The build is plain files, hostable wherever a bank serves internal static content. A static build from CI is exactly as current as the last merge, which is the only currency the record has anyway. The local server exists for a facilitator's laptop during a session; it is not a hosted service. If a hosted, multi-user service is ever wanted (identity-aware lens, subscriptions), it is a new component over the same `console.json` contract: P2.

## 7. Data contract (`loom.console/v1`)

### 7.1 Top level

`schema`, `generated_at`, `generator`, `authority: "none"`, `repository` (commit, branch, or a note when not a git checkout), `institution`, `identities`, `brainkit`, `registers`, `control_catalog` (ladder, counts, governance HG list, controls below validated), `product_profiles`, `runs[]`, `signals[]`, `changes[]`, `approvals` (rows, SLA), `installation`, `trail[]`, `integrity`.

### 7.2 A run

`slug`, `title`, `statement`, `sponsor{id,resolves,source}`, `strategic_intent{id,resolves,source}`, `product_profile{id,resolves,source}`, `status`, `stage{id,name}`, `blocked_by[]`, `artifacts{}`, `gates[{id,name,status,reached,issues,verdict?}]`, `gates_ok`, `signals{count}`, `hypotheses[{id,text,reactions[],verdict}]`, `prototype{brief,wireframe,digest,reaction_bound_to,reaction_binding}`, `data_governance{verdict,risks,controls,obligations,uncovered}`, `handoff{…}`, `outcome{…}`, `npa{…}`, `synthetic`.

### 7.3 Derivation rules (the only non-record logic; each must stay documented and tested)

- **Stage** = the first stage not complete. A stage is complete when its artifact exists and every gate that judges it passes. Stages and their gates: 1 Signals (D2), 2 Synthesis (D5), 3 Problem (D1 D3 D4), 4 Data & risk (D6), 5 Prototype (D7 D8), 5b Reaction (D9), 6 Hand-off.
- **Reached**: a gate is reached when the artifact it judges exists. D2 is reached once a synthesis or problem statement exists; D4 and D7 are always reached.
- **Status**:
  - `stopped` if `outcome.md` exists
  - `handed-off` if `handoff.md` exists and all gates pass
  - `gate-failing` if the current stage's artifact exists and one of its gates fails while reached
  - `awaiting-reaction` if a prototype exists with no reaction
  - otherwise `in-progress`
- **Reaction binding**: `bound` if the reaction's `prototype_digest` equals the recomputed digest; `stale` if it differs; `none` if there's no reaction.
- **Citation status**: `demo-stand-in` if the article reads "demo fixture"; `owner-verification-pending` if the article says it is to be verified; `cited` otherwise.

### 7.4 Compatibility

The schema is versioned. Additive fields are allowed within `v1`; anything removed or renamed means `v2`. The renderer refuses a major version it doesn't know.

## 8. Security, privacy, compliance

- **Authority**: no write path, no token, no outbound call. The generated site has no forms and no script that reaches the network, and its CSP forbids connections.
- **Access**: the console shows what repository read access already shows. Host it behind the same SSO group as repository readers. A run the institution treats as restricted stays out of the console by staying out of the repository branch the console builds from.
- **Residency**: the site is built and hosted inside the adopter's environment. Nothing leaves it. MiddleLeap never hosts an adopter's console.
- **PII**: runs are synthetic in the demo, and the `pii-guard` hook protects the tree. The console adds no data the tree doesn't hold, and catalog-C floor notes never reach it.
- **Brand gate**: console output must pass D7 (tokens only, marker present), the same as any wireframe.

## 9. The console's own tests (in the app, not in the plugin's gates)

The console adds no gate to an installation. Its guarantees are tested in `apps/loom-console/test/` and run in the ai-dlc CI:

| Test | Fails when |
|---|---|
| Portfolio agreement (`data.test.mjs`, built) | a Meridian run's status, stage or gate states differ from `portfolio.json` and the validator |
| Provenance (`data.test.mjs`, built) | any fact lacks one of the four kinds, or a `record` source doesn't exist |
| Integrity negatives (`data.test.mjs`, built) | an unregistered sponsor or a stale reaction goes unreported |
| Not-an-installation (`data.test.mjs`, built) | a non-Loom tree is read instead of refused by name |
| Build fidelity (`app.test.mjs`, built) | an embedded wireframe differs from the committed asset |
| No network (`app.test.mjs`, built) | the page references an external host, has a form, or fetches anything but `console.json` |
| Read-only server (`app.test.mjs`, built) | any method other than GET/HEAD succeeds, or a path outside the UI, data and named wireframes is served |
| Schema (P1) | `console.json` doesn't validate against `schemas/console.v1.json` |
| Version matrix (P1) | the reader fails on an installation adopted at the previous supported Loom version |

## 10. Phasing

| Phase | Content | Exit criterion |
|---|---|---|
| **P0: done** | `apps/loom-console`: reader, static build, local server, demo, web UI, 15 tests; the Meridian portfolio fixtures in the plugin's demo | `loom-console demo` serves the Meridian console; tests green in the ai-dlc CI |
| **P1: MVP** | JSON Schema for `loom.console/v1`; a reusable CI workflow an adopter drops in to build and publish; the version matrix test; the needs-attention rules as a documented, tested module; deep links per role and per run; accessibility pass | A second line user answers "what is waiting on me and for how long" without a facilitator, on the Meridian tree and on one real adopter tree |
| **P2: role lens from identity** | Default the lens from the viewer's identity via `docs/governance/identity-map.json` at the host (SSO subject → registry id → roles); per-role subscription digests (email or chat) generated from the same data, still read-only | A viewer lands on their own role without choosing it |
| **P3: delivery half** | Changes and PA1/PA2 queues per change; Q1–Q5; the evidence bundle; the `record-join.mjs` join to the external record (Kosli) | Audit re-performs one change end to end from the console's links |
| **P4: portfolio metrics** | Cycle time per stage (`flow-report`), cost per run (`token-report`), the business-case value line | ExCo's "not here yet" gap is closed |
| **P5: estate** | Several repositories aggregated through the BrainKit registry's adoption inventory | One console for all Meridian repositories that pin the BrainKit |

## 11. Success measures

| Measure | Baseline | Target |
|---|---|---|
| A non-technical stakeholder answers "where is run X, is there a prototype, where is the PRD" | needs the facilitator and a terminal | under one minute, unaided |
| Oversight questions routed through the facilitator in a pilot fortnight | counted in the first week of pilot | halved |
| Facts on screen without a provenance tag | n/a | zero (gate) |
| Disagreements between console and validator | n/a | zero (gate) |
| Time from merge to the updated console | n/a | one CI run |

## 12. Decisions for Michael

- **D1: where it ships. Decided (24 Sep).** A standalone app in the ai-dlc repository (`apps/loom-console`), on top of any Loom installation, separate from the plugin. Still open: whether it's distributed to adopters as source, as a published package, or only through MiddleLeap engagements.
- **D2: hosting pattern to document first.** GitHub Pages (enterprise, private), an S3/CloudFront bucket behind the bank's IdP, or the bank's internal portal. *Recommendation:* document one pattern generically (static site behind the IdP) and one worked example.
- **D3: the programme-owner role.** It isn't in the registry template. Add it (read-only, no approval rights), or leave the persona outside the registry. *Recommendation:* add it, so the console never shows a persona the institution can't hold anyone to.
- **D4: ages without git history.** Ages come from records (`state_history`, `decided_at`). Using git commit dates would give every artifact an age but ties ages to rebases. *Recommendation:* records first, and git dates as `derived` only when the record has none.
- **D5: form. Decided (24 Sep).** A standalone app: zero-dependency Node reader, static build, local read-only server, vanilla UI (§6). A hosted multi-user service is deferred to P2.

## 13. What building P0 surfaced (tracked, each with an owner)

| Finding | Owner | Where |
|---|---|---|
| The five Open Finance obligations name a source and leave the article to the owner. The earlier hand-built mock said "six" | compliance, data-protection, information-security, operations | `open-finance-obligations.json` |
| Ten template obligations carry a demo stand-in citation in the demo tree | compliance | the demo setup, as in the CI dry-run |
| No signed record exists for any hand-off sign-off; the earlier mock showed sponsor and second-line sign-offs that weren't in the tree | — | removed from the console; approval-attestation fixtures if wanted |
| The `finance-treasury` approver role on CHG-2026-0042 is held by no human | institutional-context-owner | `identities.json` |
| The five Shari'ah seats are still `ADOPT:` placeholders while a run uses `islamic-product` | institutional-context-owner, shariah-compliance | `identities.json` |
| Template operations signals (OPS-2026-001…004, example.com links) remain in the adopted tree | operations | the adopter replaces them |
| No reviewer agent definitions are installed as `.md` in `.claude/agents` in the adopted tree | platform-admin | the copy manifest keeps agent definitions hand-copied |
| The facilitator commands the mock showed (`/develop <slug>`) don't exist; the skills take no arguments | — | fixed: the console shows the real validator command and names the skill |

## 14. Implementation notes

```
apps/loom-console/
├── bin/loom-console.mjs   CLI: data | build | serve | demo
├── src/data.mjs           the reader → loom.console/v1 (loads the installation's own gate modules)
├── src/build.mjs          static site
├── src/serve.mjs          local read-only server (127.0.0.1, GET/HEAD)
├── src/demo.mjs           the Meridian Trust demo installation (adopt + mountMeridian + mountEstate)
├── web/                   index.html, app.js, app.css; renders only from console.json
├── test/                  data.test.mjs, app.test.mjs
└── docs/                  PRD.md (this file), prototype.html (a published snapshot)
```

- Run: `node apps/loom-console/bin/loom-console.mjs demo` (serve) or `… demo --out <dir>` (build). Over a real installation: `… serve --repo <path>` or `… build --repo <path> --out <dir>`.
- `--now <ISO>` pins the clock for reproducible ages in tests and demos.
- Tests: `node --test apps/loom-console/test/*.test.mjs` (run in the ai-dlc CI).
- The Meridian fixtures stay in the plugin's demo (they're the worked example of the method). The console only reads them through `src/demo.mjs`.
- Constraints: pure Node, zero dependencies, deterministic, no network. The console never writes into an installation.
