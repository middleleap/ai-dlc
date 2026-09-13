# Loom adoption pilot

This kit makes the remaining CPO validation runnable. It contains synthetic input fixtures and an
empty observation file. It does not contain completed browser checks, participant results or
institutional approvals. Keep actual observations and evidence in a private pilot directory.

## Run the pilot

From the candidate checkout, build a new kit:

```sh
node scripts/onboarding-pilot.mjs build /path/to/new-private-pilot-directory
```

Arrange an allowed preview of that kit's questionnaire and record its URL and manifest digest.
Do not substitute a production/main page for this candidate. Previous automated local-file access
was rejected; do not bypass that boundary. A platform owner can provide an approved preview.
The kit is not automatically hosted and no participants are contacted by this command.

Recruit unfamiliar representatives of sponsor, developer, platform, risk and institutional context
roles. Start with one per role for formative learning; do not generalize this small sample to a
population. Run first-team tasks, then the developer/platform second-team tasks with the same
fictional context. Sponsor and risk also assess the second team's readiness. Record each person's
initial familiarity, and identify repeat participants so learning effects are visible. Use
pseudonyms P1, P2, etc. Recruitment, contact details, consent and raw session notes stay private.

The facilitator reads tasks.json verbatim, asks participants to think aloud, and observes before
helping. Record every hint as assistance; never convert an assisted completion to unassisted.
Stop a task if continuing risks real data or unintended changes. Use disposable repositories with
synthetic CI/settings and the fictional BrainKit example; no real institutional approval is needed
or implied. A failed task is useful evidence, not a reason to coach the result into passing.

## Browser acceptance checklist

Record browser/version, viewport, keyboard or pointer, candidate digest, scenario outcome and a
reference to notes or recording. All scenarios currently have status **not run**.

| Scenario | Expected observable behavior |
|---|---|
| Example route | Produces an explicitly synthetic export; does not overwrite an institution session |
| Role intake | Correct role questions appear; switching roles does not change earlier attribution |
| Independent sessions | Two named institutions retain different answers after reload |
| Handoff order | Import brand.json then architecture.json, and reverse in a fresh session; both answers survive |
| Blank import | Import blank.json into a populated session; it erases nothing |
| Conflicting import | Import brand-conflict.json after brand.json; keep existing, accept incoming and cancel each behave as chosen |
| Repeated import | Re-import the same record; no duplicate entries or false conflict |
| Invalid inputs | malformed.json, other-institution.json and wrong-bank.json are refused; existing answers stay intact |
| Recovery | Reload and resume with role, answers and navigation intact; stale-tab save is visibly rejected |
| Storage failure | On an approved test surface, disable storage or simulate quota failure; visible failure and usable export preserve work |
| Export/download | Downloaded JSON matches visible answers and attribution; supplied references never imply retrieval or approval |
| Keyboard | Complete start, role selection, answer entry, import decisions and export without pointer; visible focus and no trap |
| Mobile | Repeat primary flow at a narrow viewport; no clipped controls or unreachable conflict actions |
| Readiness | Participants distinguish input present, content approval, platform activation and production readiness |

Use institution name **SYNTHETIC PILOT — Meridian Trust** for the supplied handoff fixtures.
The A1 answer is the fictional brand guide; C1 is the fictional architecture principle. Expected
combined output has A1 from the brand role and C1 from the architecture role. Conflict acceptance
changes A1 only; cancellation changes nothing. Do not upload fixtures to a real institution's intake.

## Record observations

observations.json starts with no sessions and pins both questionnaire and task-protocol digests.
Keep those pins; the reporter rejects a different protocol so an older round is not silently
rescored against new task definitions. Append sessions using the shape below. These are field
instructions, not evidence of an actual person or completed task. Mode must remain `observed` for
real sessions; synthetic rehearsal files must use `synthetic` and never contribute to user metrics.

```json
{
  "participant_id": "P1",
  "role": "context",
  "cohort": "first",
  "unfamiliar": true,
  "attempts": [
    {
      "task_id": "first-artifact",
      "outcome": "not-run"
    }
  ]
}
```

For each attempted task, outcome is `completed`, `failed` or `abandoned`. Add nonnegative integer
elapsed_seconds, download_seconds, waiting_seconds, review_seconds, assistance_count, repeated_fields and
lost_answers; boolean readiness_correct and false_ready; and a nonempty evidence_ref pointing to
private observation notes. Elapsed includes waiting and downloads; their sum cannot exceed elapsed.
For tasks without a readiness question, readiness_correct means the participant correctly explained
that task's output. Count a field as repeated only when institutional information already supplied
had to be entered again. review_seconds counts time spent checking the task output and cannot exceed elapsed. Record detailed friction in the notes alongside timing.

Generate a descriptive report from the candidate checkout:

```sh
node scripts/onboarding-pilot.mjs report /path/to/private-pilot-directory/observations.json
```

Exit 1 means more observations or iteration are required; exit 2 means invalid input. Empty data
produces null metrics, not zero-minute success. Missing role/cohort coverage or unrun tasks cannot
produce readiness for review. Familiar testers can rehearse but do not establish unfamiliar-user
completion metrics. Evidence references are declarations, not authenticated recordings.

## Interpret results and iterate

The proposed target is at least 80% unassisted completion among attempted unfamiliar-user tasks.
Failed/abandoned attempts remain in the denominator. Every observed first-artifact attempt must
complete within 1,200 seconds excluding downloads; waiting is retained. The report also gives the
median, but a fast participant cannot hide another participant's timeout. Do not claim statistical
confidence from this formative sample. Compare same-person, same-role first/second-team repeated
entry descriptively; this is confounded by learning and is not causal proof of product improvement.

Any lost answers or false-ready interpretation blocks expansion. Rank findings by severity and
frequency, attach the observation reference, implement focused fixes, and repeat the failed scenario
plus adjacent paths. Use a new round and candidate digest after product changes; never mix candidates
in one dataset. Validate accessibility with the actual browser and assistive workflows as needed.

Product owns the usability readout; engineering owns repeatable fixes; institutional owners retain
content and platform decisions. `ready-for-human-review` is only a descriptive research checkpoint.
A human must still review the findings, PR, release and institutional activation independently.
