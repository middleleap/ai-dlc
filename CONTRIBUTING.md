# Contributing to MiddleLeap AI DLC

Thanks for contributing! This repo is a **Claude Code plugin marketplace**. Everything ships inside a plugin — that's what makes it installable.

## Layout

```
.claude-plugin/marketplace.json     # the marketplace manifest — lists every plugin
plugins/
└── <plugin-name>/
    ├── .claude-plugin/plugin.json  # the plugin manifest
    ├── README.md
    ├── skills/<skill-name>/SKILL.md
    ├── agents/<agent-name>.md
    ├── commands/<command-name>.md
    └── hooks/hooks.json
```

The directory names inside a plugin (`skills/`, `agents/`, `commands/`, `hooks/`) are discovered automatically — don't rename them.

Note the asymmetry, because it's a common mistake: a **skill** is a *directory* containing `SKILL.md`, while an **agent** is a *flat markdown file*. `agents/code-reviewer/AGENT.md` will not be discovered; `agents/code-reviewer.md` will.

## Adding a skill to an existing plugin

1. Create `plugins/<plugin>/skills/<skill-name>/SKILL.md` with YAML frontmatter:

   ```yaml
   ---
   name: my-new-skill
   description: What this does, and when Claude should use it. Include the trigger words a user would actually type.
   ---
   ```

   `description` is what Claude reads to decide whether to load the skill — it's the highest-leverage field in the file. Keep it under 1024 characters. `name` is optional (it defaults to the folder name), but we set it explicitly.

2. Put supporting documents in `references/` and images in `assets/` alongside `SKILL.md`.

3. Bump the plugin's `version` in **both** `plugins/<plugin>/.claude-plugin/plugin.json` and its entry in `.claude-plugin/marketplace.json`.

## Adding a new plugin

1. Create `plugins/<plugin-name>/.claude-plugin/plugin.json` — copy an existing one and edit.
2. Add a matching entry to the `plugins` array in `.claude-plugin/marketplace.json`, with an explicit `"source": "./plugins/my-plugin"`.

   Write the path out in full. The `metadata.pluginRoot` shortcut (a bare `"source": "my-plugin"`) is documented, but current Claude Code releases reject it at install time with *"This plugin uses a source type your Claude Code version does not support"* — and the marketplace still *adds* cleanly, so the breakage only surfaces when a user tries to install. Don't reintroduce it.
3. Add a `README.md` covering what's in it and how to install it.
4. List it in the root `README.md`.

## Versioning — this one matters

`version` is what decides whether existing users receive your change. **Ship an update without bumping it and nobody gets it.** Bump the plugin version on every content change:

- patch — typo, clarification, small correction
- minor — new skill, new agent, meaningful new content
- major — restructure, removal, or anything that breaks existing usage

## Naming

- **lowercase-kebab-case** for every folder and file
- Plugin names are public and namespace their skills (`/my-plugin:my-skill`) — pick something you won't regret
- Keep names descriptive but short

## Size

- No large binaries — no `.fig`, `.psd`, or PNGs over 100 KB. Host those separately (see [open-finance-assets](https://github.com/middleleap/open-finance-assets)).
- Text references and small SVGs are fine.
- No `node_modules/` or generated output.

## Before you open a PR

Run the validator — CI runs the same check:

```bash
node scripts/validate-marketplace.mjs
```

It verifies both manifests parse, every plugin source resolves, versions agree between the two manifests, and every skill and agent is where Claude Code will look for it.

Then confirm the marketplace actually loads:

```
/plugin marketplace add ./
```

## License

By contributing, you agree that your contributions will be licensed under the [Apache 2.0 License](LICENSE).
