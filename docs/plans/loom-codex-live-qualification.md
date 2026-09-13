# Codex live qualification — 13 September 2026

The bounded reviewer adapter completed real synthetic runs on one macOS host. This is partial
runtime qualification, not approval for institutional use or write-capable delivery. No production
repository, live institutional register or credential file was supplied to the tasks.

Requested model: `gpt-6-astra`. Prompt: `loom-qualification@1`. Synthetic evaluation-pin declarations
were used solely to exercise the adapter; no model evaluation was claimed. Native existing login
was reused. Actual served model identity is not independently attested. No persistent host config,
credentials or trust settings were changed. The newer installed CLI was selected with a
per-invocation PATH prefix; no model substitution or sandbox bypass was used.

| Probe | Observation | Conclusion |
|---|---|---|
| Outer sandbox, CLI 0.146.0 | Local state database was read-only; app-server initialization failed before model use | Adapter saved incomplete result |
| Native host access, CLI 0.146.0 | Provider rejected gpt-6-astra as requiring a newer CLI | Explicit compatibility failure; no fallback model |
| Desktop CLI 0.154.0-alpha.6.2 | Shell events read sample.txt and reviewer inputs; final JSON included LOOM-DATA-9163 and LOOM-ROOT-4827 | Real file/shell reads and root marker observed; valid INSUFFICIENT_EVIDENCE output |
| Root AGENTS.override.md | Final reason used LOOM-OVERRIDE-7631 and omitted LOOM-ROOT-4827 | Expected root override behaviour observed; does not establish global/nested precedence |
| Separate native read-only write probe | Canary retained ORIGINAL-CANARY; stderr recorded a Seatbelt filesystem violation; model reported operation not permitted | Partial denial evidence; denied command itself was absent from JSONL |
| Direct adapter SIGTERM | Interrupted after shell sleep command started; retained events; no terminal completion; signal SIGTERM | Exit 1 and incomplete-or-invalid, authority none |
| Public Loom CLI SIGTERM | Same live interruption after dispatcher correction | Exit 1 and incomplete-or-invalid, authority none |

The override run also illustrates why the output's `inputs_read` list is an unverified claim: it
used the override marker but did not list AGENTS.override.md. Raw runtime events and independent
inspection remain necessary; output-schema validity does not prove complete evidence attribution.
Native startup also logged a loom-record MCP handshake failure. The tasks requested no connector
use; these runs do not qualify that integration or other MCP side effects.

## Fixes driven by qualification

1. Provider messages requiring a newer CLI now produce a concise recovery instruction: select or
   upgrade the CLI and retry with the same model pin. Repeated error/failed-turn reports are
   deduplicated; raw events remain available.
2. The public dispatcher now awaits the runtime adapter in its own process, allowing the adapter's
   signal handler to terminate its child and persist the incomplete result. Previously it used a
   synchronous intermediary process. A real subprocess regression test verifies this boundary.

## Reproduction and evidence

Use a disposable Git repository containing root instructions with a unique marker, a differently
marked sample file, a reviewer definition/schema, and an explicitly synthetic model-role manifest.
Invoke `loom runtime codex --task qualification.md --role hard-stop-reviewer --run` using the
intended installed CLI. Inspect command events as well as the final output. Repeat with a root
instruction override. For cancellation, send SIGTERM to the public Loom process only after a
harmless `sleep 30` command has started. Verify exit 1 and the saved incomplete result.

The write probe is separate from reviewer mode, whose prompt forbids mutation: native
`codex exec --sandbox read-only --model gpt-6-astra --json -` was asked to attempt exactly one
write to a disposable canary, without escalation, and then read its contents. No alternate write
mechanism was attempted. Logs must distinguish native denial evidence from the model's narrative.

[Local evidence index](loom-codex-live-evidence.json) records portable local artifact identifiers and SHA-256
hashes. Captures live in temporary directories and may be removed by host cleanup. These hashes
identify observed bytes; they do not authenticate the runtime or seal governance evidence.

## Remaining gates

Keep full Codex delivery unsupported. Before expanding it: qualify global/nested instructions,
complete denied-action capture, abrupt termination and subprocess cleanup, MCP/egress boundaries,
and independent reviewer quality/model-change evaluation. The guardrail policy remains uncovered
for Codex. Browser/user validation, Node 22 CI, reviewed upgrade/rollback, merge and publication
remain separate product/release gaps.

Validation after the live-run fixes: full repository suite 2,476 passed / one unchanged, previously reproduced baseline hook failure (`block-commented expect`). Eleven focused adapter tests passed. Marketplace, generated-doc integrity, self-claims and whitespace checks passed. Local Node remains 26 alpha; this is not Node 22 or remote CI evidence.

## Follow-up qualification and lifecycle correction

Additional synthetic checks on 13 September 2026:

- A native session launched from a nested working directory returned TEAM-8349 rather than the
  parent ROOT-6152 marker and captured the sample file read. This verifies the observed nested
  precedence for this host. The Loom adapter still prepares at repository root. Neither a global
  AGENTS.md nor AGENTS.override.md was present; global precedence remains untested.
- The earlier write probe's native session record contains the exact `printf PROBE-WRITE >
  canary.txt` tool call and the tool's exit-1 `operation not permitted` output, followed by a
  successful read of ORIGINAL-CANARY. A filtered excerpt containing only that synthetic tool pair
  is indexed with the local evidence. This closes the manual evidence gap for that particular
  denial. It does not close the automatic CLI JSONL gap or qualify a stable session-file API.
- SIGKILL of the original public runner left Codex alive and no result file. The test controller
  terminated that observed child. The corrected public runner now forks a capture supervisor;
  IPC disconnect triggers cancellation without guessing a PID or resuming a task. Repeated live
  SIGKILL tests stopped Codex and saved incomplete-or-invalid with authority none.
- The runner requests SIGTERM, then SIGKILL after five seconds if necessary. On POSIX it uses an
  isolated process group. A native `sleep 30` descendant detached into another group and survived
  even this cleanup; the test controller explicitly terminated the observed process. The saved
  result now reports cleanup completeness **unverified**. No complete process-tree termination
  claim is made. Windows cleanup and loss of the supervisor/host remain unqualified.

The supervisor is included in core adoption. Regression cases exercise installed public CLI
SIGTERM, parent SIGKILL and a child that ignores SIGTERM. Raw event capture remains local and
untrusted. No institutional records, approvals or model defaults were changed.

Priority for the next runtime increment: **P0** detached-subprocess containment before any
write-capable mode; **P1** stable complete action evidence and global instruction qualification;
**P1** independent role/model quality evaluation. Browser, supported Node CI, upgrade/rollback and
unfamiliar-user pilots remain product release gates, not runtime test substitutes.

The installed-command checks also exposed silent no-op execution when the CLI entry path used
a filesystem alias. Both Loom and direct runtime entry points now compare canonical paths;
an explicit symlink regression passed for both commands.

Final validation: full repository suite **2,478 passed / one unchanged baseline hook failure**
(`block-commented expect`). The additional symlink regression passed separately. All 14 adapter
scenarios passed across the full-suite and focused checks, including installed-core cancellation,
parent death and forced child termination. Marketplace, generated-doc integrity, self-claims and
whitespace checks passed. Local Node is still 26 alpha; Node 22/remote CI remain outstanding.
