# Coordinator handoff

Michael is the pilot coordinator. Engineering has prepared the candidate, fixtures and evaluation
protocol. No participant has yet been recruited or tested. This guide supports coordination; it
is not a record of completed sessions.

## Prepare the round

1. Recruit one unfamiliar representative for each role below. Keep contact details privately;
   use P1–P5 in observation records. The coordinator should not count as an unfamiliar participant.
2. Reserve roughly 45–60 minutes for context/developer/platform sessions and 20–30 minutes for
   sponsor/risk sessions. These are scheduling allowances, not measured task times.
3. Choose how participants will access the candidate. The hosted pilot is owner-only; it is not
   currently shared with participants. Arrange explicit access or distribute the self-contained
   questionnaire through your approved channel. Do not assume the private link is sufficient.
4. Freeze the questionnaire digest and candidate commit for the round. Use fictional inputs only.
   Open a fresh browser profile/session for each participant to avoid the coordinator's test drafts.
5. Before inviting participants, manually verify an actual JSON download and reimport in the
   participant browser. The in-app browser initiated a download but cancelled it with zero bytes
   received. Copy JSON worked; if needed, save that text as intake-record.json and record assistance.
   Do not count that workaround as unassisted success of the download task.

| Role | First-team tasks | Second-team tasks |
|---|---|---|
| Sponsor | first-artifact, readiness | readiness |
| Context owner | first-artifact, role-intake, recover, handoff | None |
| Developer | team-setup | team-setup, context-reuse |
| Platform owner | team-setup, readiness | team-setup, readiness, context-reuse |
| Risk owner | role-intake, readiness | readiness |

Read prompts from tasks.json exactly. Observe before helping and count each hint. Record failed
and abandoned attempts. Keep the same participant and role for paired first/second-team tasks.
Do not teach the sequence below before the participant attempts the task.

## Prepare disposable repositories

From the candidate checkout, using Node 22 and Git:

```sh
node scripts/onboarding-pilot.mjs build /path/to/new-questionnaire-kit
node scripts/onboarding-pilot-workspaces.mjs /path/to/new-workspaces
```

Both commands refuse existing destinations. The workspace builder packages the committed harness,
two fresh Git repositories, and a fictional publisher from the bundled BrainKit example. It
records baseline commits, hashes for preserved team files and the exact release digest in
workspaces.json. There are no remotes or credentials. Synthetic human identities are fixture
prerequisites, not approved real people. Treat any expiry failure as a reason to refresh the
fixture, never bypass the validator or change the clock. Each developer/platform participant
needs their own newly built workspace pair. Never share a mutable pair between participants.

## Facilitator reference sequence

Run these from team-one, then team-two, only during your rehearsal or after measuring an attempt.
The candidate plugin directory is a sibling of each team directory. Install core without draft
BrainKit templates when mounting an existing release; those draft files would correctly conflict
with create-only snapshot reuse.

```sh
node ../candidate/skills/loom-adopt/harness/adopt.mjs --dest . --tier core --ci separate --dry-run
node ../candidate/skills/loom-adopt/harness/adopt.mjs --dest . --tier core --ci separate
node scripts/loom.mjs configure
node scripts/loom.mjs verify-project
node scripts/loom.mjs brainkit --from ../publisher --profile meridian-trust --digest RELEASE_DIGEST --json
node scripts/loom.mjs brainkit --from ../publisher --profile meridian-trust --digest RELEASE_DIGEST --apply --json
```

Replace RELEASE_DIGEST with the exact workspaces.json value. The synthetic verification command
only tests invocation; it does not validate a banking service. Expect configuration to identify
unfinished tasks. Installation, snapshot conformance and passing a command do not establish
content approval, complete governance readiness or platform activation.

Check that the original ci.yml and project.json match the hashes in workspaces.json, Loom writes
its separate workflow, both teams mount the same release, and repeating reuse copies zero files.
Use a new workspace for another attempt. Preserve the completed workspace and notes privately;
do not reset or overwrite observed attempts to make results appear clean.

## Record and review

Use the empty observations.json from the questionnaire kit. Keep its digest pins. Complete one
session per participant/cohort with the applicable tasks above. See README.md for required timing,
assistance, answer-loss and readiness fields. Keep recordings/notes private and use evidence_ref.

```sh
node scripts/onboarding-pilot.mjs report /path/to/questionnaire-kit/observations.json
```

Missing data must remain missing; never fill it with synthetic rehearsal results. Proposed targets
are 80% unassisted completion and every first-artifact attempt within 20 minutes excluding downloads.
Any answer loss or false-ready interpretation blocks expansion. These are small-sample formative
signals, not statistical proof. Send the observations and friction notes back for analysis and fixes.

## Outstanding specialist checks

Engineering has recorded hosted browser smoke results in docs/plans/loom-onboarding-browser-acceptance.md.
Still arrange actual download receipt/reimport, complete keyboard/screen-reader and enlargement
checks, physical-device/cross-browser checks, and storage-denial/populated-legacy recovery on an
approved test surface. Codex write delivery remains unavailable pending containment, complete action
evidence and independent model evaluation. Pilot coordination does not approve those capabilities.
