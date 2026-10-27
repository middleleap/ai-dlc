# Local public worker tests

Run this executable with the .NET SDK pinned by `pocs/shuttle/global.json`:

```sh
cd pocs/shuttle
dotnet restore tests/Shuttle.Worker.Tests --locked-mode
dotnet run --project tests/Shuttle.Worker.Tests --no-restore
```

The suite covers identity/transaction guards, row versions, bounded leases and
retries, stable receipts, source revocation, release-bound timestamps, exact file
and byte identity, private ACL checks, diagnostics with fixed codes, OPC package
structure and adversarial text/metadata changes. All SharePoint responses are
local fakes. Every package is generated from public synthetic text; no Word or
tenant capture is included. Passing does not prove tenant rollback, Word connector
compatibility, permissions, registration or runtime qualification.
