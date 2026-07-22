# AI-DLC Harness Landscape — What Others Are Building (2026-07)

> **Purpose.** A competitive-and-trends scan of how the field is building *harnesses* for the AI
> Development Life Cycle — the scaffolding, methods, guardrails, and tooling that make AI-assisted
> software development safe, governed, and repeatable — with a lens on regulated financial services
> and the UAE/CBUAE context. Written to inform where **The Loom** invests next.
>
> **Method.** Multi-source web research, fan-out across five angles, adversarial 3-vote verification
> per claim. 24 sources fetched → 49 claims extracted → 25 verified → **25 confirmed, 0 refuted**,
> synthesized to 9 findings. Every finding below carries a confidence rating and its load-bearing
> sources. Read the [Caveats](#caveats--how-much-to-trust-this) section before relying on specifics —
> source quality is uneven and several load-bearing items are recent preprints, not adopted standards.
>
> **Date of research:** 2026-07-21.

---

## TL;DR — the big picture

The AI-DLC harness space is consolidating around **four reinforcing layers**, and — usefully — that
consolidation maps almost exactly onto The Loom's own architecture. The field is independently
converging on the framing The Loom already uses.

1. **Methodology is going spec-first.** Spec-Driven Development (GitHub `spec-kit`) has made the
   *specification* the primary artifact and code a generated expression of it. Academic work (the
   "Spec Growth Engine") pushes this further, turning **spec–code drift into a blocking merge error**.
   AWS packages the same idea as a governed, human-gated lifecycle **explicitly marketed to regulated
   financial services**.
2. **Guardrails are becoming a distinct CI practice.** "LLM-eval CI/CD quality gates" (Galtea,
   Harness.io, CodeScene) are emerging with *probabilistic, trend-based* semantics that replace binary
   pass/fail tests, and code-quality gates are now being **exposed to agents via MCP**. A NeurIPS-2025
   pattern ("Policy-as-Prompt") **synthesizes runtime guardrails directly from the PRDs/TDDs/code +
   risk controls teams already write.**
3. **"Harness engineering" is now a named discipline.** A community-canonical taxonomy treats
   verification/CI, permissions, observability, and human-in-the-loop as **first-class primitives** —
   externally validating The Loom's layered framing.
4. **A governance gap just opened at the top.** The US Fed's **SR 26-2** (Apr 2026) replaced SR 11-7
   but **explicitly excludes generative and agentic AI from scope** — shifting the burden onto
   institutions. Proposed frameworks (GAICF) aim to fill it; the **CBUAE's Feb 2026 AI/ML Guidance
   Note** extends UAE model-risk expectations into AI.

**The wedge for The Loom (see [Gaps](#gaps--differentiation-the-loom-wedge)):** nobody surveyed
occupies the intersection of Layer 2 and Layer 4 — **machine-verified enforcement of *named*
regulatory controls in CI** ("prove control X is enforced," not merely "tests pass"), crosswalked to
CBUAE / SR 26-2 / GAICF, and emitting an **audit-consumable evidence pack**. Everyone asserts
"auditability"; no one surveyed ships the schema.

---

## The competitive landscape at a glance

| Player / artifact | Layer(s) | What it is | Relationship to The Loom |
|---|---|---|---|
| **GitHub `spec-kit`** | 1 | OSS spec-driven-development toolkit; spec is source of truth; `/speckit.*` command pipeline | Closest OSS methodology peer; a HITL-gate pattern to mirror |
| **Spec Growth Engine** (arXiv preprint) | 1–2 | Academic: spec–code drift as blocking merge gate; blast-radius-scaled review | Formalizes a CI gate The Loom could ship |
| **AWS AI-DLC** | 1, 4 | Governed agentic lifecycle w/ mandatory human approval; **marketed to regulated FS** | The single strongest competitor/reference point |
| **Policy-as-Prompt** (NeurIPS 2025) | 2, 4 | Compiles PRDs/TDDs/code + risk controls into runtime LLM classifiers ("judge"); default-deny | Directly adoptable by The Loom's data-governance reviewers |
| **Galtea / Harness.io** | 2 | "LLM-eval CI/CD quality gates"; trend/drift regression; semantic LLM-as-judge | Concrete CI-gate patterns to adopt |
| **CodeScene** (+ CodeHealth MCP) | 2, 3 | Code Health as PR gate **and** MCP tool ("coach + gate") | Gate-as-MCP pattern to adopt |
| **`awesome-harness-engineering`** + O'Reilly / Databricks / HF | 3 | The emerging shared vocabulary for agent harnesses | Position The Loom against this taxonomy |
| **US Fed SR 26-2 / OCC 2026-13** | 4 | New MRM guidance that **excludes gen/agentic AI** | Defines the governance gap to fill |
| **GAICF** (arXiv preprint, Citi/FSU) | 4 | Proposed 4-layer control framework for gen-AI outside the model boundary | A control taxonomy to crosswalk gates to |
| **CBUAE Feb 2026 AI/ML Guidance Note** | 4 | UAE responsible-AI expectations; AI model inventory; supplements MMS 2022 | The Loom's home-jurisdiction anchor |

---

## Layer 1 — Process / methodology frameworks

### 1.1 Spec-Driven Development (SDD) is the dominant emerging methodology — `spec-kit`
**Confidence: HIGH.**

GitHub's `spec-kit` inverts the traditional artifact hierarchy: **the specification is the primary
source of truth and code is a generated expression of it** ("Specifications don't serve code — code
serves specifications"). It's delivered as a three-command pipeline —
`/speckit.specify` → `/speckit.plan` → `/speckit.tasks` — with automatic branch/feature numbering and
parallelizable task lists. Crucially for a governed harness, it ships **built-in human-in-the-loop
gates**:

- **`[NEEDS CLARIFICATION]` markers** that *force uncertainty to surface* rather than letting the
  agent silently guess.
- **Checklists** that verify testability and no-ambiguity before work proceeds.
- A **NON-NEGOTIABLE test-first rule** (Article III) requiring user-approved failing tests before
  implementation.

The strategic payoff: requirement changes become **systematic regenerations**, not manual rewrites.

> **Pattern to adopt.** The clarification-marker + testability-checklist gate is a *lightweight* HITL
> mechanism The Loom can mirror in its **discovery gates** — cheap to implement, high governance value,
> and it produces exactly the kind of "we forced the ambiguity to the surface and a human resolved it"
> evidence a reviewer wants.

*Source:* [`github/spec-kit` — spec-driven.md](https://github.com/github/spec-kit/blob/main/spec-driven.md)
(primary; corroborated by Martin Fowler, the Microsoft Developer blog, and the Spec Kit quickstart).
The ~15-min-vs-~12-hr framing is GitHub's own *illustrative* example, not an independent benchmark.

### 1.2 Academia is pushing SDD toward *machine-enforced architecture* — the "Spec Growth Engine"
**Confidence: MEDIUM** (single-author, non-peer-reviewed preprint; describes a *proposed* architecture,
not validated efficacy).

The Spec Growth Engine (arXiv 2606.27045; Hartwig Grabowski, Hochschule Offenburg, Jun 2026) makes
**spec–code drift a blocking merge error**: spec and code must co-evolve *in the same commit*, and
divergence *fails the merge*. Five interlocking mechanisms:

1. A **structured spec graph** with C4 levels and a contract/design separation.
2. A **Spine-based context assembler** (feeds the agent the right slice of spec).
3. A **vertical-slice growth protocol**.
4. A **blocking drift gate** — derives an *Intent Graph* from `SPEC.md` and an *Evidence Graph* from
   static analysis; a commit where they disagree is blocked.
5. A **governance model that scales review overhead to a change's blast radius** — small change, light
   review; large blast radius, heavy review.

Its distinguishing property is **machine enforcement**: classical design principles once left to
discipline (Parnas information hiding, "no architectural erosion," DRY at the architecture level) are
encoded as blocking gates and deterministic derivations. (Not globally novel — cf. ArchUnit and
architecture fitness functions — but the framing against discipline-based approaches holds.)

> **Pattern to adopt.** Two ideas are directly Loom-shaped: (a) the **drift gate** — a CI check that a
> named artifact and the code still agree — is the mechanical core of "control-verification"; and
> (b) the **blast-radius-scaled review model** is a clean way to make The Loom's human-in-the-loop
> *proportional* rather than uniform (cheap changes glide, risky ones escalate).

*Sources:* [arXiv 2606.27045 (PDF)](https://arxiv.org/pdf/2606.27045) ·
[HTML](https://arxiv.org/html/2606.27045v1).

### 1.3 AWS AI-DLC is the reference process framework — and it's *aimed at regulated FS*
**Confidence: HIGH.**

AWS's AI-DLC is the closest peer to The Loom that's shipping at scale. AI agents orchestrate the
end-to-end lifecycle (plans, specs, code, tests, infra configs) structured into **Inception →
Construction → Operations** phases run in short "bolts" (hours/days, not sprints), with **"Mob
Elaboration"** and a **mandatory human verify-and-approve gate that closes every phase and cannot be
skipped.**

Two things make it the strategic reference point:

- **Productivity is framed as *conditional* on harness infrastructure** — fast CI/CD, high-fidelity
  test environments, automated security & compliance gates, clear accountability, ongoing measurement.
  (i.e. AWS is saying out loud that *the harness is the product*, not the model.)
- Outputs are positioned as **demonstrable to regulators and auditors**, with **end-to-end
  traceability**: requirement → repo → generating agent → approving human → governing policy. Steering
  files encode regulatory policy (incl. the EU AI Act) *before* generation.

**Important nuance / opening for The Loom:** AWS emphasizes auditor/regulator *traceability* but does
**not** invoke SR 11-7 / model-risk-management terminology, and does not crosswalk to specific
banking regulations. The MRM-native, regulation-mapped angle is unclaimed.

*Sources:* [AWS Industries — "AI-Driven Development Lifecycle for Financial Services"](https://aws.amazon.com/blogs/industries/ai-driven-development-lifecycle-for-financial-services/)
· [`awslabs/aidlc-workflows`](https://github.com/awslabs/aidlc-workflows) (corroborated by Wiz,
StackHawk, ELEKS, and the AWS Marketplace wealth-management listing).

---

## Layer 2 — Guardrails & CI/CD gates

### 2.1 "LLM-eval CI/CD quality gates" are a distinct, emerging engineering practice
**Confidence: MEDIUM** (vendor blogs as primary, but the engineering patterns are corroborated by many
independent third parties).

A recognizable practice has formed around **evaluation-as-a-CI-gate** for anything LLM-shaped:

- **Every change to a prompt, model version, or retrieval config triggers an eval run against a
  versioned golden dataset**, wired into the deploy gate (Galtea).
- Because checks are **probabilistic** and the LLM judge is itself a fallible model that produces
  false negatives, **an eval score is an estimate with error bars, not a binary pass/fail.** So the
  field advocates **trend/drift-based regression detection over static thresholds**: a static `0.80`
  gate misses a slow decline that a *"more than 0.015/week for three weeks"* trend alert catches.
- CI/CD platform vendors (**Harness.io**) are productizing **"CI/CD for AI"** — semantic LLM-as-judge
  testing, guardrails, and progressive delivery — reframing release as **continuous multi-layer
  safeguards** rather than isolated pre-release checkpoints, because **AI failures are silent
  regressions, not obvious crashes.**

Corroborated by Latitude.so, Braintrust, Datadog, Splunk, Traceloop, and Google Cloud's Architecture
Center (which hosts a "Harness CI/CD pipeline for RAG applications").

> **Patterns to adopt for The Loom's CI gates.**
> - **Versioned golden datasets** as first-class, reviewable repo artifacts.
> - **Trend/drift alerts backed by time-series storage** — not just a threshold in a YAML file.
> - **Treat the judge as a fallible model with error bars** — record the judge's own version and
>   confidence, so an auditor can see *how* a gate decided, not just the verdict.

*Sources:* [Galtea — CI/CD quality gate](https://galtea.ai/blog/automated-llm-evaluation-building-a-ci-cd-quality-gate-that-actually-runs)
· [Harness.io — AI deployment](https://www.harness.io/blog/ai-deployment-in-production-orchestrate-llms-rag-agents).

### 2.2 Policy-as-Prompt — synthesize runtime guardrails from artifacts you already write
**Confidence: HIGH** on design/existence (the only **peer-reviewed** source in the survey); tempered on
efficacy.

Policy-as-Prompt (NeurIPS 2025; arXiv 2509.23994; Pure Storage) is the most directly transferable
Layer-2/4 pattern found. It:

1. Reads **unstructured PRDs/TDDs/code plus risk controls**,
2. Builds a **source-linked policy tree**, and
3. Compiles it into **lightweight prompt-based LLM classifiers** that act as a real-time **judge**
   validating agent inputs and outputs (an **Input Classifier** + **Output Auditor**, classifying
   statements as VALINP / INVALINP / VALOUT / INVALOUT).

It's architected as a **default-deny guardrail enforcing least-privilege and data minimization** —
blocking non-compliant inputs *before* they reach the agent, deferring ambiguous cases to human
review, with **complete provenance, traceability, and audit logging** in a human-in-the-loop process.
Evaluated on real enterprise HR and SOC systems.

> **Caveat that matters for regulated use.** Measured classifier accuracy is a modest **~70–73%** — so
> "default-deny / high-percentage-blocked" is *design intent*, not a strong empirical guarantee. In a
> bank, that means Policy-as-Prompt is a **triage/assist layer**, not the control of record; the
> false-negative handling at the compliance boundary is an open design question (see
> [Open questions](#open-questions--the-research-frontier)).

> **Pattern to adopt.** The **"compile existing design artifacts into runtime classifiers"** move is
> exactly what The Loom's data-governance reviewers could do: turn a discovery-phase risk register into
> a set of runtime/CI checks with **source links back to the controlling clause** — that source-linking
> *is* the audit trail.

*Sources:* [arXiv 2509.23994 (HTML)](https://arxiv.org/html/2509.23994v1) ·
[OpenReview](https://openreview.net/pdf?id=8TMSomzq6y).

### 2.3 CodeScene — a reusable guardrail taxonomy, and the "gate = MCP tool" pattern
**Confidence: MEDIUM** (vendor docs + verifiable OSS repo).

CodeScene offers a compact, reusable **guardrail taxonomy for AI-assisted coding** — three fundamental
guardrails: **Code Quality, Code Familiarity, Code/Test Coverage** — and enforces its **Code Health**
metric as an automated gate in PR/MR reviews and across agentic workflows. The notable move: the same
check is exposed **both** as an IDE-local/CI gate **and** as a **CodeHealth MCP server** that acts as
"**both a coach and a quality gate**" (verifiable: `codescene-oss/codescene-mcp-server`, npm
`@codescene/codehealth-mcp`).

> **Pattern to adopt.** **Expose each Loom gate simultaneously as (a) a blocking CI check and (b) an
> MCP tool the coding agent consults *in-loop*.** Same rule, two surfaces: the agent self-corrects
> before it ever hits the gate, and the gate stays authoritative. This collapses the usual "the agent
> didn't know the rule until CI failed" waste.

*Sources:* [CodeScene — guardrails for AI-assisted coding](https://codescene.com/blog/implement-guardrails-for-ai-assisted-coding)
· [`codescene-oss/codescene-mcp-server`](https://github.com/codescene-oss/codescene-mcp-server).

---

## Layer 3 — Agent orchestration & tooling

### 3.1 "Harness engineering" has crystallized as a named discipline
**Confidence: MEDIUM** (anchored on a community awesome-list, corroborated by trade press).

The scaffolding around an agent now has a name and a shared vocabulary. **"Harness engineering"** is
defined as the six-part scaffold around an agent: **context delivery, tool interfaces, planning
artifacts, verification loops, memory systems, and sandboxes.** Its community-canonical **design-primitive
taxonomy explicitly places guardrail/governance mechanisms as first-class primitives** alongside the
agent loop — not as bolt-ons:

- **Verification & CI Integration**
- **Permissions & Authorization**
- **Observability & Tracing**
- **Human-in-the-Loop**

The term is independently corroborated as an established discipline by **O'Reilly Radar** ("Agent
Harness Engineering"), **Databricks** ("What is an AI Agent Harness?"), and **Hugging Face's** agent
glossary (all 2025–2026).

> **Why this matters for The Loom.** The field is *independently converging on The Loom's own framing* —
> that verification, permissions, observability, and HITL are core primitives, not features. That's
> external validation and a positioning opportunity: speak the emerging shared vocabulary, then show
> The Loom extends it **up** into Layers 1 and 4 (methodology + regulatory governance), where this
> taxonomy is thin — its primitives map mostly to Layers 2–3.

*Source:* [`ai-boost/awesome-harness-engineering`](https://github.com/ai-boost/awesome-harness-engineering)
(secondary; corroborated by O'Reilly, Databricks, Hugging Face).

---

## Layer 4 — Governance & assurance

### 4.1 A governance gap opened at the top of the assurance layer — SR 26-2 excludes gen/agentic AI
**Confidence: HIGH.**

The US Federal Reserve's **SR 26-2** (issued **17 Apr 2026**, jointly with **OCC Bulletin 2026-13**)
replaced the long-standing **SR 11-7** with a more risk-based, materiality-sensitive model-risk-
management framework — but it **explicitly excludes generative and agentic AI from formal scope**
("generative AI and agentic AI models … are not within the scope of this guidance"), shifting the
burden to institutions to fill the gap with broader risk practices.

Academic responses are already appearing. The proposed **Generative AI Control Framework (GAICF**;
arXiv 2607.04103; Citigroup/FSU authors) translates MRM principles into a **four-layer control
structure** — approved-use boundary determination, risk-tier assignment, evidence-grounded input
assessment, operational-mode classification, output evaluation, monitoring, and auditability — for
gen-AI applications that sit **outside the formal model boundary but remain embedded in regulated
banking processes.** (GAICF is a ~2-week-old preprint: a *proposal*, not an adopted standard.)

> **This is the sharpest differentiation opening for The Loom.** A regulator has *formally declared*
> that the thing everyone is now doing (gen/agentic AI in the SDLC) is **out of scope of the primary
> MRM guidance**, i.e. governed only by whatever the institution builds. A **machine-verified control
> framework mapped to that named gap** is precisely what neither AWS nor the eval-gate vendors offer.

*Sources:* [Federal Reserve — SR 26-2](https://www.federalreserve.gov/supervisionreg/srletters/SR2602.htm)
· [arXiv 2607.04103 (GAICF, PDF)](https://arxiv.org/pdf/2607.04103) (SR 26-2 corroborated by OCC
Bulletin 2026-13, Baker Tilly, Sia Partners, Databricks, ValidMind).

### 4.2 UAE — the CBUAE Feb 2026 AI/ML Guidance Note extends model-risk expectations into AI
**Confidence: HIGH.**

In **February 2026** the CBUAE issued a **"Guidance Note on the Consumer Protection and Responsible
Adoption and Use of AI and Machine Learning by Licensed Financial Institutions."** Though framed
through a **consumer-protection** lens, it extends into **governance, model risk management,
outsourcing, and operational resilience.** Key points:

- It **supplements rather than replaces** existing frameworks — including the **CBUAE Model Management
  Standards (2022)**, the **Consumer Protection Regulation**, and outsourcing requirements.
- It **mandates an AI model inventory** aligning with the 2022 Model Management Standards.

Confirmed by primary CBUAE Rulebook listing plus Reuters (23 Feb 2026), Gulf Today, Zawya, MENA
Fintech, and law-firm analyses (Hadef & Partners, Pinsent Masons).

> **Directly on-target for The Loom's home turf.** This composes with the repo's existing CBUAE
> **CPS / PDPL / MMS / CPS-AI** taxonomy. The concrete move: **crosswalk The Loom's gates to this Note**
> — especially the mandated **AI model inventory** (a natural artifact for a harness to *emit and keep
> current automatically*) and the MMS-2022 alignment.

*Sources:* [CBUAE Rulebook](https://rulebook.centralbank.ae) ·
[Hadef & Partners — AI in Banking & Finance in the UAE 2026](https://hadefpartners.com/news-insights/insights/ai-in-banking-finance-in-the-uae-2026-legal-regulatory-considerations/).

---

## Latest signals (last ~6–12 months)

A rough timeline of the freshest movements, newest-relevant first:

- **Jul 2026** — GAICF preprint (arXiv 2607.04103) proposes a control framework specifically for the
  gen-AI governance gap.
- **Jun 2026** — Spec Growth Engine preprint (arXiv 2606.27045) formalizes machine-enforced spec–code
  drift gating.
- **Apr 2026** — **SR 26-2 / OCC 2026-13** replace SR 11-7 and **exclude gen/agentic AI** — the single
  most consequential regulatory signal for this space.
- **Feb 2026** — **CBUAE AI/ML Guidance Note** issued; mandates AI model inventory, extends MMS-2022.
- **~2025–2026** — **AWS AI-DLC** materializes as a named, FS-targeted methodology (`awslabs/aidlc-workflows`).
- **2025** — **Policy-as-Prompt** peer-reviewed at NeurIPS 2025 — earliest rigorous "compile artifacts
  into runtime guardrails" result.
- **Ongoing 2025–2026** — **"harness engineering"** stabilizes as a discipline (O'Reilly / Databricks /
  Hugging Face); **spec-kit** becomes the reference OSS methodology; **LLM-eval CI gates** and
  **gate-as-MCP** (CodeScene) become mainstream vendor practice.

**Direction of travel:** from *advice* → *mechanism*. The whole field is moving from "here are
principles you should follow" toward "here is a gate that **blocks the merge** if you don't." That is
The Loom's native register — the trend is coming toward you.

---

## Gaps & differentiation (the Loom wedge)

The verified findings point to a specific, currently-unoccupied position:

1. **Control-verification, not just quality-gating.** Everyone gates on *quality* (Code Health, eval
   scores, drift). **No surveyed player runs CI that proves a *named required regulatory control* is
   enforced** — the intersection of Layer 2 (gates) and Layer 4 (governance) is empty. The Spec Growth
   Engine's *drift gate* is the mechanical template; The Loom supplies the *regulatory* payload.

2. **A regulation-mapped crosswalk.** No published control-to-CI-gate crosswalk mapped to **CBUAE**
   (CPS/PDPL/MMS/CPS-AI or the Feb 2026 Note) or to **SR 26-2 / GAICF** appears to exist in the wild;
   regulatory control-verification still looks **manual/attestation-based** across every surveyed
   player. AWS gives *traceability* but not MRM-mapped *verification*. This is The Loom's repo strength
   (it already carries these taxonomies) turned into a differentiator.

3. **An audit-consumable evidence pack.** AWS, Policy-as-Prompt, and GAICF all *assert* "auditability"
   and provenance — **none specify the schema** of an evidence pack a third-line/internal-audit function
   could actually consume. A defined **provenance/evidence schema** (requirement → control → gate →
   verdict → approving human) is a concrete, ownable Loom deliverable.

4. **MRM-native vocabulary in a gen-AI world.** SR 26-2 excluded gen/agentic AI; The Loom can be the
   harness that **speaks model-risk-management natively** for exactly the artifacts the regulator left
   uncovered — filling the declared gap rather than talking around it.

> **One-line positioning.** *"The Loom is the AI-SDLC harness that turns named regulatory controls into
> CI gates and emits the audit evidence — the Layer-2×Layer-4 intersection no one else ships."*

**Fast-follow adoptions (low regret, borrow directly):**

- `spec-kit`-style **`[NEEDS CLARIFICATION]` markers + testability checklist** in discovery gates (§1.1).
- **Blast-radius-scaled human-in-the-loop** (§1.2).
- **Versioned golden datasets + trend/drift alerts** in CI gates (§2.1).
- **Compile the risk register into source-linked runtime/CI classifiers** (§2.2).
- **Every gate is also an MCP tool** the agent consults in-loop (§2.3).
- **Auto-maintained AI model inventory** as a first-class harness output (§4.2).

---

## Open questions — the research frontier

These are the highest-value unknowns; each is a candidate for a follow-up probe *or* a Loom feature:

1. Does **any** vendor or bank actually couple a machine-enforced **spec-drift gate** with **regulatory
   control-verification** — CI that proves a named control is enforced, not merely that tests pass? The
   Layer-2×Layer-4 intersection appears unoccupied — the clearest Loom differentiator.
2. Is there **any** published control-to-CI-gate crosswalk mapped to **CBUAE** or **SR 26-2 / GAICF** in
   the wild, or is regulatory control-verification still **manual/attestation-based** everywhere?
3. How do **third-line / internal-audit** functions *concretely* integrate with these harnesses?
   Everyone asserts "auditability"; **no one specifies an audit-consumable evidence-pack or provenance
   schema.** (Potential Loom deliverable.)
4. What is the **real-world production adoption and efficacy** of Policy-as-Prompt-style runtime
   guardrails in regulated environments, given the modest ~70–73% classifier accuracy — and **how are
   false negatives handled at the compliance boundary?**

---

## Caveats — how much to trust this

Source quality is uneven and should shape how much weight each finding carries:

- **Only one load-bearing source is peer-reviewed** (Policy-as-Prompt, NeurIPS 2025). Two others are
  **single, non-peer-reviewed arXiv preprints describing *proposed* frameworks** (Spec Growth Engine
  2606.27045; GAICF 2607.04103) — treat as **design intent, not validated efficacy or market reality.**
- **Vendor sources** (AWS, Galtea, Harness.io, CodeScene) are the correct primary authority for
  "vendor positions/defines X" claims but are **marketing-adjacent**; their *engineering patterns* are
  corroborated by third parties, but **efficacy figures are not independent benchmarks** (AWS's
  15-min-vs-12-hr and spec-kit's are illustrative; Policy-as-Prompt's "default-deny" framing sits
  against a measured ~70–73% accuracy).
- The **"harness engineering is a named discipline"** claim rests on a community awesome-list plus
  corroborating trade press, not a formal standard.
- **Method note / fetch reliability:** direct `WebFetch` of most primary URLs (arXiv, AWS, CBUAE,
  CodeScene, Galtea, OpenReview) returned **HTTP 403 through the egress proxy**, so verbatim confirmation
  relied on **web-search snippet reproduction plus multi-source corroboration** — strong and consistent,
  but not raw-page reads. Verify verbatim quotes against the primary source before citing externally.
- **Time-sensitivity is high.** SR 26-2 (Apr 2026) and the CBUAE Guidance Note (Feb 2026) are recent and
  their supervisory *interpretation is still settling*; `spec-kit` command prefixes and version-gated
  behavior evolve. **Re-verify before relying on specifics.**

### Provenance of this document
Produced by the repo's `deep-research` workflow (fan-out search → fetch → 3-vote adversarial
verification → synthesis). Run stats: 5 angles · 24 sources fetched · 49 claims extracted · 25 verified
· **25 confirmed, 0 refuted, 0 unverified** · 9 synthesized findings · 106 agent calls. Every finding
above passed **3-0 unanimous** verification.

---

## Sources (load-bearing)

**Primary**
- GitHub `spec-kit` — spec-driven.md — https://github.com/github/spec-kit/blob/main/spec-driven.md
- AWS Industries — AI-Driven Development Lifecycle for Financial Services — https://aws.amazon.com/blogs/industries/ai-driven-development-lifecycle-for-financial-services/
- `awslabs/aidlc-workflows` — https://github.com/awslabs/aidlc-workflows
- Policy-as-Prompt (NeurIPS 2025) — https://arxiv.org/html/2509.23994v1 · https://openreview.net/pdf?id=8TMSomzq6y
- Spec Growth Engine — https://arxiv.org/pdf/2606.27045 · https://arxiv.org/html/2606.27045v1
- GAICF — https://arxiv.org/pdf/2607.04103
- US Federal Reserve — SR 26-2 — https://www.federalreserve.gov/supervisionreg/srletters/SR2602.htm
- CBUAE Rulebook — https://rulebook.centralbank.ae

**Secondary / corroborating**
- Hadef & Partners — AI in Banking & Finance in the UAE 2026 — https://hadefpartners.com/news-insights/insights/ai-in-banking-finance-in-the-uae-2026-legal-regulatory-considerations/
- `ai-boost/awesome-harness-engineering` — https://github.com/ai-boost/awesome-harness-engineering

**Vendor / practitioner**
- Galtea — CI/CD quality gate — https://galtea.ai/blog/automated-llm-evaluation-building-a-ci-cd-quality-gate-that-actually-runs
- Harness.io — AI deployment / CI-CD for AI — https://www.harness.io/blog/ai-deployment-in-production-orchestrate-llms-rag-agents
- CodeScene — guardrails for AI-assisted coding — https://codescene.com/blog/implement-guardrails-for-ai-assisted-coding
- `codescene-oss/codescene-mcp-server` — https://github.com/codescene-oss/codescene-mcp-server
