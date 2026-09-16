> **Kept for reference — not the source of truth.** Superseded on 16 September 2026 by `plugins/middleleap-loom/skills/loom/references/kosli-seam.md` §4b–§4d and the harness code it names; `README.md` in this folder reconciles every feature below against what shipped.

# CLAUDE.md — loom-kosli

You are building `loom-kosli`, the integration between MiddleLeap's Loom (an AI delivery harness for regulated institutions) and Kosli (an SDLC evidence platform). The specification is `PRD.md`. The work order is `TASKS.md`. This file tells you how to behave while doing it.

## Order of operations

1. Read this file, then `PRD.md` in full, then `TASKS.md`.
2. Do Task 0 (verify the Kosli CLI surface) before writing any product code. Do not guess a Kosli flag, verb, or format. If the docs are unreachable, stop and say so.
3. Work `TASKS.md` strictly in order. One task per commit. After each task, tick its checkbox and fill in its `Evidence:` line with what you ran and what you saw.
4. Run `uv run pytest -q` before every commit. Never commit red.

## Non-negotiables

- **Never store what Kosli stores.** No local database, cache or file of attestations, trails or snapshots beyond `.loom/outbox/` (transient retry queue, deleted on flush). If you find yourself writing a store, stop — it is out of scope and it changes the partnership.
- **Never re-implement the Kosli API.** Shell out to the `kosli` binary via `kosli/runner.py`. One method per verb. Every method has a docstring citing the docs URL it was verified against.
- **Deterministic everywhere.** No LLM calls in this codebase. The risk classifier is rules. Golden tests must be byte-stable.
- **No secrets in the repo.** `KOSLI_API_TOKEN` from env only. Private keys in `~/.loom/keys/`, mode 0600. A pre-commit hook greps for `PRIVATE KEY` and `KOSLI_API_TOKEN=` and blocks.
- **No real institution data.** Control IDs in examples are placeholders. Do not invent a CBUAE taxonomy; ship ten illustrative crosswalk entries and a loader for a private file.
- **Provenance gate is not optional.** `loom attest` must route through `provenance.py` unconditionally. A `--skip-provenance` flag must not exist.

## Stack and conventions

- Python 3.12, `uv`, `typer`, `pydantic` v2, `pytest`, `cryptography`, `jinja2`, `pyyaml`, `fastmcp`.
- `src/` layout; `uv run loom …` and `uv run loom-mcp` are the entry points.
- Type hints everywhere; `ruff` and `mypy --strict` clean before commit.
- Exit codes are part of the contract (PRD §9). Test them.
- Structured JSON logs to stderr. Never log envelopes at INFO, never log keys or tokens at any level.
- Commit messages: `F<n>: <imperative summary>` or `T0: …` / `chore: …`. Reference the AC IDs satisfied, e.g. `F5: add PR2 no_self_attestation (AC5.1, AC5.2)`.

## Testing rules

- Unit tests run with `FakeKosli`, never against a real org. `FakeKosli` records every invocation as `{argv, stdin, cwd}`; tests assert on the call log.
- Integration tests are marked `@pytest.mark.integration` and skipped unless `KOSLI_API_TOKEN` and `KOSLI_ORG` are set.
- Golden files live in `tests/golden/`. Regenerate only with `UPDATE_GOLDEN=1` and say why in the commit.
- Every provenance rule has one passing and one failing test, named `test_PRn_pass` / `test_PRn_fail`.

## Rendered output (F4)

The audit package is a MiddleLeap document. Paper theme: background `#f7f5ef`, text `#1b1b1b`, borders `#d4cec2`, ember `#e65c2d` used only on rows that are human decisions. Fonts: Instrument Serif (headings), DM Sans (body), JetBrains Mono (identifiers, labels). Corner radius 0. Single self-contained HTML file; the only external dependency is Google Fonts. Include a print stylesheet.

## Skills to load

- Before F7: load the `mcp-builder` skill and follow its process, including the evaluation set.
- Before F4 templates: if a `middleleap-brand` skill is available in this environment, load it and use its tokens over the values above.

## When something in the PRD cannot be done as written

Do not silently substitute. Do the verification step the PRD names, take the documented fallback, and write one line under the task in `TASKS.md` starting `Deviation:` explaining what you found and what you did instead. Then continue.

## What good looks like

`demo/run_demo.sh` runs green from a clean clone in under fifteen minutes and ends with an audit package whose first row is the business intent and whose last row is the release decision, every row signed and verified, one deliberate self-review rejected along the way.
