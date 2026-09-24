# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MiddleLeap AI DLC** — a Claude Code plugin marketplace: skills, agents, and workflows for AI-enabled development, published for public installation. This is a knowledge-base / artifact library, not an application: no build system, no package manager, no dependencies. The only executable is the manifest validator, which has a `node:test` suite of its own (`scripts/validate-marketplace.test.mjs`) — the Loom harness bundle carries its own separate suite. The one application is `apps/loom-console` — zero-dependency Node with its own `node:test` suite, outside every plugin.

## Repository Structure

```
.claude-plugin/marketplace.json     # marketplace manifest — the file Claude Code reads
plugins/
├── middleleap-loom/                # The Loom — the AI-SDLC method (flagship). Depends on the three below
│   ├── .claude-plugin/plugin.json  #   ("dependencies"), so installing it installs them
│   ├── agents/                     # discovery-boundary, data-governance, change-watch, risk,
│   │                               #   model-risk and code reviewers
│   └── skills/
│       ├── loom/                   # method canon + references (discovery/delivery/governance/brainkit)
│       ├── loom-adopt/             # adoption skill + harness/ bundle (gates, renderer, templates,
│       │                           #   hooks, profiles, brainkit/ templates + brainkit-example/ —
│       │                           #   copied into adopting repos via copy-manifest.json)
│       ├── institution-intake/     # guided Q&A that sets the institution's scene
│       ├── brainkit-init/          # drafts an Institutional BrainKit from approved sources
│       │                           #   (never invents policy, never approves — rc.10)
│       ├── claude-md-guide/        # CLAUDE.md authoring (was middleleap-ai-sdlc)
│       └── context-template/       # starter CLAUDE.md generator (was middleleap-ai-sdlc)
├── middleleap-banking-uae/         # General UAE banking — any CBUAE-regulated bank, Loom or not
│   ├── skills/uae-bank-risk-reviewer/  # owns references/ (taxonomy, frameworks, review template)
│   ├── skills/bank-risk-reviewer/      # non-UAE variant; reads ../uae-bank-risk-reviewer/references/
│   ├── skills/islamic-banking-uae/     # Shariah-compliant finance; composes with open-finance-uae
│   └── skills/npa-uae/                 # New Product Approval: BPF template, anchors, Meridian examples
├── middleleap-open-finance-uae/    # UAE Open Finance domain expertise
│   ├── skills/open-finance-uae/    # the canon incl. AlTareq brand refs + check_current.py
│   └── skills/open-finance-uiux/
└── middleleap-loom-demo/           # Meridian Trust — the demo institution pack (the Loom's "pattern")
    ├── skills/meridian-brand-guidelines/
    └── skills/meridian-business-case/   # ISB/CIC business case, NPV model, templates
scripts/validate-marketplace.mjs    # run before every commit; CI runs it too
apps/loom-console/                  # the Loom console: a standalone, read-only app over ANY Loom
                                    #   installation (reads it, runs its own gates, writes nothing).
                                    #   Not a plugin, not installable, never copied into an adoption
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
node scripts/deidentify-check.mjs   # no client names under plugins/ — terms and allowlist in .deidentify.json
node --test apps/loom-console/test/*.test.mjs   # the console, over the Meridian demo installation
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
- Standards canon at last verification (17 Aug 2026): **v2.1-final + errata3**, API Hub **v8** — don't trust this line; run `python3 plugins/middleleap-open-finance-uae/skills/open-finance-uae/scripts/check_current.py`

Reference files carry regulatory figures, dates, and AED amounts. Treat them as load-bearing: check against the Standards, never paraphrase from memory, and record corrections in the skill's `references/verification-log.md`.

## Provenance rules (learned the hard way)

- **This repository is canonical for every skill in it** (from 25 Sep 2026). The Open Finance, Islamic banking and risk reviewer skills used to be edited in the Claude.ai skills UI and imported here by `.skill`/`.zip` export; those account copies are being retired in favour of installing the plugins. If an older account copy resurfaces, diff it against this repo before importing anything — the repo copies are newer and de-identified.
- **The risk reviewers descend from a client-specific original** (`risk-reviewer` in the Claude.ai account). Everything general from it is in `uae-bank-risk-reviewer`; what was dropped was client-specific (pipeline names, repo paths, calibration documents). Don't re-import it. `scripts/deidentify-check.mjs` (CI) fails the build if a re-import brings a client's name back — the ADCB references in `islamic-banking-uae` were de-identified here on 16 Sep 2026 and the Claude.ai copy still carries them. Last import: 17 Aug 2026 (open-finance-uae only; source-verification update, same content saved to Claude.ai).
- **The former `altareq-brand-guidelines` skill is retired** — merged into `open-finance-uae` as `references/altareq-*.md`. Don't recreate it.
- **The Loom** is extracted here as `plugins/middleleap-loom` (the generic harness). The OFBO-specific instantiation — the CBUAE data-risk register, OFBO brand profile, OFBO hard-stop checklists, Q1–Q5 CI workflows, and the three `the-loom*.html` decks — stays in the `openfinance-os/ofbo` repo as the worked example.
- **The `discovery/` tree is shared with `ofbo`, and the divergence is now counted, not remembered.** `discovery-sync.json` is the ledger and `scripts/discovery-sync-check.mjs` holds it: change a file under `harness/discovery/` without declaring it and the build fails. Run `node scripts/discovery-sync-check.mjs --record` to book the change as a port owed to ofbo. What the gate **cannot** see is whether ofbo has moved — it never reports the trees as agreeing, and only `--upstream <ofbo-checkout>`, run where both repos are reachable, may retire a debt. As of rc.29 nobody has ever run that, and 8 of 23 files carry an outstanding port.

## Git

- Origin remote: `middleleap/ai-dlc`
- Main branch: `main`
- License: Apache 2.0
