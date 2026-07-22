# Token telemetry — worked example

The macro ring's first instrument: the build loop's output-token spend, made measurable.

## Files

- `token-ledger.json` — four iterations across milestones M2 and M3 (mounts at
  `docs/governance/token-ledger.json`). The loop appends one entry per iteration at step 5
  (Record); this is an append-only ledger, not a hand-authored table.

## Report

```bash
node scripts/token-report.mjs           # aggregate per iteration + per milestone
node scripts/token-report.mjs --check   # validate the ledger is well-formed (a malformed ledger fails)
```

For the example above the report totals 65,245 output tokens across 4 iterations —
M2: 52,605, M3: 12,640.

## Not a gate

Cost is telemetry, not a control. `token-report.mjs` never blocks a merge on spend — the
review gate is the control (`delivery-harness.md`). Treating a token budget as a merge gate
would be a category error. `--check` validates *shape* only. The ledger seals into the release
evidence bundle at delivery step 8, so a release's cost is part of its record.
