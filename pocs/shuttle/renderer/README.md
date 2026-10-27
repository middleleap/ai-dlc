# Portable binary upload gate

`binary_upload_gate.py` authors a synthetic SharePoint binary/collision gate
using a caller-supplied connector factory, site/folder paths and reviewed owner
principal/role IDs. It uses only the Python standard library. Importing or
running its tests does not authenticate, contact Microsoft, create files in a
tenant, import a workflow or claim runtime qualification.

The generated actions check a private parent ACL, reserve a new private canary
subtree, compare all byte values after native binary upload/readback and test
duplicate/competing folder reservations plus conflicting/competing file moves.
Moves use `flags=0`; only the specific structured collision code is accepted.
Unknown errors, timeouts, unexpected bytes or changed file metadata stop the
gate. Connector retries are disabled and generated connector actions request
secured inputs/outputs. An explicit token-free receipt projects only the bounded
canary result. Canary files are retained for inspection.

This public helper does not contain a tenant binding, credentials, an installer,
a Word renderer or the one-job qualification flow. Its example site, case UUID,
principal and correlation IDs are fictional test fixtures. The local suite has
26 graph/predicate/adversarial tests, including supported Compose security,
structured-error parsing, injection rejection and exact race-winner checks:

```sh
python3 -m unittest discover -s pocs/shuttle/renderer -p 'test_*.py'
```

The same checks run through `pocs/shuttle/scripts/verify-local.sh`. They exercise
generated definitions and a limited independent predicate interpreter. Actual
Power Automate validation, connector permissions/entitlement, private ACLs,
binary envelopes, collision behavior and runtime byte/identity preservation
still need separate qualification with real supplied bindings. A canary result
does not establish arbitrary administrator-write protection, a cross-system
transaction, Office-document integrity or production concurrency guarantees.
