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
  # Canonicalize so ../, symlinks, or odd prefixes cannot dodge the match.
  if command -v realpath >/dev/null 2>&1; then
    canonical=$(realpath -m -- "$file_path" 2>/dev/null || printf '%s' "$file_path")
  else
    canonical="$file_path"
  fi
  for spec in $SPEC_PATHS; do
    case "$canonical" in
      */"$spec" | "$spec")
        deny "Spec tripwire: $spec must not change on a working branch ($branch). The contract changes via its own spec-only PR first — use the spec-change skill (branch feature/<ID>-spec-<slug>)." ;;
    esac
  done
  exit 0
fi

# ── Bash: the command names the contract and carries a write signal ─────────────────────────
for spec in $SPEC_PATHS; do
  name="${spec##*/}"
  if printf '%s' "$command" | grep -Fq -- "$name"; then
    if printf '%s' "$command" | grep -Eq -- '(^|[^<])>|\bsed\s+(-[a-zA-Z]*i|--in-place)|\btee\b|\b(mv|cp|rm|dd|truncate|install)\b|\bgit\s+(mv|rm|checkout|restore)\b|\b(python[0-9.]*|node|perl|ruby|php)\b|\byq\b.*\s-i\b|<<'; then
      deny "Spec tripwire: this shell command names $spec and looks like a write (redirection, sed -i, mv/cp/rm, a scripting runtime, a heredoc) on a working branch ($branch). The contract changes via its own spec-only PR — use the spec-change skill (branch feature/<ID>-spec-<slug>). Reading it (cat, grep, git diff) is fine."
    fi
  fi
done

exit 0
