#!/usr/bin/env python3
"""Validate the local synthetic contract fixtures, not a Microsoft deployment."""

from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path
import sys
import unicodedata

try:
    from jsonschema import Draft202012Validator, FormatChecker
except ImportError:
    raise SystemExit("Install the pinned development requirements before running: jsonschema is required.")

BASE = Path(__file__).resolve().parents[1]
NIL_UUID = "00000000-0000-0000-0000-000000000000"


class ContractError(ValueError):
    def __init__(self, code: str, detail: str):
        self.code = code
        super().__init__(f"{code}: {detail}")


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ContractError("DUPLICATE_PROPERTY", key)
        result[key] = value
    return result


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=unique_object)


def validate_unicode(value, path="$"):
    if isinstance(value, str):
        for char in value:
            category = unicodedata.category(char)
            if category == "Cs" or (category == "Cc" and char not in "\t\n\r"):
                raise ContractError("INVALID_TEXT", f"{path}: disallowed Unicode character")
    elif isinstance(value, dict):
        for key, child in value.items():
            validate_unicode(key, path)
            validate_unicode(child, f"{path}.{key}")
    elif isinstance(value, list):
        for index, child in enumerate(value):
            validate_unicode(child, f"{path}[{index}]")


def check_shape(validator, value):
    validate_unicode(value)
    errors = list(validator.iter_errors(value))
    if errors:
        first = sorted(errors, key=lambda err: str(list(err.path)))[0]
        raise ContractError("SCHEMA", f"{list(first.path)}: {first.message}")


def validate_case(value, validator, *, verify_files=True):
    check_shape(validator, value)
    if type(value["contentRevision"]) is not int:
        raise ContractError("INTEGER_REPRESENTATION", "contentRevision must use JSON integer notation, not decimal/exponent notation")
    fact_keys = [fact["key"] for fact in value["facts"]]
    if len(set(fact_keys)) != len(fact_keys):
        raise ContractError("DUPLICATE_FACT_KEY", "F1–F7 must each occur exactly once")
    source_ids = [source["id"] for source in value["sources"]]
    if len(set(source_ids)) != len(source_ids):
        raise ContractError("DUPLICATE_SOURCE_ID", "source register IDs must be unique")
    for source in value["sources"]:
        if source["asOfDate"] > value["sourceCutoff"]:
            raise ContractError("SOURCE_AFTER_CUTOFF", source["id"])
        if verify_files:
            path = (BASE / source["file"]).resolve()
            if not path.is_relative_to(BASE / "content" / "sources"):
                raise ContractError("SOURCE_PATH", "source must remain inside the declared source directory")
            if not path.is_file():
                raise ContractError("SOURCE_MISSING", source["id"])
            if hashlib.sha256(path.read_bytes()).hexdigest() != source["sha256"]:
                raise ContractError("SOURCE_HASH_MISMATCH", source["id"])
    for fact in value["facts"]:
        if any(source_id not in source_ids for source_id in fact["sourceIds"]):
            raise ContractError("UNKNOWN_SOURCE", fact["key"])
    return value


def validate_proposal(value, validator, case):
    check_shape(validator, value)
    if type(value["expectedContentRevision"]) is not int:
        raise ContractError("INTEGER_REPRESENTATION", "expectedContentRevision must use JSON integer notation, not decimal/exponent notation")
    if value["caseId"] != case["caseId"]:
        raise ContractError("CASE_FIXTURE_MISMATCH", "proposal must bind to the authored synthetic case")
    if value["kind"] == "PackDraft":
        sections = value["payload"]["sections"]
        keys = [section["key"] for section in sections]
        if len(set(keys)) != len(keys):
            raise ContractError("DUPLICATE_SECTION_KEY", "pack section keys must be unique")
        permitted = {source["id"] for source in case["sources"]}
        for section in sections:
            if any(source_id not in permitted for source_id in section["sourceIds"]):
                raise ContractError("UNKNOWN_SOURCE", section["key"])
    # Revision, receipt lookup, effective permissions and artifact currentness are
    # runtime/domain decisions. Do not make historical retries fail here merely
    # because the current case's content revision or artifact has changed.
    return value


