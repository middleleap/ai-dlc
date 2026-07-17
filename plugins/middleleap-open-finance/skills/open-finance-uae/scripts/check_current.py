#!/usr/bin/env python3
"""Check whether this skill's stated current standards version/errata is stale.

Why this exists: the skill hardcodes "current = v2.1-final + errataN" in its docs.
Errata and new version lines are published without warning, and a stale skill
quietly gives wrong field-level answers. This script compares what SKILL.md
claims against BOTH sources of truth:

  1. the Nebras-Open-Finance/api-specs repo (where errata folders are CUT), and
  2. the community hub Release Notes & Erratas register (where errata are PUBLISHED).

The repo can run ahead of the register (an errata folder staged before its
register entry exists). Per the ecosystem's own change policy, the register is
authoritative for "current", so the states are:

  FRESH   — skill == register == repo. Exit 0.
  PENDING — skill == register, but the repo has a newer errata folder staged.
            Published guidance unchanged; watch for the register entry. Exit 0.
  STALE   — the register (or, if the register is unreachable, the repo) is
            ahead of the skill. Update the skill. Exit 1.
  ERROR   — neither source reachable. Exit 2.

Note on GitHub 403s: unauthenticated api.github.com allows ~60 req/hr per IP.
A 403 here is almost always the rate limit (shared egress IPs exhaust it fast),
not a permissions problem — this script now says so and falls back to the
register-only check.

Usage:
  python3 check_current.py            # human-readable report
  python3 check_current.py --json     # machine-readable result
"""
from __future__ import annotations
import argparse
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from fetch_spec import list_tree  # noqa: E402  (shares the 15-min tree cache)

SKILL_MD = Path(__file__).resolve().parent.parent / "SKILL.md"
REGISTER_BASE = "https://nebras-open-finance.com/tech/release-notes-and-erratas"


def skill_stated_current(text: str) -> tuple[str, int]:
    """Highest vX.Y-errataN the skill declares as CURRENT (from the Quick Reference)."""
    m = re.search(r"current errata\s*=\s*\**v(\d+)\.(\d+)-errata(\d+)", text, re.IGNORECASE)
    if not m:
        hits = re.findall(r"v(\d+)\.(\d+)-errata(\d+)", text)
        if not hits:
            sys.exit("could not find a stated vX.Y-errataN in SKILL.md")
        t = max(hits, key=lambda t: (int(t[0]), int(t[1]), int(t[2])))
        return f"v{t[0]}.{t[1]}", int(t[2])
    return f"v{m.group(1)}.{m.group(2)}", int(m.group(3))


def repo_current(paths: list[str]) -> tuple[str, int, list[str]]:
    """Latest version line and its highest errata under dist/standards/, plus all lines seen."""
    lines: dict[str, int] = {}
    for p in paths:
        m = re.match(r"^dist/standards/v(\d+)\.(\d+)(?:-errata(\d+))?/", p)
        if not m:
            continue
        ver = f"v{m.group(1)}.{m.group(2)}"
        lines[ver] = max(lines.get(ver, 0), int(m.group(3) or 0))
    if not lines:
        sys.exit("no dist/standards/ version folders found in api-specs repo")
    latest = max(lines, key=lambda v: tuple(int(x) for x in v[1:].split(".")))
    return latest, lines[latest], sorted(lines)


def register_current(version_hint: str) -> tuple[str, int] | None:
    """Highest published vX.Y-errataN on the community hub register, or None if unreachable.

    Scans BOTH the register landing page and the versioned erratas page
    (erratas/{version}/). The landing page's summary text has been observed to
    lag behind the versioned page (13 Jul 2026: landing said errata2 while
    erratas/v2.1/ already listed the errata3 group), so the max across both is
    taken. version_hint is the skill's stated major.minor (e.g. "v2.1").
    """
    best: tuple[int, int, int] | None = None
    for url in (f"{REGISTER_BASE}/", f"{REGISTER_BASE}/erratas/{version_hint}/"):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "of-skill-check-current"})
            with urllib.request.urlopen(req, timeout=60) as r:
                html = r.read().decode("utf-8", errors="replace")
        except (urllib.error.URLError, OSError):
            continue
        for h in re.findall(r"v(\d+)\.(\d+)-errata(\d+)", html):
            t = (int(h[0]), int(h[1]), int(h[2]))
            best = max(best, t) if best else t
    if best is None:
        return None
    return f"v{best[0]}.{best[1]}", best[2]


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--json", action="store_true", help="emit machine-readable JSON")
    ap.add_argument("--no-cache", action="store_true", help="bypass the cached repo tree")
    args = ap.parse_args()

    stated = skill_stated_current(SKILL_MD.read_text())

    repo = None
    repo_lines: list[str] = []
    repo_note = None
    try:
        paths = list_tree(use_cache=not args.no_cache)
        v, n, repo_lines = repo_current(paths)
        repo = (v, n)
    except urllib.error.HTTPError as e:
        if e.code == 403:
            repo_note = ("GitHub API 403 — almost certainly the unauthenticated rate limit "
                         "(60 req/hr per IP), not a permissions issue. Retry later or check "
                         "the repo manually; continuing with the register-only check.")
        else:
            repo_note = f"GitHub API error: {e}"
    except Exception as e:  # network, parse, etc.
        repo_note = f"repo check failed: {e}"

    register = register_current(stated[0])

    if repo is None and register is None:
        print("error: neither the api-specs repo nor the register page is reachable",
              file=sys.stderr)
        if repo_note:
            print(f"  ({repo_note})", file=sys.stderr)
        sys.exit(2)

    # Authoritative comparison: register first, repo as staging signal / fallback.
    published = register or repo
    if stated < published:  # tuple compare: ("v2.1", 2) < ("v2.1", 3)
        status = "STALE"
    elif repo and register and repo > register:
        status = "PENDING"
    else:
        status = "FRESH"

    result = {
        "skill_states": f"{stated[0]}-errata{stated[1]}",
        "register_published": f"{register[0]}-errata{register[1]}" if register else None,
        "repo_latest": f"{repo[0]}-errata{repo[1]}" if repo else None,
        "all_version_lines_in_repo": repo_lines,
        "status": status,
        "note": repo_note,
    }
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"skill states current : {result['skill_states']}")
        print(f"register (published) : {result['register_published'] or 'unreachable'}")
        print(f"repo latest (cut)    : {result['repo_latest'] or 'unreachable'}")
        if repo_lines:
            print(f"version lines in repo: {', '.join(repo_lines)}")
        if repo_note:
            print(f"note                 : {repo_note}")
        if status == "FRESH":
            print("FRESH — the skill matches the published register (and repo, if reachable).")
        elif status == "PENDING":
            print("PENDING — the register still matches the skill, but the api-specs repo has a")
            print("newer errata folder staged ahead of publication. No skill change needed yet;")
            print("watch the Release Notes & Erratas page and re-run when it updates.")
        else:
            print("STALE — a newer published errata (or version line) exists. Re-verify against")
            print("the Release Notes & Erratas page, update the canonical locations in SKILL.md")
            print("('Keeping This Skill Current'), grep the skill for the old errata string, and")
            print("log the pass in references/verification-log.md.")
    sys.exit(0 if status in ("FRESH", "PENDING") else 1)


if __name__ == "__main__":
    main()
