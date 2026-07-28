# The Factory Floor — canon

The Loom's harnesses are operated from a repository. Most of the people a regulated build depends
on — the product manager who owns the problem, the stakeholder who reacts to a prototype, the
second-line approver who clears a release, the architect wearing a governance hat — do not open
one, and should not have to. The **Factory Floor** is the guided collaboration surface where they
stand.

> Give the not-so-technical teammates a user-friendly surface over the Loom, without a single
> control, artifact of record, or approval authority leaving git.

The metaphor stays exact: a loom sits on a factory floor. The weaving happens on the machine; the
floor is where the people are. Nothing structural about the Loom changes because a floor exists —
**enforcement is identical with the floor present or absent.** That is the property the whole
design is arranged to protect, and the reason this file spends more time on refusals than features.

The floor is **optional**. An adopter who never stands one up loses nothing: every floor gate is
silent where no floor exists, and the harness runs exactly as it does today.

## The four disciplines

Everything below follows from four sentences, and a design decision that contradicts any of them
is wrong however convenient it is:

1. **Git is the system of record.** Every fact a gate trusts lives there. Nothing a gate reads is
   ever authoritative on the floor.
2. **Decisions and frozen drafts come home by PR.** The floor proposes; a second human merges.
   The PR is still the light switch (HG-0013).
3. **Observed, not declared.** A capability the seam claims is documentation. A capability probed
   and refused is a control.
4. **Agents approve nothing.** Floor-keepers and all four service identities included.

## The four planes

The floor adds one plane to the Loom and exactly one seam between it and the record. Naming the
boundaries is what makes the trust argument checkable.

| Plane | What lives there | Authority |
|---|---|---|
| **Engagement** — the floor | Authoring pages, projected boards, approval pages, comments, floor-keeper agents, and the humans | **None.** A mirror, a draft, or a conversation |
| **Seam** — the sync service | The machine identities, adopter-hosted. The only place the two sides touch | Proposes, never disposes |
| **Record** — git | Governed files, control plane, CODEOWNERS, branch protection | The system of record |
| **Execution** — protected CI | Where the gates actually run | Reads the record; has no path to the floor |

Three boundaries cross those planes — floor↔seam (integration token out; signature-verified,
deduplicated webhooks in), seam↔record (PRs only; a seam identity that could merge would collapse
four-eyes), record↔execution (protected CI, immutable control plane).

**And one path that must bypass the seam entirely.** A human's decision is proved by an assertion
minted where the bridge cannot reach it, binding the change, the stage and the subject. The bridge
*carries* it; a courier, not a notary. This is the correction described under F1 below, and it is
the single most important thing to understand about the floor's approval story: **a bridge
signature proves the bridge transcribed, never that a named human decided.**

## Write classes — what happens to what you type

The floor's honesty rests on every page telling its author, in the author's own language, what
becomes of it. Three classes, and the banner is on the template itself, not in an appendix:

| Class | Catalog | What it means | Ends up |
|---|---|---|---|
| **`born-on-the-floor`** | A | Authored on the floor, then **frozen** into the record at a gate | `discovery/runs/<slug>/`, by PR |
| **`decision-routed`** | B | Authored on the floor, but the decision only becomes real as a signed envelope | An ADR or SDR in git, by PR, merged by a second human |
| **`lives-on-the-floor`** | C | Never frozen, never a record — meeting notes, interview notes, briefs | Stays on the floor; cited by id, never copied |

Catalog C is where the personal data actually turns up, because it is where people write prose
about people — and it is the class with the least mechanical protection, precisely because nothing
freezes it so no export gate ever reads it. So the discipline lives where a gate can still reach:
in the **template** (the banner states the PII rule at the point of authoring, and asks for roles
rather than names) and at the **boundary** (`floor-only-check` refuses a catalog-C note that has
crossed into `discovery/runs/`).

## The freeze round trip

The moment a draft becomes a record.

1. A human **explicitly** freezes — a freeze is an intent, like a merge (ADR-0003).
2. The fetcher walks the page as the API actually serves it; the exporter converts it
   deterministically to Markdown. Unknown blocks, truncated content or permission gaps **abort the
   freeze** with a visible reason rather than exporting something lossy.
3. The freezer opens a PR into `discovery/runs/<slug>/`, with a **freeze stamp** naming the digest
   of exactly what was exported.
4. The D-gates re-run on the exported files. A floor-authored discovery run passes D1–D9 or it is
   not a discovery run.
5. `freeze-stamp-check` re-derives the digest afterwards, so the frozen file a gate read cannot be
   edited in place. `drift-check` watches the other side of the same seam: a page edited after its
   freeze **blocks new claims** against it, and never reaches back to invalidate a merged record.

The exporter is a pure function — no network, no clock, no vendor SDK — which is what makes it
testable without a workspace and what keeps the token out of it.

## The seam identities

One identity would have been simpler and is the thing that must not exist. Four, split by what
each is allowed to touch, none holding an approval role:

| Identity | Direction | May never |
|---|---|---|
| `svc-floor-projector` | git → floor | Write git |
| `svc-floor-freezer` | floor → feature branch / PR | Merge its own PR |
| `svc-floor-bridge` | webhook → transcription | **Sign an approval into validity** |
| `svc-floor-keeper` | floor-side paperwork | Hold any grant where approval fields live |

