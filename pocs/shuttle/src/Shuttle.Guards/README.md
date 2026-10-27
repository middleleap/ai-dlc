# Shuttle local guard foundation

This library is **pure local decision logic**, not a Dataverse plug-in. It targets
`netstandard2.0` so its logic can be evaluated for reuse in the later supported
Dataverse .NET Framework adapter. Compilation does not establish plug-in packaging
or runtime compatibility.

`ProposalGuard.Evaluate(proposal, trustedContext, receiptLookup)` returns exactly one:

- `Reject`: stable reason code; no receipt or mutation plan.
- `ReplayReceipt`: the original authorized historical receipt; no new writes and
  no claim that its artifact is currently accepted.
- `AcceptPlan`: proposed Proposal/Event writes; PackDraft adds one ExternalWork;
  InspectionComment instead requires Case RowVersion compare-and-swap and a
  GuardSequence increment. Neither kind changes ContentRevision or grants approval.

The library does not persist this plan. The future adapter must enforce the active
Case + RequestKey alternate key, transactional writes and explicit concurrency
behavior. A returned plan is not a committed Proposal, saved file or successful
runtime test.

## Trust boundary

`TrustedContext` is a host-supplied snapshot. The future authenticated adapter must
derive it from the real initiating/effective identity, current permissions, case,
artifact/file and related-comment records. A caller must never populate it through
the Proposal body. The local tests use synthetic snapshots only.

Current case/operation/source/artifact access is checked before calling
`IReceiptLookup.Find`. A committed matching request returns its receipt before
checking current revision/artifact binding, because a replay acknowledges old work
rather than starting new work. Changed content under the same key conflicts. Fresh
stale requests fail. Revoked access denies even an identical old request.

The host must reject unknown/reserved wire properties, duplicate JSON keys,
malformed encodings and noncanonical wire identifiers **before** constructing the
typed model. `ValidateShape` also checks typed-model invariants. The test-fixture
JSON mapper is not a production decoder. Release IDs are recorded client claims;
the renderer/adapter must resolve the actual permitted installed releases. A
permitted source ID does not prove substantive support for generated text.

## Canonical request hash

`CanonicalProposal.Hash` computes lowercase SHA-256 of `shuttle-canonical-v1`:

1. Every string is UTF-8 without BOM or Unicode normalization, prefixed with a
   four-byte signed nonnegative length in big-endian order. Invalid surrogate
   sequences are rejected before encoding.
2. Encode strings: encoding version, schema version, kind, lowercase canonical
   Case UUID; then the expected ContentRevision as eight-byte big-endian integer;
   then lowercase canonical RequestKey UUID.
3. PackDraft: template release, skill release, four-byte section count; each
   section's key/title/text, four-byte source count, each source ID, then optional
   owed owner. Arrays preserve their declared order.
4. InspectionComment: artifact UUID, stored hash, comment text, optional related
   comment UUID.
5. An optional string is a single byte `0` when absent, or `1` followed by the
   normal length-prefixed string when present. Blank supplied optional text is
   invalid and cannot be silently treated as absent.

JSON object property order does not enter this encoding. Text whitespace and
Unicode representation do: they are not silently normalized. Different template,
skill, kind, section content/order, source references/order, owner, revision or
artifact binding changes the hash. The hash is for reconciliation, not a signature
or proof of provenance.

## Required Microsoft work remains

No SDK adapter, assembly registration/processing steps, transaction, active key,
real caller authorization, file ACL, Word connector, flow, worker lease, native
reconciliation or bank policy has been tested here. The adapter must close the
validation-to-write race and recheck authoritative state within the real platform
boundary. Tenant DP/G0 checks remain **NOT RUN**.
