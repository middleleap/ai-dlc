# The Factory Floor plan — integrating Notion into the Loom

**Status:** v2 — revised per an external control review · **Proposed:** 2026-07-25 · **Revised:** 2026-07-25
**Review verdict:** **conditional go.** M1 and a clearly-labelled **non-authoritative** M2 are
approved. **WS5 (decision routing) is blocked for production** until the approval-identity and
subject-binding corrections in §0 land and pass an independent second-line review.
**Companions:** `docs/research/notion-software-factory-collaboration-2026-07.md` (governing
rules §4.1, storage split §6, template catalog §6c) · `docs/loom-factory-floor.html` ·
`docs/loom-notion-architecture.html` (how the three planes fit together) ·
`docs/notion-floor-alpha-walkthrough.md` (a simulated feature walked end to end — it found a real
PA1 defect, and §7 lists what it did **not** prove).

The central intent:

> Give the not-so-technical teammates — product, stakeholders, second line, architects wearing
> hats — a guided, user-friendly surface (Notion, "the floor") over the Loom, without a single
> control, artifact of record, or approval authority leaving git.

And the central disciplines, inherited from the research and the control-plane plan: **git is
the system of record; decisions and frozen drafts come home by PR; observed, not declared;
agents approve nothing; no new gates before the control-plane foundations land.**

## 0 · External review — verified findings (the facts v2 stands on)

Every blocking claim was verified against the harness source before this revision was written:

| # | Review claim | Verdict | Evidence |
|---|---|---|---|
| **F1** | The signature authenticates the worker, not the human approver | **Holds** | `core/attestations.mjs` (`verifySignatureOver`) resolves a registered issuer and cryptographically verifies its key over the payload — nothing binds the payload to a human subject. A bridge-signed envelope proves the bridge signed, not that the named human decided |
| **F2** | The approval is not bound to the exact thing approved | **Holds** | v1's envelope (change id · role · identity · timestamp · page provenance) omits stage/outcome, `plan_hash`, content digests, source sha, event id, nonce, schema version and expiry — evidence could change after the click while the old approval still verifies |
| **F3** | `product-approval-check` cannot validate the proposed envelopes | **Holds** | The gate resolves passport entries to humans holding the compiled roles (plus builder/second-line separation); it reads no attestations at all. WS5 requires an explicit extension of the existing PA gate |
| **F4** | The adapter activation model conflates controls | **Holds** | `adapter-check.mjs` enforces a singular `satisfies_control` per adapter; and a refused `release-hold.json` write proves platform protection (HG-0001/0002-style), not that a Notion approval was authentically issued |

**Corrections adopted throughout v2:** the bridge is a **transcriber/proposer, never the
approval issuer**; a human decision is valid only through a **subject-bound assertion
independent of the bridge**; the envelope binds to the **exact approved subject**; the PA gate
is **extended before** decision routing ships; activation evidence **splits into four separate
streams**, one control each.

## 1 · Goals — what done looks like

Six goals define success. Each carries a measure that is **demonstrated, not asserted**, and
the milestone (§5) at which it is proven. A milestone is not done until its goals' measures
have been shown.

