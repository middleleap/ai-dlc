# TASKS.md — loom-kosli

Work top to bottom. One task per commit. Tick the box and fill `Evidence:` when done. Add a `Deviation:` line if you departed from the PRD and why. Do not start a task whose `Depends:` are unticked.

---

## Phase 0 — Verify and scaffold

- [ ] **T0 — Verify the Kosli CLI surface**
  Depends: —
  Install the `kosli` CLI. Run `kosli --help` and read the CLI reference on docs.kosli.com for: `create flow`, `begin trail`, `attest generic`, `get trail`, `get snapshot`/environment retrieval, attestation retrieval by name, policy/compliance format, Kosli Answers API, flow templates. Write `docs/kosli-surface.md`: one section per verb with the exact flags used, the doc URL, and the date checked. Answer each open question in PRD §12 in that file.
  Evidence:

- [ ] **T1 — Scaffold the repo**
  Depends: T0
  `uv init`, `pyproject.toml` with deps and entry points `loom`, `loom-mcp`; `src/loom_kosli/` layout from PRD §6; `ruff`, `mypy --strict`, `pytest` configured; pre-commit hook for secrets; `README.md` stub; `LICENSE` (proprietary, MiddleLeap). `uv run pytest -q` passes with one placeholder test.
  Evidence:

- [ ] **T2 — Config**
  Depends: T1
  `config.py`: load `loom.toml` (actors, provenance.disabled, crosswalk.path, expected attestations per stage) and env (`KOSLI_ORG`, `KOSLI_API_TOKEN`, `LOOM_ACTOR_ID`). `loom doctor` prints what is set without printing secret values. Ship `loom.toml.example`.
  Evidence:

- [ ] **T3 — FakeKosli**
  Depends: T1
  `kosli/fake.py`: a shim installed on PATH during tests that records `{argv, stdin, cwd}` to a JSONL call log and replays canned responses keyed by verb. `kosli/runner.py` skeleton with one method per verb from T0, each docstring citing the doc URL.
  Evidence:

- [ ] **T4 — Schemas**
  Depends: T1
  `schemas/actor.py`, `provenance.py`, `attestation.py` (envelope + nine payload models), `gates.py`, `risk.py`, `crosswalk.py`. Validation tests for every model including the negative cases named in the ACs (agent without model; `accepted_by` non-human).
  Evidence:

## Phase 1 — Demo core (P0)

- [ ] **T5 — F3 keystore and signing**
  Depends: T2, T4
  `signing.py` and `loom keys init|list|verify`. AC3.1–AC3.4. Property test: mutating any signed field breaks verification.
  Evidence:

- [ ] **T6 — F2 trail model**
  Depends: T3, T4
  `trail.py` and `loom trail begin|status`. Idempotent flow/trail creation; status table. AC2.1–AC2.2. If flow templates are supported (T0), use them; else expected lists come from `loom.toml`.
  Evidence:

- [ ] **T7 — F1 `loom attest` (without provenance rules)**
  Depends: T5, T6
  `attest.py` and the CLI. Envelope build, artefact fingerprint, signing, Kosli call via runner, outbox on failure, `--dry-run`, `--flush-outbox`. Provenance gate is called but only PR-stub passes for now. AC1.1, AC1.2, AC1.4, AC1.5. Golden dry-run fixtures for all nine types.
  Evidence:

- [ ] **T8 — F4 audit package**
  Depends: T7
  `audit/render.py`, `audit.html.j2`, `paper.css`, `loom audit`. Parse both trails, verify signatures, group by stage, control summary, timeline, unresolved list, `--json`. AC4.1–AC4.5. Include a FakeKosli fixture trail with 20 attestations.
  Evidence:

- [ ] **T9 — Demo script, phase 1 slice**
  Depends: T8
  `demo/run_demo.sh` covering PRD §10 steps 1–3, 6 (accepted only), 7. Green under FakeKosli in CI. Add the GitHub Actions example in `examples/github-actions/`.
  Evidence:

## Phase 2 — Second-line answers (P1)

- [ ] **T10 — F5 provenance rules**
  Depends: T7
  `provenance.py` with PR1–PR5, each with rationale string, pass and fail tests, exit code 3 and field-path reporting. Wire `loom.toml [provenance] disabled` with a warning log. AC5.1–AC5.3 and AC1.3. If attestation retrieval by name is unavailable (T0), implement the `--reviewer-of-actor` fallback and add a `Deviation:` line.
  Evidence:

- [ ] **T11 — F6 gate compiler**
  Depends: T10
  `gates/compile.py`, templates, `loom gates compile|verify`. Runner enforces the three stops and emits `gate` attestations with tool runs. Kosli policy output per T0 findings, or the `kosli assert` fallback with a `Deviation:` line. AC6.1–AC6.3. Example `gates.yaml` and a tiny example project the runner can execute.
  Evidence:

- [ ] **T12 — Demo script, phase 2 slice**
  Depends: T11
  Extend `run_demo.sh` with steps 4 and 5 (including the deliberate self-review rejection). Green in CI.
  Evidence:

## Phase 3 — Partnership features (P2)

- [ ] **T13 — F9 crosswalk skill**
  Depends: T7
  `crosswalk/loader.py`, `loom crosswalk lookup`, auto-fill in `loom attest`, `skills/loom-controls-crosswalk/` with `SKILL.md` and ten placeholder entries. AC9.1–AC9.3.
  Evidence:

- [ ] **T14 — F8 risk classifier**
  Depends: T7, T13
  `risk.py`, `rules/risk.yaml`, `loom risk classify [--attest]`. Twelve fixture specs with golden outputs; forcing-rule tests. AC8.1–AC8.3.
  Evidence:

- [ ] **T15 — F7 MCP server**
  Depends: T6, T8, T13
  Load the `mcp-builder` skill first. `mcp/server.py` with the six read-only tools, pagination, actionable errors, `uv run loom-mcp`. Write-verb grep test. Evaluation set per the skill. `examples/CLAUDE.md` snippet for a planning agent. AC7.1–AC7.4.
  Evidence:

- [ ] **T16 — Full demo and docs**
  Depends: T12, T14, T15
  `run_demo.sh` covers all eight steps. `README.md` quickstart (≤15 min on a clean machine, timed and recorded). `docs/threat-model.md`. Run the integration suite once against a real org if credentials are available and record it in `docs/integration-run.md`; otherwise state that it has not been run.
  Evidence:

- [ ] **T17 — Definition of done check**
  Depends: T16
  Walk PRD §13 line by line. Secrets grep, taxonomy grep, all ACs green, all boxes above ticked with evidence. Tag `v0.1.0`.
  Evidence:
