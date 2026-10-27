# SHUTTLE Dataverse proposal adapter

Public synthetic fixture package: `0.1.0-public.1`. This source has offline tests and no public deployment evidence. It is not a complete POC or an approved deployment package.

The adapter accepts embedded-source `PackDraft` proposals only. `InspectionComment` fails closed with `FILE_ACL_VERIFIER_NOT_CONFIGURED`; row readability alone cannot establish external-file access. The linked pure guards, JSON runtime and dependencies build as a `net462` plug-in NuGet package. Registration requires a separately reviewed target schema, writer identity, role policy and release procedure; those are not included here.

## Wire and field contract

`shuttle_payloadjson` holds the **complete** `shuttle.proposal.v0.1` JSON contract, not just its `payload` member. These client columns must agree exactly with it:

| Column | Type / value |
|---|---|
| `shuttle_case` | Case lookup matching JSON `caseId` |
| `shuttle_schemaversion` | Text, exact schema release |
| `shuttle_kind` | Choice: 1 PackDraft, 2 InspectionComment |
| `shuttle_expectedcontentrevision` | Whole number, 1–2,147,483,647 |
| `shuttle_requestkey` | Lowercase canonical UUID text |
| `shuttle_payloadjson` | Complete JSON; maximum 500,000 UTF-8 bytes |

An optional nonempty GUID primary ID is accepted and must match the primary-key attribute if present; it is not the replay identity and Create cannot overwrite a row. Apart from the explicitly validated platform system fields described below, other incoming attributes are rejected. Alternate-key identities, unknown/duplicate JSON keys, malformed Unicode, comments, trailing commas, unknown kinds and invalid scalar types are also rejected. The plug-in generates name, owner, actor, effective writer, canonical hash and timestamp. Make the primary name optional on the create form; a caller-provided `shuttle_name` is rejected.

## Restricted source policy

The PreOperation step requires this **secure** registration configuration; absence disables creation:

```json
{"policy":"LAB_EMBEDDED_SOURCES","enabled":true}
```

Case `shuttle_sourcebindingsjson` contains the exact `fixtures/embedded-sources.json` content. It embeds the four synthetic source texts and SHA-256 digests. The adapter retrieves the Case using `InitiatingUserId` and checks all bytes against compiled pins. It accepts the legacy `readiness-gaps-public-v0.1` / `shuttle-public-v0.1` tuple and the distinct `readiness-gaps-public-utc-prefix-v0.2` / `shuttle-public-v0.1` candidate tuple. The tuple is part of the canonical proposal hash and is stamped on the work item; unknown combinations fail closed. These identify synthetic fixture contracts, not an installed renderer or a qualified Word template. Restrict Case/source writes to setup/trusted operations. This policy grants no external SharePoint/source access and is not a general source-policy engine.

## Processing steps and permissions

Register both classes on **Create / shuttle_draftproposal**, synchronous, in transaction:

| Class | Stage | Behavior |
|---|---|---|
| `Shuttle.Dataverse.ValidateDraftProposal` | PreOperation 20 | Validate payload/config, active alternate key and initiating-user privileges; caller-scoped Case/source read; current access before receipt lookup; explicit Case CAS; stamp trusted fields |
| `Shuttle.Dataverse.CommitProposalEventAndWork` | PostOperation 40 | Verify shared validation state and stamped target; create event and Pending render work |

Both steps must run as the **same explicitly selected effective writer**. The code never obtains a SYSTEM/null service. `InitiatingUserId` remains the actor and all Case/receipt reads use that user's service. Configure only the needed writer privileges; the current administrator can support lab wiring but cannot pass ordinary-user tests. The writer needs metadata/user-privilege/access reads, Case CAS updates, and creation of the protected event/outbox records. Caller needs Proposal Create/Read/Append plus Case Read/AppendTo; record reads still run under caller rights. Inherited team privileges are included by the SDK privilege request. [Microsoft privilege semantics](https://learn.microsoft.com/en-us/dotnet/api/microsoft.crm.sdk.messages.retrieveuserprivilegesrequest?view=dataverse-sdk-latest).

The Proposal's active alternate key must consist exactly of `shuttle_case` + `shuttle_requestkey`. Ordinary users must not have Proposal Update/Delete, Case direct writes, or protected Event/Work/Artifact writes. Test accumulated roles/teams, FLS, association and bulk/headless routes in the tenant. This adapter is not a replacement for that role configuration or its tests.

Case requires `shuttle_contentrevision` (int), `shuttle_guardsequence` (bigint), `shuttle_sourcebindingsjson` (memo), owner and a real RowVersion. Every fresh accepted proposal advances GuardSequence using `UpdateRequest` and explicit `IfRowVersionMatches`, **including PackDraft**; this strengthens the pure core's minimum comment CAS requirement. ContentRevision is unchanged. The Case update and PostOperation writes rely on the enclosing Dataverse transaction. Exceptions propagate so the platform can roll back; local fakes do not prove rollback. [Concurrency](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/optimistic-concurrency), [transaction/error behavior](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/handle-exceptions).

