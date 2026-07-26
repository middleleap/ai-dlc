# ADR-0005 — How a human decision is proven, independently of the bridge

**Status:** **accepted** · **Date:** 2026-07-25 · **Accepted:** 2026-07-25 by **@michartmann**,
repository owner and Factory Floor programme sponsor, for the *method* — see **Scope of this
acceptance** below · **Institutional deciders (per adopter, unassigned here):**
`information-security` · `risk-second-line` · `data-protection` · `enterprise-architect` ·
**Programme:** Factory Floor (`docs/notion-floor-plan.md`)
**Companions:** plan §0 finding **F1** · §4 WS5 entry gate and D5.2 · §7 open decision 5 · WS2 ·
D2.4/D2.5 · `docs/notion-floor-identity-mapping.md` (P6 — the subject → registry join) ·
`docs/notion-floor-threat-model.md` · `plugins/middleleap-loom/skills/loom-adopt/harness/core/approval-attestations.mjs`
(the shipped contract) · `plugins/middleleap-loom/skills/loom/references/governance.md`.

This record decides **what makes a decision taken on the floor an approval in the record** — the
mechanism by which a named human's judgment is proven to a gate that will never meet them, and
that must reach its verdict offline. It answers review finding F1 directly and is the WS5
entry-gate decision. It decides nothing about routing, evidence presentation, or the approval
page's design (D5.1), and it does not re-decide the subject → registry join, which is the identity
mapping's territory (P6 / D0.4 part 2).

## Context

F1 was verified against the harness before v2 of the plan was written, and it holds:
`core/attestations.mjs` resolves a **registered issuer** and cryptographically verifies **its key**
over the payload. That is a correct and useful check, and it proves the wrong thing. A registered
issuer key proves **the service signed**; it does not prove that the named human decided. A
bridge-signed envelope carrying *`risk-second-line` approved* is a service making a claim about a
person, which is the exact shape a regulator's question — *who decided?* — is designed to defeat.

**Half the gap is already closed in the record's shape.** WS2 · D2.4 shipped
`core/approval-attestations.mjs` (`loom.approval-attestation/v1`). It separates the two signatures
and refuses to let them be confused:

- `subject.assertion` — the human's proof, issued by the institution's identity provider, binding
  an immutable subject to **this** decision payload via a nonce.
- `transcription.attestation` — the bridge's proof of faithful carriage. **Custody, never
  authority.**

The module refuses an assertion signed by a key from the service-issuer registry, refuses the
transcriber as the subject, refuses a transcriber holding any approval role, and requires the
assertion's nonce to equal `sha256` of a canonical, order-fixed payload naming schema, change id,
stage, outcome, role, registry id, IdP subject, `plan_hash`, `passport_digest`, `source_sha`,
`artifact_digest`, and the origin nonce. An approval therefore cannot outlive the thing it
approved.

**What is still open is which mechanism issues that assertion.** The shipped module accepts three
declared mechanisms — `ed25519`, `oidc-step-up`, `sigstore` — and verifies only the first for
real; the other two are reported **UNVERIFIED-HERE**, a finding rather than a silent pass. Plan §7
decision 5 leaves the choice to this review. So the record shape is fixed and the trust anchor is
not, and until it is, D2.5's extended PA gate has nothing to verify.

**The constraint that eliminates most of the design space** is where verification happens. The
harness gates are pure Node with **no network**: `discovery/gates/validate.mjs` and its siblings
run offline, and the adapter contract exists so the core never learns a vendor's API. A mechanism
whose verification requires an outbound call at gate time is not adoptable here — not as a
preference, but because the gate cannot make the call. Whatever is chosen must verify against
material **pinned in the repository** (`docs/governance/assertion-issuers.json`) and nothing else.

Two residual facts belong in the context rather than the footnotes. The identity mapping records
**GAP-6**: the pivot is only as good as the directory — a compromised or misconfigured identity
provider compromises every mapping downstream. And no option below can prove that the approver
*read* the evidence; that is the comprehension-debt risk the plan names, and its control is D5.1's
evidence-carried-in rule, not cryptography.

## Options considered

The seven criteria the deciders should weigh, applied to each option below:

| Criterion | Why it decides |
|---|---|
| **Subject-to-payload binding** | Whether the human signed *this decision* or merely *a moment* |
| **Replay resistance** | Whether the same proof can be moved onto a different change |
| **UX friction** (G1) | A non-technical approver must be able to complete it unaided |
| **Operability inside Notion** | What the floor can actually do at the moment of the click |
| **Offline verifiability** | The gate is pure Node, zero dependencies, no network |
| **Key custody** | Who holds what, and what a compromise of it buys an attacker |
| **Auditor legibility** | Whether a second-line reviewer can follow the proof without a cryptographer |

