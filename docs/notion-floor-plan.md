# The Factory Floor plan — integrating Notion into the Loom

**Status:** proposed · **Date:** 2026-07-25 · **Owner:** middleleap-loom plugin / adopting team
**Companions:** `docs/research/notion-software-factory-collaboration-2026-07.md` (the research
this plan executes — governing rules §4.1, storage split §6, template catalog §6c) ·
`docs/loom-factory-floor.html` (the interactive visualization of the target state).

The central intent:

> Give the not-so-technical teammates — product, stakeholders, second line, architects wearing
> hats — a guided, user-friendly surface (Notion, "the floor") over the Loom, without a single
> control, artifact of record, or approval authority leaving git.

And the central disciplines, inherited from the research and the control-plane plan: **git is
the system of record; decisions and frozen drafts come home by PR; observed, not declared;
agents approve nothing; no new gates before the control-plane foundations land.**

## 0 · Goals — what done looks like

Six goals define success. Each carries a measure that is **demonstrated, not asserted**, and
the milestone (§4) at which it is proven. A milestone is not done until its goals' measures
have been shown.

| # | Goal | Measure | Proven at |
|---|---|---|---|
| **G1** | **Non-technical teammates never touch git.** A PM authors the PRD, a stakeholder reacts, a second-line approver decides — entirely on the floor. | The M2 demo runs with the PRD author and the PA1 approver never opening GitHub; every field a gate will check is reachable through a guided template. | M2 |
| **G2** | **Zero loss of control.** The integration changes no gate, no compiled approver set, no CODEOWNERS line — enforcement is identical with the floor present or absent. | Gate set and CODEOWNERS diff-empty against pre-integration; the four refusal scenarios (agent click void · role-less approver refused · release-hold write rejected · stale activation distrusted) pass in reality. | M4 (WS5 acceptance) |
| **G3** | **Every decision auditable end-to-end.** Any floor decision resolves to a registry identity, a signed envelope, and a merged PR. | An auditor walks a PA1 from approval page → envelope → gate verdict entirely inside git, without asking anyone. | M4 |
| **G4** | **Live shared visibility.** Current state — the queue, who is blocking, what has drifted — is visible without asking. | Projection fresh within 10 minutes of a merge; every compiled role's "waiting on me" dashboard populated (per *hat*, per the roles-not-headcount model). | M1 · M3 |
| **G5** | **Agents do the labour; humans do judgment.** Paperwork arrives prefilled; human input is judgment fields; blocks route to the right hat. | In the MVP demo, the majority of template fields arrive prefilled by floor-keepers or projection; a `blocked` item reaches the correct role inbox, not a broadcast notification. | M2 · M5 |
| **G6** | **Honesty preserved.** Nothing reads as more controlled than it is. | Adapter and projections show *declared vs active* truthfully in the scorecard; drift is always visible and never blocking. | Every milestone |

## 1 · Scope and non-goals

**In scope:** a read-only projection of the governed repo into Notion; guided template pairs for
authoring and approvals; the freeze round-trip for discovery artifacts; decision routing with
signed envelopes; ops/MI surfaces; floor-keeper Custom Agents.

**Non-goals — refuse on sight:** Notion as system of record for anything a gate reads; any
write path from Notion into the control plane or `release-hold.json`; a Notion client bundled
into the harness core (sync machinery is adopter-side wiring, per the adapter contract); the
macro-ring "enterprise hub" (out of scope per `enterprise-rings.md`); new blocking gates.

## 2 · Prerequisites (do these before WS0 closes)

| # | Prerequisite | Detail |
|---|---|---|
| P1 | **Residency review first** (HG-0011) | A written record of what content classes may project to the SaaS floor. Default: references + status, never personal data; passport fields projected as summaries. Approved by data-protection + risk — as a signed record in git. This gates everything. |
| P2 | Notion workspace, **Business/Enterprise tier** | Custom Agents + connectors need it; budget the credits. |
| P3 | **Integration token, vaulted** | Internal integration; REST API pinned to **2025-09-03** (data-source model). Do **not** build on the hosted MCP (not headless) or the self-hosted MCP (sunset risk). |
| P4 | **Sync identity registered** | `svc-floor-sync` added to `identities.json` as builder-class, **no approval role**; its ed25519 key registered in `attestation-issuers.json`. CODEOWNERS untouched. |
| P5 | **Hosting decision for the sync worker** | Options: Notion Workers · adopter CI job · small service. Record as an ADR — it is the first entry in the new ADR template. |

