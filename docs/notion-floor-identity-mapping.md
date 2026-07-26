# Identity mapping specification — the Factory Floor

**Status:** **DRAFT — not approved. Nothing in this specification is in force, and no code reads
the mapping today.** · **Deliverable:** D0.4 part 2 (WS0), prerequisite **P6** of
`docs/notion-floor-plan.md` · **Drafted:** 2026-07-25 · **Owner:** AWAITING — programme owner to
be named, must resolve to a registry identity · **Approvers required:** information-security +
risk-second-line + data-protection (see §12) · **Companions:** the D0.4 threat model and
per-identity capability matrix (part 1, drafted separately) · `docs/notion-floor-plan.md` ·
`docs/notion-floor-residency-review.md` (D0.1) ·
`plugins/middleleap-loom/skills/loom/references/governance.md`.

This specification answers review finding **F1**: a click on the floor must resolve to an
immutable institutional subject and to a Loom registry identity **independently of the bridge
that transcribed it**. It defines the three-way mapping Notion person id → IdP subject → registry
identity, the record format and its home in git, the joiner/mover/leaver lifecycle, the
resolution algorithm a gate follows and every reason it rejects, mapping drift as a named risk
with fail-closed behaviour, and the rules that keep service identities out of the human column.
It is written to be refused as easily as approved: every point that needs an institution's own
answer is marked, every gap between this design and what the harness actually enforces is named.

## 0 · How to read the markers

| Marker | Meaning |
|---|---|
| **AWAITING:** | A human decision or signature that does not exist yet. Never fill one in on someone's behalf |
| **INSTITUTION-SPECIFIC:** | The Loom cannot answer this; the adopting institution's own policy, directory, or contracts decide |
| **VENDOR-QUESTION:** | A fact about the SaaS vendor that must be established from its documentation or contract — not from this document, and not from memory |
| **PROPOSED:** | A mechanism this document designs but which no shipped gate performs yet |
| **ILLUSTRATIVE:** | Fictional worked-example material. Never a real person, account, or approval |

Two words are used strictly. **Shipped** means code in the bundle performs the check today.
**Proposed** means this document specifies it and nothing enforces it. Section 9 lists every gap
between the two, because the method's tradition is that silence must never be mistaken for
coverage.

## 1 · The question this answers

The floor produces a click. The record needs a decision. Between them sit three claims that look
like one claim and are not:

1. **A workspace account acted.** Notion reports a person id on the webhook. That is a fact about
   the vendor's user table.
2. **A person at the institution acted.** Only the institution's identity provider can say that,
   and only by issuing an assertion the person's own authentication produced.
3. **An approver in the Loom acted.** Only `docs/governance/identities.json` says who holds
   `risk-second-line`, and only the gates read it.

F1 holds because nothing in the harness bound claim 1 to claim 2. `core/attestations.mjs`
resolves a registered issuer and verifies its key over a payload — that authenticates the
*worker*. A bridge-signed envelope proves the bridge signed; it does not prove the named human
decided. WS2 · D2.4 closed half of the gap: `core/approval-attestations.mjs` now demands a
`subject.assertion` issued by the identity provider, refuses an assertion signed by a service
key, refuses the transcriber as the subject, and binds the assertion's nonce to a canonical
decision payload naming the plan hash and the content digests.

The half it does not close is the join. The assertion carries an **IdP subject**; the gate
resolves a **registry id**; the record simply asserts that the two belong together
(`rec.subject.idp_subject` and `rec.subject.registry_id` sit side by side in a file the bridge
wrote). Nothing independent says they do. **That is what this mapping is: the second-line-owned,
git-canonical statement that a given immutable subject is a given registry identity, established
by a human who verified it, and revocable.** Without it, a bridge with a valid service key and a
stolen or fabricated subject string could name any registry identity it liked, and every
cryptographic check in D2.4 would still pass.

## 2 · The three-way mapping, and why the IdP subject is the pivot

### 2.1 · Three identifier spaces

| Space | Identifier | Issued by | Mutable? | Scope | What it actually proves |
|---|---|---|---|---|---|
| **Floor** | Notion person id (UUID) | The vendor | Reassignable on re-provisioning; meaningless outside the workspace | One workspace | That *some* account in *this* workspace acted |
| **Institution** | IdP subject (`sub`) | The institution's identity provider | Immutable for the life of the account; never reissued | The institution | That *this* human authenticated, at this moment, to this audience |
| **Record** | Registry id in `identities.json` | The second line, by pull request | Changed only by PR under CODEOWNERS | The governed repository | Which roles and groups the Loom's gates will honour |

The three have three lifecycles, three owners, and no shared transaction. A person may exist in
all three, in two, or in one. The mapping is the only artifact that makes a statement across the
boundary, and it is therefore the only place the boundary can be governed.

### 2.2 · Why the pivot is the IdP subject

The mapping is a triangle, but the authority runs through one vertex. The IdP subject is the
pivot for four reasons, and no other identifier has all four:

- **The institution controls it.** The floor's person id is the vendor's. If the workspace is
  migrated, re-tenanted, or replaced by Jira tomorrow, every person id changes and not one
  institutional fact does. HG-0008's seam rule applies to identity too: the vendor is mounted,
  not embedded.
