---
name: govern
description: Use to author a governed artifact the gates require — a change envelope, product passport, identity registry, model manifest, service readiness, register entry, routine envelope, adapter, profile or data-lifecycle map — by interviewing the accountable human, drafting the structure, and running its gate to green. The agent formats; it never supplies a decision, an approval, an identity or a tier.
---

# Govern — draft the artifact, never the decision

Most of the harness's governance gates judge an artifact that no other skill authors. That
asymmetry is why the governance plane feels heavier than it is: the machinery is excellent at telling you the
JSON is wrong and silent on how to make it right. This skill closes that, and it is the one
skill in the harness where the boundary matters more than the output.

The governing rule: **the agent formats; the accountable human decides.** Everything below is
structure, vocabulary, schema conformance and gate iteration. Nothing below is judgement. If
this skill ever produces a risk tier, an approval, an identity, an attestation or a drill
outcome, it has failed regardless of whether the gate went green — because a gate that a
well-meaning agent can satisfy on a human's behalf is not a control, it is a formality with a
checker attached.

> **The test, before you write anything.** For each field: if this value turned out to be wrong,
> who would be answerable? If the answer is a named human, that human supplies it. You may
> record it. You may not infer it, default it, carry it forward from an example, or offer a
> suggestion they can accept by saying nothing.

## 1. Identify the artifact and who owns it

| Artifact | Its gate | Who must supply the judgement |
|---|---|---|
| `change-envelope.json` + `control-plan.json` | `change-envelope-check` | A human with classification authority sets the tier. The plan is *compiled*, never written |
| `product-passport.json` | `product-approval-check` | The control function named in each PA1/PA2 section |
| `identities.json` | `identity-registry-check` | Whoever owns access administration — not the build team |
| `model-manifest.json` | `model-provenance-check` | The model owner; independent validation by someone who is not the builder |
| `docs/governance/services/<service>.json` | `operational-readiness-check` | The service owner attesting to drills that actually happened — one file per service |
| `data-risk-register/` | discovery **D6** | Second line, from the institution's own taxonomy |
| `routine-envelope.json` | `routine-change-check` | Second line. An envelope owned by a builder or an agent is rejected by design |
| `data-lifecycle.json` | `data-lifecycle-check` | Data protection, per category |
| `product-evals.json` | `product-eval-check` | Product, from the discovery run's D1 success measures. The `release` skill records the run; you author the measures |
| `adapters/*.json` | `adapter-check` | Platform, plus the activation evidence only a real fetch can produce |
| `profiles/` | `core/policy-compiler.mjs` (compiler, not a gate) | Risk and legal, per jurisdiction and product type |
| `control-catalog.json` | `control-catalog-check` | Second line. It is the state of record and cannot overstate itself |

If the owner is not available, **stop and record that** as a blocked item with the name of the
role required. Do not proceed with a placeholder, and do not proceed with a value from the
worked example — a copied example value is how the placeholder CODEOWNERS false green happened
in the first place.

## 2. Read the schema, then the worked example — in that order

Read the gate's own source for the fields it requires and the conditions it fails on. The gate
is the specification; the template is a convenience and the example is an illustration.

```bash
sed -n '1,40p' scripts/<name>.mjs            # the header states what it requires and why
```

Most gates are `<thing>-check.mjs`; a few are not (`secrets-scan.mjs`), so list the directory
rather than guessing the filename.

Then read the matching `*-example/` directory, or the `*.template.json` where no example ships,
to see the shape. **Never copy a value out of either.** Copy the structure; leave every
judgement field empty for step 3.

## 3. Interview — one question per decision, no leading

Ask the owner for each judgement field. Rules for the asking:

- **One question, one field.** Do not batch judgement calls into a single confirmation.
- **No defaults, no suggestions, no "shall I assume".** An owner who says nothing has not
  decided. Silence is a blocked item, not consent.
- **Never propose a tier.** Classification is the field most likely to be quietly deferred to
  you and the one where deference is most damaging: the compiler is monotonic precisely so a
  change cannot classify itself low, and an agent suggesting "this looks like medium" defeats
  that by the back door.
- **Ask for the evidence with the value.** A readiness date wants the drill record; an approval
  wants the identity that holds the role; an adapter wants the platform owner's own probe
  record. A value without its evidence is a declaration, and the gates have been deliberately
  built to grade those honestly.
- **Record refusals.** "We don't know yet" is a legitimate answer and a useful one. Capture it
  as a gap with an owner, not as an empty field.

## 4. Draft, compile, and run the gate to green

Write the artifact. Where a field is compiled rather than authored — the control plan above all
— **compile it**; never hand-write it:

```bash
node core/policy-compiler.mjs docs/governance/changes/<CHG>/change-envelope.json --write
node scripts/<gate>-check.mjs                 # must pass
```

The compiler takes the cumulative union of requirements up to the envelope's tier and unions
across profiles, so a higher tier can only ever **add** requirements. That monotonicity is the
reason the plan is compiled rather than chosen, and it is proven by a property test — not a
convention you could quietly break.

Iterate on **structure** until the gate is green. If the gate fails on a judgement field, that
is not a formatting problem — return to step 3 and ask the owner. Never resolve a gate failure
by changing a value the owner supplied.

A stored plan is reconciled against a fresh compile on every run, so a hand-edit survives
exactly as long as it takes CI to notice. Save yourself the round trip.

## 5. Record who decided what

Append to the decision log: the artifact, each judgement field, the human who supplied it, and
when. This is the record that makes the artifact re-performable later — the `re-perform` skill
will pick three entries at random and ask whether the decision can be reconstructed from the
record alone.

Then commit the artifact through the normal lane. Governance artifacts are CODEOWNERS-owned;
they get a human review like everything else, and the owner reviewing is the owner who decided.

## 6. What this skill will not do

Stated as rules rather than warnings, because each one has a gate behind it that already
refuses:

- Set or lower a risk tier, or classify an unclassified change
- Sign, issue, re-date or alter any approval, hold, attestation or eval result
- Add an identity to the registry, or place any identity in an approver role
- Attest that a drill, test or review took place
- Fill an adapter's activation evidence at all. It is adopter-attested and audit-sampled, and
  it is the receipt that moves a control from *mechanically validated* to *platform enforced* —
  the highest-value claim in the maturity model. The platform owner supplies the probe and its
  provenance; you may record what they give you and nothing more
- Author a register entry that asserts a residual-risk verdict
- Upgrade a control's maturity state in the catalog

If a human asks you to do one of these directly, decline and name which gate would reject it.
That is more useful than compliance, and considerably more useful than a green gate over a
decision nobody made.

## Red flags — stop and re-read this skill

- Suggesting a classification, even as a starting point
- Copying any value out of a worked example
- Treating silence, a shrug or "whatever you think" as a decision
- Hand-writing a control plan instead of compiling it
- Resolving a gate failure by changing a value the owner gave you
- Filling a field because the gate wants one and the owner is unavailable
- Reaching green with no entry in the decision log naming who decided
