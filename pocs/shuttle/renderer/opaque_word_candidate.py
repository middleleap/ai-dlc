"""Author a static opaque-upload action slice; no authentication or installer.

The exact caller-supplied source hash identifies a previously reviewed input; it
does not authenticate that review. Only the narrow slice shape below is checked.
Fresh work, staging reservation/emptiness/ACLs, Word controls, the surrounding
graph and runtime receipts require independent validation before integration.
This module neither accepts a complete workflow nor declares one safe to run.
"""
from __future__ import annotations

from copy import deepcopy
import hashlib
import json
import re
from urllib.parse import urlsplit
import uuid


FILE_FIELDS = ("UniqueId", "UIVersionLabel", "ETag", "Length", "ServerRelativeUrl")
SOURCE_NAMES = ("Upload_staged_binary", "Read_staged_binary", "If_staged_bytes_match",
                "Create_if_absent", "Read_saved_metadata")
SECURITY = {"secureData": {"properties": ["inputs", "outputs"]}}


def canonical_sha256(value):
    """Hash the JSON value, independent of object order; never hash raw secrets."""
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":"),
                         ensure_ascii=False, allow_nan=False).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def _require(test, message):
    if not test:
        raise ValueError(message)


def _shape(value, keys, label):
    _require(type(value) is dict and set(value) == set(keys), label + " shape")


def _same(left, right):
    # Python's False == 0 must not accept a different JSON wire type.
    return canonical_sha256(left) == canonical_sha256(right)


def _after(name):
    return {name: ["Succeeded"]}


def _value(action, field):
    return "@body('%s')?['%s']" % (action, field)


def _eq(left, right):
    return {"equals": [left, right]}


def _byte_tests(action):
    content = "coalesce(body('%s')?['$content'],'')" % action
    return [_eq("@empty(%s)" % content, False),
            _eq("@strongEquals(%s,string(%s))" % (content, content), True),
            # Invalid Base64 makes the expression fail. Do not decode as text,
            # coerce a Boolean/object to a string or accept equivalent encodings.
            _eq("@equals(base64ToBinary(%s),base64ToBinary(%s))" % (content, content), True)]


def _guard(reason, tests, predecessor):
    stop = "Stop_" + reason
    return {"type": "If", "expression": {"and": tests}, "actions": {},
            "else": {"actions": {stop: {"type": "Terminate", "inputs": {
                "runStatus": "Failed", "runError": {
                    "code": "SHUTTLE_OPAQUE_CANDIDATE_" + reason,
                    "message": "Opaque upload verification failed; no success or recovery is implied."}}}}},
            "runAfter": _after(predecessor)}


def _paths(site_url, stage_folder_native, final_file_native, request_key):
    _require(type(site_url) is str, "literal HTTPS site URL required")
    try:
        site = urlsplit(site_url)
        # WDL expands @{...} even inside an otherwise literal connector string.
        # urlsplit alone admits it in authority text (including empty userinfo).
        # Require a canonical DNS SharePoint authority, not merely a truthy host.
        valid = (site.scheme == "https" and site_url.startswith("https://") and
                 site.hostname is not None and site.netloc == site.hostname and
                 site_url == "https://" + site.netloc + site.path and
                 re.fullmatch(r"[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.sharepoint\.com", site.netloc) and
                 site.username is None and site.password is None and
                 not site.query and not site.fragment and not site.port and
                 not site_url.endswith("/"))
    except ValueError:
        valid = False
    _require(valid, "canonical HTTPS DNS SharePoint URL without userinfo/query/fragment/port required")
    for path in (site.path, stage_folder_native, final_file_native):
        _require(type(path) is str and 0 < len(path) <= 1024 and
                 re.fullmatch(r"/[A-Za-z0-9_./ -]+", path) and not path.endswith("/") and
                 all(p not in ("", ".", "..") for p in path.split("/")[1:]),
                 "unambiguous literal paths required; expressions/escaping are unsupported")
    _require(type(request_key) is str and re.fullmatch(
        r"[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}", request_key) and
        uuid.UUID(request_key).int != 0, "canonical nonzero request UUID required")
    parent, _, filename = final_file_native.rpartition("/")
    _require(filename == request_key + ".docx" and
             stage_folder_native.rpartition("/")[0] == parent,
             "fresh staging folder and deterministic final file must share a parent")
    _require(stage_folder_native != final_file_native, "stage must be a distinct folder")
    stage_docx = stage_folder_native + "/" + filename
    stage_bin = stage_folder_native + "/" + request_key + ".bin"
    return site.path + stage_docx, site.path + stage_bin, site.path + final_file_native


