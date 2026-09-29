---
name: loom-adopt
description: Use when a repository wants to install or upgrade the Loom harness — "adopt the Loom", "set up the discovery harness", "install the build-loop guardrails", loom status, assess.mjs, or a re-run after a plugin update. Not for explaining the method (use loom), writing CLAUDE.md (use claude-md-guide), or drafting institutional context (use brainkit-init).
---

# Adopt the Loom in this repository

This skill scaffolds the Loom's two harnesses into the current repo from the bundle in this
skill's `harness/` directory. Everything copied is the generic machinery — the domain mounts
through two seams (brand profile, data-risk register) and the `ADOPT:` markers you fill in.

Read the method first if you haven't: the `loom` skill (sibling in this plugin), especially
`references/discovery-harness.md` — that file becomes this repo's `discovery/DISCOVERY.md`.

## 0a. Already have a codebase? Assess it first

Adoption does not assume a greenfield repository. Point the assessment at an existing one and it
reports where you stand and what adopting would cost:

```bash
node harness/assess.mjs --dest <repo-root>     # add --json for the machine-readable form
```

It separates three kinds of statement and never lets them blur — **observed** (a file is there),
**inferred** (this looks regulated — a guess, labelled as one), and **what it cannot see**, which
it prints on every run including the most flattering. Branch protection, whether your CODEOWNERS
teams are real people who review, whether your tests assert anything: none of that is visible from
a checkout, and a report that listed only what it could see would read as if that were everything.

The cost figures count individual destination files from a real `--dry-run` install per tier,
including pending templates. New, updated, current and preserved files are separated; the stamp
and merge sidecars are additional metadata. Files you already have are **preserved**, never overwritten.

Nothing it prints says a control is operating. A file is not a control; a gate that has never run
is not evidence. It recommends a starting tier — usually `core`, because raising one later is a
single flag and the deferred gates are already installed and silent.

## 0. Preconditions

- A git repository. Node ≥ 18 available (`node --test` is used by the bundled test suites).
- Ask the user before overwriting anything that already exists — an existing `discovery/` or
  `.claude/skills/` means a partial or prior adoption; reconcile, don't clobber.

### Check local prerequisites first

From the target repository, run `node <bundle>/scripts/loom.mjs preflight --runtime claude-code`.
This checks Git, Node, Bash and jq without changing settings. It reports unsupported runtimes
explicitly; it does not prove hooks, platform controls or institutional approvals are active.
A fresh `.claude/settings.json` is written directly by adoption. An existing, differing file is
preserved with a sidecar for review and merging.

## 1. Copy the machinery

The one-command way: **`node harness/adopt.mjs --dest <repo-root>`** — the idempotent installer
reads `harness/copy-manifest.json` (the single source of truth) and lays every file below into
place, emitting an adoption report (source → destination → status). Re-running is safe: it stamps
what it installed in `.loom/adoption.json` and never overwrites a file you have since edited
(step 7). A `*.template` file is copied but never auto-filled — templates land `adopt-pending`
and you fill their ADOPT markers in step 3.

### Pick a tier — you do not have to adopt all of it at once

A full adoption lands well over a hundred ADOPT markers to fill in, which is a cliff rather than
an on-ramp — and the count grows every release. `--tier` stages it. `harness/` below is the
bundle inside the installed plugin, `${CLAUDE_PLUGIN_ROOT}/skills/loom-adopt/harness`; run the
commands from that directory or prefix the path. Add `--dry-run` to any of them to see what that
tier would land, and `node scripts/loom.mjs status` in the adopted repository counts the files
still ADOPT-PENDING.

```bash
node harness/adopt.mjs --dest . --tier core       # the warp (the default)
node harness/adopt.mjs --dest . --tier governed   # + product governance
node harness/adopt.mjs --dest . --tier full       # + estate, floor, institution
```

A first run with no `--tier` lands `core`, the safe on-ramp.

Two things make this safe rather than merely smaller:

- **Every tier installs every gate.** Only what you must *fill in* is tiered. A gate whose input
  file does not exist yet is silent, so the deferred controls cost you nothing and cannot be
  forgotten — they are already running, waiting for their file. (Tiering the machinery would
  reintroduce the exact failure the `scripts/*.mjs` glob's comment warns about: a per-file list
  that silently drops new gates.)
