# MiddleLeap AI DLC

**Downloadable Content for AI agents** — skills, plugins, agents, tools, and MCP servers that make AI assistants smarter at specialized tasks.

DLC = knowledge packs, workflows, and integrations you install into AI coding assistants the same way game DLC extends a base game. Browse by type, pick what you need, drop it in.

## Browse

### Skills

Domain expertise and instructions that AI assistants load dynamically.

#### Finance

| Skill | Description |
|-------|-------------|
| [open-finance-uae](skills/finance/open-finance-uae/) | UAE Open Finance regulatory requirements, Al Tareq platform, CBUAE compliance, Standards v1.0–v2.1-final |
| [altareq-brand-guidelines](skills/finance/altareq-brand-guidelines/) | Al Tareq Open Finance brand — consent screens, payment buttons, CX certification |
| [open-finance-uiux](skills/finance/open-finance-uiux/) | Rapidly prototype Open Finance value propositions with presentations and interactive mockups |

### Plugins

Reusable extensions for AI agents. [Browse plugins](plugins/) — *coming soon*

### Agents

Pre-built agent configurations and workflows. [Browse agents](agents/) — *coming soon*

### Tools

Standalone utilities AI agents can invoke. [Browse tools](tools/) — *coming soon*

### MCP Servers

Model Context Protocol server configs. [Browse MCP servers](mcp-servers/) — *coming soon*

## Installation

### Claude Code
```bash
npx skills add middleleap/ai-dlc
```

### Manual
Copy the desired artifact folder into your agent's directory:
```bash
# Copy a skill into Claude Code
cp -r skills/finance/open-finance-uae ~/.claude/skills/

# Claude.ai — upload the skill folder via the Skills settings panel
```

## Related Repositories

- [middleleap/open-finance-assets](https://github.com/middleleap/open-finance-assets) — UI/UX design assets (logos, wireframes, screen mockups) for Al Tareq Open Finance

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add skills, plugins, agents, tools, and MCP servers.

## License

[Apache 2.0](LICENSE)
