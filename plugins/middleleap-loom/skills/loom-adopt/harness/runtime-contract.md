# Runtime adapter contract and Codex pilot

The method and model are separate from the runtime. An adapter must declare which parts it can
implement and which controls still depend on the surrounding platform. The inventory lives in
`core/runtime-adapters.json`; pre-action coverage remains in the existing guardrail policy.

## Required adapter operations

| Operation | Contract | Codex implementation |
|---|---|---|
| Prepare | Pin task, role definition, instruction source, output schema and model-role declaration; preserve existing instructions | Read-only preparation with input digests; AGENTS.override.md takes precedence over AGENTS.md at repository root |
| Invoke | Pass literal arguments, retain host security controls, record requested permissions and runtime version | `codex exec` with read-only sandbox, explicit model, JSON events and stdin task; no bypass flags |
| Observe | Retain raw events and distinguish requested capabilities from observed behaviour | Local JSONL and stderr capture; synthetic live reads observed, not proof every input was read or obeyed |
| Normalize | Validate output shape and invariants without making the agent an approver | Existing reviewer schema; mismatched pins, unsupported verdicts and absent-evidence contradictions fail |
| Interrupt/recover | Preserve incomplete evidence; never infer completion or silently replay side effects | Capture supervisor detects public CLI disconnect; stop the Codex process group, escalate after five seconds, retain incomplete result; detached descendants remain unverified |
| Qualify | Exercise real file/shell actions, instruction precedence, approval boundaries, evidence and recovery | Partial synthetic live qualification recorded below; institution-specific qualification remains required |

The Codex pilot supports read-only reviewers only. It does not install Claude hooks into Codex,
copy credentials, change runtime trust, write delivery code, grant human approval, merge, deploy,
or seal its own output as independent evidence. The native sandbox applies to shell filesystem
writes; this wrapper does not attest every MCP side effect or constrain network egress. Use an
institutionally approved runtime configuration and synthetic data during qualification.

## Prepare and run a review

Adopt the core harness. Keep your existing AGENTS.md; if absent, write project instructions naming
the binding conventions and verification commands. Review any AGENTS.override.md. Global and
nested instructions can affect the native runtime; the adapter's root-file digest is not a proof
of the entire loaded instruction chain or compliance with it.

Mount the reviewer definition and the existing agent-output schema under `.claude/agents/`.
These paths are portable text artifacts here, not a claim that Codex loads Claude plugins. The
adapter includes the selected definition and schema explicitly in its task request.

The reviewer must map to exactly one role in `docs/governance/model-manifest.json`. This adapter
requires provider `openai`, a concrete model ID and prompt version, and matching evaluated model
and prompt IDs. A matching declaration does not validate the report or authorize model use:
complete the model-risk and independent-evaluation process before institutionally deploying it.
The CLI's actual served model is not independently attested by its own reported model field.

```bash
node scripts/loom.mjs runtime codex --task review-task.md --role hard-stop-reviewer
```

The default prints a preview without invoking a model. Add `--run` to invoke the installed Codex
CLI using its existing authentication. Task content and repository context can reach the configured
provider; the adapter does not load or copy credentials. Results stay under a unique
`.loom/runtime-run-*` directory: request metadata, raw events, stderr and a result report. These
may contain sensitive model output. Each new run directory gets a self-ignoring `.gitignore`
before capture starts, so ordinary `git add -A` excludes its contents while project configuration
remains trackable. This does not untrack captures committed by an older version or prevent
explicit force-add. Review existing tracked captures separately. Retain and share logs under
institutional policy.

