# Runtime-neutral guardrails (Loom 2.0-rc.13 · WS4)

The Loom is distributed as a **Claude Code** plugin marketplace, so its pre-write guardrails
(`hooks/pii-guard.sh`, `spec-tripwire.sh`, `test-tripwire.sh`) are Claude Code-specific: they run
as `PreToolUse` hooks and block the *action* before it happens. An adopter whose agents run under a
different runtime does **not** get those blocks — and the Loom must never imply they do.

`guardrail-policy.json` is the neutral policy: for every guardrail and every runtime, it states
exactly what is enforced, what is caught by a CI backstop instead, and what is simply uncovered.
`scripts/guardrail-policy-check.mjs` verifies the policy is honest — every `enforced`/`ci-backstop`
claim names a mechanism that exists, every `uncovered` state names none, and a blocking guardrail
enforced nowhere must be flagged as an acknowledged gap. The **capability matrix** below is generated
from the policy and gated by `doc-integrity-check.mjs`, so it can never drift from what actually ships.

## Capability matrix

<!-- LOOM:GUARDRAIL-MATRIX:START -->
| Guardrail | Event | claude-code | github-actions | local-git |
|---|---|---|---|---|
| `pii-literal` | before-file-write | ● enforced | ◐ CI backstop | ○ uncovered |
| `test-integrity` | before-test-modification | ● enforced | ◐ CI backstop | ○ uncovered |
| `contract-freeze` | before-contract-modification | ● enforced | ◐ CI backstop | ○ uncovered |
| `control-plane-freeze` | before-file-write | ○ uncovered | ◐ CI backstop | ○ uncovered |
| `brainkit-immutability` | before-file-write | ○ uncovered | ◐ CI backstop | ○ uncovered |
| `network-egress` ⚠︎ | before-network-egress | ○ uncovered | ○ uncovered | ○ uncovered |
| `parser-fail-closed` | before-file-write | ● enforced | ◐ CI backstop | ○ uncovered |

_● enforced at the point of action · ◐ no local block but a CI gate catches it before merge (the enforcement of record) · ○ uncovered — no mechanism · ⚠︎ acknowledged gap (blocking, enforced nowhere). Generated from `guardrails/guardrail-policy.json` by `scripts/guardrail-policy-check.mjs`; do not edit by hand — run `node scripts/doc-integrity-check.mjs --fix`._
<!-- LOOM:GUARDRAIL-MATRIX:END -->

## The principle

**The CI gate is the enforcement of record.** A local hook is defence-in-depth that stops a bad
write at the point of action; where a runtime has no such hook, the guardrail is enforced by a CI
gate before merge (`◐ CI backstop`). Only `● enforced` means the action itself is blocked. `○
uncovered` is an honest gap — wire the named local hook (or a runtime-appropriate equivalent) to
close it. `⚠︎` marks a blocking guardrail that is enforced **nowhere** in the bundle (e.g.
network-egress, which needs an egress-controlled runner or sandbox — an adopter-side control).

## Adapters

- **`claude-code`** — the shipped `hooks/*.sh`, wired via `settings.hooks.json` as `PreToolUse`
  hooks. They fail **closed** (deny) when `jq` is missing, so a missing dependency cannot silently
  disarm a guard.
- **`github-actions`** — the CI gates (`scripts/*.mjs`) run on every PR. This is the enforcement of
  record: a control-plane write, a weakened test, a contract change or a PII literal that a local
  hook did not stop is caught here before merge.
- **`local-git`** — no pre-commit hooks ship today. To cover this runtime, wire the relevant
  `hooks/*.sh` as `pre-commit`/`pre-push` hooks; until then these cells read `○ uncovered`.
