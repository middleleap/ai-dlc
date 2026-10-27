"""Author a synthetic, pre-Claim SharePoint binary/collision qualification gate.

This module does not contact Microsoft, import a flow, or qualify anything by
itself. Its actions deliberately leave their canary files in a fresh private
run-specific subtree. No case/job/proposal/artifact rows or existing pack paths
are read or written. A failed/ambiguous run must not be resumed as a passed gate.

The caller supplies the existing connector factory and reviewed case-folder
paths. All connector retries are disabled. Only structured DocAlreadyExists
errors count as a collision; unsupported endpoints, permissions and timeouts do
not. The exact native binary envelope and REST methods remain target-qualified
only after the generated actions actually pass.

Primary contracts:
https://learn.microsoft.com/en-us/connectors/sharepointonline/
https://learn.microsoft.com/en-us/azure/logic-apps/logic-apps-content-type
https://learn.microsoft.com/en-us/openspecs/sharepoint_protocols/ms-csomspt/b9b09896-84f6-4f87-8fe9-74e306d700d1
https://learn.microsoft.com/en-us/dotnet/api/microsoft.sharepoint.client.clienterrorcodes.docalreadyexists
https://learn.microsoft.com/en-us/previous-versions/office/sharepoint-visio/jj245487(v=office.15)

AddWithOverwrite(false) existing-folder rejection is intentionally TESTED, not
assumed from its name. Server conflict decisions plus the competing requests
provide bounded target evidence, not a proof against arbitrary administrator
writes or a Dataverse/SharePoint transaction.
"""
from __future__ import annotations

import base64
from copy import deepcopy
import hashlib
import re
from urllib.parse import urlsplit


DOC_ALREADY_EXISTS = "-2130575257"
FIXTURES = {
    label: b"SHUTTLE_BINARY_CANARY_" + label.encode("ascii") + b"\x00\xff\x80\r\n" + bytes(range(256))
    + b"\x00END_" + label.encode("ascii") + b"\xff"
    for label in ("A", "B")
}
FILE_FIELDS = ("UniqueId", "UIVersionLabel", "ETag", "Length", "ServerRelativeUrl")
ACL_SUFFIX = ("/ListItemAllFields/RoleAssignments?$select=PrincipalId,Member/Id,"
              "Member/PrincipalType,RoleDefinitionBindings/Id&$expand=Member,RoleDefinitionBindings")


def _literal(value):
    return "'" + value.replace("'", "''") + "'"


def _concat(*values):
    """Arguments are WDL fragments, not Python values."""
    return "concat(" + ",".join(values) + ")"


def _eq(left, right):
    return {"equals": [left, right]}


def _all(*tests):
    return {"and": list(tests)}


def _any(*tests):
    return {"or": list(tests)}


def _value(action, field):
    return "@body('%s')?['%s']" % (action, field)


def _status(action):
    return "@actions('%s')?['status']" % action


