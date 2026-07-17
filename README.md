# MiddleLeap AI DLC

**Downloadable content for AI-enabled development** — skills, agents, and workflows that make AI coding assistants better at real work.

DLC = knowledge packs and structured workflows you install into an AI coding assistant the same way game DLC extends a base game. Pick a plugin, install it, get to work.

## Install

```
/plugin marketplace add middleleap/ai-dlc
/plugin install middleleap-ai-sdlc@middleleap-ai-dlc
```

Run it from inside Claude Code. `/plugin` lists what's available and lets you enable or disable plugins per project.

## Plugins

### [middleleap-ai-sdlc](plugins/middleleap-ai-sdlc/)

Practices and patterns for AI-enabled software development.

| Type | Name | Description |
|------|------|-------------|
| Skill | `claude-md-guide` | How to write CLAUDE.md files that actually change agent behaviour — structure, patterns, anti-patterns |
| Skill | `context-template` | Fill-in-the-blanks CLAUDE.md starter for any stack |
| Agent | `code-reviewer` | Four-pass review — correctness, security, conventions, design — with critical/warning/nit severity |

### [middleleap-open-finance](plugins/middleleap-open-finance/)

UAE Open Finance domain expertise for the CBUAE / Al Tareq / Nebras ecosystem.

| Type | Name | Description |
|------|------|-------------|
| Skill | `open-finance-uae` | Regulatory and commercial canon — CBUAE regulation, Standards v1.0–v2.1-final, certification, liability, pricing |
| Skill | `altareq-brand-guidelines` | Brand implementation — consent screens, payment buttons, CX certification |
| Skill | `open-finance-uiux` | Value-proposition prototyper — solution decks and interactive journey mockups |

Skills are namespaced by their plugin once installed: `/middleleap-open-finance:open-finance-uae`.

## Using a skill without installing the plugin

Skills are plain directories. To take one without the plugin machinery, copy it into your project:

```bash
git clone https://github.com/middleleap/ai-dlc.git
cp -r ai-dlc/plugins/middleleap-ai-sdlc/skills/claude-md-guide/ your-project/.claude/skills/
```

You lose versioning, updates, and namespacing — fine for a quick experiment, not for a team. Prefer the plugin.

## Related repositories

- [middleleap/open-finance-assets](https://github.com/middleleap/open-finance-assets) — UI/UX design assets (logos, wireframes, screen mockups) for Al Tareq Open Finance

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[Apache 2.0](LICENSE)
