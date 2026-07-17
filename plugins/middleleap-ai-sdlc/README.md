# middleleap-ai-sdlc

Practices and patterns for AI-enabled software development.

```
/plugin marketplace add middleleap/ai-dlc
/plugin install middleleap-ai-sdlc@middleleap-ai-dlc
```

## What's in it

| Type | Name | Description |
|------|------|-------------|
| Skill | `claude-md-guide` | How to write CLAUDE.md files that actually change agent behaviour — structure, patterns, anti-patterns |
| Skill | `context-template` | Fill-in-the-blanks CLAUDE.md starter for any stack |
| Agent | `code-reviewer` | Four-pass review — correctness, security, conventions, design — with critical/warning/nit severity |

Once installed, skills are namespaced to the plugin: `/middleleap-ai-sdlc:claude-md-guide`.

## Tuning the code reviewer

The reviewer reads your project's `CLAUDE.md` before reviewing, so that file is where you tune it. Three things are worth stating explicitly.

**Suppress intentional patterns**, so the reviewer stops flagging things you meant:

```markdown
Known patterns to accept (do not flag):
- We use `any` in test files for mock flexibility
- Empty catch blocks in `src/resilience/` are intentional (retry logic)
- Direct DOM manipulation in `src/legacy/` is expected (jQuery codebase)
```

**Set focus areas**, so review effort lands where your risk actually is:

```markdown
Priority review areas:
1. SQL injection in any database query
2. Missing auth checks on API routes
3. Unvalidated user input passed to file system operations

Lower priority (handled elsewhere):
- Code style — the linter owns this
- Test naming conventions
```

**Calibrate severity**, because "critical" means different things to different teams. The agent ships with a default definition; override it in `CLAUDE.md` if yours differs.

## Other ways to run it

In CI, as a step that posts review comments on a PR:

```yaml
name: AI Code Review
on: [pull_request]
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - run: git diff origin/${{ github.base_ref }}...HEAD > diff.txt
      # Feed diff.txt to your AI review agent, post the result as a PR comment.
```

As a pre-commit hook, for a fast blocker check only:

```sh
#!/bin/sh
# .git/hooks/pre-commit
git diff --cached | claude --print "Quick review: any critical issues in this diff? Be brief — only flag blockers."
```