## 3 · Workstreams

Sequencing: **WS0 → WS1 → (WS2 ∥ WS3) → WS4 → WS5 → WS6.** Each workstream lists deliverables
and the acceptance test that closes it. Sizes: S (≤1 day), M (days), L (a week-plus, agent-driven).

### WS0 — Foundations & residency *(S–M; blocks everything)*

- **D0.1** Residency review record (P1) — in git, signed.
- **D0.2** Registry + issuer entries for `svc-floor-sync` (P4).
- **D0.3** Workspace scaffold: one teamspace; empty databases — Changes, Backlog (mirror),
  Approvals, Signals, Discovery Runs, Notes; role dashboards stubbed; the shared
  **freeze/drift block** defined (`frozen at <sha> · vN · drift`).
- **Acceptance:** residency record merged; token in vault; a walkthrough of the empty workspace
  makes sense to a non-technical reader without explanation.

### WS1 — Read-only projection *(M; = research Phase 0, zero governance risk)*

- **D1.1** Sync worker v0: one-way git → Notion on merge to main (CI-triggered), mirroring
  `docs/backlog.yaml`, `change-envelope.json` state, and the decision log into their databases.
- **D1.2** Board/timeline views over the backlog mirror; the agent activity feed; MI v0.
- **D1.3** Freeze/drift block rendered display-only on mirrored pages.
- **Acceptance:** a merged change to `backlog.yaml` appears on the board within minutes; **no
  floor→git write path exists** (verified by inspection: the token's integration has no
  git-side counterpart yet); stakeholder demo done.

### WS2 — Git-side template gaps *(S–M; upstream to this repo; parallel with WS3)*

The two contracts the catalog exposed as missing, plus the registry finding:

- **D2.1** **ADR template** — add to the loom-adopt bundle (delivery-side template: context ·
  options considered · decision · consequences · status), wire into `copy-manifest.json`, and
  reference it from `next-story` (the loop drafts *into* it when parking a story).
- **D2.2** **Solution Direction Record template** — formalize what the Develop skill describes
  (directions · judgment vs D1 measures + inherited D6 conditions · convergence rationale);
  same manifest wiring.
- **D2.3** **Architect roles** — add `enterprise-architect` and `solution-architect` to
  `identities.template.json` (and the Meridian example), eligible in compiled approver sets.
- **Process:** these are plugin changes → bump `middleleap-loom` version in **both**
  `plugin.json` and `marketplace.json`; run `node scripts/validate-marketplace.mjs`; respect the
  `loom-adopt` ↔ `ofbo` drift note in CLAUDE.md.
- **Acceptance:** validator green; CI adoption dry-run green; `SKILL.md` copy table regenerated
  (doc-integrity gate green).

### WS3 — Template pairs, authoring suite *(M–L; needs WS0, informs WS4)*

- **D3.1** **Template-parity generator + check**: a script that reads a git template's section
  structure and emits the Notion database/page-template definition (applied via the API), plus
  a doc-integrity-style **parity check** comparing section lists — CI-runnable, so the pairs
  cannot drift silently.
- **D3.2** **Discovery suite** (catalog A): problem statement, research log (database),
  synthesis, data governance (with the projected risk-register relation), prototype,
  stakeholder reaction, hand-off/PRD with the live freeze checklist. Required-field parity: any
  field a D-gate checks is a required property.
