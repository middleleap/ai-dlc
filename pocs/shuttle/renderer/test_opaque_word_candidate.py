"""Static slice and limited predicate tests; no workflow or Microsoft execution."""
import base64
from copy import deepcopy
import json
import re
import unittest

from opaque_word_candidate import build_opaque_word_candidate, canonical_sha256


SITE = "https://example.sharepoint.com/sites/Synthetic"
REQUEST = "91e8b40b-219e-4f4b-9b13-2c7a0c577c03"
STAGE = "/PrivatePacks/fictional-case/_fresh-stage"
FINAL = "/PrivatePacks/fictional-case/" + REQUEST + ".docx"
FIELDS = "UniqueId,UIVersionLabel,ETag,Length,ServerRelativeUrl"


def fixture():
    def call(operation, parameters, predecessor):
        return {"type": "OpenApiConnection", "inputs": {"host": {
            "apiId": "/providers/Microsoft.PowerApps/apis/shared_sharepointonline",
            "connectionName": "existing_fixture_connection", "operationId": operation},
            "parameters": {"dataset": SITE, **parameters},
            "authentication": "@parameters('$authentication')", "retryPolicy": {"type": "none"}},
            "runtimeConfiguration": {"secureData": {"properties": ["inputs", "outputs"]}},
            "runAfter": {predecessor: ["Succeeded"]}}
    old = "/sites/Synthetic" + STAGE + "/" + REQUEST + ".docx"
    final = "/sites/Synthetic" + FINAL
    headers = {"Accept": "application/json;odata=nometadata"}
    actions = {
        "Upload_staged_binary": call("CreateFile", {"folderPath": STAGE,
            "name": REQUEST + ".docx", "body": "@body('Populate')"}, "If_binary_stage_empty"),
        "Read_staged_binary": call("GetFileContentByPath", {"path": STAGE + "/" + REQUEST + ".docx",
            "inferContentType": False}, "Upload_staged_binary"),
        "If_staged_bytes_match": {"type": "If", "expression": {"and": [
            {"equals": ["@empty(body('Populate')?['$content'])", False]},
            {"equals": ["@body('Read_staged_binary')?['$content']", "@body('Populate')?['$content']"]}]},
            "actions": {}, "else": {"actions": {"Stop_BINARY_STAGE_BYTES_MISMATCH": {
                "type": "Terminate", "inputs": {"runStatus": "Failed", "runError": {
                    "code": "SHUTTLE_OPAQUE_CANDIDATE_BINARY_STAGE_BYTES_MISMATCH",
                    "message": "Opaque upload verification failed; no success or recovery is implied."}}}}},
            "runAfter": {"Read_staged_binary": ["Succeeded"]}},
        "Create_if_absent": call("HttpRequest", {"parameters/method": "POST",
            "parameters/uri": "_api/web/GetFileByServerRelativeUrl('%s')/MoveTo(newUrl='%s',flags=0)" % (old, final),
            "parameters/headers": headers}, "If_staged_bytes_match"),
        "Read_saved_metadata": call("HttpRequest", {"parameters/method": "GET",
            "parameters/uri": "_api/web/GetFileByServerRelativeUrl('%s')?$select=%s" % (final, FIELDS),
            "parameters/headers": headers}, "Ensure_file_acl_unique")}
    return {"schemaVersion": "shuttle.opaque-word-source.v1", "actions": actions}


def candidate(source=None, **changes):
    source = fixture() if source is None else source
    args = {"reviewed_source_sha256": canonical_sha256(source), "site_url": SITE,
            "stage_folder_native": STAGE, "final_file_native": FINAL, "request_key": REQUEST}
    args.update(changes)
    return build_opaque_word_candidate(source, **args)