- **It is never reassigned.** A subject claim identifies one account for its lifetime and is not
  reissued to a successor. Email is; workspace seats are; job titles are.
- **The joiner/mover/leaver process already governs it.** The institution's directory is where
  someone becomes an employee and stops being one. Anchoring on it means the mapping inherits an
  existing, audited lifecycle rather than inventing a parallel one nobody runs.
- **An assertion can be issued over it.** This is the decisive one. The subject is the only one
  of the three that a human can *prove* they hold, in the moment, by authenticating — which is
  exactly what D2.4's `subject.assertion` requires. A registry id cannot be authenticated; it is
  a label in a file. A person id cannot be authenticated; it is a value the bridge observed.

So the join runs **from the assertion inward**: the verified assertion yields a subject; the
subject yields exactly one active mapping entry; the entry yields a registry id; the registry
yields kind, roles, and groups. Every step after the first reads a file committed to git under
CODEOWNERS. No step consults the vendor, and no step trusts a value the bridge chose.

### 2.3 · Why email must never be the join key

Email is the obvious join key, it is what every integration reaches for, and it must be refused.

- **It is reassignable.** A departed employee's address is routinely handed to a successor or
  aliased to a function mailbox. Joining on email means the successor silently inherits the
  predecessor's approval authority — the exact failure a leaver process exists to prevent.
- **It is spoofable at the point of entry.** A workspace guest is invited under whatever address
  an administrator types. Email in the vendor's user table is an *attribute the vendor stores*,
  not a claim the institution verified. Treating it as proof imports the vendor's invite flow
  into the institution's approver set.
- **It is mutable for ordinary reasons.** Name changes, domain migrations, and rebrands rewrite
  addresses. A control that breaks on a marriage or a merger is not a control.
- **It is not unique in practice.** Aliases, plus-addressing, shared function mailboxes,
  case-folding and unicode normalisation all produce two strings that are and are not the same
  address depending on which system is asked. **A join key that needs a normalisation heuristic
  is not a join key.**

**The rule.** Email may be *displayed*; it may never be *joined on*. No gate, no mapping record,
and no bridge code path may compare email addresses to establish identity. Concretely, the
mapping record carries **no email field and no free-text name** — the human-readable label comes
from the registry entry's `display`, and nothing else. A reviewer who finds an email comparison
anywhere in the resolution chain should treat it as a control defect, not a convenience.

The same logic disqualifies display names, job titles, and Notion group membership. Workspace
group membership grants *visibility*; it never grants authority, and it is never an input to
resolution.

## 3 · The mapping record

### 3.1 · Where it lives, and who owns it

**Path:** `docs/governance/identity-map.json` — a peer of `identities.json`, in the same
second-line-owned directory, under the same rules.

- **CODEOWNERS:** owned by the second line — the same non-builder group that owns
  `identities.json`. **AWAITING:** the institution's CODEOWNERS line and owning team name.
- **Change control:** by pull request only, with a second human at the merge (HG-0001). The
  control plane is immutable to the agent and to every service identity (HG-0002).
- **Never projected.** The map is personal data by construction (§12) and it is the seam's
  highest-value target. It stays in the record. The floor may show a person's name — which the
  workspace already knows — and must never display or store an `idp_subject`.
- **Never written by a service.** See §7. This is not a preference; it is the property that keeps
  F1 closed.

### 3.2 · Shape

**PROPOSED** — schema `loom.identity-map/v1`. One file per collaboration surface, or one file
carrying a `surface` discriminator per entry; §9 GAP-7 flags the choice as open.

```json
{
  "schema": "loom.identity-map/v1",
  "surface": { "system": "notion", "workspace_id": "AWAITING", "tenant": "AWAITING" },
  "idp": { "issuer": "AWAITING", "subject_claim": "sub" },
  "reconciled_at": "AWAITING — written by the reconciliation observation, not by hand",
  "entries": []
}
```

An entry — **ILLUSTRATIVE**, fictional throughout:

```json
{
  "notion_person_id": "5d81f3a7-0c44-4e19-9b6a-2f8d1e037c55",
  "idp_subject": "u:4ae2c018-7d93-4a51-8f2c-6b0e91a4dd37",
  "registry_id": "comp-imran",
  "roles_at_mapping": ["compliance"],
  "verification": { "method": "assertion-derived", "reference": "enrolment-2026-05-04-0912Z" },
  "mapped_at": "2026-05-04T09:14:11Z",
  "mapped_by": "risk-lena",
  "status": "revoked",
  "revoked_at": "2026-06-30T16:00:00Z",
  "revoked_by": "risk-lena",
  "revocation_class": "departed",
  "note": "left the institution; workspace account deprovisioned the same day"
}
```

### 3.3 · Field rules

