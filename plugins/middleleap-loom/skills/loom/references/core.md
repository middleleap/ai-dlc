# The Loom in two pages — the core

> Read this first. Everything else under `references/` is either the full canon for one part of
> this page, or an appendix. If you hold this page, you hold the method; the rest is how each
> sentence here is made true.

## One sentence

**Agents do the building and the recurring assurance work; humans stay accountable and hold
four-eyes approval.** Every mechanism in the Loom is a concrete form of that sentence.

## The shape — a double diamond, closed into a loop

```
   DISCOVER        DEFINE        │  DEVELOP        DELIVER        RUN
   diverge         converge      │  diverge        converge       signals return
   ◇──────────────◇ ── waist ── ◇──────────────◇ ──────────▶ ─── back to Discover
   the LEFT diamond: the problem │  the RIGHT diamond: the solution
```

- The **left diamond** finds the right problem. Discover diverges over evidence; Define converges
  on one falsifiable problem and makes it tangible with a prototype a stakeholder reacts to
  (drafted with `/design`, committed through the brand renderer).
  Gates **D1–D9** hold it. A discovery is **allowed to fail**: stopping the wrong problem early is
  a win, and it is recorded as an outcome, not hidden.
- The **waist** is the hand-off: one artifact, the PRD, is the entry condition for delivery. The
  waist gate (**HG-0007**) refuses a feature that does not trace to a gate-green hand-off, and a
  hand-off names the items it licenses. **Classification happens here** — a human classifies the
  change and the policy compiler compiles the route (which gates, which approvers, which
  evidence). Govern is an overlay at the waist, not a fourth stage.
- The **right diamond** builds it. Develop diverges over at least three solution directions and
  converges on one (**HG-0009**); Deliver builds it spec-first under quality gates **Q1–Q5** and
  a human merges (**HG-0001**). The business accepts what was built before launch is asked for,
  and a change that goes live owes a review on a clock (`governance.md`, the lifecycle table).
  The agent proposes; it never disposes.
- **Run** feeds back. Operations signals route to a fix, the register, or a reopened discovery —
  and going back a diamond is a recorded return, never a failure.

## The five decisions that carry the weight

The governance catalog has fourteen decisions (`governance.md`). Five of them carry most of the
method; know these and you can derive the rest.

| Decision | What it closes | The mechanism |
|---|---|---|
| **HG-0001** four-eyes merge | An agent merging its own work | Branch protection with a CODEOWNERS group the agent is not in |
| **HG-0002** immutable control plane | An agent editing its own guardrails | Every catalogued gate, hook and governance manifest is CODEOWNERS-owned; the target list is derived from the catalog |
| **HG-0003** sealed evidence | Self-attested change records | A hash-chained evidence bundle, anchored outside the repository (with the Kosli seam mounted, a Kosli attestation id) |
| **HG-0006** the agent is a model | An ungoverned model in the loop | Model manifest: pinned, tiered, evaluated against its pin, independently validated — for the delivery loop **and for the reviewer agents** |
| **HG-0013** graduated autonomy | One lighting policy for a lint fix and an auth rewrite | A second-line-owned, expiring routine envelope; the class is verified against the diff's content; approval moves per-envelope, never away |

## The register — where the regulatory context lives

The Loom's regulated context is one chain, and every link is a file a gate reads:

```
obligation (OB-*)  →  risk (DR-*)  →  control (CTRL-*)  →  gate  →  evidence
docs/governance/obligations.json → data-risk-register/ → control-catalog.json → gate-run records
```

- An **obligation** names its source, article, owner, and verification date. D6 makes a
  discovery cite the obligation it answers to, not a regulation remembered in prose.
- A **risk** has an inherent and residual rating; a **control** has an owner and an automation
  level; a **catalog control** has a maturity state.
- `obligation-report` prints the chain for any obligation. That is the answer to the examiner's
  first question.

## The maturity ladder — what a green gate means

Five states, and the word *enforced* is earned, not claimed:

**absent → defined → mechanically validated → platform enforced → organisationally enforced**

- A **mechanically validated** control means a gate holds a declaration to its shape. It never
  means the risk is controlled.
- **Platform enforced** needs the platform (branch protection, a vault, a gateway) *observed*
  refusing a bypass, signed by someone outside the agent's write authority.
- As shipped, the bundle is mechanically validated almost everywhere and platform enforced
  nowhere. The adopter raises the grade; `bank-grade-gap.md` keeps the honest scorecard.

## Where Kosli sits

The Loom decides what must be true; the external record keeps what happened, and Kosli is the
first provider of that record. Every gate result, approval and decision posts to a Kosli trail
through the seam, signed with the harness's own attestation core; the seal gate's external anchor
is the Kosli attestation id; agents read Kosli back before they plan; from deploy onward the
Loom reads from Kosli the one thing it cannot see itself, what is running. This is a proposed
division of responsibilities in an adopter's operating model — Kosli's own scope (evidence,
controls, audit, insight; Flows over business processes as well as pipelines) overlaps the
Loom's vocabulary, and the Loom's contribution is what it adds upstream of the record.
`kosli-seam.md` holds the decisions; the harness holds no second copy of anything Kosli keeps.

## What never moves

- The human disposes at every stage.
- The route is compiled by the Loom, not chosen by the team.
- The record is held outside the tree the agent edits.
- A hook is hygiene; the CI gate and the external record are the controls of record.
- Nothing here is proven in production yet. The Open Finance proof runs on synthetic data.

## Where to go next

| You want | Read |
|---|---|
| Every identifier expanded (D1, Q1b, S-001, HG-0009 …) | `glossary.md` |
| The left diamond in full | `discovery-harness.md` |
| The build loop, the Q gates, the merge policy | `delivery-harness.md` |
| All fourteen governance decisions | `governance.md` |
| The assurance lifecycle after the build | `continuous-assurance.md` |
| The honest scorecard | `bank-grade-gap.md` |
| Everything else — the agent runtime, model risk, the floor, the rings, scale-out, supply chain | the appendix list in `SKILL.md` |