def _connector(action, operation, parameters, predecessor, *, host=None):
    _shape(action, ["type", "inputs", "runAfter", "runtimeConfiguration"], "connector action")
    _require(action["type"] == "OpenApiConnection" and action["runAfter"] == _after(predecessor)
             and action["runtimeConfiguration"] == SECURITY, "secured success-only connector required")
    inputs = action["inputs"]
    _shape(inputs, ["host", "parameters", "authentication", "retryPolicy"], "connector inputs")
    _shape(inputs["host"], ["apiId", "connectionName", "operationId"], "existing connector host")
    selected = inputs["host"]
    _require(selected["apiId"] == "/providers/Microsoft.PowerApps/apis/shared_sharepointonline" and
             type(selected["connectionName"]) is str and
             re.fullmatch(r"[A-Za-z][A-Za-z0-9_-]{0,127}", selected["connectionName"]) and
             selected["operationId"] == operation, "existing SharePoint binding required")
    if host is not None:
        _require({k: v for k, v in selected.items() if k != "operationId"} == host,
                 "slice connector bindings differ")
    _require(_same(inputs["parameters"], parameters) and
             inputs["authentication"] == "@parameters('$authentication')" and
             inputs["retryPolicy"] == {"type": "none"},
             "exact binary/bodyless parameters, existing authentication and no retries required")


