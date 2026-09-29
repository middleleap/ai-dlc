# Platform-Specific Tips

Guidance for writing context files across different AI coding tools.

## Claude Code (CLAUDE.md)

Claude Code reads `CLAUDE.md` files from the project root and any parent directories.

### Key behaviors
- Supports nested `CLAUDE.md` files — child directories inherit from parent
- File is loaded into context at session start (and again after a resume or compaction); it is not re-sent on every tool call
- Shorter files = more room for actual code in the context window
- Claude Code can run commands — always include test/build/lint commands

### Tips
- Keep root CLAUDE.md under 150 lines; use `references/` for deep context
- Include the exact shell commands for test, build, lint, and dev server
- Specify which files are generated and should never be edited
- Use the `## Do Not` section for hard constraints — Claude Code follows prohibitions well
- If using a monorepo, put shared rules in root and package-specific rules in nested files

### What works especially well
- Explicit test commands (Claude Code will run them to verify work)
- Error prevention checklists (reduces iteration cycles)
- Architecture overviews (helps Claude Code navigate large codebases)

## Cursor (.cursor/rules/*.mdc, AGENTS.md)

Cursor reads project rules from `.cursor/rules/` as `.mdc` files — Markdown with frontmatter
(`description`, `globs`, `alwaysApply`) that decides when each rule applies. A plain `.md` file
in that folder is ignored. For simple cases an `AGENTS.md` at the root (or in a subdirectory, for
that subtree) works instead. The single-file `.cursorrules` is the older form; prefer the folder.
(Checked against cursor.com/docs, 29 Sep 2026.)

### Key behaviors
- One rule per `.mdc` file; `globs` scope a rule to matching files, `alwaysApply` makes it global
- `AGENTS.md` files nest: a subdirectory's file applies to work in that subtree
- Rules share the context window with code — keep always-on rules short

### Tips
- Front-load the most impactful rules (context window is shared with code)
- Use short, imperative sentences — Cursor works well with direct instructions
- Include framework-specific patterns (Cursor excels at code generation)
- Mention your component library and design system explicitly

### Example structure
```
You are an expert in TypeScript, React, Next.js App Router, and Tailwind CSS.

Key conventions:
- Use functional components with TypeScript interfaces
- Use Tailwind for styling, never CSS modules
- Server Components by default
- Named exports only

File patterns:
- Components in src/components/ as PascalCase.tsx
- Hooks in src/hooks/ as use-kebab-case.ts
- API routes in app/api/[resource]/route.ts
```

## GitHub Copilot (.github/copilot-instructions.md)

GitHub Copilot reads instructions from `.github/copilot-instructions.md`.

### Key behaviors
- Organization-level and repo-level instructions supported
- Applies to Copilot Chat and inline suggestions
- Supports referencing other files with `#file` syntax in VS Code

### Tips
- Keep instructions focused on code style and patterns
- Be explicit about framework versions (Copilot trains on many versions)
- Mention preferred libraries for common tasks
- State testing conventions clearly

## Windsurf (.devin/rules/, AGENTS.md)

Windsurf reads workspace rules from `.devin/rules/*.md` (preferred) and the older
`.windsurf/rules/*.md`, in the workspace and its subdirectories. `AGENTS.md` goes through the same
rules engine: at the root it is always on, in a subdirectory it applies to that directory. The
single-file `.windsurfrules` at the root is still read. Global rules live in
`~/.codeium/windsurf/memories/global_rules.md` (always on, up to 6,000 characters).
(Checked against the Windsurf docs, 29 Sep 2026.)

### Tips
- Keep one concern per rule file; put directory-specific rules in that directory
- Include file organisation patterns and import conventions

## Cross-Platform Strategy

If your team uses multiple AI tools, maintain a canonical source and generate tool-specific files:

```
ai-config/
  canonical.md        # Source of truth
  generate.sh         # Script to generate tool-specific files
AGENTS.md             # Generated — read by Cursor and Windsurf
CLAUDE.md             # Generated (or hand-maintained with extras)
.github/copilot-instructions.md  # Generated
```

Alternatively, keep a single `CLAUDE.md` as the canonical file (it's the most expressive format) and symlink or copy the shared sections to other config files.

## Universal Best Practices (All Platforms)

1. **Include build/test commands** — every platform benefits from knowing how to verify changes
2. **State conventions explicitly** — don't assume the AI will infer style from existing code
3. **List prohibited patterns** — negative constraints are followed more reliably than positive suggestions
4. **Keep it current** — outdated instructions cause more harm than no instructions
5. **Review monthly** — as your project evolves, so should your AI context file
