# Loom product delivery plan

Baseline: main 3e5564d, Loom 2.3.0. Direction agreed 13 September 2026.

The product objective is a dependable institutional starting experience, followed by repeatable team adoption and demonstrated runtime portability. The method, human accountability and compiled controls remain intact. Claude Code is the reference runtime; portability is claimed only for capabilities demonstrated by tests.

This plan authorizes implementation sequencing, not institutional approval, production activation or release publication. Status means local implementation unless merge/release evidence is explicitly linked.

## Current review status

Refreshed origin/main on 13 September 2026: unchanged at 3e5564d. Local Node 22.23.2 suite:
2,485 passed, zero failures/skips at review-fix commit 4e4fc73. Synthetic harness and BrainKit upgrade/rollback checks passed.
Remote Linux CI passed for review-fix commit 4e4fc73. Browser acceptance, unfamiliar-user observations and release publication remain outstanding.
Codex remains read-only; detached-process cleanup and automatic complete action evidence are open.
Historical progress entries below describe their validation state at the time.

## Milestones and ordered backlog

| Phase | Work / priority | Acceptance evidence | Dependencies | Status |
|---|---|---|---|---|
| 1 | P0: preserve intake answers across imports; explicit conflicts; fixed respondent attribution; core/governed intake dependencies. P1: reject malformed records, validate owners and derive summaries. | Two independent respondents merge in either order; repeated import is idempotent; blank entries do not erase; overlapping answers are reviewed; cross-institution imports rejected; role changes preserve attribution; all tiers run intake checks/tests. | Existing 2.3.0 intake | Locally implemented; browser/release verification pending |
| 2 | P1: repair adopted `loom adopt`; separate evidence validation from activation readiness; accurate file counts; Git/Node/Bash/jq/runtime preflight; configuration task registry; correct entry-page/version copy. | Every advertised command works from adopted layouts; no required missing evidence produces readiness; configuration tasks have applicability, owner and validator; fresh/existing settings behaviour is explicit. | Phase 1 | Locally implemented; Node 22 local checks passed; browser and release verification pending |
| 3 | P2: one start flow for example / institution / first team; role-specific questionnaire views; resumable institution-scoped sessions with visible persistence failures; source retrieval/approval states; JSON/interview handoff contract. | An unfamiliar user reaches a useful synthetic artifact; separate reference-supplied/source-checked/approval-pending states; interrupted work resumes; no duplicated governance ledger. | Phase 2 | Locally implemented; browser and user validation pending |
| 4 | P3: reusable institutional defaults independently selectable from unrelated full-tier content; pinned BrainKit publisher/consumer flow; CI integration patches; configuration data outside managed executable code; upgrade conflict/rollback guidance. | A second project inherits approved context with fewer repeated questions; existing CI is preserved; upgrades preserve local configuration and rollback is demonstrated. | Phase 3 | Locally implemented; synthetic upgrade/rollback passed; institutional review and release validation remain |
| 5 | Runtime portability: documented adapter contract and a second implementation (Codex first); model-role evaluation contract; published coverage matrix. | Shared conformance tests exercise file/shell actions, instruction loading, reviewer outputs, approvals, evidence and interruption recovery; unsupported controls are explicit; model/prompt changes require applicable evaluations. | Phase 2 contract, Phase 4 integration patterns | Bounded read-only Codex reviewer implemented and partially live-qualified; detached-process containment and write-capable delivery remain |
| 6 | Adoption validation with unfamiliar sponsors, developers, platform/risk/context owners; supervised first-team then second-team pilot. | Measure task completion, recovery, review effort, repeated entry, waiting time and correct readiness interpretation. Record findings and revise before expanding rollout. | Formative rounds begin in Phase 3; pilot after Phase 4 | Protocol, synthetic kit and descriptive reporting prepared; participant sessions not yet run |

## Implementation boundaries and design decisions

