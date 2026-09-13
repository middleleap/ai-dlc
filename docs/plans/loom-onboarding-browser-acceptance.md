# Hosted questionnaire acceptance — 2026-09-13

This is agent-operated browser evidence using fictional records, not unfamiliar-user research,
institutional approval, or full accessibility certification.

Preview: https://loom-onboarding-pilot.michartmann.chatgpt.site (owner-only).
Initial questionnaire digest: `sha256:91afcb899bea3c566dc6d7a2015d2a63c0d2835ddbec4017a9765bbc6857ebbc`.
Corrected questionnaire digest: `sha256:28d39e7c95228da48283d571c656a333af899d09dcc2847199dc30a327b96040`.
Sites version 2 deployed successfully; source commit `8147cac6ccb6117be498a1dd3bda367c3df6019f`.
Browser: Codex in-app browser. Tests used the hosted HTTPS page; the previously denied local-file
route was not retried or bypassed. Fixtures came from the synthetic pilot kit.

## Observed passes

- Synthetic example opens with fictional source labels and authority none, without appearing in the saved institutional intake list.
- Named institutional intake starts with a role prompt. Brand and architecture roles show their respective question blocks.
- Entered brand answer/reference survive save, return to start, reload and resume with original role attribution.
- Switching to architecture does not rewrite the brand answer's role.
- Conflicting import displays current/incoming answer, reference and role. Apply without a choice is refused with actionable feedback. Keep-current retains the original answer.
- Architecture import adds C1 alongside A1 with separate respondent roles.
- Blank import reports zero new answers/conflicts and preserves the two sourced answers.
- Cancelling a conflicting import with Enter leaves both answers unchanged.
- Other-institution, malformed JSON and wrong-question-bank imports produce errors without replacing answers.
- Copy JSON produces parseable clipboard JSON containing the retained answer and attribution.
- Enter activates the team setup guide. This is a bounded keyboard check, not a complete focus-order audit.
- After deployment of the CSS correction, saved intake resumes with both answers intact.
- At 390px and 320px viewport widths, document scroll width equals viewport width. The team guide also fits at 320px. Temporary viewport override was reset.

## Defect fixed

The question-bank SHA-256 digest made the document 507px wide at a 390px viewport. DOM inspection
isolated the overflow to the footer digest. Added `overflow-wrap:anywhere` to inline code in the
source template and regenerated HTML. This also accommodates long command names in the team guide.
The corrected private preview was deployed and its computed wrapping and document widths verified.
Twenty focused intake-generation and pilot tests passed on Node 22.23.2.

## Follow-up: downloads and concurrent edits

On the same corrected preview, browser-level download events confirmed that the page initiated
`intake-record.json` with a 4,154-byte payload. The browser then emitted `Page.downloadProgress`
with `state: canceled` and `receivedBytes: 0`. This narrows the failure to delivery in this browser;
it does not establish the cause of cancellation or successful file receipt. No browser download
policy was changed. The verified Copy JSON path remains available.

A second hosted tab resumed the same synthetic intake. Editing C2 in the older tab then produced
an explicit concurrent-change save error. The newer tab's exported C2 remained UNKNOWN, while
Copy JSON from the older tab retained its unsaved C2 text and original answering role. Clicking
Save and return to start did not leave the unsaved workspace. These checks demonstrate overwrite
protection and recovery-export availability in the browser, beyond the pure-module tests.

The subsequent Return without saving test blocked on the native confirmation: the click timed
out and the browser dialog API could not resolve it. Attempted native Codex app access was denied
by the computer-use safety policy. No alternate app-control mechanism was used. Manual dismissal
is required before continuing this browser session; confirmation cancellation and exit have not
been marked passed.

## Follow-up: keyboard, reverse imports and accessible context

The previously blocked tab became available again. The cause of dialog dismissal was not
observed, so the leave/cancel test is still not counted as passed.

- Tab traversal from the role selector reached the facilitator checkbox, import, clear, block navigation, then answer/reference/respondent fields. Buttons exposed 2px focus outlines and text fields exposed a 3px focus shadow. This is DOM/style evidence, not a full visual contrast or screen-reader audit.
- A separate same-name draft imported architecture first, then brand. Both answers retained their own role attribution. Reimporting brand reported zero new answers/conflicts and kept the same two sourced answers.
- Recover previous questionnaire answers displayed an actionable no-previous-answers message. The browser did not support the DOMStorage command needed to create an isolated legacy fixture; no alternate storage-injection path was attempted. Populated legacy recovery and storage-denial UI testing remain unverified.
- Browser inspection found that generic answer/reference/respondent labels did not identify the corresponding question programmatically. Added a named group for each question and linked all three fields to the question ID and prompt with aria-describedby.
- Sites version 3 deployed successfully with source commit `6e925f58ea1807f311d3d175a478a3d0eafc3c02`. Questionnaire digest: `sha256:8d67daad13631f71b6b6c18680d97d3a85877a57ca4db55bc4d5d4f13cf9d15d`.
- The deployed DOM exposes named A1–A6 groups, and all 18 visible fields resolve their descriptions to the correct question. Both imported answers survived deployment/reload/resume. Thirty focused intake/session/pilot tests passed on Node 22.23.2.

## Integration with concurrent review fixes

While this work was in progress, PR #70 merged a second review pass into the PR #69 branch at
`9c8aa96b2fef4f374b090d726355157d968edc65`. The accessibility commit was rebased onto that branch
without conflict, preserving the review changes. Generated-questionnaire parity remained clean.
Sixty-two focused intake, session, installed intake, pilot, runtime and repository-path tests
passed on Node 22.23.2 after integration.

The refreshed preview uses Sites source commit `24a1c9d6bb1797da312e5d3c327f7ae42952e58b` and
questionnaire digest `sha256:a08e20ee3ae74ad6e53afe348278fd5699600f876b909ab5a90cd8418c09de81`.
Version 3 browser results above describe their exact tested candidate; the version 4 refresh
adds the second-pass record-validation and export-notice corrections.

## Acceptance still open

- Actual downloaded-file receipt/content: browser cancellation before receiving bytes is confirmed; its cause and successful delivery remain unresolved. Copied JSON passed.
- Complete keyboard focus order, focus visibility, screen-reader behavior, text enlargement, touch/physical-device and cross-browser coverage.
- Completion of the stale-tab leave/cancel flow, browser storage-denial recovery and populated legacy recovery with old-format browser state. Pure-module tests cover these separately.
- Unfamiliar sponsor/developer/platform/risk/context participant sessions, first-to-second-team comparisons and measured completion targets.

Do not mark the full browser acceptance gate or phase 6 complete from this smoke pass. The next
browser session should resolve download delivery and remaining recovery/accessibility coverage.