def build_opaque_word_candidate(source, *, reviewed_source_sha256, site_url,
                                stage_folder_native, final_file_native, request_key):
    """Return non-installable candidate actions from one exact five-action slice.

    The source is ``{schemaVersion: 'shuttle.opaque-word-source.v1', actions: ...}``.
    The five SOURCE_NAMES must have exactly the known historical DOCX upload
    shape, including a bodyless flags=0 move and terminal byte-mismatch guard.
    Unknown graph shapes are rejected, rather than inferred or repaired. Paths
    are literal authoring inputs; this helper never reserves or checks a folder.

    Integration must separately establish the external dependency boundaries and
    replace Record's dependency with ``requiredRecordRunAfter``. The output is a
    slice, not a workflow. The source hash and local checks do not qualify Word,
    SharePoint, entitlement, ACLs, record/finalize APIs or receipt visibility.
    """
    _require(type(reviewed_source_sha256) is str and re.fullmatch(r"[0-9a-f]{64}", reviewed_source_sha256)
             and canonical_sha256(source) == reviewed_source_sha256, "exact reviewed source hash required")
    _shape(source, ["schemaVersion", "actions"], "source slice")
    _require(source["schemaVersion"] == "shuttle.opaque-word-source.v1", "source contract unsupported")
    _shape(source["actions"], SOURCE_NAMES, "five-action upload slice")
    old_docx, stage_bin, final_server = _paths(site_url, stage_folder_native, final_file_native, request_key)
    actions = source["actions"]
    headers = {"Accept": "application/json;odata=nometadata"}
    file_uri = lambda path: "_api/web/GetFileByServerRelativeUrl('%s')" % path
    _connector(actions["Upload_staged_binary"], "CreateFile", {
        "dataset": site_url, "folderPath": stage_folder_native,
        "name": request_key + ".docx", "body": "@body('Populate')"}, "If_binary_stage_empty")
    host = {k: v for k, v in actions["Upload_staged_binary"]["inputs"]["host"].items()
            if k != "operationId"}
    _connector(actions["Read_staged_binary"], "GetFileContentByPath", {
        "dataset": site_url, "path": stage_folder_native + "/" + request_key + ".docx",
        "inferContentType": False}, "Upload_staged_binary", host=host)
    _connector(actions["Create_if_absent"], "HttpRequest", {
        "dataset": site_url, "parameters/method": "POST",
        "parameters/uri": file_uri(old_docx) + "/MoveTo(newUrl='%s',flags=0)" % final_server,
        "parameters/headers": headers}, "If_staged_bytes_match", host=host)
    _connector(actions["Read_saved_metadata"], "HttpRequest", {
        "dataset": site_url, "parameters/method": "GET",
        "parameters/uri": file_uri(final_server) + "?$select=" + ",".join(FILE_FIELDS),
        "parameters/headers": headers}, "Ensure_file_acl_unique", host=host)
    expected_guard = _guard("BINARY_STAGE_BYTES_MISMATCH", [
        _eq("@empty(body('Populate')?['$content'])", False),
        _eq(_value("Read_staged_binary", "$content"), _value("Populate", "$content"))], "Read_staged_binary")
    _require(_same(actions["If_staged_bytes_match"], expected_guard), "exact fail-closed source byte guard required")

    candidate = deepcopy(actions)
    candidate["Upload_staged_binary"]["inputs"]["parameters"]["name"] = request_key + ".bin"
    candidate["Read_staged_binary"]["inputs"]["parameters"]["path"] = stage_folder_native + "/" + request_key + ".bin"
    candidate["Read_staged_binary"]["runAfter"] = _after("Read_staged_metadata")
    candidate["Create_if_absent"]["inputs"]["parameters"]["parameters/uri"] = (
        file_uri(stage_bin) + "/MoveTo(newUrl='%s',flags=0)" % final_server)

    def metadata(path, predecessor):
        value = deepcopy(actions["Read_saved_metadata"])
        value["runAfter"] = _after(predecessor)
        value["inputs"]["parameters"]["parameters/uri"] = file_uri(path) + "?$select=" + ",".join(FILE_FIELDS)
        return value

    def stable(before, after):
        return [_eq("@strongEquals(%s,%s)" % (_value(before, key)[1:], _value(after, key)[1:]), True)
                for key in FILE_FIELDS]

    def sane(meta, path):
        return [*[_eq("@empty(body('%s')?['%s'])" % (meta, key), False)
                  for key in ("UniqueId", "UIVersionLabel", "ETag")],
                *[_eq("@strongEquals(%s,string(%s))" % (_value(meta, key)[1:], _value(meta, key)[1:]), True)
                  for key in ("UniqueId", "UIVersionLabel", "ETag")],
                {"greater": ["@int(body('%s')?['Length'])" % meta, 0]},
                {"lessOrEquals": ["@int(body('%s')?['Length'])" % meta, 10485760]},
                _eq(_value(meta, "ServerRelativeUrl"), path)]

    candidate["Read_staged_metadata"] = metadata(stage_bin, "Upload_staged_binary")
    candidate["Read_staged_metadata_after"] = metadata(stage_bin, "Read_staged_binary")
    candidate["If_staged_bytes_match"] = _guard("BINARY_STAGE_BYTES_MISMATCH", [
        *_byte_tests("Populate"), *_byte_tests("Read_staged_binary"),
        _eq("@strongEquals(%s,%s)" % (_value("Read_staged_binary", "$content")[1:],
                                     _value("Populate", "$content")[1:]), True),
        *sane("Read_staged_metadata", stage_bin),
        *stable("Read_staged_metadata", "Read_staged_metadata_after")], "Read_staged_metadata_after")
    published = deepcopy(actions["Read_staged_binary"])
    published["runAfter"] = _after("If_file_acl_matches")
    published["inputs"]["parameters"]["path"] = final_file_native
    candidate["Read_published_binary"] = published
    candidate["Read_published_metadata_after"] = metadata(final_server, "Read_published_binary")
    candidate["If_published_bytes_and_identity_match"] = _guard("BINARY_PUBLISHED_MISMATCH", [
        *_byte_tests("Populate"), *_byte_tests("Read_published_binary"),
        _eq("@strongEquals(%s,%s)" % (_value("Read_published_binary", "$content")[1:],
                                     _value("Populate", "$content")[1:]), True),
        *sane("Read_saved_metadata", final_server),
        _eq(_value("Read_saved_metadata", "UniqueId"), _value("Read_staged_metadata", "UniqueId")),
        _eq("@int(body('Read_saved_metadata')?['Length'])", "@int(body('Read_staged_metadata')?['Length'])"),
        *stable("Read_saved_metadata", "Read_published_metadata_after")], "Read_published_metadata_after")
    return {"schemaVersion": "shuttle.opaque-word-candidate.v1",
            "status": "STATIC_CANDIDATE_ONLY_NOT_INSTALLABLE",
            "sourceCanonicalSha256": reviewed_source_sha256,
            "actions": candidate,
            "requiredRecordRunAfter": _after("If_published_bytes_and_identity_match"),
            "externalPrerequisitesNotValidated": [
                "fresh Pending work and empty final path; preserve failed work and files",
                "pre-Claim binary/collision gate and supported token-free receipt capture",
                "Populate uses reviewed release-bound controls and the pinned Word template",
                "If_binary_stage_empty follows fresh reservation, complete empty feeds and exact private ACL",
                "Ensure_file_acl_unique follows successful Create_if_absent without adopting another file",
                "If_file_acl_matches follows Read_saved_metadata and exact final ACL readback",
                "Record consumes the final saved metadata tuple and independently verifies the file",
                "complete graph dependencies, connector entitlement and one-run operational boundary"]}
