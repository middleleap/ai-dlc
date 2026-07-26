# residency-example — what a signed P1 record looks like, and three that must be refused

**Demonstration data. Bundle-only — the installer does not ship it**, because a residency record is
an institution's own decision and the Loom must never hand an adopter a pre-signed one.

Every person named is invented by `governance/identities.template.json`. `dp-yusuf`, `risk-lena` and
`eng-omar` are illustrative identities that exist to demonstrate shape. Nothing here is anyone's
approval.

## Why the directory exists

`scripts/residency-check.mjs` gates D0.1 — the signatures that block every workstream after WS0.
Wired without a fixture it would run against an absent record, report OK, and prove nothing. That is
precisely the vacuum `freeze-stamp`, `drift`, `approval-surface`, `floor-keeper` and
`adapter-evidence` each carried until an example was staged beside them. This one shipped with its
example from the first commit.

## The four records

| file | state | what the gate must do |
|---|---|---|
| `residency-review.md` | both roles, two different people, both in `second-line` | **PASS** — and CI asserts the word `SIGNED`, not merely a zero exit |
| `residency-review.unsigned.md` | both cells `AWAITING` | **FAIL** once a floor is in use — §11's blocking statement, enforced |
| `residency-review.builder-signed.md` | `eng-omar` (in `builders`) in the data-protection row | **FAIL** — §11 says builders may not sign |
| `residency-review.one-person.md` | `dp-yusuf` in **both** rows | **FAIL** — four eyes is not one pair wearing two hats |

The dry-run asserts each of these, and asserts the *reason* rather than just a non-zero exit: a gate
that fails for the wrong reason is a gate that will pass for the wrong reason later.

## What the unsigned case does NOT do

`residency-review.unsigned.md` passes cleanly when no floor is in use and no plan compiles the
capability — an honestly-drafted, unrouted record is the ordinary state of a programme doing WS0
properly, and a gate that went red the moment someone wrote a record would be red for the life of
every programme that writes one. The blocking statement blocks workspace construction, token issue
and floor content. It does not block drafting.
