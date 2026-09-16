> **Kept for reference — not the source of truth.** Superseded on 16 September 2026 by `plugins/middleleap-loom/skills/loom/references/kosli-seam.md` §4b–§4d and the harness code it names; `README.md` in this folder reconciles every feature below against what shipped.

# PRD — Loom × Kosli integration (`loom-kosli`)

**Status:** Approved for build · **Owner:** Michael Hartmann, MiddleLeap · **Version:** 1.0 · **Date:** 2026-09-12
**Execution target:** Claude Code. Read `CLAUDE.md` first, then work `TASKS.md` top to bottom. Do not start a task whose dependencies are not marked done.

---

## 0. How to run this PRD in Claude Code

```
mkdir loom-kosli && cd loom-kosli
# copy PRD.md, CLAUDE.md, TASKS.md into the folder
claude
> Read CLAUDE.md, then PRD.md, then TASKS.md. Verify the Kosli CLI surface (Task 0) before writing any code. Then execute TASKS.md in order, one task per commit, updating the checkbox and the "Evidence" line under each task as you go.
```

Everything below is written so that it can be built without asking the author. Where a fact about Kosli's CLI or policy format cannot be known in advance, the PRD says so and gives a verification step and a fallback. Choose the verified path; never guess a flag.

---

## 1. Problem

Kosli records what happened to software from the first commit onward: builds, tests, scans, approvals, deployments, runtime state. Its chain of custody starts at the pipeline. Everything before that — the business intent, the requirement, the risk decision, the design rationale, who (or which agent) decided what — is not in the record, and it is exactly what an auditor asks for first.

The Loom is MiddleLeap's way of working for regulated institutions building software with AI agents: two harnesses (discovery, delivery), always-on controls (the warp), agents (the shuttle), institutional context (the pattern), shipped software with evidence attached (the cloth). Today the Loom's upstream gates produce documents and decisions, but not signed evidence that lands anywhere an auditor can query.

`loom-kosli` closes that seam. It makes the Loom's gates emit signed, attributed, provenance-checked attestations into Kosli, lets Loom agents read Kosli's record of what is live before they plan, and renders an audit package that starts at the requirement rather than the commit.

The FINOS SDLC controls catalogue (Deutsche Bank, Morgan Stanley, Kosli) reaches upstream to requirements via draft mitigations `mi-4` (requirements repository) and `mi-20` (requirements approval for release), but neither has an implementation pattern. This is that pattern.

## 2. Goals

| # | Goal | Measure |
|---|------|---------|
| G1 | Every Loom gate produces a Kosli attestation with a signed actor record | 100% of gates in a demo pass appear on one Kosli trail |
| G2 | No attestation can be created without machine provenance | Provenance gate rejects narrated or self-attested evidence in tests |
| G3 | One trail per spec shows intent → release, queryable in Kosli's own UI | Trail for demo spec `SPEC-2026-001` renders end to end |
| G4 | An audit package can be rendered from a trail in under 10 seconds | `loom audit SPEC-2026-001` produces `audit/SPEC-2026-001.html` |
| G5 | Loom agents can read Kosli state before planning | MCP server exposes trail, snapshot and Answers tools; used in demo |
| G6 | Gate definitions compile from one source to both enforcement points | `loom gates compile` produces a runner and a Kosli policy from one YAML |
| G7 | Every attestation can carry both institution control IDs and FINOS draft IDs | Crosswalk loaded and applied in demo |

## 3. Non-goals (do not build)

- **No evidence store.** `loom-kosli` never persists attestations, trails, snapshots or evidence locally beyond a transient outbox. Kosli is the record. Building even a thin store signals competition.
- **No dashboards, no environment monitoring, no runtime drift detection.** All Kosli.
- **No LLM-based classification.** The risk classifier is deterministic rules. Determinism is the point.
- **No opinionated CI integration beyond a GitHub Actions example.** The CLI is the contract; pipelines call it.
- **No web UI.** The audit package is a static HTML file.
- **No key management service.** Ed25519 keys live in a local keystore with a documented path to a KMS later.

