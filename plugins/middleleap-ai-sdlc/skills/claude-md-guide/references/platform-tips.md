# Platform-Specific Tips

Guidance for writing context files across different AI coding tools.

## Claude Code (CLAUDE.md)

Claude Code reads `CLAUDE.md` files from the project root and any parent directories.

### Key behaviors
- Supports nested `CLAUDE.md` files — child directories inherit from parent
- File is loaded into context at session start and on every tool call
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

## Cursor (.cursorrules)

Cursor reads `.cursorrules` from the project root.

### Key behaviors
- Single file, no nesting support
- Loaded into every Cursor AI interaction (Chat, Composer, Cmd+K)
- Shared across all Cursor features — keep it general

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

## Windsurf (.windsurfrules)

Windsurf reads `.windsurfrules` from the project root.

### Key behaviors
- Similar to Cursor's format
- Loaded into Cascade (Windsurf's AI agent) context
- Single file at project root

### Tips
- Structure is similar to `.cursorrules`
- Include file organization patterns
- Specify import conventions

## Cross-Platform Strategy

If your team uses multiple AI tools, maintain a canonical source and generate tool-specific files:

```
ai-config/
  canonical.md        # Source of truth
  generate.sh         # Script to generate tool-specific files
.cursorrules          # Generated
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