- **Core is the smallest adoption that is safe, not the smallest that installs.** Which entries
  may be deferred was decided by test: each was removed from a real adoption and its gates
  confirmed silent. Two would not go — `data-lifecycle.json` and `model-manifest.json` fail
  *closed* when absent, and they stay in core however inconvenient, because in this method the
  agent is a model and data has a lifecycle.

Raising the tier is just re-running with a higher one; it adds the deferred entries and leaves
everything else alone. A re-run with **no** `--tier` keeps the tier you already adopted — an
upgrade never silently demotes you. `node scripts/loom.mjs version` reports which tier you are on.

The **Tier** column in the table below says where each entry lands.

The table below is **generated from that same manifest** (a doc-integrity gate fails the build if
it drifts), so it can never lag the machinery. Sources are relative to `harness/`; destinations
are repo-root-relative.

<!-- LOOM:COPY-TABLE:START -->
| Bundle source | Destination | Tier | What it is |
|---|---|---|---|
| `../../loom/references/discovery-harness.md` | `discovery/DISCOVERY.md` | core | The discovery canon (single source — do not fork the text) |
| `../../loom/references/glossary.md` | `discovery/GLOSSARY.md` | core | Every identifier expanded |
| `discovery/gates` | `discovery/gates` | core | Pure-Node D1–D9 validator + its tests |
| `discovery/render` | `discovery/render` | core | Zero-dep branded renderer (HTML + OOXML) + tests |
| `discovery/templates` | `discovery/templates` | core | One template per discovery artifact (incl. the optional, decision-routed business-case.md) |
| `discovery/brand/design.md` | `discovery/brand/design.md` | core | Brand seam (neutral demo instance) |
| `discovery/brand/examples` | `discovery/brand/examples` | core | A second brand proving the seam swap |
| `delivery/templates` | `delivery/templates` | core | One template per delivery decision artifact (ADR · Solution Direction Record) |
| `backlog-example/backlog.yaml` | `docs/backlog.example.yaml` | core | The backlog SHAPE the delivery loop and the waist gate read — an example beside where yours goes |
| `floor/templates` | `floor/templates` | full | Guided collaboration-surface forms, GENERATED from the git templates (parity-gated) |
| `floor/catalog-b` | `floor/catalog-b` | full | Decision-routed floor forms |
| `floor/catalog-c` | `floor/catalog-c` | full | Floor-only forms |
| `intake` | `intake` | core | Institutional intake machinery: question bank, pre-fill packs, shared record operations, builder and generated questionnaire. Available at every tier; installs no institutional answers or approvals. |
| `scripts/*.mjs` | `scripts/` | core | Every gate + its tests (globbed — a per-file list silently drops new gates) |
| `core` | `core` | core | Policy compiler, gate runner, attestations, compiled-requirements (control plane) |
| `profiles` | `profiles` | core | Profiles as data: base + jurisdiction + product-type |
| `hooks/*.sh` | `.claude/hooks/` | core | Pre-write guardrail hooks (pii-guard, spec/test tripwires, shariah-term-guard) |
| `hooks/pii-patterns.json` | `.claude/hooks/pii-patterns.json` | core | The PII shapes pii-guard.sh reads |
| `hooks/shariah-surfaces.txt` | `.claude/hooks/shariah-surfaces.txt` | core | The declared Islamic customer-facing prose surfaces shariah-term-guard.sh is scoped to |
| `hooks/settings.hooks.json` | `.claude/settings.json` | core | Hook wiring for Claude Code (merged, never overwritten — a pre-existing settings.json is preserved and a .loom.json sidecar is dropped to merge by hand) |
| `agents/agent-output.schema.json` | `.claude/agents/agent-output.schema.json` | core | The one output shape every Loom reviewer and assurance agent emits (loom.agent-output/v1); scripts/agent-output-check.mjs holds the agent definitions and the eval fixtures to it |
| `skills` | `.claude/skills` | core | The eight delivery-loop skills (discovery, develop, next-story, implement-story, spec-change, release, re-perform, govern) — project-specific templates you edit; the stamp tells your edits from ours |
| `agents/hard-stop-reviewer.md` | `.claude/agents/hard-stop-reviewer.md` | core | Reviewer template — the hard-stop checklist is domain content; you fill in yours |
| `agents/contract-conformance-reviewer.md` | `.claude/agents/contract-conformance-reviewer.md` | core | Reviewer template — checks an implementation against the API contract |
| `agents/shariah-conformance-reviewer.md` | `.claude/agents/shariah-conformance-reviewer.md` | full | Reviewer template — checks an implementation against the Shari'ah structures the committee already approved. Full tier, with the rest of the Islamic seam |
| `agents/evals` | `.claude/agents/evals` | core | Eval fixtures for the reviewer agents (case.json + expected.json + input/): the specification of register-absent, residual-moved and horizon behaviour that an adopter's eval rig runs the model against |
| `governance/runbooks/*.md` | `docs/governance/runbooks/` | core | Eight adoption runbooks + the supervised-pilot playbook |
| `governance/activation-runbook.md` | `docs/governance/activation-runbook.md` | core | How to activate branch protection, IAM, the routine lane |
| `governance/routine-controller.yml` | `docs/governance/routine-controller.yml` | core | Reference routine auto-merge controller — separated bot identity, gated on routine-qualified + config-reconciliation (rc.12 WS2.3) |
| `governance/CODEOWNERS.template` | `CODEOWNERS` | core | The control-plane ownership map (replace @your-org/… — the gate fails until you do) |
| `governance/control-catalog.template.json` | `docs/governance/control-catalog.json` | core | The machine-readable control state of record |
| `governance/identities.template.json` | `docs/governance/identities.json` | core | The identity registry (approvals resolve against it) |
| `governance/attestation-issuers.template.json` | `docs/governance/attestation-issuers.json` | governed | Allowed-issuers registry for ed25519 attestations |
| `governance/assertion-issuers.template.json` | `docs/governance/assertion-issuers.json` | governed | Identity-provider material for human approval assertions (kept separate from service keys) |
| `governance/identity-map.template.json` | `docs/governance/identity-map.json` | governed | The P6 join: surface person id → IdP subject → registry identity. Second-line owned; never written by a service |
| `governance/identity-map-reconciliation.template.json` | `docs/governance/identity-map-reconciliation.json` | governed | The observer's signed observation that the map is still current (observed, not declared) |
| `governance/model-manifest.template.json` | `docs/governance/model-manifest.json` | core | Model inventory (pinned, tiered, evaluated, runtime-governed; optional per-domain validation signatures) |
| `governance/data-lifecycle.template.json` | `docs/governance/data-lifecycle.json` | core | Data classification, retention, erasure, residency |
| `governance/operations-signal.template.json` | `docs/governance/operations-signal.json` | governed | The Run→Discovery feedback log |
| `governance/service-readiness.template.json` | `docs/governance/services/example-service.json` | governed | Operational readiness R1–R6 (per service; unparseable ADOPT dates fail until you exercise the drills) |
| `governance/environments.template.json` | `docs/governance/environments.json` | governed | The promotion ladder (rc.39) — one entry per environment: purpose, data classification, who may promote INTO it, what it promotes FROM. Replaces three unmountable ADOPT comments in the release skill |
| `governance/feature-flags.template.json` | `docs/governance/feature-flags.json` | governed | The exposure register |
| `governance/product-evals.template.json` | `docs/governance/product-evals.json` | governed | Product-outcome evals (discovery-linked, measures scored, commit-bound) |
| `governance/routine-envelope.template.json` | `docs/governance/routine-envelope.json` | governed | The second-line-owned routine-change envelope (HG-0013) |
| `governance/obligations.template.json` | `docs/governance/obligations.json` | governed | The obligations register (2.1.0): obligation → risk → control → FINOS id; read by obligations-check, D6, change-watch and the obligation report |
| `governance/config-baseline.template.json` | `docs/governance/config-baseline.json` | full | The approved control-plane configuration reconciled against live observations (rc.12 WS2.4) |
| `governance/assurance-sla.template.json` | `docs/governance/assurance-sla.json` | full | Service-level expectations for continuous-assurance cases (rc.14 WS6) |
| `governance/approval-sla.template.json` | `docs/governance/approval-sla.json` | full | Approval service-level EXPECTATIONS (rc.37) — read by scripts/approval-status.mjs, which flags a breach and gates nothing |
| `governance/exception-policy.template.json` | `docs/governance/exception-policy.json` | governed | Exception-register policy (rc.37) — the concentration limit, which may be tightened below the shipped floor of 3 and never raised above it |
| `governance/evidence-retention.template.json` | `docs/governance/evidence-retention.json` | governed | Per-evidence-type retention |
| `governance/token-ledger.template.json` | `docs/governance/token-ledger.json` | full | Token-spend ledger (a report, never a merge gate) |
| `governance/shariah-rulings.template.json` | `docs/governance/shariah-rulings.json` | full | The SR-* decision register |
| `governance/shariah-surfaces.template.json` | `docs/governance/shariah-surfaces.json` | full | WHERE this institution's Islamic data contracts, fixtures and customer copy live |
| `governance/issc-register.template.json` | `docs/governance/issc-register.json` | full | Who holds the Shari'ah committee seats and under what appointment |
| `governance/profit-distribution.template.json` | `docs/governance/profit-distribution.json` | full | The deposit-side register for investment accountholders |
| `governance/pilot-record.template.json` | `docs/governance/pilot-record.json` | core | The record of a declared supervised pilot |
| `governance/fairness-evaluations.template.json` | `docs/governance/fairness-evaluations.json` | governed | The protected-attribute register and the disparity measurements taken against it |
| `governance/ai-governance.template.json` | `docs/governance/ai-governance.json` | governed | The consumer-impacting AI governance register: shipping model pin to accountable owner, meaningful human oversight, a non-AI route, bilingual disclosure, monitoring, incident response, privacy/security assessment and re-hashed stress-test evidence |
| `governance/operating-model.template.json` | `docs/governance/operating-model.json` | governed | The institution-owned operating model: accountable executive, board oversight, change control, rollback and cease-use ownership, and a RACI joined to identities |
| `governance/activation-plan.template.json` | `docs/governance/activation-plan.json` | full | The adopter activation campaign: four independent owners, one reference AI change, verified platform bypass observations, an active external-record provider |
| `governance/decision-contestability.template.json` | `docs/governance/decision-contestability.json` | governed | Where a person is told why, how they challenge it, and the human who can overturn it |
| `governance/knowledge-pins.template.json` | `docs/governance/knowledge-pins.json` | full | Pinned external rule bases |
| `governance/shariah-audit-charter.template.md` | `docs/governance/shariah-audit-charter.md` | full | The internal Shari'ah audit charter |
| `adapters/README.md` | `docs/governance/adapters/README.md` | full | The neutral adapter contract |
| `adapters/providers` | `docs/governance/adapters/providers` | full | The provider catalog — roles and the alternatives that fill them. A catalog is an offer: nothing here is mounted until the institution selects it |
| `governance/provider-selection.template.json` | `docs/governance/provider-selection.json` | full | Which provider this institution chose per role (the choice is recorded, never defaulted) |
| `guardrails` | `guardrails` | governed | Runtime-neutral guardrail policy + generated capability matrix (rc.13 WS4 — the Loom never implies coverage a runtime lacks) |
| `brainkit/manifest.template.json` | `institution/brainkit/manifest.json` | full or --with brainkit | BrainKit manifest — identity, version, lifecycle, owners, digests, approvals (draft until owners approve) |
| `brainkit/identity/design.md` | `institution/brainkit/identity/design.md` | full or --with brainkit | BrainKit institutional identity + design language (the D7 projection source) |
| `brainkit/terminology.md` | `institution/brainkit/terminology.md` | full or --with brainkit | BrainKit binding vocabulary |
| `brainkit/architecture.md` | `institution/brainkit/architecture.md` | full or --with brainkit | BrainKit architecture principles and constraints |
| `brainkit/technology-policy.json` | `institution/brainkit/technology-policy.json` | full or --with brainkit | BrainKit technology policy (allowed / consult / forbidden) + the radar lifecycle (assess / trial / adopt / hold) |
| `brainkit/governance.md` | `institution/brainkit/governance.md` | full or --with brainkit | BrainKit decision rights |
| `brainkit/strategy.md` | `institution/brainkit/strategy.md` | full or --with brainkit | BrainKit strategic intents (SI-*) — schema 1.1; a discovery run cites the intent its problem serves |
| `brainkit/source-register.json` | `institution/brainkit/source-register.json` | full or --with brainkit | BrainKit approved source register (every section grounds in it) |
| `brainkit/repository-instructions.md` | `institution/brainkit/repository-instructions.md` | full or --with brainkit | Canonical read-the-BrainKit fragment — referenced from AGENTS.md/CLAUDE.md, never overwriting them |
| `ci/ci.yml` | `.github/workflows/ci.yml` | core | The reference CI workflow that runs every gate |
| `project.template.json` | `.loom/project.json` | core | Project-owned contract paths, feature ID pattern and verification command arguments |
| `project-configuration.md` | `docs/governance/project-configuration.md` | core | Project settings and CI migration guide |
| `runtime-contract.md` | `docs/governance/runtime-contract.md` | core | Runtime adapter contract, bounded Codex reviewer pilot and qualification gaps |
<!-- LOOM:COPY-TABLE:END -->

