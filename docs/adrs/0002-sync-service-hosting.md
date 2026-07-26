# ADR-0002 — Where the sync services run

**Status:** **accepted** · **Date:** 2026-07-25 · **Accepted:** 2026-07-26 by **@michartmann**,
repository owner and Factory Floor programme sponsor, for the *method* — see **Scope of this
acceptance** below · **Institutional deciders (per adopter, unassigned here):** `enterprise-architect` · `platform-admin` · `information-security` · `risk-second-line`

**Companions:** plan §3 P4 and P5 · §7 open decision 1 · §4 WS1, WS4, WS5, WS6 ·
`docs/notion-floor-threat-model.md` (identities, capability matrix, T-08, T-13, T-15, G-8) ·
`docs/research/notion-software-factory-collaboration-2026-07.md` §2.3 and §4.1.

This record decides the runtime for the three **service** identities that cross the seam between
the floor (Notion) and the record (git) — `svc-floor-projector`, `svc-floor-freezer` and
`svc-floor-bridge`. It decides nothing about the API version (ADR-0001), nothing about the
human-assertion mechanism for D5.2 (plan §7.5, decided in the WS5 entry-gate review), and it
creates no authority: hosting choices move credentials, logs and failure modes, never approval
rights.


## Scope of this acceptance

Accepted **for the method**, on the same terms as ADR-0005: it settles what this repository — a
method and a harness, not a bank — builds around, so the work below may proceed without the
decision being reopened. It is deliberately **not** a substitute for two things it has no standing
to grant.

**An adopting institution's own sign-off.** The decider roles above stay unassigned here on
purpose. Where a bank's services run is that bank's decision, made against its own hosting estate, its own egress policy and its own outsourcing rules. This repository hosts nothing.

**Activation.** Nothing is deployed. The freezer, bridge and projector are module contracts in this harness; no runtime exists, and the capability probe that would make the projector's read-only posture **observed** rather than **declared** has never been run — `PJ-R20` is what says so out loud.

A superseding ADR — not an edit to this one — changes the decision.

## Context

Prerequisite P5 revises v1's hosting recommendation, and open decision 1 records it as still open:
a **bank-controlled service** should host the freezer and the bridge for identity, audit and
credential locality, with **Notion Workers acceptable for projection only while they remain beta**.
The external control review's constraint is narrower and harder: **Notion Workers stay out of the
authoritative approval path while beta** — a constraint the plan promotes to a non-goal to be
refused on sight (§2).

The bridge is the reason the constraint bites. Under the F1 correction the bridge is a
**transcriber and proposer that never issues an approval**; validity comes from a subject-bound
assertion minted independently of it (D5.2). But transcription still sits *in* the decision path:
the bridge reads the verified, deduplicated webhook, resolves the Notion person id through the P6
mapping, packages the assertion with a D2.4 envelope and opens the PR. A runtime that can be
paused, upgraded or observed by the vendor, outside the bank's change control, is in the path that
carries a human's decision toward the record — even though it cannot make one.

Three further facts frame the options. **Least privilege is already decided** (P4): four
identities, one capability each, and the capability matrix is the contract rather than
documentation. **The observer is a human platform role, not a hosted service** — this ADR does not
place it, though **AWAITING:** a decision on where the observer's probes execute and how the
observer key is held (vault, HSM, or hardware token). And **the sync machinery is adopter-side
wiring**: the harness bundle ships the reference mapping and the envelope kind, never a Notion
client, so whatever is chosen here is the adopting institution's component, not the Loom's.

## Options considered

### Option A — All three service identities on Notion Workers

- **What it is:** projector, freezer and bridge each run as a Worker in the Notion workspace, each
  with its Worker webhook URL. GitHub app credentials and the freezer's and bridge's signing keys
  live in Worker configuration.
- **Costs:** the lowest build cost of the three and the fastest route to M1 — no infrastructure to
  stand up, no on-call rota, no base-image pipeline. Webhook receipt is native.
- **Risks:** decisive ones. Every credential the seam holds — three tokens, two signing keys —
  moves into vendor custody, inverting HG-0004's premise. Logs and audit trail become the vendor's,
  with retention and exportability the bank does not set, which weakens every investigation the
  threat model's abuse cases assume is possible. The runtime is **beta**, so its behaviour and
  availability change on the vendor's schedule rather than the bank's change control. Egress cannot
  be constrained to a bank allow-list. Credit exhaustion pauses **all three**, including projection
  — directly contradicting D6.4. And it places a beta runtime in the transcription path, which plan
  §2 refuses outright. This option is listed for completeness and fair comparison; it fails on the
  non-goal before the rest of the ledger is read.

### Option B — Bank-controlled service for freezer and bridge; Workers for projection only