- Phase 1 ships questionnaire machinery at every tier, not institutional answers or approvals. The checker must never import code that the installer omitted.
- Preserve completed answers when incoming entries are blank. Non-empty differences in answer, reference or attribution are conflicts, not a last-writer-wins merge. Users choose explicitly; cancellation leaves current data intact. Importing is never an approval.
- Capture attribution at entry time. Do not retrospectively infer legacy ownership from whichever role is currently selected. Legacy unowned answers require correction before a valid export.
- One shared record module drives the generated standalone questionnaire and Node validation. Test public record operations instead of duplicating browser business logic in tests.
- Configuration readiness will derive from named fields and their validators. Do not expand grep to all source comments and call that a task inventory.
- Activation checking can succeed on an empty inventory as a narrow consistency check, but the readiness command cannot call required missing observations complete.
- A phase 3 session stores user answers and provenance; it does not replace the existing control catalog, approvals or evidence records.
- Phase 5 evaluates runtime and model separately: portable files/CLI do not imply pre-action protection; a model manifest does not route inference or prove model quality. Neither agent reviewer output nor adapter conformance replaces accountable human approval.

## Ownership and release shape

Product owns entry routes, task language and acceptance outcomes. Engineering owns installation/runtime contracts, migration, tests and integration. Institutional context owners, platform administrators and risk functions own their existing decisions. Design/research runs observed usability sessions; no synthetic test is represented as a human pilot.

Deliver phase 1 as a focused patch release candidate, followed by separate reviewable changes for phases 2–5. Every change updates migration notes and both plugin/marketplace versions when installable content changes. Do not advertise milestones as released based on local tests.

## Verification and rollout

1. Unit/contract tests for record validation, attribution, merge and conflict resolution.
2. Real manifest installation into fresh core, governed and full directories; run each installed intake checker and its tests.
3. Generated-document parity and marketplace validation; confirm changes do not weaken checks or fabricate approvals.
4. Browser acceptance: two role sessions, saving/reloading, imports in either order, conflicts, cancellation, malformed inputs, keyboard/mobile and export/download. Browser verification currently requires an allowed surface; prior review could not open the local file under browser policy. Do not substitute source tests for browser evidence.
5. Run the bundle suites appropriate to the change and record baseline/environment failures separately. CI uses Node 22; local results on another Node are identified.
6. After merge, verify the distributable plugin and execute the same tier/command checks from its installed layout. Publication and production activation remain separately reported outcomes.

Before claiming self-service readiness: no lost answers in tested handoffs; no false ready state for absent required evidence; all public start commands pass their installed-layout scenarios; unfamiliar participants understand their next action and readiness limitations. Proposed usability targets: synthetic first artifact within 20 minutes excluding downloads; at least 80% unassisted completion after iteration. Validate these targets rather than advertising them as measured results.

## Deferred work

Defer new control breadth, a separate onboarding portal and additional explanatory assets unless observed friction requires them. Reuse the questionnaire, CLI, BrainKit and Atlas. A hosted multi-user system adds identity, storage, residency and authority boundaries and needs its own evidence-backed design decision.

## Phase 1 implementation evidence

Branch: `codex/loom-onboarding-reliability`, based on main `3e5564d`. Local plugin version prepared as `2.3.1`; not published, merged or production-activated.

Implemented:
- Intake machinery at every tier, with an all-tier installed-layout CI test.
- Shared record operations embedded into the generated standalone page and used by the Node checker.
- Import preview, per-conflict keep/incoming choices and cancellation; blank incoming entries preserve existing answers; different institutions/question banks are rejected.
- Attribution captured at entry, missing legacy roles require explicit correction; derived totals and malformed-record findings; an explicit missing record path fails.
- Visible save failures and persistent import/export errors; progress updates avoid recreating answer fields on blur.
- Migration notes, schema alignment and generated documentation updated.