| Field | Required | Rule |
|---|---|---|
| `notion_person_id` | yes | The vendor's UUID for the account, read from the API — never typed from a directory. Routing and cross-check only; never an authority |
| `idp_subject` | yes | The pivot. Opaque, immutable, from the issuer named in `idp`. Recorded from an assertion or an authoritative directory read; never derived from an address |
| `registry_id` | yes | Must exist in `identities.json`, `kind: "human"`, and must not be a service identity (§7) |
| `roles_at_mapping` | yes | **A snapshot for audit only.** Never read as an authorisation source — see §3.4 |
| `verification` | yes | `method` ∈ `assertion-derived` \| `directory-plus-console`, plus a `reference` an auditor can follow (§4.1) |
| `mapped_at` | yes | RFC 3339, UTC. The instant from which the mapping may be relied on. Not the merge time — the gate uses both (§5) |
| `mapped_by` | yes | The registry id of the **human who verified the binding**. Must not be the subject; must not be a builder; must hold a second-line or information-security role. **AWAITING:** which function the institution assigns |
| `status` | yes | `active` \| `revoked`. There is no third value, and no `pending` — an unmerged entry is not an entry |
| `revoked_at`, `revoked_by`, `revocation_class` | on revocation | `revocation_class` ∈ `departed` \| `account-reprovisioned` \| `for-cause`. The class changes what happens to in-flight approvals (§4.3) |
| `superseded_by` | optional | For a re-provisioned workspace account: points at the entry that replaces this one, so the history reads forward |
| `note` | optional | Free text for an auditor. Never parsed, never authoritative |
| *email, display name, title, workspace group* | **forbidden** | Not present in the schema. §2.3 |

### 3.4 · Four invariants

1. **Uniqueness.** At most one `active` entry per `idp_subject`, per `notion_person_id`, and per
   `registry_id`. Two active entries for one subject is not a merge conflict to resolve by
   picking one — it is a rejection (IM-R10). One human is one registry identity wearing several
   hats (the roles-not-headcount model), which is one mapping entry, not several.
2. **Roles are never granted here.** `roles_at_mapping` is evidence of what was true at mapping
   time. If a gate ever read it as authority, the map would become a second, invisible role
   registry that the policy compiler cannot see and the identity gate does not validate. Roles
   come from `identities.json`, at verification time, always (IM-R22).
3. **Append-only in effect.** Revocation sets `status`; it never deletes an entry. The history is
   the evidence that a decision made in March was made by someone who held the mapping in March.
   A removed entry is a finding, not a tidy-up.
4. **No self-mapping.** `mapped_by` ≠ `registry_id`. A person may not attest to their own
   binding, for the same reason a builder may not issue their own second-line approval.

## 4 · Lifecycle

### 4.1 · Joiner — how a mapping is created and verified

Order matters, and the order is: **record first, floor last.**

1. **The registry entry exists.** A PR adds the human to `identities.json` with their roles and
   groups, merged under CODEOWNERS with a second human. No mapping may reference an identity that
   does not exist.
2. **The subject is obtained from an authoritative source** — the institution's directory or an
   authentication the person performs. Never transcribed from an email address, a spreadsheet, or
   a vendor export.
3. **The workspace account is created and its person id read from the API** for that account.
4. **The binding is verified by a named human** (§4.1.1), who becomes `mapped_by`.
5. **The PR lands** the entry under second-line CODEOWNERS, second human at the merge.
6. **Only then** may the person appear in an approval surface's people property. Until the map
   entry is merged, the floor may show them the work; it may not route them a decision.

#### 4.1.1 · The two verification methods, and their unequal strength

- **Method A — assertion-derived (preferred).** The person completes a step-up authentication
  against the institution's identity provider through the enrolment flow; the subject recorded is
  the one the resulting assertion carried. **No human types a subject.** This proves the person
  holds the account, at that moment, and produces an artefact an auditor can re-verify.
- **Method B — directory-plus-console.** An administrator reads the subject from the authoritative
  directory and the person id from the workspace admin console for the same account, and records
  both. This proves *two records agree*; it does not prove the person holds either account. It is
  weaker, and this document says so plainly. **INSTITUTION-SPECIFIC:** whether Method B is
  acceptable at all for identities holding second-line roles — the drafter's proposal is that it
  is not.

**AWAITING:** the institution's choice of method. It must not contradict open decision 5 in the
plan (the human-assertion mechanism for D5.2, chosen in the WS5 entry-gate review): if the
decision mechanism is `oidc-step-up` or `sigstore`, Method A should use the same identity provider
and the same subject claim, or the enrolment proves a binding the decision path never exercises.

#### 4.1.2 · Guests, contractors, and anyone outside the directory

If an account cannot carry an IdP subject issued by the institution's directory, **it cannot be
mapped, and therefore cannot approve.** External counsel, vendor staff, and agency contractors
may read and comment on the floor within the residency record's limits; they may never hold a
mapping entry. **INSTITUTION-SPECIFIC:** whether long-tenure contractors are issued directory
accounts, which is the only route by which they could ever hold one.

### 4.2 · Mover — the mapping survives; the roles do not come from it

A role change is a change to `identities.json`. It is **not** a change to the map. The mapping
binds a person to their accounts; roles are an attribute of the registry identity, and the gate
reads them fresh on every run.

- A promotion into the second line is a registry PR. The mapping entry is untouched.
- A move that would put someone in `builders` while holding a second-line role is already refused
  by `identity-registry-check.mjs` (disjoint membership). The map neither duplicates nor weakens
  that check.
- `roles_at_mapping` now differs from the registry. **This is expected and is not drift.**
  Reconciliation reports it as an informational delta and never as a failure (drift class D-D,
  §6). Re-snapshotting is optional and happens only when the entry is next changed for another
  reason.
