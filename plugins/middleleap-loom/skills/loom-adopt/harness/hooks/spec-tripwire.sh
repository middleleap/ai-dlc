#!/usr/bin/env bash
# PreToolUse tripwire (Write|Edit): the API contract is ground truth and changes
# via its own spec-only PR (see the spec-change skill) — never mid-feature.
# Blocks edits to the contract file while on feature/* branches, except dedicated
# spec branches (feature/<ID>-spec-<slug>).
#
# ADOPT: set SPEC_PATH to your project's contract file.
set -euo pipefail

SPEC_PATH="specs/openapi.yaml"

# Fail CLOSED if jq is absent: without it the hook cannot tell whether this edit touches the API
# contract, so it must deny rather than silently exit non-zero (a non-blocking error = silent disarm).
if ! command -v jq >/dev/null 2>&1; then
  printf '%s\n' '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Spec tripwire cannot run: jq is not installed, so it cannot verify whether this edit touches the API contract. Failing closed — install jq."}}'
  exit 0
fi

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.notebook_path // ""')
[ -n "$file_path" ] || exit 0

# Canonicalize so ../, symlinks, or odd prefixes cannot dodge the match.
if command -v realpath >/dev/null 2>&1; then
  canonical=$(realpath -m -- "$file_path" 2>/dev/null || printf '%s' "$file_path")
else
  canonical="$file_path"
fi

case "$canonical" in
  */"$SPEC_PATH" | "$SPEC_PATH") ;;
  *) exit 0 ;;
esac

branch=$(git -C "${CLAUDE_PROJECT_DIR:-.}" branch --show-current 2>/dev/null || true)

if [[ "$branch" == feature/* && "$branch" != *-spec-* ]]; then
  jq -n --arg reason "Spec tripwire: $SPEC_PATH must not change on a feature branch ($branch). The contract changes via its own spec-only PR first — use the spec-change skill (branch feature/<ID>-spec-<slug>)." \
    '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$reason}}'
  exit 0
fi

exit 0
