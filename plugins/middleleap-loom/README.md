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

## Starting and checking an adoption

Open the [guided start](skills/loom-adopt/harness/intake/questionnaire.html) to try a synthetic
example, prepare an institution, resume a saved intake or get first-team setup instructions.
Each institution has a separate browser session. Choose your role to focus the questions;
facilitators can show all roles. The example is synthetic and is not stored as institutional work.
Use `institution-intake` for the interview handoff and `loom-adopt` to prepare a repository.
Browser saves are local to the browser and file/origin; export backups before moving devices or
replacing the questionnaire. The page reports storage failures and preserves previous saves.
See the [intake handoff contract](skills/loom-adopt/harness/intake/handoff.md) for facilitator steps.
From the target repository, `node <bundle>/scripts/loom.mjs preflight` checks local dependencies
before adoption. `<bundle>` is the plugin's `skills/loom-adopt/harness` directory.

After adoption:

```bash
node scripts/loom.mjs adopt --bundle /path/to/plugin/skills/loom-adopt/harness --dry-run
node scripts/loom.mjs preflight --runtime claude-code
node scripts/loom.mjs configure
node scripts/loom.mjs configure --run
node scripts/loom.mjs activate --platform github --repository owner/repository
```

`configure` lists pending setup tasks with the role to involve, required file, next action and
validation command. `--all` includes supplied inputs; `--json` exports the complete inventory.
`--run` executes available checks for supplied inputs once per checker. Exit codes are 0 for no
pending inputs in this inventory, 1 for pending inputs or failed checks, and 2 for an invalid or
missing registry. These checks do not establish approval or production readiness. Tier-deferred
inputs may still be required by compiled institutional controls. `status` combines these tasks
with additional legacy marker findings; older installations without the registry report that gap.

`adopt` requires the complete bundle; the installed repository is not a copy of the installer.
`activate` reads independently signed receipts for the named repository's HG-0001/0002/0004
baseline. It exits incomplete when required evidence is missing and does not observe or change
GitHub. The platform administrator follows the activation runbook to produce evidence; baseline
completion is not institutional or production readiness. The lower-level
`platform-activation-check.mjs` remains the CI consistency checker, which can pass with no claims.

## Codex reviewer pilot

A bounded Codex adapter supports read-only reviewer requests with an explicitly configured model
and prompt pin. From an adopted repository with AGENTS.md and a configured reviewer role:

```bash
node scripts/loom.mjs runtime codex --task review-task.md --role hard-stop-reviewer
```

This previews the request. `--run` invokes the existing Codex CLI and captures events locally.
It preserves existing project instructions and validates the final reviewer object against Loom's
output contract. `completed-unverified` is a transport/output result, not a favourable verdict or
human approval. No write-capable delivery, automatic resume or Codex pre-action hooks are claimed.
The [runtime contract](skills/loom-adopt/harness/runtime-contract.md) records the limitations and
live qualification work. Current tests use synthetic processes and events; full Codex delivery
preflight therefore remains unsupported. Runtime support and model suitability are separate.

## Keep team CI and project settings

For a new adoption into a repository with its own CI, preview
`node <bundle>/adopt.mjs --ci separate --dry-run`, then apply without `--dry-run`.
This installs `.github/workflows/loom.yml` alongside the existing workflow and exposes a distinct
**Loom governance** check. The selected CI mode persists on upgrades. The reference mode remains
available for repositories using Loom's `.github/workflows/ci.yml` as their workflow.

Configure `.loom/project.json` instead of editing the spec hook or discovery checker:

```json
{
  "schema": "loom.project/v1",
  "spec_paths": ["api/openapi.yaml"],
  "feature_pattern": "^FEAT-[0-9]+$",
  "verification_commands": [["npm", "run", "build"], ["npm", "test"]]
}
```

Run `node scripts/loom.mjs verify-project` to execute the declared commands. Commands use literal
argument arrays with no shell expansion; failures stop verification. An empty list is incomplete.
The separate Loom workflow runs the catalog's governance lanes. Retain the team's own build/test
workflow and make the appropriate checks required through platform administration.

This file is control-plane-owned and excluded from routine changes. The spec hook denies invalid
contract-path configuration or a missing stamped file; old installations without the file use
legacy defaults. Upgrade-preserved custom scripts continue to use their old settings until their
`.loom-new` replacements are reviewed and adopted. See the
[migration guide](skills/loom-adopt/harness/project-configuration.md) before switching existing CI.

## Reuse institutional context for a second team

**Authoring the institution's context:** add draft BrainKit inputs without unrelated full-tier
content with `node <bundle>/adopt.mjs --tier core --with brainkit --dry-run`. Review the report,
then repeat without `--dry-run`. This component remains selected on upgrades; it never approves
the drafts.

**Consuming existing context:** start the team on core without `--with brainkit`, resolve the
context owners in its identity registry, and select a release from the institution's trusted
publisher repository:

```bash
node scripts/loom.mjs brainkit --from /path/to/institution-repo --profile institution-id --digest sha256:EXPECTED_RELEASE_DIGEST
```

