# middleleap-loom

**The Loom** — MiddleLeap's method for how a regulated entity builds software with AI. Two
harnesses arranged as a double diamond (discovery finds the right problem; delivery ships it
under control), running across a frame of always-on controls, weaving to the institution's own
context. Proven end-to-end on a UAE Open Finance back office: an autonomous build loop carried
134 of ~139 stories to done under quality gates and human four-eyes merge.

```
/plugin marketplace add middleleap/ai-dlc
/plugin install middleleap-loom@middleleap-ai-dlc
```

Human-facing documentation: **[docs/the-loom.html](../../docs/the-loom.html)** — the interactive
page showing how the Loom works (the loom figure, the double diamond, the brain, continuous
assurance, the governance catalog). The plugin's markdown canon and that page are the same
method in two forms: agents read the skill; people read the page.

## What's in it

| Type | Name | What it does |
|---|---|---|
| Skill | `loom` | The method canon — the metaphor, the double diamond, the context brain, plus full references for the discovery harness (D1–D9 gates), the delivery harness (the autonomous loop, Q-gates, merge policy), the governance catalog (HG-0001…HG-0012), and the Institutional BrainKit (`references/brainkit.md`) |
| Skill | `loom-adopt` | Stands the harness up in a repository — carries the machinery and walks the copy map (manifest-driven), seam mounting, ADOPT markers, BrainKit routing, and verification |
| Skill | `brainkit-init` | Drafts an Institutional BrainKit + institution profile from an institution's approved sources — records provenance, seals digests, produces a gap register; never invents policy or approves |
| Agent | `discovery-boundary-reviewer` | Guards the no-solutioning line (D4) and prototype fidelity (D8) on a discovery run |
| Agent | `data-governance-reviewer` | Judges control coverage and residual-risk soundness on a run's `data-governance.md`, beyond what the mechanical D6 gate can check |

The `loom-adopt` bundle (inside the skill, copied into adopting repos) carries:

- **`discovery/gates/`** — pure-Node, zero-dependency D1–D9 gate validator, with tests
- **`discovery/render/`** — zero-dependency branded renderer: HTML documents, decks, and
  wireframes, plus real `.docx`/`.pptx`/`.xlsx` via a hand-rolled OOXML writer, with tests
- **`discovery/templates/`** — one template per discovery artifact
- **`discovery/brand/`** — the brand-profile seam (neutral demo instance + a second example
  brand proving the swap)
- **`scripts/discovery-link-check.mjs`** — the waist gate: no feature enters delivery without
  a gate-green discovery hand-off
- **Five project skills** — `discovery`, `develop`, `next-story`, `implement-story`,
  `spec-change`: the operational encoding of both diamonds
- **Two reviewer templates** — `hard-stop-reviewer`, `contract-conformance-reviewer`
  (checklists are domain content; you fill in yours)
- **Three guardrail hooks** — `pii-guard`, `spec-tripwire`, `test-tripwire`, plus the
  settings snippet that wires them
- **A minimal data-risk register** — one complete regulation → risk → control → residual
  chain, so gate D6 passes end to end before you mount the real register

## The shape of the method

```
   DISCOVER        DEFINE            │    DEVELOP         DELIVER
   explore the     frame the ONE     │    explore N       ship it under
   problem space   problem + make    │    solution        control
                   it tangible       │    directions
        ◇──────────────◇             │       ◇──────────────◇
        discovery harness            │       delivery harness
                     └── hand-off (the PRD) ──┘
```

- **Warp** = the always-on controls: four-eyes, INSERT-only audit, lineage, gates, residency.
- **Shuttle** = the AI agents, weaving continuously.
- **Pattern** = the institution's context — its brain. **Cloth** = audit-ready software.
- The one-sentence guardrail: **agents do the building; humans stay accountable and merge.**

## Relationship to the origin

The Loom was extracted from the Open Finance Back Office build (the `ofbo` repository), whose
own instantiation — the CBUAE data-risk register, the OFBO brand profile, the OFBO hard-stop
checklists, the Q1–Q5 CI workflows — remains there as the worked example. This plugin is the
generic form: the machinery is identical, the domain mounts through the seams.

## Install nothing by accident

Installing the plugin adds two skills and two agents — nothing always-on. The hooks and the
build loop activate only when a repository adopts them explicitly via `loom-adopt`.