An identical existing request yields `SHUTTLE:REPLAY_RECONCILIATION_REQUIRED` with no receipt identifiers. Native Create cannot report successful creation of another existing row. Reconcile through an authorized scoped read using the original Case + RequestKey; changed content yields `REQUEST_KEY_CONFLICT`. The active key remains the uniqueness mechanism when two requests race. Native reconciliation and forced-write rollback are still tenant gates.

## Build and local checks

From `pocs/shuttle`, with .NET 10 SDK and restored official NuGet dependencies:

```sh
dotnet restore src/Shuttle.Dataverse/Shuttle.Dataverse.csproj --locked-mode
dotnet build src/Shuttle.Dataverse/Shuttle.Dataverse.csproj --no-restore -c Release
dotnet restore tests/Shuttle.Dataverse.Tests/Shuttle.Dataverse.Tests.csproj --locked-mode
dotnet run --project tests/Shuttle.Dataverse.Tests --no-restore
dotnet pack src/Shuttle.Dataverse/Shuttle.Dataverse.csproj --no-restore -c Release
```

The adapter compiles against the .NET Framework 4.6.2 reference assemblies on Mac. Tests compile the **same source** against Microsoft's .NET 10-compatible SDK and use fake services/context. They do not execute the net462 assembly inside Dataverse. Local success cannot establish registration order, actual token identity, privileges, transaction rollback, key activation, bulk-route coverage or native user experience. No tenant deployment has been performed by this component's build/test scripts.

Primary ID compatibility: Microsoft's [Entity operations](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/org-service/entity-operations) and [Create plug-in tutorial](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/tutorial-write-plug-in) describe primary IDs and the `OutputParameters["id"]` result. No assumption is made that PreOperation `Target.Id` is empty. PostOperation requires the result ID to equal `PrimaryEntityId` and any populated Target ID; it permits a narrow list of platform audit/ownership/state columns, while still comparing every trusted Shuttle stamp. Unexpected attributes remain rejected. All identity, ownership and native-client shapes require target qualification.

For an unexpected platform exception, the caller still receives only `SHUTTLE:PLATFORM_OPERATION_FAILED`. Diagnostic tracing includes the context stage, CLR exception type and numeric SDK fault error code when present. It never prints exception messages, inner faults, payloads or source content.

Bounded `SHUTTLE_TARGET_SHAPE` diagnostics contain only sorted attribute/key names (64 names maximum, 128 characters each); invalid names are redacted and values are never logged. Diagnostics do not loosen the strict Target allowlist.

## Observed Create system-field compatibility (assembly 0.1.0.2)

The bounded platform-field classifier handles `createdby`, `createdon`, `modifiedby`, `modifiedon`, `modifiedonbehalfby`, `ownerid`, `owningbusinessunit`, `owninguser`, `statecode` and `statuscode`, as well as the primary GUID. Only those listed PreOperation fields are accepted through a typed classifier. Acceptance is not evidence that a caller omitted a field.

`ownerid` and `owninguser`, when present, must be nonempty `systemuser` references to `InitiatingUserId`, with no alternate keys. `owningbusinessunit` must match the initiating user's `businessunitid` retrieved from Dataverse. `createdby`/`modifiedby` must be nonempty systemuser references matching an authoritative initiating/effective context principal. The permitted delegate field may be null or one of those principals; unfamiliar impersonation shapes fail closed. Audit dates must be typed, nondefault Dataverse-range dates (year1753+); they are not freshness/authorization evidence. State/status must be the reviewed active defaults0/1. An invalid value yields `PLATFORM_ATTRIBUTE_INVALID`. Other fields including `createdonbehalfby` and `overriddencreatedon` remain rejected at stage20, as do all caller-supplied protected Shuttle stamps.

Stage20 cannot distinguish an explicit owner equal to the platform default from a platform-injected default. That matching owner is accepted; another owner is rejected. The persisted business owner is still overwritten from the caller-authorized Case, while Shuttle actor/writer are derived exclusively from execution context and committed time is generated by the plug-in. Platform audit/ownership fields never grant access, supply source proof, choose a Case or determine an idempotency receipt. PostOperation still verifies the trusted owner and Shuttle stamps before event/outbox writes.

The synthetic fixture Case is owned by its initiating user. Derived platform ownership recalculation for cross-owner/team Cases, additional delegation arrangements and ordinary-user ACLs remain live qualification gates. This implementation does not assert that platform-created audit fields are immutable under every administrator operation. [Microsoft system-column definitions](https://support.microsoft.com/en-us/access/dataverse-system-tables-and-columns) describe those fields; [Microsoft impersonation documentation](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/impersonate-another-user-web-api) explains that created/delegate identities vary with impersonation. The guard does not infer actor identity from either field.
