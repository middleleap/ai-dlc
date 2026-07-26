# Alpha Islamic Bank — walking a feature through the floor

> **This is a simulation.** Alpha Islamic Bank does not exist. Every name, figure, rating and
> identity below is synthetic, and no customer data of any kind was involved. It was run to answer
> one question — *does the Loom, GitHub and a collaboration surface actually work together?* — and
> its value is in what it **broke**, not in what it demonstrated.

**Programme:** Factory Floor (`notion-floor-plan.md`) · **Recorded:** 26 Jul 2026 ·
**Companions:** the architecture drawing (`loom-notion-architecture.html`), the freeze example
(`plugins/middleleap-loom/skills/loom-adopt/harness/freeze-example/`).

---

## 1 · Why run it at all

Every piece of the Factory Floor had been built against fixtures I wrote myself. Fixtures agree
with the code that reads them, because the same person authored both — so a green test suite was
evidence about my consistency, not about the world. The walkthrough existed to put a plausible
feature through the whole machine and see what fell out.

Two things fell out. One was a real defect in shipped gate code. The other was that I had been
over-applying a control. Both are below.

## 2 · The setup

A retail feature at an Islamic bank: **"accounts elsewhere"** — customers see accounts they hold
at *other* UAE institutions inside Alpha's app, via Open Finance Bank Data Sharing.

It was chosen because it is uncomfortable in a useful way. Alpha is a full Islamic bank, so
everything Alpha *offers* is Shariah-compliant — but the accounts it *aggregates* need not be.
That single asymmetry drags in third-party data, consent scope, and a Shariah question nobody on a
delivery team can answer.

```
change      CHG-2026-ALPHA-014   ·  product PRD-ALPHA-RETAIL-APP
type        new-product          ·  risk tier HIGH
run         accounts-elsewhere
profiles    regulated-bank · uae-bank · islamic-product · open-finance
flags       personal_data ✓   islamic ✓   third_party ✓   model_involved ✗
classified  po-layla, 2026-07-25
```

The compiled plan required five capabilities — `data_risk_register` (≥3.1, institution-owned),
`shariah_governance` (institution-owned), `model_risk`, `consent_management`, `tpp_due_diligence`
— and named **twelve** approver roles.

## 3 · Floor → record: the freeze

The D6 data-governance artifact was drafted on the floor, then frozen:

```
discovery/runs/accounts-elsewhere/data-governance.md
discovery/runs/accounts-elsewhere/.freeze/data-governance.json
  digest  sha256:7063b9c32873c2de62f22ddcc187e8ab8f596f62c2d954b3b6bf7228f0ba4769
  by      svc-floor-freezer at 2026-07-25T11:20:04Z
```

Both files are now committed as `harness/freeze-example/` and **staged into CI**, so
`freeze-stamp-check.mjs` verifies a real digest on every push instead of passing vacuously on a
repository that has frozen nothing. Changing one word of the frozen artifact — `Medium` to `Low`
in the residual-risk verdict — fails the build:

```
accounts-elsewhere · data-governance.json: data-governance.md does not match its
freeze stamp (stamped sha256:7063b9c3…, actual sha256:c7a6133c…) — the record was
edited after the freeze, so re-freeze it rather than editing in place
```

That is the control working on the exact attack it was built for: not vandalism, but the
well-meant quick fix in the repo that changes what a gate saw without going back through the
surface that produced it.

### What the artifact actually said

Worth recording, because it is the part a simulation usually fakes and this one did not. The D6
verdict was **not** "acceptable". Two items were left open, and both were Shariah questions rather
than engineering ones:

- The Open Finance flag `IsShariaCompliant` **defaults to `false`**. An institution that never
  populates it reports every product as non-compliant. Rendered verbatim, Alpha would tell its own
  customer that a competitor's genuinely halal Murabaha is not halal — a false statement about a
  third party's Shariah standing, produced by a schema default and nobody's assertion.
- Aggregated conventional accounts carry an `Interest` balance category. Whether a riba figure may
  be rendered inside an Islamic bank's app, and under what framing, is an ISSC matter.

Neither is resolvable by a delivery team, so both were recorded as uncovered rather than deferred.

## 4 · The defect it found

This is the reason the walkthrough was worth running.

