# The floor worked example (Factory Floor WS6 · Decision D6.3 + D6.4)

`generate.mjs` produces the two artifacts `scripts/floor-keeper-check.mjs` reads — a floor-keeper
**grant register** and a **degradation observation** — so the WS6 gate checks a floor instead of
reporting `no floor adopted (no grant register, no degradation observation)`. Without them the gate
passes **vacuously** on every push: the same hole `freeze-stamp-check` and `drift-check` both had
before a worked example was staged beside them.

```
node floor-keeper-example/generate.mjs --patch-identities docs/governance/identities.json
node floor-keeper-example/generate.mjs --register        > docs/governance/floor-keepers.json
node floor-keeper-example/generate.mjs --observation     > docs/governance/floor-degradation/floor-degraded.json
node floor-keeper-example/generate.mjs --observation --live > docs/governance/floor-degradation/floor-live.json
```

## What the register says, and the one thing it is for

Five containers, one floor-keeper (`svc-floor-keeper` — the identity
`core/floor-approval-surface.mjs` already fixes as `KEEPER_IDENTITY`, imported here rather than
spelled), and a human's grant audit three days old.

| Container | Authoritative | Keeper grant |
|---|---|---|
| `db-discovery-drafts` (catalog C) | no | `can-edit-content` — prefills Status, Last synced |
| `db-adr-inbox` (catalog B, decision-routed) | no | `can-edit-content` — routes the card; the decision is a merge |
| `db-approval-evidence` | no | `can-edit-content` — assembles the three D5.1 evidence blocks |
| `page-floor-home` | no | `can-edit-content` — arranges views, renders the notice |
| **`db-approvals`** (PA1/PA2) | **yes** | **none, at any level** |

That last row is the delivery. The grant is per database, never per property, so *"the keeper may
fill the evidence but must not touch the approval field"* is **not expressible as a grant** — it is
expressible only as two containers. `db-approval-evidence` exists for exactly that reason: D5.1 has
the floor-keeper assemble the evidence an approver reads, which would need an edit grant precisely
where D6.3 forbids one, if the evidence lived on the approval page. Splitting it costs a join
instead of the promise.

## What the gate says in each state

| Staged | Output |
|---|---|
| nothing | `no floor adopted (no grant register, no degradation observation)` — vacuous |
| register + live observation | `OK (1 floor-keeper with no grant on any approval-carrying container; 1 liveness observation, worst status LIVE)` |
| register + degraded observation | same, `worst status DEGRADED`, plus `· this floor is DEGRADED and says so, on every view — that is D6.4 working, not failing` |
| `--mutate keeper-grant` | **FAIL** · `FK-R03 … holds can-view on a container carrying approval field(s) (Approved by, Envelope plan hash, Assertion nonce)` |
| `--mutate keeper-role` | **FAIL** · `FK-R02 … the register itself lists roles ["risk-second-line"]` |
| `--mutate property-scope` | **FAIL** · `FK-R05 … carries property — there is no property-level grant to carry it` |
| `--mutate stale-audit` | **FAIL** · `FK-R09 … the grant audit is 45 days old (limit 30)` |
| `--mutate paused-but-live` | **FAIL** · `DG-R02 … declares status "live" but its observations derive "degraded"` |
| `--mutate self-reconciled` | **FAIL** · `DG-R06 … run by "padmin-zoe", the same identity that made the observation` |

A truthfully **degraded** floor **passes**, and must: representing degradation honestly is the
deliverable of D6.4, and a gate that went red on it would teach adopters to stop writing
observations — which is the silence the delivery exists to break. Staging both directions and
asserting the transition is what makes a regression in the derivation fail the dry-run rather than
wait for a unit test somebody might delete.

An unknown `--mutate` name is refused with exit 2, and `--live` refuses `--mutate` outright: a typo
that quietly returned the *clean* fixture would turn a CI assertion of "this must fail" into a test
of nothing at all.

## Why it is generated rather than committed

