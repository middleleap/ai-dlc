# loom-kosli integration — PRD bundle

A build-ready PRD for `loom-kosli`, the adapter that makes Loom gates emit signed, attributed, provenance-checked attestations into Kosli, lets Loom agents read Kosli's record before they plan, and renders an audit package that starts at the requirement. It is written to be executed by Claude Code **in its own repository**, not in this one.

- `PRD.md` — nine features, data contracts, acceptance criteria, demo script, definition of done
- `EXECUTION-CLAUDE.md` — the steering file to place as `CLAUDE.md` in the `loom-kosli` repo (renamed here so it does not shadow this repo's own `CLAUDE.md`)
- `TASKS.md` — 18 tasks in dependency order with evidence lines

The method-side view of the same seam is `plugins/middleleap-loom/skills/loom/references/kosli-seam.md`; the visual one-pager is `docs/loom-kosli-overlap.html`.