A compiled plan named **twelve** approver roles. `product-approval-check.mjs` at PA1 checked
**three** — `product-owner`, `risk-second-line`, `accountable-executive` — because the core set was
hardcoded and the filter against the compiled list could only ever *narrow* it, never widen it.
Nine roles, including **every Shariah role**, were unchecked at permission-to-develop.

Probed against the shipped code on this high-risk Islamic change:

| Negative | PA1 verdict |
|---|---|
| The ISSC approval is absent entirely | **OK** |
| An **agent** fills the ISSC approval slot | **OK** |
| The engineering lead signs the Shariah approval | **OK** |
| A name that does not exist signs it | **OK** |

PA2 caught all four. PA1 caught none. *"Agents approve nothing"* is the method's loudest promise,
and an agent's name sat in an approval slot on a high-risk change behind a green gate.

The defect was **pre-existing** and present in the shipped `change-example` too, which has the same
12-vs-3 shape. The Islamic framing did not create it; it made it impossible to wave away. *"The
ISSC never signed and the gate said OK"* is a sentence that ends a conversation.

Fixed in **PR #21** (`claude/pa1-approver-roles`), in two halves: `checkApprovals` now resolves
every approval a passport records rather than only the ones the stage demands, and profiles declare
`pa1_approver_roles` so the plan says out loud which roles bind where. After the fix all four
negatives refuse and the honest passport passes.

> **Migration.** The plan gained a field, so `plan_hash` changes and stored control plans need
> `node core/policy-compiler.mjs <envelope> --write`. The change-envelope reconciliation tests
> caught the stale hash themselves — the machinery working, rather than something I remembered.

## 5 · A smaller one, in my own fixture

Building Alpha's identity map, I recorded `risk-noura` as the person who mapped her own entry. The
P6 gate refused it — `IM-R23`, self-mapping — and I fixed it by having a compliance identity do the
mapping instead. Worth noting only because the gate caught its own author being careless, which is
the one form of evidence a self-written test cannot supply.

## 6 · What a real workspace then confirmed

The freeze above ran against **recorded response shapes**, not a live surface. On 26 Jul the
Notion connector was authorised and the artifact was authored into a real (empty, personal)
workspace, alongside a second page built to be rejected.

**Confirmed:**

- All eleven block types the exporter supports round-trip through a real workspace — paragraph,
  headings, both list types, to-do, code-with-language, quote, callout, divider, table, table_row.
- **Notion escapes pipes in table cells as `\|` — the same way the exporter does.** That was a
  double-escaping bug fixed against fixtures alone; this is independent confirmation from the
  vendor's own serializer.
- **A title trap the fixtures could not have shown.** A page's *display* title carries its emoji
  icon (`🛡️ Data-governance feasibility…`); the `properties` title does not. `titleOf()` reads
  `properties`. Had it read the display title, every frozen artifact would have carried an emoji in
  its `H1` — digests stable, and wrong.
- `synced_block` and `child_page` both occur on real pages and both are refused, so the page built
  to be un-freezable genuinely is.

**Found and not yet fixed:** the exporter **fails fast on the first refused block** rather than
collecting them. An author fixing an un-freezable page plays whack-a-mole one block at a time.
That is a behaviour change to shipped code with tests behind it, so it is recorded here rather than
slipped into this commit.

## 6b · The run, carried the whole way

On 26 Jul the walkthrough was taken end to end against a real Business-tier workspace: a human
authored the D6 artifact on the floor, it was read back live, exported by the shipped exporter,
frozen with a stamp, and put in front of the shipped gate. Four checks, each derived from what
happened rather than asserted — full output in `simulations/notion-e2e/run-transcript.txt`.

| Check | Result |
|---|---|
| Export is deterministic — same tree twice, same bytes | **PASS** |
| Gate passes on the frozen bytes | **PASS** |
| Gate refuses a one-word tamper (`Medium` → `Low`) | **PASS** |
| The page built to be un-freezable is refused | **PASS** |

Frozen digest `sha256:2755e000…`, over 26 blocks — two tables of five rows, five headings, four
to-dos, two callouts, a fenced code block, a divider, three list types, four paragraphs.

**Then the substituted link was closed.** The first run used a bridge, because `api.notion.com` was
denied by the environment's egress policy. Once the policy was changed, `core/floor-fetch.mjs` ran
against the live REST API with an integration token — **36 blocks read, 26 top-level**, exit 0.

