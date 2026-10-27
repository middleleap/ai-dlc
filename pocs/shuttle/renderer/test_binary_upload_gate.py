"""Offline contract/graph/adversarial tests; no Microsoft calls or runtime claim."""
from copy import deepcopy
import base64
import hashlib
import json
import re
import unittest

from binary_upload_gate import (DOC_ALREADY_EXISTS, FILE_FIELDS, FIXTURES,
                                build_binary_upload_gate, collision_test,
                                one_winner_test)


def connector(kind, operation, parameters, after=None):
    assert kind == "sharepoint"
    return {"type": "OpenApiConnection", "inputs": {"host": {
        "apiId": "/providers/Microsoft.PowerApps/apis/shared_sharepointonline",
        "connectionName": "existing_test_connection", "operationId": operation},
        "parameters": parameters, "authentication": "@parameters('$authentication')"},
        "runAfter": after or {}}


def options():
    # In-memory authoring fixtures only; never written as a runtime plan/import.
    return {"connector": connector, "site_url": "https://example.sharepoint.com/sites/Synthetic",
        "case_folder_server_relative": "/sites/Synthetic/PrivatePacks/91e8b40b-219e-4f4b-9b13-2c7a0c577c03",
        "case_folder_native": "/PrivatePacks/91e8b40b-219e-4f4b-9b13-2c7a0c577c03",
        "owner_principal_id": 42, "owner_role_id": 1073741829}


def all_actions(actions):
    found = dict(actions)
    for action in actions.values():
        for nested in (action.get("actions", {}), action.get("else", {}).get("actions", {})):
            found.update(all_actions(nested))
    return found


def depth(actions):
    return max((1 + max(depth(a.get("actions", {})), depth(a.get("else", {}).get("actions", {})))
                for a in actions.values()), default=0)


def leaves(value):
    if isinstance(value, dict):
        for sub in value.values():
            yield from leaves(sub)
    elif isinstance(value, list):
        for sub in value:
            yield from leaves(sub)
    else:
        yield value


def evaluate(predicate, events):
    """Independent, tiny evaluator for emitted collision predicate leaf subset.

    This evaluates adversarial status/error envelopes, not WDL or connector
    execution. Unsupported expressions/types raise, which also cannot be a pass.
    Parse a restricted WDL grammar; never evaluate message content as code.
    Deliberately evaluate and/or/if arguments eagerly. The documented numeric/
    boolean equivalence of equals() is modeled; strongEquals() enforces types.
    """
    def equivalent(left, right):
        left, right = "" if left is None else left, "" if right is None else right
        if type(left) is type(right):
            return left == right
        if isinstance(left, (bool, int, float)) and isinstance(right, (bool, int, float)):
            return left == right
        return False

    def operand(value):
        if not isinstance(value, str) or not value.startswith("@"):
            return value
        source, offset = value[1:], 0

        def invoke(function, args):
            if function in ("actions", "outputs", "body"):
                event = events[args[0]]
                return event.get("body") if function == "body" else event
            if function == "coalesce":
                return next((arg for arg in args if arg is not None), None)
            if function == "empty":
                raw = args[0]
                if not isinstance(raw, (dict, list, str)):
                    raise ValueError("empty requires an object, array or string")
                return not raw
            if function in ("first", "length", "last"):
                raw = args[0]
                if not isinstance(raw, (str, list)):
                    raise ValueError("invalid first/length/last input; runtime guard cannot pass")
                if function == "length":
                    return len(raw)
                return (raw[0] if function == "first" else raw[-1]) if raw else None
            if function in ("split", "startsWith", "trim"):
                if any(type(arg) is not str for arg in args):
                    raise ValueError("string function requires strings")
                if function == "trim":
                    return args[0].strip()
                return args[0].split(args[1]) if function == "split" else args[0].lower().startswith(args[1].lower())
            if function == "equals":
                return equivalent(*args)
            if function == "strongEquals":
                numeric = all(type(arg) in (int, float) for arg in args)
                if not numeric and type(args[0]) is not type(args[1]):
                    raise ValueError("strongEquals requires matching types")
                return args[0] == args[1]
            if function == "and":
                if any(type(arg) is not bool for arg in args):
                    raise ValueError("and requires boolean conditions")
                return all(args)
            if function == "string":
                raw = args[0]
                return raw if isinstance(raw, str) else "" if raw is None else json.dumps(raw, separators=(",", ":"))
            if function == "if":
                if type(args[0]) is not bool:
                    raise ValueError("if requires a boolean condition")
                return args[1] if args[0] else args[2]
            if function == "json":
                if type(args[0]) is not str:
                    raise ValueError("json requires a string")
                return json.loads(args[0])
            raise AssertionError("unsupported predicate function " + function)

        def parse():
            nonlocal offset
            literal = re.match(r"'((?:[^']|'')*)'", source[offset:])
            integer = re.match(r"-?\d+", source[offset:])
            if literal:
                offset += literal.end()
                result = literal[1].replace("''", "'")
            elif integer:
                offset += integer.end()
                result = int(integer[0])
            else:
                function = re.match(r"([A-Za-z]+)\(", source[offset:])
                if not function:
                    raise AssertionError("unsupported predicate leaf " + value)
                offset += function.end()
                args = []
                while source[offset] != ")":
                    args.append(parse())
                    if source[offset] == ",":
                        offset += 1
                    else:
                        break
                if source[offset] != ")":
                    raise AssertionError("missing function closing parenthesis")
                offset += 1
                result = invoke(function[1], args)
            while source.startswith("?[", offset):
                offset += 2
                key = parse()
                if source[offset] != "]":
                    raise AssertionError("missing property closing bracket")
                offset += 1
                if result is not None and not isinstance(result, dict):
                    raise ValueError("property selection requires an object")
                result = result.get(key) if result is not None else None
            return result

        result = parse()
        if offset != len(source):
            raise AssertionError("unconsumed predicate expression " + value)
        return result
    if "and" in predicate:
        return all([evaluate(term, events) for term in predicate["and"]])
    if "or" in predicate:
        return any([evaluate(term, events) for term in predicate["or"]])
    if "equals" in predicate:
        left, right = (operand(v) for v in predicate["equals"])
        return equivalent(left, right)
    raise AssertionError("unsupported predicate")


