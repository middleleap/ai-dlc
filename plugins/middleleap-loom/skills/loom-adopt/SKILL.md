---
name: loom-adopt
description: Stand the Loom harness up in a repository — copies the discovery machinery (D1–D9 gate validator, zero-dep branded renderer, artifact templates, brand seam, register seam), the delivery-loop skills (discovery, develop, next-story, implement-story, spec-change), the reviewer-agent templates, and the guardrail hooks into the current project, then walks the seam-mounting and verification steps. Use when a project wants to adopt the Loom way of building, set up the discovery harness, install the build-loop guardrails, or bootstrap an AI-SDLC for a regulated build.
---

# Adopt the Loom in this repository

This skill scaffolds the Loom's two harnesses into the current repo from the bundle in this
skill's `harness/` directory. Everything copied is the generic machinery — the domain mounts
through two seams (brand profile, data-risk register) and the `ADOPT:` markers you fill in.

Read the method first if you haven't: the `loom` skill (sibling in this plugin), especially
`references/discovery-harness.md` — that file becomes this repo's `discovery/DISCOVERY.md`.

## 0. Preconditions

- A git repository. Node ≥ 18 available (`node --test` is used by the bundled test suites).
- Ask the user before overwriting anything that already exists — an existing `discovery/` or
  `.claude/skills/` means a partial or prior adoption; reconcile, don't clobber.

## 1. Copy the machinery

All sources are relative to this skill's directory. All destinations are repo-root-relative.

| Bundle source | Destination | What it is |
|---|---|---|
| `../loom/references/discovery-harness.md` | `discovery/DISCOVERY.md` | The canon (single source — do not fork the text) |
| `harness/discovery/gates/` | `discovery/gates/` | Pure-Node D1–D9 validator + its tests |
| `harness/discovery/render/` | `discovery/render/` | Zero-dep branded renderer (HTML + OOXML) + tests |
| `harness/discovery/templates/` | `discovery/templates/` | One template per discovery artifact |
| `harness/discovery/brand/design.md` | `discovery/brand/design.md` | Brand seam (neutral demo instance) |
| `harness/discovery/brand/examples/` | `discovery/brand/examples/` | A second brand proving the seam swap |
| `harness/scripts/discovery-link-check.mjs` | `scripts/discovery-link-check.mjs` | The waist gate (backlog item ↔ green hand-off) |
| `harness/scripts/control-plane-check.mjs` | `scripts/control-plane-check.mjs` | The control-plane integrity gate (HG-0002) + its tests |
| `harness/scripts/model-provenance-check.mjs` | `scripts/model-provenance-check.mjs` | The model-provenance gate (HG-0006) + its tests |
| `harness/scripts/evidence-seal-check.mjs` | `scripts/evidence-seal-check.mjs` | The evidence-seal gate (HG-0003) + its tests |
| `harness/governance/CODEOWNERS.template` | `CODEOWNERS` (fill the team) | Immutable control-plane ownership (HG-0002) |
| `harness/governance/activation-runbook.md` | `docs/governance/activation-runbook.md` | Platform-admin runbook to activate HG-0001/0002/0004 |
| `harness/governance/model-manifest.template.json` | `docs/governance/model-manifest.json` | Model inventory seam (HG-0006) — replace demo values |
| `harness/governance/evidence-manifest.template.json` | `docs/governance/evidence/manifest.json` | Sealed evidence index seam (HG-0003) — reseal with real hashes |
| `harness/skills/*/SKILL.md` | `.claude/skills/<name>/SKILL.md` | discovery · develop · next-story · implement-story · spec-change |
| `harness/agents/*.md` | `.claude/agents/` | hard-stop-reviewer + contract-conformance-reviewer (templates — see step 3) |
| `harness/hooks/*.sh` | `.claude/hooks/` | pii-guard · spec-tripwire · test-tripwire (`chmod +x`) |
| `harness/hooks/settings.hooks.json` | merge into `.claude/settings.json` | Hook wiring (drop the `_comment` key) |
| `harness/register-example/` | `docs/governance/data-risk-register/` | Minimal working register (replace with the real one) |

Also create if missing: `discovery/runs/`, `docs/develop/`, `docs/adrs/`, `docs/backlog.yaml`
(empty list is fine), `docs/build-log.md`.

