# Self-Describing Identifiers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every Loom identifier readable to someone who has never used the Loom, by expanding ids on first use and adding a single canonical glossary — **without renaming any identifier**.

**Architecture:** Three moves, in order of value. First, resolve a genuine *wrong-referent* collision: `D2.4`/`D3.3`/`D5.1`/`D5.4` are Factory Floor **decision** ids that read as discovery gates `D1`–`D9`. Second, add one glossary to the method canon that every other document links to, so the expansion lives in exactly one place. Third, expand bare ids on first use in the highest-traffic human-facing files, and add a mechanical gate so new bare ids cannot creep back in. No identifier changes value, so no adopted repository, CI configuration, or existing discovery run breaks.

**Tech Stack:** Pure Node ≥18 (zero dependencies, `node:test`), Markdown. Same constraints as the rest of the harness.

## Global Constraints

- **No identifier is renamed.** `D1`–`D9`, `Q1`–`Q5`, `H1`, `S-001`, `T-1`, `G-01`, `WS0`–`WS9`, `DR-*`, `CTRL-*` all keep their current values. This plan changes prose and adds a gate; it does not touch id semantics.
- **Zero runtime dependencies.** Every script is pure Node, consistent with `discovery/gates/` and `scripts/`.
- **The validator's gate names are the source of truth** for gate expansions. Copy them verbatim from `discovery/gates/validate.mjs`: D1 Problem framing · D2 Evidence · D3 Scope & stakeholders · D4 No-solutioning boundary · D5 Synthesis integrity · D6 Data-governance feasibility · D7 Brand conformance · D8 Tangibility · D9 Validation loop.
- **Q-gate names** come from `skills/loom/references/delivery-harness.md`: Q1 build + unit · Q1b test integrity · Q2 static + SAST · Q2b doc integrity · Q3 integration + contract · Q4 security + dependencies · Q4.5 lineage · Q5 production approval.
- **`harness/discovery/**` is sync-guarded.** Any change under that tree must be booked with `node scripts/discovery-sync-check.mjs --record` from the harness directory, and its ledger note edited to stay descriptive. This plan touches `harness/discovery/templates/` — Task 4 — so the booking step is mandatory there.
- **Version gating.** Any release of this work bumps `version` in **both** `plugins/middleleap-loom/.claude-plugin/plugin.json` and the `middleleap-loom` entry in `.claude-plugin/marketplace.json`. Current: `2.0.0-rc.31`.
- **Verification before any commit:** `node scripts/validate-marketplace.mjs` from the repo root must print `Marketplace OK.`
- **Doc-integrity gate already exists** (`Q2b`) and a copy-table drift gate fails the build if `loom-adopt/SKILL.md`'s table diverges from `copy-manifest.json`. Task 1 edits both; they must stay in step.

---

## Baseline measurements (taken 2026-07-28, `plugins/middleleap-loom/`)

Recorded so the work can be shown to have moved something. Reproduce with the survey script added in Task 5.

| Metric | Value |
|---|---|
| Gate ids in markdown, **bare** (id with no name beside it) | 252 |
| Gate ids in markdown, **expanded** | 81 |
| Files carrying at least one bare gate id | ~60 |
| Worst offender | `skills/loom/references/discovery-harness.md` — 32 bare |
| Identifier families in play | 8 — `D`, `Q`, `H`, `S-`, `T-`, `G-`, `WS`, plus `DR-`/`CTRL-` |
| Existing glossary | **none** |

