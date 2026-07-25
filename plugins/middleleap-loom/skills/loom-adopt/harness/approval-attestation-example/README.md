# Approval attestation — the worked example (Factory Floor WS2 · D2.4)

An approval made **somewhere other than this repository** — a collaboration surface, a workflow
tool, an approval page — and brought home as evidence. `pa1-risk-second-line.json` is one PA1
approval for the bundled change `CHG-2026-0042`, signed for real and verified by
`core/approval-attestations.test.mjs`. The example is exercised, not decorative.

## The two signatures, and why confusing them is the whole failure mode

| Block | Who signs | What it proves | Registry |
|---|---|---|---|
| `subject.assertion` | the institution's **identity provider** | a named **human** decided *this* | `assertion-issuers.json` |
| `transcription.attestation` | the **bridge** service | the decision was carried **faithfully** | `attestation-issuers.json` |

A record carrying only the second authenticates the **worker**, not the approver — a service key
saying "a human clicked" is an assertion about the service. The gate refuses that shape: an
assertion whose issuer appears in the *service* registry is rejected, and the transcriber may
never be the subject. Keeping the two registries separate is what makes the check possible.

## What the record binds

`canonicalDecisionPayload()` fixes the exact string the human's assertion covers — the change,
the stage, the outcome, the role, the registry identity, the immutable identity-provider subject,
the **compiled `plan_hash`**, the **passport digest**, the source sha (PA1) or artifact digest
(PA2), and the decision nonce. Binding those is what stops an approval outliving the thing it
approved: edit the passport after the decision and the example stops verifying — a test asserts
exactly that.

Print the payload and its digest (the value the assertion's nonce must equal):

```
node core/approval-attestations.mjs approval-attestation-example/pa1-risk-second-line.json
```

## Activation — and what this example does NOT claim

The path is **mandatory-when-compiled**: `product-approval-check` demands attestations only for a
change whose plan compiles `required_capabilities.approval_attestation.required`. No shipped
profile sets it. That is deliberate — the Factory Floor plan blocks decision routing in
production until the identity design passes an independent second-line review, so the contract
ships **declared, not active**, exercised end to end in the bundle and switched on per change by
an institution that has done that review.

The demo keys (`demo-assertion-signer`, `demo-floor-bridge`) are real ed25519 pairs whose private
halves were generated to sign this file and **discarded**. Replace both with your own before the
capability is compiled for any change: a demo issuer in a live registry is a control that proves
nothing.

## Related

- `core/approval-attestations.mjs` — the contract and its verification
- `governance/assertion-issuers.template.json` — identity-provider material (human proof)
- `governance/attestation-issuers.template.json` — service keys (custody proof)
- `governance/identities.template.json` — the four floor service identities, none holding a role
- `../../../../../docs/notion-floor-plan.md` — the programme, its goals, and the WS5 entry gate
