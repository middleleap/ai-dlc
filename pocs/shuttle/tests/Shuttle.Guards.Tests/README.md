# Local guard regression runner

Run from the repository root with the pinned .NET SDK:

```sh
dotnet restore pocs/shuttle/tests/Shuttle.Guards.Tests/Shuttle.Guards.Tests.csproj --locked-mode
dotnet run --project pocs/shuttle/tests/Shuttle.Guards.Tests --configuration Release --no-restore
```

This is a dependency-free console test runner with a nonzero exit on failure, not
an xUnit test assembly. `dotnet test` is not the command that runs these assertions.
The core's .NET Standard reference packages are locked; the runner itself adds no
test-framework dependencies.

Scenarios cover current authorization before receipt lookup, separate operation
rights, source/artifact/parent restrictions, stale revisions and exact bindings,
identical historical replay, changed-key payload/kind conflict, append-only reply
constraints, proposed write counts, safe Unicode limits, strict identifier/hash
boundaries and canonical hashing. Actual shared PackDraft/InspectionComment JSON
fixtures are mapped into the core, and reordered JSON properties preserve the
hash. Fixed canonical-hash vectors were independently computed with Python's
`struct.pack` big-endian encoding and `hashlib.sha256`, following the published
encoding contract. A fixture or encoding change must deliberately review/update
these vectors rather than silently redefining prior receipt identity.
Input fixtures remain synthetic; the all-`a` artifact hash is a deliberate
binding sentinel and is not a checksum of a generated file.

The test fixture mapper is not a production wire decoder. The separate contract
validator checks closed JSON objects and semantic shape. Neither set of local
checks proves Dataverse security, database transactions, active alternate keys,
native tools, saved artifacts, file permissions, measured consumption or bank
acceptance. All relevant tenant tests remain **NOT RUN**.