**Already correct, do not change:** the validator CLI prints `[PASS] D1 Problem framing` (`discovery/gates/validate.mjs:295`). The single most-seen surface already expands. This plan must not regress it.

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `plugins/middleleap-loom/skills/loom/references/glossary.md` | **Create** | The one canonical expansion of every identifier family. Everything else links here. |
| `plugins/middleleap-loom/skills/loom/SKILL.md` | Modify | Link the glossary from the method entry point; expand ids in its own prose. |
| `plugins/middleleap-loom/skills/loom/references/discovery-harness.md` | Modify | Worst offender (32 bare). Also the file copied to `discovery/DISCOVERY.md`. |
| `plugins/middleleap-loom/skills/loom/references/delivery-harness.md` | Modify | Q-gate expansions. |
| `plugins/middleleap-loom/skills/loom/references/factory-floor.md` | Modify | **Collision fix** — floor decision ids written as `Decision D5.4`. |
| `plugins/middleleap-loom/skills/loom-adopt/SKILL.md` | Modify | Collision fix in the copy table (11 bare gate ids + `D5.4`/`D3.3`). |
| `plugins/middleleap-loom/skills/loom-adopt/harness/copy-manifest.json` | Modify | Collision fix — `seam` strings mirror the copy table; drift gate couples them. |
| `plugins/middleleap-loom/skills/loom-adopt/harness/discovery/templates/*.md` | Modify | Expand ids where an author meets them while writing a run. **Sync-guarded.** |
| `plugins/middleleap-loom/skills/loom-adopt/harness/scripts/id-legibility-check.mjs` | **Create** | The gate: fails on a bare id in a human-facing markdown file that does not link the glossary. |
| `plugins/middleleap-loom/skills/loom-adopt/harness/scripts/id-legibility-check.test.mjs` | **Create** | Its suite. |

**Decomposition rationale.** The glossary is created first because every later task links to it; the gate is created last because it must not fail the build while the expansions are still landing. The collision fix (Task 1) is deliberately *before* the glossary — it is the only change that fixes a wrong referent rather than a readability nuisance, and it should land even if the rest is deferred.

---

### Task 1: Resolve the decision-id collision

`D2.4`, `D3.3`, `D5.1`, `D5.4` are **Factory Floor decision** ids. They are unrelated to discovery gates `D1`–`D9`, but a reader meeting "WS5 · D5.4" has every reason to read "gate D5". This is the one item in this plan that fixes a wrong referent, not merely a terse one.

**Files:**
- Modify: `plugins/middleleap-loom/skills/loom-adopt/SKILL.md:98-99`
- Modify: `plugins/middleleap-loom/skills/loom-adopt/harness/copy-manifest.json:73,80`
- Modify: `plugins/middleleap-loom/skills/loom/references/factory-floor.md`
- Modify: `plugins/middleleap-loom/skills/loom-adopt/harness/approval-attestation-example/README.md:1`
- Modify: `plugins/middleleap-loom/skills/loom-adopt/harness/approval-attestation-example/assertion-issuers.example.json:9`
- Modify: `plugins/middleleap-loom/skills/loom-adopt/harness/approval-attestation-example/pa1-risk-second-line.json:2`
- Modify: `plugins/middleleap-loom/skills/loom-adopt/harness/core/floor-approval-surface.mjs:1`

**Interfaces:**
- Consumes: nothing.
- Produces: the convention `Decision D<n>.<n>` (floor decisions) versus `gate D<n>` (discovery gates), relied on by Task 5's gate and Task 2's glossary.

- [ ] **Step 1: Find every occurrence**

```bash
cd plugins/middleleap-loom
grep -rn "D[0-9]\.[0-9]" --include="*.md" --include="*.json" --include="*.mjs" . | grep -v "DR-"
```

Expected: the seven files listed above. If the count differs, the extra hits are in scope — this plan does not authorise leaving one behind.

- [ ] **Step 2: Apply the convention**

Every floor decision id gets the word `Decision` immediately before it. Exact replacements:

| File:line | From | To |
|---|---|---|
| `skills/loom-adopt/SKILL.md:98` | `(WS5 · D5.4)` | `(WS5 · Decision D5.4)` |
| `skills/loom-adopt/SKILL.md:99` | `(WS3 · D3.3)` | `(WS3 · Decision D3.3)` |
| `harness/copy-manifest.json:73` | `(WS5 · D5.4)` | `(WS5 · Decision D5.4)` |
| `harness/copy-manifest.json:80` | `(WS3 · D3.3)` | `(WS3 · Decision D3.3)` |
| `harness/approval-attestation-example/README.md:1` | `WS2 · D2.4` | `WS2 · Decision D2.4` |
| `harness/approval-attestation-example/assertion-issuers.example.json:9` | `the D2.4 contract` | `the Decision D2.4 contract` |
| `harness/approval-attestation-example/pa1-risk-second-line.json:2` | `WS2 · D2.4` | `WS2 · Decision D2.4` |
| `harness/core/floor-approval-surface.mjs:1` | `WS5 · D5.1` | `WS5 · Decision D5.1` |