The delivery-loop skills (`harness/skills/*` → `.claude/skills/`) and the reviewer templates
(`harness/agents/*.md` → `.claude/agents/`) are manifest entries, stamped and upgraded like
everything else. Only the worked fixtures under
`harness/{evidence-example,change-example,assurance-example,register-example}/` are still
adapted by hand into `docs/governance/`.

Also create if missing: `discovery/runs/`, `docs/develop/`, `docs/adrs/`, `docs/backlog.yaml`
(empty list is fine), `docs/build-log.md`.

**The backlog is the one file you write from scratch, so its shape is installed beside it.** Copy
`docs/backlog.example.yaml` — it shows both milestone nesting styles, a feature item, an infra
item, an exemption and the inline flow form. Set **`feature_pattern` in `.loom/project.json`** to your own feature-item id convention:
the shipped default is `^STORY-\d+$`, and if your ids look like `FEAT-102` the waist gate reads
every item and gates none of them. It fails rather than lets that pass quietly.

Worked examples to study in the bundle (not copied): `harness/register-example/` (the D6 chain),
`harness/discovery/brand/examples/` (a second brand), and `harness/operations-example/` — a
realistic Meridian Trust operations-signal log showing the Run→Discovery loop close across all
four routes (`../loom/references/operations.md`).

