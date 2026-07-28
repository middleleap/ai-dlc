# ADR-0004 — How fresh the projection must be

**Status:** **accepted** · **Date:** 2026-07-25 · **Accepted:** 2026-07-26 by **@michartmann**,
repository owner and Factory Floor programme sponsor, for the *method* — see **Scope of this
acceptance** below · **Institutional deciders (per adopter, unassigned here):** `solution-architect` · `platform-admin` · `operations`

**Companions:** plan §7 open decision 3 · §1 G4 and G6 · §4 WS1 (Decision D1.1–D1.3) · §4 WS6 · D6.4 ·
§8 (stale-data risk) · `docs/research/notion-software-factory-collaboration-2026-07.md` §4.2 ·
`docs/adrs/0001-api-compatibility.md` (the pinned REST version this cadence runs against).

This record decides **how the projection stays true** — the cadence by which the read-only git →
Notion mirror is written, checked, and corrected, and what the floor is required to say about its
own freshness. It decides nothing about what is projected (the P1 residency record governs that),
nothing about the freeze direction (WS4), and nothing a gate reads: no gate consults the
projection, and none may be made to.


## Scope of this acceptance

Accepted **for the method**, on the same terms as ADR-0005: it settles what this repository — a
method and a harness, not a bank — builds around, so the work below may proceed without the
decision being reopened. It is deliberately **not** a substitute for two things it has no standing
to grant.

**An adopting institution's own sign-off.** The decider roles above stay unassigned here on
purpose. Cadence is an operational commitment with a cost and an owner, and an adopter sets both.

**Activation.** No projector runs, so nothing is projected on any cadence. The reconcile half — the part that detects a failed push, a revoked token or a hand-edited field — is the half with no implementation at all yet; `core/floor-project.mjs` derives the payload and stops there.

A superseding ADR — not an edit to this one — changes the decision.

## Context

Plan §7 lists this as open decision 3 with a leaning — *"on-merge push + hourly reconcile"* — and
goal **G4** turns freshness into a measure that must be demonstrated at M1 and M3: *projection
fresh within 10 minutes of a merge*. WS1 · D1.1 fixes the write direction (one-way, git → Notion,
on merge to main, under `svc-floor-projector` only) and D1.3 renders the freeze/drift block
display-only. WS1's own preamble refuses the "zero risk" framing and names **stale data** among the
risks a projection genuinely carries.

The forcing observation is that **freshness is not a property of a push.** A push knows what it
sent; it does not know what is there. The two diverge for reasons that have nothing to do with the
push being wrong:

| Divergence cause | Push-only detection |
|---|---|
| CI workflow fails, is cancelled, or is skipped by a path filter | None — the projection silently keeps the previous sha |
| Notion unavailable, or the request rejected at the rate limit | None, unless the job retries and reports; a swallowed retry looks like success |
| Integration token revoked, expired, or scope-narrowed | None until a human notices the board stopped moving |
| A person edits a projected page directly on the floor | **None ever** — no merge occurred, so no push is due |
| A page is moved, archived, or its data source re-created | None — the projector writes to an id that no longer means what it meant |

The fourth row is the one that matters most for governance. Notion's sharing model grants at page
and database level; **Can Edit** granted for a legitimate reason on a neighbouring page is enough
to let someone type over a mirrored field. Nothing merged, so nothing pushed, so the floor now
shows a state git never contained — which is the **system-of-record temptation** risk arriving
through the back door, and a direct threat to G6's honesty rule. A push-only design cannot see it.

One vendor fact this record needs and does not have: **the request-rate limits of the pinned REST
version have not been read at primary source here.** ADR-0001's caveat applies unchanged — the
Notion specifics in the companion research rest on dated releases confirmed through search
summaries and secondary press. **AWAITING:** a verified read of the rate-limit documentation for
the version pinned by ADR-0001 — owner, date. Sweep sizing below is expressed in terms that can be
tuned once that number is known; it should not be committed to a schedule before it is.

Cost has a boundary worth stating: per D6.4 the projector uses the REST API with an integration
token and **does not consume Notion credits**, so cadence cost is API calls and CI minutes, not
agent credits. A credit-exhaustion event pauses agents and Workers; it must not pause the
projection.

## Options considered

### Option A — On-merge CI push only

- **What it is:** a workflow on merge to `main` diffs the projected surface and writes the changed
  pages. One event, one write, no scheduled work.
- **Costs:** the cheapest option by a wide margin — writes are proportional to merges, and nothing
  runs when nothing changes. Simplest to reason about and to explain to a reviewer.