## 4. Locked decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Language | Python 3.12, `uv` for env, `typer` for CLI, `pydantic` v2 for schemas, `pytest` | Matches the existing `ai-dlc-toolkit` stack; schema-first fits pydantic |
| Kosli access | Shell out to the official `kosli` CLI binary. Never re-implement the API. | Kosli's CLI is the supported surface for attestations; keeps auth and fingerprinting theirs |
| Signing | Ed25519 via `cryptography`; keys per actor in `~/.loom/keys/`; key ID = sha256 of public key, first 16 hex | Small, fast, no dependencies on a PKI that does not exist yet |
| Identifier scheme | Spec ID `SPEC-YYYY-NNN`; Kosli trail name = spec ID; flows `loom-discovery`, `loom-delivery` | One trail is one spec's whole journey |
| Attestation transport | `kosli attest generic` with `--user-data <json>` for payload and `--attachments` for artefacts; fingerprint by sha256 | Generic attestations are the extension point Kosli provides |
| Gate source of truth | `gates.yaml` in the repo; compiled artefacts are generated, never hand-edited | One definition, two enforcement points |
| Output rendering | Jinja2 → single-file HTML, MiddleLeap paper theme, no external assets except Google Fonts | Sendable, printable, self-contained |
| MCP server | Python, FastMCP, stdio transport; read-only tools only | Least privilege; agents read Kosli, they do not write through this server |
| Config | `loom.toml` at repo root plus env vars `KOSLI_ORG`, `KOSLI_API_TOKEN`, `LOOM_ACTOR_ID` | Standard 12-factor shape |
| Test doubles | `FakeKosli`: a recording/replaying fake for the `kosli` binary, used in CI; integration tests run only when `KOSLI_API_TOKEN` is set | Unit tests must pass without a Kosli org |

## 5. Architecture

```
                    ┌─────────────────────────────────────────────┐
  gates.yaml ──────►│ F6 gate compiler ──► runner.py + kosli-policy│
                    └─────────────────────────────────────────────┘
                                          │ enforces
  Loom harness ─── loom attest <type> ────┼──► F5 provenance gate ──► F1 adapter ──► kosli attest generic
   (discovery/      (F3 actor record        │        rejects                             │
    delivery)        signed, F9 controls)   │                                             ▼
                                            │                                       Kosli trail (F2)
  Loom agents ◄── F7 MCP server (read) ◄────┴───────────────────────────────────────────┘
                                                                                          │
  spec.md ─── F8 risk classifier ─── loom attest risk-class ──────────────────────────────┤
                                                                                          ▼
                                                                    loom audit <spec> ─── F4 audit package
```

Data flows one way into Kosli (F1) and one way out (F7, F4). Nothing is stored in between except a transient outbox for retries.

## 6. Repository layout

```
loom-kosli/
  PRD.md  CLAUDE.md  TASKS.md  README.md  LICENSE
  pyproject.toml  uv.lock  loom.toml.example
  src/loom_kosli/
    __init__.py
    cli.py                 # typer app: loom attest|trail|gates|audit|risk|keys|crosswalk|doctor
    config.py              # loom.toml + env
    kosli/
      runner.py            # subprocess wrapper around the kosli binary, one method per verb used
      fake.py              # FakeKosli record/replay
    schemas/
      actor.py             # ActorRecord
      provenance.py        # ToolRun, Provenance
      attestation.py       # LoomAttestation envelope + per-type payloads
      gates.py             # gates.yaml model
      risk.py              # RiskInput, RiskClass
      crosswalk.py         # Crosswalk entries
    signing.py             # Ed25519 keystore, sign, verify
    attest.py              # F1: build envelope → provenance gate → kosli attest
    trail.py               # F2: ensure flows, begin trail, naming
    provenance.py          # F5: rules
    gates/
      compile.py           # F6: gates.yaml → runner + policy
      runner_template.py.j2
      kosli_policy_template.j2
    risk.py                # F8
    crosswalk/
      loader.py            # F9
    audit/
      render.py            # F4: kosli get trail → HTML
      templates/audit.html.j2
      static/paper.css
    mcp/
      server.py            # F7: FastMCP read-only server
  skills/
    loom-controls-crosswalk/     # F9 as a Claude skill
      SKILL.md
      crosswalk.yaml
  examples/
    gates.yaml
    spec/SPEC-2026-001.md
    github-actions/loom-attest.yml
  tests/
    unit/...  integration/...  golden/...
  demo/
    run_demo.sh            # the end-to-end demo in §10
```

## 7. Personas and user stories

