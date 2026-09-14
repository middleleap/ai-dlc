# Questionnaire to facilitator handoff

The guided start offers a synthetic example, institutional intake and first-team setup instructions.
The example is visibly labelled and never stored as an institutional session. Its export remains
synthetic. Do not use it as institutional evidence.

For real work, agree the institution name before respondents start. Each respondent starts or
resumes their own named session, selects their role, answers their block and exports
`intake-record.json`. The facilitator starts a session with the same institution name, selects
“the facilitator”, and imports the role exports. Review conflicts before applying each import.
Blank incoming answers preserve existing content. Different institutions and question banks are
not silently combined. Role filtering is a navigation aid, not access control or authority.

The interchange format remains `loom.intake-record/v1` with `authority: none`. Each answer names
its question, block, respondent role, answer, reference, disposition and optional prefill provenance.
The question-bank digest identifies which questionnaire produced it. Summary counts are derived.
A facilitator validates shape with `node scripts/intake-check.mjs --record <path>` and stores the
reconciled record at `institution/intake/intake-record.json`. Browser session metadata is not an
approval ledger and is not part of this interchange format.

| Intake value | What is established | Facilitator next step |
|---|---|---|
| SOURCED / Reference supplied | The respondent named a reference | Retrieve it through an approved channel, verify it supports the answer, and confirm its approval and currency with the accountable owner in the existing source register before BrainKit use |
| CLAIMED | An answer exists without a reference | Interview the respondent role and identify or commission the missing source |
| UNKNOWN | No answer | Ask the accountable role; record and escalate the gap if unresolved |

The form does not fetch documents and cannot mark source retrieval or approval complete. Keep
those findings in the existing source register and governance review, not another checkbox ledger.
The `institution-intake` skill interviews gaps; `brainkit-init` drafts only from appropriately
reviewed source material. Importing or exporting does not approve anything.

Browser sessions have independent IDs and persist answers, selected role and navigation. An
institution name is fixed within a session; start another session to work with another institution.
The page detects saves based on an older stored revision, but browser storage is not a collaborative
database: avoid editing the same session in multiple tabs. Saves can fail when storage is disabled,
full, cleared or unavailable under a new file/origin. Keep the page open and export or manually copy
the JSON before leaving. Export validation may require correcting missing respondent roles first.
“Return without saving” explicitly discards unsaved work; it does not replace the last saved draft.

Use the start page's explicit legacy recovery for `loom.intake.v1` answers. If the old draft has no
institution name, enter one before recovery. The original slot remains untouched. Malformed or
old-bank sessions are retained with a visible finding; use the original questionnaire to export
and reconcile against the new questions. Storage is local to the browser, not a server backup.