- Workspace group membership on the floor follows the registry, never the reverse. Adding someone
  to a Notion group grants them a view; it grants no role, and no gate will notice it.
- **A name change or an email change changes nothing at all.** That is the strongest single
  argument for the pivot in §2.2, and the cheapest test of whether an implementation got it right:
  if changing an address breaks resolution, the implementation is joining on email somewhere.

### 4.3 · Leaver — revocation, and what happens to in-flight approvals

**Sequence, fail-closed:**

1. **Disable the IdP subject.** This is the **enforcement of record**. The assertion path dies
   here: no assertion can be issued, so no new approval can be made, regardless of the state of
   any file in the repository.
2. **Deprovision the workspace account.** Removes the click, the notifications, and the seat.
3. **Land the map revocation PR** — `status: "revoked"`, `revoked_at`, `revoked_by`,
   `revocation_class`. This is the **record**, not the enforcement, and the document should not
   pretend otherwise: a repository file cannot stop an authentication.
4. **Handle the registry entry** by the registry's own process — which today has a gap (§9,
   GAP-1).

**In-flight approvals — the four cases:**

| Case | Outcome |
|---|---|
| An approval **merged** before revocation, bound to a plan hash and content digests | **Stays valid.** Revocation is not retroactive. This mirrors the drift rule in D4.2: drift never retroactively invalidates the merged record. The decision was validly made by someone who held the mapping and the role at the time |
| An attestation **issued but not merged** at revocation time | **Void — must be re-taken** by a current holder of the role. An unmerged attestation is a proposal, not a record, and nothing enters the governance tree on the strength of a subject that no longer exists. The bridge's open PR is closed with the reason recorded |
| A passport **still pending other roles**, carrying the leaver's merged approval | The recorded approval stands. **AWAITING:** an institution rule on whether a departed second-line approver's decision must be re-taken before PA2 on material or high-risk changes. The drafter proposes yes for second-line roles; either answer is defensible and neither should be assumed |
| Revocation with `revocation_class: "for-cause"` — suspected compromise or misuse | **Different rule.** In-flight is void as above, *and* every decision attributed to that subject inside the exposure window is reviewed. Raised as an operations signal, typed and routed like any other. Departure and compromise are not the same event and must not share a code path |

**AWAITING:** the exposure window for a for-cause review — from last known-good authentication, or
a fixed lookback. INSTITUTION-SPECIFIC.

### 4.4 · Periodic reconciliation

Reconciliation is the only mechanism that notices the three lifecycles diverging, and it is
therefore the control that makes the mapping more than a document. It is **PROPOSED**: nothing in
the bundle performs it today.

**Shape.** It follows the platform-activation precedent exactly (`platform-activation-example/`):
a live read of both authoritative sides, freshly timestamped, **signed by the independent
observer** — the human platform role from P4, outside the coding agent's and the bridge's
authority — and committed to git as an observation, not a claim.

**Cadence.** Proposed daily, and additionally on every joiner/leaver batch and before every
milestone review. **AWAITING:** the institution's cadence; a directory with same-day
deprovisioning tolerates daily, one with a weekly HR feed does not.

**The six assertions, and what failure does:**

| # | Assertion | Source read | On failure |
|---|---|---|---|
| A1 | Every `active` entry's `idp_subject` exists and is enabled | IdP / directory | Operations signal + the affected subject is listed in the observation; a gate resolving it rejects (IM-R25) |
| A2 | Every `active` entry's `registry_id` exists in `identities.json`, is `kind: "human"`, and is not a service identity | git | Operations signal; rejection at resolution (IM-R16/17/20) |
| A3 | Every `active` entry's `notion_person_id` still exists in the workspace and is a full member, not a guest | Workspace API | Operations signal; the entry is proposed for revocation by a human |
| A4 | **Reverse direction** — every workspace account holding a grant on an approval surface has exactly one `active` mapping | Workspace API × git | Operations signal, and the surface grant is removed. This is the assertion that catches an unmapped person being quietly added to an approver group |
| A5 | Uniqueness holds — no duplicate active subject, person id, or registry id | git | Rejection of every affected approval (IM-R10/23); the map is unsound until fixed |
| A6 | `roles_at_mapping` versus current registry roles | git | **Informational only.** Reported, never failed (§4.2) |

**What the reconciler may and may not do.** It may read both sides, emit the signed observation,
raise an operations signal, and — at most — **open a revocation PR as a proposal**. It may never
merge, never write the map on a branch that automerges, and never alter `identities.json`. The map
is second-line-owned; a job that could revoke unilaterally could also fail open by revoking
nothing, and neither behaviour should be invisible.

## 5 · The resolution algorithm

Given an approval attestation (`loom.approval-attestation/v1`) and the passport entry it claims to
evidence, resolution proceeds in this fixed order. **Shipped** steps are performed today by
`core/approval-attestations.mjs` and `scripts/identity-registry-check.mjs`; **proposed** steps are
the mapping extension this document specifies. **All five landed** in `core/identity-map.mjs` and
`scripts/identity-map-check.mjs` (loom `2.0.0-rc.13`); the table below is updated and GAP-3 is
closed.

