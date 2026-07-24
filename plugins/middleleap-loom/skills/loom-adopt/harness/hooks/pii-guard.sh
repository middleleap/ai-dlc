#!/usr/bin/env bash
# PreToolUse guard (Write|Edit|MultiEdit|NotebookEdit): blocks content introducing PII-shaped literals.
# Loom hard stop: no real PII in fixtures, test names, logs, or telemetry — synthetic data only.
#
# ADOPT: the patterns below are the UAE instance (Emirates ID, UAE IBAN). Swap or extend
# them with the PII shapes of your jurisdiction; keep the deny-with-reason structure.
# Synthetic conventions enforced:
#   - Emirates IDs: real IDs start 784… → blocked (separator-insensitive). Synthetic fixtures use the 999 prefix.
#   - UAE IBANs: blocked unless bank code is 000 (AEkk000…) — the synthetic marker (separator-insensitive).
set -euo pipefail

# Fail CLOSED if jq is absent: a compliance guard that cannot parse its input must deny, not
# silently exit non-zero (which Claude Code treats as a NON-blocking error — a silent disarm).
# The deny JSON is emitted without jq precisely because jq is what is missing.
if ! command -v jq >/dev/null 2>&1; then
  printf '%s\n' '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"PII guard cannot run: jq is not installed, so this write cannot be scanned for PII-shaped literals. Failing closed — install jq to enable the guard."}}'
  exit 0
fi

input=$(cat)
content=$(printf '%s' "$input" | jq -r '
  (.tool_input.content // "") + "\n" +
  (.tool_input.new_string // "") + "\n" +
  (.tool_input.new_source // "") + "\n" +
  ([.tool_input.edits[]?.new_string // empty] | join("\n"))')
# Separator-insensitive copy: spacing/hyphen/DOT grouping must not evade the patterns (a
# dot-separated Emirates ID like 784.1990.1234567.1 slipped a space/hyphen-only strip). IBANs are
# upcased so a lowercase ae07… cannot dodge the uppercase pattern.
normalized=$(printf '%s' "$content" | tr -d ' \t.-' | tr '[:lower:]' '[:upper:]')

deny() {
  jq -n --arg reason "$1" \
    '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$reason}}'
  exit 0
}

# Emirates ID: 784 + 12 digits (15 total), any separator grouping.
if printf '%s' "$normalized" | grep -Eq '784[0-9]{12}'; then
  deny "PII guard: Emirates-ID-shaped literal (784…) detected. Real Emirates IDs are forbidden everywhere (CLAUDE.md hard stop). Synthetic fixtures must use the 999 prefix, e.g. 999-1990-1234567-1."
fi

ibans=$(printf '%s' "$normalized" | grep -Eo 'AE[0-9]{21}' || true)
if [ -n "$ibans" ]; then
  bad=$(printf '%s\n' "$ibans" | grep -Ev '^AE[0-9]{2}000' || true)
  if [ -n "$bad" ]; then
    deny "PII guard: real-shaped UAE IBAN detected ($(printf '%s' "$bad" | head -1)…). Synthetic IBANs must use bank code 000 (AEkk000…), per the no-PII hard stop."
  fi
fi

exit 0