class BinaryUploadGateTests(unittest.TestCase):
    def setUp(self):
        self.output = build_binary_upload_gate(**options())
        self.actions = self.output["actions"]
        self.all = all_actions(self.actions)

    def action(self, suffix):
        return self.actions["Binary_upload_" + suffix]

    def test_reusable_existing_binding_flat_graph_no_job_or_existing_file_access(self):
        self.assertEqual(set(self.output), {"actions", "lastGateName", "receiptActionName", "fixtureSha256"})
        self.assertEqual(self.output["lastGateName"], "Binary_upload_Receipt")
        self.assertLessEqual(depth(self.actions), 2)
        self.assertFalse({"Until", "Foreach", "Wait", "Scope", "Recurrence"} & {a["type"] for a in self.all.values()})
        self.assertFalse(any(a.get("inputs", {}).get("host", {}).get("operationId") in
                             {"PerformUnboundAction", "GetItem", "UpdateRecord"}
                             for a in self.all.values() if isinstance(a.get("inputs"), dict)))
        for action in self.actions.values():
            if action["type"] != "OpenApiConnection":
                continue
            params = action["inputs"]["parameters"]
            operation = action["inputs"]["host"]["operationId"]
            self.assertIn(operation, {"HttpRequest", "CreateFile", "GetFileContentByPath"})
            self.assertNotIn("DELETE", params.values())
            if operation == "HttpRequest" and params["parameters/method"] == "POST":
                uri = params["parameters/uri"]
                self.assertTrue("AddWithOverwrite" in uri or "MoveTo" in uri)
                self.assertIn("outputs('Binary_upload_Paths')?['serverRoot']", uri)
            elif operation in ("CreateFile", "GetFileContentByPath"):
                key = "folderPath" if operation == "CreateFile" else "path"
                self.assertIn("outputs('Binary_upload_Paths')?['nativeRoot']", params[key])

    def test_rejects_wrong_target_pair_traversal_unsafe_prefix_and_bool_ids(self):
        changes = ({"case_folder_native": "/Other/Case"}, {"case_folder_native": "/Private/../Case"},
                   {"case_folder_server_relative": "/sites/Synthetic/PrivatePacks/case%2fescape"},
                   {"site_url": "https://user:password@example.sharepoint.com/sites/Synthetic"},
                   {"site_url": "https://example.sharepoint.com/sites/Synthetic?x=y"},
                   {"prefix": "bad'prefix"}, {"owner_principal_id": True},
                   {"owner_role_id": 0}, {"after": {"Before": ["Succeeded", "Failed"]}})
        for change in changes:
            with self.subTest(change=change), self.assertRaises(ValueError):
                build_binary_upload_gate(**{**options(), **change})

    def test_rejects_wrong_connector_factory_and_does_not_mutate_factory_actions(self):
        returned = []
        def reused(kind, operation, parameters, after):
            value = connector(kind, operation, parameters, after)
            value["inputs"]["retryPolicy"] = {"type": "exponential"}
            returned.append(value)
            return value
        build_binary_upload_gate(**{**options(), "connector": reused})
        self.assertTrue(all(v["inputs"]["retryPolicy"] == {"type": "exponential"} for v in returned))
        def wrong(kind, operation, parameters, after):
            value = connector(kind, operation, parameters, after)
            value["inputs"]["host"]["apiId"] = "/providers/Microsoft.PowerApps/apis/shared_other"
            return value
        with self.assertRaises(ValueError):
            build_binary_upload_gate(**{**options(), "connector": wrong})

    def test_private_acl_before_first_write_and_empty_private_root_before_binary_write(self):
        reserve = self.action("Reserve_root")
        self.assertEqual(reserve["runAfter"], {"Binary_upload_Require_private_parent": ["Succeeded"]})
        parent = json.dumps(self.action("Require_private_parent")["expression"])
        self.assertIn("HasUniqueRoleAssignments", parent)
        for field in ("PrincipalId", "PrincipalType", "RoleDefinitionBindings", "odata.nextLink"):
            self.assertIn(field, parent)
        self.assertEqual(self.action("Create_sentinel_A")["runAfter"],
                         {"Binary_upload_Require_new_empty_private_root": ["Succeeded"]})
        root = json.dumps(self.action("Require_new_empty_private_root")["expression"])
        self.assertIn("ItemCount", root)
        self.assertIn("PrincipalId", root)

    def test_every_connector_is_secure_no_retry_and_only_explicit_expected_failures_continue(self):
        failures = set()
        for name, action in self.actions.items():
            if action["type"] == "OpenApiConnection":
                self.assertEqual(action["inputs"]["retryPolicy"], {"type": "none"})
                self.assertEqual(action["runtimeConfiguration"]["secureData"]["properties"], ["inputs", "outputs"])
                self.assertNotIn("parameters/body", action["inputs"]["parameters"])
            for predecessor, statuses in action["runAfter"].items():
                self.assertIn(predecessor, self.actions)
                self.assertNotIn("TimedOut", statuses)
                self.assertNotIn("Skipped", statuses)
                if "Failed" in statuses:
                    self.assertEqual(action["type"], "If")
                    failures.add(name)
        self.assertEqual(failures, {"Binary_upload_Require_duplicate_collision", "Binary_upload_Require_reservation_race",
                                   "Binary_upload_Require_publish_collision", "Binary_upload_Require_move_race"})
        for action in self.actions.values():
            if action["type"] == "If":
                self.assertEqual(action["actions"], {})
                terminal = next(iter(action["else"]["actions"].values()))
                self.assertEqual(terminal["type"], "Terminate")
                self.assertEqual(terminal["inputs"]["runStatus"], "Failed")

    def test_generated_gate_uses_supported_compose_security(self):
        # The public helper has no private flow compiler or captured bindings.
        # Exercise its real generated graph and supported Compose protection.
        composes = {name: action for name, action in self.actions.items() if action["type"] == "Compose"}
        self.assertEqual(set(composes), {"Binary_upload_Paths", "Binary_upload_Project_receipt", "Binary_upload_Receipt"})
        for name in ("Binary_upload_Paths", "Binary_upload_Project_receipt"):
            self.assertEqual(composes[name]["runtimeConfiguration"]["secureData"]["properties"], ["inputs"])
        self.assertNotIn("runtimeConfiguration", composes["Binary_upload_Receipt"])

    def test_every_reference_is_to_an_ancestor_and_gate_receipt_has_no_bypass(self):
        def ancestors(name, seen=None):
            seen = set() if seen is None else seen
            for dependency in self.actions[name]["runAfter"]:
                self.assertIn(dependency, self.actions)
                self.assertNotEqual(dependency, name)
                if dependency not in seen:
                    seen.add(dependency)
                    ancestors(dependency, seen)
            return seen
        for name, action in self.actions.items():
            payload = {k: v for k, v in action.items() if k not in ("runAfter", "actions", "else")}
            refs = set(re.findall(r"(?:body|outputs|actions)\('([^']+)'\)", json.dumps(payload)))
            self.assertTrue(refs <= ancestors(name), (name, refs - ancestors(name)))
        receipt_ancestors = ancestors(self.output["lastGateName"])
        for suffix in ("Require_private_parent", "Reserve_root", "Require_duplicate_collision",
                       "Require_reservation_unchanged", "Require_reservation_race", "Require_move_race_sources",
                       "Require_first_publish", "Require_publish_collision", "Require_publish_unchanged",
                       "Require_move_race", "Require_race_winner_preserved"):
            self.assertIn("Binary_upload_" + suffix, receipt_ancestors)

    def test_wdl_object_equals_never_receives_a_literal_array_operand(self):
        def check(value):
            if isinstance(value, dict):
                if "equals" in value:
                    self.assertEqual(len(value["equals"]), 2)
                    self.assertFalse(any(isinstance(v, list) for v in value["equals"]), value)
                for nested in value.values():
                    check(nested)
            elif isinstance(value, list):
                for nested in value:
                    check(nested)
        check(self.actions)

    def test_binary_fixtures_cover_all_octets_and_differ_and_use_only_native_binary_paths(self):
        for label, value in FIXTURES.items():
            self.assertIn(bytes(range(256)), value)
            self.assertIn(("SHUTTLE_BINARY_CANARY_" + label).encode(), value)
            self.assertEqual(self.output["fixtureSha256"][label], hashlib.sha256(value).hexdigest())
        self.assertNotEqual(FIXTURES["A"], FIXTURES["B"])
        serialized = json.dumps(self.actions)
        self.assertNotIn("base64ToString", serialized)
        self.assertNotIn("base64(body", serialized)
        for action in self.actions.values():
            if action["type"] != "OpenApiConnection":
                continue
            if action.get("inputs", {}).get("host", {}).get("operationId") == "CreateFile":
                encoded = re.fullmatch(r"@base64ToBinary\('([^']+)'\)", action["inputs"]["parameters"]["body"])
                self.assertIsNotNone(encoded)
                self.assertIn(base64.b64decode(encoded[1]), FIXTURES.values())
            if action.get("inputs", {}).get("host", {}).get("operationId") == "GetFileContentByPath":
                self.assertIs(action["inputs"]["parameters"]["inferContentType"], False)
        self.assertIn("$content", serialized)

    def test_duplicate_reservation_checks_structured_collision_folder_and_sentinel_unchanged(self):
        self.assertEqual(self.action("Duplicate_root_reservation")["inputs"]["parameters"]["parameters/uri"],
                         self.action("Reserve_root")["inputs"]["parameters"]["parameters/uri"])
        self.assertIn("overwrite=false", self.action("Reserve_root")["inputs"]["parameters"]["parameters/uri"])
        expression = json.dumps(self.action("Require_reservation_unchanged")["expression"])
        for key in ("UniqueId", *FILE_FIELDS, "$content"):
            self.assertIn(key, expression)
        self.assertIn("Read_sentinel_before", expression)
        self.assertIn("Read_sentinel_after_duplicate", expression)

    def test_competing_reservations_are_parallel_to_same_path_and_join_both_results(self):
        left, right = self.action("Reserve_race_A"), self.action("Reserve_race_B")
        self.assertEqual(left["runAfter"], right["runAfter"])
        self.assertEqual(left["inputs"]["parameters"], right["inputs"]["parameters"])
        self.assertEqual(set(self.action("Require_reservation_race")["runAfter"]),
                         {"Binary_upload_Reserve_race_A", "Binary_upload_Reserve_race_B"})

    def test_publish_moves_never_send_bytes_and_conflict_checks_all_target_metadata_and_bytes(self):
        for suffix in ("Publish_first_A", "Publish_conflicting_B", "Competing_move_A", "Competing_move_B"):
            params = self.action(suffix)["inputs"]["parameters"]
            self.assertEqual(params["parameters/method"], "POST")
            self.assertIn("flags=0", params["parameters/uri"])
            self.assertNotIn("parameters/body", params)
            self.assertNotIn("overwrite=true", params["parameters/uri"])
        expression = json.dumps(self.action("Require_publish_unchanged")["expression"])
        for field in FILE_FIELDS:
            self.assertIn(field, expression)
        for action_name in ("Read_target_before_conflict", "Read_target_after_conflict",
                            "Read_target_after_conflict_bytes", "Read_conflict_B", "Read_conflict_source_after"):
            self.assertIn(action_name, expression)

    def test_competing_moves_parallel_and_winner_requires_exact_id_and_binary_content(self):
        left, right = self.action("Competing_move_A"), self.action("Competing_move_B")
        self.assertEqual(left["runAfter"], right["runAfter"])
        self.assertIn("race-published.bin", left["inputs"]["parameters"]["parameters/uri"])
        self.assertIn("race-published.bin", right["inputs"]["parameters"]["parameters/uri"])
        self.assertNotEqual(left["inputs"]["parameters"]["parameters/uri"], right["inputs"]["parameters"]["parameters/uri"])
        self.assertEqual(set(self.action("Require_move_race")["runAfter"]),
                         {"Binary_upload_Competing_move_A", "Binary_upload_Competing_move_B"})
        expression = json.dumps(self.action("Require_race_winner_preserved")["expression"])
        for label in ("A", "B"):
            self.assertIn("Competing_move_" + label, expression)
            self.assertIn("Read_move_race_" + label, expression)
            self.assertIn(base64.b64encode(FIXTURES[label]).decode(), expression)
        self.assertIn("UniqueId", expression)

    def test_receipt_is_token_free_whitelist_projection_and_external_dependency_is_supported(self):
        projection = self.action("Project_receipt")
        receipt = self.action("Receipt")
        self.assertEqual(receipt["inputs"], "@outputs('Binary_upload_Project_receipt')")
        self.assertEqual(receipt["runAfter"], {"Binary_upload_Project_receipt": ["Succeeded"]})
        self.assertNotIn("runtimeConfiguration", receipt)
        self.assertEqual(projection["runtimeConfiguration"]["secureData"]["properties"], ["inputs"])
        self.assertEqual(projection["inputs"]["status"], "PASS_RUNTIME_CANARY_ONLY")
        for forbidden in ("LeaseToken", "$authentication", "connectionName", "headers", "$content", "parameters/body"):
            self.assertNotIn(forbidden, json.dumps(projection["inputs"]))
        self.assertEqual(set(projection["inputs"]["firstPublish"]), set(FILE_FIELDS))
        second = build_binary_upload_gate(**{**options(), "prefix": "Other", "after": {"Reviewed_before": ["Succeeded"]}})
        self.assertEqual(second["actions"]["Other_Paths"]["runAfter"], {"Reviewed_before": ["Succeeded"]})
        self.assertFalse(set(self.actions).intersection(second["actions"]))


