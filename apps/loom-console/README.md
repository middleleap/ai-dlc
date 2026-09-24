# The Loom console

A read-only oversight console over any Loom installation. It shows what has been loaded into the
brain, every discovery run with its stage, prototype and PRD, what is waiting on a person and for
how long, and how mature the controls really are. It's aimed at the people who oversee the Loom but
don't operate it from a terminal.

It's a standalone app. It isn't part of the `middleleap-loom` plugin and isn't installed into a
bank's repository. It reads an installation (a repository adopted with the Loom) and runs that
installation's own gate code. It writes nothing, holds no credential, and has no approve button:
decisions stay signed records in git.

## Run it

```bash
# The Meridian Trust worked example: adopts the Loom into a scratch directory,
# mounts the demo portfolio, and serves the console on http://127.0.0.1:4317
node apps/loom-console/bin/loom-console.mjs demo

# Over a real installation
node apps/loom-console/bin/loom-console.mjs serve --repo /path/to/adopted/repo
node apps/loom-console/bin/loom-console.mjs build --repo /path/to/adopted/repo --out ./site
node apps/loom-console/bin/loom-console.mjs data  --repo /path/to/adopted/repo --pretty
```

Node 20 or later. No dependencies, no install step.

## What it guarantees

- **Generated, never written.** Every value on screen comes from `console.json` (`loom.console/v1`), which the reader builds from the installation.
- **Every fact is tagged** as a *record*, an *executed check*, *derived* or *telemetry*, and names the file it came from.
- **Gates are shown exactly as the validator returns them.** A gate that fails because its stage isn't reached shows *fail · not reached*, never pass.
- **Read-only.** The local server binds to 127.0.0.1 and answers GET and HEAD only. The page has a strict CSP and makes no network call beyond its own origin.

## Layout

| Path | What |
|---|---|
| `bin/loom-console.mjs` | CLI: `data`, `build`, `serve`, `demo` |
| `src/data.mjs` | the reader; loads `discovery/gates/validate.mjs`, `discovery/gates/lib.mjs` and `scripts/approval-status.mjs` from the installation |
| `src/build.mjs`, `src/serve.mjs` | static site; local read-only server |
| `src/demo.mjs` | the Meridian Trust demo installation |
| `web/` | the UI (vanilla ES modules, no build step) |
| `test/` | `node --test apps/loom-console/test/*.test.mjs` |
| `docs/PRD.md` | the product requirements and the phasing |
| `docs/prototype.html` | a published snapshot of the console over the Meridian demo |
