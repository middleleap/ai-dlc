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
| **Meso** | one product | dogfood → evals → staged launch → feedback (the product loop) | **Mostly the Loom** — staged rollout (pilot playbook) and the product-eval gate now ship; the eval *rig* and enterprise reach remain the open edge |
| **Macro** | the enterprise | intent → execution → value → strategy, across every function | **Adopter / advisory** — the Loom does not ship an operating model |

The same shape — bounded reasoning inside a node, a governed gate between nodes, a feedback
edge back to the queue — is what the delivery loop does for a diff, the product loop does for
a release, and an enterprise does for a strategy. The Loom builds the innermost ring
rigorously and hands the outer ones their vocabulary.

## What the Loom is (micro + the shipped half of meso)

Everything in the other references. The micro ring is the double diamond closed into a loop
(`SKILL.md`): discovery finds the right problem, delivery ships it under control, Run feeds
signals back (`operations.md`). The shipped half of the meso ring is now two things. **Staged rollout** — the
supervised-pilot playbook's six cohorts (synthetic → internal → beta-without-execution →
capped → expanded → normal) with dual-run/shadow comparison
(`../../loom-adopt/harness/governance/runbooks/pilot-playbook.md`). And **evals-as-product-
management** — the `product-eval-check` gate: a release links its discovery hand-off, scores
every D1 success measure, and carries a fresh eval bound to the shipping commit; a regression
blocks the release. The Loom-native move is that the D1 measure *is* the eval target, so
discovery → delivery → measurement closes. The eval *rig* that scores a measure stays the
adopter's to build.

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
- **The eval rig itself (meso, open).** The `product-eval` gate ships and enforces a fresh,
  discovery-linked, sealed eval; the *rig* that actually scores a success measure — the
  dataset, the runner, the harness — is domain-specific and the adopter's to build. The gate
  proves an eval was run and passed against the shipping commit; it cannot author the eval.
- **Token/value economics (macro).** Outcome = tokens × operating model. **Spend** is now
  instrumented — the token ledger + `token-report` make per-iteration and per-milestone
  output-token cost measurable on the worked example. The **value** half, and the ROI it
  implies, is still unbuilt; the Loom explicitly disclaims measured ROI (`SKILL.md` Limits).

## The rule under it

The Loom earns its outer-ring credibility the same way it earns its inner-ring credibility:
by naming what it does not enforce rather than implying it does. A method that claimed the
enterprise operating model on the strength of a build harness would be committing the exact
overreach the honest-limits discipline exists to prevent. The rings compound; the bundle
ships the centre.

See `SKILL.md` (the double diamond, the context brain), `operations.md` (the feedback edge),
`bank-grade-gap.md` (cluster E, the run-the-bank honesty this file mirrors for scope), and
`../../loom-adopt/harness/governance/runbooks/pilot-playbook.md` (the staged rollout).
