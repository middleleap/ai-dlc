# Onboarding release validation — 13 September 2026

The local onboarding candidate now passes its complete suite on supported Node 22. Browser
acceptance and unfamiliar-user testing remain open; this is not a self-service readiness claim.

| Check | Result | Limits |
|---|---|---|
| Node 22 full repository suite | 2,482 passed; zero failures or skips | Node 22.23.2 on macOS arm64; remote Linux CI not run |
| Previous baseline hook failure | Fixed; 14 hook tests passed | A heuristic tripwire, not a complete parser of test weakening |
| Marketplace, generated documentation and self-claims | Passed on Node 22 | Local source validation, not published-plugin verification |
| Actual 2.3.0 bundle to candidate upgrade | Dry-run wrote nothing; team CI, instructions and configuration retained | Existing CI/config sidecars still need the adopting team's reconciliation |
| Harness rollback and reapplication | Git rollback tree exactly matched baseline; reapplication exactly matched candidate | Synthetic repository; not institutional approval or production rollback |
| BrainKit release upgrade/rollback | Conflicting automatic replacement refused; explicit fixture upgrade and git rollback validated; revoked target rejected | Fictional release/approval records, no real institution involved |
| Browser intake journey | Pending allowed preview URL | Prior local-file access rejection was not bypassed |
| Unfamiliar-user pilot | Not run | Cannot yet claim intuitive or unassisted adoption |

## Hook correction

The old multiline block-comment check used `grep -z`, whose behavior differed under the host's
BSD grep. It now uses the already-required jq string regex. Regression coverage denies ordinary
and starred multiline comments containing expectations or assertions, while allowing live
assertions following closed comments. Migration notes tell owners of customized hooks to review
the preserved-file replacement rather than overwrite local changes.

## Upgrade exercise

The starting bundle was extracted from actual main commit `3e5564d` (2.3.0). A disposable consumer
adopted core and added team CI, AGENTS.md, contract paths and a literal verification command. The
candidate's installer preview left every file unchanged. Applying it retained all protected team
bytes and installed the new runtime supervisor. Project verification and the installed intake
checker passed. Proposed CI/config replacements remained visible as `.loom-new` files.

The fixture committed baseline and candidate trees, then used a new revert commit for rollback
and a second revert for reapplication. Both tree identities matched exactly, including removal of
new candidate files on rollback. The restored old version command reported 2.3.0. After
reapplication, project verification and the intake checker passed again with a clean worktree.
These fixture commits record an engineering exercise; no human institutional decision is implied.

The separate BrainKit regression models two fictional releases. Create-only reuse refuses an
in-place conflicting upgrade. After explicit fixture replacement, the selected new snapshot is
current; reverting that repository change restores the original tree and passes original-release
checks. Marking that source release revoked then causes conformance to fail, even when consumer
bytes match. Rollback eligibility must therefore be checked before restoring an older release.

[Evidence index](loom-onboarding-release-evidence.json) records fixture paths, commits, tree IDs and
log hashes. Temporary local artifacts can expire. The Node archive matched its checksum from
nodejs.org; it was extracted under /private/tmp without replacing the user's default Node.

## Remaining release gates

1. Browser acceptance on an allowed preview: role sessions, reload/recovery, imports in both orders,
   conflicting and malformed records, cancellation, export/download, keyboard and mobile.
2. Unfamiliar sponsor, developer and institutional-owner pilot; record friction and iterate.
3. Reconcile with current main, review the changes and run remote Node 22 CI. Publish and verify the
   distributable only through the release process. Institutional activation remains separate.
4. Keep Codex read-only: detached subprocess containment, complete automatic action evidence,
   global-instruction qualification and independent role/model evaluation remain open.
