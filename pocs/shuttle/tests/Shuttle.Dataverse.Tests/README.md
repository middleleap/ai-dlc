# Local Dataverse adapter tests

Executable .NET 10 regression checks compile the adapter/core sources against the official Microsoft Dataverse Client SDK. Fake contexts/services exercise strict decoding, embedded-source integrity, server-derived identities, active-key/privilege preconditions, explicit row-version requests, receipt reconciliation, reserved fields, required validation state and propagation of event/job failures.

They **do not simulate or prove Dataverse transaction rollback**. The job-write failure check verifies the exception escapes after the attempted event write; only a tenant test can establish that Dataverse rolled back that event and the Proposal. The tests also do not authenticate to Microsoft or prove real ACL enforcement, package loading or native integration.

The test SDK's initially resolved cryptography dependencies were flagged by NuGet audit. Explicit current Microsoft cryptography packages are pinned at 10.0.13; audit warnings remain errors. These test-only dependencies are not included in the plug-in package.

Run from `pocs/shuttle`: `dotnet run --project tests/Shuttle.Dataverse.Tests`.
