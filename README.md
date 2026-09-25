# MiddleLeap AI DLC

**Downloadable content for AI-enabled development** — skills, agents, and workflows that make AI coding assistants better at real work.

DLC = knowledge packs and structured workflows you install into an AI coding assistant the same way game DLC extends a base game. Pick a plugin, install it, get to work.

## Install

```
/plugin marketplace add middleleap/ai-dlc
/plugin install middleleap-loom@middleleap-ai-dlc
```

That installs the Loom and the three plugins it depends on. To take only the domain expertise,
install `middleleap-banking-uae` or `middleleap-open-finance-uae` on its own instead.

Run it from inside Claude Code. `/plugin` lists what's available and lets you enable or disable plugins per project.

## Starting an institutional adoption

Install `middleleap-loom@middleleap-ai-dlc` from the same marketplace in Claude Code.
Open the [guided start](plugins/middleleap-loom/skills/loom-adopt/harness/intake/questionnaire.html) for an example, institutional intake or first-team setup. The [Loom introduction](docs/the-loom.html#adopt) explains the method.

- **Understand the method:** open the [Loom Atlas](plugins/middleleap-loom/skills/loom/assets/loom-atlas.html).
- **Prepare an institution:** run `/middleleap-loom:institution-intake` to gather role-specific inputs and source references, then `/middleleap-loom:brainkit-init` to draft its institutional context. Drafts require accountable review.
- **Prepare a team's repository:** run `/middleleap-loom:loom-adopt`, review the proposed installation, then use `node scripts/loom.mjs configure` to see setup tasks and owners.

The [adoption guide](plugins/middleleap-loom/README.md#starting-and-checking-an-adoption)
covers prerequisites, checks and activation evidence. Claude Code is the reference runtime;
a specific model is not required by the method. Other runtimes need verified adapters for
runtime controls before equivalent enforcement can be claimed.

## Plugins

| Plugin | For |
|---|---|
| [middleleap-loom](plugins/middleleap-loom/) | The Loom method. Installs the other three with it |
| [middleleap-banking-uae](plugins/middleleap-banking-uae/) | Any CBUAE-regulated bank: risk review, Islamic banking, New Product Approval |
| [middleleap-open-finance-uae](plugins/middleleap-open-finance-uae/) | UAE Open Finance: regulation, Standards, AlTareq brand and CX, prototyping |
| [middleleap-loom-demo](plugins/middleleap-loom-demo/) | Meridian Trust, the fictional bank the Loom demo runs against |

### [middleleap-loom](plugins/middleleap-loom/)

**The Loom** — MiddleLeap's method for how a regulated entity builds software with AI: a gated discovery harness (D1–D9), an autonomous delivery loop with human four-eyes merge, always-on guardrails, and the machinery to adopt it in any repository. Proven end-to-end on a UAE Open Finance back office.

**[Read how the Loom works →](docs/the-loom.html)** — the interactive, human-facing documentation page (open it in a browser).

**[The Loom for the value chain →](docs/loom-for-the-value-chain.html)** — the same method for the people who have to approve it: executive sponsor, product, engineering, risk, audit, operations, security. Five views — the machine, one idea end to end, the adversarial checklist, the toolkit, and the decision.

| Type | Name | Description |
|------|------|-------------|
| Skill | `loom` | The method canon — the double diamond, the gate models, the context brain, the governance catalog (HG-0001…HG-0014) |
| Skill | `loom-adopt` | Stands the harness up in a repo — gate validator, branded renderer, artifact templates, waist gate, eight build-loop skills, reviewer templates, guardrail hooks |
| Skill | `institution-intake` | The guided Q&A that sets the institution's scene before the first problem |
| Skill | `brainkit-init` | Drafts an Institutional BrainKit from an institution's approved sources |
| Skill | `claude-md-guide` | How to write CLAUDE.md files that actually change agent behaviour |
| Skill | `context-template` | Fill-in-the-blanks CLAUDE.md starter for any stack |
| Agent | `discovery-boundary-reviewer` | Guards the no-solutioning line and prototype fidelity on discovery runs |
| Agent | `data-governance-reviewer` | Judges control coverage and residual-risk soundness beyond the mechanical D6 gate |
| Agent | `change-watch`, `risk-reviewer`, `model-risk-reviewer` | Continuous assurance — horizon scanning, impact assessment, independent model challenge |
| Agent | `code-reviewer` | Four-pass review — correctness, security, conventions, design — with critical/warning/nit severity |

### [middleleap-banking-uae](plugins/middleleap-banking-uae/)

UAE banking expertise for any CBUAE-regulated institution — general-purpose, with or without the Loom.

| Type | Name | Description |
|------|------|-------------|
| Skill | `uae-bank-risk-reviewer` | Virtual Head of Risk — discovery landscape, backlog risk tagging, formal review, and control-enforcement verification against a 77-control UAE taxonomy |
| Skill | `bank-risk-reviewer` | The same reviewer for a bank outside the UAE, mapping the regulatory drivers to local equivalents |
| Skill | `islamic-banking-uae` | Shariah-compliant finance — principles, contracts, CBUAE Shariah governance, and the Islamic fields in Standards v2.1 |
| Skill | `npa-uae` | New Product Approval — the Business Proposition Form (33 fields, Word template), the CBUAE anchor behind each field, sign-off routing, BAU assessments, and the Loom's PA1/PA2 receipts |

### [middleleap-open-finance-uae](plugins/middleleap-open-finance-uae/)

UAE Open Finance domain expertise for the CBUAE / Al Tareq / Nebras ecosystem.

| Type | Name | Description |
|------|------|-------------|
| Skill | `open-finance-uae` | The canon — CBUAE regulation, Standards + errata tracking, API specs, certification, liability, pricing, AlTareq brand & CX, self-check scripts |
| Skill | `open-finance-uiux` | Value-proposition prototyper — solution decks and interactive journey mockups |

### [middleleap-loom-demo](plugins/middleleap-loom-demo/)

The demo institution pack — Meridian Trust, a fictional bank, as the context the Loom plugs into. Retarget it to a real bank by swapping the values.

| Type | Name | Description |
|------|------|-------------|
| Skill | `meridian-brand-guidelines` | Meridian Blue + Inter, colour roles, the Meridian line motif, slide layout, logos and icon system — the source for the Loom's Meridian brand profile |
| Skill | `meridian-business-case` | Two-stage capital approval — ISB pre-screening and CIC detailed case, NPV/cost model, sign-offs |

Skills are namespaced by their plugin once installed: `/middleleap-open-finance-uae:open-finance-uae`.

## Using a skill without installing the plugin

Skills are plain directories. To take one without the plugin machinery, copy it into your project:

```bash
git clone https://github.com/middleleap/ai-dlc.git
cp -r ai-dlc/plugins/middleleap-loom/skills/claude-md-guide/ your-project/.claude/skills/
```

You lose versioning, updates, and namespacing — fine for a quick experiment, not for a team. Prefer the plugin.

## Related repositories

- [middleleap/open-finance-assets](https://github.com/middleleap/open-finance-assets) — UI/UX design assets (logos, wireframes, screen mockups) for Al Tareq Open Finance

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[Apache 2.0](LICENSE)