- **What it is:** the plan's recommendation. The freezer and the bridge run as a bank-hosted
  service inside the institution's own network, credentials in the institution's vault, logs in the
  institution's SIEM, egress on the institution's allow-list, changes through the institution's
  change management. The projector — which holds no signing key, writes nothing to git, and carries
  no authority at all — may run as a Worker while Workers are beta.
- **Costs:** a real service to build, host, patch, monitor and change-manage; an on-call
  expectation; a hardened base image, signed SBOM and SLSA provenance if HG-0002's supply-chain
  half is applied to it (threat model **T-15**); and two runtimes to reason about instead of one.
- **Risks:** projection inherits the Worker beta's availability and the credit model — it can pause
  or degrade for reasons the bank does not control, which is exactly the "stale floor that still
  looks live" failure T-13 names. The split must be **enforced rather than documented**: the
  predictable failure is a later convenience move of the freezer onto a Worker, the same drift
  shape as T-09's privilege creep. A stricter variant exists — **host the projector in the bank
  service too, using no Workers at all** — and the plan pulls both ways on it (see the Decision).

### Option C — Everything in adopter CI jobs

- **What it is:** the projector runs on a merge-to-`main` workflow; the freezer runs on a
  human-triggered workflow dispatch (a freeze is a human intent, per open decision 2); the bridge
  runs on a schedule or on `repository_dispatch`.
- **Costs:** no new service and no new secret store — credentials sit in the CI secret store the
  bank already governs, and logs and audit live in a platform already in scope for the control
  plane. Projection latency on merge is fine.
- **Risks:** two that decide it. First, **CI is not an event listener.** Webhook receipt needs an
  always-on endpoint; without one the bridge degrades to polling, which reintroduces the loss and
  latency D4.3 works to bound, and burns runner minutes to stand still. Second, and worse, it puts
  the seam's identities and signing keys **inside the CI that enforces the control plane** — the
  workflows that run the gates would sit beside a workflow holding a git-write credential and an
  attestation key, and HG-0002's separation is precisely that the enforcing machinery is outside
  the reach of what it governs. Residency compounds it: vendor-hosted runners are offshore, so
  HG-0011 would push toward self-hosted runners — which is Option B with extra steps and a worse
  blast radius.

**The ledger, side by side.**

| Concern | A · all Workers | B · bank service for freezer + bridge | C · adopter CI jobs |
|---|---|---|---|
| Git-write credential custody | vendor runtime | bank vault | bank CI secret store, beside the gates |
| Signing-key custody | vendor runtime | bank vault | bank CI secret store, beside the gates |
| Log / audit ownership | vendor; retention not set by the bank | bank | bank |
| Beta runtime in the decision path | **yes — refused by plan §2** | no | no |
| Egress control | none the bank sets | bank allow-list | runner-dependent; offshore by default |
| Webhook receipt | native | native endpoint | unsupported — polling or a relay |
| Credit dependency | all three pause | projection only | none |
| Operational surface | none new | one governed service | none new; CI minutes consumed |
| Separation from the control plane | preserved | preserved | **collapsed** |

## Decision

**Recommended: Option B — a bank-controlled service for the freezer and the bridge, Notion Workers
for projection only while Workers remain beta.** This matches prerequisite P5 and open decision 1.

Two properties decide it. **Credential locality and audit ownership** settle the freezer and the
bridge: both hold git-write credentials and a signing key, and the bridge sits in the path that
carries a human decision toward the record — so the runtime must be one whose logs the bank owns,
whose egress the bank sets, and whose changes go through the bank's change management. **Absence of
authority** settles the projector: it holds no signing key, cannot write git, and its worst
credible failure is showing the floor something false — serious for comprehension, void for
governance, because the record is git. That asymmetry, not convenience, is what makes a beta
runtime tolerable on one side of the line and refused on the other.

**One internal tension must be resolved before WS1 acceptance, and this record will not resolve it
silently.** P5 permits a Worker for projection; D6.4 and the threat model's T-13 mitigation both
assume the projector is bank-hosted *precisely so that credit exhaustion cannot pause it*. Those
two positions cannot both hold. Either the programme accepts a projector that can pause — with the
visible degraded banner, the reconciliation job and the documented manual fallback D6.4 requires —
or it hosts the projector in the bank service as well and drops Workers from the seam entirely.
**AWAITING:** decision between these — owner, date. The recommendation above is Option B as the
plan states it; the stricter variant is the safer reading of D6.4 and costs little once the bank
service exists.

**Accepted for the method** on 26 Jul 2026 (see *Scope of this acceptance*). Nothing is
deployed, so this settles what the harness is built to expect: the freezer and bridge belong in a
runtime whose logs, egress and change management the institution owns. An adopter decides its own
hosting.

## Consequences

