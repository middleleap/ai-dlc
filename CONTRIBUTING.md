# Contributing to MiddleLeap AI DLC

Thanks for contributing! This guide covers how to add any artifact type to the marketplace.

## Artifact Types

| Type | Directory | Entry File | Description |
|------|-----------|------------|-------------|
| Skill | `skills/<category>/` | `SKILL.md` | Domain expertise and instructions |
| Plugin | `plugins/<category>/` | `PLUGIN.md` | Reusable agent extensions |
| Agent | `agents/<category>/` | `AGENT.md` | Pre-built agent configurations |
| Tool | `tools/<category>/` | `TOOL.md` | Standalone utilities |
| MCP Server | `mcp-servers/<category>/` | `SERVER.md` | MCP server configurations |

## How to Add an Artifact

1. **Create the folder** under the appropriate type and category directory:
   ```
   skills/finance/my-new-skill/
   ```

2. **Add the entry file** (e.g., `SKILL.md`) with YAML frontmatter:
   ```yaml
   ---
   name: my-new-skill
   description: What this skill does and when to use it
   ---
   ```

3. **Add supporting files** under `references/` and/or `assets/` subdirectories.

4. **Register in `marketplace.json`** — add an entry to the `artifacts` array:
   ```json
   {
     "name": "my-new-skill",
     "type": "skill",
     "category": "finance",
     "description": "Short description",
     "source": "skills/finance/my-new-skill",
     "version": "1.0.0",
     "tags": ["relevant", "tags"],
     "format": "agent-skills"
   }
   ```

5. **Submit a pull request.**

## Naming Conventions

- Use **lowercase-kebab-case** for all folder and file names
- Category folders group related artifacts (e.g., `finance`, `devops`, `healthcare`)
- Keep names descriptive but concise

## Size Guidelines

- **Skills**: < 1 MB total (text-based references and small SVG assets are fine)
- **No large binaries**: Do not commit `.fig`, `.psd`, `.png` > 100 KB, or other design files. Host them in a separate repo (see [open-finance-assets](https://github.com/middleleap/open-finance-assets) for an example)
- **No `node_modules`** or generated artifacts

## Quality Checklist

- [ ] Entry file has valid YAML frontmatter with `name` and `description`
- [ ] Folder follows lowercase-kebab-case naming
- [ ] Registered in `marketplace.json`
- [ ] No large binary files included
- [ ] Description is accurate and triggers are well-defined

## License

By contributing, you agree that your contributions will be licensed under the [Apache 2.0 License](LICENSE).