- **Engineering lead (Loom operator).** "I want every gate in a Loom pass to land in Kosli without me writing glue, so the pipeline and the upstream work share one trail."
- **Head of risk / second line.** "I want proof that an agent cannot attest to its own work or invent a test result, so I can accept agentic delivery."
- **Internal auditor.** "I want one page per change that starts at the requirement and names who decided each step, so the audit is a query, not a project."
- **Loom agent (planning).** "I want to know what is live, what drifted and which controls failed last time before I write a plan."
- **Kosli (partner).** "I want the Loom to write and read Kosli natively, mapped to the FINOS draft catalogue, so it extends our chain of custody rather than duplicating it."

## 8. Features

Each feature lists: purpose, interface, data contract, behaviour, acceptance criteria (AC), tests. Priority P0 = demo-critical, P1 = second-line answer, P2 = partnership.

---

### F1 — `loom attest`: the Kosli adapter (P0)

**Purpose.** One command that turns a Loom gate event into a Kosli generic attestation with a signed actor record, provenance, control IDs and artefact fingerprint.

**Interface.**
```
loom attest <type> --spec SPEC-2026-001 [--artifact <path>] [--payload <json-file>] \
            [--control CB-CPS-3.4 ...] [--finos mi-4 ...] [--attach <path> ...] \
            [--tool-run <json-file>] [--reviewer-of <attestation-id>] [--dry-run]
```
`<type>` ∈ `intent | problem-selected | spec-locked | risk-tagged | design-decision | review | accepted | risk-class | gate`. For `gate`, `--name <gate-name>` is required.

**Data contract — `LoomAttestation` envelope (JSON, passed via `--user-data`).**
```json
{
  "loom_version": "0.1.0",
  "schema": "loom.attestation/1",
  "type": "spec-locked",
  "spec_id": "SPEC-2026-001",
  "stage": "discovery",
  "created_at": "2026-09-12T08:00:00Z",
  "actor": { "...ActorRecord (F3)..." },
  "provenance": { "...Provenance (F5)..." },
  "controls": { "institution": ["CB-CPS-3.4"], "finos": ["mi-4"] },
  "payload": { "... per-type object ..." },
  "artifact": { "path": "spec/SPEC-2026-001.md", "sha256": "..." },
  "signature": { "alg": "ed25519", "key_id": "...", "sig": "base64", "signed_fields": ["type","spec_id","created_at","actor","provenance","controls","payload","artifact"] }
}
```
Per-type payloads (all pydantic models in `schemas/attestation.py`):

- `intent`: `{ "statement": str, "source": str, "sponsor": str }`
- `problem-selected`: `{ "candidates": [ {id, title, evidence_ref} ], "selected": id, "rationale": str }`
- `spec-locked`: `{ "spec_sha256": str, "requirement_ids": [str], "locked_by": actor_id }`
- `risk-tagged`: `{ "tags": [ {control_id, risk_id, severity} ], "taxonomy": str, "reviewer": actor_id }`
- `design-decision`: `{ "decision_id": str, "title": str, "options": [str], "chosen": str, "consequences": str }`
- `review`: `{ "reviewed_attestation": str, "verdict": "pass|fail", "findings": [str] }`
- `accepted`: `{ "increment_ref": str, "evidence_refs": [str] }`
- `risk-class`: `{ "class": "low|standard|high", "score": int, "inputs": {…}, "rules_version": str }` (produced by F8)
- `gate`: `{ "name": str, "result": "pass|fail", "tool_run": ToolRun }`

**Behaviour.**

1. Load config; resolve actor from `LOOM_ACTOR_ID` (F3).
2. Build envelope; compute artefact sha256 if `--artifact` given.
3. Run provenance gate (F5). On rejection: exit code 3, print the failed rule, write nothing.
4. Sign envelope (F3 keystore).
5. Ensure flow and trail exist (F2).
6. Invoke `kosli attest generic` with `--flow`, `--trail`, `--name <type>[-<n>]`, `--user-data envelope.json`, `--attachments` for `--attach` paths, fingerprint flags for the artefact. `--dry-run` prints the exact command and envelope and exits 0.
7. On Kosli failure: write envelope to `.loom/outbox/<uuid>.json`, exit 4. `loom attest --flush-outbox` retries.

**AC.**