- **Risks:** it has no recovery path and no measurement. Every row of the table above goes
  undetected, and the failure mode is the dangerous one: the floor keeps presenting the last
  successful projection as current, with nothing on the page to say otherwise. It also cannot
  demonstrate G4 honestly — a push job can report that it *sent* within ten minutes; only a reader
  of the floor can report that the floor is *fresh*, and Option A has no reader.

### Option B — Scheduled poll only

- **What it is:** a job runs on an interval, reads the current `main`, computes what the floor
  should show, and writes the difference. No merge event is used.
- **Costs:** cost is proportional to the interval and the corpus, not to activity — a quiet week
  costs the same as a busy one. Achieving G4's ten minutes requires a full pass at least that
  often, which means the whole projected surface is read and compared every ten minutes forever.
  Against an unverified rate limit that is the option most likely to hit it, and the one whose
  cost grows fastest as the corpus grows.
- **Risks:** freshness is bounded by the interval by construction, so the goal is met only at the
  cost that Option C achieves for far less. It does, genuinely, recover from every row of the
  table — that is its real merit and it should not be understated. But a merge that lands one
  second after a pass waits a full interval, which is a worse median latency than a push for the
  common case, and the common case is what teammates experience.

### Option C — On-merge push plus periodic reconcile

- **What it is:** the push carries freshness for the ordinary path; a reconcile pass carries
  correctness for every other path. Two mechanisms, two purposes, neither substituting for the
  other.
- **Costs:** two code paths, two sets of failure modes, and a reconciler that must be idempotent
  and must not fight the push (a repair racing a push produces flapping). It needs a defined
  comparison — sha for structure, content digest for fields a human could have typed over — and a
  place to record what it found.
- **Risks:** the reconciler is control-adjacent code that nobody watches, which is how
  reconcilers rot; a silently failing reconcile restores exactly Option A's blindness while the
  page still claims to have been reconciled. Its own liveness therefore has to be part of what it
  reports.

## Decision

**Recommended: Option C — on-merge push plus a two-tier periodic reconcile.**

The reasoning is that push and poll answer different questions and the programme needs both
answers. The push answers *how fast* — it is the only design that puts a merged change in front of
a teammate in the low minutes, and G4's ten-minute measure is met on that path. The reconcile
answers *whether* — it is the only design that can detect a failed push, a revoked token, a moved
page, or a hand-edited field, and it is the only mechanism in the plan that can catch a human
typing over the mirror. Option A is fast and blind; Option B is honest and expensive; C is both,
at the price of one extra job.

**Reconciliation is what makes G4 measurable rather than aspirational.** This is the operative
sentence of this record. A push-only programme can report that it sent 41 writes in the last day;
it cannot report that the floor is correct, because it never reads the floor back. The reconcile
pass is the measuring instrument — it produces the comparison from which "fresh within 10 minutes"
is a *finding* rather than a claim. Without it, G4's demonstration at M1 reduces to showing the
push job's logs, which is exactly the observed-vs-declared confusion the plan exists to refuse.

**The specification the recommendation carries** (all intervals subject to the rate-limit
verification above):

1. **Push on merge to `main`.** Target: every affected page reflects the merge sha within ten
   minutes. The projector records `source_sha` and `projected_at` on each page it writes.
2. **Delta sweep, every 5 minutes**, over the recently-active set only — changes and backlog items
   whose record moved in the last 24 hours. It compares each page's recorded `source_sha` against
   `main` and repairs divergence. This is the miss-recovery path, and it is small by construction.
3. **Full reconcile, every 24 hours**, over the entire projected corpus. It compares a **content
   digest** per projected page, not merely the sha, so an in-Notion edit that never touched the
   sha is caught. This is the only pass that sees row four of the context table.
4. **Every projected page carries a visible `projection_state`** — source sha (short), projected
   at, last reconciled at, divergence status. The floor states its own freshness rather than
   implying currency by looking tidy. This is G6 applied to the mirror.
5. **Unrepairable divergence files an operations signal** (D6.1) rather than retrying silently.
   Permission loss, schema mismatch, a missing data source, rate-limit exhaustion, and an
   unexplained in-Notion edit are all conditions a human should see, not conditions a loop should
   absorb.
6. **The reconciler reports its own liveness.** A `last_reconciled_at` older than two full
   intervals is itself a divergence, surfaced on the page and raised as a signal. A reconciler
   that fails quietly is worse than no reconciler, because the page now carries a freshness claim
   that nothing is maintaining.