| # | Step | State |
|---|---|---|
| 1 | Verify the subject assertion cryptographically over the canonical decision payload; refuse a service-key issuer; refuse the transcriber as issuer | Shipped |
| 2 | Confirm the assertion's subject claim equals the record's `idp_subject` | Shipped |
| 3 | Look up the **single `active` entry** in `identity-map.json` whose `idp_subject` equals it. Zero entries → reject. More than one → reject | **Shipped** |
| 4 | Confirm `entry.registry_id === record.subject.registry_id`. The record's registry id is a *claim* by whoever wrote the file; **the map is the authority** | **Shipped** |
| 5 | Where the record's `origin` carries a person id, confirm it equals `entry.notion_person_id` — the click and the mapping must agree | **Shipped** |
| 6 | Resolve `registry_id` in `identities.json`; it must exist | Shipped |
| 7 | Confirm `kind === "human"` — agents approve nothing | Shipped |
| 8 | Confirm the identity holds the required role **now, from the registry** — never from `roles_at_mapping` | Shipped |
| 9 | For second-line roles, confirm the identity is not in `builders` | Shipped |
| 10 | Confirm the identity is not a service identity, and is not the transcriber | Shipped (see §7 for the residual) |
| 11 | Confirm the mapping was **active at decision time**: `mapped_at ≤ t` and (`status === "active"` or `revoked_at > t`) | **Shipped** |
| 12 | Confirm the map file's own invariants (schema, uniqueness, no service subjects) and that its reconciliation observation is present and fresh | **Shipped** |

**On decision time `t`.** The canonical decision payload the human signs — `SCHEMA_ID`,
`change_id`, `stage`, `outcome`, `role`, `registry_id`, `idp_subject`, `plan_hash`,
`passport_digest`, `source_sha`, `artifact_digest`, `nonce`, `validity.issued_at`. An
approval's claimed time was therefore not bound by the human's signature when this specification
was first drafted. **That gap is now closed** (loom `2.0.0-rc.13`): `canonicalDecisionPayload()`
binds `validity.issued_at`, so a carrier cannot back- or forward-date a decision without breaking
the human's signature — a negative test asserts exactly that. Take `t` as the signed
`validity.issued_at`, cross-checked against the **merge time of the attestation file**, which git
anchors externally (HG-0003); a claimed time that post-dates its own merge is itself a finding.

**Reject means reject.** There is no fallback to email, no nearest-match, no "resolve by display
name", and no operator override. The only route past a rejection is a merged PR that changes the
map or the registry — reviewed by the second line, with a second human at the merge. An override
switch on this path would recreate F1 with extra steps.

### 5.1 · Every rejection reason

| Code | Reason | Where | Principle it protects |
|---|---|---|---|
| IM-R01 | No attestation record for a required role | Shipped | An approval recorded only as a name is a claim, not evidence |
| IM-R02 | `subject.assertion` missing | Shipped | Without it the record proves a service wrote a file |
| IM-R03 | Assertion issuer not in the pinned assertion-issuers registry, or mechanism unverified here | Shipped | An unpinned identity provider is not trusted |
| IM-R04 | Assertion issued by a registered **service** attestation issuer | Shipped | A service signing for a human authenticates the service (F1) |
| IM-R05 | Assertion nonce does not bind the canonical decision payload | Shipped | Binding is what separates an approval from a login |
| IM-R06 | Assertion or attestation expired, or `validity.revoked` | Shipped | Stale authority is not authority |
| IM-R07 | Record carries no `idp_subject` | Shipped | A workspace-scoped person id is reassignable |
| IM-R08 | Assertion subject ≠ record `idp_subject` | Shipped | The assertion must be about this decision's subject |
| IM-R09 | **No active map entry for the subject** | Shipped | An unmapped human is an unknown human |
| IM-R10 | **More than one active map entry for the subject** | Shipped | Ambiguity resolves to refusal, never to a pick |
| IM-R11 | **Map `registry_id` ≠ record `registry_id`** | Shipped | The map is the authority; the record is a claim |
| IM-R12 | **Origin person id ≠ map `notion_person_id`** | Shipped | The click and the mapping must be the same account |
| IM-R13 | **Map entry `status: "revoked"`** | Shipped | A revoked binding grants nothing |
| IM-R14 | **Mapping not active at decision time** | Shipped | Authority must have existed when it was exercised |
| IM-R15 | **Decision time not determinable** | Shipped | An unanchored decision cannot be tested against a lifecycle |
| IM-R16 | `registry_id` not in the registry | Shipped | Unresolvable approvals do not count |
| IM-R17 | Identity `kind` is not `human` | Shipped | Agents approve nothing |
| IM-R18 | Identity does not hold the required role now | Shipped | Roles are read fresh, never cached |
| IM-R19 | Second-line role held by a member of `builders` | Shipped | You cannot challenge your own work |
| IM-R20 | `registry_id` is a service identity (projector, freezer, bridge, delivery agent) | Shipped via empty roles; **partial** (§7) | A service has no clicks to attest to |
| IM-R21 | The approver is the transcriber | Shipped | Custody and decision must be separable |
| IM-R22 | The role is present only in `roles_at_mapping` | Shipped | The map is not a second role registry |
| IM-R23 | Map file fails schema or uniqueness invariants | Shipped | An unsound map resolves nothing |
| IM-R24 | Reconciliation observation missing or stale | Shipped | Observed, not declared |
| IM-R25 | Reconciliation reports the subject disabled at the IdP | Shipped | The directory is authoritative over the map |