Apply the same rule to every hit in `skills/loom/references/factory-floor.md`.

- [ ] **Step 3: Verify the copy table and the manifest did not drift apart**

The copy table in `loom-adopt/SKILL.md` is generated from `copy-manifest.json` and a doc-integrity gate fails on divergence. Both were edited, so they must still agree.

Run: `cd plugins/middleleap-loom/skills/loom-adopt/harness && node scripts/doc-integrity-check.mjs`
Expected: exit 0, no drift reported. (Verified 2026-07-28: `scripts/doc-integrity-check.mjs`
is the gate that owns the `LOOM:COPY-TABLE` markers.)

- [ ] **Step 4: Verify no bare floor-decision id remains**

Run:
```bash
cd plugins/middleleap-loom
grep -rn "D[0-9]\.[0-9]" --include="*.md" --include="*.json" --include="*.mjs" . | grep -v "DR-" | grep -v "Decision D"
```
Expected: **no output.**

- [ ] **Step 5: Run the full harness suite**

Run: `cd plugins/middleleap-loom/skills/loom-adopt/harness && node --test discovery/gates/*.test.mjs discovery/render/*.test.mjs scripts/*.test.mjs core/*.test.mjs`
Expected: `fail 0`. (Baseline at time of writing: 1430 tests passing.)

- [ ] **Step 6: Commit**

```bash
git add -A -- plugins/middleleap-loom
git commit -m "loom: disambiguate floor decision ids from discovery gate ids

D2.4/D3.3/D5.1/D5.4 are Factory Floor decision ids, not discovery
gates D1-D9. A reader meeting 'WS5 · D5.4' reasonably read 'gate D5'.
Every floor decision id now carries the word Decision.

No identifier changed value."
```

---

### Task 2: Create the canonical glossary

One file, linked from everywhere. The expansion must live in exactly one place or it will drift.

**Files:**
- Create: `plugins/middleleap-loom/skills/loom/references/glossary.md`

**Interfaces:**
- Consumes: the `Decision D<n>.<n>` convention from Task 1.
- Produces: the path `references/glossary.md`, linked by Tasks 3 and 4 and required by Task 5's gate.

- [ ] **Step 1: Write the glossary**

Create `plugins/middleleap-loom/skills/loom/references/glossary.md` with exactly this content:

```markdown
# Glossary — every identifier the Loom uses

The Loom uses short identifiers so that a gate, a signal, or a decision can be cited
precisely and traced mechanically. They are terse by design and opaque on first contact.
This file is the single expansion of all of them; everything else links here rather than
repeating it.

## Discovery gates — `D1`–`D9`

The nine checks a discovery run must pass. Mechanical: they check structure, references,
and presence, not taste. Enforced by `discovery/gates/validate.mjs`.

| Id | Name | Fails when |
|---|---|---|
| `D1` | Problem framing | No falsifiable problem, target user, or success measure |
| `D2` | Evidence | A claim cites a signal that does not exist, or cites none at all |
| `D3` | Scope & stakeholders | No named stakeholders, or no explicit out-of-scope boundary |
| `D4` | No-solutioning boundary | A discovery artifact specifies a build — the left diamond leaking into the right |
| `D5` | Synthesis integrity | A theme traces to no signal, or no prioritisation method is stated |
| `D6` | Data-governance feasibility | No risk category or regulatory driver cited, an id that does not resolve, or no residual-risk verdict |
| `D7` | Brand conformance | A visual artifact omits the brand marker or hard-codes a colour, size, or font |
| `D8` | Tangibility | No prototype brief and wireframe, or the prototype over-specifies |
| `D9` | Validation loop | A prototype exists that nobody reacted to |

## Quality gates — `Q1`–`Q5`

The delivery-side checks. A failed gate blocks merge.

| Id | Name | Question it answers |
|---|---|---|
| `Q1` | build + unit | Does it compile and pass its own tests? |
| `Q1b` | test integrity | Did any test get weakened to reach green? |
| `Q2` | static + SAST | Lint, types, security static analysis |
| `Q2b` | doc integrity | Do current-state docs still point at files that exist? |
| `Q3` | integration + contract | Does it work end to end and honour the contract? |
| `Q4` | security + dependencies | Dependency audit, secrets scan |
| `Q4.5` | lineage | Does every data store emit the expected lineage? |
| `Q5` | production approval | A human, at release time — evidenced, not implied |

## Run-level identifiers — authored inside a discovery run

These are created by whoever runs a discovery. They are local to one run and are how
evidence stays traceable.

| Prefix | Expansion | What it is |
|---|---|---|
| `S-001` | **Signal** | One observation from research, with a source and a confidence. Everything downstream must trace to one |
| `T-1` | **Theme** | A cluster of signals, named in synthesis. Every theme cites at least one signal |
| `H1` | **Hypothesis** | A framing hypothesis the prototype makes tangible, so a stakeholder can confirm or refute it |
| `G-01` | **Gap** | An open question the run has not answered. Recorded so it is visible rather than silently assumed |
| `I-1` | **Inference** | A plausible reading the evidence does *not* support. Carried explicitly so it never passes as a finding |

## Governance identifiers

| Prefix | Expansion | Where it lives |
|---|---|---|
| `DR-1.1-001` | **Data Risk** — domain, category, statement | The data-risk register (the D6 seam) |
| `CTRL-001` | **Control** | The data-risk register |
| `HG-0001` | **Harness Governance** decision | The governance catalog |
| `WS0`–`WS9` | **Workstream** | Factory Floor programme structure |
| `Decision D5.4` | A **Factory Floor decision** record | Factory Floor. **Not** a discovery gate — always written with the word `Decision` so it cannot be misread as gate `D5` |

## The one collision worth knowing about

`D5` is a discovery gate. `Decision D5.4` is a Factory Floor decision. They are unrelated.
The word `Decision` is mandatory on the second, and a gate enforces it.
```

- [ ] **Step 2: Verify every gate name matches the validator**

The glossary must not drift from the code. Run:

```bash
cd plugins/middleleap-loom
grep -oE "gate\('D[0-9]', '[^']+'" skills/loom-adopt/harness/discovery/gates/validate.mjs | sort -u
```

Expected output, and every name must appear verbatim in the glossary table:
```
gate('D1', 'Problem framing'
gate('D2', 'Evidence'
gate('D3', 'Scope & stakeholders'
gate('D4', 'No-solutioning boundary'
gate('D5', 'Synthesis integrity'
gate('D6', 'Data-governance feasibility'
gate('D7', 'Brand conformance'
gate('D8', 'Tangibility'
gate('D9', 'Validation loop'
```

- [ ] **Step 3: Commit**

```bash
git add plugins/middleleap-loom/skills/loom/references/glossary.md
git commit -m "loom: add the identifier glossary

One canonical expansion of every id family — discovery gates, quality
gates, run-level ids, governance ids. Everything else links here rather
than repeating it, so the expansion cannot drift."
```

---

### Task 3: Link the glossary and expand ids in the method canon

The four files a newcomer actually reads first.

**Files:**
- Modify: `plugins/middleleap-loom/skills/loom/SKILL.md`
- Modify: `plugins/middleleap-loom/skills/loom/references/discovery-harness.md`
- Modify: `plugins/middleleap-loom/skills/loom/references/delivery-harness.md`
- Modify: `plugins/middleleap-loom/README.md` (repo-level, 7 bare ids)

**Interfaces:**
- Consumes: `references/glossary.md` from Task 2.
- Produces: the house rule Task 5 enforces — *first bare id in a file is followed by its name in parentheses, or the file links the glossary in its first 30 lines.*

- [ ] **Step 1: Add the glossary link to the method entry point**

