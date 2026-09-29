# Trigger evals

Each case checks that a prompt loads the right skill (and not its neighbours), via
`claude plugin eval` (`case.yaml`, schema 1.1).

**Known limitation (Claude Code 2.1.284, 29 Sep 2026):** this plugin declares `dependencies` in
its `plugin.json`, and the eval sandbox installs nothing, so the plugin under test fails to load
with `dependency-unsatisfied` and the "with" arm runs with no plugin at all. Neither `plugins:`
paths in a case nor sibling directories satisfy the dependency. Until the eval harness resolves
dependencies, a score of 0.00 from this suite says nothing about the skill descriptions — check
`plugin_errors` in a run's `trace.jsonl` (`--keep-temp`) before reading any result.
