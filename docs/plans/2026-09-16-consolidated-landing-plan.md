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

  | Plugin | `main` today | Task 1 | Task 2 | Task 4 |
  |---|---|---|---|---|
  | `middleleap-loom` | 2.4.2 | **2.4.3** (as branched) | — | **2.4.4** (renumber) |
  | `middleleap-open-finance` | 2.3.1 | — | **2.3.2** (as branched) | **2.4.0** (as branched) |

- **Never commit anything under `.loom/record-outbox/`.**
- **Never write `KOSLI_API_TOKEN`, `DEMO_PASSWORD`, or any token into a file, a prompt, or a commit.**
- `islamic-banking-uae`, `open-finance-uae`, `uae-bank-risk-reviewer` are **canonical in the
  Claude.ai skills UI**. Any change to them here must be re-exported there or the next import
  silently reverts it.

### The collision this plan exists to resolve

Two branches independently claim **loom 2.4.3**:

```
origin/main                     loom 2.4.2   open-finance 2.3.1
claude/kosli-founder-demo       loom 2.4.3   (open-finance untouched)
claude/npa-uae-skill  (PR #75)  loom 2.4.3   open-finance 2.4.0   ← collides on loom
claude/islamic-banking-deidentify            open-finance 2.3.2   ← no collision
```

Git auto-merges identical version bumps without conflict, so if `claude/kosli-founder-demo`
and `claude/npa-uae-skill` both land unmodified, **loom 2.4.3 ships twice with different
content and no user receives the second one.** Task 4 renumbers the npa branch to 2.4.4.

`open-finance` needs no renumber: 2.3.2 (patch, Task 2) then 2.4.0 (minor, new skill, Task 4)
is already monotonic.

**Runbook correction:** Step 2 says "bump `middleleap-open-finance` to 2.4.1". That assumed
PR #75 had already merged at 2.4.0 and Step 2 was a follow-up release. In this plan Step 2's
content lands *on the same branch before it merges*, so it ships as one release at **2.4.0**.
Do not use 2.4.1.

---

## File Structure

Branches, in merge order:

| # | Branch | State | Touches |
|---|---|---|---|
| 1 | `claude/kosli-founder-demo` | pushed, 5 commits, 44 files, **0 behind main** | loom harness + demo, `scripts/customer-demo-illustration*.mjs` |
| 2 | `claude/islamic-banking-deidentify` | **local only, 1 commit (582a648), not pushed** | 4 files in `islamic-banking-uae` + 2 manifests |
| 3 | `loom/value-chain-page` | **local only, 1 commit (c4c7817), absent from origin** | `docs/loom-for-the-value-chain.html`, `README.md` |
| 4 | `claude/npa-uae-skill` (PR #75) | pushed, 2 commits, 16 files | npa-uae skill, loom discovery canon, `docs/` |

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

### Task 1: Land the founder demo

**Runbook correction:** Step 1's prompt says to rebase. **No rebase is needed** —
`claude/kosli-founder-demo` is already 0 commits behind `origin/main`, so there is no
`marketplace.json` / `plugin.json` conflict to resolve. Skip straight to verification.

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

Expected: clean. Task 1 touches no `open-finance` file.

- [ ] **Step 2: Confirm the version is still 2.3.2 and nothing else claimed it**

```bash
grep -o '"version": "[0-9.]*"' plugins/middleleap-open-finance/.claude-plugin/plugin.json
git show origin/main:plugins/middleleap-open-finance/.claude-plugin/plugin.json | grep -o '2\.[0-9.]*'
```

Expected: branch `2.3.2`, main `2.3.1`.

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

- [ ] **Step 1: Rebase and renumber loom to 2.4.4**

```bash
cd ~/Github/ai-dlc
git checkout claude/npa-uae-skill && git rebase origin/main
```

The two manifests behave **differently** during this rebase, and the difference is the trap:

- `.claude-plugin/marketplace.json` **will conflict** — the founder demo changed line 72
  (loom version) and this branch changed lines 71–72 (loom description + version). Resolve the
  loom entry to version **2.4.4**.
- `plugins/middleleap-loom/.claude-plugin/plugin.json` **will not conflict.** Both sides
  changed line 4 from `2.4.2` to `2.4.3` identically, so git merges it silently and the file
  reads **2.4.3 — the number the founder demo already shipped.** Edit it to `2.4.4` by hand.

Leave `open-finance` at **2.4.0** — do not change it to 2.4.1.

```bash
grep -o '"version": "[0-9.]*"' plugins/middleleap-loom/.claude-plugin/plugin.json
grep -A3 '"./plugins/middleleap-loom"' .claude-plugin/marketplace.json | grep -o '"version": "[0-9.]*"'
```

Expected: `2.4.4` **twice**. If either says `2.4.3` the trap has closed — fix it before going on.

- [ ] **Step 1b: Undo the em-dash churn**

The patch export re-encoded every `—` in `marketplace.json` as `\u2014`, which touched the
description lines of four plugins this branch has nothing to do with (lines 6, 12, 31, 52).
Restore the literal em-dashes so the diff shows only the two real changes:

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

- [ ] **Step 13: Push and update PR #75**

```bash
git push --force-with-lease
gh pr edit 75 --title "npa-uae: New Product Approval, aligned to the Meridian scenario"
```

Update the PR description to state: loom **2.4.4**, open-finance **2.4.0**, both examples
shipped, reconciliation README present, record types added.

---

### Task 5: Regenerate the private package (`loom-private-demo`)

**Blocked:** the repo is not cloned. `~/code/loom-private-demo` and
`~/Github/loom-private-demo` are both absent. Clone it before starting.

- [ ] **Step 1: Clone it alongside `ai-dlc`**

```bash
gh repo clone middleleap/loom-private-demo ~/Github/loom-private-demo
```

(`middleleap/loom-private-demo` — public, confirmed via `gh repo list middleleap`.)

- [ ] **Step 2: Fix the stale privacy wording**

`README.md` and `private-source/README.md` still say the repository must stay private. It is
public now. Reword to: the repository is public, the scenario is fictional, and protected
hosting comes from the gateway and hosting secrets — **not** from repository visibility.

**Do not touch `dist/`, `server.mjs`, or the Dockerfile in this step.**

- [ ] **Step 3: Regenerate from the merged `ai-dlc` main**

Follow the recipe in `private-source/README.md`: extract the base package commit it names into
a fresh directory, then:

```bash
node ~/Github/ai-dlc/scripts/customer-demo-illustration.mjs \
  <base-dir> private-source/open-finance-illustration.json <new-dir>
```

Use the `ai-dlc` `main` commit **after Tasks 1–4 have merged**. Copy the generated `dist/`
into the checkout.

- [ ] **Step 4: Confirm the release metadata**

```bash
grep -E 'source_commit|recorded_evidence_unchanged' dist/release.json
```

Expected: the new `source_commit`, and `recorded_evidence_unchanged: true`.

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

1. **Does PR #75 stay open?** This plan assumes yes — Task 4 force-pushes onto it so the whole
   npa work lands as one release at open-finance 2.4.0. The alternative is merging #75 as-is
   at 2.4.0 and shipping Task 4's content as 2.4.1, which means two marketplace releases for
   one feature.
2. **`CLAUDE.md` documents `scripts/discovery-sync-check.mjs` as a load-bearing gate. That file
   does not exist on `main`** — `scripts/` holds only the validator, its test, and the
   onboarding/demo scripts. Either the gate was removed and the doc is stale, or the script was
   lost. Worth resolving before the next `harness/discovery/` change relies on it.