In `skills/loom/SKILL.md`, in the "Full canon for each half" list, add as the first bullet:

```markdown
- `references/glossary.md` — **every identifier expanded** (`D1`–`D9`, `Q1`–`Q5`, signals,
  themes, hypotheses, gaps). Read this first if an id in any other file is opaque.
```

- [ ] **Step 2: Expand on first use in each file**

The rule is *first use per file*, not every use — expanding all 252 would make the prose
unreadable, which is the opposite of the goal.

For each of the four files, find the first occurrence of each id family and expand it:

- First `D<n>` in the file → `D4 (No-solutioning boundary)`, using the name from the glossary.
- First `Q<n>` in the file → `Q1b (test integrity)`.
- First `S-<nnn>` → `signal S-001`.
- First `T-<n>` → `theme T-1`.
- First `H<n>` → `hypothesis H1`.

Subsequent uses in the same file stay bare.

- [ ] **Step 3: Add the glossary pointer to `discovery-harness.md`**

This file becomes `discovery/DISCOVERY.md` in every adopting repo, so it must carry the
pointer inline rather than relying on a sibling. Immediately after the opening blockquote,
add:

```markdown
> **New to the Loom's identifiers?** `D1`–`D9` are the discovery gates, `S-001` a signal,
> `T-1` a theme, `H1` a framing hypothesis. All of them are expanded in the method skill's
> `references/glossary.md`.
```

- [ ] **Step 4: Verify the bare-id count actually fell**

Run the survey from Task 5 Step 1 (write that script first if executing out of order), or inline:

```bash
cd plugins/middleleap-loom
node -e '
const {execSync}=require("child_process");const fs=require("fs");
const NAMES=/(Problem framing|Evidence|Scope|No-solutioning|Synthesis integrity|Data-governance|Brand conformance|Tangibility|Validation loop|build \+ unit|test integrity|static|doc integrity|integration|security|lineage|production approval)/i;
let bare=0;
for(const f of execSync("git ls-files \"*.md\"").toString().trim().split("\n")){
  for(const line of fs.readFileSync(f,"utf8").split("\n")){
    const m=line.match(/\b(D[1-9]|Q[1-5])\b/g); if(m && !NAMES.test(line)) bare+=m.length;
  }
}
console.log("bare:",bare);
'
```
Expected: below the 252 baseline. These four files carry 32+8+7 bare ids between them, so a
result at or above 252 means the edits did not land.

- [ ] **Step 5: Commit**

```bash
git add -A -- plugins/middleleap-loom
git commit -m "loom: expand identifiers on first use in the method canon

Ids stay as they are; each file now expands the first use of each
family and points at the glossary. Newcomers stop meeting a bare D8."
```

---

### Task 4: Expand ids in the run templates

Where an author meets an id while writing a discovery run — the highest-value surface after the canon, because the reader is actively authoring.

**Files:**
- Modify: `plugins/middleleap-loom/skills/loom-adopt/harness/discovery/templates/handoff.md` (10 bare)
- Modify: `plugins/middleleap-loom/skills/loom-adopt/harness/discovery/templates/problem-statement.md`
- Modify: `plugins/middleleap-loom/skills/loom-adopt/harness/discovery/templates/data-governance.md`
- Modify: `plugins/middleleap-loom/skills/loom-adopt/harness/discovery/templates/prototype.md`
- Modify: `plugins/middleleap-loom/skills/loom-adopt/harness/discovery/templates/stakeholder-reaction.md`
- Modify: `plugins/middleleap-loom/skills/loom-adopt/harness/discovery/templates/research-log.md`
- Modify: `plugins/middleleap-loom/skills/loom-adopt/harness/discovery/templates/synthesis.md`
- Modify: `plugins/middleleap-loom/skills/loom-adopt/harness/skills/discovery/SKILL.md` (8 bare)

**Interfaces:**
- Consumes: the expansion rule from Task 3.
- Produces: templates whose guidance blockquotes name the gate they satisfy.

**This tree is sync-guarded.** Step 4 is not optional.

