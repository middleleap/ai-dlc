# P1 reviewer's brief — for the data-protection and risk-second-line signatories

**Record under review:** `docs/notion-floor-residency-review.md` ·
**Programme:** Factory Floor (`docs/notion-floor-plan.md`) ·
**Prepared by:** the drafter of that record, who holds no approval authority over it.

Read this first, then the record. This brief exists to make your review faster and more
adversarial — not to persuade you. Everything below that reads like a recommendation is the
drafter's proposal and carries no authority; the ratings, the acceptances and the conditions are
yours.

**Two companions.** [`notion-floor-p1-decision-worksheet.md`](notion-floor-p1-decision-worksheet.md)
takes the record's twelve open `AWAITING` items and gives each one a proposal to react to — with
four marked as having no defensible default, and why. Working through it turns twelve blank pages
into twelve accept/amend/reject calls; it decides nothing and it is not a substitute for §11.
[`notion-floor-p1-vendor-questionnaire.md`](notion-floor-p1-vendor-questionnaire.md) is §8's vendor
questions in sendable form.

---

## 1 · What you are actually signing

You are approving **a content-class policy for a SaaS collaboration surface** — a written record
of which classes of content may leave git and appear in a Notion workspace, at what fidelity, and
which may never. Nothing more.

Concretely, your signature would say four things:

1. The **content-class table** (§4) is an acceptable ceiling — including the field-by-field
   product-passport treatment in §4.1.
2. The **prohibited list** (§5) is complete enough, and the absence of an approval path for it is
   correct.
3. The **eight residual risks** (§9) are accepted at ratings you have set — the ratings in the
   record now are the drafter's proposals, explicitly marked as carrying no authority.
4. The **pre-egress filtering design** (§6) is an adequate control given its stated limits.

## 2 · What you are NOT being asked to approve

This matters as much as §1, because the temptation in a review like this is to either widen it
into "do we do this programme at all" or narrow it into "is Notion an approved vendor."

- **Not decision routing.** Approvals routed through the floor (WS5) are separately
  production-blocked and need an *independent second-line review of that workstream's design* —
  a different artifact, which this signature does not grant and cannot.
- **Not the vendor's approval status.** Q14 in the questionnaire is your vendor-management
  function's call, not this record's.
- **Not the harness controls.** The gates, the approval-attestation contract and the identity map
  are separately reviewable and already CI-enforced. This record governs *what content goes out*,
  not *how decisions come back*.
- **Not a workspace build.** Approval unblocks WS1 (read-only projection). Decision D0.3 scaffold, P3
  token issuance and any content of any class on any surface remain blocked until this record is
  merged — see the record's own blocking statement.

## 3 · The three things most likely to fail your review

Stated plainly, because a brief that hides its weak points wastes your time.

### 3.1 · The pre-egress filter is weaker than its placement suggests

§6.2 says this in the record's own words, and it is worth repeating because it is the single most
important honest statement in the document:

- **It is directional.** It governs git → floor. It has *no visibility* into what a person types
  into a page, pastes into a comment, or drags in as an attachment. Every floor-authored class —
  discovery drafts, the research log, D9 reactions, interview notes — sits **entirely outside its
  reach**.
- **It matches shapes, not meaning.** An Emirates ID has a shape. A customer's name in a
  free-text finding does not. Against unstructured disclosure the filter is close to useless, and
  no amount of pattern tuning changes that.
- **It is adopter-side wiring.** No gate in the bundle can assert the filter is present, current,
  or correctly configured. Its liveness must be *observed* — a live probe, bypass-tested, signed
  by an independent observer — or it is **declared, not active**, and must be labelled so.

**The question for you:** is "template discipline plus a human reading before freeze" an
acceptable primary control for unstructured disclosure (R1, proposed **Medium-high** — the
highest rating in the register)? If it is not, the honest options are to narrow the content
classes further, to place an existing DLP capability inline on this egress path, or to refuse.
The record has an explicit `AWAITING` for information-security on exactly that point.

### 3.2 · Two risks cannot be rated until the vendor answers

**R4 (retention and erasure)** is recorded as *Open — unratable today*. That is not a drafting
gap; it is unanswerable until vendor questions 7 and 8 come back. **R2 (vendor-side AI
processing)** is *Medium, pending* questions 2 and 4.

