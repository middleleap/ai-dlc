# ADR-0003 — How a freeze is triggered

**Status:** **accepted** · **Date:** 2026-07-25 · **Accepted:** 2026-07-26 by **@michartmann**,
repository owner and Factory Floor programme sponsor, for the *method* — see **Scope of this
acceptance** below · **Institutional deciders (per adopter, unassigned here):** `product-owner` · `solution-architect` · `risk-second-line`

**Companions:** plan §7 open decision 2 · §4 WS4 (Decision D4.1–D4.3) · §5 M3 ·
`docs/research/notion-software-factory-collaboration-2026-07.md` §6 (the freeze lifecycle) and
§6a step 2 · `plugins/middleleap-loom/skills/loom/references/governance.md` (HG-0013).

This record decides **what starts a freeze** — the moment a co-authored draft on the floor becomes
a governed candidate in git. It decides nothing about what a freeze *does*: the deterministic
exporter, its fail-closed behaviour, the sha stamp, and the drift rules are WS4 · D4.1–D4.3 and
are unchanged by every option here. It decides nothing a gate reads; D1–D9 and the waist gate run
on the exported file exactly as they do today, file-based and offline.


## Scope of this acceptance

Accepted **for the method**, on the same terms as ADR-0005: it settles what this repository — a
method and a harness, not a bank — builds around, so the work below may proceed without the
decision being reopened. It is deliberately **not** a substitute for two things it has no standing
to grant.

**An adopting institution's own sign-off.** The decider roles above stay unassigned here on
purpose. Who may take the freeze action, and whether a facilitator role exists at all, is an adopter's operating-model decision.

**Activation.** `core/floor-fetch.mjs` and `core/floor-export.mjs` implement the freeze, and `freeze-stamp-check` verifies it — but no surface offers the action to anybody, because WS1 has not been deployed. Option A is what the harness is built to expect, not something a person can do today.

A superseding ADR — not an edit to this one — changes the decision.

## Context

Plan §7 lists this as open decision 2 and records a leaning — *"explicit freeze action (a freeze
is a human intent)"* — without deciding it. WS4 specifies the mechanism in detail and is silent on
the trigger: D4.1 says the export lands by pull request opened by `svc-floor-freezer` and aborts
visibly on unknown blocks, truncated content, or permission gaps; D4.2 says drift blocks new
freeze and approval claims until re-frozen; D4.3 says webhooks are signals, never records. None of
the three says who or what presses the button.

Four facts constrain the answer, and two of them cut against the intuitive framing.

**A freeze is a proposal, not a disposal.** It opens a PR; a human outside the freezer's group
merges it. HG-0013's line — the loop runs autonomous up to *proposal*, never through *disposal*,
and the PR is the light switch — is therefore satisfied by every option below. No option can be
rejected on four-eyes grounds, and any argument that automatic freeze "lets a machine decide" is
wrong on the mechanics. The real question is narrower: what quality of human intent stands behind
the candidate, and what the audit trail says about it.

**A freeze fails closed, so a noisy trigger produces noisy failure.** D4.1's abort conditions are
not exotic — an unsupported block type, a permission gap on an embedded page, a truncated
long-form section. A trigger that fires on every plausible gate moment converts those into
recurring notifications against drafts nobody considered finished.

**A run has more freeze moments than it has gates.** D1–D9 give nine gate moments, plus the
hand-off; D4.2 adds one re-freeze for every post-freeze edit that must be re-claimed. The
re-freeze path is where volume actually accumulates, and it is the path least well served by a
gate-moment trigger, because a re-freeze has no gate moment — it has an edit.

**The freeze stamp names a version.** The page is stamped *frozen at `<sha>` · vN* with a backlink
to the file. Someone is saying "this is the candidate". Whether that someone is a person or a rule
is precisely what this ADR chooses.

One process gap is worth stating plainly: **no gate enforces that a freeze happened.** The waist
gate refuses delivery entry without a gate-green `handoff.md`, which catches a missing final
freeze eventually and loudly — but nothing catches an intermediate artifact that was drafted,
discussed, and never frozen. That gap is identical under all three options; it is a checklist and
routing problem, not a trigger problem, and it is named here so no option is credited with fixing
it.