**A design-time rejection, not a runtime one:** any code path that compares email addresses to
establish identity is refused at review (§2.3). It has no IM code because it must never reach a
gate.

## 6 · Mapping drift

**Named risk.** Carried in the plan's §8 and rated **Medium** as R7 in the residency review's
register. The cause is structural and permanent: three systems, three lifecycles, no shared
transaction. Drift is not a bug to be fixed once; it is a condition to be detected continuously.

| Class | How it arises | Detection | Fail-closed behaviour |
|---|---|---|---|
| **D-A · Orphaned mapping** | The subject is disabled at the IdP; the entry stays `active` because nobody landed the PR | Reconciliation A1 | Resolution rejects (IM-R25); operations signal; revocation PR proposed |
| **D-B · Unmapped approver** | Someone is added to an approval surface's people property with no mapping | Reconciliation A4 | The grant is removed; any decision they make rejects (IM-R09). **The reverse-direction check is the one that catches this** |
| **D-C · Reassigned account** | The vendor reissues a person id to a different human — the id *looks* stable, which is what makes this the ugliest class | Reconciliation A3 + `superseded_by` discipline on re-provisioning | Person-id mismatch rejects (IM-R12). **VENDOR-QUESTION:** does the vendor document a person-id reassignment policy at all? If it does not, the risk is unbounded and A3 is the only defence |
| **D-D · Registry divergence** | Roles change; `roles_at_mapping` goes stale | Reconciliation A6 | **None — informational.** Expected by design (§4.2). Failing here would train people to ignore the report |
| **D-E · Duplicate subject** | A person mapped twice — two registry ids, or two workspace accounts | Reconciliation A5 | Every affected approval rejects (IM-R10/R23) |
| **D-F · Stale reconciliation** | Nobody is looking; the job broke and nothing said so | Freshness of the signed observation | The `notion-pa-decision` adapter reverts to **declared, not active**; the gate treats mapping currency as unproven (IM-R24) |

**The fail-closed statement.** Absent evidence, the answer is no. Every drift class resolves to
exactly one of three outcomes — the gate **rejects** the affected approval, the adapter reverts to
**declared, not active**, or an **operations signal** is raised for a finding that does not yet
touch an approval. There is no fourth outcome, and in particular there is no warning that lets a
merge through. A drift condition that produced a yellow badge and a green gate would be the
appearance of control, which is the risk this whole programme is written against.

**What drift does not do.** It does not retroactively invalidate a merged record — the same
narrowing the plan applies to freeze drift in D4.2. It blocks *new* claims against an out-of-sync
mapping; it does not rewrite history that was sound when it was made.

## 7 · The bridge, and the service identities

### 7.1 · The bridge may read the mapping; it may never write it

**Read — permitted, and useful.** `svc-floor-bridge` reads `identity-map.json` to route (which
registry identity is this approval page addressed to), to reject early and visibly (an unmapped
person should be told on the floor, not silently at a gate three hours later), and to render the
correct label. Read access is a usability affordance.

**Write — never.** Not the file. Not a branch that automerges. Not a "proposal" that any
automation merges. Not indirectly through a workflow it can trigger. The map is second-line
CODEOWNERS-owned; HG-0002 makes the control plane immutable to the identities the loop operates.
The bridge that transcribes a decision must not also be able to decide who is allowed to make one.

**And the bridge's read is never authorisation.** The gate re-resolves independently, at CI time,
from the committed file, with no network and no bridge involvement. If the bridge resolved the
mapping and then asserted the result — "I checked, this is Lena" — F1 would be reintroduced one
layer up: a service key vouching for a human, which is precisely what D2.4 refuses.

### 7.2 · No service identity may appear as a mapped human subject

A mapping entry asserts *a human being clicked, and that human is this registry identity*. A
service has no human behind its credential. Mapping one would make the bridge's own key a valid
approver — F1, restated as a data-entry error.

**Three enforcement points, and one honest residual:**

1. **Registry kind.** The three sync services — `svc-floor-projector`, `svc-floor-freezer`,
   `svc-floor-bridge` — should be registered with `kind: "agent"`, exactly like
   `agent-loom-delivery`. `identity-registry-check.mjs` then enforces `roles: []` automatically,
   and step 7 of the resolution algorithm rejects them outright. **This is a recommendation to
   D0.2**, and it should be settled there rather than assumed here.
2. **Map schema.** No entry may name a service identity in `registry_id` (IM-R20).
3. **Reconciliation A2.** The assertion is re-checked on every run, so a later registry edit
   cannot quietly create the condition.

**The residual, named:** `identity-registry-check.mjs` refuses approver roles only for
`kind: "agent"`. A service account registered as `kind: "human"` — an operator error, or a
convenience during setup — would pass. Recommendation 1 above is what closes it; until D0.2
settles, the residual is real and this document does not claim otherwise.

### 7.3 · The observer

