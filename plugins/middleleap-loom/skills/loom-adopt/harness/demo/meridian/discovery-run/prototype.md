---
artifact: prototype
stage: define
design_profile: discovery/brand/design.md
run: "cross-bank-money"
fidelity: low
wireframe: "wireframe.html"
design_canvas: "none — authored directly as specs/wireframe.prototype.json and rendered"
---

# Prototype brief — cross-bank-money

> Define (*make tangible*). A **disposable, low-fidelity** wireframe that makes the framing
> hypotheses tangible so the named stakeholders can react to them. Gate D8 (this brief, a
> brand-conformant `wireframe.html`, and the spec it renders from) and D4 (validation fidelity,
> not a delivery specification). Rendered against the mounted brand profile (D7).

## What this prototype tests

| Hypothesis | Screen/region that tests it | What a positive reaction looks like |
|---|---|---|
| H1 — customers want to *know* their consolidated position | "Due in the next 7 days", "Available across banks", the commitments table | "That is the question I ask myself before salary day" |
| H2 — customers would trust Meridian to show other banks' data under their own consent | The consent tile: scope, expiry, withdraw | "I would connect it if I can see what it sees and switch it off" |
| H3 — a minority want Meridian to move money for them | The greyed "move money to cover the 28th" affordance, labelled not authorised | Curiosity or a request — recorded, not built |

## Scope of the wireframe

- **Screens included:** one — the consolidated position for one synthetic customer the week before salary day
- **Deliberately excluded:** onboarding, the consent-capture journey itself (owned by nobody yet, S-005), transaction detail, any payment flow
- **Data shown:** synthetic, illustrative only (no real PII, no live platform)

## Fidelity guardrails (D4 / canon §4)

- [x] Low-fidelity (layout & flow, not pixels)
- [x] No interface contracts, data models or component definitions
- [x] Brand-real via `design.md` tokens only (no raw hex/px/font)
- [x] Disposable — informs delivery, does not bind it

## Stakeholder reactions (evidence → D2)

Recorded in `stakeholder-reaction.md` and logged as S-010 and S-011 in `research-log.md`.

| Reaction | From | New signal id | Implication for framing |
|---|---|---|---|
| The consolidated "what I owe, and when" view is what customers ask for | Sponsor, contact-centre lead `[synthetic]` | S-010 | H1 confirmed |
| Uncertain whether customers would trust Meridian to move money | Contact-centre lead `[synthetic]` | S-010 | H3 uncertain — stays out of scope |
| Consolidated view may be explored; payment initiation not authorised beyond a labelled affordance | Second-line risk `[synthetic]` | S-011 | H2 confirmed as a direction under consent controls; H3 boundary held |

## Wireframe

Authored as `specs/wireframe.prototype.json` and rendered with the discovery renderer under the
Meridian brand profile. Generated asset: `wireframe.html`, carrying the brand-profile marker.
The committed asset is the record.
