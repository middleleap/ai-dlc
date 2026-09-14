# Recorded agent run — final report (verbatim)

Run: 2026-09-14, bounded subagent (Claude Code `Agent` tool, `general-purpose`), 7 tool calls,
~26 s. The task it received is `task.md`. It was told not to read `status-contract.repaired.json`
(the human-authored reference repair that existed at the time) and to produce its own; the
reference file was removed afterwards and the agent's output is now the only repaired contract.

The per-call tool log was not captured by the harness that ran it; what is kept is the task, the
one output file and this final report, exactly as returned.

---

- `timeout.outcome`: `"failed"` → `"unknown"` — a timeout is an indeterminate outcome, not a failure the customer can act on (PSI-R02).
- `timeout.status_query_before_retry`: `false` → `true` — the existing outcome must be investigated by status query before any retry (PSI-R04).
- `timeout.retry`: `"automatic"` → `"manual-after-status-query"` — automatic retry is the unsafe retry the obligation forbids; retry is declared as a non-automatic string (PSI-R04).
- Dropped the first-cut `_comment` (a field the check does not read, describing the defect); kept `schema`, `service_id`, `obligation_ids`, `client_deadline_ms`, `preserve_reference` (PSI-R01, PSI-R03) and `negative_test.ref`/`sha256` unchanged (PSI-R05).

Payment-status integrity gate — OK (1 contract)