### Option A — Step-up SSO/OIDC re-authentication at the moment of decision (`oidc-step-up`)

- **What it is:** the decide action carries the approver to a **bank-controlled approval endpoint**
  (hosted with the bridge and freezer per P5 / ADR-0002), which assembles the canonical decision
  payload, presents the same evidence block the floor showed, and initiates an OIDC authentication
  request against the institution's identity provider with `nonce` set to the `sha256` digest of
  that payload, `aud` set to the approvals audience, and an `acr`/`amr` requirement naming the
  authentication strength the institution demands of an approval. The returned ID token — a
  compact JWS — is carried into `subject.assertion` with `mechanism: "oidc-step-up"`,
  `issuer` = the pinned IdP entry, `subject` = `sub`, `nonce` = the payload digest.
- **Costs:** an OIDC client registration and redirect handling in a service the institution
  controls; JWKS material pinned in `assertion-issuers.json` and rotated by pull request; and the
  approver re-authenticates **per decision** — friction that is the point, not a defect. It also
  requires the decision to leave the Notion page for a bank-controlled surface and return, because
  a Notion page cannot itself perform an authorization-code redirect and receive the callback.
- **Risks:** overloading the OIDC `nonce` to carry a payload digest is legitimate and is exactly
  what the shipped module expects, but **not every identity provider passes an arbitrary
  caller-supplied nonce through to the ID token unmodified, and length handling varies**.
  **AWAITING:** verification against the institution's own IdP that a 71-character
  `sha256:`-prefixed nonce round-trips intact — if it does not, the binding must move to a
  documented alternative claim and this option's central property is weakened. Second,
  GAP-6 concentrates here: this option puts the entire authenticity of the approval chain on the
  directory. Third, a step-up is a *login*, and a user trained to click through logins is trained
  to click through this one — the binding proves which decision was signed, never that it was
  considered.

### Option B — Separately observed IdP assertion, fetched out of band by an independent observer