Verification on the available Node v26.8.0-alpha.0.0.0:
- 26 focused intake tests passed, including fresh core/governed/full checker and handoff-test subprocesses.
- 39 installer/stamp tests passed.
- Marketplace, generated-document integrity and self-claims checks passed; diff whitespace check passed.
- Broader suite at its run: 2,408 passed / 1 failed. The same `test-tripwire: the evasions of the plain it.skip regex are caught` failure reproduces on unmodified main in this environment (12 passed / 1 failed in baseline hooks suite). Investigate supported Node 22/Linux CI behaviour separately; no hooks were changed in this phase.
- Browser interaction, visual accessibility, Node 22, remote CI and installed-plugin publication verification remain pending. The isolated generated-script test proves shared merge logic and JavaScript parseability, not DOM behaviour.

Next implementation slice: phase 2 public command contracts (`loom adopt`, activation readiness), accurate footprint and declared configuration/preflight tasks. Do not describe phase 1 as a completed self-service launch until its browser and release checks are finished.

## Phase 2 progress: command contracts and preflight

Implemented locally in the same 2.3.1 candidate:
- `loom adopt --bundle <harness>` works from an adopted repository. Without the complete bundle it exits with the exact supported next step instead of a missing-module stack trace. Dry-run is supported and local preservation behaviour remains the installer’s responsibility.
- `loom activate --platform github --repository owner/repository` checks explicitly scoped HG-0001/0002/0004 evidence. Zero/partial observations, wrong repositories, invalid signatures, missing identity registry, malformed files and future observations cannot produce baseline completion. This is receipt validation, not live activation or full production readiness; the existing CI consistency gate remains separate.
- Assessment counts actual managed files and distinguishes new, updated, current and preserved destinations. Pending templates are included; the report identifies stamp/sidecar overhead separately.
- `loom preflight` checks Git, Node, Bash, jq and the selected runtime read-only. Unsupported runtimes are explicit. Fresh/direct settings installation and existing-settings merge behaviour are explained.
- Adoption documentation and upgrade guidance now match these command contracts; source CI runs the public installed-command tests.

Verification: 43 command/assessment/installer tests passed. Full bundle suite: 2,416 passed, one unchanged baseline hook-test failure. Marketplace, doc integrity, self-claims and whitespace checks passed. Runtime remained Node v26.8.0-alpha.0.0.0; Node 22/remote CI and browser verification remain pending.

The configuration inventory and entry-page work is now implemented locally (details below). Subsequent phases remain planned. No changes have been merged or published.

## Phase 2 completion: configuration checklist and entry pages

- Added 58 declared setup tasks covering every adoption template plus hooks, reviewer instructions, project instructions, skills, CI, backlog, contract paths and brand. Each names an accountable role to involve, required file, installation tier, next action, completion criterion and input validator; available semantic checkers are linked explicitly. Role labels do not appoint people or confer approval authority.
- `loom configure` shows pending tasks first; `--all` includes supplied inputs, `--json` exposes the complete report and `--run` executes each available checker once. Missing, invalid, deferred, input-present and check execution states remain distinct. Completion is limited to the declared input inventory.
- `loom status` includes missing declared inputs and retains additional legacy marker findings conservatively. JSON instructional metadata is excluded from declared input checks. A malformed or deleted stamped registry remains pending; older unregistered installations expose an assessment gap. Missing/invalid catalogs cannot report adoption complete.
- Updated the repository README, human-facing Loom adoption section, plugin guide and adoption skill to show institutional preparation, team setup, configuration commands and runtime/model limitations. Corrected the public skill/agent counts.
- Added source CI coverage for the registry and installed commands. The registry coverage test checks every manifest template and every referenced checker.

Verification: 26 configuration/status tests passed, including fresh core/governed/full CLI scenarios, missing files, tier applicability, metadata, invalid registries, failed/timed-out checks and conservative status behaviour. Broader bundle suite: 2,429 passed and one unchanged baseline hook-test failure; the final registry-only additions passed focused tests again. Marketplace, doc integrity, self-claims and whitespace checks passed. Local runtime remains Node v26.8.0-alpha.0.0.0. Browser, Node 22/remote CI, merge and publication remain unverified.

