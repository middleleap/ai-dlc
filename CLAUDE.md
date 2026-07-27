# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MiddleLeap AI DLC** — a Claude Code plugin marketplace: skills, agents, and workflows for AI-enabled development, published for public installation. This is a knowledge-base / artifact library, not an application: no build system, no package manager, no dependencies. The only executable is the manifest validator, which has a `node:test` suite of its own (`scripts/validate-marketplace.test.mjs`) — the Loom harness bundle carries its own separate suite.

## Repository Structure

```
.claude-plugin/marketplace.json     # marketplace manifest — the file Claude Code reads
plugins/
├── middleleap-ai-sdlc/             # AI-SDLC practices
│   ├── .claude-plugin/plugin.json
│   ├── skills/claude-md-guide/
│   ├── skills/context-template/
│   └── agents/code-reviewer.md
├── middleleap-open-finance/        # UAE Open Finance domain expertise
│   ├── .claude-plugin/plugin.json
│   ├── skills/open-finance-uae/    # the canon incl. AlTareq brand refs + check_current.py
│   ├── skills/islamic-banking-uae/ # Shariah-compliant finance; composes with the canon
│   └── skills/open-finance-uiux/
├── middleleap-brand/               # MiddleLeap brand & design system (v2.0)
│   ├── .claude-plugin/plugin.json
│   └── skills/middleleap-brand/    # SKILL.md, DESIGN.md, tokens, components, assets
└── middleleap-loom/                # The Loom — the AI-SDLC method (flagship)
    ├── .claude-plugin/plugin.json
    ├── agents/                     # discovery-boundary + data-governance reviewers
    └── skills/
        ├── loom/                   # method canon + references (discovery/delivery/governance/brainkit)
        ├── loom-adopt/             # adoption skill + harness/ bundle (gates, renderer, templates,
        │                           #   hooks, profiles, brainkit/ templates + brainkit-example/ —
        │                           #   copied into adopting repos via copy-manifest.json)
        └── brainkit-init/          # drafts an Institutional BrainKit from approved sources
                                    #   (never invents policy, never approves — rc.10)
scripts/validate-marketplace.mjs    # run before every commit; CI runs it too
```

## The rules that actually bite

- **A skill is a directory containing `SKILL.md`. An agent is a flat `.md` file.** `agents/foo/AGENT.md` is silently never loaded; `agents/foo.md` works. This repo shipped that bug for months.
- **Everything installable lives under `plugins/<plugin>/`.** Top-level `skills/`, `agents/`, or `tools/` directories are not installable — the validator rejects them.
- **`version` gates updates.** Change content without bumping the plugin version in *both* `plugin.json` and the `marketplace.json` entry, and existing users never receive it.
- **The `description` in a skill's frontmatter is what Claude uses to decide whether to load it.** It's the highest-leverage line in the file. Max 1024 characters.
- **There is no "tool" or "MCP server" artifact type.** A plugin bundles skills, agents, commands, hooks, and `.mcp.json`. The old five-type taxonomy is gone; don't reintroduce it.

## Verification

```bash
node scripts/validate-marketplace.mjs   # manifests, sources, versions, skill/agent layout
node --test scripts/validate-marketplace.test.mjs   # the validator's own suite — run it if you change the validator
node plugins/middleleap-brand/skills/middleleap-brand/scripts/check-contrast.mjs   # WCAG AA gate
```

The validator reads the **git tree**, not the filesystem: only tracked files can reach a
user, and CI validates a clean checkout. Untracked strays are ignored (this is why a macOS
`.DS_Store` no longer fails it), but untracked content that looks real — a
`skills/<name>/SKILL.md`, an `agents/*.md` — is reported as a warning rather than skipped
silently. File *contents* still come from disk, so uncommitted edits are validated before
you commit them.

To confirm it actually loads, from inside Claude Code: `/plugin marketplace add ./`

## Key Domain Context (Open Finance)

- **AlTareq** = UAE Open Finance consumer-facing brand (brand/app spelling; "Al Tareq" appears in some CBUAE prose); **Nebras** = the platform operator
- **CBUAE** = Central Bank of the UAE (the regulator)
- **TPP** = Third Party Provider; **LFI** = Licensed Financial Institution
- **API Hub** = Ozone-powered centralised infrastructure for Open Finance APIs
- Standards canon at last verification (13 Jul 2026): **v2.1-final + errata3**, API Hub **v8** — don't trust this line; run `python3 plugins/middleleap-open-finance/skills/open-finance-uae/scripts/check_current.py`

Reference files carry regulatory figures, dates, and AED amounts. Treat them as load-bearing: check against the Standards, never paraphrase from memory, and record corrections in the skill's `references/verification-log.md`.

## Provenance rules (learned the hard way)

- **The Open Finance, Islamic banking, and UAE bank risk reviewer skills are canonical in the Claude.ai skills UI**, edited there and imported here via manual `.skill`/`.zip` export. Before editing them in this repo, ask whether a fresher export exists; if they do change here, the change must flow back to Claude.ai or the next import will overwrite it. Last import: 17 Jul 2026.
- **The former `altareq-brand-guidelines` skill is retired** — merged into `open-finance-uae` as `references/altareq-*.md`. Don't recreate it.
- **The Loom** is extracted here as `plugins/middleleap-loom` (the generic harness). The OFBO-specific instantiation — the CBUAE data-risk register, OFBO brand profile, OFBO hard-stop checklists, Q1–Q5 CI workflows, and the three `the-loom*.html` decks — stays in the `openfinance-os/ofbo` repo as the worked example.
- **The `discovery/` tree is shared with `ofbo`, and the divergence is now counted, not remembered.** `discovery-sync.json` is the ledger and `scripts/discovery-sync-check.mjs` holds it: change a file under `harness/discovery/` without declaring it and the build fails. Run `node scripts/discovery-sync-check.mjs --record` to book the change as a port owed to ofbo. What the gate **cannot** see is whether ofbo has moved — it never reports the trees as agreeing, and only `--upstream <ofbo-checkout>`, run where both repos are reachable, may retire a debt. As of rc.29 nobody has ever run that, and 8 of 23 files carry an outstanding port.

## Git

- Origin remote: `middleleap/ai-dlc`
- Main branch: `main`
- License: Apache 2.0