Six agents ship as **plugin agents** and work as soon as the machinery lands (no copying):
`code-reviewer`, `discovery-boundary-reviewer`, `data-governance-reviewer`, the `model-risk-reviewer` (HG-0006),
and the continuous-assurance pair `change-watch` (① Watch) + `risk-reviewer` (② Assess).

## 2. Mount the seams

- **Brand (D7):** edit `discovery/brand/design.md` — entity name, banner, and the token
  *values* (never the token *names*; everything downstream reads names). If the org's brand
  lives elsewhere (e.g. a design-system skill), transcribe its values into the tokens.
- **Base profile:** the compiler needs one, and there are two. `profiles/standard.json` is the
  warp and nothing more — four-eyes merge, the waist gate, spec-first, quality gates — for a team
  building with AI under ordinary engineering discipline. `profiles/regulated-bank.json` adds what
  a regulated entity owes its regulator: PA1/PA2 product approval, architecture assurance,
  operational readiness, the second-line hold, control-function approvers. It is strictly stronger,
  not different: a test asserts `standard` requires a subset of it at every tier, so choosing
  `standard` can never give you a control the bank profile lacks. Name your choice in a governed
  change's `required_profiles`; layer a jurisdiction and product profile on top.
- **Register (D6):** the installer does **not** place a register — a register it wrote would
  assert risks nobody accepted. Copy the worked example in first
  (`cp -r harness/register-example/ docs/governance/data-risk-register/`) so the pipeline is
  exercisable end to end, then replace its records with the organisation's own regulation → risk
  → control → residual chain behind the same JSON shape (documented in its README).