class CollisionPredicateTests(unittest.TestCase):
    def assert_fails_closed(self, event):
        try:
            self.assertFalse(evaluate(collision_test("X"), {"X": event}))
        except ValueError:
            pass  # A runtime expression/type error also prevents downstream success.

    def event(self, status="Failed", http=400, body=None):
        return {"status": status, "statusCode": http,
                "body": body if body is not None else {"errors": [DOC_ALREADY_EXISTS, "Microsoft.SharePoint.SPException"]}}

    def wrapped_event(self, *, code=DOC_ALREADY_EXISTS + ", Microsoft.SharePoint.SPException",
                      message_value="A file or folder with the name 'sentinel' already exists.",
                      trailer=True, **event_options):
        message = json.dumps({"odata.error": {"code": code, "message": {
            "lang": "en-US", "value": message_value}}}, separators=(",", ":"))
        if trailer:
            message += (" clientRequestId: 91e8b40b-219e-4f4b-9b13-2c7a0c577c03"
                        " serviceRequestId: 22222222-2222-4222-8222-222222222222")
        return self.event(body={"status": 400, "message": message,
            "source": "_api/web/GetFolderByServerRelativeUrl('/private')/Folders/AddWithOverwrite(url='/private/root',overwrite=false)"},
            **event_options)

    def test_observed_serialized_odata_connector_wrapper_is_accepted(self):
        for event in (self.wrapped_event(),
                      self.wrapped_event(message_value="Localized message without English collision words"),
                      self.wrapped_event(message_value="@{outputs('UNTRUSTED')} ' \\\" \\n")):
            with self.subTest(event=event):
                self.assertTrue(evaluate(collision_test("X"), {"X": event}))

    def test_missing_or_null_errors_are_normalized_before_empty(self):
        for errors in (None, []):
            event = self.wrapped_event()
            event["body"]["errors"] = errors
            self.assertTrue(evaluate(collision_test("X"), {"X": event}))
        with self.assertRaises(ValueError):
            evaluate({"equals": ["@empty(body('X')?['missing'])", True]}, {"X": self.event()})

    def test_evaluator_models_documented_equals_coercion_and_strong_equals_types(self):
        self.assertTrue(evaluate({"equals": ["@equals(json('true'),json('1'))", True]}, {}))
        self.assertTrue(evaluate({"equals": ["@strongEquals(json('1'),json('1.0'))", True]}, {}))
        with self.assertRaises(ValueError):
            evaluate({"equals": ["@strongEquals(json('true'),json('1'))", True]}, {})

    def test_wrapped_collision_requires_exact_exception_code_and_numeric_statuses(self):
        invalid = [self.wrapped_event(code=code) for code in (
            DOC_ALREADY_EXISTS, DOC_ALREADY_EXISTS + ", UnknownException",
            DOC_ALREADY_EXISTS + ", Microsoft.SharePoint.SPException,extra",
            DOC_ALREADY_EXISTS + "0, Microsoft.SharePoint.SPException",
            "prefix" + DOC_ALREADY_EXISTS + ", Microsoft.SharePoint.SPException",
            "-2147024891, System.UnauthorizedAccessException", int(DOC_ALREADY_EXISTS),
            [DOC_ALREADY_EXISTS, "Microsoft.SharePoint.SPException"],
            "@{concat('" + DOC_ALREADY_EXISTS + "',', Microsoft.SharePoint.SPException')}")]
        invalid.append(self.wrapped_event(trailer=False))
        invalid += [self.wrapped_event(http=status) for status in (200, 403, 409, 500, "400", None, True)]
        invalid += [self.wrapped_event(status=status) for status in ("Succeeded", "TimedOut", "Skipped", None)]
        for status in (403, 409, 500, "400", None, True):
            event = self.wrapped_event()
            event["body"]["status"] = status
            invalid.append(event)
        for message in (None, 400, True, [], {}, {"odata.error": {
                "code": DOC_ALREADY_EXISTS + ", Microsoft.SharePoint.SPException"}},
                {"odata.error": {"code": DOC_ALREADY_EXISTS + ", Microsoft.SharePoint.SPException",
                                  "message": "clientRequestId: injected marker"}}):
            event = self.wrapped_event()
            event["body"]["message"] = message
            invalid.append(event)
        for event in invalid:
            with self.subTest(event=event):
                self.assert_fails_closed(event)

    def test_unrelated_error_and_message_injection_cannot_supply_collision_code(self):
        invalid_messages = (
            "already exists " + DOC_ALREADY_EXISTS,
            "prefix " + self.wrapped_event()["body"]["message"],
            json.dumps({"error": {"code": DOC_ALREADY_EXISTS + ", Microsoft.SharePoint.SPException"}}),
            json.dumps({"odata.error": {"code": "AccessDenied", "message": {"value":
                DOC_ALREADY_EXISTS + ", Microsoft.SharePoint.SPException"}}}, separators=(",", ":")),
            '{"odata.error":{"code":"' + DOC_ALREADY_EXISTS + ', Microsoft.SharePoint.SPException",'
                '"code":"AccessDenied"}}',
            '@{json(\'{"odata.error":{"code":"' + DOC_ALREADY_EXISTS + ', Microsoft.SharePoint.SPException"}}\')}',
        )
        for message in invalid_messages:
            with self.subTest(message=message):
                event = self.wrapped_event()
                event["body"]["message"] = message
                self.assertFalse(evaluate(collision_test("X"), {"X": event}))

    def test_wrapper_trailer_marker_cannot_be_injected_into_json_or_repeated(self):
        invalid = [self.wrapped_event(message_value="clientRequestId: injected marker"),
                   self.wrapped_event(message_value="clientRequestId: injected marker", trailer=False)]
        repeated = self.wrapped_event()
        repeated["body"]["message"] += " clientRequestId: injected extra marker"
        invalid.append(repeated)
        for event in invalid:
            with self.subTest(event=event):
                self.assert_fails_closed(event)

    def test_actual_wrapper_accepts_whitespace_before_correlation_trailer(self):
        for separator in (" ", "\n", "\r\n"):
            event = self.wrapped_event()
            event["body"]["message"] = event["body"]["message"].replace(" clientRequestId: ", separator + "clientRequestId: ")
            self.assertTrue(evaluate(collision_test("X"), {"X": event}))

    def test_malformed_serialized_wrapper_cannot_pass(self):
        for message in ('{"odata.error":', '{"odata.error":{"code":"' + DOC_ALREADY_EXISTS,
                        self.wrapped_event(trailer=False)["body"]["message"] + " trailing garbage",
                        '{"odata.error":"not an object"}',
                        '{"odata.error":{"code":"' + DOC_ALREADY_EXISTS + ', Microsoft.SharePoint.SPException"}'
                        ):
            with self.subTest(message=message), self.assertRaises(ValueError):
                event = self.wrapped_event()
                event["body"]["message"] = message + " clientRequestId: 91e8b40b-219e-4f4b-9b13-2c7a0c577c03"
                evaluate(collision_test("X"), {"X": event})

    def test_only_known_structured_collision_is_accepted(self):
        valid = (self.event(), self.event(body={"errors": [DOC_ALREADY_EXISTS]}),
                 self.event(http=409, body={"error": {"code": DOC_ALREADY_EXISTS + ", Microsoft.SharePoint.SPException"}}),
                 self.event(http=500, body={"odata.error": {"code": DOC_ALREADY_EXISTS}}))
        for event in valid:
            self.assertTrue(evaluate(collision_test("X"), {"X": event}))
        invalid = (self.event(status="Succeeded"), self.event(status="TimedOut"), self.event(http=403),
                   self.event(http=404), self.event(body={}), self.event(body={"message": "already exists " + DOC_ALREADY_EXISTS}),
                   self.event(body={"errors": ["prefix" + DOC_ALREADY_EXISTS]}),
                   self.event(body={"errors": "prefix" + DOC_ALREADY_EXISTS}),
                   self.event(body={"errors": DOC_ALREADY_EXISTS}),
                   self.event(body={"errors": []}), self.event(body={"errors": [int(DOC_ALREADY_EXISTS)]}),
                   self.event(body={"errors": [[DOC_ALREADY_EXISTS]]}),
                   self.event(body={"errors": [DOC_ALREADY_EXISTS, "UnknownExtraValue"]}),
                   self.event(body={"errors": [DOC_ALREADY_EXISTS, "UnknownExtraValue", "Microsoft.SharePoint.SPException"]}),
                   self.event(body={"error": {"code": "AccessDenied"}}),
                   self.event(body={"odata.error": {"code": "UnknownCollision"}}))
        for event in invalid:
            with self.subTest(event=event):
                self.assertFalse(evaluate(collision_test("X"), {"X": event}))

    def test_legacy_structured_paths_do_not_parse_accompanying_malformed_message(self):
        for body in ({"errors": [DOC_ALREADY_EXISTS]},
                     {"errors": [DOC_ALREADY_EXISTS, "Microsoft.SharePoint.SPException"]},
                     {"error": {"code": DOC_ALREADY_EXISTS + ", Microsoft.SharePoint.SPException"}},
                     {"odata.error": {"code": DOC_ALREADY_EXISTS}}):
            with self.subTest(body=body):
                body["message"] = '{"odata.error":malformed clientRequestId: correlation'
                self.assertTrue(evaluate(collision_test("X"), {"X": self.event(body=body)}))

    def test_malformed_non_sequence_errors_raise_and_cannot_pass(self):
        for malformed in ({}, {"first": DOC_ALREADY_EXISTS}, int(DOC_ALREADY_EXISTS), True):
            with self.subTest(errors=malformed), self.assertRaises(ValueError):
                evaluate(collision_test("X"), {"X": self.event(body={"errors": malformed})})

    def test_race_requires_exactly_one_success_and_one_specific_collision(self):
        success, collision = self.event(status="Succeeded", http=200, body={}), self.event()
        unknown = self.event(body={"error": {"code": "AccessDenied"}})
        for left, right in ((success, collision), (collision, success)):
            self.assertTrue(evaluate(one_winner_test("A", "B"), {"A": left, "B": right}))
        for left, right in ((success, success), (collision, collision), (success, unknown),
                            (unknown, success), (collision, unknown), (success, self.event(status="TimedOut"))):
            self.assertFalse(evaluate(one_winner_test("A", "B"), {"A": left, "B": right}))


if __name__ == "__main__":
    unittest.main()
