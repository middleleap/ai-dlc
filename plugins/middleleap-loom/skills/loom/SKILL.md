---
name: loom
description: The Loom — MiddleLeap's method for how a regulated entity builds software with AI. Two harnesses (discovery finds the right problem, delivery ships it under control) running across a frame of always-on controls, weaving to the institution's own context. Use when explaining the Loom, assessing whether a project follows it, answering questions about its harnesses, gates (D1–D9, Q1–Q5), governance model (HG catalog), or the double diamond — or when someone asks "how do we build with AI in a regulated environment". For setting the Loom up in a repository, use the loom-adopt skill instead.
---

# The Loom — a way for a regulated entity to build with AI

The Loom is a **reusable way of building**: set it up once, then weave any solution on it. It
takes an ambiguous idea, finds the problem worth solving, and turns it into live, audit-ready
software with the controls built in — the same way every time. It was proven end-to-end on a
UAE Open Finance back office: an autonomous build loop carried 134 of ~139 backlog stories to
done under quality gates and human four-eyes merge, and a matching discovery harness took real
problems from framing to a gate-green hand-off.

Open Finance was the first cloth off the loom. **The Loom is the deliverable.**

## The metaphor is exact

| Loom part | In the method |
|---|---|
| **Warp** (threads under tension) | The always-on controls — four-eyes, INSERT-only audit, lineage, quality gates, data residency |
| **Harnesses** | Discovery (find the right problem) + delivery (build it under control) |
| **Shuttle** | The AI agents the harness pulls in to weave continuously |
| **Pattern** | The institution's own context — its brain |
| **Cloth** | Shipped, audit-ready software |

## The double diamond

The two harnesses form a double diamond. The first diamond is about the **problem**; the second
about the **solution**. Each diverges (explore widely) then converges (decide). They meet at one
artifact — the agreed problem statement, the PRD — the hand-off from discovery to delivery. The
process is non-linear by design: evidence found during delivery can legitimately send you back a
diamond. And a discovery is **allowed to fail** — stopping the wrong problem early is a win.

```
   DISCOVER        DEFINE            │    DEVELOP         DELIVER
   (diverge)       (converge)        │    (diverge)       (converge)
   explore the     frame the ONE     │    explore N       ship it under
   problem space   problem + make    │    solution        control
                   it tangible       │    directions
        ◇──────────────◇             │       ◇──────────────◇
        discovery harness            │       delivery harness
                     └── hand-off (the PRD) ──┘
```

Full canon for each half:
- `references/discovery-harness.md` — stages, artifacts, the D1–D9 gate model, the prototype
  boundary, the two seams, and the hand-off contract. This file **is** the canon an adopting
  repo mounts as `discovery/DISCOVERY.md`.
- `references/delivery-harness.md` — the autonomous build loop, spec-first order, the quality-gate
  pattern, the guardrail hooks, and the merge policy: **the agent proposes; a human disposes.**
- `references/governance.md` — the harness-governance catalog (HG-0001…HG-0012): the decisions
  that make an autonomous loop acceptable to a regulated institution.
- `references/continuous-assurance.md` — what happens after the build: the harness pulls
  assurance agents through the six-step regulatory lifecycle (watch, assess, check, test,
  evidence, confirm) on every trigger, so compliance is current to the last commit rather than
  to the last meeting.
- `references/bank-grade-gap.md` — the method's honest self-grade against a regulated-bank
  bar: which controls are enforced, which are named-only, and which are absent — plus the
  order to close them in.
- `references/supply-chain-security.md` — how concrete SCA / SAST / image-scanning tooling
  (Chainguard, Snyk) fills slots the frame already has (Q2, Q4, HG-0002, the evidence bundle,
  continuous assurance) without changing the frame.

## The context brain — why the method compounds

A harness alone is generic, and so is an AI agent. What makes the Loom produce *this
institution's* software is context, treated as a first-class, governed asset with three
dimensions:

1. **Regulated context** — the regime's rules: mandates, deadlines, security posture, the risk
   taxonomy and controls. Mounted as the **data-risk register** seam (gate D6 reads it).
2. **Solution domain** — the shape of the thing being built: the API contract, the data model,
   the personas and scopes, the synthetic dataset. Swap this dimension and the same Loom builds
   a different solution.
3. **Institutional DNA** — how the entity itself works: approval routes, architectural patterns,
   approved technologies, design tokens, terminology, tone of voice. Mounted as the **brand
   profile** seam (gate D7 reads it) plus `CLAUDE.md` and the ADRs.

The moat test: if a competitor copied the entire codebase tomorrow, what would they still lack?
The accumulated, governed context. It cannot be copied — only built, cycle after cycle. And the
brain is *governed*, not merely accumulated: access-controlled, versioned, auditable, with
owners and a change history. Bad context compounds as readily as good — curation is a control.

## Limits — what the method can claim, stated plainly

A method worth adopting names its own risks:

- **Proven on a demo, not yet in production.** The Open Finance proof runs on synthetic data
  and is permanently non-production. It shows the method produces a real, gated,
  audit-evidenced system; it has not yet cleared a live regulator examination or production
  scale.
- **"Any domain" is early evidence, not a measured result.** One bounded greenfield domain
  proved the loop; a second problem ran through the discovery machinery. Legacy integration,
  real data, and organisational change are the true costs elsewhere, and are not yet in the
  cost curve.
- **The cost/moat curve is illustrative** — directional, not measured ROI.
- **The brain must be curated** — governed, versioned, quality-checked, not merely accumulated.
- **AI model risk is real.** The agents need ongoing validation, monitoring, and independent
  challenge — that is what the HG catalog's model-risk decisions exist for.

The method's own maturity self-grade against a regulated-bank bar — what is enforced,
named-only, or absent — lives in `references/bank-grade-gap.md`.

## The one-sentence guardrail

Agents do the building and the recurring assurance work; **humans stay accountable** and hold
four-eyes approval. Every mechanism in the harnesses — the waist gate, the reviewer agents, the
tripwire hooks, branch protection — is a concrete form of that sentence.

## Using this skill

- Explaining or presenting the Loom → this file plus the references.
- Auditing a project against the method → check for the warp (always-on controls in CI + hooks),
  the waist gate (features trace to a gate-green hand-off), and the merge policy (no self-merge).
- Standing the harness up in a repo → the **loom-adopt** skill; it carries the machinery
  (gate validator, renderer, templates, hooks, skills) and the copy map.
