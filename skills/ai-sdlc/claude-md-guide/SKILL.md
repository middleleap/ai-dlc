---
name: claude-md-guide
description: >
  Best practices for writing effective CLAUDE.md files that maximize AI assistant
  productivity. Covers structure, patterns, anti-patterns, and real-world examples
  for configuring AI coding assistants via project-level instruction files.
  Triggers on queries about CLAUDE.md, .cursorrules, AI context files, AI coding
  assistant configuration, prompt engineering for codebases, and AI-SDLC setup.
---

# CLAUDE.md Authoring Guide

How to write project instruction files that make AI coding assistants genuinely useful. This applies to `CLAUDE.md` (Claude Code), `.cursorrules` (Cursor), and similar per-project AI configuration files.

## Why This Matters

A well-written context file is the single highest-leverage investment in an AI-enabled SDLC. It turns a generic AI assistant into one that understands your stack, follows your conventions, and avoids your known pitfalls — without repeating yourself every session.

## Core Principles

### 1. Be Specific, Not Aspirational

Bad:
```
Write clean, well-tested code.
```

Good:
```
All new functions require unit tests in the adjacent `__tests__/` directory.
Use vitest, not jest. Mock external HTTP calls with msw.
```

The AI already tries to write "clean code." Tell it the things it *can't* infer from the codebase alone.

### 2. Front-Load the Most Important Context

AI assistants read CLAUDE.md top to bottom. Put the information that prevents the most expensive mistakes first:

1. **Project overview** — what this codebase does (1-2 sentences)
2. **Build / test / run commands** — how to verify changes work
3. **Architecture decisions** — patterns the AI must follow
4. **Naming conventions** — so generated code matches existing style
5. **Known pitfalls** — things that will break if the AI guesses wrong

### 3. Include Runnable Commands

Always include the exact commands for:
- Running tests (`npm test`, `pytest`, `cargo test`)
- Building the project (`npm run build`, `make`)
- Linting / formatting (`npm run lint`, `ruff check .`)
- Starting dev servers (`npm run dev`)

This lets the AI verify its own work.

### 4. Document the Non-Obvious

Don't document what the code already says. Document:
- Why you chose Approach A over Approach B
- Environment variables that must be set
- Services that must be running (databases, queues, APIs)
- Files that should never be edited by AI (generated files, vendored code)
- Deployment constraints (e.g., "Lambda has a 250 MB limit")

### 5. Use Constraints, Not Suggestions

Bad:
```
Consider using TypeScript interfaces instead of types where appropriate.
```

Good:
```
Use `interface` for object shapes. Use `type` only for unions, intersections, and mapped types.
```

AI assistants follow rules better than they interpret preferences.

## Recommended Structure

```markdown
# CLAUDE.md

## Project Overview
[1-2 sentences: what this is, who it's for]

## Commands
- Test: `npm test`
- Build: `npm run build`
- Lint: `npm run lint`
- Dev: `npm run dev`

## Architecture
[Key patterns, directory structure, data flow]

## Conventions
[Naming, file organization, import ordering]

## Stack
[Languages, frameworks, key libraries with versions if it matters]

## Do Not
[Explicit prohibitions — files to skip, patterns to avoid]
```

## Anti-Patterns

### The Novel

A 500-line CLAUDE.md that documents every file in the codebase. The AI runs out of useful context window, and the file is impossible to maintain.

**Fix**: Keep it under 150 lines. Link to reference docs for deep dives.

### The Wishlist

Instructions that describe an ideal codebase rather than the actual one:
```
All components use the new design system tokens.
```
(When in reality, half the codebase still uses raw hex values.)

**Fix**: Describe reality, then note the migration direction:
```
Legacy components use raw hex values. New components must use design tokens from `src/tokens.ts`. Do not migrate existing components unless explicitly asked.
```

### The Copy-Paste Dump

Pasting entire config files, API responses, or schema definitions into CLAUDE.md.

**Fix**: Reference the file path instead:
```
Database schema is defined in `prisma/schema.prisma`. Read it before modifying any database-related code.
```

### No Commands

A CLAUDE.md with architecture notes but no way for the AI to verify changes.

**Fix**: Always include test/build/lint commands. The AI can't be confident in its work if it can't check it.

## Per-Directory Overrides

For monorepos or large projects, use nested CLAUDE.md files:

```
CLAUDE.md                    # Root: shared conventions, monorepo structure
apps/web/CLAUDE.md           # Web app specifics (Next.js patterns, API routes)
apps/api/CLAUDE.md           # API specifics (Express middleware, auth flow)
packages/shared/CLAUDE.md    # Shared library rules
```

Each nested file inherits from the root and adds context specific to that package.

## Real-World Patterns

### For a Next.js App

```markdown
## Commands
- Dev: `npm run dev` (port 3000)
- Test: `npm test` (vitest)
- Build: `npm run build`
- Lint: `npm run lint`

## Architecture
- App Router (not Pages Router)
- Server Components by default; add "use client" only when needed
- Data fetching in server components via `lib/api.ts`
- State management: Zustand for client state, no Redux

## Conventions
- Components: PascalCase files in `src/components/`
- Utils: camelCase files in `src/lib/`
- API routes: `app/api/[resource]/route.ts`
- Use named exports, not default exports

## Do Not
- Do not use `getServerSideProps` or `getStaticProps` (App Router only)
- Do not add `"use client"` to components that don't use hooks or browser APIs
- Do not modify `next.config.js` without asking
```

### For a Python API

```markdown
## Commands
- Test: `pytest`
- Lint: `ruff check . && mypy .`
- Run: `uvicorn app.main:app --reload`
- Migrate: `alembic upgrade head`

## Architecture
- FastAPI with SQLAlchemy 2.0 (async)
- Repository pattern: routes -> services -> repositories -> models
- Alembic for migrations; never edit models without creating a migration

## Conventions
- snake_case everywhere
- Pydantic models in `app/schemas/`, SQLAlchemy in `app/models/`
- One router file per resource in `app/routes/`
- All endpoints return Pydantic response models

## Environment
- Requires PostgreSQL 15+ running on localhost:5432
- Copy `.env.example` to `.env` for local development
- Never commit `.env` files
```

## Measuring Effectiveness

Your CLAUDE.md is working well when:
- The AI rarely asks clarifying questions about project conventions
- Generated code passes linting on first try
- You stop needing to say "actually, we use X instead of Y"
- New team members can point AI at the repo and get productive immediately

## Reference Documentation

| Topic | File |
|-------|------|
| Starter template | See `tools/ai-sdlc/context-template/` |
| Detailed patterns | `references/patterns.md` |
| Platform-specific tips | `references/platform-tips.md` |
