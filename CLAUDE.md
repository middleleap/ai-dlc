# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MiddleLeap Agent Skills** — a collection of AI agent skills following the [Agent Skills](https://agentskills.io) standard. Focused on UAE Open Finance, banking, and fintech domains. This is a knowledge base / skills library, not a software application — there is no build system, package manager, or test framework.

## Repository Structure

```
skills/
├── open-finance-uae/          # UAE Open Finance regulatory guidance (SKILL.md + 10 reference docs)
├── altareq-brand-guidelines/  # Al Tareq brand implementation (SKILL.md + 2 reference docs)
Open Finance Assets/           # UI/UX assets (logos, screen mockups)
```

Two additional skills are listed in README.md but not yet implemented.

## Skill Anatomy

Each skill is a folder under `skills/` containing:
- `SKILL.md` — Main entry with YAML frontmatter (`name`, `description`, trigger patterns) and instruction body
- `references/` — Supporting documents (regulations, API specs, brand guides, etc.)
- `assets/` — Images, logos, and visual resources (optional)

## Key Domain Context

- **Al Tareq** = UAE Open Finance consumer-facing brand; **Nebras** = the platform operator
- **Current Standards version**: v2.1-final (Jan 7, 2026)
- **CBUAE** = Central Bank of UAE (the regulator)
- **TPP** = Third Party Provider; **LFI** = Licensed Financial Institution
- **API Hub**: Ozone-powered centralized infrastructure for Open Finance APIs

## When Editing Skills

- SKILL.md files use YAML frontmatter — preserve `name`, `description`, and trigger fields
- Reference files are markdown with domain-specific content — maintain accuracy of regulatory figures, dates, and AED amounts
- The `open-finance-uae` skill contains 10 reference files totaling ~2,800 lines covering regulations, API specs, pricing, liability, testing, and implementation roadmaps
- The `altareq-brand-guidelines` skill contains detailed screen specifications for consent journeys — preserve mandatory UI elements (logo, progress bar, buttons)

## Git

- Origin remote: `michartmann/connect`
- Main branch: `main`; current working branch: `master`
- License: Apache 2.0