`completed-unverified` means a successful process/terminal event and a valid output contract.
It does not mean that the review passed, cited files were read, the requested model actually ran,
or an institution approved anything. An INSUFFICIENT_EVIDENCE or FAIL verdict can be a valid
completed review. Inspect the verdict separately. Exit 1 means incomplete/invalid transport or
output; exit 2 means invalid CLI use. The public command uses a separate capture supervisor. Loss of its IPC connection stops Codex
and preserves an incomplete result when the supervisor remains alive. On POSIX, termination
targets the isolated Codex process group and escalates to SIGKILL after five seconds; Windows
uses child-process termination and has not been live-qualified. Subprocesses that detach into
other groups may survive: the live macOS sleep probe demonstrated this. The result explicitly
marks cleanup completeness unverified. If the supervisor or host is also killed, request status
may remain `running` with no result file; treat that as incomplete. Inspect runtime state and
retained events before a new reviewed task.
Do not use native `resume --last` to guess which run to continue.

## Model-change evaluation contract

Pin model ID, prompt version, dataset version, evaluation runner version and digest-bound report
in the existing model manifest. Re-run the role's evaluation cases after changing the model,
prompt, reviewer definition or relevant runtime configuration. Include missing-register refusal,
false-positive and false-negative findings, citation support, authority boundaries and interrupted
runs. Independent validators assess quality and suitability; output-shape tests only assess shape.
Do not treat a new model default or runtime adapter as an approved replacement.

## Qualification evidence and remaining requirements

Use a disposable synthetic repository and the intended Codex version/configuration. Verify that
the runtime reads the correct global/root/nested instruction chain, that a real file read and shell
command are captured, and that an attempted file mutation is denied under read-only. Exercise
malformed output, missing registers, an unavailable model, cancellation and process termination.
Check that no run creates approval records or silently resumes. Record runtime version, config,
model and prompt pins with the results, and independently review the findings before expanding
to write-capable delivery. Automated tests in this bundle simulate the process/event boundary. Live qualification is a separate, explicitly invoked exercise.

Implementation references, checked 13 September 2026:
[OpenAI non-interactive CLI documentation](https://learn.chatgpt.com/docs/non-interactive-mode)
and [AGENTS.md discovery](https://learn.chatgpt.com/docs/agent-configuration/agents-md).
On 13 September 2026, authenticated synthetic runs requested `gpt-6-astra` with
`loom-qualification@1`. The PATH CLI 0.146.0 was rejected because the model required a newer
version. Selecting the already installed desktop CLI 0.154.0-alpha.6.2 for that invocation
completed the read-only reviewer run with no model substitution. The adapter reports this
compatibility failure with guidance to select or upgrade the CLI and retain the model pin.

Observed: successful local shell/file reads, the expected root and override instruction markers,
valid missing-register INSUFFICIENT_EVIDENCE output, and retained incomplete logs after SIGTERM
during real `sleep 30` commands through both the direct runner and public Loom CLI. A separate native read-only canary probe
left its original bytes unchanged and stderr recorded a filesystem sandbox violation. The denied
write command was absent from JSONL; its exact error appeared only in the model's report. This is
partial denial evidence, not a complete command trace. No write-capable delivery was qualified.

These observations cover one macOS host/configuration. Global instruction precedence,
automatic full denied-action capture, detached-subprocess cleanup,
MCP/egress boundaries and independent model-role quality evaluation remain open. The synthetic
manifest's matching evaluation pins were test declarations, not completed evaluations. Raw local
capture identifiers and their digests are indexed in the source repository's
`docs/plans/loom-codex-live-qualification.md`; they are not signed institutional evidence.

Further qualification on the same host observed nested AGENTS.md precedence from a nested
working directory (TEAM-8349) with a captured file read. No global AGENTS file was present, so
global precedence was not tested. Manual inspection of this synthetic task's native session record
recovered the denied canary write call and exit-1 permission error. The adapter does not depend on
that internal session-file format or automatically import it; JSONL alone still omits that action.

An abrupt-parent-death test reproduced a surviving Codex process and missing result. With the
supervisor, the repeated test stopped Codex and saved an incomplete result. A detached sleep
subprocess survived even isolated process-group termination and required test-controller cleanup.
This is a remaining qualification gap, not complete process-tree cleanup.