- **Shari'ah (only if the institution runs Islamic products):** `--tier full` also lands the
  Islamic seam — `docs/governance/shariah-rulings.json` (the SR-* decision register everything
  cites), `issc-register.json` (who holds a committee seat, and when), `profit-distribution.json`,
  `knowledge-pins.json`, `shariah-audit-charter.md`, and the scope file
  `.claude/hooks/shariah-surfaces.txt`, which ships with no entries. Leave every one of them
  untouched and nothing changes: these gates are mandatory-when-compiled, so they stay silent
  until a change names an Islamic product or institution profile, and a conventional adoption
  never meets them. **The harness decides no Shari'ah question.** It checks that a cited ruling
  exists, that the person who approved it held a seat on the date they approved, and that data
  matches a structure the committee already approved — scholars decide permissibility, and no
  agent here may author, alter or approve a ruling.

## Reuse institutional context without adopting unrelated full-tier inputs

For an institution authoring its first BrainKit, `--tier core --with brainkit` adds only the
BrainKit component on top of core. Preview with `--dry-run` first. The installer records the
component and retains it on subsequent upgrades. Configuration tasks include its draft inputs.

For a second team consuming an existing release, adopt core without that draft component and
use `node scripts/loom.mjs brainkit --from <trusted-publisher-repository> --profile <id> --digest
sha256:<expected-release-digest>` to preview the snapshot and profile. Add `--apply` only after
reviewing the preview. It creates missing files, skips identical files and blocks on conflicts.
It never substitutes institutional identities, grants approvals or reseals the release. Follow
`docs/governance/runbooks/brainkit-distribution-runbook.md` for source trust, project-specific
identity projection, profile selection, recompilation and estate acknowledgement.