Next implementation priority: phase 3 guided entry routes, institution-scoped resume and role-specific intake views, followed by explicit source retrieval/review states. Existing browser acceptance and release checks remain prerequisites to claiming self-service readiness.


## Phase 3 progress: guided start, scoped sessions and role views

Implemented locally in the same unpublished candidate:

- One start screen offers a synthetic example, a named institutional intake, explicit saved-session resume and first-team repository setup instructions. Root and human-facing entry pages link to it.
- Institutional sessions have independent IDs, fixed institution names, saved role/navigation and question-bank digests. Same-name drafts remain separate. Legacy recovery is explicit and retains the original browser slot; missing attribution is never inferred.
- A selected role sees matching blocks. The facilitator and an explicit all-roles view can navigate the whole intake. This is a navigation aid, not access control. Whole-intake totals remain labelled separately.
- Storage failures retain in-memory answers, show recovery instructions, warn before closing and require an explicit action to leave without saving. Older-revision saves are detected; this is not an atomic cross-tab collaboration protocol, so concurrent editing is discouraged.
- Reference-supplied, retrieval-not-checked and approval-not-assessed language replaces misleading sourced badges. The JSON disposition remains backward compatible. The handoff contract directs retrieval, currency and approval findings into the existing source register and accountable review; the form does not fetch documents or certify approvals.
- The synthetic example exports an explicitly labelled, authority-none record and never populates institutional browser storage. Importing it into a real named institution is rejected by the existing institution boundary.
- Clipboard rejection now produces a manual-copy fallback message. Import uses a keyboard-focusable button. Narrow-screen styling accommodates longer reference badges; visual accessibility remains unverified.

Verification: 36 intake tests passed, including session isolation, same-name drafts, stale saves, storage failures, malformed/old-bank sessions, legacy attribution, role filtering, synthetic export boundaries and generated-script parseability. Fresh core/governed/full tests execute the installed session suite. Broad bundle suite: 2,439 passed / one previously reproduced baseline hook-test failure. Marketplace, doc-integrity and whitespace checks passed. Tests exercised pure session operations and generated script syntax; they are not browser interaction evidence.

Still required: actual browser/keyboard/mobile recovery and import journeys, unfamiliar-user validation, supported Node 22 CI, review/merge and publication. The next implementation phase is reusable institutional defaults, first-to-second-team handoff and upgrade-safe configuration. No human pilot, source approval, deployment or production readiness is claimed.


## Phase 4 progress: reusable institutional context

Implemented locally in the same unpublished candidate:

- `adopt --tier core --with brainkit` (also governed) independently selects draft BrainKit inputs. Component selection persists in the adoption stamp; upgrades retain it and preserve locally edited files. Configuration tasks and assessment counts reflect the selection. Full-tier content remains optional.
- `loom brainkit --from <publisher-repository> --profile <id> --digest sha256:<expected-release-digest>` previews an explicit institutional snapshot. `--apply` creates only absent files; matching files are idempotent and any conflicting or additional consumer BrainKit content blocks the copy. No overwrite flag is offered.
- Reuse checks the selected profile/manifest/digest, section integrity, lifecycle, recorded approvals, source and consumer identity registries, consumer-relative source availability, and any locally present estate registry. Traversal paths and symlinks are rejected. Copied bytes are checked against the selected manifest before writing. A partial filesystem failure is reported with the created-file list; the command is not an atomic multi-file transaction.
- Two team fixtures mounted byte-identical snapshots. The installed core CLI successfully previewed/applied a pinned publisher release; re-running core adoption preserved the mounted snapshot. Drafts, wrong digests, revoked releases, unresolved owners, modified source sections and consumer conflicts failed before copying.
- The publisher remains the institution's existing private release process. The tool neither publishes nor authenticates that process, creates institutional approvals, copies identities, queries live revocation, acknowledges estate adoption nor declares production readiness. Consumers still project identity, select their institution profile, recompile applicable changes and undergo accountable review.
- The distribution runbook now distinguishes authoring and consuming, documents second-team setup, conflict resolution and reviewed upgrade/rollback. Automatic institutional release replacement is deliberately absent; conflicting changes remain explicit review work.

