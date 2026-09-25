---
artifact: prototype
stage: define
design_profile: discovery/brand/design.md
run: "plain-language-decline"
fidelity: low
wireframe: "wireframe.html"
design_canvas: "none — authored directly as specs/wireframe.prototype.json and rendered"
---

# Prototype brief — plain-language-decline

> Define (*make tangible*). A **disposable, low-fidelity** wireframe of the first screen a
> declined applicant sees, so the named roles can react to the framing. Gate D8; rendered against
> the mounted brand profile (D7). **Shown on 22 Sep; the reaction session is booked for 25 Sep,
> so D9 is open** — a prototype nobody has reacted to has tested nothing yet.

## What this prototype tests

| Hypothesis | Screen/region that tests it | What a positive reaction looks like |
|---|---|---|
| H1 — the main reason in plain language, first, reduces complaints | The first line and the "main reason" tile | "I would not have called" |
| H2 — telling applicants what would change the answer brings them back | The "what would change it" tile and the reapply date | "I know when to try again" |

## Scope of the wireframe

- **Screens included:** one — the decline notice for one synthetic applicant
- **Deliberately excluded:** the undisclosable-reason variant (tested separately with credit risk), the review request journey, any change to the decision
- **Data shown:** synthetic, illustrative only

## Fidelity guardrails (D4 / canon §4)

- [x] Low-fidelity (layout & flow, not pixels)
- [x] No interface contracts, data models or component definitions
- [x] Brand-real via `design.md` tokens only (no raw hex/px/font)
- [x] Disposable — informs delivery, does not bind it

## Wireframe

Authored as `specs/wireframe.prototype.json` and rendered with the discovery renderer under the
Meridian brand profile. Generated asset: `wireframe.html`, carrying the brand-profile marker.