## 3. Complete the setup checklist

Run `node scripts/loom.mjs configure` for pending inputs, accountable roles and next actions.
Use `--all` to include supplied inputs, `--json` for the full inventory and `--run` to execute
available checks for supplied inputs. The registry covers templates and project seams, including
missing files. Input presence is not approval or production readiness; compiled controls still
apply regardless of the installation tier. `loom status` retains additional legacy marker findings.

The project-specific seams include:

- `.claude/agents/hard-stop-reviewer.md` — replace the checklist with THIS project's
  non-negotiables (keep the FAIL/VERDICT protocol and file:line citation rule).
- `.claude/agents/contract-conformance-reviewer.md` — replace with THIS project's binding API
  conventions.
- `.loom/project.json` — set `spec_paths` to the project's contract file(s). The spec hook reads this data. Since
  2.1.0 the tripwire also reads the Bash tool's command string (a `sed -i` or a heredoc naming
  the contract on a working branch is denied), and `claude/*` branches are covered like `feature/*`.
- `.claude/hooks/pii-patterns.json` — swap the UAE PII shapes for the project's jurisdiction. The
  shapes are data now, not code: add a row, never edit `pii-guard.sh`. The guard **denies every
  write** if this file is missing or unparseable, so it installs at every tier and must stay
  beside the hook. Since 2.1.0 the guard is also bound to the Bash tool (the command string is
  scanned, so a heredoc is no longer a bypass) and every non-alphanumeric separator is stripped
  before matching; the UAE instance ships an Emirates ID, IBAN and mobile shape.
- `.loom/project.json` — set `feature_pattern` to the project's story-id convention and `verification_commands` to executable/argument arrays. Run `node scripts/loom.mjs verify-project`; keep these settings out of managed scripts.
- `.claude/skills/next-story/SKILL.md` and `implement-story/SKILL.md` — name the project's
  verify commands and binding test cases.
- `.claude/skills/release/SKILL.md` — name the pre-production promotion command and
  environment, the smoke command and its URL, the decision-log capture wiring, the eval-rig
  command, and the production promotion path together with who is entitled to run it.
- `.claude/skills/re-perform/SKILL.md` — name the audit repository or store the
  re-performance report is written to (it does not belong on the release branch).

`CLAUDE.md` must state the binding conventions those reviewers and skills cite — if the repo
has none yet, write the Commands / Conventions / Do-Not sections before running the loop.

## 4. Verify the adoption — evidence, not vibes

The bundled suites must pass exactly as copied. This is the one step with no "expected red":

```bash
node --test discovery/gates/*.test.mjs discovery/render/*.test.mjs scripts/*.test.mjs core/*.test.mjs
```

**A fresh adoption is deliberately not all-green, and the reds are the work list.** The gates
fail closed: a control with nothing behind it yet fails rather than passing vacuously. Run them
and read the output — each failing gate names the file it wants and why:

```bash
node scripts/ci-catalog-check.mjs                # GREEN — every CI gate is in the control catalog
node scripts/control-catalog-check.mjs           # GREEN — the state of record is not overstated
node scripts/data-lifecycle-check.mjs            # GREEN on the shipped demo lifecycle
node scripts/operations-signal-check.mjs         # GREEN on an empty or demo signal log

node scripts/discovery-link-check.mjs            # RED until you create docs/backlog.yaml (step 1
                                                 #   lists it; `milestones: []` is valid and passes)
node scripts/control-plane-check.mjs             # RED until CODEOWNERS names real teams (step 5)
node scripts/model-provenance-check.mjs          # RED until you adapt harness/evidence-example/
node scripts/evidence-seal-check.mjs             #   into docs/governance/evidence/ (see below)
node scripts/operational-readiness-check.mjs     # RED until you run the drills and date them
node scripts/product-eval-check.mjs              # RED until a release links its discovery hand-off
node scripts/sast-check.mjs                      # RED until your SAST/SCA scanners write their
node scripts/supply-chain-check.mjs              #   reports (supply-chain-security.md)
```

