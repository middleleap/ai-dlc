# Starter template — customisation guide and checklist

1. Copy `../assets/CLAUDE.md.template` into the project root as `CLAUDE.md`
2. Fill in each `[bracketed]` section with the project's specifics
3. Delete sections that don't apply, and add the stack-specific sections below
4. Keep it under 150 lines — link to docs for details — then run the checklist at the end

## Customization Guide

### For Frontend Projects

Add these sections:
```markdown
## Component Patterns
- Use functional components with TypeScript interfaces for props
- Colocate styles, tests, and stories with components
- Use `React.memo` only when profiling shows a performance issue

## Design System
- Tokens defined in `src/tokens.ts`
- Component library: [Radix UI / shadcn/ui / custom]
- Icons: [lucide-react / heroicons]
```

### For Backend APIs

Add these sections:
```markdown
## API Design
- RESTful endpoints following OpenAPI 3.0 spec
- All responses use standard envelope: `{ data, error, meta }`
- Pagination: cursor-based via `?cursor=` parameter
- Auth: Bearer token in Authorization header

## Database
- ORM: [Prisma / SQLAlchemy / Drizzle]
- Migrations: [prisma migrate / alembic / drizzle-kit]
- Always create a migration when modifying models
- Never use raw SQL in application code (use the ORM)
```

### For Monorepos

Add a structure map:
```markdown
## Monorepo Structure
packages/
  ui/          — Component library (no app-specific imports)
  api-client/  — Generated from OpenAPI (do not edit)
  config/      — Shared lint, TS, and build configs
apps/
  web/         — Next.js frontend
  api/         — Express backend
  worker/      — Background jobs

## Cross-Package Rules
- packages/ must not import from apps/
- Shared types go in packages/api-client
- Run `pnpm build --filter=packages/*` before testing apps
```

## Validation Checklist

After filling in your template, verify:

- [ ] All commands are correct and runnable
- [ ] Architecture section matches actual directory structure
- [ ] Conventions match what existing code actually does (not aspirations)
- [ ] "Do Not" section covers the AI's most likely mistakes
- [ ] File is under 150 lines
- [ ] No secrets, API keys, or internal URLs included
