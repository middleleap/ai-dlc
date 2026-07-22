# The enterprise rings — where the Loom sits, and where it stops

The Loom is a build-time control frame. A whole AI-native operating model is a larger thing:
the same mechanism of continuous, governed feedback repeated at three scales — a **fractal**,
not a stack of tools. This file names the three rings, states which one the Loom *is*, and —
in the honest tradition of `bank-grade-gap.md`'s cluster E — names the outer ring as
adopter- and advisory-side rather than pretending the bundle ships it.

## The three rings

| Ring | Scale | The loop | Who ships it |
|---|---|---|---|
| **Micro** | one change | plan → work → review → merge → deploy → signal (the delivery + discovery harnesses) | **The Loom** — mechanically validated machinery |
| **Meso** | one product | dogfood → evals → staged launch → feedback (the product loop) | **Partly the Loom** — staged rollout ships (pilot playbook); the product-eval gate is the open slice |
| **Macro** | the enterprise | intent → execution → value → strategy, across every function | **Adopter / advisory** — the Loom does not ship an operating model |

The same shape — bounded reasoning inside a node, a governed gate between nodes, a feedback
edge back to the queue — is what the delivery loop does for a diff, the product loop does for
a release, and an enterprise does for a strategy. The Loom builds the innermost ring
rigorously and hands the outer ones their vocabulary.

## What the Loom is (micro + the shipped half of meso)

Everything in the other references. The micro ring is the double diamond closed into a loop
(`SKILL.md`): discovery finds the right problem, delivery ships it under control, Run feeds
signals back (`operations.md`). The shipped half of the meso ring is staged rollout — the
supervised-pilot playbook's six cohorts (synthetic → internal → beta-without-execution →
capped → expanded → normal) with dual-run/shadow comparison
(`../../loom-adopt/harness/governance/runbooks/pilot-playbook.md`).

## What the Loom is not (the macro ring, and half of meso)

These are real, and deliberately outside a build-time frame. Named so an adopter does not
mistake silence for coverage:

- **The enterprise intelligence layer.** "Make the whole company queryable" — a central
  hub wiring agents across Salesforce, Snowflake, Slack, and the rest. The Loom's context
  brain (`SKILL.md`) is the *governed-context* seed of this idea, but it is repo-scoped and
  build-oriented, not an enterprise data plane.
- **Organisational topology.** Outcome trees replacing spans-and-layers; humans owning
  *outcomes* while agents execute *activities*; cross-functional pods with embedded
  risk/legal. The Loom ships CODEOWNERS and a named accountable officer (HG-0010) — a
  view on *who approves*, not on *how the org is shaped*.
- **The people ramp.** Proficiency expectations in hiring and performance, mandate sequenced
  behind capability. `loom-adopt` installs machinery; the human change-management ramp is the
  adopter's.
- **The product-eval gate (meso, open).** Evals-as-product-management — a product-outcome
  eval library that blocks a release on regression, distinct from the *model* eval the
  model-provenance gate already enforces (`model-risk.md`). This is the one outer-ring slice
  close enough to the frame to be worth pulling in; see the rc-train plan.
- **Token/value economics (macro).** Outcome = tokens × operating model. The Loom explicitly
  disclaims measured ROI (`SKILL.md` Limits); the macro loop's instrumentation is unbuilt.

## The rule under it

The Loom earns its outer-ring credibility the same way it earns its inner-ring credibility:
by naming what it does not enforce rather than implying it does. A method that claimed the
enterprise operating model on the strength of a build harness would be committing the exact
overreach the honest-limits discipline exists to prevent. The rings compound; the bundle
ships the centre.

See `SKILL.md` (the double diamond, the context brain), `operations.md` (the feedback edge),
`bank-grade-gap.md` (cluster E, the run-the-bank honesty this file mirrors for scope), and
`../../loom-adopt/harness/governance/runbooks/pilot-playbook.md` (the staged rollout).