- **D3.3** **Floor-only suite** (catalog C): meeting/workshop notes (stable ids +
  cite-into-research-log relation), interview note (pseudonym field, consent checkbox, "no
  identifying details" banner), product brief, roadmap.
- **Acceptance:** a test discovery run authored entirely on the floor produces, via manual
  export, files that pass D1–D9 on the harness's example content; parity check green in CI.

### WS4 — The freeze round-trip *(M; needs WS1 + WS3)*

- **D4.1** Freeze path: Notion page → Notion-flavored Markdown export →
  `discovery/runs/<slug>/` → **PR opened by `svc-floor-sync`** → D-gates run in CI → on merge,
  the page's freeze block is stamped (`frozen at <sha> · vN`).
- **D4.2** Drift detection: scheduled compare of `last_edited_time` + content digest against
  the freeze record → drift property flips to *ahead of record*. **Drift never blocks.**
- **Acceptance:** end-to-end freeze of a sample run; a post-freeze edit raises the badge within
  the schedule; `svc-floor-sync` **cannot merge its own PR** (branch-protection probe, recorded);
  gates read only the frozen file.

### WS5 — Decision routing *(M–L; needs WS4; = research Phase 1 round-trip)*

- **D5.1** Approvals database + **PA approval page** template: one section per compiled role,
  people-property resolving to registry identities, **evidence carried in** (change summary,
  gate results, decision-log excerpt — assembled by a floor-keeper, not by the approver).
- **D5.2** Decision webhook → envelope drafting (`approval-attestation` kind: change id, role,
  registry identity, timestamp, page provenance) → **signed by the registered issuer** → PR
  into `docs/governance/` → **second-line human merges** (CODEOWNERS).
- **D5.3** **`notion-approvals` adapter** declared at `docs/governance/adapters/` mapping to
  the PA controls / HG-0001; ships **"declared, not active"** until the first real signed fetch
  + bypass test (the probe: the sync attempts to write `release-hold.json` → refused; recorded
  as activation evidence).
- **D5.4** ADR inbox card + SDR flow (catalog B): the loop's drafted ADR renders as the
  solution architect's decision card; the decision returns as the merged ADR.
- **Acceptance:** a simulated PA1 with test identities lands envelopes that
  `product-approval-check` accepts; **all four refusal scenarios from the visualization pass in
  reality** — an agent's click is void, a role-less approver is refused at drafting, the
  release-hold write is rejected by the platform, a stale activation is distrusted by the gate.

### WS6 — Ops, MI, and the floor-keepers *(M; needs WS5; = research Phase 3)*

- **D6.1** Operations-signal intake form → typed/rated/routed entries → PR round-trip into
  `operations-signal.json`, passing its check.
- **D6.2** MI dashboard: rollups over the projected sealed-evidence bundle for the
  accountable-executive and second-line views.
- **D6.3** **Floor-keeper Custom Agents**, write scope views + conversation only: approval-page
  evidence assembly, inbox routing on compiled-role waits, drift nudges, blocking-approver
  nudges, thread → draft-research-log summaries. Their configs documented in the workspace;
  none holds a registry role.
- **Acceptance:** a filed signal exits triage traceable end-to-end; MI reflects the last sealed
  bundle; a floor-keeper's attempted approval is demonstrably void.

## 4 · Milestones

| Milestone | Contents | Proves |
|---|---|---|
| **M1 — The mirror** | WS0 + WS1 | The floor exists; zero governance risk |
| **M2 — The MVP demo** | + D3.2 (PRD + data governance) + D4.1 + D5.1/D5.2 (PA1 only) | The whole story on three templates: guided authoring → freeze → gate → routed decision → signed envelope |
| **M3 — Full authoring** | + rest of WS3, WS4 complete | Discovery lives on the floor |
| **M4 — Governed floor** | + WS5 complete (adapter active, not declared) | Approvals route with evidence; refusals real |
| **M5 — Closed loop** | + WS6 | Signals and MI close the arc back to Discovery |

## 5 · Open decisions (each becomes an ADR — the template's first customers)

1. **Sync worker hosting** (P5): Notion Workers vs CI job vs small service — trade: latency vs
   operational surface vs credentials locality.
2. **Freeze trigger UX**: an explicit "freeze" action by the facilitator vs gate-moment
   automation — recommend explicit (a freeze is a human intent, and it matches "the PR is the
   light switch").
3. **Projection cadence**: on-merge CI push vs schedule — recommend on-merge push + hourly
   reconcile.
4. **Notion API risk posture**: the 2025-09-03 data-source model is pinned; revisit on Notion's
   next dated API version; the self-hosted MCP is not a dependency.

## 6 · Risks carried from the research (do not re-litigate, re-read)

Appearance-of-control · comprehension-debt acceleration (the evidence-carried-in rule is the
mitigation and is **load-bearing** in D5.1) · system-of-record temptation · residency/PII
(HG-0011 — P1 gates the plan) · platform movement · cost/tier. See research doc §8.

## 7 · Verification, plan-wide

- **The goal measures (§0) for the milestone under review are demonstrated, not asserted** —
  a milestone review opens with its goals' measures shown live.
- Every workstream's acceptance test, plus: the **honesty rule** — the adapter and every
  projection ships *declared, not active* until its first real observed evidence, and the
  scorecard says so.
- The three uncollapsible lines hold at every milestone: builders ∩ second-line = ∅; agents
  approve nothing (floor-keepers included); a second human at every merge — including the sync
  worker's PRs.
- `node scripts/validate-marketplace.mjs` green on every upstream (WS2) change, with plugin +
  marketplace version bumps.
