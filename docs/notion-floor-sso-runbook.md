# Runbook — federating the floor to Google Workspace, and what the Loom needs afterwards

**Status:** operational draft · **Written:** 2026-07-26 · **Applies to:** a Notion floor on the
**Business** tier or above, with Google Workspace as the directory.
**Companions:** ADR-0005 (`adrs/0005-human-assertion-mechanism.md`) · the identity-mapping spec
(`notion-floor-identity-mapping.md`) · the plan (`notion-floor-plan.md`).

> **What this unlocks, and what it does not.** Federated sign-on is what makes the **P6 identity
> map** a real join rather than an honour system: without it, the floor account and the IdP
> principal are two unrelated accounts connected by a line someone typed. It does **not** unblock
> **P1**, which reviews *data residency* — a top-tier capability. Doing this well is worth it; it
> just isn't the critical path.

---

## Part 1 · The order matters, and one step is destructive

Notion's SSO settings and its "allowed email domains" list are mutually exclusive, and clearing the
second can lock people out. Do these in order, in a maintenance window, with a second admin present.

| # | Step | Where | Note |
|---|---|---|---|
| 1 | Ensure the workspace **owner** is an account on the federated domain | Notion | A `gmail.com` or other consumer account **cannot** complete this — you can only verify a domain you control via DNS |
| 2 | **Verify the domain** (DNS record) | Notion → Settings → Domain management | This is the prerequisite that most often blocks the SSO toggle. Wait for it to leave *pending* |
| 3 | **Remove every entry from "Allow email domains"** | Notion | ⚠️ Destructive-adjacent: do this immediately before step 5, not days earlier |
| 4 | Add the SAML app and copy Google's **IdP metadata XML** | Google Admin → Apps → Web and mobile apps → Add app | Check the pre-integrated catalog for Notion first; fall back to *Add custom SAML app* |
| 5 | Toggle **Enable SAML SSO**, paste the IdP metadata XML, copy the **ACS URL** Notion shows you | Notion | Only a workspace **owner** can do this |
| 6 | Paste the ACS URL and Entity ID into the Google app's *Service provider details* | Google Admin | |
| 7 | **Turn the app ON for the right org unit**, not for everyone by default | Google Admin | A SAML app left OFF produces a confusing "no access" that looks like a Notion fault |
| 8 | Test in a **private window**, with a second admin session still open | both | The classic lockout is closing your only authenticated session before testing |

**Keep a break-glass path.** Until you've completed a full sign-in as a non-admin user, keep one
owner session alive in another browser. Recovering a workspace whose SSO is misconfigured is a
support ticket, not a setting.

## Part 2 · The bit no vendor doc will tell you

Google's SAML assertion to Notion carries **an email address as the NameID**. That is fine as a
*transport*: it is how Notion learns which account signed in.

It is **not** what the identity map records. `governance/identity-map.template.json` is explicit —
the pivot is

> the **idp_subject**: opaque, immutable, from the issuer named above; recorded from an assertion
> or an authoritative directory read, **never derived from an address**

and the schema carries **no `email` field at all**; an entry containing one is refused on sight
(`FORBIDDEN_FIELDS`). The reasoning is in the template and holds here: an address is a routing
label. People change them, mailboxes get shared, and a departed employee's address gets reassigned
to their successor — at which point an address-keyed map silently points at the wrong human.

So the join has three columns and the email is none of them:

```
notion_person_id   ──┐
                     ├── the map's row, keyed on ↓
idp_subject  ────────┘   Google's stable subject   ← the pivot
registry_id  ────────    identities.json
```

**What to record as `idp_subject`:** Google's OIDC `sub` — the opaque, stable account identifier —
**not** the primary email, and not the Notion person id.

**Verify before you rely on it.** Confirm that the `sub` in a Google ID token and the `id` returned
by the Directory API for the same user are the same value in your tenant, and record how you
confirmed it in the entry's `verification.reference`. That field exists precisely so an auditor can
follow the binding back to the act that established it. If they differ, the map must record
whichever one the *assertion* will carry, because that is what the gate compares.

**`notion_person_id` is read from the API, never typed** — the template says so, and typing it from
a directory is how a transcription error becomes an identity claim.

**Who fills the map in:** a human in a control function, not the person being mapped and not a
builder (`IM-R23` refuses self-mapping — it caught me doing exactly that while building the Alpha
walkthrough). The bridge may *read* this file and may never write it.

## Part 3 · The finding that decides your approval mechanism

**Google Workspace cannot, on its own, satisfy ADR-0005's step-up requirement.** Checked against
Google's OIDC discovery document on 26 Jul 2026:

- `acr_values_supported` — **absent**
- `claims_supported` — `aud, email, email_verified, exp, family_name, given_name, iat, iss, name, picture, sub`. No **`acr`**, no **`amr`**, no **`auth_time`**

ADR-0005 selected Option A `oidc-step-up`, and the contract pins an accepted `acr` and compares it
(defects #8 and #13 in the WS2 review were precisely that `acr` was carried but never enforced).
There is nothing to compare here: Google's ID tokens carry no `acr`, so an approval endpoint built
on Google alone cannot prove the human re-authenticated at the moment of decision, and cannot even
fall back on `max_age` because `auth_time` is absent too.

This is not fatal, and it is much cheaper to know now than at WS2. Three ways forward:

| Option | What it costs | What it gives up |
|---|---|---|
| **Federate the approval endpoint through a thin OIDC layer** (Keycloak self-hosted, or a hosted equivalent) that trusts Google for identity and issues its own assertions with `acr`/`amr` | one small service to run | nothing — Google stays the directory and the Notion SSO IdP |
| **Drop the `acr` requirement** | nothing to build | the step-up guarantee, and it re-opens a defect the WS2 review closed twice |
| **Move to ADR-0005 Option C** (`sigstore`) | larger change, already held open as the strategic direction | requires the transparency-log residency determination the ADR flags |

**Recommended: the first.** Google Workspace is entirely sufficient as the *directory* and as the
*Notion SSO provider* — which is what today's provisioning buys, and it is genuinely useful. It is
the *approval assertion* that needs a step-up-capable issuer in front of it. Those are two
different jobs, and conflating them is what would have gone wrong quietly.

Whichever is chosen, `docs/governance/assertion-issuers.json` must pin the issuer that actually
signs approvals — and the identity map's `idp.issuer` must be **that same issuer**, because a
mapping against a different provider resolves nothing.

## Part 4 · What is still true afterwards

- **2-step verification is configured per user in Google Workspace, not enforced organisation-wide
  by default.** Enforcing it is available on every edition and costs nothing. Do it — but note that
  enforcing MFA and *proving it in an assertion* are different things, per Part 3.
- **No SCIM.** Deprovisioning stays manual on Business, so the identity map's reconciliation
  window (`RECONCILIATION_MAX_AGE_DAYS = 7`) is a human commitment, not an automated one. A leaver
  who is not reconciled within a week fails the gate — which is the correct direction, but someone
  has to own the task.
- **P1 is unchanged and still shut.** Residency selection is a top-tier capability; this runbook
  does not touch it.

---

**Companions:** ADR-0005 · `notion-floor-identity-mapping.md` (25 rejection codes) ·
`notion-floor-alpha-walkthrough.md` §8 (where the tier split was first confirmed live) ·
`notion-floor-plan.md`.
