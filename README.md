# MiddleLeap AI DLC

**Downloadable Content for AI-enabled development** — skills, plugins, agents, tools, and MCP servers that make AI coding assistants smarter at real work.

DLC = knowledge packs, workflows, and integrations you install into AI coding assistants the same way game DLC extends a base game. Browse by type, pick what you need, drop it in.

## Why AI DLC?

AI coding assistants are powerful out of the box, but they become dramatically more useful with project-specific context, domain knowledge, and structured workflows. This repository is a shared library of that context — battle-tested artifacts you can install to skip the trial-and-error phase of AI-assisted development.

## Browse

### Skills

Domain expertise and instructions that AI assistants load dynamically.

#### AI-SDLC

Practices and patterns for AI-enabled software development.

| Skill | Description |
|-------|-------------|
| [claude-md-guide](skills/ai-sdlc/claude-md-guide/) | Best practices for writing CLAUDE.md files — structure, patterns, anti-patterns, and real-world examples |

#### Finance

| Skill | Description |
|-------|-------------|
| [open-finance-uae](skills/finance/open-finance-uae/) | UAE Open Finance regulatory requirements, Al Tareq platform, CBUAE compliance, Standards v1.0–v2.1-final |
| [altareq-brand-guidelines](skills/finance/altareq-brand-guidelines/) | Al Tareq Open Finance brand — consent screens, payment buttons, CX certification |
| [open-finance-uiux](skills/finance/open-finance-uiux/) | Rapidly prototype Open Finance value propositions with presentations and interactive mockups |

### Agents

Pre-built agent configurations and workflows.

#### AI-SDLC

| Agent | Description |
|-------|-------------|
| [code-reviewer](agents/ai-sdlc/code-reviewer/) | Structured 4-pass review framework — correctness, security, conventions, design |

[Browse all agents](agents/)

### Tools

Standalone utilities AI agents can invoke.

#### AI-SDLC

| Tool | Description |
|------|-------------|
| [context-template](tools/ai-sdlc/context-template/) | Starter CLAUDE.md template — fill in the blanks for your stack |

[Browse all tools](tools/)

### Plugins

Reusable extensions for AI agents. [Browse plugins](plugins/) — *coming soon*

### MCP Servers

Model Context Protocol server configs. [Browse MCP servers](mcp-servers/) — *coming soon*

## Getting Started

### 1. Install a skill into Claude Code
```bash
# Clone the repo
git clone https://github.com/middleleap/ai-dlc.git

# Copy a skill into your project
cp -r ai-dlc/skills/ai-sdlc/claude-md-guide/ your-project/.claude/skills/
```

### 2. Use the context template to set up your project
```bash
# Copy the template tool and fill in the blanks for your stack
cat ai-dlc/tools/ai-sdlc/context-template/TOOL.md
```

### 3. Set up AI code review
```bash
# Copy the review agent configuration
cp -r ai-dlc/agents/ai-sdlc/code-reviewer/ your-project/.claude/agents/
```

## Related Repositories

- [middleleap/open-finance-assets](https://github.com/middleleap/open-finance-assets) — UI/UX design assets (logos, wireframes, screen mockups) for Al Tareq Open Finance

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add skills, plugins, agents, tools, and MCP servers.

## License

[Apache 2.0](LICENSE)