- [ ] **Step 1: Expand the gate references in each template's guidance blockquote**

Each template opens with a `>` blockquote naming its gates. Expand them. Exact edits:

| File | From | To |
|---|---|---|
| `research-log.md` | `gates D2/D5` | `gates D2 (Evidence) and D5 (Synthesis integrity)` |
| `synthesis.md` | `(gate D5)` | `(gate D5 — Synthesis integrity)` |
| `problem-statement.md` | `Gates D1 (framing), D3 (scope), D4 (no solutioning...)` | leave — already expanded |
| `data-governance.md` | `Gate D6:` | `Gate D6 (Data-governance feasibility):` |
| `prototype.md` | `Gates D8 (this brief...)` | leave — already expanded |
| `stakeholder-reaction.md` | `(D9)` | `(gate D9 — Validation loop)` |
| `handoff.md` | `iff D1–D8 green` | `iff gates D1–D9 (problem framing through validation loop) are green` |

Note `handoff.md` currently says `D1–D8`, which is stale — D9 exists. Fix that while here.

- [ ] **Step 2: Expand run-level ids where the template introduces them**

| File | Add |
|---|---|
| `research-log.md` | `Each signal gets a stable id (`S-001`, …)` → append `— "S" for signal` |
| `synthesis.md` | Themes table header note → `Theme ids are `T-1`, `T-2`, …` |
| `prototype.md` | `(`H1`, `H2`, …)` → `(hypotheses `H1`, `H2`, …)` |

- [ ] **Step 3: Verify the templates still validate**

Templates carry `<slug>` placeholders, so they are not valid runs on their own. Confirm the
gate suite still passes with the edited templates in the tree:

Run: `cd plugins/middleleap-loom/skills/loom-adopt/harness && node --test discovery/gates/*.test.mjs`
Expected: `fail 0`.

- [ ] **Step 4: Book the sync debt — MANDATORY**

`harness/discovery/**` is guarded. Without this the build fails.

```bash
cd plugins/middleleap-loom/skills/loom-adopt/harness
node scripts/discovery-sync-check.mjs
```
Expected: **FAIL**, naming each edited template — this is the gate working.

```bash
node scripts/discovery-sync-check.mjs --record
```

Then restore a descriptive note (the `--record` writes a generic one):

```bash
node -e '
const fs=require("fs");const p="discovery-sync.json";const d=JSON.parse(fs.readFileSync(p));
for(const k of Object.keys(d.files)) if(k.startsWith("discovery/templates/"))
  d.files[k].note="changed here: identifier expansion on first use (self-describing ids)";
fs.writeFileSync(p, JSON.stringify(d,null,2)+"\n");
'
node scripts/discovery-sync-check.mjs
```
Expected: `Discovery-sync gate — OK`.

- [ ] **Step 5: Commit**

```bash
git add -A -- plugins/middleleap-loom
git commit -m "loom: expand identifiers in the discovery templates

The surface an author meets while writing a run. Also fixes handoff.md
saying D1-D8 when D9 exists.

discovery-sync ledger re-recorded: port owed to ofbo."
```

---

### Task 5: Add the gate that stops bare ids creeping back

Without this, the expansions decay on the next release. The gate is deliberately lenient: it
fails only on a file that uses ids *and* neither expands a first use nor links the glossary.

**Files:**
- Create: `plugins/middleleap-loom/skills/loom-adopt/harness/scripts/id-legibility-check.mjs`
- Create: `plugins/middleleap-loom/skills/loom-adopt/harness/scripts/id-legibility-check.test.mjs`

**Interfaces:**
- Consumes: the glossary path and the expansion rule from Tasks 2–3.
- Produces: `checkFile(path, text) -> string[]` (issues) and `main()` CLI, exported for the suite.

- [ ] **Step 1: Write the failing test**

Create `scripts/id-legibility-check.test.mjs`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkFile } from './id-legibility-check.mjs';

test('a file whose first gate id is expanded passes', () => {
  const t = '# Doc\n\nThe D4 (No-solutioning boundary) gate stops leakage. Later D4 is bare.\n';
  assert.deepEqual(checkFile('a.md', t), []);
});