- AC1.1 Every type above validates against its pydantic model; invalid payload → exit 2 with field errors.
- AC1.2 `--dry-run` output is byte-stable for the same inputs (golden test).
- AC1.3 A rejected provenance check never reaches the Kosli runner (assert via FakeKosli call log).
- AC1.4 Envelope signature verifies with the actor's public key after a round trip through JSON.
- AC1.5 Attestation name in Kosli is `<type>` for singletons and `<type>-<ordinal>` for repeatable types (`design-decision`, `review`, `gate`).

**Tests.** Unit per type; golden for dry-run; FakeKosli call-log assertions; property test that any mutation of a signed field breaks verification.

---

### F2 — Trail model (P0)

**Purpose.** One Kosli trail per spec, two flows per harness, so a spec's whole journey renders in Kosli's existing UI.

**Interface.**
```
loom trail begin --spec SPEC-2026-001 [--flow loom-discovery|loom-delivery]
loom trail status --spec SPEC-2026-001
```

**Behaviour.**

- Flows: `loom-discovery` and `loom-delivery`, created idempotently with a template listing the expected attestation names per stage (Kosli flow templates, if available — verify in Task 0; otherwise create plain flows).
- Trail name = spec ID in both flows. `loom-delivery` trail carries a `--user-data` link back to the discovery trail (`{"discovery_trail": "SPEC-2026-001"}`).
- `loom trail status` calls `kosli get trail` for both flows and prints a table of expected vs present attestations.

**AC.**

- AC2.1 Running `begin` twice is a no-op (idempotent), asserted against FakeKosli.
- AC2.2 `status` shows `missing` for absent expected attestations and `present` with the actor ID for those found.

---

### F3 — Actor record and signing (P0)

**Purpose.** Every artefact records who produced it — human, or which agent on which model and harness version, with which permissions — and which human accepted it. This is the accountability answer.

**Data contract — `ActorRecord`.**
```json
{
  "actor_kind": "human | agent",
  "actor_id": "michael@middleleap.com | agent:loom-builder-01",
  "display_name": "…",
  "model": { "provider": "anthropic", "name": "claude-…", "version": "…" },   // agents only, required
  "harness": { "name": "loom", "version": "0.1.0", "stage": "discovery|delivery", "role": "builder|reviewer|planner|risk" },
  "tool_permissions": ["fs:read", "fs:write", "git:commit", "shell:pytest"],
  "session_id": "…",
  "accepted_by": { "actor_id": "…", "at": "ISO-8601" },   // optional, humans only
  "key_id": "…"
}
```

**Interface.**
```
loom keys init --actor <id> --kind human|agent [--model provider/name@version]
loom keys list
loom keys verify <envelope.json>
```
Actor definitions live in `loom.toml` under `[actors.<id>]`; private keys in `~/.loom/keys/<key_id>.pem` (mode 0600), public keys committed to `keys/<key_id>.pub` in the repo so verification works without the private side.

**AC.**

- AC3.1 An agent actor without `model` fails validation.
- AC3.2 `accepted_by` may only reference a `human` actor; validator loads `loom.toml` to check.
- AC3.3 `loom keys verify` returns exit 0 on valid, 5 on tampered, and prints which field changed.
- AC3.4 Signature covers exactly `signed_fields` and nothing else; adding a non-signed field does not invalidate.

---

### F4 — Audit package from the requirement (P0)

**Purpose.** One page per spec: requirement → controls → decisions → gates → release, with the actor for each. The demo's last slide.

**Interface.** `loom audit <spec-id> [--out audit/<spec-id>.html] [--json]`

**Behaviour.**

1. `kosli get trail <spec> --flow loom-discovery --output json` and the same for `loom-delivery`.
2. Parse every attestation's `user_data` as a `LoomAttestation`; verify signature; mark `verified: true|false`.
3. Order by `created_at`; group by stage.
4. Render `audit.html.j2`: header (spec ID, title from `intent`, sponsor, dates), a control summary table (institution ID · FINOS ID · which attestations satisfied it), a timeline with one row per attestation (time · type · actor · provenance tool run · verified · Kosli link), and an unresolved list (expected attestations missing).
5. `--json` emits the same structure as JSON for machine consumers.

**AC.**