Verification: six reuse/component scenarios passed, including the installed command workflow. Full bundle suite: 2,445 passed / one unchanged baseline hook-test failure. Marketplace, generated doc integrity, self-claims and whitespace checks passed. Runtime remains the local Node 26 alpha; Node 22 CI, browser verification, human review, merge and publication remain outstanding.

Remaining phase 4 implementation: integrate Loom CI without replacing a team's workflow, move project-specific contract/story/verification settings out of managed executable files, and exercise a complete reviewed release upgrade/rollback. Phase 5 runtime portability and phase 6 unfamiliar-user pilots remain planned.


## Phase 4 progress: project configuration and CI integration

Implemented locally:

- Project-owned `.loom/project.json` supplies contract paths, the anchored feature ID regex and executable/argument arrays for project verification. The spec hook and discovery checker read this data; the story skills invoke `loom verify-project`. The command refuses an empty verification list and stops on failed, unavailable or timed-out commands. No shell expansion is applied.
- Configuration tasks expose missing contracts and commands. Malformed configuration fails; deleting a newly stamped configuration file cannot silently activate legacy defaults. Pre-configuration installations retain their previous fallback. Customised older scripts are preserved by the installer and require explicit migration to consume the new settings.
- The configuration file has CODEOWNERS coverage, is excluded from the routine-change lane and participates in HG-0007's catalog path scope. Configured contract paths are excluded from routine claims as well.
- `adopt --ci separate` installs `.github/workflows/loom.yml` with a distinct **Loom governance** job while preserving the team's existing workflow. The selected mode persists across upgrades; the CI catalog checker recognises the separate workflow. Team build/test jobs and live branch-protection configuration remain separate responsibilities.
- Changing a stamped CI mode is refused to avoid silently duplicating active workflows. The installed migration guide covers reviewed transition, required-check reconciliation and restoration from version control. This guide is not evidence of a live upgrade/rollback exercise.
- Tests demonstrated custom contract blocking, configured story-ID enforcement, literal command arguments, failed/empty verification, malformed/deleted configuration, workflow preservation, configuration preservation on upgrade, and catalog validation of the installed separate workflow.

Verification: seven focused integration tests passed. Full bundle suite: 2,452 passed / one previously reproduced baseline hook-test failure. Marketplace, generated-doc integrity, self-claims and whitespace checks passed. Local runtime remains Node 26 alpha; Node 22/remote CI, browser/user validation, reviewed upgrade/rollback, merge and publication remain outstanding.

Next implementation priority: phase 5 runtime adapter contract and a bounded Codex implementation with explicitly tested coverage. Do not claim equivalent runtime enforcement from file/CLI portability. Existing release verification gaps remain open.


## Phase 5 progress: bounded Codex reviewer adapter

Implemented locally:

- Defined adapter operations (prepare, invoke, observe, normalize, interrupt/recover and qualify) and a core runtime inventory. The existing policy now explicitly lists Codex as uncovered for Loom pre-action guardrails; a native sandbox request is not presented as qualified enforcement.
- `loom runtime codex --task <file> --role <reviewer>` previews a read-only request. `--run` invokes the installed Codex CLI with explicit model selection, a read-only sandbox, JSON output and stdin instructions. No sandbox, hook-trust or rules bypass is enabled.
- Requests bind the repository instruction file, task, reviewer definition, schema and model-role declaration by digest. Existing AGENTS files are not modified. Empty root overrides fall back to AGENTS.md. Global/nested instruction loading remains a live qualification obligation, not something inferred from a root-file hash.
- Model and prompt pins must be concrete and match the declared evaluation pins. The adapter supports OpenAI-backed Codex only. It does not verify model quality, authentic execution identity, the evaluation report or institutional authorization; those remain in the existing model-risk process.
- Raw events and stderr are captured under unique local run directories. Output uses the existing reviewer schema and invariants. Malformed streams, reported file changes, missing terminal events, errors, mismatched pins or interruptions remain incomplete/invalid. A valid completed review is labelled completed-unverified and carries authority none, including when its verdict is FAIL or INSUFFICIENT_EVIDENCE.
- Interruption is forwarded and captured when possible; abrupt termination can leave partial logs. No native session is automatically resumed and no agent output is promoted to signed evidence or human approval.
- Wrote model-change evaluation requirements and a live qualification checklist. Read-only shell sandboxing does not attest MCP side effects or network egress.