The independent observer (P4) is a human platform role who signs the reconciliation observation
with a platform key registered in the attestation-issuers registry. They hold no approval role and
are not mapped in their capacity as observer — the observation is a *service-class attestation
about a system state*, not a human decision about a change, and the two signature meanings must
stay separate. If the same person also approves changes on the floor in some other capacity, that
capacity needs its own registry identity and its own mapping, and the two must not be conflated.

## 8 · Illustrative example

**ILLUSTRATIVE — fictional throughout.** These are the harness's worked-example identities at the
fictional Meridian Trust. No row is a real person, account, subject, or approval, and no row
records anyone's actual authority. Ids are shortened for readability.

| Person (fictional) | Registry id | Notion person id | IdP subject | Roles at mapping | Status |
|---|---|---|---|---|---|
| Fatima (Product) | `po-fatima` | `3f1a9c62-…` | `u:8842f0e1-…` | `product-owner` | `active` |
| Lena (Risk, 2nd line) | `risk-lena` | `7c40be18-…` | `u:2b7d51aa-…` | `risk-second-line` | `active` |
| Rashid (Accountable Exec) | `exec-rashid` | `b2e6d904-…` | `u:91c4e77b-…` | `accountable-executive` | `active` |
| Imran (Compliance) | `comp-imran` | `5d81f3a7-…` | `u:4ae2c018-…` | `compliance` | `revoked` · `departed` · 2026-06-30 |
| Hassan (Credit Risk) | `credit-hassan` | — | `u:6f30b9d2-…` | `credit-risk` | **Not mapped** — no workspace account. Approves in the record, never on the floor |
| Zoe (Platform Admin) | `padmin-zoe` | `0a97c5be-…` | `u:d15e6c40-…` | `platform-admin` | `active` — holds no approver role; the mapping grants her nothing |
| The bridge | `svc-floor-bridge` | `1e5b8f22-…` (workspace bot) | — | — | **Never mapped** (§7.2). It transcribes; it does not decide |
| External counsel | — | `8c2fa146-…` (guest) | — | — | **Not mappable** (§4.1.2). May comment; may never approve |

**The leaver case, worked.** Imran's compliance approval on PA1 for the fictional
`CHG-MERIDIAN-01` merged on 2026-05-20, bound to that plan hash and passport digest. He leaves on
2026-06-30; the subject is disabled, the account deprovisioned, the revocation PR merged the same
day. Three consequences:

- The merged PA1 approval **stands** — validly made, bound to what it approved, active mapping at
  the time.
- A PA2 attestation his account issued on 2026-06-29 but which had not merged by the 30th is
  **void**; the bridge's PR is closed, and PA2's compliance role must be re-taken by a current
  holder.
- Whether the *merged PA1* approval must also be re-taken before PA2 on a material change is the
  open institutional rule in §4.3. **AWAITING.** The drafter proposes yes for second-line roles;
  this example does not decide it.

**The trap this table is drawn to show.** Hassan and the external counsel both lack a mapping, for
opposite reasons — one is a full institutional approver who simply has no seat on the floor, the
other has a seat and no institutional standing. The floor must render those two states
differently, and the gate must treat them identically: neither can produce an approval that
resolves.

## 9 · What this specification does not do

| # | Gap | Consequence | Route |
|---|---|---|---|
| **GAP-1** | **The registry has no leaver representation.** `identities.template.json` carries id, kind, display, roles, groups — and no temporal field. The PA gate re-derives role-holding on every CI run, so stripping a leaver's roles retroactively fails every passport they ever approved | Institutions face a false choice: keep departed staff apparently in role, or break historical approvals | A registry-schema question, not a mapping question. Proposed: a `valid_until` or `status` field on the registry entry, with the gate honouring the decision time. **AWAITING:** the registry owner's decision. Until then, §4.3 step 4 has no good answer and this document will not invent one |
| ~~**GAP-2**~~ | ~~Decision time is not bound by the human's signature~~ — **CLOSED** in loom `2.0.0-rc.13` | — | `canonicalDecisionPayload()` now binds `validity.issued_at`; a back-dated decision fails signature verification (negative-tested). This specification found the gap and WS2 · D2.4 closed it |
| ~~**GAP-3**~~ | ~~No shipped gate reads the map~~ — **CLOSED** in loom `2.0.0-rc.13` | The mapping was a document, and per the HG catalog's enforcement-of-record rule a document that no mechanism enforces is a label | `core/identity-map.mjs` performs steps 3, 4, 5, 11 and 22 per approval; `scripts/identity-map-check.mjs` performs step 12 over the file. Mandatory-when-compiled via `identity_map`. Proved by a probe: a record with a **real ed25519 assertion for subject A** naming registry identity B verified clean before, and is refused as IM-R11 now |
| ~~**GAP-4**~~ | ~~The assertion-issuers registry template does not ship~~ — **CLOSED** in loom `2.0.0-rc.13` | — | `governance/assertion-issuers.template.json` ships and is wired into the copy manifest, mounted at `docs/governance/assertion-issuers.json`. An unpinned provider still fails closed as UNVERIFIED-HERE, which is the intended behaviour, not a gap |
| **GAP-5** | **Vendor person-id semantics are unestablished.** VENDOR-QUESTION: is the person id stable, is it ever reassigned, and is reassignment documented? | Drift class D-C is unbounded if the answer is unknown | Must be answered before WS5. If the vendor makes no commitment, say so in the record rather than assume stability |
| **GAP-6** | **The pivot is only as good as the directory.** A compromised or misconfigured IdP compromises every mapping downstream | Out of scope here; it is the D0.4 threat model's territory and the institution's identity control set | Companion document (part 1) |
| **GAP-7** | **One surface, or many?** The schema carries a `surface` block; whether a second collaboration surface gets its own file or another entry is undecided | Deferred, but the schema should not have to change later to accommodate it | **AWAITING:** decision at D0.4 review |