def evaluate(predicate, bodies):
    """Independent restricted expression interpreter; not a WDL implementation."""
    def operand(value):
        if not isinstance(value, str) or not value.startswith("@"):
            return value
        source, pos = value[1:], 0

        def invoke(name, args):
            if name == "body":
                return bodies[args[0]]
            if name == "coalesce":
                return next((a for a in args if a is not None), None)
            if name == "empty":
                if not isinstance(args[0], (str, list, dict)):
                    raise ValueError("unsupported empty operand")
                return not args[0]
            if name == "string":
                return args[0] if isinstance(args[0], str) else json.dumps(args[0])
            if name == "strongEquals":
                if type(args[0]) is not type(args[1]):
                    raise ValueError("different operand types")
                return args[0] == args[1]
            if name == "equals":
                return args[0] == args[1]
            if name == "base64ToBinary":
                if type(args[0]) is not str:
                    raise ValueError("non-string binary envelope")
                return base64.b64decode(args[0], validate=True)
            if name == "int":
                if type(args[0]) not in (str, int) or not re.fullmatch(r"[0-9]+", str(args[0])):
                    raise ValueError("invalid integer metadata")
                return int(args[0])
            raise AssertionError("unexpected expression function " + name)

        def parse():
            nonlocal pos
            literal = re.match(r"'([^']*)'", source[pos:])
            if literal:
                pos += literal.end()
                result = literal[1]
            else:
                function = re.match(r"([A-Za-z][A-Za-z0-9]*)\(", source[pos:])
                if function is None:
                    raise AssertionError("unsupported expression " + value)
                pos += function.end()
                args = []
                while source[pos] != ")":
                    args.append(parse())
                    if source[pos] != ",":
                        break
                    pos += 1
                if source[pos] != ")":
                    raise AssertionError("invalid closing delimiter")
                pos += 1
                result = invoke(function[1], args)
            while source.startswith("?[", pos):
                pos += 2
                key = parse()
                if source[pos] != "]":
                    raise AssertionError("invalid property delimiter")
                pos += 1
                if result is not None and not isinstance(result, dict):
                    raise ValueError("non-object binary or metadata envelope")
                result = result.get(key) if result is not None else None
            return result
        result = parse()
        if pos != len(source):
            raise AssertionError("unused expression text")
        return result
    if "and" in predicate:
        return all([evaluate(child, bodies) for child in predicate["and"]])
    operator, values = next(iter(predicate.items()))
    left, right = [operand(v) for v in values]
    if operator == "equals":
        return left == right
    if operator == "greater":
        return left > right
    if operator == "lessOrEquals":
        return left <= right
    raise AssertionError("unexpected predicate operator " + operator)