Evidence: installed codex-cli 0.146.0 version/help inspected; official non-interactive and AGENTS.md documentation checked on 13 September 2026. Nine adapter scenarios, including the installed core CLI preview, passed with synthetic processes/events. Full repository suite (including marketplace tests): 2,474 passed / one previously reproduced baseline hook-test failure. A stale discovery-check assertion was updated to expect the new project-configuration guidance. Final focused adapter tests also covered reported file-change rejection. Marketplace, generated-doc integrity, self-claims and whitespace checks passed.

Not yet done: authenticated live model runs, observed file/shell and instruction behaviour, sandbox qualification, recovery against an actual Codex process, write-capable delivery and independent model-role evaluation. Consequently full Codex delivery preflight remains unsupported. Browser/Node 22/remote CI, reviewed upgrade/rollback, merge and publication gaps remain open; unfamiliar-user pilots are still phase 6.

## Phase 5 progress: live Codex qualification

Authenticated synthetic qualification is now partially complete. The PATH CLI 0.146.0 was
rejected for the configured gpt-6-astra model; the already installed desktop CLI
0.154.0-alpha.6.2 successfully ran the same pinned model request. Real shell/file reads, root and
override markers, missing-register refusal and interruption were observed. A separate canary
write probe left original bytes intact and logged a native sandbox violation, but its denied
command was absent from JSONL. Output input-attribution also remained incomplete in the override
run. These gaps prevent claiming full evidence or runtime enforcement parity.

Qualification drove two fixes: actionable CLI/model compatibility guidance without model fallback,
and in-process asynchronous public dispatch so cancellation reaches Codex and saves the incomplete
result. Both direct and public CLI cancellation were then exercised against real running shell
commands. Eleven focused adapter tests passed, including a subprocess cancellation regression.

See [qualification report](loom-codex-live-qualification.md) for scope and the local evidence index.
Next priorities are complete denied-action capture, global/nested instruction and abrupt-termination
qualification, independent reviewer evaluation, and the outstanding browser/Node 22/upgrade/user
validation. Full write-capable Codex delivery remains unsupported. No merge or publication occurred.

Validation after the live-run fixes: full repository suite 2,476 passed / one unchanged, previously reproduced baseline hook failure (`block-commented expect`). Eleven focused adapter tests passed. Marketplace, generated-doc integrity, self-claims and whitespace checks passed. Local Node remains 26 alpha; this is not Node 22 or remote CI evidence.

## Phase 5 progress: abrupt termination and instruction evidence

Continued synthetic qualification observed native nested-instruction precedence and recovered the
previously omitted denied-write tool call/error from the synthetic task's native session record.
The automatic CLI JSON stream remains incomplete for that action; no internal session format was
added as a production dependency. No global AGENTS file was present, so global precedence remains
unqualified.

A live SIGKILL probe exposed a surviving Codex process and missing result. Added a capture
supervisor to the public CLI: IPC disconnect cancels the child, preserves an incomplete result and
never resumes automatically. Termination escalates after five seconds; POSIX uses an isolated
process group. Repeated live probes stopped Codex and retained results. A detached shell process
still survived and required test-controller cleanup. Results explicitly mark cleanup completeness
unverified. That P0 containment gap continues to block write-capable delivery.