**One honest limit on G4, stated rather than smoothed.** The ten-minute figure is a guarantee on
the push path only. On the miss path the guarantee is weaker and different: *divergence is detected
within the sweep interval and the page says so*. An hourly reconcile — the plan §7 leaning —
cannot deliver ten-minute freshness on the miss path, which is why the sweep is proposed at five
minutes and the hourly pass is replaced by a daily full comparison that does more. **Recommended
restatement of G4's measure, for the deciders:** *median push-to-visible latency ≤ 10 minutes,
and maximum undetected divergence ≤ the sweep interval.* Two numbers, both measurable, neither
overstating what the design provides.

**Accepted for the method** on 26 Jul 2026 (see *Scope of this acceptance*) — the *shape* is
settled: push for speed, reconcile for truth. **The intervals stay provisional** until the
rate-limit read lands, and that AWAITING is unaffected by this acceptance. The reconcile half has
no implementation at all yet, which is the honest gap: `core/floor-project.mjs` derives the payload
and stops.

## Consequences

**What becomes true.** The floor carries a freshness statement on every projected page, so a
teammate can tell a current board from a stopped one without asking. Divergence has a defined
detection window and a route into the operations queue rather than into someone's memory. G4
becomes demonstrable at M1 by reading the floor and comparing it to `main` — the demonstration is
a comparison, not a log. The projector remains the only identity with a token that writes to the
floor, and reconcile repairs are Notion-side writes only; the reconciler gains **no** git write
capability, so the WS1 capability probe (the projector's credentials cannot write git) covers it
unchanged.

**What becomes harder.** Two moving parts instead of one, and the second is the kind of background
job that decays unnoticed — hence requirement 6, which is itself now a thing to maintain. Cost and
call volume rise with corpus size on the daily pass, and the five-minute sweep sets a floor on API
consumption that a quiet programme still pays. Divergence reporting introduces a discipline that
must be written into the reconciler from the first commit: **a divergence report records ids and
digests, never page content.** A report that quotes the differing text would carry floor-authored
content — potentially personal data typed into a note — into git, permanently, outside the P1
residency record's contemplation. That is a small piece of code with a real data-protection
consequence, and it is easy to get wrong by writing the obvious diff.

**What must be revisited, and when.**

- **When the rate-limit read lands** — the intervals are provisional until then and may not be
  affordable as written.
- **At M1**, on the first real measurement: if median push-to-visible latency exceeds ten minutes,
  the constraint is the push path and no reconcile interval fixes it.
- **When the corpus grows past what a daily full pass can compare** inside its window — the answer
  is partitioning the full pass across days, not lengthening the interval silently.
- **On any change to the pinned API version** (ADR-0001), because both passes depend on
  addressing and payload shapes that a version change may move.
- **If in-Notion edits to projected pages are ever found in practice** — one confirmed instance
  should trigger a permissions review, not just a repair, since the repair hides the cause.

## Compliance notes

| Control / gate | How this decision leaves it |
|---|---|
| **HG-0002** (immutable control plane) | Untouched. The projection is one-way git → Notion; neither the push nor the reconciler holds a git write path, and no repair can travel toward the record. The reconciler is adopter-side sync machinery, not harness core — the same seam ADR-0001 relies on, and subject to the same unresolved question at threat-model gap **G-8** about the sync service's own governance |
| **HG-0004** (least-privilege identity, vaulted secrets) | Both passes run as `svc-floor-projector` and no other identity. The token is vaulted; its inability to write git is probed and recorded (WS1 acceptance). Adding the reconciler must not widen that scope by a single capability |
| **HG-0011** (residency) | Two dependencies. The reconcile pass **reads back** from the SaaS, which is a new direction of flow the P1 record must contemplate explicitly; and the divergence report must carry ids and digests only, never content, so that floor-authored text cannot be committed to git through the repair path. **AWAITING:** `data-protection` confirmation that read-back for comparison, and digest-only divergence reporting, sit inside the approved residency envelope |
| **HG-0003** (tamper-evident evidence) | Not engaged. The projection is a mirror, not evidence; no sealed bundle, digest chain, or attestation depends on it. If MI (D6.2) ever presents projected figures as evidence, that is a separate decision and this record does not authorise it |
| **HG-0001 / HG-0013** | Untouched. Nothing in the projection proposes, approves, or merges anything |
| **Gate set / CODEOWNERS** | No gate reads the projection, and none may be made to — the gates are file-based and offline. Goal **G2**'s diff-empty requirement is unaffected |
| **Regulatory (CBUAE, PDPL)** | No obligation attaches to a refresh interval as such. The regulated questions are what is projected and how long the floor retains it, both governed by the P1 residency record. Availability of the floor is not a regulatory dependency, because no control depends on the floor being up |

This record activates no control. A fresher, self-reporting mirror improves honesty and reduces the
appearance-of-control risk; it creates no evidence, verifies nothing, and must never be cited as
assurance that the record itself is correct.