Four agents — `discovery-boundary-reviewer`, `data-governance-reviewer`, the
continuous-assurance scanner `change-watch`, and the `model-risk-reviewer` (HG-0006) — ship
as **plugin agents** and work as soon as the machinery lands; they need no copying.

## 2. Mount the seams

- **Brand (D7):** edit `discovery/brand/design.md` — entity name, banner, and the token
  *values* (never the token *names*; everything downstream reads names). If the org's brand
  lives elsewhere (e.g. a design-system skill), transcribe its values into the tokens.
- **Register (D6):** replace the example records in `docs/governance/data-risk-register/`
  with the organisation's regulation → risk → control → residual chain, behind the same JSON
  shape (documented in its README). Until then the example register keeps D6 green so the
  pipeline is exercisable end to end.

## 3. Fill the ADOPT markers

Every bundled file that needs project-specific content carries an `ADOPT:` marker. Find them
all: `grep -rn "ADOPT" .claude/ discovery/ scripts/`. As of this bundle:

- `.claude/agents/hard-stop-reviewer.md` — replace the checklist with THIS project's
  non-negotiables (keep the FAIL/VERDICT protocol and file:line citation rule).
- `.claude/agents/contract-conformance-reviewer.md` — replace with THIS project's binding API
  conventions.
- `.claude/hooks/spec-tripwire.sh` — set `SPEC_PATH` to the project's contract file.
- `.claude/hooks/pii-guard.sh` — swap the UAE PII patterns for the project's jurisdiction.
- `scripts/discovery-link-check.mjs` — set `FEATURE` to the project's story-id convention.
- `.claude/skills/next-story/SKILL.md` and `implement-story/SKILL.md` — name the project's
  verify commands and binding test cases.

`CLAUDE.md` must state the binding conventions those reviewers and skills cite — if the repo
has none yet, write the Commands / Conventions / Do-Not sections before running the loop.

## 4. Verify the adoption — evidence, not vibes

```bash
node --test discovery/gates/*.test.mjs discovery/render/*.test.mjs scripts/*.test.mjs   # bundled suites must pass as copied
node scripts/discovery-link-check.mjs            # waist gate runs (green on an empty backlog)
node scripts/control-plane-check.mjs             # control-plane gate (green once CODEOWNERS is filled)
node scripts/model-provenance-check.mjs          # model-provenance gate (green on the demo manifest)
node scripts/evidence-seal-check.mjs             # evidence-seal gate (green on the demo manifest)
```

Then prove the pipeline end to end: run the `discovery` skill on a small real (or synthetic)
problem through to `node discovery/gates/validate.mjs discovery/runs/<slug>` green, and render
one artifact with the renderer to confirm D7 conformance. Only then aim the delivery loop
(`/loop /next-story`) at the backlog.

## 5. Wire CI and governance

- CI: run the bundled test suites, `discovery-link-check.mjs`, `control-plane-check.mjs`,
  `model-provenance-check.mjs`, `evidence-seal-check.mjs`, and `validate.mjs` over every
  `discovery/runs/*` on each PR — a broken run, an untraced feature item, an unowned control
  file, an unpinned/unevaluated model, or an unsealed/tampered evidence bundle blocks merge like
  a failing test. Add the project's own Q-gates per `../loom/references/delivery-harness.md`.
- Governance: walk `../loom/references/governance.md`, then run
  `governance/activation-runbook.md` (a platform admin, outside the agent's write scope) to
  activate HG-0001/HG-0002/HG-0004 — branch protection with required Code Owner review from a
  group the agent's identity is not in, the control files owned in CODEOWNERS (verified by
  `control-plane-check.mjs`), and a least-privilege agent identity. The loop's merge policy
  depends on this being real, not configured-but-inert.

## What adoption deliberately does NOT do

- It does not write the project's CLAUDE.md, PRD, or API contract — those are the canon the
  harness *reads*; authoring them is the project's work (the `middleleap-ai-sdlc` plugin helps).
- It does not enable any always-on behaviour by itself: hooks activate only when the user
  merges the settings snippet, and the loop runs only when invoked.
- It does not bring OFBO's domain content — no register records beyond the example, no brand
  beyond the demo, no hard-stop list beyond the template. The value of the Loom is the frame;
  the pattern woven on it is the institution's own.