## Options considered

### Option A — Explicit human freeze action

- **What it is:** every born-here template carries a **Freeze** action. The run facilitator (or the
  artifact's named author) takes it. A confirmation names exactly what will be exported, to which
  path, and against which run slug; the freezer service acts only on that intent, and the freeze
  stamp records the acting human alongside the sha and the export digest. Re-freeze after drift is
  the same action, taken again.
- **Costs:** one human step per gate moment and per re-freeze, and someone must remember to take
  it. It needs support around it to be reliable — the live freeze checklist already specified for
  the hand-off template (research §6c, catalog A), a floor-keeper reminder, and a visible
  "unfrozen since" state on the page. It gives the fastest possible feedback on a fail-closed
  abort, because a human is present when it happens.
- **Risks:** a forgotten freeze is silent until the waist gate refuses, which may be days later.
  The facilitator may not be the best judge of readiness for an artifact they did not author. And
  on a busy run the action degrades into reflex — the same comprehension-debt failure the method
  already names against four-eyes, relocated one step earlier.

### Option B — Automatic freeze at gate moments

- **What it is:** the floor watches for a gate-moment signal — a status property moving to
  *ready for D5*, a checklist completing — and the freezer exports and opens the PR without a
  further click.
- **Costs:** the signal must exist and be trustworthy, which relocates the human intent into a
  status property rather than removing it. D4.3 applies in full: webhook delivery is neither
  ordered nor exactly-once, so the trigger must deduplicate on event id and refetch current state
  before exporting, and a status flip that arrives twice must not produce two PRs. The re-freeze
  path needs its own trigger regardless, because drift has no gate moment.
- **Risks:** false-freeze noise is the principal one. Every fail-closed abort becomes a
  notification nobody asked for, and a status flipped mid-edit produces a PR against a draft its
  author considered half-written — reviewer attention spent on candidates that are not candidates.
  The audit answer degrades too: "who froze this?" resolves to "a rule fired because a property
  changed", and the accountable human is one indirection away, often someone tidying a board
  rather than someone judging readiness. The trail exists; it is weaker, and it is weaker exactly
  where an auditor asks the sharpest question.

### Option C — Hybrid: automatic proposal, human confirmation

- **What it is:** a floor-keeper detects the gate-ready condition and proposes — *"this looks ready
  to freeze"* — and a human confirms. The freeze runs on confirmation, so the recorded intent is
  human and the prompting is automatic.
- **Costs:** two mechanisms to build, test, and keep in parity where Option A needs one. The
  detector's accuracy becomes a UX property: a proposer that is wrong often trains people to
  dismiss it, and a dismissed proposal is worse than no proposal because it consumes attention
  without producing a candidate.
- **Risks:** the appearance-of-control trap in miniature. A page reading *"ready to freeze"* is a
  heuristic that presents as an assessment, and G6 requires that nothing read as more controlled
  than it is — so the proposal needs its own label, which is more surface for the same outcome.
  Confirmation fatigue is the second risk: a confirm attached to a machine proposal is the weakest
  of the three forms of human intent, because the human's contribution is agreement rather than
  judgment.

## Decision

**Recommended: Option A — an explicit human freeze action, taken by the run facilitator.**

A freeze is the assertion *"this draft is now the thing I want judged"*. That is an intent, and
intents are cheap to record and expensive to reconstruct. The HG-0013 parallel is instructive but
must not be over-read: the PR is the light switch in all three options, so four-eyes decides
nothing here. What the graduated-autonomy decision actually teaches is the surrounding discipline
— autonomy is calibrated per change class and relaxed only through an expiring, second-line-owned
envelope, never by defaulting. Automatic freeze is a default relaxation adopted before a single
real run has been observed, which is the wrong order.

The fail-closed exporter settles the noise argument. A trigger that fires often against a
mechanism designed to abort visibly produces frequent, unattended failures around a control — and
noise around a control is how a control stops being read. Under Option A a human is present at
every abort, so every abort has an owner in the moment.

Auditability breaks the tie. With an explicit action, *who froze this, and when did they judge it
ready* has one answer, recorded in the freeze stamp and the PR trail. Under Option B it decomposes
into *who last edited a status property* — a different question, answered by a different person,
often for a different reason.

**The hybrid stays deliberately open.** For high-volume operation — many parallel discovery runs,
or a cadence where re-freezes after drift dominate — the cost of a missed freeze eventually
exceeds the cost of a wrong proposal, and Option C becomes the right answer. Revisit at M3 on
measurement, not impression: gate moments per run, freezes per run, median lag from gate-ready
state to freeze, fail-closed aborts per freeze, and re-freezes per merged artifact. **AWAITING:**
the thresholds at which the hybrid is adopted — owner, date. A threshold invented here would be a
number with no evidence behind it.

**Accepted for the method** on 26 Jul 2026 (see *Scope of this acceptance*). The freeze itself
is implemented and gated; what no adopter has yet is a surface offering the action, because WS1 is
not deployed. Who may take it remains an adopter's operating-model decision.

## Consequences

**What becomes true.** Freeze is a named affordance on every born-here template, and the freeze
stamp records the acting human's registry identity — resolved through the P6 mapping, not the
vendor's person id — alongside the source sha and D4.1's export digest. The hand-off template
carries the live freeze checklist as a required section. A page that has been edited since its
last freeze shows the drift badge and, per D4.2, blocks new freeze and approval claims until
re-frozen; the remedy is the same action taken again, so there is one verb to learn. A run whose
artifacts were never frozen has an empty `discovery/runs/<slug>/` and the waist gate refuses
delivery entry — a visible failure, not a silent one.

**What becomes harder.** Someone has to remember. The facilitator gains a duty that no gate
enforces, and the method's own honesty rule requires saying so rather than describing the
checklist as if it were a control. Freeze throughput is bounded by human attention, which will
show first on the re-freeze path, where a small edit costs a full freeze cycle. And the M2 demo
must show the freeze being *taken*, not narrated — a demo that skips the action has not
demonstrated the trigger.

**What must be revisited, and when.**

- **At M3**, with the five measures above in hand — the first point at which enough real runs
  exist to say whether Option C's cost is now justified.
- **If re-freeze volume comes to dominate** freeze volume, because the gate-moment framing that
  makes Option B attractive does not describe the re-freeze path at all.
- **On any change to D4.1's abort conditions**, since Option A's central argument is that a human
  is present when an abort happens.
- **If the facilitator role is split** across several people on one run, which weakens the "one
  answer to who froze this" property that decides this ADR.

## Compliance notes

| Control / gate | How this decision leaves it |
|---|---|
| **HG-0013** (graduated autonomy; the PR is the light switch) | Satisfied identically by all three options — the freeze proposes, the merge disposes. This decision is about the quality of intent behind the proposal, and it declines a default relaxation that no observed run has yet justified |
| **HG-0001** (four-eyes) | Untouched. `svc-floor-freezer` opens the PR and cannot merge it; the WS4 acceptance probe records that refusal. An explicit trigger adds a human before the PR; it removes none after it |
| **HG-0002** (immutable control plane) | Untouched. The freeze writes only under `discovery/runs/<slug>/` by PR; no option grants the floor a path into gates, hooks, workflows, or `release-hold.json` |
| **HG-0003** (tamper-evident evidence) | Strengthened marginally: the freeze stamp binds a named human to the sha and the export digest, so the provenance of a candidate is a recorded act rather than an inferred one. The digest itself is D4.1's, unchanged |
| **HG-0011** (residency) | Unaffected by the trigger. What crosses the seam is decided by the P1 residency record and the pre-egress filter (D0.4), and the export path is the same under all three options |
| **D1–D9, waist gate** | Unchanged and untouched. Gates read the exported file; none learns that a freeze exists, who took it, or how it was started. Goal **G2**'s diff-empty requirement is unaffected |
| **Regulatory (CBUAE, PDPL)** | No obligation attaches to a trigger design as such. The regulated content is what the export carries, governed by the residency record. **AWAITING:** confirmation from `data-protection` that recording the freezing human's registry identity in the stamp raises no separate retention question |

This record activates no control. The freeze trigger is a workflow affordance; the controls around
it are the fail-closed exporter, the drift block, the PR under CODEOWNERS, and the waist gate —
none of which this decision creates, strengthens, or relaxes.
