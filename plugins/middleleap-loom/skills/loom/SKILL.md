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
diamond. And a discovery is **allowed to fail** — stopping the wrong problem early is a win. The
diamonds also **close into a loop**: shipped software runs, and Run/Operations feeds signals back
into Discovery as evidence — the third arc (`references/operations.md`).

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
- `references/governance.md` — the harness-governance catalog (HG-0001…HG-0013): the decisions
  that make an autonomous loop acceptable to a regulated institution.
- `references/continuous-assurance.md` — what happens after the build: the harness pulls
  assurance agents through the six-step regulatory lifecycle (watch, assess, check, test,
  evidence, confirm) on every trigger, so compliance is current to the last commit rather than
  to the last meeting.
- `references/operations.md` — the third arc: how **Run/Operations** feeds signals back into
  Discovery to close the loop, the routing triage, and the `operations-signal` seam that keeps
  the feedback wire triaged and traceable.
- `references/enterprise-rings.md` — the fractal framing: the Loom as the micro ring (one
  change) plus the shipped half of the meso ring (one product), and an honest naming of the
  macro ring (the enterprise operating model) as adopter- and advisory-side, not bundled.
- `assets/loom-stream.html` — a standalone, brand-styled visualization of the whole stream: the
  double diamond closed into a loop, the security / governance / business checkpoints, where
  Chainguard & Snyk attach, and the bank-grade maturity traffic-light. Open it in a browser.
- `references/bank-grade-gap.md` — the method's honest self-grade against a regulated-bank
  bar, on the five-state model (absent → defined → mechanically validated → platform
  enforced → organisationally enforced) — plus the order to close the gaps in.
- `references/supply-chain-security.md` — how concrete SCA / SAST / image-scanning tooling
  (Chainguard, Snyk) fills slots the frame already has (Q2, Q4, HG-0002, the evidence bundle,
  continuous assurance) without changing the frame.
- `references/model-risk.md` — governing the agent as a model (HG-0006): inventory, pinning,
  eval-before-release, and independent validation, with the model-provenance gate that enforces
  the repo-side half.

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
   approved technologies, design tokens, terminology, tone of voice. Its institution-owned **seed**
   is the **Institutional BrainKit** (`institution/brainkit/`, 2.0-rc.10) — a versioned, approved,
   digest-pinned package of identity, terminology, architecture principles, technology policy and
   decision rights that every repository inherits before it writes code, PRDs, ADRs, interfaces or
   reports. The BrainKit projects to the **brand profile** seam (gate D7) and composes through the
   policy compiler as the `brainkit-conformance` gate; `brainkit-check` enforces its integrity, and
   `brainkit-init` drafts one from an institution's approved sources. See `references/brainkit.md`.

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
- **What ships is a build-time frame, not the run-the-bank control environment.** "Live,
  audit-ready software" names what the frame is *for*; the frame itself delivers strong,
  auditable build-time controls (gates, sealed evidence, compiled requirements). The live
  IAM, platform enforcement, production monitoring, operational-resilience organisation and
  independent control functions that make software genuinely *live and audit-ready in
  production* are the adopting institution's — the Loom creates the repository-level structure
  and evidence those systems enforce, not the systems themselves (`bank-grade-gap.md`).
- **"Any domain" is early evidence, not a measured result.** One bounded greenfield domain
  proved the loop; a second problem ran through the discovery machinery. Legacy integration,
  real data, and organisational change are the true costs elsewhere, and are not yet in the
  cost curve.
- **The cost/moat curve is illustrative** — directional, not measured ROI. The token ledger
  + `token-report` now make per-iteration and per-milestone *spend* measurable on the worked
  example (the macro ring's first instrument); the *value* half of the curve, and the ROI it
  implies, remains unbuilt.
- **The brain must be curated** — governed, versioned, quality-checked, not merely accumulated.
- **AI model risk is real.** The agents need ongoing validation, monitoring, and independent
  challenge — that is what the HG catalog's model-risk decisions exist for.
- **Comprehension debt is the method's standing risk.** The review gate is the one resource
  that does not scale; at sustained throughput, four-eyes can decay into ceremony while every
  gate stays green — the gap between the code that exists and the code a human still
  understands widening quietly. The decision log (2.0-rc) makes the agent's *reasoning*
  replayable, which pays down half of it; the other half — whether the human at the gate is
  still reading — the method names here (delivery-harness red flags, HG-0013) but does not yet
  measure. Naming a debt is not paying it.

The method's own maturity self-grade against a regulated-bank bar — five states: absent,
defined, mechanically validated, platform enforced, organisationally enforced — lives in
`references/bank-grade-gap.md`, with the machine-readable state of record in the adopted
`docs/governance/control-catalog.json` (checked by its own gate).

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
