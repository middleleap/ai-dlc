# MiddleLeap Agent Skills

A collection of agent skills for Claude and other AI coding assistants, focused on UAE Open Finance, banking, and fintech domains.

Skills follow the [Agent Skills](https://agentskills.io) standard — folders of instructions, scripts, and resources that AI assistants load dynamically to improve performance on specialized tasks.

## Skills

| Skill | Description |
|-------|-------------|
| [open-finance-uae](skills/open-finance-uae/) | UAE Open Finance regulatory requirements, Al Tareq platform, CBUAE compliance, Standards v1.0–v2.1-final |
| [altareq-brand-guidelines](skills/altareq-brand-guidelines/) | Al Tareq Open Finance brand — consent screens, payment buttons, CX certification |

## Installation

### Claude Code
```bash
npx skills add middleleap/skills
```

### Manual
Copy the desired skill folder into your agent's skills directory:
```bash
# Claude Code
cp -r skills/open-finance-uae ~/.claude/skills/

# Claude.ai
# Upload the skill folder via the Skills settings panel
```

## Usage

Skills activate automatically when relevant queries are detected. For example:

- *"What are the TPP licensing requirements in UAE?"* → `open-finance-uae`
- *"Design a consent screen for Al Tareq"* → `altareq-brand-guidelines`

## Contributing

1. Fork this repository
2. Create a new skill folder under `skills/`
3. Include a `SKILL.md` with YAML frontmatter (`name`, `description`)
4. Add reference files under `references/` and assets under `assets/`
5. Submit a pull request

## License

Apache 2.0