- AC4.1 Renders in <10 s for a trail with ≤50 attestations (FakeKosli fixture).
- AC4.2 Any unverifiable signature is visibly flagged; the page never silently trusts.
- AC4.3 Output is a single HTML file with no local asset references; opens from `file://`.
- AC4.4 Print stylesheet produces a clean PDF (manual check recorded in the task's Evidence line).
- AC4.5 Brand: MiddleLeap paper theme, `Instrument Serif` / `DM Sans` / `JetBrains Mono`, 0px radius, ember used only on the "decision" rows.

---

### F5 — Provenance gate (P1)

**Purpose.** Make fabricated evidence impossible by construction: evidence must come from a real tool run, an agent never attests its own work, and narrated results are rejected.

**Data contract — `Provenance`.**
```json
{
  "tool_run": { "tool": "pytest", "run_id": "…", "started": "ISO", "ended": "ISO", "exit_code": 0, "log_sha256": "…", "log_ref": "attachments/pytest.log" },
  "narrated": false,
  "observed_by": "actor_id"
}
```

**Rules (each a named function in `provenance.py`, each with a one-line rationale string surfaced on failure).**

- `PR1 tool_run_required`: types `gate`, `review`, `accepted`, `risk-tagged` must carry a `tool_run` with a non-empty `run_id` and `log_sha256`; the referenced log must be among `--attach` paths and its sha256 must match.
- `PR2 no_self_attestation`: a `review` whose `actor.actor_id` equals the `actor.actor_id` of `reviewed_attestation` is rejected. Requires fetching the reviewed attestation (`kosli get attestation` — verify verb in Task 0; fallback: pass `--reviewer-of-actor <id>` explicitly and record it in the envelope).
- `PR3 not_narrated`: `narrated: true` is rejected for all types except `intent` and `design-decision`, and even there the attestation is labelled `narrated` in the audit package.
- `PR4 human_acceptance`: `accepted` and `problem-selected` and `spec-locked` require `actor.actor_kind == "human"` **or** an agent actor with `accepted_by` set to a human.
- `PR5 timestamp_sanity`: `tool_run.ended` ≤ `created_at` and both within 24 h.

**AC.**

- AC5.1 Each rule has a passing and a failing unit test.
- AC5.2 Failure output names the rule ID, the rationale, and the offending field path.
- AC5.3 Rules are enabled by default; `loom.toml [provenance] disabled = ["PR5"]` is honoured and logged as a warning on every run.

---

### F6 — Gate compiler (P1)

**Purpose.** One `gates.yaml` compiles to the in-flight Loom runner and to a Kosli policy, so a control is defined once and enforced twice.

**Data contract — `gates.yaml`.**
```yaml
version: 1
gates:
  - name: unit
    stage: delivery
    tool: pytest
    command: "uv run pytest -q --junitxml=reports/unit.xml"
    evidence: reports/unit.xml
    required: true
    finos: [mi-14]
    institution: [CB-CPS-5.1]
  - name: sbom
    stage: delivery
    tool: syft
    command: "syft . -o cyclonedx-json > reports/sbom.json"
    evidence: reports/sbom.json
    required: true
    finos: [mi-3]
  - name: schema-diff
    stage: delivery
    tool: custom
    command: "scripts/schema_diff.sh"
    required: true
    blocking_on: [breaking_change]
stops:
  max_iterations: 8
  no_progress_window: 3
  cost_ceiling_usd: 25
```

**Interface.** `loom gates compile [--out build/gates/]` → `runner.py` (executable; runs each gate's command, captures logs, computes `log_sha256`, emits `loom attest gate --name <gate> --tool-run …` per gate, enforces the three stops) and `kosli-policy.yaml` (see verification note).

**Kosli policy output — verification required (Task 0).** Kosli supports policy definitions for compliance; the exact format must be read from `https://docs.kosli.com` at build time. Compile to that format. If the current format cannot express "attestation `<name>` present and `result == pass`", fall back to generating a `kosli assert` script that checks each required gate attestation exists on the trail and exits non-zero otherwise. Record which path was taken in `TASKS.md`.

**AC.**

- AC6.1 Compiling the example produces a runner that, under FakeKosli, emits exactly one `gate` attestation per gate with `result` matching the command exit code.
- AC6.2 The runner halts on `max_iterations`, `no_progress_window` (no new evidence files changed across N runs), and `cost_ceiling_usd` (read from an env-provided meter; stubbed in tests), and emits a `gate` attestation named `stop-<reason>` with `result: fail`.
- AC6.3 Generated artefacts carry a header `# generated by loom gates compile — do not edit` and a sha256 of the source `gates.yaml`; `loom gates verify` fails if the source changed since compile.

---

### F7 — Kosli MCP server, read side (P2)

**Purpose.** Loom agents read Kosli's record — what is live, what drifted, which control failed last, and Kosli Answers — before they plan. Read-only by design.

**Build note.** Load the `mcp-builder` skill before starting this feature. Follow its evaluation guidance and produce the evaluation set it asks for.

**Tools (FastMCP, stdio).**

- `kosli_get_trail(spec_id, flow)` → attestations with `type`, `actor`, `created_at`, `verified`, `controls`.
- `kosli_trail_gaps(spec_id)` → expected-but-missing attestations per stage (reuses F2 status logic).
- `kosli_environment_snapshot(env_name)` → artefacts currently running, with their trail/spec IDs where known.
- `kosli_last_failures(spec_id | control_id, limit=10)` → most recent failed `gate`/`review` attestations and their findings.
- `kosli_answers(question)` → passthrough to Kosli Answers if an API exists (verify in Task 0; if not, return a structured "not available" with the query the agent should run instead).
- `loom_crosswalk(control_id)` → F9 lookup.

Every tool: concise description, pagination where lists can exceed 50 items, actionable error text.

**AC.**

- AC7.1 Server starts with `uv run loom-mcp` and lists the six tools.
- AC7.2 No tool performs a write; a test greps the server module for `attest`, `begin trail`, `create` verbs and fails if any are present.
- AC7.3 The evaluation set from the mcp-builder skill passes for `kosli_get_trail` and `kosli_trail_gaps` under FakeKosli.
- AC7.4 A `CLAUDE.md` snippet in `examples/` shows how a Loom planning agent is instructed to call `kosli_trail_gaps` and `kosli_last_failures` before drafting a plan.

---

### F8 — Change-risk classifier (P2)

**Purpose.** A deterministic upstream risk class for each spec, emitted as an attestation the Kosli release policy can read. What actually removes the CAB from the standard path.

**Interface.** `loom risk classify --spec spec/SPEC-2026-001.md [--rules rules/risk.yaml]` → prints class and score; `--attest` also runs `loom attest risk-class`.

**Inputs.** Read from the spec's YAML front-matter (schema in `schemas/risk.py`):
```yaml
blast_radius: [payments, consent]      # named domains
data_classification: confidential      # public|internal|confidential|restricted
control_surface: [CB-CPS-3.4, CB-PDPL-7]
novelty: extend                        # fix|extend|new
external_interfaces: [nebras, oidf]
customer_facing: true
```

**Rules (`rules/risk.yaml`, versioned).** Additive integer weights per input value; thresholds map score → `low | standard | high`; any `restricted` data or any `external_interfaces` containing a certification path forces `high`. Ship a default rules file and document how an institution replaces it.

**AC.**

- AC8.1 Same input → same output (golden tests over 12 fixture specs).
- AC8.2 Forcing rules override the score; test each.
- AC8.3 The `risk-class` attestation payload includes the `rules_version` and the full `inputs`, so the classification is auditable.

---

### F9 — Control crosswalk skill (P2)

**Purpose.** A machine-readable mapping from the institution's control IDs (CBUAE CPS, PDPL, MMS, BCBS 239, CPS-AI) to FINOS draft mitigation IDs, shipped as a Claude skill so every attestation can carry both.

**Data contract — `crosswalk.yaml`.**
```yaml
version: 2026-09
finos_catalogue_ref: "finos-labs/SDLC-Controls-Framework readiness report 2026-06-20"
entries:
  - institution_id: CB-CPS-3.4
    title: "Change management evidence"
    finos: [mi-19, mi-20]
    notes: "Draft identifiers; will move."
  - institution_id: CB-PDPL-7
    title: "Personal data in non-production"
    finos: []
    notes: "No catalogue equivalent."
```
**Note.** The real institution taxonomy (77 controls, 45 risks) is not in this repo and must not be committed. Ship 10 illustrative entries with obviously placeholder institution IDs and a loader that accepts a private file path from `loom.toml [crosswalk] path`.

**Interface.** `loom crosswalk lookup <institution-id>`; `loom attest … --control <id>` auto-fills `controls.finos` from the crosswalk unless `--finos` is passed explicitly.

**AC.**

- AC9.1 Lookup of an unknown ID returns exit 6 with the nearest three IDs by prefix.
- AC9.2 Auto-fill is logged in the envelope as `"controls_source": "crosswalk:<version>"`.
- AC9.3 `skills/loom-controls-crosswalk/SKILL.md` follows the skill format used elsewhere in MiddleLeap's skills (front-matter `name`, `description`; body explains when to apply the crosswalk and the "draft IDs will move" caveat).

## 9. Cross-cutting requirements

- **Verify Kosli first (Task 0).** Before any code, run `kosli --help` and read the docs for: `create flow`, `begin trail`, `attest generic`, `get trail`, `get snapshot`, attestation retrieval, policy format, Answers API. Record the verified verbs and flags in `docs/kosli-surface.md`. Every runner method cites the doc URL it was verified against.
- **Exit codes.** 0 ok · 2 validation · 3 provenance rejected · 4 Kosli call failed (queued) · 5 signature invalid · 6 lookup miss.
- **Logging.** Structured JSON to stderr; never log private keys, tokens, or full envelopes at INFO.
- **Secrets.** `KOSLI_API_TOKEN` only from env; `loom doctor` checks presence without printing it.
- **Offline behaviour.** All commands except the Kosli call itself work offline; `--dry-run` everywhere.
- **Idempotency.** Re-running any `loom attest` with identical inputs produces an identical envelope; Kosli decides whether to accept duplicates.
- **Docs.** `README.md` with a 5-minute quickstart; `docs/kosli-surface.md`; `docs/threat-model.md` (what the provenance gate does and does not prevent — it does not prevent a compromised tool from lying; it prevents an agent from skipping the tool).

## 10. The demo (must pass end to end, `demo/run_demo.sh`)

Against FakeKosli in CI and against a real org when `KOSLI_API_TOKEN` is set:

1. `loom keys init` for `michael@middleleap.com` (human) and `agent:loom-builder-01`, `agent:loom-reviewer-01` (agents).
2. `loom trail begin --spec SPEC-2026-001`.
3. `loom attest intent` (human) → `problem-selected` (human) → `risk-tagged` (agent `risk` role, with tool run from `loom risk classify`) → `spec-locked` (human).
4. `loom gates compile` → run the runner on the example project → three `gate` attestations.
5. `loom attest review` by the reviewer agent referencing the builder's attestation → passes PR2. Then a deliberate self-review by the builder → rejected with `PR2`, exit 3.
6. `loom attest accepted` (human) → `loom risk classify --attest` → `risk-class: standard`.
7. `loom audit SPEC-2026-001` → `audit/SPEC-2026-001.html` opens, every row `verified`, one row labelled `narrated` (the intent).
8. `loom-mcp` started; a scripted client calls `kosli_trail_gaps` and gets an empty list.

The demo script's success is the definition of "done" for P0 + P1.

## 11. Delivery phases

| Phase | Features | Exit criterion |
|-------|----------|----------------|
| 0 | Task 0 verification, scaffold, FakeKosli, schemas | `uv run pytest` green with zero features |
| 1 | F3, F1, F2, F4 | Demo steps 1–3, 6 (accepted), 7 pass |
| 2 | F5, F6 | Demo steps 4, 5 pass |
| 3 | F7, F8, F9 | Demo step 8 passes; full script green |

## 12. Open questions and how to resolve them without the author

| Q | Resolution path |
|---|-----------------|
| Exact `kosli attest generic` flags for user data and attachments | Task 0; read `docs.kosli.com` CLI reference; record in `docs/kosli-surface.md` |
| Does Kosli expose attestation retrieval by name for PR2? | Task 0; if not, use the explicit `--reviewer-of-actor` fallback and note it |
| Current Kosli policy format | Task 0; compile to it; else fall back to `kosli assert` script (F6) |
| Kosli Answers API availability | Task 0; else `kosli_answers` returns structured "not available" |
| Flow templates | Task 0; if supported, use them for expected-attestation lists; else keep the list in `loom.toml` |

## 13. Definition of done

- All ACs pass in CI under FakeKosli; integration suite passes against a real org at least once, with the run recorded in `docs/integration-run.md`.
- `demo/run_demo.sh` green.
- `README.md` quickstart reproduces the demo in under 15 minutes on a clean machine.
- No file in the repo contains a real institution control taxonomy, a private key, or a token.
- `TASKS.md` has every checkbox ticked with an Evidence line.
