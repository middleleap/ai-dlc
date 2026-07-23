---
name: brainkit-init
description: Generate a DRAFT Institutional BrainKit and institution profile for a repository — the institution-owned seed of the Loom's context brain (identity, terminology, architecture principles, technology policy, decision rights). Inspects the repo and the user's approved institutional sources, drafts each BrainKit section with recorded provenance, seals the section and package digests, generates the D7 compatibility projection, and produces a gap register of decisions it could not make. It NEVER invents policy, regulatory interpretation, approval authority or brand rules, never auto-approves, and reconciles an existing BrainKit instead of overwriting it. Use when a repository is adopting the Loom's BrainKit, needs an institution profile, or asks to bootstrap institutional context so agents read binding institutional DNA before writing code, PRDs, ADRs, interfaces or reports.
---

# Initialise an Institutional BrainKit (draft)

The BrainKit is the **institution-owned seed of the Loom's context brain**. This skill produces a
**draft** — a starting point for the institution's accountable owners, never a fait accompli. Read
`../loom/references/brainkit.md` first for the concepts, boundaries, and lifecycle.

## Absolute rules

1. **Never invent** policy, regulatory interpretation, approval authority, or brand rules. Every
   section grounds in an **approved institutional source** the user supplies; if you don't have a
   source for a claim, it goes in the **gap register**, not into a section.
2. **Never approve.** The package stays `status: draft` until accountable humans approve it. You do
   not set `approved`, and you do not fill the `approvals` array.
3. **Reconcile, don't overwrite.** If `institution/brainkit/` already exists, read it and propose a
   diff; preserve owner decisions and approved content.
4. Say **institutionally conformant**, never **regulatorily compliant**. The BrainKit references the
   D6 data-risk register and the solution-domain packs; it never copies them.

## Steps

1. **Inspect.** Read the repository (README, architecture docs, existing `AGENTS.md`/`CLAUDE.md`,
   package manifests) and the **approved sources the user provides**. List what you found.
2. **Scaffold from the templates.** Copy the neutral templates from the harness
   (`loom-adopt/harness/brainkit/`) into `institution/brainkit/` if not already present.
3. **Draft each section**, grounded only in approved sources, recording provenance:
   - `identity/design.md` — institutional identity + design language (the D7 projection source).
   - `terminology.md` — the binding vocabulary.
   - `architecture.md` — principles, constraints, material-change triggers.
   - `technology-policy.json` — allowed / consult / forbidden + standards.
   - `governance.md` — decision rights (who decides what).
   - `source-register.json` — every approved source, each with a human `approved_by`.
4. **Record provenance** for every generated section: which approved source(s) it came from, and
   what (if anything) you inferred versus quoted. Inferences that lack a source are gaps.
5. **Draft the institution profile** at `profiles/institutions/<institution>.json` (kind
   `institution`, a semantic `version`, a `brainkit` pointer). It contributes the
   `brainkit-conformance` gate, `brainkit-provenance` evidence, and the `institutional-context-owner`
   approver role. A governed change in this repo must then name this profile in `required_profiles`.
6. **Fill the manifest** (`manifest.json`): `schema_version`, `brainkit_id`, `institution_id`,
   semantic `version`, `status: draft`, `effective_at`, accountable `owners` by section (each an
   identity in `docs/governance/identities.json`), and `approved_sources`. Leave `approvals` empty.
7. **Seal the digests**: `node loom-adopt/harness/scripts/brainkit-check.mjs --seal`. This records
   what the files hash to — it does **not** approve.
8. **Generate the D7 compatibility projection** `discovery/brand/design.md` from
   `institution/brainkit/identity/design.md`, carrying the BrainKit id/version/digest in the
   frontmatter (so rendered artifacts inherit the provenance). Preserve the existing D7 brand marker.
9. **Produce the gap register** — a list of every decision you could not make for lack of an approved
   source or a named authority (e.g. "no approved brand tokens", "architecture principle 3 has no
   source", "no institutional-context-owner in the registry"). These block approval.
10. **Wire the repository instructions**: reference `institution/brainkit/repository-instructions.md`
    from the repo's `AGENTS.md`/`CLAUDE.md`/`.cursorrules` — propose a concise pointer, and patch an
    existing file only after the user confirms. Never overwrite it.
11. **Report** exactly: what was **generated**, what was **inferred** (and needs sourcing), what is
    **missing** (the gap register), and what is **awaiting approval**. Then hand off to the
    accountable owners.

## How loom-adopt routes here

`loom-adopt` detects whether `institution/brainkit/manifest.json` is present and approved. If it is
absent, or present only as an adopt-pending template, adoption routes the user through this skill
before a governed change can name an institution profile. `brainkit-check` enforces the result:
until the BrainKit is approved, sealed, owned and grounded, a compiled change that pins it is blocked.