- **What it is:** the approver decides on the floor with no additional step. The **independent
  observer** identity (P4's fourth identity) subsequently queries the identity provider's sign-in
  or audit interface and produces signed evidence that the named subject authenticated to the
  workspace within a defined window around the decision, and the observer signs that observation.
- **Costs:** an observer integration with the directory's audit interface, a defined correlation
  window, and observer key custody. Materially the lowest build cost of the three, and by a wide
  margin the lowest friction — the approver's experience is a single click on the floor, which is
  the best possible answer to G1.
- **Risks:** the fatal one is that **it proves a session, not a decision.** *Subject authenticated
  at 10:02; a decision appeared at 10:04* is equally consistent with the subject deciding, with a
  hijacked session, with a shared screen, with a delegated workspace seat, and with the bridge
  fabricating a decision during a window in which the human happened to be logged in. There is no
  nonce to bind, because the human never signed anything about this change — so the option cannot
  satisfy the shipped module's requirement at all: the observation would have to be recorded as an
  attestation **by a service**, which is precisely the shape F1 rejects, differing from the status
  quo only in which service vouches. It also inherits the vendor's report of who acted, the same
  weakness that makes the Notion person id unfit as a join key.
- **Fair reading:** as a *corroborating* stream it is genuinely valuable — an independent
  observation that the seam behaves as designed is exactly what D5.3's `notion-activation`
  adapter is for. It is not a candidate for the decision stream.

### Option C — Sigstore-style short-lived identity certificate (`sigstore`)

- **What it is:** the decision triggers an OIDC flow whose ID token is exchanged at a
  Fulcio-style certificate authority for a **short-lived signing certificate** carrying the human
  subject in a SAN; a client generates an ephemeral key, signs the canonical decision payload
  directly, and the certificate, the signature, and — where used — a transparency-log inclusion
  proof are carried into `subject.assertion` with `mechanism: "sigstore"`. The binding is the
  strongest available: the human's key signs the payload itself rather than a token that mentions
  its digest.
- **Costs:** the institution must run or trust the CA and the log; a signing-capable client must
  be present at the approver's moment of decision — a browser or desktop component, not a Notion
  page; and the offline gate must verify a certificate chain and, if used, an inclusion proof.
  That is materially more verification code than a JWS check, and every line of it is
  control-plane code under HG-0002 inside a zero-dependency core.
- **Risks:** where the infrastructure does not already exist, this option answers an approvals
  question by standing up a PKI, with a new custody question attached. Transparency-log
  publication is a confidentiality and residency decision in its own right — what appears in a
  shared or public log about the institution's change ids, roles, and approver identities is a
  disclosure question, not an engineering one. **AWAITING:** `data-protection` position on any
  transparency-log publication, if this option is pursued.
- **Fair reading:** strongest binding, best replay story, and the best auditor story *for a
  technical auditor*; the least legible of the three to a second-line reviewer who is not one.

### How the three compare

| Criterion | A — step-up OIDC | B — observed assertion | C — Sigstore-style |
|---|---|---|---|
| Subject-to-payload binding | Nonce over the exact payload digest | **None** — time correlation only | Direct signature over the payload |
| Replay resistance | Nonce single-use + `seen` set + `exp` | Weak — any session in the window | Strong; log inclusion adds a second check |
| UX friction (G1) | One re-authentication per decision | Effectively none | Signing client at the decision moment |
| Operability inside Notion | Decide action leaves to a bank-controlled endpoint and returns | Fully in-page | Needs a signing-capable client |
| Offline verifiability | JWS against pinned JWKS — small, pure Node | Verifies a service signature, not a human | Chain + optional inclusion proof — larger |
| Key custody | IdP holds signing keys; no new custodian | Observer key; the bridge problem relocated | Ephemeral keys + CA + log to run or trust |
| Auditor legibility | Familiar: "they logged in again, over this decision" | Misleadingly reassuring; weakest under scrutiny | Precise but specialist |

## Scope of this acceptance

This ADR is **accepted for the method** — it settles what mechanism the Loom's contract is built
around, and `core/approval-attestations.mjs` may be developed against Option A plus the hard
condition below without the decision being reopened. That is a decision about *this repository*,
which is a method and harness, not a bank.

It is deliberately **not** a substitute for two things it does not have standing to grant:

- **An adopting institution's own sign-off.** The four decider roles above stay unassigned here on
  purpose. A CBUAE-regulated adopter records its own `information-security`, `risk-second-line`,
  `data-protection` and `enterprise-architect` decision against its own identity provider, its own
  assurance levels, and its own joiner/mover/leaver process. Nothing in this file speaks for them.
- **The WS5 entry gate.** That gate has *two* conditions (plan §4, WS5): the F1–F4 corrections
  merged, **and an independent second-line review of the workstream's design**. This acceptance
  settles the first condition's mechanism question. The second is a review of routing, surfaces and
  operations — a different artifact — and it stands.

Accepting a mechanism is not the same as activating it. No shipped profile compiles the
`approval_attestation` capability; the contract remains **declared, not active**, and `oidc-step-up`
still reports UNVERIFIED-HERE until an adopter pins provider metadata and records activation
evidence. A superseding ADR — not an edit to this one — moves the mechanism to Option C.

## Decision

**Accepted: Option A — step-up OIDC re-authentication (`oidc-step-up`) as the primary
mechanism**, subject to one hard condition, with Option C named as the strategic direction and
Option B admitted only as corroboration.

**The hard condition, non-negotiable:** an assertion counts only if it **binds a nonce equal to the
`sha256` digest of the canonical decision payload**. An assertion that proves an authentication but
not *this* decision is a login, and the shipped module already says so in those terms. Alongside
the nonce, the gate checks `iss` against the pinned issuer entry, `aud` against the approvals
audience, `acr` against the accepted values, `sub` against the record's `idp_subject`, and the
single-use property against the `seen` set. Any of those absent, the approval is not evidence.

The reasoning is that A is the only option that produces an **identity-provider-issued,
subject-bound** assertion using infrastructure a CBUAE-regulated institution already runs, already
audits, and already governs through a joiner/mover/leaver process — which is also what makes the
P6 mapping's pivot defensible. B is refused as a primary because time correlation is not binding;
adopting it would move the vouching service from the bridge to the observer and leave F1 exactly
where the review found it. C binds better than A and is the right destination, but where the
infrastructure is absent it trades a solved identity problem for an unsolved key-custody one, and
its verification burden lands inside a zero-dependency control plane.

**Option C is the strategic direction, and it costs nothing to hold open.** The record shape does
not change: `loom.approval-attestation/v1` already accepts `sigstore`, and the canonical payload
the human signs is the same string. An institution that already runs Sigstore-style infrastructure
should choose C now; one that does not should adopt A and treat a later move to C as a superseding
ADR that changes a mechanism, not a schema.

**What Option A does not prove, stated plainly.** It proves that the named subject authenticated to
the institution's directory, at that moment, at the required strength, over a nonce that names this
exact decision — its stage, outcome, role, plan hash, and content digests. It does not prove the
human read the evidence, understood it, or was not under duress. No mechanism in this space can.
The comprehension control is D5.1's evidence-carried-in rule and the second line's own review; this
ADR must not be cited as covering it.

**Accepted** 25 Jul 2026 for the method (see *Scope of this acceptance*). Acceptance settles the
mechanism, not its activation: the D2.4 amendment below has since shipped, but `oidc-step-up`
reports UNVERIFIED-HERE until an adopter pins their identity provider's metadata and the nonce is
verified against it. The comprehension control named just above is not covered by either.

## Consequences

**The gate verifies the assertion offline, against pinned metadata.**
`docs/governance/assertion-issuers.json` holds, per identity provider: the issuer id, the JWKS
(key id → public key), the required `aud`, the accepted `acr` values, and the maximum assertion
age. `product-approval-check`, extended per D2.5, performs a JWS signature verification and the
claim checks against **that material only** — no network call, no vendor SDK, no dependency added
to the core. Key rotation becomes a pull request under CODEOWNERS. A token signed by a key not
pinned at verification time fails closed, which is the correct default and will be experienced as
an outage the first time a rotation is landed late.

**Retired keys must be retained, not replaced.** Verifying a two-year-old approval requires the key
that signed it. `assertion-issuers.json` therefore carries retired keys with their validity
windows; a rotation that deletes the superseded key silently invalidates every historical approval
it signed. This is the most likely way to break the audit trail by accident, and it is a
one-line-of-JSON mistake.

**`assertion-issuers.json` becomes the most sensitive file on the floor's seam.** Whoever can amend
it can mint an accepted issuer, and therefore mint approvers. It belongs under the tightest
second-line CODEOWNERS ownership in the tree, alongside `release-hold.json` — not with the sync
service's configuration, and never within reach of any of the four seam identities.

**This decision presumes the collaboration surface is joined to the institution's directory, and
that presumption was unstated.** Every option above assumes an identity provider exists on the
surface side: Option A authenticates against it, Option B observes assertions issued by it, and the
P6 identity map exists to join a surface-side subject to a registry identity. On a workspace
**without SAML SSO and SCIM** — which on the incumbent vendor means anything below the enterprise
tier — none of that is available. There is no issuer, so `subject.assertion` has nothing to bind
to, and the identity map has nothing on the surface side to join. Confirmed against a live
workspace on 26 Jul 2026 (`notion-floor-alpha-walkthrough.md` §8), where the SSO/SCIM panel
displays identifiers for a capability the plan cannot actually use.

The consequence is a **procurement precondition, not an engineering one**: enterprise-tier SSO plus
SCIM provisioning is a prerequisite of this ADR, and it belongs in P2 alongside the residency and
outsourcing questions rather than being discovered during WS2. A pilot on a lower tier can exercise
the *transcription* path, since that signs custody only — but it cannot produce a subject
assertion, and any envelope it emits is a draft artifact by construction.

**A defect in the D2.4 module that this decision surfaced — now FIXED (loom `2.0.0-rc.13`).**
As first written, `verifySubjectAssertion` rejected an assertion whose
`subject.assertion.expires_at` was earlier than the *verification* time. An OIDC ID token's
lifetime is minutes; a governed approval is re-verified on every gate run for years — so **every
approval made under Option A would have begun failing verification shortly after it was made**,
and the contract would have been unusable with the very mechanism this ADR recommends. Resolution
(i) was taken: the assertion's window is judged for containment of the **signed decision time**
(`validity.issued_at`, which is itself in the canonical payload, so a carrier cannot move it),
while the record-level `validity.expires_at` remains the *approval's* own expiry checked against
now. The module also refuses an assertion **issued after** the decision it attests. Three tests
pin the behaviour, including one that verifies a five-minute token a year later and passes.
Replay control is unaffected — it comes from the single-use nonce and the `seen` set, never from
expiry. This was a blocking dependency for Option A; it is closed.

**The approver's path, measured against G1.** Inbox card on the floor → decide action →
bank-controlled approval endpoint presenting the same evidence → IdP step-up → return to the page.
That is one authentication more than a click and one surface more than Notion. G1's measure — the
PA1 approver never opens GitHub — still holds exactly as written; *"never leaves Notion"* was never
the measure and must not be presented as one in the M2 demo. Batch approval is impossible by
construction: the nonce binds one payload, so `n` decisions require `n` step-ups. **AWAITING:**
whether the second line wants a batch affordance at all — it is a comprehension-debt judgment, not
a technical constraint.

**This decision is a WS5 entry-gate item and requires independent second-line review.** Nothing
produced under it counts as governed evidence until three things are true: the F1–F4 corrections
are merged (D2.4 as amended, D2.5 shipped), the P6 identity mapping is live and approved, and an
**independent second-line review of the WS5 design — this mechanism included — is recorded in
git**. Until all three, every approval surface on the floor runs under the unmistakable
**NON-AUTHORITATIVE · DECLARED, NOT ACTIVE** label, and the `notion-pa-decision` adapter ships
declared, not active. **AWAITING:** the independent second-line reviewer — name, date, and the
merged review record.

**What must be revisited, and when.**

- **Immediately**, on the IdP nonce round-trip verification — the recommendation depends on it.
- **Before any envelope is claimed as evidence**, on the `expires_at` amendment above.
- **At every `assertion-issuers.json` rotation**, to confirm retired keys were retained.
- **If the institution stands up Sigstore-style infrastructure** — a superseding ADR moves the
  mechanism to `sigstore`; the record shape and the canonical payload do not change.
- **Annually, and on any material IdP change** (provider migration, `acr` policy change, directory
  consolidation), because GAP-6 makes the directory a single point of trust for the whole chain.

## Compliance notes

| Control / gate | How this decision touches it |
|---|---|
| **HG-0001** (four-eyes) | Strengthened on the *who* axis, unchanged on the *merge* axis. The assertion binds a named human to a decision; the envelope still enters `docs/governance/` by pull request under CODEOWNERS and a second-line human still merges. The bridge holds no approval role and cannot merge — the shipped module refuses a transcriber that holds one |
| **HG-0002** (immutable control plane) | Directly engaged. The verification path (D2.5) is control-plane code, and `assertion-issuers.json` is control-plane **data** — amending it mints approvers. Both sit under second-line CODEOWNERS, out of reach of all four seam identities. The zero-dependency, offline property of the gates is preserved by construction, which is itself part of why Option A was chosen |
| **HG-0003** (tamper-evident evidence) | The assertion becomes the anchor for *who* in the sealed record, as the digest chain is the anchor for *what*. The canonical payload binds `plan_hash`, `passport_digest`, `source_sha`, and `artifact_digest`, so an approval cannot survive its subject being changed underneath it |
| **HG-0004** (least-privilege identity, vaulted secrets) | The OIDC client credentials are vaulted and belong to the bank-controlled approval endpoint. Critically, **no seam identity holds any key capable of producing a subject assertion** — the bridge signs custody only, and a service key presented as an assertion is refused outright |
| **HG-0011** (residency) | Engaged twice. Under Option A the authentication occurs against the institution's own directory and the evidence block is rendered by a bank-controlled endpoint, so no assertion material need reside with the vendor — only a digest and an opaque nonce ever appear on the floor. Under Option C, transparency-log publication would be a disclosure of change ids and approver identities and needs its own residency determination. **AWAITING:** `data-protection` confirmation that the assertion record's contents sit inside the P1 residency envelope |
| **HG-0013** (graduated autonomy) | Untouched and reinforced. The bridge proposes; the merge disposes. No mechanism here moves any part of disposal into the loop, and no routine envelope is created or implied |
| **HG-0006** (model risk) | Not engaged. No model participates in the assertion path, and no floor-keeper agent holds a grant on any field in it |
| **PA gates (D2.5)** | This is the decision that gives `product-approval-check`'s envelope-verification path something to verify. Mandatory-when-compiled; it tightens and never loosens, so **G2**'s requirement that no gate's verdict authority changes is preserved — the gate gains a refusal, not a permission |
| **Regulatory (CBUAE, PDPL)** | The attestation record permanently commits personal data to git: an immutable IdP subject, a registry id, a role, and a decision timestamp, for a named individual. That is a retention and lawful-basis question, not an engineering one. **AWAITING:** `data-protection` determination on retention of assertion records and on whether the IdP subject may be committed in clear or must be committed as a salted digest with the mapping held separately. **AWAITING:** `risk-second-line` confirmation of the required `acr` level for an approval decision |

This record activates no control. It selects the mechanism that a control — the extended PA gate —
will verify once D2.4 is amended, D2.5 ships, the identity mapping is approved, and the independent
second-line review is recorded. Until every one of those has happened, an envelope produced under
this design is a draft artifact, and the surfaces that produce it say so.