def collision_test(action):
    """WDL predicate: an expected collision is NOT just any failed HTTP call.

    Recognise only Microsoft's DocAlreadyExists constant in structured OData
    error codes, the SharePoint connector's errors array, or its observed HTTP
    400 wrapper containing serialized OData JSON and a correlation-ID trailer.
    No English message/code substring matching, body forwarding or generic 4xx
    pass. Unknown envelopes fail closed; malformed candidate JSON stops the
    assertion rather than authorizing a collision or its downstream actions.
    """
    code = lambda key: ("@first(split(coalesce(body('%s')?['%s']?['code'],''),','))"
                        % (action, key))
    errors = "coalesce(body('%s')?['errors'],json('[\"\"]'))" % action
    message = "body('%s')?['message']" % action
    text = "string(coalesce(%s,''))" % message
    parts = "split(%s,'clientRequestId: ')" % text
    # The only newly supported envelope starts with OData JSON followed by the
    # connector's literal correlation marker. Require exactly one marker; one
    # inside the JSON string cannot be used to splice out a different payload.
    # Put if() INSIDE json(): both possible string arguments are safe even with
    # eager parameter evaluation. Plain/absent messages parse only '{}'. JSON
    # that is truncated, malformed or followed by other data fails the guard.
    # Existing structured errors take their original paths without parsing any
    # message, including an unrelated/malformed message accompanying them.
    wrapper_shape = (
        "and(startsWith(trim(%s),'{\"odata.error\":'),equals(length(%s),2),"
        "equals(coalesce(body('%s')?['error']?['code'],''),''),"
        "equals(coalesce(body('%s')?['odata.error']?['code'],''),''),"
        "empty(coalesce(body('%s')?['errors'],json('[]'))))"
    ) % (text, parts, action, action, action)
    wrapped = "json(if(%s,trim(first(%s)),'{}'))" % (wrapper_shape, parts)
    # strongEquals rejects type coercion (ordinary equals(true,1) can pass).
    # Guard its operands, not the function call, so eager evaluation remains
    # safe for older structured envelopes with absent message/body status.
    typed_message = "if(%s,%s,'')" % (wrapper_shape, message)
    wrapped_collision = _all(
        _eq("@strongEquals(if(%s,outputs('%s')?['statusCode'],400),400)" % (wrapper_shape, action), True),
        _eq("@strongEquals(if(%s,body('%s')?['status'],400),400)" % (wrapper_shape, action), True),
        _eq("@strongEquals(%s,string(%s))" % (typed_message, typed_message), True),
        _eq("@strongEquals(coalesce(%s?['odata.error']?['code'],''),%s)" % (
            wrapped, _literal(DOC_ALREADY_EXISTS + ", Microsoft.SharePoint.SPException")), True),
    )
    return _all(
        _eq(_status(action), "Failed"),
        _any(*[_eq("@outputs('%s')?['statusCode']" % action, status)
               for status in (400, 409, 500)]),
        _any(_eq(code("error"), DOC_ALREADY_EXISTS),
             _eq(code("odata.error"), DOC_ALREADY_EXISTS),
             wrapped_collision,
             # Power Automate object-form equals rejects literal Array operands.
             # Scalar first/length/last tests still accept ONLY the known one-
             # or two-element error arrays. A string's first character cannot
             # equal the complete code; objects/invalid types fail evaluation.
             _all(_eq("@first(%s)" % errors, DOC_ALREADY_EXISTS),
                  _any(_eq("@length(%s)" % errors, 1),
                       _all(_eq("@length(%s)" % errors, 2),
                            _eq("@last(%s)" % errors, "Microsoft.SharePoint.SPException"))))),
    )


def one_winner_test(left, right):
    return _any(_all(_eq(_status(left), "Succeeded"), collision_test(right)),
                _all(collision_test(left), _eq(_status(right), "Succeeded")))


def _validate_paths(site_url, server, native, prefix, principal, role):
    site = urlsplit(site_url)
    if (site.scheme != "https" or not site.hostname or site.username or site.password
            or site.query or site.fragment or site.port or site_url.endswith("/")):
        raise ValueError("reviewed HTTPS site URL without credentials/query/fragment required")
    for path in (server, native):
        if not isinstance(path, str) or not re.fullmatch(r"/[A-Za-z0-9_./ -]+", path):
            raise ValueError("reviewed literal folder paths required")
        if path.endswith("/") or "//" in path or any(p in (".", "..", "") for p in path.split("/")[1:]):
            raise ValueError("ambiguous folder path")
    if server != site.path.rstrip("/") + native:
        raise ValueError("full server-relative and native site-relative case paths disagree")
    if not re.fullmatch(r"[A-Za-z][A-Za-z0-9_]{0,35}", prefix):
        raise ValueError("short safe unique action prefix required")
    if any(type(v) is not int or v <= 0 for v in (principal, role)):
        raise ValueError("reviewed positive owner principal and role IDs required")


