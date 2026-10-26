#!/usr/bin/env python3
"""Verify that portable fixtures, embedded bytes and compiled policy pins agree."""
import hashlib
import json
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
case = json.loads((root / "fixtures/case-alpha.json").read_text())
embedded = json.loads((root / "src/Shuttle.Dataverse/fixtures/embedded-sources.json").read_text())
pins = dict(re.findall(r'\{ "(S[0-9]{2})", "([a-f0-9]{64})" \}', (root / "src/Shuttle.Dataverse/EmbeddedSourcePolicy.cs").read_text()))
rows = {row["id"]: row for row in embedded["sources"]}
assert set(pins) == set(rows) == {row["id"] for row in case["sources"]} == {"S01", "S02", "S03", "S04"}
assert len(rows) == len(embedded["sources"]) == len(case["sources"])
for row in case["sources"]:
    raw = (root / row["file"]).read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    assert row["sha256"] == rows[row["id"]]["sha256"] == pins[row["id"]] == digest, row["id"]
    assert rows[row["id"]]["content"].encode("utf-8") == raw, row["id"]
print("PUBLIC FIXTURE BINDINGS PASS: four source files, embedded bytes and compiled pins agree")
