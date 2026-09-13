# Project settings and CI migration

`.loom/project.json` is project-owned data: contract paths, feature ID pattern and project
verification commands. Contract paths are repository-relative without whitespace or traversal.
The feature pattern is an anchored regular expression without flags. Verification commands are
arrays of executable and literal arguments, run from the repository root with no shell expansion.
If a shell script is needed, name a reviewed repository script explicitly. Empty command lists do
not pass verification. No command list by itself proves adequate coverage.

The spec hook reads `spec_paths`; the discovery checker reads `feature_pattern`.
`loom verify-project` runs `verification_commands` and stops on the first failure, missing program
or timeout. `loom configure` checks the presence of the configured contract and command list.
The configuration is covered by CODEOWNERS and the routine-change floor. Configured contracts
also block routine claims. Include `.loom/project.json` in HG-0007's catalog paths so changing the
pattern invalidates scoped checks and cache keys. Commit this file; do not ignore all of `.loom/`.

## Existing customisations

1. Preview the harness upgrade. Save the current checkout and review `.loom-new` proposals.
2. Copy custom `SPEC_PATHS` from the existing spec hook into `spec_paths`, and the existing
   `FEATURE` regex source into `feature_pattern`. Preserve the intended coverage. Record the
   actual project build/test commands as argument arrays; do not copy guessed commands.
3. Review and adopt the updated hook and discovery checker. The installer preserves custom files,
   so they cannot start reading the new settings until their updated implementations are adopted.
4. Merge the CODEOWNERS additions and HG-0007 path-scope addition from their preserved proposals.
   Run configuration, discovery, control-plane and project checks. Remove reconciled sidecars.
5. Verify with a real project story and a contract edit on a working branch, then review the change.

Pre-configuration installations retain their legacy fallback behaviour. A newly stamped adoption
with a missing project file fails instead of falling back. Invalid JSON or paths are findings, not
permission to disable the guard. This is repository configuration, not institutional approval.

## Separate CI for a new adoption

Use `--ci separate --dry-run` to preview `.github/workflows/loom.yml`; apply after reviewing the
plan. Existing `.github/workflows/ci.yml` is untouched. The separate job is named **Loom governance**
and runs the same reference lane logic. The install stamp retains this choice on subsequent runs.
The CI catalog checker inspects the separate workflow when present. Existing build, test and deploy
jobs remain the team's responsibility; installing the workflow does not configure branch protection.
Ask the platform administrator to make the appropriate team and Loom checks required after the
workflow has run successfully.

## Switching an existing Loom CI installation

The installer refuses to switch a stamped CI mode automatically: leaving the old reference workflow
active could duplicate checks and scheduled runs. Make a focused reviewed migration instead:

1. Preserve the existing workflow and its team-specific jobs. Identify any Loom lane steps in it.
2. Generate a separate workflow with `adopt --ci separate` in an empty scratch adoption; review and
   copy that workflow into the working change. Reconcile duplicated Loom steps explicitly. Keep the
   team's build/test/deployment jobs.
3. Merge CODEOWNERS coverage for both workflow paths. Update required status checks through the
   platform process only after the new check has run; do not remove required protection early.
4. In the same reviewed change, record `ci_mode: separate` in `.loom/adoption.json`. Preview another
   upgrade. An unrecognised workflow digest is preserved for reconciliation, never overwritten.
5. Retain the previous workflow and configuration in version control. Rollback restores those
   files and their matching stamp in a reviewed change, with required status checks reconciled by
   the platform owner. Re-run checks; a local restore is not proof of live branch protection.

The two helper paths do not implement automatic deployment, change platform settings or merge a PR.
