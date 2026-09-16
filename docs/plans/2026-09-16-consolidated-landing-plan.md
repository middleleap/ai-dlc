# Consolidated Landing Plan — Meridian demo, NPA skill, de-identification, live Kosli row

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax. Tasks 1–5 are strictly
> ordered on the version chain in **Global Constraints** — do not reorder them. Tasks 6–8
> are independent and may run at any time.

**Goal:** Land four unmerged branches into `middleleap/ai-dlc` `main` in an order that
resolves a two-plugin version collision, then produce the live Kosli evidence row and the
18 Sep call agenda.

**Architecture:** Four in-flight branches claim overlapping plugin versions off the same
base. The collision is resolved by fixing the *merge order* and renumbering exactly one
branch, rather than renumbering three. Everything downstream (private package regeneration,
live run, agenda) hangs off the merged `main`.

**Tech Stack:** Node `node:test` (zero-dep), `gh` CLI, Playwright MCP for page renders,
`kosli` CLI for Task 7.

**Spec:** the five-step runbook pasted in session on 2026-09-16, reconciled against verified
repository state. Where the runbook and the repository disagree, this plan follows the
repository and says so in a **Runbook correction** note.

---

## Global Constraints

- **Repo path is `~/Github/ai-dlc`**, not `~/code/ai-dlc`. The runbook's paths are wrong.
- **Validator must pass before every commit:** `node scripts/validate-marketplace.mjs` → `Marketplace OK.`
- **The validator reads the git tree, not the filesystem.** Commit before trusting a green run on new files.
- **Version gates updates.** Every content change bumps the plugin version in **both**
  `plugins/<plugin>/.claude-plugin/plugin.json` **and** the `.claude-plugin/marketplace.json` entry.
