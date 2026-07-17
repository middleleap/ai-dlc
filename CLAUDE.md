# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MiddleLeap AI DLC** — a Claude Code plugin marketplace: skills, agents, and workflows for AI-enabled development, published for public installation. This is a knowledge-base / artifact library, not an application: no build system, no package manager, no test framework. The only executable is the manifest validator.

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
│   ├── skills/open-finance-uae/
│   ├── skills/altareq-brand-guidelines/
│   └── skills/open-finance-uiux/
└── middleleap-brand/               # MiddleLeap brand & design system (v2.0)
    ├── .claude-plugin/plugin.json
    └── skills/middleleap-brand/    # SKILL.md, DESIGN.md, tokens, components, assets
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
node plugins/middleleap-brand/skills/middleleap-brand/scripts/check-contrast.mjs   # WCAG AA gate
```

To confirm it actually loads, from inside Claude Code: `/plugin marketplace add ./`

## Key Domain Context (Open Finance)

- **Al Tareq** = UAE Open Finance consumer-facing brand; **Nebras** = the platform operator
- **CBUAE** = Central Bank of the UAE (the regulator)
- **TPP** = Third Party Provider; **LFI** = Licensed Financial Institution
- **API Hub** = Ozone-powered centralised infrastructure for Open Finance APIs
- Standards canon: **v2.1-final** (7 Jan 2026) — verify currency before relying on it rather than trusting this line

Reference files carry regulatory figures, dates, and AED amounts. Treat them as load-bearing: check against the Standards, never paraphrase from memory.

## Known Issues

- **Brand spelling is inconsistent** — both `AlTareq` and `Al Tareq` appear across the Open Finance skills. Canonical spelling is undecided; don't "fix" one way without confirming.
- **The skills here lag the canonical copies**, which live in the Claude.ai skills UI and must be exported manually. A separate `uae-open-finance` skill (technical/integration focus: Ozone Connect, FAPI/OIDC, sandbox vs production) exists outside this repo and has never been merged in.
- **The Loom** — the reusable discovery/delivery harness — currently lives in the `ofbo` repo (`docs/the-loom.html`, `docs/discovery-harness.md`, `.claude/`). The plan is to extract the generic harness here as a plugin and leave the OFBO-specific instantiation there.

## Git

- Origin remote: `middleleap/ai-dlc`
- Main branch: `main`
- License: Apache 2.0
