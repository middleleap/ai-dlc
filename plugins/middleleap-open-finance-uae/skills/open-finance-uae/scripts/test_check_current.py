"""Offline tests for check_current.py. Run: python3 scripts/test_check_current.py (Python 3.9+)."""
from __future__ import annotations

import io
import json
import sys
import unittest
import urllib.error
from contextlib import redirect_stdout
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))
import check_current as cc  # noqa: E402


def scope_blocked(*_a, **_k):
    raise urllib.error.HTTPError(
        "https://api.github.com/x", 403, "Forbidden", {},
        io.BytesIO(b"GitHub access to this repository is not enabled for this session. Use add_repo"))


class RepoFallback(unittest.TestCase):
    def run_json(self, raw_exists):
        stated = cc.skill_stated_current(cc.SKILL_MD.read_text())
        with mock.patch.object(cc, "list_tree", scope_blocked), \
             mock.patch.object(cc, "register_current", lambda _v: stated), \
             mock.patch.object(cc, "register_section_count", lambda *_a: None), \
             mock.patch.object(cc, "_raw_exists", raw_exists), \
             mock.patch.object(sys, "argv", ["check_current.py", "--json"]):
            out = io.StringIO()
            with redirect_stdout(out):
                try:
                    cc.main()
                except SystemExit:
                    pass
        return stated, json.loads(out.getvalue())

    def test_session_scope_403_still_reports_the_prerelease_line(self):
        stated, r = self.run_json(lambda p: "/v2.2-rc1/" in p)
        self.assertEqual(r["repo_latest"], f"{stated[0]}-errata{stated[1]}")
        self.assertIn("v2.2-rc1", json.dumps(r))
        self.assertIn("raw.githubusercontent.com", r.get("note") or r.get("repo_note") or json.dumps(r))

    def test_fallback_sees_a_new_errata_folder(self):
        v, n = cc.skill_stated_current(cc.SKILL_MD.read_text())
        _, r = self.run_json(lambda p: f"{v}-errata{n + 1}/" in p)
        self.assertEqual(r["repo_latest"], f"{v}-errata{n + 1}")


if __name__ == "__main__":
    unittest.main()
