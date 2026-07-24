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

The one-command way: **`node harness/adopt.mjs --dest <repo-root>`** — the idempotent installer
reads `harness/copy-manifest.json` (the single source of truth) and lays every file below into
place, emitting an adoption report (source → destination → status). Re-running is safe. A
`*.template` file is copied but never auto-filled — templates land `adopt-pending` and you fill
their ADOPT markers in step 3.

The table below is **generated from that same manifest** (a doc-integrity gate fails the build if
it drifts), so it can never lag the machinery. Sources are relative to `harness/`; destinations
are repo-root-relative.

<!-- LOOM:COPY-TABLE:START -->
| Bundle source | Destination | What it is |
|---|---|---|
| `../../loom/references/discovery-harness.md` | `discovery/DISCOVERY.md` | The discovery canon (single source — do not fork the text) |
| `discovery/gates` | `discovery/gates` | Pure-Node D1–D9 validator + its tests |
| `discovery/render` | `discovery/render` | Zero-dep branded renderer (HTML + OOXML) + tests |
| `discovery/templates` | `discovery/templates` | One template per discovery artifact |
| `discovery/brand/design.md` | `discovery/brand/design.md` | Brand seam (neutral demo instance) |
| `discovery/brand/examples` | `discovery/brand/examples` | A second brand proving the seam swap |
| `scripts/*.mjs` | `scripts/` | Every gate + its tests (globbed — a per-file list silently drops new gates) |
| `core` | `core` | Policy compiler, gate runner, attestations, compiled-requirements (control plane) |
| `profiles` | `profiles` | Profiles as data: base + jurisdiction + product-type |
| `hooks/*.sh` | `.claude/hooks/` | Pre-write guardrail hooks (pii-guard, spec/test tripwires) |
| `hooks/settings.hooks.json` | `.claude/settings.json` | Hook wiring for Claude Code (merged, never overwritten — a pre-existing settings.json is preserved and a .loom.json sidecar is dropped to merge by hand) |
| `governance/runbooks/*.md` | `docs/governance/runbooks/` | Seven adoption runbooks + the supervised-pilot playbook |
| `governance/activation-runbook.md` | `docs/governance/activation-runbook.md` | How to activate branch protection, IAM, the routine lane |
| `governance/routine-controller.yml` | `docs/governance/routine-controller.yml` | Reference routine auto-merge controller — separated bot identity, gated on routine-qualified + config-reconciliation (rc.12 WS2.3) |
| `governance/CODEOWNERS.template` | `CODEOWNERS` | The control-plane ownership map (replace @your-org/… — the gate fails until you do) |
| `governance/control-catalog.template.json` | `docs/governance/control-catalog.json` | The machine-readable control state of record |
| `governance/identities.template.json` | `docs/governance/identities.json` | The identity registry (approvals resolve against it) |
| `governance/attestation-issuers.template.json` | `docs/governance/attestation-issuers.json` | Allowed-issuers registry for ed25519 attestations |
| `governance/model-manifest.template.json` | `docs/governance/model-manifest.json` | Model inventory (pinned, tiered, evaluated, runtime-governed) |
| `governance/data-lifecycle.template.json` | `docs/governance/data-lifecycle.json` | Data classification, retention, erasure, residency |
| `governance/operations-signal.template.json` | `docs/governance/operations-signal.json` | The Run→Discovery feedback log |
| `governance/service-readiness.template.json` | `docs/governance/services/example-service.json` | Operational readiness R1–R6 (per service; unparseable ADOPT dates fail until you exercise the drills) |
| `governance/product-evals.template.json` | `docs/governance/product-evals.json` | Product-outcome evals (discovery-linked, measures scored, commit-bound) |
| `governance/routine-envelope.template.json` | `docs/governance/routine-envelope.json` | The second-line-owned routine-change envelope (HG-0013) |
| `governance/config-baseline.template.json` | `docs/governance/config-baseline.json` | The approved control-plane configuration reconciled against live observations (rc.12 WS2.4) |
| `governance/token-ledger.template.json` | `docs/governance/token-ledger.json` | Token-spend ledger (a report, never a merge gate) |
| `adapters/README.md` | `docs/governance/adapters/README.md` | The neutral adapter contract |
| `guardrails` | `guardrails` | Runtime-neutral guardrail policy + generated capability matrix (rc.13 WS4 — the Loom never implies coverage a runtime lacks) |
| `brainkit/manifest.template.json` | `institution/brainkit/manifest.json` | BrainKit manifest — identity, version, lifecycle, owners, digests, approvals (draft until owners approve) |
| `brainkit/identity/design.md` | `institution/brainkit/identity/design.md` | BrainKit institutional identity + design language (the D7 projection source) |
| `brainkit/terminology.md` | `institution/brainkit/terminology.md` | BrainKit binding vocabulary |
| `brainkit/architecture.md` | `institution/brainkit/architecture.md` | BrainKit architecture principles and constraints |
| `brainkit/technology-policy.json` | `institution/brainkit/technology-policy.json` | BrainKit technology policy (allowed / consult / forbidden) |
| `brainkit/governance.md` | `institution/brainkit/governance.md` | BrainKit decision rights |
| `brainkit/source-register.json` | `institution/brainkit/source-register.json` | BrainKit approved source register (every section grounds in it) |
| `brainkit/repository-instructions.md` | `institution/brainkit/repository-instructions.md` | Canonical read-the-BrainKit fragment — referenced from AGENTS.md/CLAUDE.md, never overwriting them |
| `ci/ci.yml` | `.github/workflows/ci.yml` | The reference CI workflow that runs every gate |
<!-- LOOM:COPY-TABLE:END -->