**What becomes true.** The freezer and the bridge run where the institution holds the credentials,
the logs, the egress control and the change record. No beta runtime sits in the transcription path,
so plan §2's non-goal is honoured by construction rather than by discipline. The capability probes
the plan already requires — the projector cannot write git (WS1), the freezer cannot merge its own
PR (WS4) — have a governed place to run and a governed place to record their output. Exactly one
credential, the projection integration token, sits in vendor custody, and it is the one whose
compromise reaches no gate.

**What becomes harder.** The bank-controlled service is new code outside the harness's
zero-dependency core, and it **needs its own change management** — a change class, a release
process, a patch cadence, an on-call owner, a hardened base image, a signed SBOM and SLSA
provenance if HG-0002's supply-chain half is applied to it. It is a governed component, not glue,
and the harness's own supply-chain gate does not cover it today (**T-15**; open question **G-8**:
whether the sync service is itself a Loom-governed repository — **AWAITING:** decision, owner,
date). Two runtimes must be operated and reasoned about. And **projection may degrade or pause when
Notion credits are exhausted or the Worker beta changes** — so the floor must say so loudly:
a degraded banner, an alert at a credit threshold, and a reconciliation job, because a floor that
has quietly stopped updating while still looking live is a control failure of its own, and silence
must never be mistaken for coverage. **AWAITING:** credit threshold, alert route and named owner
(the same gap T-13 records).

**What must be revisited, and when.**

- **When Workers leave beta** — revisit what else may move there. The approval path is not
  reopened by that event alone; moving any part of it would need a fresh independent second-line
  review, the same bar as the WS5 entry gate.
- **When the credit or pricing model changes** — the projection-degradation acceptance rests on it.
- **On the second observed projection stall in a quarter** — treat the Worker choice as failed and
  move the projector into the bank service. **AWAITING:** confirmation that a per-quarter threshold
  is the right trigger.
- **When G-8 is decided** — the service's change management, supply-chain evidence and gate
  coverage all follow from it.
- **If the WS5 entry-gate review makes a finding about the bridge's runtime** — that review, not
  this record, is the authority on the decision path.

## Compliance notes

| Control / gate | How this decision leaves it |
|---|---|
| **HG-0004** (least-privilege service identity, vaulted secrets) | The decisive entry. Three service tokens and two signing keys stay in the institution's vault; only the projection token sits in vendor custody. Under Option A all of them would be in the vendor's runtime. This ADR does not weaken P4's one-capability-per-identity contract, and the capability matrix remains the enforcement instrument — with the honest caveat that 2 of its cells are probed today (**G-6**) |
| **HG-0002** (immutable control plane) | Preserved, and Option C is refused largely on this ground: the sync identities must not run inside the CI that enforces the gates. No identity in any option may alter CODEOWNERS, workflows, gate scripts, managed settings or `release-hold.json`; the bank service inherits that prohibition, and if G-8 rules it Loom-governed, HG-0002's supply-chain half applies to it directly |
| **HG-0001** (four-eyes) | Untouched by hosting. No runtime grants a merge right; the freezer opens PRs and stops, and a second human merges. Enforcement of record stays branch protection plus the WS4 probe that the freezer cannot merge its own PR |
| **HG-0011** (residency) | Engaged. The bank service's hosting region must satisfy the institution's residency position, and the projector's Worker runs in the vendor's region by construction — which is the P1 residency record's problem, not this one's, but it is the same content crossing. **AWAITING:** information-security and data-protection confirmation of the permitted hosting region for the sync service, and of the Worker's region for projection |
| **HG-0003** (tamper-evident evidence) | Indirect: the freezer's export digests and the bridge's transcriptions land as evidence in git. Hosting changes who can tamper *before* the PR, not what the record proves after it — the human merge remains the boundary |
| **HG-0013** (graduated autonomy) | Unchanged. Every option keeps the seam's machines strictly on the proposal side of the boundary; none can dispose |
| **Gate set / CODEOWNERS** | No gate reads the runtime. Goal **G2**'s requirement that the gate set and CODEOWNERS diff empty against pre-integration is unaffected. The `notion-activation` evidence stream (D5.3) observes the seam's liveness, not its hosting — and it cannot be verified by the shipped `platform-activation-check` today, which restricts `mechanism` to a platform enum with no seam value (**G-2**). Hosting does not close that gap |
| **Regulatory (CBUAE outsourcing / third-party risk, PDPL)** | Running a component of a governed delivery seam on a vendor's beta runtime is a third-party dependency in its own right, distinct from the workspace subscription. **AWAITING:** third-party risk assessment reference for the Worker runtime — owner, date. PDPL exposure follows the content the projector pushes, governed by P1, not by where the projector executes |

No control described here is active. Every statement of enforcement is design intent pending the
sign-offs above and the observations the plan's honesty rule requires.
