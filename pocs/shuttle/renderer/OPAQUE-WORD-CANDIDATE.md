# Static opaque Word upload candidate

`opaque_word_candidate.py` authors a narrow upload/verification action slice
using the Python standard library. It has no command that signs in, contacts a
tenant, imports or activates a flow, creates work or changes permissions. Its
output status is `STATIC_CANDIDATE_ONLY_NOT_INSTALLABLE`; the output contains no
workflow wrapper or installer route.

The helper requires the exact caller-supplied canonical SHA-256 of its source
mapping. That pin identifies the input and does not authenticate a review. It
also rejects unknown source shapes: exactly five named actions are supported,
with the specified native binary body, one existing SharePoint connector,
secured inputs/outputs, disabled retries, success-only dependencies, bodyless
`MoveTo(...,flags=0)`, exact metadata selection and a terminal failure branch.
Changing the wrapper hash cannot make a weakened action pass those checks.

The source contract is `shuttle.opaque-word-source.v1` with `schemaVersion` and
`actions` only. The five actions are `Upload_staged_binary`,
`Read_staged_binary`, `If_staged_bytes_match`, `Create_if_absent` and
`Read_saved_metadata`. The synthetic in-memory fixture in
`test_opaque_word_candidate.py` shows their exact supported shape. This is an
explicit slice format; a complete, nested or differently structured workflow
must undergo separate review and cannot be passed directly to this helper.

Call `build_opaque_word_candidate(source, reviewed_source_sha256=...,
site_url=..., stage_folder_native=..., final_file_native=..., request_key=...)`.
The site authority must be canonical lowercase `https://<DNS-label>.sharepoint.com`
without any userinfo, port or escaping. All paths must be literal, unambiguous paths. The fresh staging folder and
deterministic final file share a parent; the final filename must be the exact
request UUID plus `.docx`. Expressions, quoting, traversal, credentials and
query strings are rejected. Dynamic run-folder selection is outside this slice
contract and must not be inserted by string substitution after hashing.

The candidate uploads the unchanged Word binary body as `.bin`. It reads stage
metadata, raw bytes and metadata again before requiring a recognized nonempty
string Base64 envelope, exact Word byte representation and a stable nonempty
file identity/version/ETag/length/path tuple. Publication changes only the move
source suffix; the move remains bodyless with `flags=0`.

After the separately reviewed final ACL guard, the candidate reads final bytes
and metadata again. Its terminal guard requires the original staged identity
and length, exact final path, exact Word byte representation and an unchanged
final metadata tuple. Move/ACL version changes are permitted before that final
tuple is captured. Every new connector read retains the existing connector,
authentication, disabled retries and secured inputs/outputs. Failure branches
contain only static text and terminate; they do not expose raw bytes or adopt,
overwrite, delete, retry or reclaim a file.

The returned `requiredRecordRunAfter` is an integration requirement, not an
applied edit. Before any future runtime use, a separate complete-graph review
must establish fresh Pending work and an empty destination; a fresh reserved,
empty private staging folder; the pre-Claim binary/collision gate; release-bound
Word controls and template pins; final ACL sequencing; the final metadata tuple
passed to the independent provider; existing entitlement; and a supported
token-free receipt capture route. Those requirements are also present in
`externalPrerequisitesNotValidated`. Existing failed work and files must remain
preserved. A complete flow must not skip these boundaries or mistake the static
candidate status for permission to invoke it.

The offline tests cover source hash and structure rejection, retained fields,
binary/bodyless paths, dependency requirements and adverse byte/metadata inputs
through a small independent predicate interpreter:

```sh
python3 -B -m unittest discover -s pocs/shuttle/renderer -p 'test_*.py'
```

The interpreter is not Power Automate. These checks establish no live Word,
SharePoint, permissions, billing, file stability or complete-pack result.
Later Office processing, arbitrary administrator writes and cross-system
atomicity remain outside this candidate's guarantees.
