# Public synthetic worker scaffold

This portable source supplies claim, record, finalize and bounded failure handlers.
Its exact-file reader pins the configured SharePoint host/library, case/request
path, file ID, version, ETag and byte length. It checks direct private ACLs and the
named owner's read permissions before and after downloading the exact bytes.
No caller digest, URL, file bytes or arbitrary failure text is accepted by the
Custom APIs. The transport exposes read operations only and refuses redirects.

Render controls derive from the persisted proposal's canonical release tuple.
The original public release retains ISO UTC text; the separately registered
public candidate adds `UTC ` while preserving the persisted UTC second. Registration
binds the byte hash to the work item, uses row-version checks and rechecks lease
expiry. A retry cannot substitute another file identity or different bytes under
the same ETag. Historical receipts do not change the current artifact pointer.

The document verifier is an intentionally strict **public synthetic contract**.
It requires the exact 17 control values, body layout, static text, inert numbering,
package graph and plain-text grammar. It rejects custom XML, external relations,
unreviewed parts and active/hidden Word content. Tests create their own synthetic
package from public text. This does not establish compatibility with live Word
output: target-local metadata rules need separate review and explicit qualification,
with no silent relaxation of this contract.

No tenant configuration, capture, credential, installer or deployment is included.
The SDK fake tests do not simulate Dataverse rollback or establish permissions,
Word execution, ordinary-user access or tenant acceptance. A target deployment
also needs reviewed Custom API/step/schema/key registration and secure bindings.