def main():
    schemas = {name: load_json(BASE / "contracts" / f"{name}.schema.json") for name in ("case", "proposal")}
    for schema in schemas.values():
        Draft202012Validator.check_schema(schema)
    validators = {name: Draft202012Validator(schema, format_checker=FormatChecker()) for name, schema in schemas.items()}
    case = validate_case(load_json(BASE / "fixtures/case-alpha.json"), validators["case"])
    pack = validate_proposal(load_json(BASE / "fixtures/pack-draft.json"), validators["proposal"], case)
    comment = validate_proposal(load_json(BASE / "fixtures/inspection-comment.json"), validators["proposal"], case)

    passed = []

    def reject(name, base, mutate, expected_code, kind="proposal"):
        value = copy.deepcopy(base)
        mutate(value)
        try:
            if kind == "case":
                validate_case(value, validators["case"])
            else:
                validate_proposal(value, validators["proposal"], case)
        except ContractError as error:
            if error.code != expected_code:
                raise AssertionError(f"{name}: expected {expected_code}, got {error.code}") from error
            passed.append(name)
            return
        raise AssertionError(f"{name}: invalid value was accepted")

    reject("client-author-injection", pack, lambda value: value.update(author="someone-else"), "SCHEMA")
    reject("client-approval-injection", pack, lambda value: value["payload"].update(approved=True), "SCHEMA")
    reject("unsupported-kind", pack, lambda value: value.update(kind="Approve"), "SCHEMA")
    reject("wrong-schema-release", pack, lambda value: value.update(schemaVersion="shuttle.proposal.v9"), "SCHEMA")
    reject("nil-request-key", pack, lambda value: value.update(requestKey=NIL_UUID), "SCHEMA")
    reject("uppercase-request-key", pack, lambda value: value.update(requestKey=value["requestKey"].upper()), "SCHEMA")
    reject("request-key-final-newline", pack, lambda value: value.update(requestKey=value["requestKey"] + "\n"), "SCHEMA")
    reject("wrong-case-binding", pack, lambda value: value.update(caseId="22222222-2222-4222-8222-222222222222"), "CASE_FIXTURE_MISMATCH")
    reject("zero-revision", pack, lambda value: value.update(expectedContentRevision=0), "SCHEMA")
    reject("fractional-revision", pack, lambda value: value.update(expectedContentRevision=1.5), "SCHEMA")
    reject("oversized-revision", pack, lambda value: value.update(expectedContentRevision=2147483648), "SCHEMA")
    for notation in ("1.0", "1e0"):
        # Parse real wire JSON rather than assigning a language-level floating value.
        parsed_pack = json.loads(json.dumps(pack).replace('"expectedContentRevision": 1', '"expectedContentRevision": ' + notation, 1), object_pairs_hook=unique_object)
        reject("proposal-revision-notation-" + notation, parsed_pack, lambda value: None, "INTEGER_REPRESENTATION")
        parsed_case = json.loads(json.dumps(case).replace('"contentRevision": 1', '"contentRevision": ' + notation, 1), object_pairs_hook=unique_object)
        reject("case-revision-notation-" + notation, parsed_case, lambda value: None, "INTEGER_REPRESENTATION", "case")
    reject("duplicate-section-key", pack, lambda value: value["payload"]["sections"].append(copy.deepcopy(value["payload"]["sections"][0])), "DUPLICATE_SECTION_KEY")
    reject("duplicate-source-reference", pack, lambda value: value["payload"]["sections"][0].update(sourceIds=["S01", "S01"]), "SCHEMA")
    reject("unknown-source-reference", pack, lambda value: value["payload"]["sections"][0].update(sourceIds=["S99"]), "UNKNOWN_SOURCE")
    reject("source-id-final-newline", pack, lambda value: value["payload"]["sections"][0].update(sourceIds=["S01\n"]), "SCHEMA")
    reject("section-key-final-newline", pack, lambda value: value["payload"]["sections"][0].update(key="brief\n"), "SCHEMA")
    reject("missing-source-or-owner", pack, lambda value: (value["payload"]["sections"][0].update(sourceIds=[]), value["payload"]["sections"][0].pop("owedOwner")), "SCHEMA")
    reject("blank-owed-owner", pack, lambda value: value["payload"]["sections"][0].update(sourceIds=[], owedOwner=" \t\n"), "SCHEMA")
    reject("empty-comment", comment, lambda value: value["payload"].update(text=""), "SCHEMA")
    reject("overlong-comment", comment, lambda value: value["payload"].update(text="x" * 2001), "SCHEMA")
    reject("overlong-unicode-comment", comment, lambda value: value["payload"].update(text="😀" * 2001), "SCHEMA")
    reject("null-related-comment", comment, lambda value: value["payload"].update(relatedCommentId=None), "SCHEMA")
    reject("invalid-artifact-hash", comment, lambda value: value["payload"].update(artifactHash="A" * 64), "SCHEMA")
    reject("artifact-hash-final-newline", comment, lambda value: value["payload"].update(artifactHash="a" * 64 + "\n"), "SCHEMA")
    reject("comment-attachment-injection", comment, lambda value: value["payload"].update(attachment="file"), "SCHEMA")
    reject("comment-control-character", comment, lambda value: value["payload"].update(text="bad\u007ftext"), "INVALID_TEXT")
    reject("unpaired-surrogate", comment, lambda value: value["payload"].update(text="bad\ud800text"), "INVALID_TEXT")
    reject("duplicate-fact-key", case, lambda value: value["facts"][1].update(key="F1"), "DUPLICATE_FACT_KEY", "case")
    reject("duplicate-source-register-id", case, lambda value: value["sources"][1].update(id="S01"), "DUPLICATE_SOURCE_ID", "case")
    reject("source-after-cutoff", case, lambda value: value["sources"][0].update(asOfDate="2026-10-26"), "SOURCE_AFTER_CUTOFF", "case")
    reject("source-hash-mismatch", case, lambda value: value["sources"][0].update(sha256="0" * 64), "SOURCE_HASH_MISMATCH", "case")
    reject("source-path-traversal", case, lambda value: value["sources"][0].update(file="../README.md"), "SCHEMA", "case")
    reject("bank-data-fixture-flag", case, lambda value: value.update(synthetic=False), "SCHEMA", "case")

    try:
        json.loads('{"kind":"PackDraft","kind":"Approve"}', object_pairs_hook=unique_object)
    except ContractError as error:
        assert error.code == "DUPLICATE_PROPERTY"
        passed.append("duplicate-json-property")
    else:
        raise AssertionError("duplicate JSON property accepted")

    # Boundary checks document the intended Unicode length and plain-text contract.
    unicode_comment = copy.deepcopy(comment)
    unicode_comment["payload"]["text"] = "😀" * 2000
    validate_proposal(unicode_comment, validators["proposal"], case)
    inert_markup = copy.deepcopy(comment)
    inert_markup["payload"]["text"] = "<b>Literal markup is inert text; the UI must escape it.</b>"
    validate_proposal(inert_markup, validators["proposal"], case)
    owed_section = copy.deepcopy(pack)
    owed_section["payload"]["sections"][0]["sourceIds"] = []
    validate_proposal(owed_section, validators["proposal"], case)

    expected = (BASE / "content/expected-readiness-pack.md").read_text()
    for section in pack["payload"]["sections"]:
        assert "## " + section["title"] in expected, "golden pack missing section title"
        assert section["text"] in expected, "golden pack and proposal content diverged"
    assert "not a Cowork run" in expected
    native = load_json(BASE / "fixtures/native-evaluation-expectations.json")
    assert native["tenantTests"] == "NOT RUN"
    assert all(check["status"] == "NOT RUN" for check in native["checks"])
    print(json.dumps({
        "status": "LOCAL CHECK PASS", "schemas": 2, "validFixtures": 3,
        "sourceFilesVerified": len(case["sources"]), "negativeCases": len(passed),
        "negativeCasesPassed": passed, "boundaryCasesPassed": 3,
        "expectedPackContent": "MATCH", "tenantTests": "NOT RUN",
        "limits": "Schema and local fixture checks only; no Dataverse, identity, transaction, file ACL, renderer, Cowork or bank acceptance proof."
    }, indent=2))


if __name__ == "__main__":
    try:
        main()
    except (ContractError, AssertionError, json.JSONDecodeError, OSError) as error:
        print(f"LOCAL CHECK FAIL: {error}", file=sys.stderr)
        raise SystemExit(1)