| # | Goal | Measure | Proven at |
|---|---|---|---|
| **G1** | **Non-technical teammates never touch git.** A PM authors the PRD, a stakeholder reacts, a second-line approver decides — entirely on the floor. | The M2 demo runs with the PRD author and the PA1 approver never opening GitHub; every field a gate will check is reachable through a guided template. | M2 |
| **G2** | **Zero loss of control.** The integration changes no gate's verdict authority, no compiled approver set, no CODEOWNERS line — enforcement is identical with the floor present or absent. | Gate set and CODEOWNERS diff-empty against pre-integration (the PA-gate *extension* strengthens, never relaxes); the full negative suite passes in reality: agent/bot approval rejected · unregistered human rejected · role-less approver refused · release-hold write rejected · stale activation distrusted · replay rejected · post-decision mutation detected. | M4 (WS5 acceptance) |
| **G3** | **Every decision auditable end-to-end.** Any floor decision resolves to a registry subject, a subject-bound assertion, a signed envelope, and a merged PR. | An auditor walks a PA1 from approval page → assertion → envelope → extended-gate verdict entirely inside git, without asking anyone. | M4 |
| **G4** | **Live shared visibility.** Current state — the queue, who is blocking, what has drifted — is visible without asking. | Projection fresh within 10 minutes of a merge; every compiled role's "waiting on me" dashboard populated (per *hat*, per the roles-not-headcount model). | M1 · M3 |
| **G5** | **Agents do the labour; humans do judgment.** Paperwork arrives prefilled; human input is judgment fields; blocks route to the right hat. | In the MVP demo, the majority of template fields arrive prefilled by floor-keepers or projection; a `blocked` item reaches the correct role inbox, not a broadcast notification. | M2 · M5 |
| **G6** | **Honesty preserved.** Nothing reads as more controlled than it is. | Adapter and projections show *declared vs active* truthfully in the scorecard; every non-authoritative surface is unmistakably labelled; drift is always visible and blocks new claims (§4 WS4) without invalidating merged records. | Every milestone |

## 2 · Scope and non-goals

**In scope:** a read-only projection of the governed repo into Notion; guided template pairs for
authoring and approvals; the freeze round-trip for discovery artifacts; decision routing with
subject-bound, signed envelopes; ops/MI surfaces; floor-keeper Custom Agents.

