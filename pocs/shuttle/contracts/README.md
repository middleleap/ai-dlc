# Shuttle local contracts and fixtures

Release: **shuttle-public-v0.1**, 25 October 2026. Scope: one fictional Bank Alpha LFI/data-provider readiness case and one pack type. These contracts are provisional lab inputs, not an accepted bank data model or control policy.

`proposal.schema.json` describes the closed wire envelope for `PackDraft` and `InspectionComment`. `case.schema.json` fixes the current synthetic case shape. Both use JSON Schema draft 2020-12. The schema IDs use a reserved `.example` domain and do not require a remote service.

## Wire rules

- IDs are non-nil, lowercase canonical UUID strings. A request key remains stable on retry. Client-supplied actor, owner, approval, gate, event or arbitrary extra fields are rejected.
- Content revisions are integers from 1 through **2,147,483,647**, matching the proposed Dataverse Whole Number representation. Use JSON integer notation (`1`); decimal or exponent spellings (`1.0`, `1e0`) and booleans are rejected. This supplementary wire rule is stricter than JSON Schema's mathematical `integer` semantics and matches the strict C# integer reader. RowVersion/concurrency is a distinct server-side concern.
- `PackDraft` has a template release, skill release and 1–12 sections. Keys are unique ASCII identifiers; each section has a title, text and source IDs, with an optional owed owner. Each section must be sourced or explicitly owed.
- Sources use register IDs such as `S01`; the schema validates their syntax and the local semantic checker validates membership in the case's current fixture register. A syntactically valid citation is not evidence that its text supports a claim.
- `InspectionComment` carries the exact artifact ID/hash and 1–2,000 Unicode scalar characters of plain text. Its optional related-comment ID is omitted when absent, never null. Angle brackets remain literal text; UI escaping is still required.
- Required human-readable text cannot be whitespace-only. Supplementary validation rejects invalid Unicode surrogates and Unicode control characters except tab, carriage return and newline. Machine identifier patterns use a strict end boundary, so a final newline is not silently accepted.
- JSON input parsing must reject duplicate property names. Validation must occur before mapping a closed wire object into typed guard objects; an ordinary deserializer that silently ignores extra fields is insufficient.

## Included fixture material

| Path relative to `pocs/shuttle` | Purpose |
|---|---|
| `fixtures/case-alpha.json` | The sole authored case, seven F1–F7 fact groups and frozen S01–S04 source register |
| `fixtures/pack-draft.json` | Structured single-pack proposal with six sourced/owed sections |
| `fixtures/inspection-comment.json` | Synthetic version-bound comment; its all-`a` hash is a deliberate test binding, not an actual file digest |
| `content/expected-readiness-pack.md` | Expected textual pack content for local comparison; not a generated/registered DOCX or runtime output |
| `content/sources/S01-synthetic-intake.md` | Fictional `demo-v1` intake snapshot |
| `content/sources/S02-illustrative-checklist.md` | Illustrative `demo-v1` discussion checklist; no regulatory assertion |
| `content/sources/S03-provisional-charter.md` | Synthetic one-case charter boundary, version `lab-extract-v0.1` |
| `content/sources/S04-proposed-architecture.md` | Synthetic architecture boundary, version `lab-extract-v0.1`; proposed architecture only |
| `content/adversarial/permitted-source-attack.md` | Hostile permitted-source test variant, excluded from the ordinary source register |
| `fixtures/native-evaluation-expectations.json` | Expected native outcomes; every tenant check remains **NOT RUN** |

All fixture UUIDs identify test objects only. None represents a deployed Dataverse row or tenant. The source register's SHA-256 values are real digests of the included local source snapshots; they are not claims of Microsoft runtime provenance. Sources were frozen for this fixture on 25 October 2026. They establish no historical discovery, causal time saving, named reviewer acceptance or permission to process bank material.

## Validation

Install the repository's pinned development requirements, then run from any directory:

```sh
python pocs/shuttle/scripts/validate-contracts.py
```

The script resolves inputs relative to itself and uses `jsonschema`'s draft 2020-12 validator, plus explicit source linkage, cutoff, digest, duplicate-key, integer-notation and Unicode checks. It checks the two schemas, three valid fixtures, four source-file hashes, the expected pack text, 38 negative cases and three positive boundary cases. Output is labelled **LOCAL CHECK PASS** or **LOCAL CHECK FAIL**.

These checks do not authorize a caller, enforce an ACL, look up a live receipt, run a Dataverse transaction, create a file, prove source confinement or call Cowork. In particular, the wire validator does not reject an otherwise well-shaped historical retry simply because the current case revision changed; the guard's authorized-receipt reconciliation decides that. Integration requires both wire validation and the trusted-context guard, followed by actual platform tests.
