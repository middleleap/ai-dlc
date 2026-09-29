#!/usr/bin/env bash
# PreToolUse tripwire (Write|Edit|MultiEdit|NotebookEdit, and Bash): the API contract is ground
# truth and changes via its own spec-only PR (see the spec-change skill) — never mid-feature.
# Blocks edits to the contract file on the loop's working branches (feature/*, claude/*), except
# dedicated spec branches (…-spec-…).
#
# 2.1.0 — three holes closed: `claude/*` branches were not covered (test-tripwire covered them,
# this hook did not); only one spelling of the contract path was known (openapi.yml, .json slipped);
# and a shell command that rewrote the contract (`sed -i`, `>`, `git mv`, `python -c`) never
# reached this hook at all. On the Bash tool the command string is inspected: a command that names
# a contract path AND carries a write signal is denied; a read (`cat`, `git diff`, `grep`) is not.
#
# Configure spec_paths in .loom/project.json; the literal below is a legacy fallback.
set -euo pipefail

SPEC_PATHS="specs/openapi.yaml specs/openapi.yml specs/openapi.json"

# Fail CLOSED if jq is absent: without it the hook cannot tell whether this edit touches the API
# contract, so it must deny rather than silently exit non-zero (a non-blocking error = silent disarm).
if ! command -v jq >/dev/null 2>&1; then
  printf '%s\n' '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Spec tripwire cannot run: jq is not installed, so it cannot verify whether this edit touches the API contract. Failing closed — install jq."}}'
  exit 0
fi

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.notebook_path // ""')
command=$(printf '%s' "$input" | jq -r '.tool_input.command // ""')
[ -n "$file_path" ] || [ -n "$command" ] || exit 0

deny() {
  jq -n --arg reason "$1" \
    '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$reason}}'
  exit 0
}

branch=$(git -C "${CLAUDE_PROJECT_DIR:-.}" branch --show-current 2>/dev/null || true)
# Only the loop's working branches are tripwired; a dedicated spec branch is the sanctioned lane.
case "$branch" in
  feature/* | claude/*) ;;
  *) exit 0 ;;
esac
case "$branch" in
  *-spec-*) exit 0 ;;
esac

# Allow a direct repair of this one configuration file, even when it is malformed or
# missing. Do not exempt arbitrary Bash text that mentions it: that could bundle contract writes.
case "$file_path" in
  .loom/project.json | "${CLAUDE_PROJECT_DIR:-.}/.loom/project.json") exit 0 ;;
esac

project_config="${CLAUDE_PROJECT_DIR:-.}/.loom/project.json"
if [ -f "$project_config" ]; then
  if ! SPEC_PATHS=$(jq -er '
    select(.schema == "loom.project/v1") | .spec_paths |
    select(type == "array" and length > 0) |
    select(all(.[]; type == "string" and test("^[A-Za-z0-9_./-]+$") and (startswith("/") | not) and (split("/") | all(.[]; . != "" and . != "." and . != "..")))) | join(" ")' "$project_config" 2>/dev/null); then
    deny "Spec tripwire: .loom/project.json has invalid spec_paths. Restore valid project configuration."
  fi
elif [ -f "${CLAUDE_PROJECT_DIR:-.}/.loom/adoption.json" ]; then
  if ! jq -e '(.files | type) == "object"' "${CLAUDE_PROJECT_DIR:-.}/.loom/adoption.json" >/dev/null 2>&1; then
    deny "Spec tripwire: cannot read the adoption stamp to resolve project configuration."
  fi
  if jq -e '.files | has(".loom/project.json")' "${CLAUDE_PROJECT_DIR:-.}/.loom/adoption.json" >/dev/null; then
    deny "Spec tripwire: .loom/project.json is missing from this adoption. Restore it before continuing."
  fi
fi

# ── file tools: the path names the contract ──────────────────────────────────────────────────
if [ -n "$file_path" ]; then
  # Canonicalize so ../, symlinks, or odd prefixes cannot dodge the match. GNU `realpath -m` is
  # not on macOS, so resolve with node (always present: the gates are node): the real path of
  # the file if it exists, else of its nearest existing parent. The raw path is the fallback.
  case "$file_path" in /*) abs="$file_path" ;; *) abs="${CLAUDE_PROJECT_DIR:-$PWD}/$file_path" ;; esac
  canonical=$(node -e '
    const fs = require("fs"), path = require("path");
    let p = path.resolve(process.argv[1]), tail = "";
    for (;;) {
      try { process.stdout.write(path.join(fs.realpathSync(p), tail)); break; }
      catch { const up = path.dirname(p); if (up === p) { process.stdout.write(path.resolve(process.argv[1])); break; }
              tail = path.join(path.basename(p), tail); p = up; }
    }' -- "$abs" 2>/dev/null) || canonical="$abs"
  [ -n "$canonical" ] || canonical="$abs"
  for spec in $SPEC_PATHS; do
    case "$canonical" in
      */"$spec" | "$spec")
        deny "Spec tripwire: $spec must not change on a working branch ($branch). The contract changes via its own spec-only PR first — use the spec-change skill (branch feature/<ID>-spec-<slug>)." ;;
    esac
  done
  exit 0
fi

# ── Bash: the command names the contract and writes TO it ───────────────────────────────────
# A read that names the contract (cat, grep, git diff, codegen whose output goes elsewhere) is
# fine; the deny needs a write signal aimed at the contract path itself. POSIX classes rather
# than \b / \s, so BSD grep on macOS matches the same strings as GNU grep.
for spec in $SPEC_PATHS; do
  name="${spec##*/}"
  esc=$(printf '%s' "$name" | sed 's/[][\.*^$]/\\&/g')
  if printf '%s' "$command" | grep -Fq -- "$name"; then
    if printf '%s' "$command" | grep -Eq -- "(^|[^<])>>?[[:space:]]*[^[:space:]|;&]*${esc}" \
      || printf '%s' "$command" | grep -Eq -- "(^|[[:space:]])sed[[:space:]]+(-[a-zA-Z]*i|--in-place)[^|;&]*${esc}" \
      || printf '%s' "$command" | grep -Eq -- "(^|[[:space:]])(mv|cp|rm|dd|truncate|install|tee)[[:space:]][^|;&]*${esc}" \
      || printf '%s' "$command" | grep -Eq -- "(^|[[:space:]])git[[:space:]]+(mv|rm|checkout|restore)[[:space:]][^|;&]*${esc}" \
      || printf '%s' "$command" | grep -Eq -- "(^|[[:space:]])yq[[:space:]][^|;&]*[[:space:]]-i[[:space:]][^|;&]*${esc}" \
      || { printf '%s' "$command" | grep -Eq -- "(^|[[:space:]])(python[0-9.]*|node|perl|ruby|php)([[:space:]]|$)" \
           && printf '%s' "$command" | grep -Eq -- "writeFile|write_text|write\(|open\([^)]*['\"][wa]|unlink|rename|dump\(|copyfile|truncate|-i[[:space:]]"; }; then
      deny "Spec tripwire: this shell command names $spec and writes to it (redirection, sed -i, mv/cp/rm/tee, a scripting runtime with a write call) on a working branch ($branch). The contract changes via its own spec-only PR — use the spec-change skill (branch feature/<ID>-spec-<slug>). Reading it (cat, grep, git diff, codegen that writes elsewhere) is fine."
    fi
  fi
done

exit 0