## 10 · Verification — how anyone would know this is real

The plan's honesty rule applies: nothing is active until its own real evidence lands. Before WS5's
entry gate passes, the following negative tests must exist as fixtures and run in CI, in the
tradition of D2.5's negative-test discipline. Each must **fail closed**, and each must fail with a
message naming its principle, not a stack trace.

| Test | Expected |
|---|---|
| A valid assertion for a subject with **no active map entry** | Reject · IM-R09 |
| **Two active entries** for one subject | Reject · IM-R10 |
| Map `registry_id` ≠ record `registry_id`, everything else valid and correctly signed | Reject · IM-R11 |
| Origin person id ≠ map `notion_person_id` | Reject · IM-R12 |
| Decision time **before** `mapped_at`, and decision time **after** `revoked_at` | Reject · IM-R14 (both directions) |
| A role present **only** in `roles_at_mapping` and not in the registry | Reject · IM-R22 |
| A **service identity** named as `registry_id` | Reject · IM-R20 |
| A guest account with no mapping approving | Reject · IM-R09 |
| Reconciliation observation **absent or stale** | Adapter **declared, not active** · IM-R24 |
| The bridge attempting to write `identity-map.json` | Refused by CODEOWNERS and branch protection — **probed and recorded**, not asserted |
| An email-only match between a workspace account and a registry identity | No code path exists to test — verified by review (§2.3) |

The last two are the ones an implementation is most likely to skip and most needs. A capability
probe that *demonstrates* the bridge cannot write the map is worth more than a paragraph saying it
cannot, and it is the same evidence style the plan demands for the projector's credentials in WS1.

## 11 · Ownership, change control, and review cadence

- **Owner of the file:** the second line, in CODEOWNERS, on the same line as `identities.json`.
  **AWAITING:** the team name.
- **Who may propose a change:** any platform admin or second-line member, and the reconciliation
  job for revocations only. Builders may propose nothing on this path.
- **Who must approve:** second line, with a second human at the merge (HG-0001). A joiner mapping
  and a revocation are the same control and take the same route.
- **Who may never touch it:** every service identity, the delivery agent, and every floor-keeper
  agent.

| Trigger | Reviewers |
|---|---|
| Every joiner and every leaver | Second line, at the PR |
| Any reconciliation finding in classes D-A, D-B, D-C, D-E | Information security + risk-second-line |
| Any change to the resolution algorithm or the rejection set | Information security + risk-second-line + the gate's CODEOWNERS |
| Before each milestone M1–M5 | Information security + risk-second-line |
| Any change of identity provider, subject claim, or workspace tenancy | Information security + data protection |
| Otherwise, quarterly at minimum, with a sampled re-verification of a subset of bindings | Information security |

**AWAITING:** confirmation that quarterly is the right floor, and the sample size for
re-verification. A mapping nobody re-verifies decays into a list.

## 12 · Sign-off

The mapping is personal data — it links a named individual to two account identifiers across an
institutional boundary — so data protection is a required signatory alongside the identity and
risk functions. It is also a control artefact, so it is bound by the residency record: **the map
lives in the record and is never projected to the floor**, and no `idp_subject` may appear on any
floor surface.

Each signatory must resolve to a registry identity in `identities.json` holding the named role.
Builders may not sign. The merge is subject to four-eyes.

| Role (registry) | Name | Registry identity | Decision | Date |
|---|---|---|---|---|
| `information-security` | **AWAITING** | **AWAITING** | **AWAITING** — approve / approve with conditions / refuse | **AWAITING** |
| `risk-second-line` | **AWAITING** | **AWAITING** | **AWAITING** — approve / approve with conditions / refuse | **AWAITING** |
| `data-protection` | **AWAITING** | **AWAITING** | **AWAITING** — approve / approve with conditions / refuse | **AWAITING** |

**AWAITING:** confirmation of whether the institution requires further signatures on a control
artefact of this kind. P6 names no signatory set; the three above are the drafter's proposal from
the subject matter, not an instruction.

**Conditions attached by signatories** — to be filled by the signatories themselves, not by the
drafter:

> **AWAITING:** conditions, if any.

### The blocking statement

**Until this specification is approved, `identity-map-check` ships, and the negative suite in §10
passes in reality, no floor decision may be treated as governed evidence.** Specifically:

- Every approval surface stays **NON-AUTHORITATIVE · DECLARED, NOT ACTIVE**, per M2's labelling
  rule.
- The `notion-pa-decision` adapter carries no activation evidence and makes no control claim.
- WS5's entry gate is not passed by this document alone: it also requires the independent
  second-line review the plan names.

F1 is closed by a mechanism, not by a specification describing one. This document is the
specification. The mechanism is still to be built.
