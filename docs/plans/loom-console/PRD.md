# The Loom Console: PRD

| | |
|---|---|
| **Status** | Draft v0.1 for implementation · 24 Sep 2026 |
| **Owner** | Michael Hartmann (MiddleLeap) |
| **Plugin** | `middleleap-loom` 2.4.10 (branch `claude/meridian-dense-demo`) |
| **Prototype** | `docs/plans/loom-console/prototype.html`, generated from the Meridian demo tree |
| **Data contract (P0, built)** | `plugins/middleleap-loom/skills/loom-adopt/harness/scripts/console-data.mjs` → `loom.console/v1` |
| **Tests (P0, built)** | `demo/meridian/console.test.mjs`, `demo/meridian/scenario.test.mjs` |

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

- **P1. Generated, never written.** Every value on screen comes from `console-data.mjs` reading the tree. Nothing is typed into the page. *Test:* the page renders only from `console.json`, and a fixture run's state in the console equals its declared state (`console.test.mjs`).
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
- **P6. The adopter's brand.** The console renders from the adopter's `discovery/brand/design.md` tokens and carries the D7 marker, so Meridian sees Meridian. The MiddleLeap brand appears only on MiddleLeap's own material.
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
| CON-10 | **Build and publish**: CI builds `console.json` and the static site on every merge to the default branch, and publishes to an adopter-hosted, access-controlled location | Site footer shows the generator, schema version, commit and time; a failed build keeps the last good site and flags it |

### Not in v1

- Delivery-half views: change envelopes, Q1–Q5, the evidence bundle, the external record join. These are P3.
- Portfolio metrics: cycle time per stage, cost per run (`flow-report`, `token-report`). These are P4.
- Several repositories in one estate. This is P5; the `brainkit-registry.json` adoption inventory is the join.
- Any write, comment, approval or notification.
- Viewer identity inside the console. Access control is the hosting layer's job in v1.

## 6. Architecture

```
  repository (system of record)
     │  discovery/runs/*, institution/brainkit/*, docs/governance/*, profiles/*, .loom/*, .claude/*, .github/*
     ▼
  scripts/console-data.mjs            ← P0, built. Pure Node, zero dependencies, read-only.
     │  runs validate.mjs and brainkit-check, reads approval-status, tags every fact
     ▼
  console.json  (loom.console/v1)     ← the contract; JSON Schema in P1
     │
     ▼
  discovery/render/render.mjs console ← P1. A fourth renderer surface beside document, deck, prototype.
     │  static HTML from design.md tokens + D7 marker; embeds committed wireframes; no network
     ▼
  static site, adopter-hosted         ← P1. CI publishes on merge; access via the bank's SSO at the host
```

**Decision A (recommended): static-first, zero dependencies.** The console is the fourth surface of the existing discovery renderer. This keeps the harness's no-dependency constraint and its D7 brand gate, and it can be hosted anywhere a bank already hosts internal static content. The option of an interactive app (React or similar) reading the same `console.json` stays open, because the contract is the boundary.

**Why not a live server first:** a server that reads the repository becomes a system with credentials, uptime and its own threat model. A static build from CI is exactly as current as the last merge. That is the only currency the record has anyway.

**Local mode (P1, small):** `node scripts/console-data.mjs --out .loom/console.json && node discovery/render/render.mjs console .loom/console.json .loom/console.html` lets a facilitator open the console on a laptop during a session. No server needed.

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

## 9. Gates the console adds (P1)

| Gate | Fails when |
|---|---|
| `console-schema-check` | `console.json` doesn't validate against `schemas/console.v1.json` |
| `console-provenance` | any fact lacks a provenance kind, or a `record` source doesn't exist |
| `console-agrees-with-gates` | a run's gate states in `console.json` differ from a fresh validator run |
| D7 on the console output | a raw colour or font, or no marker |

## 10. Phasing

| Phase | Content | Exit criterion |
|---|---|---|
| **P0: done** | `console-data.mjs`, the four provenance kinds, integrity checks, `console.test.mjs`, the Meridian portfolio fixtures, the hand-built prototype rendering the generated data | 11 console tests and 14 scenario tests green; prototype published |
| **P1: MVP** | JSON Schema; `render.mjs console` surface (port the prototype's views to token-only output); local mode; CI job to build and publish; the §9 gates; `--role` deep links | A second line user answers "what is waiting on me and for how long" without a facilitator, on the Meridian tree and on one real adopter tree |
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

- **D1: where it ships.** Inside `middleleap-loom` for every adopter (the generator already does), or the renderer surface and hosting pattern as a MiddleLeap offering on top. *Recommendation:* the generator and renderer ship in the plugin; hosting, SSO wiring and the estate view are MiddleLeap engagement work.
- **D2: hosting pattern to document first.** GitHub Pages (enterprise, private), an S3/CloudFront bucket behind the bank's IdP, or the bank's internal portal. *Recommendation:* document one pattern generically (static site behind the IdP) and one worked example.
- **D3: the programme-owner role.** It isn't in the registry template. Add it (read-only, no approval rights), or leave the persona outside the registry. *Recommendation:* add it, so the console never shows a persona the institution can't hold anyone to.
- **D4: ages without git history.** Ages come from records (`state_history`, `decided_at`). Using git commit dates would give every artifact an age but ties ages to rebases. *Recommendation:* records first, and git dates as `derived` only when the record has none.
- **D5: static renderer vs app for P1.** *Recommendation:* static renderer, per §6.

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

- Generator: `scripts/console-data.mjs [--out <file>] [--now <ISO>] [--pretty]`. Run from the repo root. `--now` pins the clock for tests and demos.
- Demo tree: `adopt.mjs --tier full`, then `mountMeridian(A)` and `mountEstate(A)` from `demo/meridian/mount.mjs`. The estate adds the approved BrainKit 1.0.1 and CHG-2026-0042.
- Prototype build: generate `console.json` from the demo tree, embed it and the committed wireframes into `prototype.html`. For P1 this becomes the renderer surface.
- Tests: `node --test demo/meridian/console.test.mjs demo/meridian/scenario.test.mjs`.
- Constraints carried from the harness: pure Node, zero dependencies, deterministic, no network; the discovery-sync ledger for anything under `harness/discovery/`; version bump in both `plugin.json` and `marketplace.json`.