Plus, still copied by hand (project-specific templates, see step 3): `harness/skills/*/SKILL.md`
→ `.claude/skills/<name>/SKILL.md`, `harness/agents/*.md` → `.claude/agents/`, and the worked
fixtures under `harness/{evidence-example,change-example,assurance-example,register-example}/`
you adapt into `docs/governance/`.

Also create if missing: `discovery/runs/`, `docs/develop/`, `docs/adrs/`, `docs/backlog.yaml`
(empty list is fine), `docs/build-log.md`.

Worked examples to study in the bundle (not copied): `harness/register-example/` (the D6 chain),
`harness/discovery/brand/examples/` (a second brand), and `harness/operations-example/` — a
realistic Meridian Trust operations-signal log showing the Run→Discovery loop close across all
four routes (`../loom/references/operations.md`).

Five agents ship as **plugin agents** and work as soon as the machinery lands (no copying):
`discovery-boundary-reviewer`, `data-governance-reviewer`, the `model-risk-reviewer` (HG-0006),
and the continuous-assurance pair `change-watch` (① Watch) + `risk-reviewer` (② Assess).

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
node scripts/data-lifecycle-check.mjs            # data-lifecycle gate (green on the demo manifest)
node scripts/operations-signal-check.mjs         # Run→Discovery feedback gate (green on empty or the demo log)
```

Then prove the pipeline end to end: run the `discovery` skill on a small real (or synthetic)
problem through to `node discovery/gates/validate.mjs discovery/runs/<slug>` green, and render
one artifact with the renderer to confirm D7 conformance. Only then aim the delivery loop
(`/loop /next-story`) at the backlog.

## 5. Wire CI and governance

- CI: the reference `.github/workflows/ci.yml` (copied in step 1) runs the bundled test
  suites and **every gate in the control catalog** on each PR — the control plane and catalog,
  the identity registry, the change envelope with its compiled-plan reconciliation and compound
  production authorization, PA1/PA2, architecture assurance, operational readiness, the Q-gates
  (test-integrity, SAST, secrets, supply-chain), model provenance, evidence seal, data lifecycle,
  the Run→Discovery feedback loop, product-outcome evals, the runtime assurance cycle and
  decision log, adapters, the routine-change lane (in its two check contexts), and `validate.mjs`
  over every `discovery/runs/*`. The set is not memorised here — it is the catalog, and the
  gate runner executes exactly what the catalog and the compiled plans require. A broken run, an
  untraced feature item, an unowned control file, an unpinned/unevaluated model, an
  unsealed/tampered evidence bundle, a data category with no bounded retention or erasure
  disposition, or an untriaged operational signal
  blocks merge like a failing test. Own the workflow file in CODEOWNERS (HG-0002) and add the
  project's own Q-gates per `../loom/references/delivery-harness.md`.
- Governance: walk `../loom/references/governance.md`, then run
  `governance/activation-runbook.md` (a platform admin, outside the agent's write scope) to
  activate HG-0001/HG-0002/HG-0004 — branch protection with required Code Owner review from a
  group the agent's identity is not in, the control files owned in CODEOWNERS (verified by
  `control-plane-check.mjs`), and a least-privilege agent identity. The loop's merge policy
  depends on this being real, not configured-but-inert.

## 6. Institutional BrainKit (when the institution owns one)

The bundle installs the BrainKit templates into `institution/brainkit/` as **adopt-pending** — the
installer copies them but never invents or approves institutional content. Detect and route:

- **No BrainKit, or only the adopt-pending template** (`institution/brainkit/manifest.json` absent or
  still carrying `ADOPT:`/`status: draft`): run the **`brainkit-init`** skill to generate a *draft*
  BrainKit and institution profile from the institution's **approved** sources, seal the digests,
  and produce a gap register. It never invents policy, authority, or brand rules, and never approves.
- **An approved BrainKit** (`status: approved`, sealed, owners resolving to the registry): a governed
  change in this repo names the institution profile (`profiles/institutions/<id>.json`) in
  `required_profiles`. The compiler then makes `brainkit-conformance` + `brainkit-provenance`
  mandatory-when-compiled, and `brainkit-check` enforces integrity on every PR.

Wire the read-the-BrainKit fragment (`institution/brainkit/repository-instructions.md`) into the
repo's `AGENTS.md`/`CLAUDE.md`/`.cursorrules` as a **reference** — propose a concise pointer and patch
an existing instruction file only after the user confirms; never overwrite it. A change to
`institution/` is never routine and always requires the context owner's review. See
`../loom/references/brainkit.md`.

## What adoption deliberately does NOT do

- It does not write the project's CLAUDE.md, PRD, or API contract — those are the canon the
  harness *reads*; authoring them is the project's work (the `middleleap-ai-sdlc` plugin helps).
- It does not enable any always-on behaviour by itself: hooks activate only when the user
  merges the settings snippet, and the loop runs only when invoked.
- It does not bring OFBO's domain content — no register records beyond the example, no brand
  beyond the demo, no hard-stop list beyond the template. The value of the Loom is the frame;
  the pattern woven on it is the institution's own.