Both artifacts carry an instant, and both are refused once it goes stale — a grant audit older than
`GRANT_AUDIT_MAX_AGE_DAYS` (30) is FK-R09, and an observation older than
`OBSERVATION_MAX_AGE_DAYS` (**one day**) is DG-R08. A committed, statically-dated pair would pass
the day it was written and fail every build after that, for a reason unrelated to the change under
review — so somebody would delete it and the gate would go back to passing vacuously. The one-day
window makes this sharper than `drift-example/observe.mjs`, which is the same argument at seven
days. The freshness rules are not a nuisance to work around; they *are* the control: an audit is a
photograph, and a photograph has a date on it.

## The identity step, which is not optional in an adopted repo

The shipped `governance/identities.template.json` declares the projector, the freezer and the
bridge — **not** the keeper. So in the bundle (no `docs/governance/identities.json`) the gate runs
registry-less and the register passes; in an adopted repo the same register fails
`FK-R06: svc-floor-keeper does not resolve in the identity registry`. `--patch-identities` is that
adoption step, done the way an adopter would: an agent, no roles, first-line. It is idempotent and
refuses to overwrite an entry that already exists, because the registry is the file the whole
separation resolves against and an example has no business rewriting one.

## What this does NOT demonstrate

**Nobody enumerated a grant and nobody read a credit meter.** A real register is written after a
human opens the sharing dialog of every container; a real observation comes from a watcher that
queried the platform. Here both are synthesised. The gate is exercised and the shape is faithful;
this is not evidence about any workspace. `surface` names a fixture id — Alpha Islamic Bank is the
same simulation `freeze-example/` uses, and no such workspace exists.

**The detection of "approval field" has a gap in both directions, and it bites here.**
`APPROVAL_FIELDS` is imported from `core/floor-project.mjs` and is deliberately over-broad: a
property innocently titled `Key decisions`, `Token ledger`, `Prev owner` or `Seal date` reads as
approval-carrying, and its keepers lose a grant they did not need. The costlier direction is the
quiet one — `Sign-off`, `Signed off by` and `Approver` match **nothing**. This register is caught
only because `db-approvals` also carries `Approved by`, `Envelope plan hash` and `Assertion nonce`;
its `Approver (people)` and `Decision` properties are invisible to the check. An adopter whose
approvals database is titled entirely in the vocabulary the list misses gets a container that reads
as carrying no approval field at all, a keeper grant on it that raises nothing, and FK-R11's
vacuity check silenced by any *other* container that does match. Renaming a property is the
documented escape from the false positive; there is no documented defence against the false
negative, and picking the field names for this example was the point at which that became obvious.

**FK-R10 and the void-ness of a floor-side approval are not exercised here.** The gate never calls
`attemptedApproval()` — it reads committed files, and no attempt is a file. That the attempt is
`void: true` for several independent reasons is proved in `core/floor-keeper.test.mjs`, and staging
it is not something this example can do.

**The manual fallback is a name, not a runbook.** DG-R07 checks that a fallback is named and is not
an `ADOPT:` placeholder; it cannot check that the file exists, and
`docs/governance/runbooks/floor-degradation.md` does not ship in this bundle. Writing it is the
adopter's, and the gap is the honest one: a fallback nobody wrote down is one nobody can follow at
2am.

**A page filed in the wrong container still reads clean.** That is T-12's stated residual and it
survives every check here — an approval page dragged into a keeper-granted database carries its
properties with it. The defences are the template's write class, the container audit, and git being
the record.

**The audit's independence is asserted.** `infosec-noor` signs it because FK-R09 requires a human
who is not one of the keepers; whether an information-security identity can actually see the
workspace admin console is an adopter's arrangement, and no gate here can tell.

## Not shipped to adopters

Like `freeze-example/`, `drift-example/`, `floor-export-example/` and
`approval-attestation-example/`, this is the Loom's own demonstration data and is deliberately
absent from `copy-manifest.json`. An adopter's first register should describe their own workspace.

---

**Companions:** `../core/floor-keeper.mjs` and `../core/floor-degradation.mjs` (read their headers
first) · `../scripts/floor-keeper-check.mjs` · `../drift-example/` (the same generated-not-committed
argument at a seven-day window).
