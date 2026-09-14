# BrainKit distribution runbook (multi-repository)

> Loom 2.0-rc.10 (WS9). How one institution's BrainKit is versioned once and mounted across many
> product repositories — **with no live network service**. Every step maps to a mechanism the
> bundled gates already enforce, so distribution is validated locally in CI.

## The operating model

1. **One private canonical BrainKit.** The institution owns a single BrainKit in a private
   repository. Public AI-DLC ships only schemas, machinery, validators and the fictional Meridian
   example — never real institutional content.
2. **Semantically versioned, approved releases.** Each release bumps the manifest `version`, is
   sealed (`brainkit-check.mjs --seal`), and is moved to `status: approved` by accountable owners
   whose identities resolve in the registry. *Mechanism: `brainkit-check` — status, owners,
   approvals, digest consistency.*
3. **Each product repo mounts a digest-pinned snapshot.** The repo copies the approved BrainKit into
   `institution/brainkit/` and pins the release in its institution profile:
   `profiles/institutions/<id>.json → brainkit.release_digest: "sha256:…"`. *Mechanism:
   `brainkit-check` compares the mounted snapshot's live package digest to the pinned
   `release_digest`; a mismatch fails the build — the repo is running an unadopted version.*
4. **CI validates the snapshot with no network dependency.** `brainkit-check` recomputes section and
   package digests from the local files and compares them to the manifest and the pin. There is no
   registry call, no fetch — the snapshot is self-verifying.
5. **Adopt a new version through an explicit reviewed PR.** Bumping the mounted snapshot and its
   `release_digest` touches `institution/` and `profiles/institutions/`, which are CODEOWNERS-owned
   by the context owners and are never a routine change (the routine-change floor blocks them). So a
   version bump is always a reviewed PR. Recompile affected control plans in the same PR — the
   compiler folds the new live digest into each plan binding, so `change-envelope-check` fails any
   plan not recompiled.
6. **Rollback = remount the last approved version + recompile.** Restore the previous approved
   snapshot into `institution/brainkit/`, set `release_digest` back, and recompile. No service call;
   the digests do the reconciling.

## What is deliberately NOT built in rc.8

- **No public BrainKit registry.** Distribution is repo-to-repo via reviewed PRs and pinned digests.
- **No live resolution service.** Nothing fetches a BrainKit at build time; the mounted snapshot is
  the source of truth and is verified locally.
- **No claim of platform- or organisational-enforcement** from these bundled gates. Making a BrainKit
  version *organisationally* mandatory across repos is the institution's control to operate outside
  this repository.


## Assisted second-team adoption

The author and consumer paths are different. An author who needs draft institutional inputs can
install `--tier core --with brainkit`; full-tier Islamic and other unrelated templates remain
absent. A consumer of an existing approved release should start on core and mount that release,
rather than create new drafts or repeat institutional intake.

1. The institutional context owner identifies the private publisher repository, institution
   profile and expected release digest through the institution's trusted release channel. This
   tool does not publish releases, authenticate that channel or create approval records.
2. Resolve the package owners and approvers in the consumer's existing identity registry.
   Mount any repository-relative source references through approved channels. No identities or
   source documents are automatically copied from the publisher.
3. From the consumer, run:

   ```bash
   node scripts/loom.mjs brainkit --from /path/to/publisher-repository --profile institution-id --digest sha256:EXPECTED_RELEASE_DIGEST
   ```

   The preview shows every file as new, current or conflicting. It checks the exact manifest,
   profile and section digests, effective/expiry dates, recorded approvals and human identity
   resolution. If either repository has an estate registry, this exact release must be registered
   as active. A missing registry is not evidence of live revocation status; consult the owner.
4. Review the file plan. Re-run with `--apply` to create absent snapshot and profile files. Any
   conflict prevents copying; identical files are skipped. Files are never overwritten. A write
   failure can leave a partial copy; the report names created files, and rerunning safely skips
   identical files. Inspect the workspace before retrying. `--json` exposes the same report.
5. Project the approved identity into `discovery/brand/design.md`, preserving local changes for
   review and recording `brainkit_version` and `brainkit_digest`. Select the copied institution
   profile by its profile id in applicable change envelopes. Recompile their control plans and
   run `node scripts/brainkit-check.mjs` plus `node scripts/loom.mjs gates`.
6. Have the accountable reviewer approve the repository change and record estate acknowledgement
   using the existing institutional process. A local copy does not establish either decision.

A second team repeats steps 2–6 with the same publisher release and digest; it reuses the approved
context bytes. It still owns its repository permissions, runtime, product decisions and evidence.

## Upgrade and rollback review

- The selected draft component persists in `.loom/adoption.json`. Ordinary harness upgrades
  preserve locally edited files and put proposed replacements in `.loom-new` sidecars. Review
  these and remove resolved sidecars from the BrainKit directory before conformance checks;
  undeclared files are deliberately rejected there. Do not use `--force` as an upgrade shortcut.
- A mounted consumer snapshot without the draft component is outside that component's installer
  writes. Re-running a core adoption leaves it intact. Selecting full later may introduce
  conflicting draft templates; review that proposed tier expansion explicitly.
- To upgrade the institutional release, preview the new publisher/digest. Conflicts are a review
  list, not permission to overwrite. Replace the exact snapshot and profile in a focused reviewed
  change, retaining the previous snapshot in version control. Update the identity projection and
  recompile affected plans in that same change; re-run the gates and acknowledge the release.
- Rollback uses the previous approved, currently permitted release. Restore its snapshot and
  profile from version control in a new reviewed change, regenerate the projection and recompile.
  Re-preview against that publisher release and digest: unchanged files should report current.
  A revoked release is not a rollback target. The existing gates and estate process still apply.