**The question for you:** do you sign with conditions that name those answers as pre-conditions to
WS1, or do you hold the signature until the answers arrive? Both are defensible. What is not
defensible is rating R4 today — and if a version of this record reaches you with R4 rated, ask who
rated it and on what basis.

### 3.3 · A "yes" here is load-bearing for things you are not reviewing

WS1 projection is genuinely read-only and carries no governance authority — but it is not zero
risk, and the record says so: residency, over-sharing, stale-data, token-custody and availability
risk all survive read-only. The programme then builds on it. If your acceptance is narrower than
the record's content-class table, say so as a **condition**, because the table is what later
workstreams will treat as settled.

## 4 · Where the drafter thinks you should push back

Offered as a reviewer's checklist, not as findings. The drafter wrote the record; these are the
places where a signature obtained too easily would be worth less.

| Ask | Why |
|---|---|
| "Who reads before freeze, and what happens if they don't?" | R1's primary compensating control is a human step with no gate behind it. If it is not named and rostered, it is an aspiration |
| "Show me the quarterly sampling." | §9.1's evidence mechanism is the only thing that would ever *detect* R1 occurring. Ask what a sample looks like and who sees the result |
| "What is the fidelity ceiling on the passport's `classification` section specifically?" | §4.1 goes field by field; the classification fields are the ones an aggregation attack (R6) benefits from most |
| "Which of our DLP capabilities can be placed inline here?" | The record has an open `AWAITING` for information-security on this. An answer of "none" is itself a finding you should record rather than leave blank |
| "If the vendor confirms no person-id reassignment policy, what changes?" | Questionnaire Q16 / review §8 Q16. Without a policy, identity drift class D-C is unbounded and reconciliation cadence — an operational cost — is the only defence |
| "Does Q15 make this material outsourcing?" | If yes, a regulatory clock gates WS1 regardless of what we sign here, and everyone should know that before the workspace is budgeted |

## 5 · The mechanics of signing

The record's §11 table takes two signatures. Each must resolve to a **registry identity in
`identities.json` holding the named role**, the merge is subject to four-eyes, and **builders may
not sign**.

| Role | Registry identity | Constraint |
|---|---|---|
| `data-protection` | must hold the role in `identities.json` | not in `builders` |
| `risk-second-line` | must hold the role in `identities.json` | not in `builders` |

In the shipped example registry these are `dp-yusuf` and `risk-lena`; in an adopting institution
they are whoever holds those roles there. The two signatures must be **two different people** —
one person holding both roles satisfies "roles, not headcount" for most of this method, but not
for a two-signature record whose whole point is a second pair of eyes.

There is a third `AWAITING` in §11: whether your own policy requires **additional** signatures —
information-security, legal, compliance, or the accountable executive. P1 names two. The record
deliberately does not presume to widen or narrow that set, so if your policy says otherwise, that
is a condition to attach, not a defect to report.

### The three available decisions

- **Approve** — WS1 unblocks. The content-class table becomes the ceiling every later workstream
  builds against.
- **Approve with conditions** — the expected outcome, given §3.2. Write the conditions into §11
  yourself; the drafter must not write them for you. Name which vendor answers are pre-conditions
  to WS1 rather than to later phases.
- **Refuse** — the programme's paper deliverables (D0.2, D0.4, D0.5) continue; nothing else does.

## 6 · What is already true, so you are not asked to take it on trust

So that your review spends its time on the open questions rather than re-deriving what is settled:

- The **approval-attestation contract** ships and is CI-enforced: a service key cannot vouch for a
  human, an agent's click is void, a replayed decision is refused, and content mutated after the
  decision breaks the binding. Nineteen defects were found and fixed by adversarial review of that
  work before it shipped, two of them regressions in earlier fixes.
- The **identity map** (P6) now has a gate: a record with a real assertion for subject A that
  names registry identity B is refused. Before it, that forgery verified clean.
- **No shipped profile compiles** the approval capability — the contract ships *declared, not
  active*, so nothing routes an approval today whatever this record says.
- The **projection cannot write git**, the freezer **cannot merge its own PR**, and every write
  from the seam arrives as a pull request a second human merges.

None of that reduces the questions in §3. It just means they are the real ones.

---

**Companions:** the questionnaire (`notion-floor-p1-vendor-questionnaire.md`) · the threat model
(`notion-floor-threat-model.md`) · the identity mapping (`notion-floor-identity-mapping.md`) · the
architecture drawing (`loom-notion-architecture.html`).