Installed-core regression coverage now includes public SIGTERM, abrupt parent death and an
unresponsive child. See the updated qualification report and evidence index. No merge, publication
or institutional approval occurred. Remaining priorities are detached-subprocess containment,
complete stable action evidence, global instruction qualification and independent model evaluation,
alongside the existing browser/Node 22/upgrade/user-validation gates.

The installed-command checks also exposed silent no-op execution when the CLI entry path used
a filesystem alias. Both Loom and direct runtime entry points now compare canonical paths;
an explicit symlink regression passed for both commands.

Final validation: full repository suite **2,478 passed / one unchanged baseline hook failure**
(`block-commented expect`). The additional symlink regression passed separately. All 14 adapter
scenarios passed across the full-suite and focused checks, including installed-core cancellation,
parent death and forced child termination. Marketplace, generated-doc integrity, self-claims and
whitespace checks passed. Local Node is still 26 alpha; Node 22/remote CI remain outstanding.

## Onboarding release checks: supported Node, tripwire and rollback

The onboarding candidate now passes **2,482 / 2,482 tests on Node 22.23.2 macOS arm64**, with no
failures or skips. The former baseline hook failure was fixed by replacing platform-dependent
multiline grep matching with the existing jq dependency. Regression tests retain live assertions
after closed comments and deny multiline disabled assertions. Marketplace, generated-doc parity,
self-claims and whitespace checks passed.

An actual-main 2.3.0 core consumer was upgraded to the candidate while preserving team workflow,
AGENTS instructions and project settings. Dry-run was non-mutating. Git rollback exactly restored
the baseline tree and version, and reapplication exactly restored the candidate tree. Installed
project verification and intake checks passed. A separate two-release BrainKit fixture exercised
explicit upgrade, exact git rollback and rejection of a revoked rollback target. These are
engineering exercises with synthetic records, not institutional approvals or production evidence.

The local supported-runtime and engineering rollback checks are complete. Remote Linux CI,
team reconciliation of preserved CI/config sidecars, browser acceptance, unfamiliar-user pilots,
merge, publication and installed-distribution verification remain open. Browser acceptance needs
an allowed preview URL because the earlier local-file access was rejected; no bypass was used.
Codex remains read-only with the previously recorded runtime gaps.

See [release validation](loom-onboarding-release-validation.md) and its evidence index.

## Phase 6 preparation: executable pilot kit and measurement

Added a version-bound synthetic pilot builder, role/cohort task protocol, browser acceptance
checklist, private observations template and descriptive reporting command. Reports exclude
synthetic rehearsals from user metrics, preserve failed/abandoned attempts in the denominator,
require missing coverage/tasks to be completed, and block expansion after answer loss or false
readiness. Per-participant first-artifact time prevents a fast median hiding a slow participant.
First/second-team repeated-entry comparisons remain descriptive and explicitly confounded by
learning. No participant records or browser outcomes have been fabricated.

The kit can be built with `node scripts/onboarding-pilot.mjs build <new-directory>`.
See [pilot protocol](../pilots/loom-onboarding/README.md). A private pilot preview is now deployed.
Browser smoke checks and a mobile overflow correction are recorded in
[browser acceptance](loom-onboarding-browser-acceptance.md). Full browser acceptance remains
partial, and unfamiliar-user validation still requires participants; no outreach has occurred.

Codex containment, complete automatic action evidence and independent model-role evaluation
remain open. Do not infer completion of phase 5 from the phase 6 research tooling.

Prepared the remaining phase 5 qualification protocol in
[runtime qualification](../pilots/loom-onboarding/runtime-qualification.md), including an
OS-boundary teardown requirement and independent reviewer-owned evaluation cases. It explicitly
rejects treating process-name/PID cleanup as complete containment. No approved disposable runner
or independent model-risk evaluator has been supplied; no write-capable mode was enabled.

Pilot tooling validation: full Node 22 suite passed 2,492 tests; seven focused pilot cases passed
after adding protocol-digest binding. A ready-to-run synthetic kit was generated; its empty
observation report remains needs-evidence-or-iteration with null user metrics.
