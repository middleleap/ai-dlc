# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MiddleLeap AI DLC** — a marketplace of downloadable content for AI agents: skills, plugins, agents, tools, and MCP servers. This is a knowledge base / artifact library, not a software application — there is no build system, package manager, or test framework.

## Repository Structure

```
skills/
└── finance/
    ├── open-finance-uae/          # UAE Open Finance regulatory guidance (SKILL.md + 10 reference docs)
    ├── altareq-brand-guidelines/  # Al Tareq brand implementation (SKILL.md + 2 reference docs)
    └── open-finance-uiux/         # Open Finance value proposition prototyper (SKILL.md + 10 reference docs)
plugins/                           # Coming soon
agents/                            # Coming soon
tools/                             # Coming soon
mcp-servers/                       # Coming soon
marketplace.json                   # Machine-readable artifact registry
```

## Artifact Types

| Type | Directory | Entry File | Description |
|------|-----------|------------|-------------|
| Skill | `skills/<category>/` | `SKILL.md` | Domain expertise and instructions |
| Plugin | `plugins/<category>/` | `PLUGIN.md` | Reusable agent extensions |
| Agent | `agents/<category>/` | `AGENT.md` | Pre-built agent configurations |
| Tool | `tools/<category>/` | `TOOL.md` | Standalone utilities |
| MCP Server | `mcp-servers/<category>/` | `SERVER.md` | MCP server configurations |

## Artifact Anatomy

Each artifact is a folder containing:
- Entry file (e.g., `SKILL.md`) — Main entry with YAML frontmatter (`name`, `description`) and instruction body
- `references/` — Supporting documents (regulations, API specs, brand guides, etc.)
- `assets/` — Images, logos, and visual resources (optional, keep small)

## Key Domain Context (Finance Skills)

- **Al Tareq** = UAE Open Finance consumer-facing brand; **Nebras** = the platform operator
- **Current Standards version**: v2.1-final (Jan 7, 2026)
- **CBUAE** = Central Bank of UAE (the regulator)
- **TPP** = Third Party Provider; **LFI** = Licensed Financial Institution
- **API Hub**: Ozone-powered centralized infrastructure for Open Finance APIs

## When Editing Artifacts

- Entry files use YAML frontmatter — preserve `name`, `description`, and trigger fields
- Reference files are markdown with domain-specific content — maintain accuracy of regulatory figures, dates, and AED amounts
- Register new artifacts in `marketplace.json`
- Follow lowercase-kebab-case naming for all folders
- No large binaries (>.fig, .psd, large PNGs) — host those in [middleleap/open-finance-assets](https://github.com/middleleap/open-finance-assets)

## Git

- Origin remote: `middleleap/ai-dlc`
- Main branch: `main`
- License: Apache 2.0