The default is a read-only preview. After reviewing it, add `--apply` to create absent snapshot
and profile files. `--json` provides a machine-readable report. Existing identical files are
unchanged; any conflicting file blocks the entire planned copy. Institutional identities,
approval records and compiled plans are not created or rewritten by the command.

The manifest's existing approval records are copied unchanged with the snapshot. The command
checks conformance, the expected digest, consumer owner resolution and locally present estate
registries; it cannot authenticate the publisher or query live revocation. Complete identity
projection, change-profile selection, recompilation and estate acknowledgement through the
[distribution runbook](skills/loom-adopt/harness/governance/runbooks/brainkit-distribution-runbook.md).
Upgrades that conflict with a mounted snapshot require a reviewed replacement; `--apply` has
no overwrite option.

## What's in it

| Type | Name | What it does |
|---|---|---|
| Skill | `loom` | The method canon — `references/core.md` (the whole method in two pages, read first), the metaphor, the double diamond, the context brain, plus full references for the discovery harness (D1–D9 gates), the delivery harness (the autonomous loop, Q-gates, merge policy), the governance catalog (HG-0001…HG-0014), the agent's own runtime (`references/agent-runtime.md`: the egress gateway and the credential broker), the Kosli seam (`references/kosli-seam.md`), the Institutional BrainKit (`references/brainkit.md`), and the optional Factory Floor (`references/factory-floor.md`, with the day-one discovery runbook in `references/floor-discovery-runbook.md`). Two standalone visualisations: `assets/loom-stream.html` (the stream and its gates) and `assets/loom-atlas.html` (what the Loom does and how, drawn) |
| Skill | `loom-adopt` | Stands the harness up in a repository — carries the machinery and walks the copy map (manifest-driven), seam mounting, ADOPT markers, BrainKit routing, verification, staged adoption (`--tier core\|governed\|full`; every tier installs every gate), and the stamped upgrade path (`loom version`; re-running the installer preserves files you have edited) |
| Skill | `institution-intake` | The guided Q&A that sets the institution's scene before the first problem — brand, terminology, architecture, technology policy and radar, decision rights, strategic intents, the investment process, how the Loom will be worked. Sorts every answer into SOURCED / CLAIMED / UNKNOWN; feeds `brainkit-init`; never treats an answer as an approved source. Starts from the self-service questionnaire (`loom-adopt/harness/intake/questionnaire.html`, one block per role, exports an intake record) and interviews only the gaps |
| Skill | `brainkit-init` | Drafts an Institutional BrainKit + institution profile from an institution's approved sources — records provenance, seals digests, produces a gap register; never invents policy or approves |
| Agent | `discovery-boundary-reviewer` | Guards the no-solutioning line (gate D4) and prototype fidelity (gate D8) on a discovery run. Gate ids are expanded in `skills/loom/references/glossary.md` |
| Agent | `data-governance-reviewer` | Judges control coverage and residual-risk soundness on a run's `data-governance.md`, beyond what the mechanical D6 gate can check |
| Agent | `change-watch` | Continuous assurance ① Watch — the horizon scanner: new or amended regulation, a certificate inside its warning window, a CVE in a shipped dependency. Flags and routes; never assesses or fixes |
| Agent | `risk-reviewer` | Continuous assurance ② Assess — impact against the mounted data-risk register, routing what needs a human decision. Assessment only; never authors controls or merges |
| Agent | `model-risk-reviewer` | Independent challenge on a model/prompt change before it ships (HG-0006) — pinned, tiered, evaluated against its own pin, independently validated |

The `loom-adopt` bundle (inside the skill, copied into adopting repos) carries:

- **`discovery/gates/`** — pure-Node, zero-dependency D1–D9 gate validator, with tests
- **`discovery/render/`** — zero-dependency branded renderer: HTML documents, decks, and
  wireframes, plus real `.docx`/`.pptx`/`.xlsx` via a hand-rolled OOXML writer, with tests
- **`discovery/templates/`** — one template per discovery artifact
- **`discovery/brand/`** — the brand-profile seam (neutral demo instance + a second example
  brand proving the swap)
- **`scripts/discovery-link-check.mjs`** — the waist gate: no feature enters delivery without
  a gate-green discovery hand-off
- **Eight project skills** — `discovery`, `develop`, `next-story`, `implement-story`,
  `spec-change`: the operational encoding of both diamonds; plus `release` (⑦/⑧ — assemble
  and seal, then stop for the human authorization), `re-perform` (read-only third-line
  support), and `govern` (author a governed artifact without supplying its judgement)
- **Two reviewer templates** — `hard-stop-reviewer`, `contract-conformance-reviewer`
  (checklists are domain content; you fill in yours)
- **Three guardrail hooks** — `pii-guard`, `spec-tripwire`, `test-tripwire`, plus the
  settings snippet that wires them
- **A minimal data-risk register**, as a worked example (`harness/register-example/`) — one
  complete regulation → risk → control → residual chain. Copy it to
  `docs/governance/data-risk-register/` to exercise gate D6 end to end before you mount the real
  register; the installer deliberately leaves it out, because a register the installer wrote
  would assert risks nobody accepted

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

Installing the plugin adds four skills and five agents — nothing always-on. The hooks and the
build loop activate only when a repository adopts them explicitly via `loom-adopt`.