The keeper's constraint is physical, not procedural: page and database grants are not
property-level protection, so approval fields live in a container the keepers hold **no grant on
at all** — or the promise that they approve nothing is not kept.

## What enforces it

Ten gates. Each is silent where no floor is adopted, and each is in the control catalog, so the
risk-proportionate gate runner selects them like any other control.

| Gate | Deliverable | Refuses |
|---|---|---|
| `residency-check` | WS0 · Decision D0.1 | A floor that exists while the residency record is unsigned; an agent, a builder, or one person holding both signature roles |
| `identity-map-check` | WS0 · D0.4 (P6) | An unsound or stale join from surface person → IdP subject → registry identity |
| `projection-capability-check` | WS1 | A projector whose inability to write git is *declared* rather than probed and refused |
| `template-parity-check` | WS3 · D3.1 | A guided form that has drifted from the git template it produces |
| `floor-only-check` | WS3 · D3.3 | A catalog-C template missing its write-class banner; a floor-only note that crossed into the record |
| `freeze-stamp-check` | WS4 · D4.1 | A frozen artifact edited in place after the gates read it |
| `drift-check` | WS4 · D4.2 | A **new** claim against a page that has moved on since its freeze |
| `approval-surface-check` | WS5 · D5.1/D5.4 | An approvals page that no longer matches the compiled control plan for its change |
| `adapter-evidence-check` | WS5 · D5.3 | Evidence streams collapsed together; a *declared* adapter counted as an *active* one |
| `floor-keeper-check` | WS6 · D6.3/D6.4 | A keeper holding a grant where approvals live; a paused floor represented as a live one |

Alongside them, library modules with no gate of their own: webhook discipline (signature, event-id
dedupe, refetch-before-acting — webhooks are signals, never records), decision capture, MI over
sealed evidence, operations-signal intake, and graceful degradation.

## Why the design has this shape — the four findings

An external control review of the first plan found four defects. They are worth carrying in the
canon because each one is a mistake that is very easy to make again:

- **F1 · The signature authenticated the worker, not the human.** A bridge-signed envelope proves
  the bridge signed. Fixed by the subject-bound assertion on a path the bridge cannot reach.
- **F2 · The approval was not bound to the exact thing approved.** Evidence could change after the
  click while the old approval still verified. Fixed by binding stage, outcome, plan hash, content
  digests, source sha, event id, nonce, schema version and expiry into the envelope.
- **F3 · The gate could not validate the envelopes at all.** Fixed by extending the existing
  product-approval gate *before* decision routing shipped — mandatory-when-compiled, tightening
  and never loosening.
- **F4 · Adapter activation conflated controls.** One refused write does not evidence four
  properties. Fixed by splitting activation into four streams, one control each.

The general lesson, which outlives the specific bugs: **a signature is only as good as what it
binds to, and convenience about who signs is where governance quietly dies.**

## Honest state

The canon's rule is that nothing reads as more controlled than it is, so:

- **Nothing is deployed.** The bundle ships the **git-side halves** — the pure exporter, the
  fetcher against recorded response shapes, the gates, the templates, the worked examples. The
  live API calls, the workspace, the PR-opening and the hosting are adopter-side wiring, by
  design: the harness carries no vendor client and no token.
- **WS5 (decision routing) is production-blocked.** Its entry gate is the F1–F4 corrections
  (landed) **plus an independent second-line review of the workstream's design** (not done). Until
  both, every WS5 surface runs labelled non-authoritative, and catalog B ships **declared, not
  active**.
- **The residency record (P1) is the gate on everything.** MiddleLeap's own is drafted and
  **unsigned**; an adopter's is theirs to write and sign under HG-0011. `residency-check` enforces
  the blocking statement that was previously prose no gate read.
- **Every adapter ships declared, not active** until its own real observed evidence lands, and the
  scorecard says so.
- **The pre-egress content filter matches shapes, not meaning.** An Emirates ID has a shape; a
  customer's name inside a backlog title written from a complaint does not. Against structured
  identifiers it is preventive; against unstructured disclosure it is close to useless, and no
  amount of pattern tuning changes that. It is also directional — it governs git → floor and has
  no visibility into what a person types *into* a page. There, the control is the template's
  discipline and a human reading before the freeze.
- **A projection can be stale, and that is the worst thing it may ever be.** It may never be a
  false approval. Every projected payload carries `authority: "none"` and refuses the fields
  through which a surface could look actionable — attestations, signatures, seals, plan hashes,
  release holds — even if someone adds them to the allow-list.

## The risk the floor adds

Appearance of control. A tidy card reading `production-authorized` beside a green tick is
indistinguishable, to a human eye, from the control that produced it. That is why the labels are
not decoration, why `authority: "none"` is on every record and not just the page footer, and why
a record whose payload trips a filter is withheld **whole** and shown as withheld rather than
silently dropped — silence must never be mistaken for coverage.

It also compounds the method's standing risk. A surface that makes governance *pleasant* to
participate in is a surface that makes it easier to click through: the evidence-carried-in rule
(the approver's evidence is assembled for them, never fetched by them) is load-bearing against
exactly that, and is not by itself a measurement of whether anyone read it. See the comprehension
debt limit in `SKILL.md`.