- **The version chain is fixed. Do not improvise numbers:**

  | Plugin | `main` today (after #75) | Task 1 | Task 2 | Task 4 |
  |---|---|---|---|---|
  | `middleleap-loom` | 2.4.3 | **2.4.4** (renumbered — done) | — | **2.4.5** |
  | `middleleap-open-finance` | 2.4.0 | — | **2.4.1** (renumber from 2.3.2) | **2.4.2** |

  > **Revised 16 Sep, afternoon.** PR #75 (npa-uae) was merged into `main` before T1 opened,
  > so this is the chain's second version. The collision landed on T1 instead of T4 and was
  > resolved there: the founder demo is renumbered to loom **2.4.4** (PR #74). Everything that
  > follows moves up one.

- **Never commit anything under `.loom/record-outbox/`.**
- **Never write `KOSLI_API_TOKEN`, `DEMO_PASSWORD`, or any token into a file, a prompt, or a commit.**
- `islamic-banking-uae`, `open-finance-uae`, `uae-bank-risk-reviewer` are **canonical in the
  Claude.ai skills UI**. Any change to them here must be re-exported there or the next import
  silently reverts it.

### The collision this plan exists to resolve

Two branches were cut claiming **loom 2.4.3**, and #75 got there first:

```
origin/main  (after #75)        loom 2.4.3   open-finance 2.4.0
claude/kosli-founder-demo       loom 2.4.3 → 2.4.4  (renumbered on rebase, PR #74)
claude/islamic-banking-deidentify            open-finance 2.3.2 → 2.4.1  (must renumber)
T4 (new branch off main)        loom 2.4.5   open-finance 2.4.2
```

What happened on the T1 rebase is the mechanism this section warned about, observed:
`plugin.json` merged to 2.4.3 **with no conflict** (both sides made the identical edit) while
`marketplace.json` conflicted. Had the rebase been trusted, loom 2.4.3 would have shipped twice.
Both files now read 2.4.4.

**Runbook correction:** Step 2's "bump `middleleap-open-finance` to 2.4.1" is right again
now that #75 merged first — but T2 (de-identify) is ready and T4 is not, so T2 takes
**2.4.1** and T4 takes **2.4.2**.

---

## File Structure

Branches, in merge order:

| # | Branch | State | Touches |
|---|---|---|---|
| 1 | `claude/kosli-founder-demo` | **PR #74 open** — rebased onto main, 6 commits, loom 2.4.4, all checks green | loom harness + demo, `scripts/customer-demo-illustration*.mjs` |
| 2 | `claude/islamic-banking-deidentify` | local only, 1 commit (582a648), not pushed — **needs renumber 2.3.2 → 2.4.1** | 4 files in `islamic-banking-uae` + 2 manifests |
| 3 | `loom/value-chain-page` | **local only, 1 commit (c4c7817), absent from origin** | `docs/loom-for-the-value-chain.html`, `README.md` |
| 4 | ~~`claude/npa-uae-skill` (PR #75)~~ **merged 16 Sep** → T4 is a new branch `claude/npa-cross-bank-money` off main | npa-uae example, walkthrough, kosli README, record types |

---

### Task 0: Sync local `main` and record the baseline

Local `main` is **105 commits behind** `origin/main`. Every task below branches from
`origin/main`, but a stale local `main` is exactly how a wrong base gets used by accident.

- [ ] **Step 1: Fast-forward local main**

```bash
cd ~/Github/ai-dlc
git checkout main && git pull --ff-only origin main
git rev-list --count main..origin/main
```

Expected: `0`.

- [ ] **Step 2: Record the baseline versions the chain starts from**

```bash
grep -o '"version": "[0-9.]*"' plugins/middleleap-loom/.claude-plugin/plugin.json \
                               plugins/middleleap-open-finance/.claude-plugin/plugin.json
node scripts/validate-marketplace.mjs
```

Expected: loom `2.4.2`, open-finance `2.3.1`, `Marketplace OK.` If either number differs,
**stop** — something else has merged and the chain in Global Constraints must be re-derived.

---

### Task 1: Land the founder demo — **DONE 16 Sep: PR #74 open, awaiting your merge**

What happened: after #75 merged, the branch was 1 behind; rebased, `marketplace.json`
conflicted (resolved to main's copy), `plugin.json` silently read 2.4.3, both renumbered to
**2.4.4**. Validator OK · 2538/2538 · scenario 4/4 · `DEMO OK — 23 steps`. The steps below
are kept as the record of what was checked.

**Files:** none modified — this task verifies and opens a PR.

- [ ] **Step 1: Check out the branch and confirm it is current**

```bash
cd ~/Github/ai-dlc
git fetch origin
git checkout claude/kosli-founder-demo
git rev-list --count origin/claude/kosli-founder-demo..origin/main
```

Expected: `0`. If non-zero, rebase onto `origin/main` and keep the **higher** version on any
manifest conflict, then re-run.

- [ ] **Step 2: Read what the branch claims**

```bash
sed -n '1,120p' docs/plans/kosli-founder-demo-briefing.md
sed -n '1,120p' plugins/middleleap-loom/skills/loom-adopt/harness/demo/meridian/README.md
```

Note the evidence-status table in the README — it goes in the PR description verbatim.

- [ ] **Step 3: Run the validator**

```bash
node scripts/validate-marketplace.mjs
```

Expected: `Marketplace OK.`

- [ ] **Step 4: Run the harness suite**

```bash
cd plugins/middleleap-loom/skills/loom-adopt/harness && node --test
```

Expected: all pass, `fail 0`. Record the pass count for the PR description.

- [ ] **Step 5: Run the scenario test**

```bash
cd ~/Github/ai-dlc/plugins/middleleap-loom/skills/loom-adopt/harness
node --test demo/meridian/scenario.test.mjs
```

Expected: pass, `fail 0`.

- [ ] **Step 6: Run the demo against the fake**

```bash
node demo/run-demo.mjs --scenario meridian
```

Expected: `DEMO OK — 23 steps`, with **two deliberate failures** (steps tagged `DELIBERATE
FAILURE 1` and `2`: a fabricated record id refused as unknown to the provider; an unsigned
envelope refused before it leaves the tree) plus the seal gate's refusal while the anchor is
only in the tree. Capture the output. Confirm the join prints every row as `VERIFIED`,
`DECLARED` or `RESOLVED · SIMULATED`, and that the lane pass reads `54 mechanisms executed,
24 skipped with a reason`. If the step count is not 23 or the deliberate failures are not 2,
**stop and report** — do not open the PR.

**Runbook correction:** the runbook and the briefing say *fifteen steps*. That was true
before the Meridian discovery half was added; the branch as pushed runs **23** (verified
16 Sep against the fake). Fifteen is not a failure signal — a count other than 23 is.

- [ ] **Step 7: Open the PR (do not merge)**

```bash
cd ~/Github/ai-dlc
gh pr create --base main --head claude/kosli-founder-demo \
  --title "Meridian scenario: the founder demo, executed" \
  --body "$(cat <<'EOF'
## Evidence status

<paste the table from plugins/middleleap-loom/skills/loom-adopt/harness/demo/meridian/README.md verbatim>

## Verification

| Check | Result |
|---|---|
| `node scripts/validate-marketplace.mjs` | Marketplace OK |
| `harness && node --test` | pass N / fail 0 |
| `node --test demo/meridian/scenario.test.mjs` | pass N / fail 0 |
| `node demo/run-demo.mjs --scenario meridian` | DEMO OK — 23 steps, 2 deliberate failures; 54 mechanisms executed; every join row VERIFIED / DECLARED / RESOLVED · SIMULATED |

Versions: middleleap-loom 2.4.2 → 2.4.3. open-finance untouched.
EOF
)"
```

Replace the `N`s with the real counts from Steps 4–5. The only thing pasted is the README table.

**Gate: a human merges this PR. Do not proceed to Task 2 until it is on `main`.**

---

### Task 2: Land the ADCB de-identification

This branch already exists locally and is committed. It is independent of Task 1's content
and cannot conflict with it (disjoint files, disjoint plugins).

**Files:**
- Modify: `plugins/middleleap-open-finance/skills/islamic-banking-uae/SKILL.md`
- Modify: `.../references/contracts.md`, `.../references/open-finance-intersection.md`, `.../references/uae-governance.md`
- Modify: `plugins/middleleap-open-finance/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`

- [ ] **Step 1: Rebase onto the post-Task-1 main**

```bash
cd ~/Github/ai-dlc
git fetch origin && git checkout claude/islamic-banking-deidentify
git rebase origin/main
```

Expected: conflicts on `marketplace.json` and `open-finance/plugin.json` (#75 rewrote the
description lines). Take main's copy of both; Step 2 sets the version.

- [ ] **Step 2: Renumber 2.3.2 → 2.4.1** — main is at 2.4.0 since #75, so 2.3.2 is now *below* main

Set `"version": "2.4.1"` in `plugins/middleleap-open-finance/.claude-plugin/plugin.json` and in
the open-finance entry of `.claude-plugin/marketplace.json` (a one-line `sed` or editor change
in each; the value `2.3.2` appears exactly once per file), then:

```bash
git commit -qam "open-finance 2.4.1: de-identify lands after npa-uae took 2.4.0"
grep -o '"version": "[0-9.]*"' plugins/middleleap-open-finance/.claude-plugin/plugin.json
```

Expected: `2.4.1`. The rebase in Step 1 will conflict on the same two files (#75 changed the
open-finance description line too) — resolve to main's copy, then do this.

- [ ] **Step 3: Confirm the de-identification is complete**

```bash
grep -rin -e adcb -e "abu dhabi commercial" plugins/middleleap-open-finance/skills/islamic-banking-uae/
```

Expected: no output.

- [ ] **Step 4: Validate**

```bash
node scripts/validate-marketplace.mjs
```

Expected: `Marketplace OK.`

- [ ] **Step 5: Push and open the PR**

```bash
git push -u origin claude/islamic-banking-deidentify
gh pr create --base main --head claude/islamic-banking-deidentify \
  --title "islamic-banking-uae: de-identify the ADCB references" \
  --body "$(git log -1 --format=%b)"
```

- [ ] **Step 6: Re-export to Claude.ai**

This is a manual human step and it is not optional. Export the updated
`islamic-banking-uae` skill to the Claude.ai skills UI, then update the "Last import" line
in `CLAUDE.md`'s provenance section. **Without this, the next import reverts the
de-identification.**

---

### Task 3: Rescue `loom/value-chain-page`

`c4c7817` adds `docs/loom-for-the-value-chain.html` (1742 lines) plus a README row. It exists
**nowhere on origin** — this is the only genuinely unpushed work in the repo. It is 105
commits behind main.

- [ ] **Step 1: Rebase onto current main**

```bash
cd ~/Github/ai-dlc
git checkout loom/value-chain-page && git rebase origin/main
```

If the `README.md` hunk conflicts, keep both rows — main's and the value-chain row.

- [ ] **Step 2: Confirm the page still renders**

Render `docs/loom-for-the-value-chain.html` with Playwright at 1440px and 390px. Confirm no
console errors.

- [ ] **Step 3: Push and open a PR**

```bash
git push -u origin loom/value-chain-page
gh pr create --base main --head loom/value-chain-page \
  --title "docs: the Loom for the value chain" --body "Five-view page for the approvers. Rebased from 105 behind."
```

---

### Task 4: Align the NPA branch to the canonical Meridian story

The branch's worked example tells an *affordability / connected-accounts* story. The
canonical story on `main` after Task 1 is **cross-bank-money**: a PFM view built as a TPP,
with customer-initiated payment as a **separate, later** proposition.

**Files:**
- Create: `plugins/middleleap-open-finance/skills/npa-uae/references/example-cross-bank-money.md`
- Modify: `plugins/middleleap-open-finance/skills/npa-uae/references/example-connected-accounts.md` (retitle only)
- Modify: `plugins/middleleap-open-finance/skills/npa-uae/SKILL.md`
- Modify: `docs/the-loom-walkthrough.html`
- Replace: `docs/plans/loom-kosli-integration/README.md`
- Modify: `docs/plans/loom-kosli-integration/{PRD,EXECUTION-CLAUDE,TASKS}.md` (one-line header each)
- Create: `plugins/middleleap-loom/skills/loom-adopt/harness/scripts/record-types-compile.test.mjs` (does not exist today)
- Modify: `plugins/middleleap-loom/skills/loom-adopt/harness/scripts/record-types-compile.mjs`
- Modify: `plugins/middleleap-loom/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`

- [ ] **Step 1: Branch off main (after T1 merges) and set the versions**

`claude/npa-uae-skill` is merged; T4 is a fresh branch. Loom moves because the record types
change harness code; open-finance moves because the skill gains an example.

```bash
cd ~/Github/ai-dlc
git checkout main && git pull --ff-only origin main
git checkout -b claude/npa-cross-bank-money
```

Set `middleleap-loom` to **2.4.5** and `middleleap-open-finance` to **2.4.2** in both
`plugin.json` files and both `marketplace.json` entries.

```bash
grep -o '"version": "[0-9.]*"' plugins/middleleap-loom/.claude-plugin/plugin.json plugins/middleleap-open-finance/.claude-plugin/plugin.json
```

Expected: loom `2.4.5`, open-finance `2.4.2`. If main has moved past either, take the next
number — never reuse one.

- [ ] **Step 1b: Undo the em-dash churn #75 left behind**

#75's patch export re-encoded every `—` in `marketplace.json` as `\u2014` and it merged that
way. Restore the literal em-dashes here so the file reads as it did:

```bash
python3 - <<'PY'
import io
p='.claude-plugin/marketplace.json'
t=io.open(p,encoding='utf-8').read().replace('\\u2014','\u2014')
io.open(p,'w',encoding='utf-8').write(t)
PY
git diff --stat origin/main -- .claude-plugin/marketplace.json
```

Expected: the marketplace.json diff against main shrinks to the loom and open-finance entries
only. Do the same for `plugins/middleleap-open-finance/.claude-plugin/plugin.json` if its
description line shows the same substitution.

- [ ] **Step 2: Read the canonical discovery run before writing anything**

```bash
cd plugins/middleleap-loom/skills/loom-adopt/harness/demo/meridian/discovery-run
cat problem-statement.md data-governance.md prototype.md stakeholder-reaction.md handoff.md
cat open-finance-obligations.json
```

The new example must match this run's fidelity. **Cite obligations by their register ids from
`open-finance-obligations.json`. Do not invent article numbers.**

- [ ] **Step 3: Write `example-cross-bank-money.md`**

The Business Proposition Form completed for Meridian Trust's PFM view **as a TPP**, request
type **New**. Treat customer-initiated payment as a later **Amendment** and say so explicitly
in fields **1.1** and **4.5**.

- [ ] **Step 4: Retitle the existing example and update SKILL.md**

`example-connected-accounts.md` keeps its content but is retitled as the **second,
lending-side** example. `SKILL.md` references both.

- [ ] **Step 5: Rewrite the walkthrough's business scenario**

In `docs/the-loom-walkthrough.html`, rewrite the `biz` branch of the `steps` array and
`scIntro.biz` to follow cross-bank-money:

- intent from the retail sponsor — "matter in customers' everyday money decisions"
- Gate 1's three framings as **H1–H3** from `problem-statement.md`: know vs act; trust if consent is theirs; payment as a separate proposition
- prototype and reaction exactly as in the run
- the investment case **plus** the NPA pack for the PFM view
- the payment-status obligation — "a timeout is never a failure" — as the traced control in the delivery steps
- the refused first contract and the recorded agent repair at the review step
- `PRODUCTION BLOCKED` at Gate 4, as in the private illustration

**Keep the operational scenario unchanged. Keep every generic step description unchanged.**

- [ ] **Step 6: Render and check the page**

Render with Playwright at **1000px** and **390px**. Confirm no console errors and that the
business toggle tells the story end to end.

- [ ] **Step 7: Replace the kosli integration README with a reconciliation**

```bash
sed -n '/^## *4b/,/^## *5/p' plugins/middleleap-loom/skills/loom/references/kosli-seam.md
```

Read §4b–§4d. Mark each of the PRD's nine features **SHIPPED** (naming the module or script
that ships it), **DELTA** (what is still missing), or **SUPERSEDED**. Add a one-line header to
`PRD.md`, `EXECUTION-CLAUDE.md` and `TASKS.md` saying the seam appendix is the source of truth.

- [ ] **Step 8: Add the `npa-pack` and `npa-approved` record types — write the failing test first**

**Runbook correction:** Step 2.4's conditional resolves to **build it**. The compiler exists
and does derive types from data, but at
`plugins/middleleap-loom/skills/loom-adopt/harness/scripts/record-types-compile.mjs`, not
top-level `scripts/`. It reads the catalog, derives one type per `gate_family`, and emits a
JSON `schema` plus a `pass` condition per entry.

**The compiler has no test file today** — `harness/scripts/record-types-compile.test.mjs`
does not exist, though ~every sibling script has one. **Create** it, following the house
convention: a leading comment stating the invariant under test, then the imports.

```javascript
// record-types: the NPA pack and its decision are record TYPES like any other — schema and
// pass condition as data, so a provider can judge compliance from the record alone.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compileTypes } from './record-types-compile.mjs';

test('compiles the npa-pack and npa-approved record types', () => {
  const catalog = { controls: [] };
  const { types } = compileTypes(catalog, '{}');
  const pack = types.find((t) => t.name === 'npa-pack');
  const approved = types.find((t) => t.name === 'npa-approved');

  assert.ok(pack, 'npa-pack type is emitted');
  assert.equal(pack.schema.required.includes('proposition_id'), true);
  assert.equal(pack.pass.field, 'payload.status');
  assert.deepEqual(pack.pass.in, ['complete']);

  assert.ok(approved, 'npa-approved type is emitted');
  assert.equal(approved.schema.required.includes('approved_by'), true);
  assert.equal(approved.pass.field, 'payload.decision');
  assert.deepEqual(approved.pass.in, ['approved', 'approved-with-conditions']);
});

test('the npa types do not disturb the gate-family types', () => {
  const catalog = { controls: [{ control_id: 'PA1-01', gate_family: 'PA1' }] };
  const { types } = compileTypes(catalog, '{}');
  assert.ok(types.find((t) => t.name === 'loom-gate-pa1'));
  assert.equal(types.filter((t) => t.kind === 'npa').length, 2);
});
```

Both `pass` conditions use the string-`in` form the existing entries use (`GATE_PASS`,
`loom-seal-anchor`) — the Kosli renderer turns `pass` into a jq rule, and a string enum is the
shape it already knows how to render. Don't introduce a boolean `in`.

- [ ] **Step 9: Run it and confirm it fails**

```bash
cd plugins/middleleap-loom/skills/loom-adopt/harness
node --test scripts/record-types-compile.test.mjs
```

Expected: FAIL — `npa-pack type is emitted` (the find returns `undefined`).

- [ ] **Step 10: Add the two types to the `types` array in `compileTypes`**

Insert after the `loom-risk-class` entry, matching the surrounding style:

```javascript
{ name: 'npa-pack', kind: 'npa', family: null, controls: [],
  description: 'A New Product Approval pack submitted for a proposition (npa-uae Business Proposition Form)',
  schema: { type: 'object', required: ['proposition_id', 'request_type', 'status'],
    properties: { proposition_id: { type: 'string' }, request_type: { type: 'string', enum: ['New', 'Amendment', 'BAU'] }, status: { type: 'string', enum: ['draft', 'complete'] } } },
  pass: { field: 'payload.status', in: ['complete'] } },
{ name: 'npa-approved', kind: 'npa', family: null, controls: [],
  description: 'The recorded NPA decision for a proposition, with its approver and date',
  schema: { type: 'object', required: ['proposition_id', 'decision', 'approved_by', 'decided_at'],
    properties: { proposition_id: { type: 'string' }, decision: { type: 'string', enum: ['approved', 'approved-with-conditions', 'declined'] }, approved_by: { type: 'string' }, decided_at: { type: 'string', format: 'date-time' } } },
  pass: { field: 'payload.decision', in: ['approved', 'approved-with-conditions'] } },
```

`controls` is empty on purpose — like `loom-gate`. The catalog has no `NPA-*` control ids and
inventing them here would fail any test that checks type controls against the catalog. The
PA1/PA2 gate-family types already exist; these two are the institution's pack those gates
point at, not new controls.

- [ ] **Step 11: Run the test and confirm it passes**

```bash
node --test scripts/record-types-compile.test.mjs
```

Expected: PASS.

- [ ] **Step 12: Run the full suite and the validator**

```bash
node --test
cd ~/Github/ai-dlc && node scripts/validate-marketplace.mjs
```

Expected: `fail 0`, then `Marketplace OK.`

Then run the compiler's own gate wherever a stored `docs/governance/record-types.json` exists
(the Meridian demo fixture at minimum):

```bash
cd plugins/middleleap-loom/skills/loom-adopt/harness/demo/meridian
node ../../scripts/record-types-compile.mjs --verify
```

Expected: **FAIL** with `does not match what the catalog compiles to — edited by hand;
recompile`. That is `verify()` doing its job — the catalog sha is unchanged (we touched the
compiler, not the catalog) so it falls through to the structural compare and sees two new
types. Recompile and re-verify:

```bash
node ../../scripts/record-types-compile.mjs        # no flag: writes docs/governance/record-types.json
node ../../scripts/record-types-compile.mjs --verify
```

Expected: `Record-types gate — OK (types match the catalog)`. Commit the regenerated JSON with
the compiler change. Don't use `--render` — it needs a mounted provider and is not part of
this task.

- [ ] **Step 13: Push and open the PR**

```bash
git push -u origin claude/npa-cross-bank-money
gh pr create --base main --title "npa-uae: New Product Approval, aligned to the Meridian scenario"
```

The description states: loom **2.4.5**, open-finance **2.4.2**, both examples shipped,
reconciliation README present, record types added.

---

### Task 5: Regenerate the private package (`loom-private-demo`)

**Gated on T4 merging.** The clone, the wording fix and the regeneration script are done
(PR #2 on loom-private-demo); what remains is running it against the post-T4 `main`.

- [x] **Step 1: Clone it alongside `ai-dlc`** — done 16 Sep: `~/Github/loom-private-demo`.

- [x] **Step 2: Fix the stale privacy wording** — done 16 Sep in PR #2 on loom-private-demo,
together with `scripts/sync-check.mjs`, `scripts/regenerate.mjs` and a daily CI check against
ai-dlc `main`. `dist/`, `server.mjs` and the Dockerfile untouched. **Merge PR #2 first.**

- [ ] **Step 3: Regenerate from the merged `ai-dlc` main**

The recipe in `private-source/README.md` is now a script (PR #2 on loom-private-demo):

```bash
cd ~/Github/loom-private-demo
node scripts/regenerate.mjs --ai-dlc ~/Github/ai-dlc            # dry run: lists what changes
node scripts/regenerate.mjs --ai-dlc ~/Github/ai-dlc --apply    # replaces dist/
```

Run it with `~/Github/ai-dlc` on the `main` commit **after Tasks 1–4 have merged**. It
git-archives the base commit into a fresh directory, runs the generator, and diffs before it
replaces anything.

- [ ] **Step 4: Confirm the release metadata**

```bash
node scripts/sync-check.mjs --ai-dlc ~/Github/ai-dlc
grep -E 'source_commit|ai_dlc_commit|recorded_evidence_unchanged' dist/release.json
```

Expected: `sync-check — OK`, `illustration.ai_dlc_commit` = the ai-dlc `main` commit you
regenerated from, and `recorded_evidence_unchanged: true`.

**Runbook correction:** Step 3 says to confirm a *new `source_commit`*. The generator copies
`source_commit` from the base package and never rewrites it — it will always read `36ea325`,
the commit the recorded-evidence base was built from. `scripts/regenerate.mjs` (PR #2 on
loom-private-demo) stamps `illustration.ai_dlc_commit` instead; that is the field that moves.

- [ ] **Step 5: Check the gateway locally**

Set `DEMO_PASSWORD` and `DEMO_HOSTS=localhost:8080` **in the shell only** — never in a file.
Then confirm:

- anonymous `/`, `/index.html`, `/illustration.html`, and any `dist/evidence/*` path → redirect to `/login`, with `no-store` and `noindex` headers
- `private-source/` → 404
- an authenticated session opens both pages

- [ ] **Step 6: Capture and open the PR**

Take 390px and 1440px captures of `illustration.html` into `private-source/review/`. Commit on
a branch, then:

```bash
gh pr create --title "Regenerate package from ai-dlc <short-sha>" \
  --body "Railway deploys main; both approved hosts must be checked after rollout."
```

---

### Task 6: Clean up the stale loom branches

Four local branches look unpushed but their commits all exist upstream, **renumbered** — the
rc-number race. They sit 13–25 commits behind their force-updated remotes.

| Local | Upstream equivalent |
|---|---|
| `loom/rc33-d8-prototype-scan` — `rc.33 — D8's over-specification scan…` | `rc.42 — …` (PR #48, merged) |
| `loom/rc35-waist-exemption-reason` — `rc.35 — the waist-gate exemption…` | `rc.33 — …` (PR #50, merged) |
| `loom/rc36-attestation-test-scope` — `rc.36 — attestation tests…` | `rc.45 — …` |
| `loom/rc34-self-describing-ids` (10 commits) | all present upstream |

- [ ] **Step 1: Confirm nothing unique remains before deleting**

```bash
cd ~/Github/ai-dlc
git log --remotes=origin --format='%s' | sed -E 's/rc\.[0-9]+/rc.N/g' | sort -u > /tmp/remote-subjects.txt
for b in loom/rc33-d8-prototype-scan loom/rc34-self-describing-ids \
         loom/rc35-waist-exemption-reason loom/rc36-attestation-test-scope; do
  echo "--- $b"
  git log --format='%s' "$(git rev-parse --abbrev-ref $b@{upstream})..$b" \
    | sed -E 's/rc\.[0-9]+/rc.N/g' \
    | while IFS= read -r s; do grep -Fxq "$s" /tmp/remote-subjects.txt && echo "  dup   $s" || echo "  UNIQUE $s"; done
done
```

Both sides have their `rc.N` numbers normalised before comparing, so a renumbered duplicate
reads `dup`. Expected: every line `dup`. **Do not use `git log --all` here** — it includes
local branches and will report every commit as found. Anything `UNIQUE`, rescue as a branch
before deleting.

- [ ] **Step 2: Delete them**

```bash
git branch -D loom/rc33-d8-prototype-scan loom/rc34-self-describing-ids \
              loom/rc35-waist-exemption-reason loom/rc36-attestation-test-scope
```

- [ ] **Step 3: Decide the three untracked items**

Not gitignored, so currently undecided:

| Path | Size | Suggested |
|---|---|---|
| `.loomviz-tmp/` | 820K | gitignore — the name says temporary |
| `docs/loom-website/` | 668K — full `index.html` / `app.js` / `styles.css` / `screenshots` | commit on its own branch, or move out of the repo |
| `docs/institution-onboarding-review-2026-09-13.md` | 20K | commit, or move to a notes repo |

---

### Task 7: The live Kosli row

**Blocked on three things:** `kosli` CLI is not on PATH, `KOSLI_ORG` is unset,
`KOSLI_API_TOKEN` is unset, and the sandbox org has not been requested. Ask for the org today.

- [ ] **Step 1: Set up the environment — in the shell, before starting Claude Code**

```bash
export KOSLI_ORG=<org name from James>
export KOSLI_API_TOKEN=<token>        # shell only. Never a file, never a prompt.
```

- [ ] **Step 2: Confirm prerequisites without printing values**

```bash
kosli version
[ -n "$KOSLI_ORG" ] && echo "KOSLI_ORG: set"
[ -n "$KOSLI_API_TOKEN" ] && echo "KOSLI_API_TOKEN: set"
```

- [ ] **Step 3: Run the scenario for real**

```bash
cd ~/Github/ai-dlc/plugins/middleleap-loom/skills/loom-adopt/harness
node demo/run-demo.mjs --scenario meridian --real
```

Expected: writes `docs/integration-run.md` and prints a Kosli trail URL.

- [ ] **Step 4: Record the join**

```bash
node scripts/record-join.mjs CHG-2026-0042 --obligation OB-AE-MTPOL-PSI-001
```

Expected: the external-record row reads `RESOLVED · LIVE`.

- [ ] **Step 5: Check the trail in the Kosli UI**

Open the URL the run printed. Confirm the attestations are present and named as the catalog
expects.

- [ ] **Step 6: If Kosli refuses anything — stop**

Capture the **exact CLI error** into `docs/integration-run.md` under a `## Refusals` heading
and stop. **Do not work around it.** The refusal is the finding.

- [ ] **Step 7: Commit and open the PR**

```bash
cd ~/Github/ai-dlc
git checkout -b "claude/integration-run-$(date +%F)"   # the date of the RUN, not of this plan
git add docs/integration-run.md    # nothing else
git commit -m "docs: the Meridian scenario against a live Kosli org"
git push -u origin HEAD
gh pr create --title "Live integration run: the Meridian trail against a real org"
```

**Verify nothing under `.loom/record-outbox/` was staged:**

```bash
git show --name-only HEAD | grep record-outbox && echo "STOP — outbox staged" || echo "clean"
```

---

### Task 8: The 18 September call agenda (read-only, no commit)

Runnable now for the parts Task 7 does not gate.

- [ ] **Step 1: Read the open questions**

```bash
sed -n '/^## *5/,/^## *6/p' plugins/middleleap-loom/skills/loom/references/kosli-seam.md
cat docs/integration-run.md 2>/dev/null || echo "(no live run yet — every question stays open)"
```

- [ ] **Step 2: Produce the agenda**

For each of the seven questions, one line: **answered** / **partial** / **open**, plus what to
ask James and Mike. Then list plan rows **2.7**, **4.3** and **3.7** from the seam with what
each needs from the call.

Print as one page of markdown. **Do not commit it.**

---

## Dependency graph

```
Task 1  founder demo ──┬─► Task 2  de-identify ──► Task 4  npa aligned ──► Task 5  private package
                       │                                │
                       └─► Task 3  value-chain page     └─► Task 8  agenda
                                                         ▲
Task 6  branch cleanup   (independent)                   │
Task 7  live Kosli run   (needs sandbox org) ────────────┘
```

Tasks 1 → 2 → 4 are the version chain and are strictly ordered. Task 3 and Task 6 are
independent. Task 7 needs only the sandbox org and can run in parallel with 2–5.

## Open decisions

1. ~~Does PR #75 stay open?~~ **Resolved by merge, 16 Sep.** T4 is a follow-up release.
2. **`CLAUDE.md` documents `scripts/discovery-sync-check.mjs` as a load-bearing gate. That file
   does not exist on `main`** — `scripts/` holds only the validator, its test, and the
   onboarding/demo scripts. Either the gate was removed and the doc is stale, or the script was
   lost. Worth resolving before the next `harness/discovery/` change relies on it.