**Non-goals — refuse on sight:** Notion as system of record for anything a gate reads; any
write path from Notion into the control plane or `release-hold.json`; **the bridge signing an
approval into validity** (it transcribes and proposes, nothing more); **Notion Workers in the
authoritative approval path while they remain beta**; a Notion client bundled into the harness
core (sync machinery is adopter-side wiring, per the adapter contract); the macro-ring
"enterprise hub"; new blocking gates (the PA-gate change in WS2 is an extension of an existing
gate's verification, mandatory-when-compiled — not a new gate).

## 3 · Prerequisites (do these before WS0 closes)

| # | Prerequisite | Detail |
|---|---|---|
| P1 | **Residency review first** (HG-0011) | A written record of what content classes may project to the SaaS floor. Default: references + status, never personal data; passport fields projected as summaries. Approved by data-protection + risk — as a signed record in git. This gates everything. **Drafted** as `notion-floor-residency-review.md`, with a **reviewer's brief** (`notion-floor-p1-reviewer-brief.md`), a **sendable vendor questionnaire** (`notion-floor-p1-vendor-questionnaire.md`) and a **worked example of a signed P1** (`notion-floor-residency-review-example.md` — a specimen; it approves nothing) to move it. Two of its residual risks are *unratable* until vendor Q7/Q8 and Q2/Q4 come back. **Still unsigned: the gate is shut.** |
| P2 | Notion workspace, **Business/Enterprise tier** | Custom Agents + connectors need it; budget the credits — and note §4 WS6's graceful-degradation requirement: exhausted credits pause agents and Workers. |
| P3 | **Integration token, vaulted; API compatibility ADR due immediately** | v1 pinned REST API `2025-09-03`; the review reports the current version is already `2026-03-11`. The ADR (WS0 · D0.5) decides pin-vs-upgrade **before WS1**, not at some future version. Neither MCP variant is a dependency (hosted: not headless; self-hosted: sunset risk). |
| P4 | **Split identities, least privilege** | v1's single `svc-floor-sync` is replaced by four: **`svc-floor-projector`** (git read → Notion write, projection only) · **`svc-floor-freezer`** (Notion read → feature-branch/PR write: freeze exports, proposals) · **`svc-floor-bridge`** (webhook read + transcription only — **never signs approvals**) · an **independent observer** (a human platform role, separately keyed, who produces activation evidence). All registered in `identities.json` with no approval role; keys registered per identity; CODEOWNERS untouched. |
| P5 | **Hosting decision** | Recommendation revised: a **bank-controlled service** hosts the freezer and the bridge (identity, audit, credential locality); Notion Workers are acceptable for **projection only** while beta. Recorded as an ADR. |
| P6 | **Identity mapping + threat model** | The mapping **Notion person ID → immutable IdP subject → registry identity**, a per-identity capability matrix, a threat model for the seam, and the automated pre-egress filtering design. Delivered as WS0 · D0.4. |

## 4 · Workstreams

Sequencing: **WS0 → WS1 → (WS2 ∥ WS3) → WS4 → WS5 → WS6** — with one addition: **WS5 has an
entry gate** (F1–F4 corrections landed + independent second-line review) before anything it
produces counts as governed evidence.

### WS0 — Foundations, residency & threat model *(S–M; blocks everything)*

- **D0.1** Residency review record (P1) — in git, signed.
  → **drafted:** [`notion-floor-residency-review.md`](notion-floor-residency-review.md) ·
  *awaiting data-protection + risk-second-line sign-off, which gates WS1 onward*
- **D0.2** Registry + issuer entries for the **four split identities** (P4).
  → **bundle-side shipped** in loom `2.0.0-rc.13`: `svc-floor-projector`, `svc-floor-freezer`
  and `svc-floor-bridge` ship in `identities.template.json` holding **no** approval role; the
  observer is an existing platform-admin role. The adopter still registers their real keys.
- **D0.3** Workspace scaffold: teamspace; empty databases — Changes, Backlog (mirror),
  Approvals, Signals, Discovery Runs, Notes; role dashboards stubbed; the shared
  **freeze/drift block** defined. *(Blocked on P1.)*
- **D0.4** **Threat model + identity mapping** (P6): Notion↔IdP↔registry mapping, per-identity
  capability matrix, automated pre-egress filter design.
  → **drafted:** [`notion-floor-threat-model.md`](notion-floor-threat-model.md) (part 1) ·
  [`notion-floor-identity-mapping.md`](notion-floor-identity-mapping.md) (part 2)
- **D0.5** **API compatibility ADR** (P3) — immediate.
  → **drafted:** [`adrs/0001-api-compatibility.md`](adrs/0001-api-compatibility.md), with the
  four remaining open decisions as ADR-0002…0005 (§7).
- **Acceptance:** residency record and identity-mapping/capability matrix merged; tokens in
  vault; the empty workspace navigable by a non-technical reader without explanation.

### WS1 — Read-only projection *(M; = research Phase 0 — **no governance authority**)*

Not "zero risk": projection still carries residency, over-sharing, stale-data, token-custody
and availability risk — what it carries **none of** is governance authority.

- **D1.1** Projection v0 under **`svc-floor-projector` only**: one-way git → Notion on merge
  to main, mirroring `docs/backlog.yaml`, `change-envelope.json` state, and the decision log.
- **D1.2** Board/timeline views; the agent activity feed; MI v0.
- **D1.3** Freeze/drift block rendered display-only.
- **Acceptance:** a merged backlog change appears on the board within minutes; the projector's
  credentials **cannot write git** (capability-matrix probe, recorded); stakeholder demo done.

### WS2 — Upstream harness work *(M; this repo; parallel with WS3)*

- **D2.1** **ADR template** in the loom-adopt bundle (context · options · decision ·
  consequences · status), wired into `copy-manifest.json`; `next-story` drafts into it.
- **D2.2** **Solution Direction Record template**, same wiring.
- **D2.3** **Architect roles** (`enterprise-architect`, `solution-architect`) in
  `identities.template.json` + the Meridian example.
- **D2.4** **Approval-attestation schema v1** — the envelope binds to the exact approved
  subject: PA stage + outcome · `control_plan.plan_hash` · frozen passport/content digest ·
  source sha (PA1) or artifact/evidence digest (PA2) · Notion workspace/page/data-source ids ·
  event id + author subject + decision nonce · schema version + expiry/revocation state.
- **D2.5** **PA-gate extension** (F3): `product-approval-check` gains an envelope-verification
  path — when the compiled plan requires envelope-backed approvals, every approved passport
  entry must resolve to a **valid, non-replayed, subject-bound attestation** (schema D2.4).
  Mandatory-when-compiled; tightens, never loosens.
- **Process:** plugin changes → version bump in both `plugin.json` and `marketplace.json`;
  `node scripts/validate-marketplace.mjs`; respect the `loom-adopt` ↔ `ofbo` drift note.
- **Acceptance:** validator + adoption dry-run + doc-integrity green; D2.5 negative-tested
  with fixtures (unsigned, replayed, subject-mismatched envelopes all fail).
- **→ DELIVERED in loom `2.0.0-rc.13`.** `core/approval-attestations.mjs` (D2.4) with the
  two-signature contract that refuses a service key vouching for a human;
  `product-approval-check` extended, mandatory-when-compiled (D2.5);
  `assertion-issuers.template.json` as a registry deliberately separate from service keys;
  `delivery/templates/{adr,solution-direction-record}.md` wired into the manifest and the
  `next-story` / `develop` skills; `enterprise-architect` + `solution-architect` roles.
  Suite **433 green**, the full negative set among them, and the shipped worked example is
  signed against the bundled plan and passport so editing either breaks it. Nothing compiles
  the capability by default: the contract ships **declared, not active**.

### WS3 — Template pairs, authoring suite *(M–L; needs WS0; acceptance depends on D4.1)*

- **D3.1** Template-parity generator + CI parity check (section-list comparison).
- **D3.2** Discovery suite (catalog A) with required-field parity to the D-gates.
- **D3.3** Floor-only suite (catalog C) with built-in PII discipline.
- **Acceptance:** a test discovery run authored on the floor exports **through the real D4.1
  exporter** (not a manual export) into files that pass D1–D9; parity check green in CI.

### WS4 — The freeze round-trip *(M; needs WS1 + WS3)*

- **D4.1** **Deterministic exporter, failing closed**: Notion page → Notion-flavored Markdown →
  `discovery/runs/<slug>/` → PR by `svc-floor-freezer`. Unknown/unsupported blocks, truncated
  content, or permission gaps **abort the freeze** with a visible reason; the export digest is
  recorded in the freeze stamp.
  **→ the git half SHIPPED** in loom `2.0.0-rc.13`: `core/floor-export.mjs` is the conversion as a
  pure function — no network call, no clock, no vendor SDK — and `scripts/freeze-stamp-check.mjs`
  is the gate that catches a frozen artifact edited in place. Both halves of the worked example
  ship: a page that exports, and a page that must **abort**. `core/floor-fetch.mjs` adds the fetching half:
  it walks a page the way the API actually serves it — paginated block lists, children behind a
  separate call — and assembles the tree the exporter consumes. Still no network call in the
  harness: `request` is injected, so the token lives in the caller's closure. Proved against
  recorded response shapes; the digest a fetched page produces is **byte-identical** to the
  hand-authored one. What still needs a workspace is the live call and the PR-opening.
- **D4.2** **Drift, narrowed**: drift never retroactively invalidates the merged git record —
  but it **blocks new freeze and approval claims** against the out-of-sync page until
  re-frozen.
- **D4.3** **Webhook discipline**: webhooks are signals, not records — verify
  `X-Notion-Signature`, deduplicate on event id, refetch current state before acting; never
  assume ordering or exactly-once delivery.
- **Acceptance:** end-to-end freeze with sha-stamping; an unsupported-block fixture fails
  closed; a post-freeze edit raises the badge *and* blocks a second freeze until re-frozen; a
  replayed webhook is a no-op; the freezer **cannot merge its own PR** (probe, recorded).

### WS5 — Decision routing *(M–L; needs WS4 + WS2 D2.4/D2.5)* — **production-blocked until its entry gate passes**

**Entry gate:** F1–F4 corrections merged (D2.4/D2.5 shipped; P6 mapping live) **and an
independent second-line review of this workstream's design**. Until both, every WS5 surface
runs **labelled non-authoritative**.

> **Condition 1, mechanism half — settled.** ADR-0005 is **accepted** (25 Jul 2026): Option A
> `oidc-step-up` with the nonce-binding hard condition, Option C held open as the strategic
> direction. D2.4/D2.5 have shipped against it, and the **P6 mapping join now ships too**
> (`core/identity-map.mjs` + `identity-map-check.mjs`, mandatory-when-compiled): condition 1 is
> met in the harness. What it still needs from an institution is a *populated* map — mappings are
> human acts, and the shipped template carries none. Condition 2 — the independent second-line
> review of *this workstream's* design — is untouched by that acceptance and still gates M4.

- **D5.1** Approvals database + PA approval page: one section per compiled role,
  people-property resolving through the P6 mapping, **evidence carried in** (change summary,
  gate results, decision-log excerpt — assembled by a floor-keeper, never by the approver).
- **D5.2** **Decision capture, corrected (F1)**: the verified, deduplicated webhook reaches
  **`svc-floor-bridge`, which transcribes** — nothing more. Webhook authors of type `bot` or
  `agent` are **rejected**. The Notion person id resolves through P6 to a registry subject.
  The decision's validity comes from a **subject-bound assertion independent of the bridge**
  — step-up SSO, a separately observed IdP assertion, or a Sigstore-style identity token
  (mechanism chosen in the entry-gate design review, ADR §7.5). The bridge packages assertion
  + envelope (schema D2.4) and opens the PR; a second-line human merges.
- **D5.3** **Four separate evidence streams (F4)** — one adapter, one control, each:
  1. **`notion-pa-decision`** → the PA gates: an authenticated, subject-bound human decision.
     Activation negatives: agent/bot approval rejected · unregistered human rejected · replay
     rejected · post-decision mutation detected.
  2. **`github-branch-protection`** (existing) → HG-0001: no sync identity can merge or
     bypass branch protection.
  3. **`github-codeowners-hold`** → control-plane protection: neither freezer nor bridge can
     alter `release-hold.json`.
  4. **`notion-activation`** → the observed, bypass-tested liveness of the seam itself,
     signed by the independent observer.
  Each ships **declared, not active** until its own real evidence lands.
- **D5.4** ADR inbox card + SDR flow (catalog B).
- **Acceptance:** a simulated PA1 lands envelopes the **extended** gate accepts; the full
  negative suite from G2 passes **in reality**; the four adapters each carry their own
  activation evidence.

### WS6 — Ops, MI, and the floor-keepers *(M; needs WS5)*

- **D6.1** Operations-signal intake → typed/rated/routed → PR round-trip, passing its check.
- **D6.2** MI dashboard over the projected sealed evidence.
- **D6.3** **Floor-keeper Custom Agents in separate, non-authoritative databases** — Notion
  page/database grants are not property-level protection, so approval fields live where
  agents hold **no grant at all**. Write scope: views + conversation. None holds a registry
  role.
- **D6.4** **Graceful degradation**: exhausted Notion credits pause agents and Workers — a
  reconciliation job + documented manual fallback keep the floor truthful; projection (the
  projector) does not depend on credits.
- **Acceptance:** a filed signal exits triage traceable end-to-end; MI reflects the last
  sealed bundle; a floor-keeper's attempted approval is demonstrably void; a simulated
  credit-exhaustion run degrades visibly, not silently.

## 5 · Milestones

| Milestone | Contents | Approval state | Proves |
|---|---|---|---|
| **M1 — The mirror** | WS0 + WS1 | **Approved** | The floor exists; no governance authority |
| **M2 — The MVP demo** | + D3.2 (PRD + data governance) + D4.1 + D5.1/D5.2 prototype | **Approved as non-authoritative** — an unmistakable "NON-AUTHORITATIVE · DECLARED, NOT ACTIVE" label on every approval surface | The whole story demoed, no evidence claims made |
| **M3 — Full authoring** | + rest of WS3, WS4 complete | Approved | Discovery lives on the floor |
| **M4 — Governed floor** | + WS5 complete, entry gate passed, negative suite green | **Blocked until F1–F4 corrections + independent second-line review** | Approvals route with subject-bound evidence |
| **M5 — Closed loop** | + WS6 | — | Signals and MI close the arc |

## 6 · The critical path (adopted from the review)

1. Amend WS0: threat model, identity mapping, capability matrix, pre-egress filtering, and
   the API compatibility ADR.
2. Deliver M1 using the projector identity only.
3. Build the canonical exporter and freeze lifecycle, including unsupported-block and replay
   tests.
4. Extend the PA gate and attestation schema (D2.4/D2.5) **before** implementing decision
   routing.
5. Run a test-only M2 with the unmistakable non-authoritative label.
6. Activate WS5 only after the independent second-line review and real negative tests.
7. Add floor-keepers and MI last, with no access to authoritative decision fields.

## 7 · Open decisions — all five drafted as ADRs; 0005 accepted, four awaiting deciders

Each is written against `delivery/templates/adr.md`, the template this programme added to the
harness — its first customers. Every one is **`proposed`**: a recommendation with its reasoning
and its open blockers stated, not a decision taken.

| ADR | Decision | Recommendation |
|---|---|---|
| [0001](adrs/0001-api-compatibility.md) | Notion API version — pin `2025-09-03` or adopt current `2026-03-11` | Adopt current **now**, while the migration surface is a config value in an unwritten service; the pin then moves only by a superseding ADR |
| [0002](adrs/0002-sync-service-hosting.md) | Where the sync services run | Bank-controlled service for freezer + bridge; Workers **projection-only** while beta |
| [0003](adrs/0003-freeze-trigger-ux.md) | How a freeze is triggered | Explicit human freeze — a freeze is an intent, like the merge |
| [0004](adrs/0004-projection-cadence.md) | How fresh the projection must be | On-merge push **plus** periodic reconcile — what makes G4's 10 minutes measurable rather than aspirational |
| [0005](adrs/0005-human-assertion-mechanism.md) | How a human decision is proven independently of the bridge | **ACCEPTED** 25 Jul 2026 (@michartmann, for the method): Option A `oidc-step-up` + the nonce-binding hard condition, Option C the strategic direction. Answers finding F1. An adopter's own four-role sign-off, and the WS5 workstream review, are **not** granted by this |

## 8 · Risks

Carried from the research (§8 there — do not re-litigate): appearance-of-control ·
comprehension debt (the evidence-carried-in rule is load-bearing in D5.1) · system-of-record
temptation · residency/PII (P1 gates the plan) · platform movement · cost/tier. Added by the
review: **webhook loss/replay/misorder** (D4.3) · **exporter nondeterminism** (D4.1 fails
closed) · **credit exhaustion** (D6.4) · **identity-mapping drift** across
Notion↔IdP↔registry (P6 owns the mapping; the extended gate rejects unmapped subjects).

## 9 · Verification, plan-wide

- **The goal measures (§1) for the milestone under review are demonstrated, not asserted** —
  a milestone review opens with its goals' measures shown live.
- Every workstream's acceptance test, plus the **honesty rule** — every adapter and
  projection ships *declared, not active* until its first real observed evidence, and the
  scorecard says so; every non-authoritative surface carries its label.
- The **negative-test suite** (G2) runs in every milestone review that touches WS5.
- The three uncollapsible lines hold at every milestone: builders ∩ second-line = ∅; agents
  approve nothing (floor-keepers and all four service identities included); a second human at
  every merge — including every split identity's PRs.
- `node scripts/validate-marketplace.mjs` green on every upstream (WS2) change, with plugin +
  marketplace version bumps.
