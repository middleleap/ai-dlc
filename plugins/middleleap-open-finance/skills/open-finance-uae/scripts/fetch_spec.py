#!/usr/bin/env python3
"""Fetch the effective (errata-resolved) UAE Open Finance OpenAPI spec.

Why this exists: TPP-facing specs under dist/standards/ are corrected via errata
folders (v2.1-errata1, v2.1-errata2, ...) WITHOUT bumping the version. The
effective file is resolved PER FILE: the highest-numbered errata folder that
contains the file wins; otherwise fall back to the base version folder.
This script does that resolution so you never quote a superseded field.

Usage:
  python3 fetch_spec.py --list [--version v2.1]
      List all specs for the version with their effective (resolved) source path.

  python3 fetch_spec.py <name> [--version v2.1] [-o out.yaml]
      Fetch the errata-resolved spec. <name> may be the full filename or a
      substring, e.g. "account-information", "bank-initiation", "cop".

  python3 fetch_spec.py <name> --surface ozone-connect|api-hub
      LFI-side surfaces have no errata folders (corrected in place under
      vMAJOR.MINOR.x/); the latest matching folder is used.

Requires network access to api.github.com / raw.githubusercontent.com.
"""
from __future__ import annotations
import argparse
import json
import os
import re
import sys
import tempfile
import time
import urllib.request

ORG = "Nebras-Open-Finance"
REPO = "api-specs"

# Unauthenticated GitHub API allows only 60 requests/hour, so the repo tree
# listing is cached briefly. Repeated fetch/list calls in one session then cost
# a single API request. Use --no-cache (or delete the file) to force a refresh.
CACHE_TTL_SECONDS = 15 * 60
CACHE_FILE = os.path.join(tempfile.gettempdir(), f"of-uae-{ORG}-{REPO}-tree.json")


def http_get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "of-skill-fetch-spec"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def list_tree(use_cache: bool = True) -> list[str]:
    if use_cache:
        try:
            if time.time() - os.path.getmtime(CACHE_FILE) < CACHE_TTL_SECONDS:
                with open(CACHE_FILE) as fh:
                    return json.load(fh)
        except (OSError, ValueError):
            pass  # no cache / unreadable / corrupt — fall through to live fetch
    url = f"https://api.github.com/repos/{ORG}/{REPO}/git/trees/main?recursive=1"
    data = json.loads(http_get(url))
    if data.get("truncated"):
        print("warning: GitHub tree listing truncated; results may be incomplete", file=sys.stderr)
    paths = [t["path"] for t in data["tree"] if t["type"] == "blob"]
    try:
        with open(CACHE_FILE, "w") as fh:
            json.dump(paths, fh)
    except OSError:
        pass  # cache is best-effort
    return paths


def resolve_standards(paths: list[str], version: str) -> dict[str, tuple[int, str]]:
    """filename -> (errata_number, effective_repo_path); errata 0 = base."""
    rx = re.compile(rf"^dist/standards/{re.escape(version)}(?:-errata(\d+))?/([^/]+\.ya?ml)$")
    effective: dict[str, tuple[int, str]] = {}
    for p in paths:
        m = rx.match(p)
        if not m:
            continue
        n = int(m.group(1) or 0)
        fname = m.group(2)
        if fname not in effective or n > effective[fname][0]:
            effective[fname] = (n, p)
    return effective


def resolve_inplace(paths: list[str], surface: str, version: str) -> dict[str, str]:
    """ozone-connect / api-hub: folders are literal vMAJOR.MINOR.x (corrected in place;
    the spec's info.version third segment tracks the uplift, not the folder name)."""
    rx = re.compile(rf"^dist/{re.escape(surface)}/{re.escape(version)}\.x/(.+\.ya?ml)$")
    out = {}
    for p in paths:
        m = rx.match(p)
        if m:
            out[m.group(1)] = p
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("name", nargs="?", help="spec filename or substring")
    ap.add_argument("--version", default="v2.1", help="standards version line (default v2.1)")
    ap.add_argument("--surface", default="standards", choices=["standards", "ozone-connect", "api-hub"])
    ap.add_argument("--list", action="store_true", help="list specs and effective sources")
    ap.add_argument("-o", "--out", help="write fetched YAML to this file (default: stdout)")
    ap.add_argument("--no-cache", action="store_true",
                    help="bypass the cached repo tree listing (cache TTL 15 min)")
    args = ap.parse_args()

    paths = list_tree(use_cache=not args.no_cache)

    if args.surface == "standards":
        eff = {f: p for f, (n, p) in resolve_standards(paths, args.version).items()}
        labels = {f: (f"errata{n}" if n else "base") for f, (n, _) in resolve_standards(paths, args.version).items()}
    else:
        eff = resolve_inplace(paths, args.surface, args.version)
        labels = {f: "in-place latest" for f in eff}

    if args.list or not args.name:
        width = max((len(f) for f in eff), default=10)
        for f in sorted(eff):
            print(f"{f:<{width}}  [{labels[f]:>8}]  {eff[f]}")
        if not args.name:
            return

    matches = [f for f in eff if args.name == f] or [f for f in sorted(eff) if args.name.lower() in f.lower()]
    if not matches:
        sys.exit(f"no spec matching {args.name!r} for {args.surface}/{args.version}; run with --list")
    if len(matches) > 1:
        sys.exit("ambiguous name; matches:\n  " + "\n  ".join(matches))

    repo_path = eff[matches[0]]
    raw = http_get(f"https://raw.githubusercontent.com/{ORG}/{REPO}/main/{repo_path}")
    print(f"# effective source: {repo_path} [{labels[matches[0]]}]", file=sys.stderr)
    if args.out:
        with open(args.out, "wb") as fh:
            fh.write(raw)
        print(f"written: {args.out}", file=sys.stderr)
    else:
        sys.stdout.write(raw.decode())


if __name__ == "__main__":
    main()