def build_binary_upload_gate(*, connector, site_url, case_folder_server_relative,
                            case_folder_native, owner_principal_id, owner_role_id,
                            prefix="Binary_upload", after=None):
    """Return {actions, lastGateName, receiptActionName, fixtureSha256}.

    ``connector(kind, operation, parameters, after=None)`` matches the existing
    compiler factory. Parameters use actual SharePoint connector operation IDs:
    HttpRequest (parameters/*), CreateFile (folderPath/name/body), and
    GetFileContentByPath (path/inferContentType). The caller must preserve these
    native binary actions and insert Claim after ``lastGateName: Succeeded``.

    Every generated action is flat except terminating assertion else branches
    (depth two). No loops, wait, deletion, recovery, new connection or auth call.
    The public receipt is an explicit token-free exception to connector output
    secrecy; it consumes a hidden whitelist projection, never a raw API body.
    """
    _validate_paths(site_url, case_folder_server_relative, case_folder_native,
                    prefix, owner_principal_id, owner_role_id)
    if after is not None and (not isinstance(after, dict) or any(
            statuses != ["Succeeded"] for statuses in after.values())):
        raise ValueError("entry dependencies must require Succeeded only")
    actions = {}
    name = lambda suffix: prefix + "_" + suffix
    path_action = name("Paths")
    fixture64 = {k: base64.b64encode(v).decode("ascii") for k, v in FIXTURES.items()}
    hashes = {k: hashlib.sha256(v).hexdigest() for k, v in FIXTURES.items()}
    paths = lambda native=False: "outputs('%s')?['%sRoot']" % (path_action, "native" if native else "server")

    def path(leaf="", native=False):
        return _concat(paths(native), _literal("/" + leaf)) if leaf else paths(native)

    def endpoint(kind, leaf="", suffix=""):
        return "@" + _concat(_literal("_api/web/Get%sByServerRelativeUrl('" % kind),
                              path(leaf), _literal("')" + suffix))

    def add_folder(leaf=""):
        parent = case_folder_server_relative if not leaf else None
        parent_expr = _literal(parent) if parent else paths()
        return "@" + _concat(_literal("_api/web/GetFolderByServerRelativeUrl('"), parent_expr,
            _literal("')/Folders/AddWithOverwrite(url='"), path(leaf), _literal("',overwrite=false)"))

    def add(action_name, action):
        if action_name in actions:
            raise ValueError("duplicate binary gate action")
        actions[action_name] = action
        return action_name

    def call(suffix, operation, parameters, predecessor=None, statuses=None, deps=None):
        dependency = deps if deps is not None else ({predecessor: statuses or ["Succeeded"]} if predecessor else {})
        action = deepcopy(connector("sharepoint", operation, parameters, dependency))
        if action.get("type") != "OpenApiConnection":
            raise ValueError("existing OpenApiConnection factory required")
        action["runAfter"] = dependency
        action.setdefault("inputs", {})["retryPolicy"] = {"type": "none"}
        action["runtimeConfiguration"] = {"secureData": {"properties": ["inputs", "outputs"]}}
        host = action["inputs"].get("host", {})
        if host.get("operationId") != operation or not str(host.get("apiId", "")).endswith("/shared_sharepointonline"):
            raise ValueError("existing SharePoint connector binding required")
        return add(name(suffix), action)

    def http(suffix, method, uri, predecessor=None, statuses=None, deps=None):
        return call(suffix, "HttpRequest", {
            "dataset": site_url, "parameters/method": method, "parameters/uri": uri,
            "parameters/headers": {"Accept": "application/json;odata=nometadata"}},
            predecessor, statuses, deps)

    def guard(suffix, expression, predecessor=None, deps=None):
        action_name = name(suffix)
        return add(action_name, {"type": "If", "expression": expression, "actions": {},
            "else": {"actions": {name("Stop_" + suffix): {"type": "Terminate", "inputs": {
                "runStatus": "Failed", "runError": {"code": "SHUTTLE_BINARY_GATE_" + suffix,
                "message": "Synthetic binary/collision qualification failed; Claim must not run."}}}}},
            "runAfter": deps if deps is not None else {predecessor: ["Succeeded"]}})

    def metadata(suffix, leaf, predecessor):
        return http(suffix, "GET", endpoint("File", leaf, "?$select=" + ",".join(FILE_FIELDS)), predecessor)

    def content(suffix, leaf, predecessor):
        return call(suffix, "GetFileContentByPath", {"dataset": site_url,
            "path": "@" + path(leaf, native=True), "inferContentType": False}, predecessor)

    def create(suffix, leaf, label, predecessor):
        return call(suffix, "CreateFile", {"dataset": site_url, "folderPath": "@" + paths(True),
            "name": leaf, "body": "@base64ToBinary('%s')" % fixture64[label]}, predecessor)

    def move(suffix, source, target, predecessor):
        uri = "@" + _concat(_literal("_api/web/GetFileByServerRelativeUrl('"), path(source),
            _literal("')/MoveTo(newUrl='"), path(target), _literal("',flags=0)"))
        return http(suffix, "POST", uri, predecessor)

    def bytes_match(action, label):
        # Do not use base64ToString, string(), interpolation or HttpRequest body
        # for file bytes. An unrecognised native envelope fails the assertion.
        return _eq(_value(action, "$content"), fixture64[label])

    def sane_file(meta, leaf, label):
        return _all(_eq("@empty(body('%s')?['UniqueId'])" % meta, False),
            _eq("@empty(body('%s')?['UIVersionLabel'])" % meta, False),
            _eq("@empty(body('%s')?['ETag'])" % meta, False),
            _eq("@int(body('%s')?['Length'])" % meta, len(FIXTURES[label])),
            _eq(_value(meta, "ServerRelativeUrl"), "@" + path(leaf)))

    def unchanged(before, after_meta):
        return _all(*[_eq(_value(before, key), _value(after_meta, key)) for key in FILE_FIELDS])

    def acl_tests(action):
        return _all(_eq("@length(body('%s')?['value'])" % action, 1),
            _eq("@first(body('%s')?['value'])?['PrincipalId']" % action, owner_principal_id),
            _eq("@first(body('%s')?['value'])?['Member']?['Id']" % action, owner_principal_id),
            _eq("@first(body('%s')?['value'])?['Member']?['PrincipalType']" % action, 1),
            _eq("@length(first(body('%s')?['value'])?['RoleDefinitionBindings'])" % action, 1),
            _eq("@first(first(body('%s')?['value'])?['RoleDefinitionBindings'])?['Id']" % action, owner_role_id),
            *[_eq("@empty(body('%s')?['%s'])" % (action, key), True)
              for key in ("odata.nextLink", "@odata.nextLink", "__next")])

    add(path_action, {"type": "Compose", "inputs": {
        "serverRoot": "@concat(%s,'/_binary_canary_',workflow()?['run']?['name'])" % _literal(case_folder_server_relative),
        "nativeRoot": "@concat(%s,'/_binary_canary_',workflow()?['run']?['name'])" % _literal(case_folder_native)},
        "runAfter": deepcopy(after or {}),
        # Compose supports Secure Inputs; enabling it also hides its output.
        # Explicit Secure Outputs is rejected by Power Automate validation.
        "runtimeConfiguration": {"secureData": {"properties": ["inputs"]}}})
    # Check the reviewed private parent BEFORE creating the canary subtree.
    parent_uri = "_api/web/GetFolderByServerRelativeUrl('%s')" % case_folder_server_relative
    parent_meta = http("Read_private_parent", "GET", parent_uri + "/ListItemAllFields?$select=HasUniqueRoleAssignments", path_action)
    parent_acl = http("Read_parent_acl", "GET", parent_uri + ACL_SUFFIX, parent_meta)
    private = guard("Require_private_parent", _all(_eq(_value(parent_meta, "HasUniqueRoleAssignments"), True),
                                                   acl_tests(parent_acl)), parent_acl)
    reserve = http("Reserve_root", "POST", add_folder(), private)
    root_meta = http("Read_new_root", "GET", endpoint("Folder", suffix="?$select=UniqueId,ServerRelativeUrl,ItemCount"), reserve)
    root_acl = http("Read_root_acl", "GET", endpoint("Folder", suffix=ACL_SUFFIX), root_meta)
    root_ok = guard("Require_new_empty_private_root", _all(
        _eq("@empty(body('%s')?['UniqueId'])" % root_meta, False),
        _eq(_value(root_meta, "ServerRelativeUrl"), "@" + paths()),
        _eq("@int(body('%s')?['ItemCount'])" % root_meta, 0), acl_tests(root_acl)), root_acl)

    sentinel = "reservation-sentinel.bin"
    sentinel_create = create("Create_sentinel_A", sentinel, "A", root_ok)
    sentinel_before = metadata("Read_sentinel_before", sentinel, sentinel_create)
    sentinel_bytes = content("Read_sentinel_bytes", sentinel, sentinel_before)
    sentinel_ok = guard("Require_sentinel_A", _all(sane_file(sentinel_before, sentinel, "A"),
                                                 bytes_match(sentinel_bytes, "A")), sentinel_bytes)
    duplicate = http("Duplicate_root_reservation", "POST", add_folder(), sentinel_ok)
    duplicate_ok = guard("Require_duplicate_collision", collision_test(duplicate),
                         deps={duplicate: ["Succeeded", "Failed"]})
    root_after = http("Read_root_after_duplicate", "GET", endpoint("Folder", suffix="?$select=UniqueId,ServerRelativeUrl,ItemCount"), duplicate_ok)
    sentinel_after = metadata("Read_sentinel_after_duplicate", sentinel, root_after)
    sentinel_after_bytes = content("Read_sentinel_after_duplicate_bytes", sentinel, sentinel_after)
    duplicate_unchanged = guard("Require_reservation_unchanged", _all(
        _eq(_value(root_meta, "UniqueId"), _value(root_after, "UniqueId")),
        _eq(_value(root_meta, "ServerRelativeUrl"), _value(root_after, "ServerRelativeUrl")),
        _eq("@int(body('%s')?['ItemCount'])" % root_after, 1),
        unchanged(sentinel_before, sentinel_after), bytes_match(sentinel_after_bytes, "A")), sentinel_after_bytes)

    reserve_race_a = http("Reserve_race_A", "POST", add_folder("reservation-race"), duplicate_unchanged)
    reserve_race_b = http("Reserve_race_B", "POST", add_folder("reservation-race"), duplicate_unchanged)
    reserve_race_ok = guard("Require_reservation_race", one_winner_test(reserve_race_a, reserve_race_b),
        deps={reserve_race_a: ["Succeeded", "Failed"], reserve_race_b: ["Succeeded", "Failed"]})
    race_folder = http("Read_race_folder", "GET", endpoint("Folder", "reservation-race", "?$select=UniqueId,ServerRelativeUrl,ItemCount"), reserve_race_ok)
    race_folder_ok = guard("Require_race_folder", _all(_eq("@empty(body('%s')?['UniqueId'])" % race_folder, False),
        _eq(_value(race_folder, "ServerRelativeUrl"), "@" + path("reservation-race")),
        _eq("@int(body('%s')?['ItemCount'])" % race_folder, 0)), race_folder)

    # First publish A; then a deliberately different B must not replace A.
    first_source, first_target, conflict_source = "publish-A.bin", "published.bin", "conflict-B.bin"
    first_create = create("Create_publish_A", first_source, "A", race_folder_ok)
    first_meta = metadata("Read_publish_A", first_source, first_create)
    first_bytes = content("Read_publish_A_bytes", first_source, first_meta)
    first_ok = guard("Require_publish_A", _all(sane_file(first_meta, first_source, "A"), bytes_match(first_bytes, "A")), first_bytes)
    first_move = move("Publish_first_A", first_source, first_target, first_ok)
    target_before = metadata("Read_target_before_conflict", first_target, first_move)
    target_before_bytes = content("Read_target_before_conflict_bytes", first_target, target_before)
    published_ok = guard("Require_first_publish", _all(sane_file(target_before, first_target, "A"),
        _eq(_value(first_meta, "UniqueId"), _value(target_before, "UniqueId")), bytes_match(target_before_bytes, "A")), target_before_bytes)
    conflict_create = create("Create_conflict_B", conflict_source, "B", published_ok)
    conflict_meta = metadata("Read_conflict_B", conflict_source, conflict_create)
    conflict_bytes = content("Read_conflict_B_bytes", conflict_source, conflict_meta)
    conflict_ok = guard("Require_conflict_B", _all(sane_file(conflict_meta, conflict_source, "B"),
        bytes_match(conflict_bytes, "B")), conflict_bytes)
    conflict_move = move("Publish_conflicting_B", conflict_source, first_target, conflict_ok)
    conflict_rejected = guard("Require_publish_collision", collision_test(conflict_move),
        deps={conflict_move: ["Succeeded", "Failed"]})
    target_after = metadata("Read_target_after_conflict", first_target, conflict_rejected)
    target_after_bytes = content("Read_target_after_conflict_bytes", first_target, target_after)
    conflict_after = metadata("Read_conflict_source_after", conflict_source, target_after_bytes)
    conflict_after_bytes = content("Read_conflict_source_after_bytes", conflict_source, conflict_after)
    conflict_unchanged = guard("Require_publish_unchanged", _all(unchanged(target_before, target_after),
        bytes_match(target_after_bytes, "A"), unchanged(conflict_meta, conflict_after),
        bytes_match(conflict_after_bytes, "B")), conflict_after_bytes)

    # Actual independent WDL actions compete for one destination server path.
    race_target = "race-published.bin"
    race_create_a = create("Create_move_race_A", "race-A.bin", "A", conflict_unchanged)
    race_create_b = create("Create_move_race_B", "race-B.bin", "B", conflict_unchanged)
    race_meta_a = metadata("Read_move_race_A", "race-A.bin", race_create_a)
    race_meta_b = metadata("Read_move_race_B", "race-B.bin", race_create_b)
    race_bytes_a = content("Read_move_race_A_bytes", "race-A.bin", race_meta_a)
    race_bytes_b = content("Read_move_race_B_bytes", "race-B.bin", race_meta_b)
    race_sources_ok = guard("Require_move_race_sources", _all(
        sane_file(race_meta_a, "race-A.bin", "A"), sane_file(race_meta_b, "race-B.bin", "B"),
        bytes_match(race_bytes_a, "A"), bytes_match(race_bytes_b, "B"),
        _eq("@equals(body('%s')?['UniqueId'],body('%s')?['UniqueId'])" % (race_meta_a, race_meta_b), False)),
        deps={race_bytes_a: ["Succeeded"], race_bytes_b: ["Succeeded"]})
    race_move_a = move("Competing_move_A", "race-A.bin", race_target, race_sources_ok)
    race_move_b = move("Competing_move_B", "race-B.bin", race_target, race_sources_ok)
    race_moves_ok = guard("Require_move_race", one_winner_test(race_move_a, race_move_b),
        deps={race_move_a: ["Succeeded", "Failed"], race_move_b: ["Succeeded", "Failed"]})
    race_target_meta = metadata("Read_race_target", race_target, race_moves_ok)
    race_target_bytes = content("Read_race_target_bytes", race_target, race_target_meta)
    winner_ok = guard("Require_race_winner_preserved", _any(*[
        _all(_eq(_status(move_action), "Succeeded"), sane_file(race_target_meta, race_target, label),
             _eq(_value(race_target_meta, "UniqueId"), _value(meta, "UniqueId")), bytes_match(race_target_bytes, label))
        for label, move_action, meta in (("A", race_move_a, race_meta_a), ("B", race_move_b, race_meta_b))]), race_target_bytes)

    def file_receipt(meta):
        return {key: _value(meta, key) for key in FILE_FIELDS}

    projection = name("Project_receipt")
    receipt = name("Receipt")
    add(projection, {"type": "Compose", "runAfter": {winner_ok: ["Succeeded"]}, "inputs": {
        "schemaVersion": "shuttle.binary-upload-gate.receipt.v1", "status": "PASS_RUNTIME_CANARY_ONLY",
        "scope": "PRIVATE_SYNTHETIC_SUBTREE_NO_JOB_MUTATIONS", "runId": "@workflow()?['run']?['name']",
        "serverRelativeRoot": "@" + paths(), "expectedFixtureSha256": hashes,
        "fixtureByteLength": {k: len(v) for k, v in FIXTURES.items()},
        "byteVerification": "EXACT_NATIVE_BASE64_CONTENT_EQUALITY_NOT_RUNTIME_HASH_FUNCTION",
        "folderReservation": {"firstStatus": _status(reserve), "duplicateStatus": _status(duplicate),
                              "collisionCode": DOC_ALREADY_EXISTS, "folderId": _value(root_after, "UniqueId")},
        "folderRace": {"A": _status(reserve_race_a), "B": _status(reserve_race_b),
                       "folderId": _value(race_folder, "UniqueId")},
        "firstPublish": file_receipt(target_after),
        "conflictingPublish": {"status": _status(conflict_move), "collisionCode": DOC_ALREADY_EXISTS,
                                "targetAndSourceUnchanged": True},
        "moveRace": {"A": _status(race_move_a), "B": _status(race_move_b),
                     "winner": "@if(equals(actions('%s')?['status'],'Succeeded'),'A','B')" % race_move_a,
                     "target": file_receipt(race_target_meta)},
        "excluded": ["arbitrary administrator writes", "Dataverse/SharePoint transaction", "production concurrency guarantee"],
    }, "runtimeConfiguration": {"secureData": {"properties": ["inputs"]}}})
    # Deliberate synthetic token-free projection; never expose connector bodies,
    # authentication, headers, binary payloads, lease tokens, or connections.
    add(receipt, {"type": "Compose", "inputs": "@outputs('%s')" % projection,
                  "runAfter": {projection: ["Succeeded"]}})
    return {"actions": actions, "lastGateName": receipt, "receiptActionName": receipt,
            "fixtureSha256": hashes}
