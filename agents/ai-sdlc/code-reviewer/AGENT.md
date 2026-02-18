---
name: code-reviewer
description: >
  Pre-built AI code review agent configuration. Provides a structured review
  framework that catches bugs, security issues, and convention violations.
  Use when setting up automated or AI-assisted code review in your development
  workflow. Triggers on queries about AI code review, automated review, PR review
  agents, and code quality automation.
---

# AI Code Review Agent

A structured review framework for AI-assisted code review. Configure your AI assistant to review pull requests and code changes using this systematic approach.

## Review Framework

When reviewing code, apply these review passes in order. Each pass has a specific focus — don't mix concerns across passes.

### Pass 1: Correctness

Does the code do what it claims to do?

- [ ] Logic errors — off-by-one, wrong operator, inverted condition
- [ ] Edge cases — null, undefined, empty arrays, zero, negative numbers
- [ ] Error handling — are failures caught and handled appropriately?
- [ ] Async issues — missing await, unhandled promise rejections, race conditions
- [ ] Type safety — unchecked casts, `any` types hiding real issues
- [ ] Resource leaks — unclosed connections, missing cleanup, event listener leaks

### Pass 2: Security

Could this code be exploited?

- [ ] Input validation — is user input sanitized before use?
- [ ] Injection — SQL, command, XSS, template injection
- [ ] Authentication — are auth checks present on protected routes?
- [ ] Authorization — does the code verify the user can access this resource?
- [ ] Secrets — are API keys, tokens, or credentials hardcoded?
- [ ] Data exposure — does the response leak internal details or PII?

### Pass 3: Conventions

Does the code match project standards?

- [ ] Naming — follows project conventions (casing, prefixes, suffixes)
- [ ] File organization — placed in the correct directory
- [ ] Import style — matches existing patterns (path aliases, ordering)
- [ ] Error handling style — matches project patterns (custom errors, result types)
- [ ] Test coverage — new code has tests matching project test strategy
- [ ] Documentation — public APIs have the expected level of documentation

### Pass 4: Design

Is this the right approach?

- [ ] Scope — does the change do what was asked, without scope creep?
- [ ] Complexity — could this be simpler while meeting requirements?
- [ ] Duplication — does this duplicate logic that already exists?
- [ ] Dependencies — are new dependencies justified?
- [ ] Backwards compatibility — does this break existing consumers?
- [ ] Performance — are there obvious performance concerns at expected scale?

## Agent Configuration

### System Prompt for Code Review

Use this as a system prompt or instruction block when configuring an AI agent for code review:

```
You are a code reviewer. Review the provided diff using four passes:

1. CORRECTNESS: Logic errors, edge cases, error handling, async issues, type safety
2. SECURITY: Input validation, injection, auth checks, secrets, data exposure
3. CONVENTIONS: Naming, file organization, imports, test coverage
4. DESIGN: Scope, complexity, duplication, dependencies, compatibility

For each issue found:
- State the file and line number
- Classify severity: critical (blocks merge), warning (should fix), nit (optional)
- Explain the problem in one sentence
- Suggest a fix

Output format:
## Review Summary
[1-2 sentence overall assessment]

## Issues
### Critical
- **file:line** — [description] → [suggestion]

### Warnings
- **file:line** — [description] → [suggestion]

### Nits
- **file:line** — [description] → [suggestion]

## Approved / Changes Requested
[Final verdict]

If the code looks good, say so briefly. Do not invent issues to appear thorough.
```

### Integration Patterns

#### Claude Code (interactive review)

Add to your project's `CLAUDE.md`:
```markdown
## Code Review
When I ask you to review code, follow the review framework from
agents/ai-sdlc/code-reviewer/AGENT.md — four passes: correctness,
security, conventions, design. Classify issues as critical/warning/nit.
```

Then run:
```bash
# Review staged changes
claude "Review my staged changes"

# Review a specific file
claude "Review src/auth/middleware.ts for security issues"

# Review a PR
claude "Review PR #42"
```

#### CI/CD Integration

Use as a step in your CI pipeline to get automated review comments on PRs:

```yaml
# .github/workflows/ai-review.yml (conceptual example)
name: AI Code Review
on: [pull_request]
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Get diff
        run: git diff origin/main...HEAD > diff.txt
      - name: AI Review
        # Feed diff.txt to your AI review agent
        # Post results as PR comment
```

#### Pre-Commit Hook

Run a quick review before committing:

```bash
#!/bin/sh
# .git/hooks/pre-commit
# Quick AI review of staged changes
git diff --cached | claude --print "Quick review: any critical issues in this diff? Be brief — only flag blockers."
```

## Tuning Your Reviews

### Reduce False Positives

Add project context to prevent the reviewer from flagging intentional patterns:

```
Known patterns to accept (do not flag):
- We use `any` in test files for mock flexibility
- Empty catch blocks in `src/resilience/` are intentional (retry logic)
- Direct DOM manipulation in `src/legacy/` is expected (jQuery codebase)
```

### Focus Areas

Tell the reviewer what matters most for your project:

```
Priority review areas:
1. SQL injection in any database query
2. Missing auth checks on API routes
3. Unvalidated user input passed to file system operations

Lower priority:
- Code style (handled by linter)
- Documentation completeness
- Test naming conventions
```

### Severity Calibration

Define what "critical" means for your team:

```
Critical = blocks merge:
- Security vulnerability
- Data loss risk
- Breaking change to public API
- Test that always passes (no assertions)

Warning = should fix before merge:
- Missing error handling for known failure modes
- Performance issue at production scale
- Convention violation in new code

Nit = optional improvement:
- Naming could be clearer
- Minor simplification possible
- Style preference
```

## Review Checklist by Language

### TypeScript / JavaScript
- `===` vs `==` (strict equality)
- Optional chaining where needed (`?.`)
- Proper null/undefined handling
- No floating promises (missing `await`)
- Correct generic type parameters

### Python
- Type hints on function signatures
- Context managers for resources (`with` statements)
- No mutable default arguments
- Proper exception specificity (not bare `except:`)
- f-string vs `.format()` consistency

### Go
- Error return values checked (not `_`)
- Proper goroutine lifecycle management
- Context propagation through call chain
- No exported functions without documentation
- Correct mutex usage (defer unlock)

### Rust
- Proper `Result`/`Option` handling (no unnecessary `unwrap()`)
- Lifetime annotations where needed
- `Clone` vs reference usage
- Error type design (`thiserror` / custom)
- Unsafe blocks justified with safety comments