The four evidence-shaped gates want fixtures the installer does **not** copy, because a
manifest the installer wrote would be evidence about nothing: adapt
`harness/evidence-example/` into `docs/governance/evidence/` (it carries a complete sealed
manifest, eval reports, SBOM, SARIF and provenance to model yours on), and the
`operational-readiness` dates only become real when you have actually exercised the drills.

To see the whole board at once, including what is adopter-side and cannot be closed here:

```bash
node scripts/adoption-status.mjs        # add --run to check what actually passes in THIS repo,
                                        # not just what the catalog grades
```

Then prove the pipeline end to end: run the `discovery` skill on a small real (or synthetic)
problem through to `node discovery/gates/validate.mjs discovery/runs/<slug>` green, and render
one artifact with the renderer to confirm D7 conformance. Only then aim the delivery loop
(`/loop /next-story`) at the backlog.

## 5. Wire CI and governance

For a full-tier regulated-bank adoption, use the **Adopter Activation Pack** after the repository
gates are green: fill `docs/governance/activation-plan.json`, keep it `activating` while the gate
reports the work list, and move it to `ready-for-pilot` only when
`scripts/activation-readiness-check.mjs` passes. The gate joins verified platform bypass records,
the active external-record provider, the operating/AI governance records and the pilot state; the
ordered procedure and exit criteria are in
`docs/governance/runbooks/adopter-activation-pack.md`. Kosli is the worked external-record option,
not a default or a substitute for the institution's retention assessment.

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

## 7. Upgrading to a newer Loom

The installer stamps every adoption in `.loom/adoption.json` — the bundle version, when it was
first adopted, and the digest of every file it installed. Two things follow.

**You can ask what you are running.** From the adopted repo:

```bash
node scripts/loom.mjs version     # version, upgrade history, and which managed files you have edited
```

**Upgrading is re-running the installer from the newer bundle.** There is no separate command:

```bash
node scripts/loom.mjs adopt --bundle <plugin>/skills/loom-adopt/harness --dry-run
# Review the report, then run the same command without --dry-run.
```

It reports `UPGRADE <from> → <to>`, then prints the migration notes for every version in between
— including the `ACTION:` lines naming the templates you now have to fill. Add `--dry-run` to see
all of it without writing anything.

**Your edits are safe.** Step 3 tells you to edit `.loom/project.json`,
`.claude/hooks/pii-patterns.json`, the reviewer agents and the skill templates; the stamp is
what lets the installer tell your changes
from its own. A file you have edited is **preserved**, and the new upstream version is written
beside it as `<file>.loom-new` for you to diff. It stays flagged as yours until your content and
ours converge — `loom version` lists them. Siblings in the same directory still update normally,
so one customised gate does not freeze the other forty.

Two edge cases, both stated by the installer when they happen:

- **A repository adopted before the stamp existed** (early 2.0 release candidates) has no stamp, so an edit of yours and an older copy
  of ours are indistinguishable. Everything that differs is preserved and reported as
  `unverifiable`. Reconcile the sidecars, or re-run with `--force` if you know you never
  customised anything. It happens once — the stamp written on that run means later upgrades know.
- **`--force`** overwrites edited files. It is the documented escape hatch and it is destructive;
  the report says what it stepped on.

## What adoption deliberately does NOT do

- It does not write the project's CLAUDE.md, PRD, or API contract — those are the canon the
  harness *reads*; authoring them is the project's work (the `claude-md-guide` skill in this plugin helps).
- It does not enable any always-on behaviour by itself: hooks activate only when the user
  merges the settings snippet, and the loop runs only when invoked.
- It does not bring OFBO's domain content — no register records beyond the example, no brand
  beyond the demo, no hard-stop list beyond the template. The value of the Loom is the frame;
  the pattern woven on it is the institution's own.
