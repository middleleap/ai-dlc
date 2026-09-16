# The Kosli CLI surface the harness relies on

> Task 0 of hardening-plan phase 2 (PRD loom-kosli v1.2 §9). **Every method in
> `core/providers/kosli.mjs` cites a row of this document, and this document cites the
> reference it was verified against.** When the CLI moves, this file moves first, then the
> adapter, then the tests — never the other way round.

## Provenance of this verification

| | |
|---|---|
| Verified against | `kosli-dev/cli` at commit `96e69c68596147be8b0bd54c37336ba2e9f48530` (2026-09-11), the commit after tag `v2.40.1` |
| How | The docs site (`docs.kosli.com`) is egress-blocked from the build environment, so the CLI was **built from that commit** (Go 1.26) and every command's `--help` was captured; the JSON shapes come from the CLI's own test fixtures (`cmd/kosli/getTrail_markdown_test.go`, `cmd/kosli/getAttestation.go`) |
| Verified on | 13 September 2026 |
| Not verified | Anything marked **unconfirmed** below. Nothing here was run against a Kosli org; that is the integration run (`docs/integration-run.md`, to be written after the first run with a token) |

## Global flags (every command)

`--api-token` (or `KOSLI_API_TOKEN`) · `--org` (or `KOSLI_ORG`) · `--host` (default
`https://app.kosli.com`) · `--http-proxy` · `--config-file` (read from the given path or the
default only, never implicitly from the working directory) · `--debug` · `--max-api-retries`
(default 3) · `--quiet`. Any flag can be given as `KOSLI_<FLAG>` in the environment.

The adapter never passes `--api-token` on argv: a token on argv is visible in process listings.
It stays in `KOSLI_API_TOKEN`, which the CLI reads itself (PRD §9, secrets).

## Commands the adapter uses

| Adapter method | Command | Verified flags | Prints |
|---|---|---|---|
| `beginTrail` | `kosli begin trail TRAIL --flow FLOW` | `--description`, `--template-file <yml>`, `--user-data <json ≤1MB>`, `--commit` (defaults to HEAD, or to the CI variable), `--external-url label=url`, `--external-fingerprint label=sha256`, `--dry-run` | prose. **Begin is create-or-update**: the help text says "begin or update", so calling it twice for the same trail is idempotent (F2 AC) |
| `post` | `kosli attest generic --name NAME --flow FLOW --trail TRAIL` | `--user-data <json ≤1MB>` (the signed envelope travels here), `--attachments <paths>` (files or directories, compressed into the evidence vault), `--annotate k=v` (repeatable), `--compliant=true\|false` (default true), `--description`, `--commit`, `--external-url` / `--external-fingerprint`, `--origin-url`, `--dry-run` (exit 0, nothing sent), `--fingerprint` or `--artifact-type` + path (artifact-level; the harness posts trail-level only) | one prose line: `generic attestation 'NAME' is reported to trail: TRAIL`. **No id is printed** — the id comes from `get trail` (next row) |
| `resolve` / `trailStatus` | `kosli get trail TRAIL --flow FLOW --output json` | `--output table\|json\|markdown` | `{ name, description, compliance_state, compliance_status: { status, is_compliant, attestations_statuses: [ { attestation_name, attestation_type, attestation_id, overridden_attestation_id, status, is_compliant, unexpected } ], artifacts_statuses: { <artifact>: { …, attestations_statuses: […] } } }, events: [ { type, timestamp } ] }`. `status` is `MISSING` or `COMPLETE` (fixture values); a template entry with no attestation yet has `attestation_id: null`. **This is the retrieval-by-name path (question 4): the trail lists every attestation by name with its id, so the harness reads the id it needs from here rather than from a per-attestation call** |
| `resolve` (by id) | `kosli get attestation --attestation-id ID --output json` | `ATTESTATION-NAME --flow F --trail T` (by name), or `--attestation-id` alone, or `--fingerprint` (artifact-level); the three are mutually exclusive | JSON with `attestation_name`, `attestation_type`, `is_compliant`, `created_at` (epoch seconds), `html_url`, optional `artifact_fingerprint`, `git_commit_info` |
| `evaluate` (row 2.9, later) | `kosli evaluate trail TRAIL --flow FLOW --policy file.rego\|url` | `--params '{…}'` or `@file`, `--attestations a,b` (limit scope), `--output json`, `--show-input`, `--assert` (default; non-zero on deny) / `--no-assert` | the policy verdict; input is `input.trail`. Marked **beta** in the help |

Not used by this phase but verified to exist, for rows 2.9–2.11: `create flow NAME
--template-file yml | --use-empty-template`; `create attestation-type NAME --schema file
--jq rule --summary NAME=expr` (**create-or-update**; versioning of a type is
**unconfirmed** — the help says policies get versions on update, it says nothing about types,
which is question 6); `attest custom --type TYPE --attestation-data file.json`; `attest decision
--control ID --compliant=…` (beta); `attest override` (a manual override with a reason);
`create policy NAME FILE --type env` + `attach-policy NAME --environment E`; `get snapshot
ENV[#N|~N|@{…}] --output json`; `create environment --type k8s|ecs|s3|lambda|docker|azure-apps|server|logical`;
`create control ID --name` (beta); `evaluate trails`, `evaluate input --input-file`.

## What the seven questions come to, on the CLI evidence alone

| # | Question | Settled by the CLI? |
|---|---|---|
| 1 | Residency of the trail and the evidence vault | **No** — a commercial and deployment question for the 18 September call; the CLI only has `--host` |
| 2 | Can an approval be refused when the approver is an agent identity | **No** — Kosli sees an actor as a token. The refusal is the Loom's provenance gate (PR4, `core/provenance.mjs`), which reads the signed actor record before anything is posted; Kosli then records what the gate let through |
| 3 | Can an attestation carry and verify the CI runner's OIDC token | **The Loom's half: yes, since 2.4.7** — the gate runner attaches the job's OIDC token (audience `loom-record`) to the runner record inside `--user-data`, verifies it against GitHub's published keys before posting (signature, issuer, audience, expiry, and subject/repository/ref/sha against the claims; `core/runner-identity.mjs`), and the join re-verifies it while the key is published. What is still for the call: whether Kosli verifies the token natively, so the row is VERIFIED by the record and not only by the Loom |
| 4 | Retrieval by name on a trail | **Yes** — `get trail --output json` lists `attestations_statuses[].attestation_name` with `attestation_id`; `get attestation NAME --flow --trail` also resolves by name |
| 5 | Policy surface | **Both exist** — `evaluate trail --policy file.rego` (Rego over `input.trail`, beta) for trails; `create policy --type env` + `attach-policy` for environments. Row 2.9 compiles the route policy provider-neutrally and renders Rego |
| 6 | Custom attestation-type versioning | **Unconfirmed** — `create attestation-type` is create-or-update; no version field is documented for types |
| 7 | Answers API, or UI only | **Not in the CLI** — no `answers` command exists at this commit; the product surface is the app and the API (`app.kosli.com/api/v2/doc`). `record_answers` in the read-only server (row 2.11) stays `not-mounted` until a token-authenticated integration run proves the API path |

## Exit codes

The CLI exits 0 on success and non-zero on any error (network, auth, validation); `--dry-run`
exits 0 regardless. The harness maps a non-zero exit to its own code 4 (call failed, envelope
queued to `.loom/record-outbox/`) — see `core/external-record.mjs`.