class OpaqueWordCandidateTests(unittest.TestCase):
    def test_static_contract_and_equivalence_of_unmodified_fields(self):
        source = fixture(); original = deepcopy(source)
        output = candidate(source)
        self.assertEqual(source, original)
        self.assertEqual(output["status"], "STATIC_CANDIDATE_ONLY_NOT_INSTALLABLE")
        self.assertNotIn("workflows", output)
        self.assertEqual(output["sourceCanonicalSha256"], canonical_sha256(source))
        self.assertEqual(output["actions"]["Read_saved_metadata"], source["actions"]["Read_saved_metadata"])
        self.assertEqual(output["requiredRecordRunAfter"], {"If_published_bytes_and_identity_match": ["Succeeded"]})
        self.assertEqual(len(output["externalPrerequisitesNotValidated"]), 8)
        for name in ("Upload_staged_binary", "Create_if_absent", "Read_staged_binary"):
            before, after = source["actions"][name], output["actions"][name]
            for field in ("host", "authentication", "retryPolicy"):
                self.assertEqual(before["inputs"][field], after["inputs"][field])
            self.assertEqual(before["runtimeConfiguration"], after["runtimeConfiguration"])

    def test_opaque_binary_bodyless_move_and_exact_read_dependency_chain(self):
        actions = candidate()["actions"]
        self.assertEqual(actions["Upload_staged_binary"]["inputs"]["parameters"]["name"], REQUEST + ".bin")
        self.assertEqual(actions["Upload_staged_binary"]["inputs"]["parameters"]["body"], "@body('Populate')")
        move = actions["Create_if_absent"]["inputs"]["parameters"]
        self.assertIn(".bin')/MoveTo(newUrl=", move["parameters/uri"])
        self.assertTrue(move["parameters/uri"].endswith(".docx',flags=0)"))
        self.assertNotIn("parameters/body", move)
        for name, predecessor in (("Read_staged_metadata", "Upload_staged_binary"),
                ("Read_staged_binary", "Read_staged_metadata"),
                ("Read_staged_metadata_after", "Read_staged_binary"),
                ("If_staged_bytes_match", "Read_staged_metadata_after"),
                ("Create_if_absent", "If_staged_bytes_match"),
                ("Read_published_binary", "If_file_acl_matches"),
                ("Read_published_metadata_after", "Read_published_binary"),
                ("If_published_bytes_and_identity_match", "Read_published_metadata_after")):
            self.assertEqual(actions[name]["runAfter"], {predecessor: ["Succeeded"]})
        for action in actions.values():
            if action["type"] == "OpenApiConnection":
                self.assertEqual(action["inputs"]["retryPolicy"], {"type": "none"})
                self.assertEqual(action["runtimeConfiguration"]["secureData"]["properties"], ["inputs", "outputs"])
        self.assertFalse(any(a["type"] in ("Until", "Foreach", "Wait", "Recurrence") for a in actions.values()))

    def test_unknown_or_weakened_slice_rejected_even_with_recomputed_pin(self):
        def param(a, name, key, value):
            a[name]["inputs"]["parameters"][key] = value
        mutations = [
            lambda a: a.update(extra={"type": "Compose", "inputs": "unknown"}),
            lambda a: a.update(Upload_staged_binary=[]),
            lambda a: a["Read_staged_binary"]["inputs"].update(authentication="literal-secret"),
            lambda a: a["Read_staged_binary"]["inputs"]["host"].update(connectionName="other_connection"),
            lambda a: a["Create_if_absent"]["inputs"].update(retryPolicy={"type": "fixed", "count": 1}),
            lambda a: a["Upload_staged_binary"].update(runtimeConfiguration={}),
            lambda a: param(a, "Upload_staged_binary", "body", "@string(body('Populate'))"),
            lambda a: param(a, "Create_if_absent", "parameters/body", "@body('Populate')"),
            lambda a: param(a, "Create_if_absent", "parameters/uri", "unreviewed-move"),
            lambda a: param(a, "Read_staged_binary", "inferContentType", 0),
            lambda a: a["Read_saved_metadata"].update(runAfter={"Ensure_file_acl_unique": ["Failed"]}),
            lambda a: a["If_staged_bytes_match"]["actions"].update(unreviewed={"type": "Compose", "inputs": "ok"}),
            lambda a: a["If_staged_bytes_match"]["else"]["actions"]["Stop_BINARY_STAGE_BYTES_MISMATCH"]["inputs"].update(runStatus="Succeeded"),
            lambda a: a["If_staged_bytes_match"]["expression"]["and"][0].update(equals=["@empty(body('Populate')?['$content'])", 0])]
        for mutate in mutations:
            source = fixture(); mutate(source["actions"])
            with self.subTest(mutation=mutate), self.assertRaises(ValueError):
                candidate(source)

    def test_unreviewed_hash_or_injected_paths_rejected(self):
        with self.assertRaises(ValueError):
            candidate(reviewed_source_sha256="0" * 64)
        for key, values in {
                "site_url": ["http://example.com/sites/Synthetic", "https://user:secret@example.com/sites/X", SITE + "?x=1"],
                "stage_folder_native": [STAGE + "/..", STAGE + "'", STAGE + "/@{workflow()}", "/Other/fresh"],
                "final_file_native": [FINAL + "'", FINAL.replace(".docx", ".bin"), "/Other/" + REQUEST + ".docx"],
                "request_key": ["not-a-uuid", "00000000-0000-0000-0000-000000000000"]}.items():
            for value in values:
                with self.subTest(key=key, value=value), self.assertRaises(ValueError):
                    candidate(**{key: value})

    def test_authority_expressions_and_escaping_rejected_with_matching_datasets_and_pin(self):
        urls = [
            "https://@{workflow()}.example.com/sites/Synthetic",
            "https://@example.sharepoint.com/sites/Synthetic",
            "https://user@example.sharepoint.com/sites/Synthetic",
            "https://example@{workflow()}.sharepoint.com/sites/Synthetic",
            "https://example%2esharepoint.com/sites/Synthetic",
            "https://example.sharepoint.com\\@evil.example/sites/Synthetic",
            "https://example.sharepoint.com:443/sites/Synthetic",
            "https://example.sharepoint.com./sites/Synthetic",
            "https://EXAMPLE.sharepoint.com/sites/Synthetic",
            "https://éxample.sharepoint.com/sites/Synthetic",
            "https://example.sharepoint.com.evil.example/sites/Synthetic",
            "https://[::1]/sites/Synthetic",
            SITE + "?", SITE + "#", SITE + "\n",
            "https://exa\nmple.sharepoint.com/sites/Synthetic",
        ]
        for url in urls:
            source = fixture()
            for action in source["actions"].values():
                if action["type"] == "OpenApiConnection":
                    action["inputs"]["parameters"]["dataset"] = url
            with self.subTest(url=url), self.assertRaisesRegex(ValueError, "canonical HTTPS DNS SharePoint"):
                candidate(source, site_url=url)

    def bodies(self):
        stage = "/sites/Synthetic" + STAGE + "/" + REQUEST + ".bin"
        meta = {"UniqueId": "fixture-file", "UIVersionLabel": "1.0", "ETag": '"fixture,1"',
                "Length": "3", "ServerRelativeUrl": stage}
        saved = {**meta, "UIVersionLabel": "2.0", "ETag": '"fixture,2"', "ServerRelativeUrl": "/sites/Synthetic" + FINAL}
        return {"Populate": {"$content": "AAH/"}, "Read_staged_binary": {"$content": "AAH/"},
                "Read_staged_metadata": meta, "Read_staged_metadata_after": deepcopy(meta),
                "Read_saved_metadata": saved, "Read_published_binary": {"$content": "AAH/"},
                "Read_published_metadata_after": deepcopy(saved)}

    def assert_closed(self, gate, bodies):
        action = candidate()["actions"][gate]
        try:
            self.assertFalse(evaluate(action["expression"], bodies))
        except (ValueError, TypeError):
            pass  # An expression error also cannot satisfy Succeeded.
        self.assertEqual(action["actions"], {})
        stop = next(iter(action["else"]["actions"].values()))
        self.assertEqual(stop["inputs"]["runStatus"], "Failed")
        self.assertNotIn("$content", json.dumps(stop))

    def test_predicates_accept_exact_bytes_and_bracketed_identity_only(self):
        for gate in ("If_staged_bytes_match", "If_published_bytes_and_identity_match"):
            self.assertTrue(evaluate(candidate()["actions"][gate]["expression"], self.bodies()))
        for meta, gate in (("Read_staged_metadata_after", "If_staged_bytes_match"),
                           ("Read_published_metadata_after", "If_published_bytes_and_identity_match")):
            for field, value in (("UniqueId", "replaced"), ("UIVersionLabel", "99.0"), ("ETag", '"changed"'),
                                 ("Length", "4"), ("ServerRelativeUrl", "/other")):
                bad = self.bodies(); bad[meta][field] = value
                with self.subTest(meta=meta, field=field):
                    self.assert_closed(gate, bad)
                bad = self.bodies(); del bad[meta][field]
                self.assert_closed(gate, bad)

    def test_empty_wrong_type_invalid_base64_and_changed_content_cannot_pass(self):
        for name, gate in (("Read_staged_binary", "If_staged_bytes_match"),
                           ("Read_published_binary", "If_published_bytes_and_identity_match")):
            for value in ("", None, "invalid@", "AA==", True, ["AAH/"], {"bytes": "AAH/"}):
                bad = self.bodies(); bad[name]["$content"] = value
                with self.subTest(name=name, value=value):
                    self.assert_closed(gate, bad)
            bad = self.bodies(); bad["Populate"]["$content"] = bad[name]["$content"] = "invalid@"
            self.assert_closed(gate, bad)

    def test_final_replacement_length_and_nonstring_identity_are_rejected(self):
        gate = "If_published_bytes_and_identity_match"
        for field, value in (("UniqueId", "other-file"), ("Length", "4"), ("ETag", ["tag"]),
                             ("Length", "0"), ("Length", "10485761"), ("ServerRelativeUrl", "/wrong.docx")):
            bad = self.bodies()
            bad["Read_saved_metadata"][field] = bad["Read_published_metadata_after"][field] = value
            with self.subTest(field=field, value=value):
                self.assert_closed(gate, bad)


if __name__ == "__main__":
    unittest.main()
