# SHUTTLE portable foundation

A synthetic, one-case / one-pack foundation for a guided readiness workflow. It connects case facts, source references, unresolved gaps and accountable owners. Human bank decisions remain outside these proposal operations.

This public slice contains the wire contracts, pure decision guards and Dataverse proposal adapter with offline regression tests. It contains no tenant configuration, deployment receipts, account identities, actual Word output or bank/client material. The public fixture release is `shuttle-public-v0.1`; its neutral source bytes and compiled pins are deliberately separate from any privately configured lab release.

## Included

| Path | Responsibility |
|---|---|
| `contracts/` | Closed JSON schemas for case, pack proposal and inspection comment |
| `fixtures/`, `content/` | Fictional Bank Alpha example, exact source snapshots and expected text |
| `src/Shuttle.Guards/` | Trusted-context checks, canonical hashes, retry/conflict and version decisions |
| `src/Shuttle.Dataverse/` | Strict input decoding, caller-scoped reads, case concurrency and transactional event/work writes |
| `tests/` | Guard regression and adapter tests with fake SDK services |

An accepted `PackDraft` plans an event and render work. These components do not render or save a file. `InspectionComment` is modelled in the core but the adapter rejects it until caller-bound file access and artifact retrieval are qualified. Neither operation grants approval or permission to launch.

## Local validation

Use .NET SDK 10.0.402 (see `global.json`) and Python 3.12 or later:

```sh
cd pocs/shuttle
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
PYTHON=.venv/bin/python bash scripts/verify-local.sh
```

`DOTNET` can select another path to the pinned SDK. First-time dependency restore downloads the locked packages; NuGet audit stays enabled. The checks validate source digests, contract attacks, core decisions, adapter request construction and a `net462` Release build. Test executables compile the same adapter source against .NET 10 SDK types; they do not execute inside the Dataverse sandbox.

No script signs in, provisions a resource, deploys an application, starts a workflow, sends messages or accepts a paid service. This is not an installable Power Platform solution or a release approval.

## Separate runtime qualification

A concise [qualification status](QUALIFICATION-STATUS.md) records the bounded synthetic diagnostic results and remaining runtime limits.

A deployment needs reviewed schema/keys, target-local identities and roles, registered steps and transactions, a protected document worker, exact source/file access, concurrency/rollback checks and a clean managed-solution installation. Copilot/native integration and ordinary-user tests are separate gates. Offline passing tests establish none of those results.

The Dataverse registration JSON is a reference contract only. Do not use its public fixture package as a replacement for an approved tenant package. Source-policy pins must correspond to the reviewed content release; changing a fixture requires updating all derived bindings and regression vectors together.