test('a file that links the glossary passes even with bare ids', () => {
  const t = '# Doc\n\nSee `references/glossary.md`.\n\nD4 blocks it. D8 too.\n';
  assert.deepEqual(checkFile('a.md', t), []);
});

test('a file with a bare first gate id and no glossary link fails', () => {
  const t = '# Doc\n\nThe D4 gate stops leakage.\n';
  const issues = checkFile('a.md', t);
  assert.equal(issues.length, 1);
  assert.match(issues[0], /D4/);
});

test('a floor decision id must carry the word Decision', () => {
  const t = '# Doc\n\nSee `references/glossary.md`.\n\nPer D5.4 the form is routed.\n';
  const issues = checkFile('a.md', t);
  assert.equal(issues.length, 1);
  assert.match(issues[0], /Decision D5\.4/);
});

test('a correctly written floor decision id passes', () => {
  const t = '# Doc\n\nSee `references/glossary.md`.\n\nPer Decision D5.4 the form is routed.\n';
  assert.deepEqual(checkFile('a.md', t), []);
});

test('a file with no ids at all passes', () => {
  assert.deepEqual(checkFile('a.md', '# Doc\n\nNothing here.\n'), []);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd plugins/middleleap-loom/skills/loom-adopt/harness && node --test scripts/id-legibility-check.test.mjs`
Expected: FAIL — `Cannot find module './id-legibility-check.mjs'`.

- [ ] **Step 3: Write the implementation**

Create `scripts/id-legibility-check.mjs`:

```javascript
#!/usr/bin/env node
// Identifier legibility gate. A file that uses the Loom's short ids must either expand the
// first use of each family or link the glossary. Ids are never renamed — this gate only
// asks that a newcomer meeting one can find out what it means.
//
//   node scripts/id-legibility-check.mjs [--json]
//
// Pure Node, zero deps.
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const GATE_NAMES = {
  D1: 'Problem framing', D2: 'Evidence', D3: 'Scope & stakeholders',
  D4: 'No-solutioning boundary', D5: 'Synthesis integrity',
  D6: 'Data-governance feasibility', D7: 'Brand conformance',
  D8: 'Tangibility', D9: 'Validation loop',
};

const GLOSSARY = /glossary\.md/;
// A floor decision id: D<n>.<n>. Must carry the word "Decision" so it cannot be misread as a
// discovery gate. DR-* is a register id and is excluded.
const FLOOR_DECISION = /(?<!DR-)(?<!Decision )\bD(\d)\.(\d)\b/g;
// The negative lookahead matters: without it, "Decision D5.4" matches as gate "D5" (the word
// boundary holds before the dot) and a correctly-written floor decision id gets reported as a
// bare gate id. Verified against the string "Per Decision D5.4 the form is routed."
const GATE_ID = /\bD([1-9])\b(?!\.\d)/;

export function checkFile(path, text) {
  const issues = [];
  for (const m of text.matchAll(FLOOR_DECISION)) {
    issues.push(`${path}: floor decision id "D${m[1]}.${m[2]}" must be written "Decision D${m[1]}.${m[2]}" — bare, it reads as discovery gate D${m[1]}`);
  }
  if (GLOSSARY.test(text)) return issues;      // the file tells the reader where to look
  const first = text.match(GATE_ID);
  if (!first) return issues;
  const id = `D${first[1]}`;
  const line = text.slice(0, first.index).split('\n').length;
  const context = text.slice(first.index, first.index + 120);
  if (!context.includes(GATE_NAMES[id])) {
    issues.push(`${path}:${line}: first use of ${id} is bare — write "${id} (${GATE_NAMES[id]})" or link references/glossary.md`);
  }
  return issues;
}

function main(argv) {
  const json = argv.includes('--json');
  const files = execSync('git ls-files "*.md"', { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  const issues = files.flatMap((f) => checkFile(f, readFileSync(f, 'utf8')));
  if (json) console.log(JSON.stringify({ ok: issues.length === 0, issues }, null, 2));
  else {
    console.log('\nIdentifier legibility gate\n');
    for (const i of issues) console.log(`  - ${i}`);
    console.log(`\n${issues.length ? `BLOCKED — ${issues.length} issue(s)` : 'OK — every id is findable'}\n`);
  }
  process.exit(issues.length ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv);
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd plugins/middleleap-loom/skills/loom-adopt/harness && node --test scripts/id-legibility-check.test.mjs`
Expected: `pass 6`, `fail 0`.

- [ ] **Step 5: Run the gate across the real tree**

Run: `cd plugins/middleleap-loom && node skills/loom-adopt/harness/scripts/id-legibility-check.mjs`

Expected after Tasks 1–4: `OK — every id is findable`.

If it reports issues, they are real — fix the named files by expanding the first use or
adding a glossary link. **Do not weaken the gate to make it pass.**

- [ ] **Step 6: Register the gate in CI and the control catalogue**

Correction to an earlier assumption: `ci/ci.yml` does **not** glob the scripts — it names
each gate explicitly, and `ci-catalog-check.mjs` verifies that every gate named in `ci.yml`
has an entry in `governance/control-catalog.template.json`. Verified 2026-07-28: 9 gates in
`ci.yml`, all present in the catalogue. So both files need an entry, in this order.

First add the step to `ci/ci.yml`, alongside the other gate invocations:

```yaml
      - name: ID legibility
        run: node scripts/id-legibility-check.mjs
```

Then add the matching entry to `governance/control-catalog.template.json`, mirroring the
shape of the existing `DOC-INTEGRITY` entry (read that entry first and copy its field set
exactly — the catalogue schema is validated by `control-catalog-check.mjs`).

Run:
```bash
cd plugins/middleleap-loom/skills/loom-adopt/harness
node scripts/ci-catalog-check.mjs
node scripts/control-catalog-check.mjs
```
Expected: both `OK`. `ci-catalog-check` should now report 10 gates.

- [ ] **Step 7: Commit**

```bash
git add -A -- plugins/middleleap-loom
git commit -m "loom: gate that identifiers stay findable

A markdown file using the short ids must expand the first use of each
family or link the glossary, and a floor decision id must carry the
word Decision. Fails closed so the expansions cannot decay.

6 tests, verified red before the implementation."
```

---

### Task 6: Release

**Files:**
- Modify: `plugins/middleleap-loom/.claude-plugin/plugin.json`
- Modify: `.claude-plugin/marketplace.json`

- [ ] **Step 1: Bump the version in both files**

`2.0.0-rc.31` → `2.0.0-rc.32`, in `plugin.json` and in the `middleleap-loom` entry of
`marketplace.json`. Both, or existing users never receive the change.

- [ ] **Step 2: Validate the marketplace**

Run: `node scripts/validate-marketplace.mjs`
Expected: `Marketplace OK.`

- [ ] **Step 3: Full verification**

```bash
node scripts/validate-marketplace.mjs
node --test scripts/validate-marketplace.test.mjs
cd plugins/middleleap-loom/skills/loom-adopt/harness
node --test discovery/gates/*.test.mjs discovery/render/*.test.mjs scripts/*.test.mjs core/*.test.mjs
node scripts/discovery-sync-check.mjs
```
Expected: `Marketplace OK.`, `fail 0` twice, `Discovery-sync gate — OK`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "loom: rc.32 — self-describing identifiers"
```

---

## What this plan deliberately does not do

- **Rename anything.** Considered and rejected: `D1`–`D9` and `Q1`–`Q5` appear in adopters'
  branch-protection required-status-checks and in the OFBO instantiation. Renaming means
  either breaking those or teaching the validator two names for one gate, and a gate that
  answers to two names is harder to trust than a terse one.
- **Expand every occurrence.** First use per file only. Expanding all 252 would bloat the
  prose, and the goal is comprehension, not ceremony.
- **Touch the validator's output format.** `[PASS] D1 Problem framing` is already correct.
- **Change `DR-*` or `CTRL-*`.** They already read clearly, which is the evidence that
  prefix-plus-number works when the prefix is more than one letter.
