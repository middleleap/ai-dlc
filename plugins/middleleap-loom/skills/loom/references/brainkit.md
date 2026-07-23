# The Institutional BrainKit

> Loom 2.0-rc.8. The BrainKit is the **institution-owned seed of the Loom's context brain** — the
> portable, governed core of institutional knowledge that every repository inherits before it
> writes a line of code, a PRD, an ADR or a report. It is not another public plugin, and it is not
> a brand kit. It is the institution's own DNA, versioned and mechanically validated.

## What it is, and what it is not

The **context brain** is everything the Loom accumulates about how an institution builds: its
identity, its language, its architectural commitments, its technology policy, its decision rights.
Most of that brain grows repository by repository through repeated Loom cycles. The **BrainKit** is
the *seed* — the part the institution owns centrally, approves once, versions, and pins into every
product repository so that independent teams and agents share one institutional starting point.

| The BrainKit **is** | The BrainKit **is not** |
|---|---|
| Institution-owned institutional DNA | Another public plugin family |
| Identity, terminology, architecture, technology policy, governance, decision rights | The MiddleLeap brand installed into a client repo |
| A digest-pinned, versioned, approved package | A second copy of the D6 data-risk register or the solution-domain packs |
| A *reference* to regulated and domain sources | A place to duplicate regulatory text |

Two boundaries are load-bearing:

- **Regulated context** stays in the D6 data-risk-register seam. **Solution-domain** context (product
  contracts, data models, personas, evaluation assets) stays where it lives. The BrainKit may
  *reference* these; it must never copy them into a second compliance database.
- Say **institutionally conformant**, never **regulatorily compliant**. A BrainKit proves a change
  matches the institution's own approved context. It does not, and cannot, prove regulatory
  compliance — that is a legal determination the institution's control functions make.

## The package

A BrainKit is a directory (`institution/brainkit/`) of six sections plus a manifest:

```text
institution/brainkit/
├── manifest.json            # identity, version, lifecycle, owners, digests, approvals
├── identity/design.md       # institutional identity + design language (the D7 projection source)
├── terminology.md           # the institution's binding vocabulary
├── architecture.md          # architectural principles and constraints
├── technology-policy.json   # allowed/consult/forbidden technologies and standards
├── governance.md            # decision rights: who decides what
└── source-register.json     # the approved sources every section is grounded in
```

The **manifest** is the spine. It carries:

- `schema_version`, `brainkit_id`, `institution_id`, semantic `version`
- lifecycle `status` — `draft` · `approved` · `retired` — with `effective_at` and optional `expires_at`
- **accountable owners by section** (each resolving to a Loom identity-registry human)
- **approved source references** (nothing in a section may be ungrounded)
- a **section digest** per section and a **whole-package digest** over them
- **compatibility-projection** metadata linking `identity/design.md` to the D7 brand seam
- **approval identities** that resolve against the identity registry

## Lifecycle

A BrainKit is born `draft`. `brainkit-init` generates a draft from the repository and the
institution's *approved* sources, records provenance for every generated section, and lists a gap
register of decisions it could not make. It never invents policy, regulatory interpretation,
approval authority or brand rules — a draft is a starting point for humans, not a fait accompli.

Accountable owners review, fill the gaps, and **approve**. Approval stamps the section and package
digests and the approving identities into the manifest and moves `status` to `approved`. Only an
`approved`, effective (not expired), digest-consistent BrainKit satisfies a compiled change.

A superseded BrainKit is `retired`; a new semantic version takes its place. Rollback means
remounting the last approved version and recompiling affected plans.

## How it binds to a change

The BrainKit composes through the rc.7 machinery, not beside it:

1. **The institution profile** (`profiles/institutions/<id>.json`) names the BrainKit it pins. A
   governed change in a BrainKit-enabled repository names that profile in `required_profiles`.
2. **The policy compiler** folds the *live* BrainKit package digest into the plan's profile
   binding, and — because the institution profile contributes the `brainkit-conformance` gate at
   the low tier — makes that gate and `brainkit-provenance` evidence **mandatory-when-compiled**.
   Any BrainKit revision changes the digest, which changes the plan hash, which makes a stored plan
   stale — so `change-envelope-check` forces recompilation. A one-byte BrainKit edit cannot ride an
   old plan.
3. **The `brainkit-check` gate** fails the build on a missing/malformed manifest, a draft/expired/
   retired BrainKit used by a compiled change, unresolved owners, digest mismatch, missing approved
   sources, broken regulated/domain references, a required artifact with no BrainKit provenance, an
   artifact citing the wrong version or digest, a stale D7 projection, or an unresolvable profile.
4. **The gate runner** cannot path-scope the gate away: a compiled `brainkit-conformance` family is
   unskippable in its lane.

## The D7 compatibility projection

`discovery/brand/design.md` (the D7 brand seam) remains, unchanged in shape, so existing templates,
renderers and adopted repositories keep working. Under a BrainKit it becomes a **generated
compatibility projection** of `institution/brainkit/identity/design.md`, carrying the BrainKit id,
version and digest in its frontmatter — and in the metadata of every artifact rendered from it
(HTML, DOCX, PPTX, XLSX). A stale projection, or a visual bearing the wrong BrainKit digest, fails.

## Multi-repository distribution

The initial operating model is deliberately simple and needs no live service:

1. The institution owns **one private canonical BrainKit**.
2. Releases are semantically versioned and approved.
3. Each product repository mounts a **digest-pinned snapshot**.
4. CI validates the local snapshot — no network dependency.
5. A repository adopts a new version through an explicit reviewed PR.
6. Rollback is remount-last-approved + recompile.

Public AI-DLC ships the schemas, the generation machinery, the validators and **fictional examples
only** (Meridian Trust). Real institutional BrainKits are private, and no bundled gate makes a
BrainKit *platform-enforced* or *organisationally-enforced* — those maturities require controls the
institution owns outside this repository.