**I predicted the two digests would differ. They are byte-identical.**

```
digest via REST API  sha256:2755e0006a3665ee…
digest via bridge    sha256:2755e0006a3665ee…
4157 bytes, 66 lines, identical                cmp: no differences
```

That is a stronger result than the one I argued for, and it is worth being precise about what it
does and does not establish. It says the vendor's Markdown serialization lost nothing the exporter
reads **for this page** — quotes, headings, two tables with header rows, to-dos, a fenced code
block, callouts with emoji icons, three list types, inline code and bold, and an escaped pipe
inside a table cell. It does **not** say the two paths agree in general: this page exercises no
nested lists, no colours, no underline, no mentions or equations, and NFM represents some of those
differently or not at all. The bridge still stays out of the shipped harness, but the reason is now
narrower and more honest — not *"it produces a different digest"*, which turned out to be false
here, but *"nothing verifies that it won't"*.

### The defect the first live call found

The very first attempt failed with `403 error: the surface refused the request` — and that message
was wrong. The 403 came from the **egress proxy**, not from Notion: Node's built-in `fetch` does
not read `HTTPS_PROXY` unless `NODE_USE_ENV_PROXY=1` is set. The response carried no
`{ object: "error", code }` body, and the module blamed the vendor anyway, which would send an
operator to the integration-permissions screen to debug a firewall.

`classify()` now tells the two shapes apart and names the proxy, the egress policy and the Node
flag. Two regression tests cover it — one that a non-vendor body is not blamed on the vendor, one
that a genuine `restricted_resource` still reads as a sharing problem.

## 7 · What is still unproven

Stated plainly, because a walkthrough that oversells is worse than none:

- **`floor-fetch.mjs` has now made live calls, but a narrow set of them.** One page, one workspace,
  one API version, on a page small enough to fit in a single page of results — so the **pagination
  path and the cursor guards are still unexercised**, and so is every error branch except the two
  hit by accident (a proxy 403 and a genuine `object_not_found` from an unshared integration). The
  `has_children` recursion *was* exercised: the two tables are children fetched separately, and
  they render correctly.
- **The token used held write capabilities.** The integration had *Insert content* and *Update
  content* enabled. A freeze only ever reads, so a freezer's token holding a write path is
  over-privileged (HG-0004) — noted in the module and not yet enforced anywhere, because nothing
  in the harness can see what a token is allowed to do.
- **No gate verifies P1's signatories** resolve to registry identities holding the named roles and
  outside `builders`. It is asserted in prose and checked by eye.
- **The live record is still unsigned.** `notion-floor-residency-review.md` carries two `AWAITING`
  signatures and WS1 remains blocked. Nothing in this walkthrough changes that.

## 8 · A precondition the method had not stated

The workspace used was on a plan **without SAML SSO or SCIM**. That matters beyond this
simulation: **ADR-0005 assumes a human's approval arrives as an IdP assertion**, and the P6 identity
map assumes a surface-side subject to join to. On a workspace without SSO neither exists — there is
no issuer, so `subject.assertion` has nothing to bind to.

This is a real deployment precondition and it was not written down anywhere. It is now recorded in
ADR-0005.

Separately: authorising the connector added a **bot as a workspace member holding page-write
capability**. That is the first live instance of the thing the write-class taxonomy constrains, and
it is worth saying out loud that the connector and the adapter are **different trust paths**. The
programme's threat model assumes the adapter is the only one. A real deployment carrying both is a
finding, not a convenience.

## 9 · Re-running it

The frozen artifact and its stamp are in the repository and verified by CI. The rest of the
walkthrough — the adopted harness, the change envelope, the compiled plan, the passports used for
the PA1 probes — was run in a scratch directory and is **not** committed: it is a rendering of the
shipped templates plus synthetic data, and committing forty generated governance files would
duplicate the bundle without adding evidence.

To reproduce it, adopt the harness into an empty repository, classify a high-risk change with
`islamic: true`, compile the plan, and probe PA1 with a passport whose Shariah slot is filled by an
agent. Before PR #21 it passes. After, it does not.

---

**Companions:** the plan (`notion-floor-plan.md`) · the architecture drawing
(`loom-notion-architecture.html`) · the P1 specimen
(`notion-floor-residency-review-example.md`) · ADR-0005 (`adrs/0005-human-assertion-mechanism.md`).
