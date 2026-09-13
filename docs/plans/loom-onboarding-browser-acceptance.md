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

## Acceptance still open

- Actual downloaded-file receipt/content: clicking Download did not produce an automation download event within ten seconds. No console error was captured. This is unverified, not a proven application failure; copied JSON passed.
- Complete keyboard focus order, focus visibility, screen-reader behavior, text enlargement, touch/physical-device and cross-browser coverage.
- Browser storage-denial/stale-tab recovery, legacy recovery with real old-format browser state, import in reverse order and repeated-import interaction coverage. Pure-module tests cover these separately.
- Unfamiliar sponsor/developer/platform/risk/context participant sessions, first-to-second-team comparisons and measured completion targets.

Do not mark the full browser acceptance gate or phase 6 complete from this smoke pass. The next
browser session should resolve download delivery and remaining recovery/accessibility coverage.
