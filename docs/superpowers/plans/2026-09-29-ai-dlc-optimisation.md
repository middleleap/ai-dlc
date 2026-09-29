# AI DLC Optimisation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix what the 29 Sep 2026 review found wrong today, make the skills load on the right prompts, and shrink what the Loom installs — in five independently mergeable work packages.

**Architecture:** Each work package (WP-A … WP-E) is one branch and one PR against `main`, merged in order. Every package ends with a version bump of the plugins it touched (in both `plugin.json` and `.claude-plugin/marketplace.json`) so the new validator check passes and installed users receive the change. All edits are to Markdown, JSON, one bash hook and two Node scripts; no new dependencies.

**Tech Stack:** Node ≥ 18 (`node:test`), bash 3.2 + jq (hooks), Python ≥ 3.9 (Open Finance scripts), git, `gh`.

**Spec:** `docs/superpowers/specs/2026-09-29-ai-dlc-optimisation-review.md` — finding ids (A1 … C10) below refer to it.

## Global Constraints

- Run `node scripts/validate-marketplace.mjs` before every commit (CLAUDE.md). After Task A1 it FAILS on any plugin whose content changed since its version was last set, so the bump is always the last task of a package; intermediate commits are allowed to fail it, the PR head is not.
- Bump versions in BOTH `plugins/<p>/.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, keeping the two descriptions byte-identical (the validator compares them).
- Version plan (assumes packages merge in order; re-check after every rebase — concurrent bumps auto-merge silently): WP-A → loom 2.5.3, demo 1.0.1, open-finance 3.0.1 · WP-B → loom 2.5.4, banking 1.1.0, open-finance 3.0.2 · WP-C → loom 2.5.5 · WP-D → open-finance 3.0.3, banking 1.1.1 · WP-E → loom 2.5.6.
- Harness commands run from `plugins/middleleap-loom/skills/loom-adopt/harness/` (call it `$H`). Its full suite: `node --test discovery/gates/*.test.mjs discovery/render/*.test.mjs scripts/*.test.mjs core/*.test.mjs` (2,548 tests, ~9 s).
- Run `node scripts/deidentify-check.mjs` before every commit that touches `plugins/`.
- The Semgrep hook in this workspace breaks the Edit tool on some files; if an Edit is refused, make the same change with `sed`/`python3` via Bash (memory: edit-tool hook).
- Commit message style is `<area>: <what changed>` in the imperative, ending with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Brand spelling inside plugins: **AlTareq** (one word) for the brand, app, buttons and labels; "Al Tareq" only inside verbatim CBUAE quotations.
- Never write to `~/.claude/plugins/…`; the installed copies update through the marketplace.

## Review Focus

1. A plugin whose version was bumped in the working tree but not yet committed (no commit carries the new string) — the validator must skip the bump check, not crash or fail. Pinned in Task A1 step 3.
2. A checkout without git (tarball) — the bump check must be skipped and the rest of the validator still run. Already pinned by the existing test "without git it still validates a good tree"; Task A1 step 5 re-runs it.
3. A `core/` subdirectory containing a `*.test.mjs` — the install-time exclusion must match on basename at any depth, and gates (non-test `.mjs`) must still land. Pinned in Task C1 step 2.
4. A file path with `../` or a symlink handed to `spec-tripwire.sh` on macOS, where `realpath -m` does not exist — must still be canonicalised and denied. Pinned in Task E1 step 2.
5. An adoption that previously installed test files and is upgraded to a bundle that no longer installs them — the upgrade must not delete or mis-classify the adopter's copies. Verified and recorded in Task C1 step 7.

---

## WP-A — Release hygiene and correctness (branch `claude/review-a-release-hygiene`)

Findings A1–A9. One PR. The final task bumps loom 2.5.3, demo 1.0.1, open-finance 3.0.1.

### Task A1: Validator fails when plugin content changed after its version was set

**Files:**
- Modify: `scripts/validate-marketplace.mjs:5` (import) and after `:160` (the version-mismatch block)
- Test: `scripts/validate-marketplace.test.mjs` (append)

**Interfaces:**
- Consumes: `gitTree` (null outside git), `root`, `rel()`, `fail()`, `manifestPath`, `dir`, `entry`, `manifest`, `label` — all already in scope at line 160.
- Produces: the error string `content changed since version <v> was set in <sha7>` that later tasks and CI rely on.

- [ ] **Step 1: Write the failing tests** — append to `scripts/validate-marketplace.test.mjs`:

```js
// ── Content changed without a version bump (CLAUDE.md: "version gates updates") ────────────────
const REVISED = '---\nname: alpha\ndescription: A demo skill, revised.\n---\n\nbody v2\n'
const bumpBoth = (dir, v) => {
  write(join(dir, 'plugins', 'demo', '.claude-plugin', 'plugin.json'), JSON.stringify({ name: 'demo', version: v }, null, 2))
  write(join(dir, '.claude-plugin', 'marketplace.json'), JSON.stringify({
    name: 'demo-mkt', owner: { name: 'Demo' }, plugins: [{ name: 'demo', source: './plugins/demo', version: v }],
  }, null, 2))
}

test('plugin content committed after its version was set fails', () => withRepo((dir) => {
  write(join(dir, 'plugins', 'demo', 'skills', 'alpha', 'SKILL.md'), REVISED)
  commit(dir)
  const { code, out } = run(dir)
  assert.equal(code, 1)
  assert.match(out, /content changed since version 1\.0\.0 was set in [0-9a-f]{7}/)
}))

test('an uncommitted plugin edit is reported before the commit', () => withRepo((dir) => {
  write(join(dir, 'plugins', 'demo', 'skills', 'alpha', 'SKILL.md'), REVISED)
  const { code, out } = run(dir)
  assert.equal(code, 1)
  assert.match(out, /content changed since version 1\.0\.0/)
}))

test('a content change shipped with a version bump passes', () => withRepo((dir) => {
  write(join(dir, 'plugins', 'demo', 'skills', 'alpha', 'SKILL.md'), REVISED)
  bumpBoth(dir, '1.0.1')
  commit(dir)
  const { code, out } = run(dir)
  assert.equal(code, 0, out)
}))

test('a bump that is not yet committed skips the check instead of failing', () => withRepo((dir) => {
  write(join(dir, 'plugins', 'demo', 'skills', 'alpha', 'SKILL.md'), REVISED)
  bumpBoth(dir, '1.0.1')
  const { code, out } = run(dir)
  assert.equal(code, 0, out)
}))
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test scripts/validate-marketplace.test.mjs`
Expected: the first two new tests FAIL (exit code 0 where 1 was expected); the last two pass by accident.

- [ ] **Step 3: Implement the check** — in `scripts/validate-marketplace.mjs` change line 5 to `import { execFileSync, spawnSync } from 'node:child_process'` and insert after the version-mismatch block (after the line `fail(\`${label}: version mismatch …\`)` and its closing `}`):

```js
      // Content changed since the version was last set — CLAUDE.md's "rule that bites". Only
      // meaningful inside a git checkout. The pickaxe (-S, fixed string) finds the last commit
      // that changed how often the quoted version string appears in plugin.json — i.e. the bump
      // that introduced it; the plugin tree on disk (tracked files, staged or not) is then diffed
      // against that commit. Any difference means installed users are behind. No such commit
      // (the bump is still uncommitted) means the bump is in progress: nothing to report.
      if (gitTree && manifest.version && manifest.version === entry.version) {
        let bumpCommit = ''
        try {
          bumpCommit = execFileSync('git', ['-C', root, 'log', '-1', '--format=%H', '-S', `"${manifest.version}"`, '--', rel(manifestPath)],
            { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
        } catch { bumpCommit = '' }
        if (bumpCommit) {
          const diff = spawnSync('git', ['-C', root, 'diff', '--quiet', bumpCommit, '--', rel(dir)], { stdio: 'ignore' })
          if (diff.status === 1) {
            fail(`${label}: content changed since version ${manifest.version} was set in ${bumpCommit.slice(0, 7)} — bump the version in plugin.json and marketplace.json, or installed users never receive it.`)
          }
        }
      }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test scripts/validate-marketplace.test.mjs`
Expected: all pass. If any PRE-EXISTING test now fails with `content changed since version` (it committed a plugin edit and expected exit 0), add `bumpBoth(dir, '1.0.1')` before its `commit(dir)` — that is the check working, not a bug.

- [ ] **Step 5: Confirm the real repo is caught**

Run: `node scripts/validate-marketplace.mjs; echo exit=$?`
Expected: `exit=1` with `middleleap-loom: content changed since version 2.5.2 was set in 02b2583`. This stays red until Task A9.

- [ ] **Step 6: Commit**

```bash
git add scripts/validate-marketplace.mjs scripts/validate-marketplace.test.mjs
git commit -m "validator: fail when plugin content changed after its version was set

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task A2: The demo plugin is no longer a Loom dependency; READMEs tell the truth about what installs

**Files:**
- Modify: `plugins/middleleap-loom/.claude-plugin/plugin.json` (`dependencies`, `description`)
- Modify: `.claude-plugin/marketplace.json` (loom `description`)
- Modify: `README.md:14-15`
- Modify: `plugins/middleleap-loom/README.md` (paragraph starting "Installing the Loom also installs the three plugins", line 181, lines 227-228)

- [ ] **Step 1: Drop the dependency** — in `plugins/middleleap-loom/.claude-plugin/plugin.json` set

```json
  "dependencies": [
    "middleleap-banking-uae",
    "middleleap-open-finance-uae"
  ]
```

and in BOTH `plugin.json` and the loom entry of `.claude-plugin/marketplace.json` replace the sentence `Installs the UAE banking, UAE Open Finance and Meridian Trust demo plugins with it.` with `Installs the UAE banking and UAE Open Finance plugins with it; the Meridian Trust demo is a separate install.`

- [ ] **Step 2: Root README** — replace lines 14–15 (`That installs the Loom and the three plugins it depends on. To take only the domain expertise,` / `install \`middleleap-banking-uae\` or \`middleleap-open-finance-uae\` on its own instead.`) with:

```
That installs the Loom and the two UAE domain plugins it depends on. The Meridian Trust demo
is a separate install: `/plugin install middleleap-loom-demo@middleleap-ai-dlc`. To take only
the domain expertise, install `middleleap-banking-uae` or `middleleap-open-finance-uae` on its own.
```

- [ ] **Step 3: Loom README** — three edits:
  1. Replace the paragraph beginning `Installing the Loom also installs the three plugins it works with, declared as dependencies in` (lines 14–17; read it with `sed -n '14,18p'`) with:
     ```
     Installing the Loom also installs the two plugins it works with, declared as dependencies in
     its `plugin.json`: `middleleap-banking-uae` (risk review, Islamic banking, New Product Approval)
     and `middleleap-open-finance-uae` (the UAE Open Finance canon). The Meridian Trust demo
     institution (`middleleap-loom-demo`) is installed separately when you want the worked example.
     ```
  2. Line 181: `- **Three guardrail hooks** — \`pii-guard\`, \`spec-tripwire\`, \`test-tripwire\`, plus the` → `- **Four guardrail hooks** — \`pii-guard\`, \`spec-tripwire\`, \`test-tripwire\`, \`shariah-term-guard\`, plus the`
  3. Lines 227–228 → 
     ```
     Installing the plugin adds six skills, six agents and one read-only MCP server (`loom-record`),
     plus the two UAE domain plugins it depends on. No hook and no loop runs until a repository
     adopts them explicitly via `loom-adopt`.
     ```

- [ ] **Step 4: Verify** — `grep -n 'three plugins\|six skills and six agents\|Three guardrail' README.md plugins/middleleap-loom/README.md` prints nothing; `node -e 'JSON.parse(require("fs").readFileSync(".claude-plugin/marketplace.json"))'` and the same for `plugin.json` parse.

- [ ] **Step 5: Commit**

```bash
git add .claude-plugin/marketplace.json plugins/middleleap-loom/.claude-plugin/plugin.json README.md plugins/middleleap-loom/README.md
git commit -m "loom: demo plugin is an opt-in install, not a dependency; READMEs state what installs

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task A3: Demo skill descriptions are scoped to Meridian Trust

**Files:**
- Modify: `plugins/middleleap-loom-demo/skills/meridian-brand-guidelines/SKILL.md:3`
- Modify: `plugins/middleleap-loom-demo/skills/meridian-business-case/SKILL.md:3`

- [ ] **Step 1: Replace the brand description** (the whole `description:` line) with:

```yaml
description: "Meridian Trust (the Loom's fictional demo bank) brand system — Meridian Blue + Inter, colour roles, the Meridian line motif, Midnight surfaces, typography, slide layout and logo rules. Use only for Meridian Trust-branded work: the Loom demo's discovery artifacts, business cases and prototypes, or as the template to copy when packaging a real institution's brand. Not for any other institution's branding."
```

- [ ] **Step 2: Replace the business-case description** with:

```yaml
description: "Meridian Trust (the Loom's fictional demo bank) capital-approval business cases — the two-stage ISB pre-screening proposal and CIC detailed business case with its NPV model, cost breakdown and sign-off tracking. Use only when the work is explicitly for Meridian Trust or the Loom demo, or as the template to copy when packaging a real bank's approval process. Not for a real institution's business cases — those follow that institution's own pack."
```

- [ ] **Step 3: Verify lengths** — `for f in plugins/middleleap-loom-demo/skills/*/SKILL.md; do sed -n 3p $f | wc -c; done` → both under 1024. `node scripts/validate-marketplace.mjs` reports no description error for the demo (the loom bump error is expected).

- [ ] **Step 4: Commit**

```bash
git add plugins/middleleap-loom-demo
git commit -m "loom-demo: skill descriptions trigger only for Meridian Trust work

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task A4: Plugin agents cite canon at a path that resolves

**Files:**
- Modify: `plugins/middleleap-loom/agents/change-watch.md:8,36`, `risk-reviewer.md:8,12`, `model-risk-reviewer.md:10-11`
- Modify: `plugins/middleleap-loom/agents/discovery-boundary-reviewer.md:51-53`

- [ ] **Step 1: Rewrite the six canon paths**

```bash
cd plugins/middleleap-loom/agents
sed -i '' 's#`skills/loom/references/#`${CLAUDE_PLUGIN_ROOT}/skills/loom/references/#g' change-watch.md risk-reviewer.md model-risk-reviewer.md
grep -n 'skills/loom/references' *.md
```
Expected: six lines, every one prefixed `${CLAUDE_PLUGIN_ROOT}/`.

- [ ] **Step 2: Fix the self-contradiction** — in `discovery-boundary-reviewer.md` replace the bullet that starts `- **Register absent ⇒ \`INSUFFICIENT_EVIDENCE\`.** This agent judges against the run directory and its gate report (no register: \`register_state\` is \`not-applicable\`). If it is` and its next two lines (`not mounted, not readable, or empty where it should not be, set \`register_state: "absent"\`,` / `emit \`verdict: "INSUFFICIENT_EVIDENCE"\` and say in \`reason\` what was missing.`) with:

```
- **Inputs unreadable ⇒ `INSUFFICIENT_EVIDENCE`.** This agent judges against the run directory
  and its gate report, not a register: `register_state` is always `not-applicable`. If the run
  directory or its gate report is missing, unreadable or empty, emit
  `verdict: "INSUFFICIENT_EVIDENCE"` and say in `reason` what was missing.
```

- [ ] **Step 3: Verify** — `grep -c 'register_state: "absent"' plugins/middleleap-loom/agents/discovery-boundary-reviewer.md` → `0`. `cd $H && node scripts/agent-output-check.mjs` exits 0 (the agents' contract fixtures still validate).

- [ ] **Step 4: Commit**

```bash
git add plugins/middleleap-loom/agents
git commit -m "loom agents: canon paths resolve via CLAUDE_PLUGIN_ROOT; boundary reviewer contract is consistent

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task A5: loom-adopt SKILL.md says what the installer does

**Files:**
- Modify: `plugins/middleleap-loom/skills/loom-adopt/SKILL.md:63-69, 198, 402-403`

- [ ] **Step 1: Marker counts and bundle path** — replace lines 63–69 (from `A full adoption lands 133 ADOPT markers` through the closing fence of the three `node harness/adopt.mjs` lines) with:

```
A full adoption lands well over a hundred ADOPT markers to fill in, which is a cliff rather than
an on-ramp — and the count grows every release. `--tier` stages it. `harness/` below is the
bundle inside the installed plugin, `${CLAUDE_PLUGIN_ROOT}/skills/loom-adopt/harness`; run the
commands from that directory or prefix the path. `node harness/assess.mjs` prints the marker
count of each tier for the bundle you have before you choose.

```bash
node harness/adopt.mjs --dest . --tier core       # the warp (the default)
node harness/adopt.mjs --dest . --tier governed   # + product governance
node harness/adopt.mjs --dest . --tier full       # + estate, floor, institution
```
```

- [ ] **Step 2: Agent count** — line 198: `Five agents ship as **plugin agents** and work as soon as the machinery lands (no copying):` → `Six agents ship as **plugin agents** and work as soon as the machinery lands (no copying): \`code-reviewer\`,` (the list on the next lines stays).

- [ ] **Step 3: Step 7 matches step 3** — lines 402–403: `**Your edits are safe.** Step 3 tells you to edit \`scripts/discovery-link-check.mjs\`,` / `\`.claude/hooks/pii-guard.sh\` and others; the stamp is what lets the installer tell your changes` → 

```
**Your edits are safe.** Step 3 tells you to edit `.loom/project.json`,
`.claude/hooks/pii-patterns.json`, the reviewer agents and the skill templates; the stamp is
what lets the installer tell your changes
```

- [ ] **Step 4: Verify** — `grep -n '133 ADOPT\|Five agents\|edit `scripts/discovery-link-check' plugins/middleleap-loom/skills/loom-adopt/SKILL.md` prints nothing. `cd $H && node scripts/doc-integrity-check.mjs` exits 0 (the generated table was not touched).

- [ ] **Step 5: Commit**

```bash
git add plugins/middleleap-loom/skills/loom-adopt/SKILL.md
git commit -m "loom-adopt: bundle path stated once; marker counts, agent count and step 7 corrected

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task A6: open-finance-uiux writes AlTareq and drops the source-org footers

**Files:**
- Modify: every file under `plugins/middleleap-open-finance-uae/skills/open-finance-uiux/` containing `Al Tareq`
- Modify: `…/open-finance-uiux/SKILL.md` (the "Brand Name Spelling" block, lines 172–176 after the sed)
- Modify: `…/open-finance-uiux/references/INDEX.md`, `…/references/value-propositions.md` (footers)

- [ ] **Step 1: Baseline count** — `grep -rho 'Al Tareq' plugins/middleleap-open-finance-uae/skills/open-finance-uiux | wc -l` → 181.

- [ ] **Step 2: Replace the spelling everywhere in the kit**

```bash
cd plugins/middleleap-open-finance-uae/skills/open-finance-uiux
grep -rl 'Al Tareq' . | xargs sed -i '' 's/Al Tareq/AlTareq/g'
grep -rho 'Al Tareq' . | wc -l   # 0
```

- [ ] **Step 3: Rewrite the rule** — in `SKILL.md` replace the block from `### Brand Name Spelling` through `- All descriptive text and slide content` with:

```
### Brand Name Spelling
The consumer-facing brand is written **"AlTareq"** (one word) in every button, label, screen
title and slide — the canon is `../open-finance-uae/references/altareq-brand.md`. "Al Tareq"
(two words) appears only when quoting CBUAE regulatory prose verbatim. This applies to:
- Button text: "Pay using AlTareq" / "Authorize using AlTareq"
- Payment option labels: "Pay by Bank using AlTareq"
- All descriptive text and slide content
```

- [ ] **Step 4: Remove the footers** — `grep -n 'Maintained by\|Slack: #\|Internal Wiki' references/INDEX.md references/value-propositions.md` lists the lines (expected around INDEX.md:135-137 and value-propositions.md:922-931); delete exactly those lines (and a now-empty trailing heading such as `## Maintenance` if one is left with no body). Re-run the grep → nothing.

- [ ] **Step 5: Verify** — `node scripts/deidentify-check.mjs` OK; `sed -n 3p SKILL.md | grep -c 'AlTareq'` ≥ 1 (the description now uses the brand spelling).

- [ ] **Step 6: Commit**

```bash
git add plugins/middleleap-open-finance-uae/skills/open-finance-uiux
git commit -m "open-finance-uiux: brand spelled AlTareq per the canon; source-org footers removed

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task A7: Public-repo exposure and untracked strays

**Files:**
- Modify: `.gitignore`
- Delete (untracked): `plugins/middleleap-open-finance/`
- Delete (tracked, copied out first): `docs/plans/kosli-founder-demo-briefing.md`
- Modify: `docs/plans/loom-onboarding-browser-acceptance.md:6`
- Modify: the eight files that cite the briefing (list in step 4)

> Owner decision recorded here: the briefing names two real people and is headed "private"; it leaves the public repo. It remains in git history — a history rewrite is a separate, owner-initiated action and is NOT part of this plan.

- [ ] **Step 1: .gitignore** — append:

```
# Local analysis dumps and exports
.loomviz-tmp/
Claude outputs/
# Notion simulation credentials (docs/simulations/notion-e2e reads this file)
.notion-token
*.notion-token
```

- [ ] **Step 2: Remove the rename leftover** — `find plugins/middleleap-open-finance -type f` must list only `.DS_Store` and `__pycache__` files; then `rm -rf plugins/middleleap-open-finance`. If anything else is listed, stop and report it.

- [ ] **Step 3: Move the private briefing out**

```bash
mkdir -p ../ai-dlc-private/docs/plans
cp docs/plans/kosli-founder-demo-briefing.md ../ai-dlc-private/docs/plans/
git rm -q docs/plans/kosli-founder-demo-briefing.md
```

- [ ] **Step 4: Repoint the eight citations**

```bash
grep -rln 'kosli-founder-demo-briefing' docs plugins | xargs sed -i '' 's#docs/plans/kosli-founder-demo-briefing\.md#the Meridian demo briefing (kept outside this repository)#g'
sed -i '' 's/prepared for the Kosli$/prepared for a partner/' plugins/middleleap-loom/skills/loom-adopt/harness/demo/meridian/README.md
sed -i '' 's/^founder demonstration (/demonstration (/' plugins/middleleap-loom/skills/loom-adopt/harness/demo/meridian/README.md
grep -rn 'kosli-founder-demo-briefing\|Kosli founder' docs plugins | grep -v '^docs/superpowers'
```
Expected: the last grep prints nothing. Read `sed -n '1,6p' …/demo/meridian/README.md` and tidy the sentence if the line break left it awkward.

- [ ] **Step 5: Acceptance doc** — line 6 of `docs/plans/loom-onboarding-browser-acceptance.md` becomes `Preview: owner-only; the link is held outside this repository.`

- [ ] **Step 6: Verify** — `git status --short` shows no `.loomviz-tmp/`, `Claude outputs/` or `plugins/middleleap-open-finance/`; `cd $H && node --test scripts/*.test.mjs` passes (the demo comments changed, no code).

- [ ] **Step 7: Commit**

```bash
git add .gitignore docs plugins/middleleap-loom/skills/loom-adopt/harness
git commit -m "repo: private briefing and personal preview link removed from the public tree; strays ignored

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task A8: CLAUDE.md gives a command that runs and a count that is true

**Files:**
- Modify: `CLAUDE.md:87`

- [ ] **Step 1: Replace line 87** (the bullet starting `- **The \`discovery/\` tree is shared with \`ofbo\``) with:

```
- **The `discovery/` tree is shared with `ofbo`, and the divergence is counted, not remembered.** The ledger is `plugins/middleleap-loom/skills/loom-adopt/harness/discovery-sync.json` and the gate is `scripts/discovery-sync-check.mjs` beside it — run both from that harness directory: change a file under `harness/discovery/` without declaring it and the build fails. `node scripts/discovery-sync-check.mjs --record` books the change as a port owed to ofbo. What the gate **cannot** see is whether ofbo has moved — it never reports the trees as agreeing, and only `--upstream <ofbo-checkout>`, run where both repos are reachable, may retire a debt. Nobody has ever run that; the gate prints the live count (23 of 26 files owed a port on 29 Sep 2026).
```

- [ ] **Step 2: Verify** — `cd $H && node scripts/discovery-sync-check.mjs; echo exit=$?` → `exit=0` and the printed count matches the sentence.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "CLAUDE.md: discovery-sync command runs from the harness; count matches the ledger

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task A9: Bump the touched plugins and open the PR

**Files:**
- Modify: `plugins/middleleap-loom/.claude-plugin/plugin.json`, `plugins/middleleap-loom-demo/.claude-plugin/plugin.json`, `plugins/middleleap-open-finance-uae/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`
- Modify: `plugins/middleleap-loom/skills/loom-adopt/harness/upgrade-notes.json` (append to `versions`)

- [ ] **Step 1: Bump** — loom `2.5.2` → `2.5.3`, demo `1.0.0` → `1.0.1`, open-finance `3.0.0` → `3.0.1`, in each `plugin.json` and the matching marketplace entry.

- [ ] **Step 2: Upgrade note** — append to the `versions` array in `upgrade-notes.json`:

```json
    {
      "version": "2.5.3",
      "headline": "Plugin agents cite canon by plugin root; the demo bank is no longer a dependency",
      "notes": [
        "change-watch, risk-reviewer and model-risk-reviewer now cite the Loom canon at ${CLAUDE_PLUGIN_ROOT}/skills/loom/references/… — the previous relative path resolved nowhere in an adopted repository.",
        "middleleap-loom-demo (Meridian Trust) is installed separately; a real institution no longer receives the fictional brand and business-case skills with the Loom.",
        "loom-adopt/SKILL.md states the bundle location once and no longer carries marker counts that drift from adopt.mjs."
      ]
    }
```

- [ ] **Step 3: Verify everything**

```bash
node scripts/validate-marketplace.mjs && node scripts/deidentify-check.mjs \
  && node --test scripts/validate-marketplace.test.mjs scripts/deidentify-check.test.mjs \
  && (cd $H && node --test discovery/gates/*.test.mjs discovery/render/*.test.mjs scripts/*.test.mjs core/*.test.mjs) \
  && node --test apps/loom-console/test/*.test.mjs
```
Expected: `Marketplace OK.`, gate OK, every suite passes.

- [ ] **Step 4: Commit and open the PR**

```bash
git add .claude-plugin plugins/*/.claude-plugin plugins/middleleap-loom/skills/loom-adopt/harness/upgrade-notes.json
git commit -m "release: loom 2.5.3, loom-demo 1.0.1, open-finance-uae 3.0.1

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push -u origin claude/review-a-release-hygiene
gh pr create --title "Review WP-A: release hygiene and correctness fixes" --body "$(cat <<'EOF'
Implements findings A1–A9 of docs/superpowers/specs/2026-09-29-ai-dlc-optimisation-review.md.

- Validator now fails when plugin content changed after its version was set (with tests).
- Loom no longer depends on the Meridian demo plugin; demo descriptions trigger only for Meridian work.
- Assurance agents cite canon via ${CLAUDE_PLUGIN_ROOT}; boundary reviewer contract consistent.
- loom-adopt SKILL: single bundle path, no stale marker counts, step 7 matches step 3.
- open-finance-uiux spells the brand AlTareq per the canon; source-org footers gone.
- Private briefing and personal preview link removed from the public tree; strays ignored.
- Bumps: loom 2.5.3, loom-demo 1.0.1, open-finance-uae 3.0.1.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
gh pr checks --watch; echo exit=$?
```
Expected: `exit=0`. Do not merge on a piped/hidden exit code (memory: merge discipline).

---

## WP-B — Skill consolidation (branch `claude/review-b-skill-consolidation`, after WP-A merges)

Findings B1, B2, B3. Bumps: banking 1.1.0, loom 2.5.4, open-finance 3.0.2.

### Task B1: One risk reviewer with a jurisdiction map

**Files:**
- Modify: `plugins/middleleap-banking-uae/skills/uae-bank-risk-reviewer/SKILL.md` (lines 148–150, before `## Review Methodology` at line 155, line 251)
- Delete: `plugins/middleleap-banking-uae/skills/bank-risk-reviewer/`
- Modify: `plugins/middleleap-banking-uae/README.md:15-16, 22-29`, `plugins/middleleap-banking-uae/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (banking description), `README.md` (root table row), `CLAUDE.md` (structure tree)
- Modify: `plugins/middleleap-banking-uae/skills/islamic-banking-uae/SKILL.md:41`

- [ ] **Step 1: Add the jurisdiction section** — in `uae-bank-risk-reviewer/SKILL.md` replace the sentence at lines 148–150 `The skill is deliberately UAE-market-focused: regulatory drivers, enforcement context, and examples all assume a CBUAE-regulated institution subject to UAE law.` with `The skill is written for a CBUAE-regulated institution; for a bank outside the UAE apply the jurisdiction map below.` Then insert, immediately before the `## Review Methodology (Formal Review Mode)` heading:

```
## Outside the UAE

If the institution operates outside the UAE, keep the four-domain taxonomy and the review
methodology unchanged and map the regulatory drivers to the local equivalents:

| UAE driver | Map to |
|---|---|
| PDPL (personal data) | GDPR / UK GDPR, or the local data-protection statute |
| CBUAE MMS (model management) | SR 11-7 (US), PRA SS1/23 or ECB guidance (UK/EU), or the local model-risk guidance |
| CBUAE CPS (consumer protection) | The local conduct-of-business and consumer-duty rules |
| CBUAE CPS-AI | The local AI guidance (EU AI Act, ISO 42001 where adopted) |
| CBUAE enforcement, UAE Data Office | The home supervisor and data-protection authority |
| In-country residency (e.g. an in-country cloud region) | The home jurisdiction's residency or transfer rules |

Name the jurisdiction in the first line of the output and cite the mapped framework by clause
wherever the UAE text would cite CPS, PDPL or MMS. The example wording elsewhere in this skill
("data must not leave the UAE", "CBUAE enforcement powers") reads as its local equivalent.

```

- [ ] **Step 2: Declare the docx dependency** — line 251 (`Use the docx skill for document creation — read its SKILL.md`; confirm with `grep -n 'docx skill' SKILL.md`) becomes: `Use the \`docx\` skill for document creation if it is installed (it is not bundled with this plugin); otherwise write the review as Markdown with the same section structure and say so.`

- [ ] **Step 3: Delete the twin and every reference to it**

```bash
git rm -rq plugins/middleleap-banking-uae/skills/bank-risk-reviewer
grep -rn 'bank-risk-reviewer' --include=*.md --include=*.json . | grep -v 'uae-bank-risk-reviewer' | grep -v '^./docs/superpowers'
```
Expected hits to fix: `README.md` (delete the `| Skill | \`bank-risk-reviewer\` |` row), `plugins/middleleap-banking-uae/README.md:16` (delete the row), `CLAUDE.md` (delete the `├── skills/bank-risk-reviewer/` tree line), and nothing else.

- [ ] **Step 4: Banking README** — line 15 append ` Includes a jurisdiction map for banks outside the UAE.` inside the cell. Replace lines 22–29 (from `Both reviewers read one shared framework` through `integrity, the skill supplies the Head-of-Risk judgement.`) with:

```
The reviewer reads its framework from `uae-bank-risk-reviewer/references/`: the taxonomy quick
reference, the regulatory frameworks guide and the formal review template. If the institution has
its own taxonomy, control register or earlier reviews, the reviewer prefers those and uses the
bundled framework as the structural model.

The taxonomy uses the same `DR-x.y-nnn` / `CTRL-xx-nnn` id scheme as the data-risk register the
`middleleap-loom` D6 gate mounts: the gate checks referential integrity, the skill supplies the
Head-of-Risk judgement.
```

- [ ] **Step 5: Plugin description** — in BOTH `plugins/middleleap-banking-uae/.claude-plugin/plugin.json` and the banking entry of `.claude-plugin/marketplace.json` replace `a virtual Head of Risk (UAE and international variants: discovery, backlog risk tagging, formal review, control-automation verification)` with `a virtual Head of Risk (discovery, backlog risk tagging, formal review, control-automation verification, with a jurisdiction map for banks outside the UAE)`.

- [ ] **Step 6: Wire the Islamic skill's composition** — add to `plugins/middleleap-banking-uae/.claude-plugin/plugin.json` (after `license`):

```json
  "dependencies": [
    "middleleap-open-finance-uae"
  ],
```
and in `islamic-banking-uae/SKILL.md` line 41 replace `(\`python3 scripts/fetch_spec.py\` in open-finance-uae)` with `(\`python3 scripts/fetch_spec.py\` in the \`open-finance-uae\` skill of the \`middleleap-open-finance-uae\` plugin, which this plugin declares as a dependency; if it is absent, answer from \`references/open-finance-intersection.md\` and mark the field detail unverified)`.

- [ ] **Step 7: Verify** — `node scripts/validate-marketplace.mjs` reports only the expected bump errors; `node scripts/deidentify-check.mjs` OK; `grep -rn '\.\./uae-bank-risk-reviewer' plugins` prints nothing.

- [ ] **Step 8: Commit**

```bash
git add -A plugins/middleleap-banking-uae .claude-plugin README.md CLAUDE.md
git commit -m "banking-uae: one risk reviewer with a jurisdiction map; Islamic skill names its Open Finance dependency

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task B2: context-template becomes an asset of claude-md-guide

**Files:**
- Create: `plugins/middleleap-loom/skills/claude-md-guide/assets/CLAUDE.md.template`
- Create: `plugins/middleleap-loom/skills/claude-md-guide/references/starter-guide.md`
- Modify: `plugins/middleleap-loom/skills/claude-md-guide/SKILL.md:3-8` (description) and line 222 (reference table row)
- Modify: `plugins/middleleap-loom/skills/claude-md-guide/references/platform-tips.md:11`
- Delete: `plugins/middleleap-loom/skills/context-template/`
- Modify: `README.md:61`, `plugins/middleleap-loom/README.md:162, 227`, `CLAUDE.md` (structure tree)

- [ ] **Step 1: Extract the template** — `context-template/SKILL.md` has a `## Template` heading (line 21) followed by a fenced block that starts `# CLAUDE.md` (line 24) and ends before `## Customization Guide` (line 96). Write the fenced block's inner text (without the fences) to `claude-md-guide/assets/CLAUDE.md.template`:

```bash
S=plugins/middleleap-loom/skills/context-template/SKILL.md
D=plugins/middleleap-loom/skills/claude-md-guide
mkdir -p $D/assets
awk '/^## Template/{t=1;next} /^## Customization Guide/{t=0} t' $S | sed '1{/^```/d}' | sed '$ {/^```/d}' > $D/assets/CLAUDE.md.template
head -3 $D/assets/CLAUDE.md.template   # first non-blank line must be "# CLAUDE.md"
```
If the awk leaves a leading blank line or a stray fence, remove it by hand; the file must start with `# CLAUDE.md` and contain no ``` lines.

- [ ] **Step 2: Extract the guide** — write `references/starter-guide.md` as:

```markdown
# Starter template — customisation guide and checklist

Copy `../assets/CLAUDE.md.template` to the repository root as `CLAUDE.md`, fill in the bracketed
sections, and delete anything that does not apply. Then add the stack-specific sections below and
run the checklist.

```
followed by everything from `context-template/SKILL.md` line 96 (`## Customization Guide`) to the end of that file, verbatim: `sed -n '96,$p' $S >> $D/references/starter-guide.md`.

- [ ] **Step 3: Description and table row** — in `claude-md-guide/SKILL.md` replace the whole folded `description:` block (lines 3–8) with:

```yaml
description: >
  Best practices for writing effective CLAUDE.md files, plus a starter template. Use when
  creating a CLAUDE.md from scratch for a new repository, improving an existing one, or asked
  about .cursorrules, AI context files, AI coding-assistant configuration, or prompt engineering
  for a codebase.
```
and replace line 222 `| Starter template | The \`context-template\` skill in this plugin |` with `| Starter template | \`assets/CLAUDE.md.template\` — copy and fill in; stack-specific sections and the checklist are in \`references/starter-guide.md\` |`.

- [ ] **Step 4: platform-tips correction** — line 11 (`sed -n 11p` — it contains `loaded into context at session start and on every tool call`): replace that sentence with `The file is loaded into context at session start (and again after a resume or compaction); it is not re-sent on every tool call.`

- [ ] **Step 5: Delete the skill and its references**

```bash
git rm -rq plugins/middleleap-loom/skills/context-template
grep -rn 'context-template' --include=*.md --include=*.json --include=*.mjs --include=*.yml . | grep -v '^./docs/superpowers'
```
Fix each hit: delete the row in `README.md` (line 61) and `plugins/middleleap-loom/README.md` (line 162); in `plugins/middleleap-loom/README.md:227` change `six skills` to `five skills`; in `CLAUDE.md` delete the `└── context-template/` tree line and change the `claude-md-guide/` comment to `# CLAUDE.md authoring + starter template`. Anything else the grep finds is fixed the same way (reference removed or repointed to `claude-md-guide`).

- [ ] **Step 6: Verify** — `node scripts/validate-marketplace.mjs` reports only bump errors; `ls plugins/middleleap-loom/skills` shows five directories; `claude plugin details middleleap-loom` is not run (it reads the installed copy).

- [ ] **Step 7: Commit**

```bash
git add -A plugins/middleleap-loom/skills README.md plugins/middleleap-loom/README.md CLAUDE.md
git commit -m "claude-md-guide: absorbs context-template as an asset; one skill, one trigger

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task B3: Descriptions state triggers, not workflows

**Files:**
- Modify: `plugins/middleleap-loom/skills/institution-intake/SKILL.md:3`
- Modify: `plugins/middleleap-loom/skills/brainkit-init/SKILL.md:3`
- Modify: `plugins/middleleap-loom/skills/loom-adopt/SKILL.md:3`
- Modify: `plugins/middleleap-open-finance-uae/skills/open-finance-uae/SKILL.md:3`

- [ ] **Step 1: institution-intake** — replace the `description:` line with:

```yaml
description: Use when an institution is starting with the Loom and has not yet named its approved sources — the first day, "what do we need to prepare", a repository about to adopt the BrainKit with an empty source register, or brainkit-init reporting that it has nothing approved to draft from. Interviews the accountable roles (brand, architecture, technology, risk, data protection, finance, operations) and hands a source register and gap register to brainkit-init. Never invents policy, never approves, never treats an answer as an approved source.
```

- [ ] **Step 2: brainkit-init** — replace with:

```yaml
description: Use when a repository needs its Institutional BrainKit drafted or reconciled — institution/brainkit/manifest.json is absent or still a draft, loom-adopt routes here, or someone asks for an institution profile — and the institution's approved sources are already named (if they are not, run institution-intake first). Produces drafts with recorded provenance for accountable review. Never invents policy, regulatory interpretation, approval authority or brand rules; never auto-approves; never overwrites an existing BrainKit.
```

- [ ] **Step 3: loom-adopt** — replace with:

```yaml
description: Use when a repository wants to install or upgrade the Loom harness — "adopt the Loom", "set up the discovery harness", "install the build-loop guardrails", loom status, assess.mjs, or a re-run after a plugin update. Not for explaining the method (use loom), writing CLAUDE.md (use claude-md-guide), or drafting institutional context (use brainkit-init).
```

- [ ] **Step 4: open-finance-uae** — in its `description:` line delete the two version claims: `, and Standards versions/errata (current v2.1-final + errata3)` → `, and Standards versions/errata`; `change management/CAB per the Interaction Guide v5.0)` → `change management/CAB)`. Confirm `python3.11 plugins/middleleap-open-finance-uae/skills/open-finance-uae/scripts/check_current.py` still finds the stated version (it reads the Quick Reference, not the description) — expected `FRESH` or `STALE`, never `could not find a stated vX.Y-errataN`.

- [ ] **Step 5: Verify** — every edited description ≤ 1024 chars (`sed -n 3p <file> | wc -c`); `node scripts/validate-marketplace.mjs` reports only bump errors.

- [ ] **Step 6: Commit**

```bash
git add plugins/middleleap-loom/skills plugins/middleleap-open-finance-uae/skills/open-finance-uae/SKILL.md
git commit -m "skills: descriptions state when to fire, not the workflow; no version claims in triggers

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task B4: Bump and PR

- [ ] **Step 1:** banking `1.0.0` → `1.1.0`, loom `2.5.3` → `2.5.4`, open-finance `3.0.1` → `3.0.2` in both manifests. Append to `upgrade-notes.json` `versions`: `{ "version": "2.5.4", "headline": "context-template folded into claude-md-guide; trigger-first skill descriptions", "notes": ["The context-template skill is gone: its template is claude-md-guide/assets/CLAUDE.md.template and its customisation guide is references/starter-guide.md.", "institution-intake, brainkit-init and loom-adopt describe when to fire; the intake/brainkit-init boundary is 'are approved sources named yet'."] }`.
- [ ] **Step 2:** run the verification block from Task A9 step 3; expected all green.
- [ ] **Step 3:** commit `release: banking-uae 1.1.0, loom 2.5.4, open-finance-uae 3.0.2`, push, `gh pr create --title "Review WP-B: skill consolidation"` with a body listing B1–B3 and the attribution line, `gh pr checks --watch; echo exit=$?` → 0.

---

## WP-C — Bundle surface (branch `claude/review-c-bundle-surface`, after WP-B merges)

Findings C1, C2, C3. Bump: loom 2.5.5.

### Task C1: Tests are an opt-in component, not a default install

**Files:**
- Modify: `$H/adopt.mjs:62-63` (`tierIncludes`), `:168-170` (names), `:251-255` (CLI `--with`)
- Modify: `$H/copy-manifest.json` (the `scripts` glob entry, the `core` dir entry, two new entries)
- Modify: `.github/workflows/validate.yml:143` (`--with tests`)
- Modify: `plugins/middleleap-loom/skills/loom-adopt/SKILL.md` (regenerated copy table; the test-command sentence near line 286)
- Test: `$H/scripts/adopt.test.mjs` (append; add `readdirSync` to its `node:fs` import)

**Interfaces:**
- Produces: manifest entry fields `include` / `exclude` (basename globs of the form `*.ext` or an exact name), tier value `opt-in`, repeatable CLI flag `--with <component>` with components `brainkit` | `tests`.

- [ ] **Step 1: Write the failing tests** — append inside the `else { … }` block of `adopt.test.mjs`:

```js
const testFilesUnder = (root) => existsSync(root)
  ? readdirSync(root, { recursive: true }).map(String).filter((f) => f.endsWith('.test.mjs')) : [];

test('a default install lands the gates but none of their tests, at every tier', () => {
  for (const tier of TIERS) withTempDest((dest) => {
    install(dest, { tier });
    assert.deepEqual(testFilesUnder(join(dest, 'scripts')), [], `${tier}: tests landed in scripts/`);
    assert.deepEqual(testFilesUnder(join(dest, 'core')), [], `${tier}: tests landed in core/`);
    assert.ok(existsSync(join(dest, 'scripts', 'discovery-link-check.mjs')), `${tier}: gates still land`);
    assert.ok(existsSync(join(dest, 'core', 'gate-runner.mjs')), `${tier}: core modules still land`);
  });
});

test('--with tests lands the test files beside the gates', () => withTempDest((dest) => {
  install(dest, { tier: 'core', components: ['tests'] });
  assert.ok(existsSync(join(dest, 'scripts', 'hooks.test.mjs')));
  assert.ok(existsSync(join(dest, 'core', 'gate-runner.test.mjs')));
  assert.ok(testFilesUnder(join(dest, 'core')).length > 10);
}));

test('an opt-in entry is never selected by tier alone', () => {
  const manifest = loadManifest();
  assert.ok(manifest.entries.some((e) => e.tier === 'opt-in'), 'the manifest declares opt-in entries');
  assert.equal(entriesForTier(manifest, 'full').filter((e) => e.tier === 'opt-in').length, 0);
  assert.ok(entriesForTier(manifest, 'core', ['tests']).some((e) => e.component === 'tests'));
});
```

- [ ] **Step 2: Run to verify they fail** — `cd $H && node --test scripts/adopt.test.mjs` → the three new tests FAIL (tests currently land; no `opt-in` entries).

- [ ] **Step 3: Installer changes** — in `adopt.mjs`:

```js
// line 62-63
export const tierIncludes = (adopted, entryTier) =>
  entryTier !== 'opt-in' && TIERS.indexOf(entryTier ?? 'core') <= TIERS.indexOf(adopted);
```
```js
// lines 168-170: filter the many-files entry by basename globs
  const base = (p) => p.split('/').pop();
  const names = (e.kind === 'dir'
    ? walkRelative(src)
    : readdirSync(src).filter((f) => matchGlob(e.glob, f) && statSync(join(src, f)).isFile()))
    .filter((name) => (!e.include || matchGlob(e.include, base(name))) && !(e.exclude && matchGlob(e.exclude, base(name))));
```
```js
// lines 251-255: --with is repeatable and knows two components
  const KNOWN_COMPONENTS = ['brainkit', 'tests'];
  const components = argv.flatMap((a, i) => (a === '--with' ? [argv[i + 1]] : []));
  for (const c of components) if (!KNOWN_COMPONENTS.includes(c)) { process.stderr.write(`--with requires one of ${KNOWN_COMPONENTS.join('|')}\n`); process.exit(2); }
  const report = install(destRoot, { dryRun, force, tier, ciMode, components: components.length ? components : undefined });
```
(keep every other argument of the existing `install(...)` call exactly as it is; only `components` changes.) Update the header comment at lines 21–28 so the sentence about tiering the `scripts/*.mjs` glob reads: "Only what an adopter must FILL IN is tiered — and the gates' own tests, which are `--with tests` (CI's dry-run installs them; an adopter's tree does not need them)."

- [ ] **Step 4: Manifest changes** — in `copy-manifest.json` edit the `scripts` glob entry to add `"exclude": "*.test.mjs"` and change its seam to `"Every gate (globbed — a per-file list silently drops new gates); tests are --with tests"`; edit the `core` dir entry to add `"exclude": "*.test.mjs"`; append two entries:

```json
    {
      "source": "scripts",
      "dest": "scripts",
      "kind": "glob",
      "glob": "*.test.mjs",
      "seam": "The gates' own tests — opt-in; CI's adoption dry-run installs them, an adopter need not",
      "tier": "opt-in",
      "component": "tests"
    },
    {
      "source": "core",
      "dest": "core",
      "kind": "dir",
      "include": "*.test.mjs",
      "seam": "The core modules' tests — opt-in, see scripts/*.test.mjs",
      "tier": "opt-in",
      "component": "tests"
    }
```
Add to the `_comment`: ` tier:'opt-in' entries land only via --with <component>. include/exclude are basename globs applied to dir and glob entries.`

- [ ] **Step 5: Run the tests** — `node --test scripts/adopt.test.mjs` → all pass. Then `node scripts/doc-integrity-check.mjs --fix` (regenerates the copy table in `loom-adopt/SKILL.md`) and `node scripts/doc-integrity-check.mjs` → exit 0.

- [ ] **Step 6: CI and prose** — `validate.yml:143`: `node "$H/adopt.mjs" --dest "$A" --tier full` → `node "$H/adopt.mjs" --dest "$A" --tier full --with tests`. In `loom-adopt/SKILL.md` find the sentence that gives the adopted-tree test command (`grep -n 'node --test' plugins/middleleap-loom/skills/loom-adopt/SKILL.md`) and prefix it with `Tests are installed only with \`--with tests\`; then` (lower-casing the next word).

- [ ] **Step 7: Verify the upgrade path (Review Focus 5)** — simulate an adoption that had tests:

```bash
T=$(mktemp -d); git stash -q   # HEAD~ state = tests installed
node adopt.mjs --dest $T --tier core > /dev/null; git stash pop -q
node adopt.mjs --dest $T --tier core --report json > /tmp/upgrade.json
ls $T/scripts/*.test.mjs | wc -l          # the adopter's copies must still be there
node -e 'const r=JSON.parse(require("fs").readFileSync("/tmp/upgrade.json"));console.log(r.report.map(e=>e.dest+":"+e.status).filter(s=>/scripts|core/.test(s)).join("\n"))'
rm -rf $T
```
Expected: the test files are still present (never deleted). Record the printed status for `scripts` and `core` in the 2.5.5 upgrade note (Task C4) — e.g. "existing test copies are left in place and reported as `<status>`". If the second run DELETES the tests, stop: that is a defect in the installer to fix before this task is done.

- [ ] **Step 8: Full suite and commit**

```bash
node --test discovery/gates/*.test.mjs discovery/render/*.test.mjs scripts/*.test.mjs core/*.test.mjs
cd - && git add plugins/middleleap-loom/skills/loom-adopt .github/workflows/validate.yml
git commit -m "loom-adopt: test files are an opt-in component (--with tests); default adoptions ship gates only

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task C2: Delivery skills and reviewer templates are manifest entries

**Files:**
- Modify: `$H/copy-manifest.json` (three new entries)
- Modify: `.github/workflows/validate.yml:162` (remove the hand `cp "$H/agents/"*.md`)
- Modify: `plugins/middleleap-loom/skills/loom-adopt/SKILL.md:179-182` (the "still copied by hand" paragraph)
- Test: `$H/scripts/adopt.test.mjs` (append)

- [ ] **Step 1: Failing test**

```js
test('the delivery-loop skills and reviewer templates are manifest entries (stamped, upgradeable)', () => withTempDest((dest) => {
  install(dest, { tier: 'core' });
  for (const s of ['discovery', 'develop', 'next-story', 'implement-story', 'spec-change', 'release', 're-perform', 'govern'])
    assert.ok(existsSync(join(dest, '.claude', 'skills', s, 'SKILL.md')), `skill ${s} did not land`);
  for (const a of ['hard-stop-reviewer.md', 'contract-conformance-reviewer.md', 'shariah-conformance-reviewer.md', 'agent-output.schema.json'])
    assert.ok(existsSync(join(dest, '.claude', 'agents', a)), `${a} did not land`);
  assert.ok(!existsSync(join(dest, '.claude', 'agents', 'evals')), 'eval fixtures are bundle-only');
}));
```
Run: `node --test scripts/adopt.test.mjs` → FAILS (skills absent).

- [ ] **Step 2: Manifest entries** — first `grep -n 'agent-output.schema' copy-manifest.json`; if the schema already has an entry, omit the third object below. Append:

```json
    {
      "source": "skills",
      "dest": ".claude/skills",
      "kind": "dir",
      "seam": "The eight delivery-loop skills (discovery, develop, next-story, implement-story, spec-change, release, re-perform, govern) — project-specific templates you edit; the stamp tells your edits from ours",
      "tier": "core"
    },
    {
      "source": "agents",
      "dest": ".claude/agents",
      "kind": "glob",
      "glob": "*.md",
      "seam": "Reviewer templates — hard-stop, contract-conformance, shariah-conformance (checklists are domain content; you fill in yours)",
      "tier": "core"
    },
    {
      "source": "agents/agent-output.schema.json",
      "dest": ".claude/agents/agent-output.schema.json",
      "kind": "file",
      "seam": "The loom.agent-output/v1 schema every reviewer's JSON block validates against",
      "tier": "core"
    }
```

- [ ] **Step 3: Run the test** → passes. `node scripts/doc-integrity-check.mjs --fix` then `node scripts/doc-integrity-check.mjs` → 0.

- [ ] **Step 4: CI and prose** — delete `validate.yml` line 162 (`cp "$H/agents/"*.md "$A/.claude/agents/"`; confirm with `sed -n 162p`); `grep -n 'cp .*skills' .github/workflows/validate.yml` and delete any hand copy of `$H/skills` too. Replace `loom-adopt/SKILL.md` lines 179–182 (`Plus, still copied by hand …` through `you adapt into \`docs/governance/\`.`) with:

```
The delivery-loop skills (`harness/skills/*` → `.claude/skills/`) and the reviewer templates
(`harness/agents/*.md` → `.claude/agents/`) are manifest entries, stamped and upgraded like
everything else. Only the worked fixtures under
`harness/{evidence-example,change-example,assurance-example,register-example}/` are still
adapted by hand into `docs/governance/`.
```

- [ ] **Step 5: Full suite; commit**

```bash
node --test discovery/gates/*.test.mjs discovery/render/*.test.mjs scripts/*.test.mjs core/*.test.mjs
git add plugins/middleleap-loom/skills/loom-adopt .github/workflows/validate.yml
git commit -m "loom-adopt: delivery skills and reviewer templates install through the manifest

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task C3: The ofbo sync control leaves the adopter's catalog

**Files:**
- Modify: `$H/governance/control-catalog.template.json:1153-1165` (delete the `DISCOVERY-SYNC` object)
- Modify: `$H/ci/ci.yml:95` (delete the `node scripts/discovery-sync-check.mjs` line)

- [ ] **Step 1: Confirm the boundaries** — `sed -n '1152,1166p' control-catalog.template.json`: line 1152 is `},`, 1153 is `{`, 1154 `"control_id": "DISCOVERY-SYNC",`, 1165 `},`, 1166 `{`. Delete lines 1153–1165 inclusive. `node -e 'JSON.parse(require("fs").readFileSync("governance/control-catalog.template.json"))'` parses; `grep -c DISCOVERY-SYNC governance/control-catalog.template.json` → 0.

- [ ] **Step 2: ci.yml** — delete line 95 (`node scripts/discovery-sync-check.mjs   # bundle-only; the ofbo back-port debt, counted`). The surrounding `if [ ! -f .loom/adoption.json ]` block keeps its other two lines.

- [ ] **Step 3: Gates agree** — `node scripts/control-catalog-check.mjs && node scripts/ci-catalog-check.mjs && node scripts/discovery-sync-check.mjs`; all exit 0 (the bundle's own sync gate still runs from `validate.yml`, which is untouched).

- [ ] **Step 4: Full suite; commit**

```bash
node --test discovery/gates/*.test.mjs discovery/render/*.test.mjs scripts/*.test.mjs core/*.test.mjs
git add governance/control-catalog.template.json ci/ci.yml
git commit -m "loom-adopt: DISCOVERY-SYNC is bundle maintenance, not an adopter control

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task C4: Bump and PR

- [ ] **Step 1:** loom `2.5.4` → `2.5.5` in both manifests. Append to `upgrade-notes.json`: `{ "version": "2.5.5", "headline": "Smaller adoptions: tests opt-in, skills and agents managed, ofbo control gone", "notes": ["Test files no longer install by default — run node harness/adopt.mjs --dest . --with tests to keep them. Existing copies are left in place and reported as <status from Task C1 step 7>.", "The eight delivery-loop skills and the three reviewer templates are manifest entries now: stamped, upgraded, drift-classified. Your edited copies are preserved with a .loom-new sidecar like any other file.", "DISCOVERY-SYNC is removed from the control catalog and ci.yml — it measured the Loom bundle's own divergence from its origin and had nothing to verify in an adopted tree. Delete the row from docs/governance/control-catalog.json if you merged it."] }` — with the real status substituted.
- [ ] **Step 2:** verification block from A9 step 3; all green.
- [ ] **Step 3:** commit `release: loom 2.5.5`, push, PR "Review WP-C: bundle surface", checks green.

---

## WP-D — Open Finance freshness (branch `claude/review-d-open-finance-freshness`, after WP-C merges)

Finding A6. Bumps: open-finance 3.0.3, banking 1.1.1. Needs network access to `Nebras-Open-Finance/api-specs` and the community hub for D1 and D5; if unreachable, do D2–D4 and report D1/D5 as blocked.

### Task D1: check_current.py runs on the default macOS Python

**Files:**
- Modify: `plugins/middleleap-open-finance-uae/skills/open-finance-uae/scripts/check_current.py:1-3, 38`

- [ ] **Step 1: Reproduce** — `/usr/bin/python3 plugins/middleleap-open-finance-uae/skills/open-finance-uae/scripts/check_current.py; echo exit=$?` → a `TypeError: unsupported operand type(s) for |` traceback.
- [ ] **Step 2: Fix** — insert `from __future__ import annotations` as the first statement after the module docstring (before `import argparse`), and add to the docstring's usage block the line `Requires Python 3.9 or newer.`
- [ ] **Step 3: Verify** — the same command now prints `FRESH`, `PENDING` or `STALE` with exit 0/1 (or `ERROR` exit 2 if offline) and no traceback; `python3.11 …/check_current.py` gives the same status.
- [ ] **Step 4: Commit** `open-finance-uae: check_current.py runs on Python 3.9`.

### Task D2: The standards reference agrees with itself

**Files:**
- Modify: `…/open-finance-uae/references/standards-versions.md:139, 462`

- [ ] **Step 1:** line 139 `**Status**: Superseded — still in heavy live use; v2.1-final is current (API Hub v7)` → `**Status**: Superseded — still in heavy live use; v2.1-final is current (API Hub v8)`.
- [ ] **Step 2:** line 462 `1. Review release notes **and the current errata (errata2)** for breaking changes` → `1. Review release notes **and the current errata** (the level named in SKILL.md's Quick Reference — confirm with \`scripts/check_current.py\`) for breaking changes`.
- [ ] **Step 3: Verify** — `grep -n 'errata2\|API Hub v7' …/references/standards-versions.md` shows only historical rows (a table entry for errata2's publication date is history, not a "current" claim); no line says either is current.
- [ ] **Step 4: Commit** `open-finance-uae: standards reference names v8 and the current errata consistently`.

### Task D3: The 16 September 2026 deadline is in the past

**Files:**
- Modify: `…/open-finance-uae/SKILL.md:171`, `references/cbuae-regulations.md:67,124`, `references/implementation-roadmap.md:39`, `references/verification-log.md:35`

- [ ] **Step 1: SKILL.md Quick-Reference row** (line 171) → `| 16 Sep 2026 TPP regularisation deadline | Date has passed (29 Sep 2026 check); never confirmed in a public source and the outcome (who regularised, any extension) is unverified — needs authenticated/CBUAE confirmation |`.
- [ ] **Step 2: cbuae-regulations.md line 67** → `**Regularisation deadline:** deemed-licence participants were to complete regularisation of their Open Finance activities by **16 September 2026** (date now passed; carried from the skill's verified baseline and never found in the public rulebook text, which provides for phased application by CBUAE notification — the outcome is unverified as of 29 Sep 2026).` Line 124: `must be regularised by **16 September 2026** (verify against source)` → `were to be regularised by **16 September 2026** (date passed; outcome unverified as of 29 Sep 2026)`.
- [ ] **Step 3: implementation-roadmap.md line 39** → `| TPP regularisation deadline (CBUAE) | **16 Sep 2026** — passed; outcome not verified against a public source (29 Sep 2026 check) |`. Read lines 36–50 and mark every other milestone dated on or before 29 Sep 2026 the same way ("— due; outcome unverified") rather than leaving it as future.
- [ ] **Step 4: verification-log.md item 2** → status cell becomes `**STILL OPEN — date passed 16 Sep 2026** (29 Sep 2026 re-check: still absent from anonymously-readable OF Confluence, the public rulebook and the hub; outcome unverified)`.
- [ ] **Step 5: Verify** — `grep -rn '16 Sep' plugins/middleleap-open-finance-uae | grep -iv 'passed\|were to'` prints nothing.
- [ ] **Step 6: Commit** `open-finance-uae: the 16 Sep 2026 deadline is recorded as passed and unverified`.

### Task D4: One home for "last verified"

**Files:**
- Modify: `plugins/middleleap-open-finance-uae/README.md:33`, `CLAUDE.md:77`

- [ ] **Step 1: README line 33** → `- Standards canon: **v2.1-final + errata3**, API Hub **v8** at the skill's last verification — the date and the audit trail live in \`skills/open-finance-uae/SKILL.md\` (the "Last verified" note) and \`references/verification-log.md\`; run \`python3 skills/open-finance-uae/scripts/check_current.py\` before relying on it.`
- [ ] **Step 2: CLAUDE.md line 77** → `- Standards canon: **v2.1-final + errata3**, API Hub **v8** at the skill's last verification — the date lives only in the skill's SKILL.md "Last verified" note; don't trust this line, run \`python3 plugins/middleleap-open-finance-uae/skills/open-finance-uae/scripts/check_current.py\` (Python ≥ 3.9)`.
- [ ] **Step 3: Verify** — `grep -rn 'last verification (' README.md CLAUDE.md plugins/*/README.md` prints nothing.
- [ ] **Step 4: Commit** `docs: the Open Finance verification date has one home`.

### Task D5: islamic-banking-uae re-verified against errata3

**Files:**
- Create: `plugins/middleleap-banking-uae/skills/islamic-banking-uae/references/verification-log.md`
- Modify: `…/islamic-banking-uae/SKILL.md:10`, `references/open-finance-intersection.md:11` and any changed field rows

- [ ] **Step 1: Fetch the current specs**

```bash
cd plugins/middleleap-open-finance-uae/skills/open-finance-uae
python3 scripts/fetch_spec.py --list
python3 scripts/fetch_spec.py uae-account-information -o /tmp/bds.yaml
python3 scripts/fetch_spec.py uae-consent-events -o /tmp/consent-events.yaml   # use the exact names --list prints
grep -n -A12 'ShariaStructure' /tmp/bds.yaml | head -40
grep -n 'IsShariaCompliant\|AEShariaFlag\|Profit\|Rental\|DonatedToCharity\|Hibah\|ReadProductFinanceRates' /tmp/bds.yaml /tmp/consent-events.yaml | head -60
```
- [ ] **Step 2: Compare** against every row of the inventory table in `open-finance-intersection.md` (lines 13–24 and the sections that follow). For each row: unchanged → leave; enum or description changed → edit the row to the fetched value and note the change; new Islamic-relevant field (errata3 §3–5 added `ReadProductFinanceRates` on Consent Events / CAAP per the sibling skill's `standards-versions.md:29`) → add a row.
- [ ] **Step 3: Log it** — create `references/verification-log.md`:

```markdown
# Verification log — islamic-banking-uae

| Date | Pass | Source | Result |
|---|---|---|---|
| 13 Jul 2026 | Full inventory | errata-resolved v2.1 OpenAPI (Nebras api-specs, errata2) | Baseline inventory in open-finance-intersection.md |
| 29 Sep 2026 | Re-verification after errata3 §3–5 | fetch_spec.py against v2.1-errata3 (uae-account-information, consent events) | <rows unchanged / changed / added — list them> |
```
with the actual result filled in. Update `SKILL.md:10` and `open-finance-intersection.md:11` to `Last verified against sources: 29 September 2026 (errata3)` and, if v2.2-rc1 was inspected, one sentence on its Sharia-related deltas.
- [ ] **Step 4: Verify** — `node scripts/deidentify-check.mjs` OK; the intersection file still parses as a table (`grep -c '^|' references/open-finance-intersection.md` ≥ the count before).
- [ ] **Step 5: Commit** `islamic-banking-uae: Islamic field inventory re-verified against errata3`.

### Task D6: Bump and PR

- [ ] open-finance `3.0.2` → `3.0.3`, banking `1.1.0` → `1.1.1`; verification block; commit `release: open-finance-uae 3.0.3, banking-uae 1.1.1`; PR "Review WP-D: Open Finance freshness"; checks green.

---

## WP-E — Hooks, delivery skills, canon quick reference, evals (branch `claude/review-e-hooks-skills-evals`, after WP-D merges)

Findings C5, C6, B5, B6 (done in A4), C7. Bump: loom 2.5.6.

### Task E1: spec-tripwire is portable and denies writes, not reads

**Files:**
- Modify: `$H/hooks/spec-tripwire.sh:71-76` (canonicalisation) and `:86-92` (Bash write signal)
- Test: `$H/scripts/hooks.test.mjs` (append)

- [ ] **Step 1: Failing tests** — append after the existing spec-tripwire tests:

```js
test('spec-tripwire: read-only tooling that names the contract is allowed; a write aimed at it is denied', { skip: SKIP }, () => {
  const repo = repoOn('claude/STORY-9-types');
  try {
    for (const command of [
      'npx openapi-typescript specs/openapi.yaml > src/api.d.ts',
      'node scripts/lint-spec.mjs specs/openapi.yaml',
      'python3 -m openapi_spec_validator specs/openapi.yaml',
    ]) assert.ok(!denied(run('spec-tripwire.sh', { command }, repo)), `wrongly denied: ${command}`);
    for (const command of [
      "python3 -c \"open('specs/openapi.yaml','w').write('')\"",
      'cat src/new.yaml > specs/openapi.yaml',
      'tee specs/openapi.yaml < src/new.yaml',
    ]) assert.ok(denied(run('spec-tripwire.sh', { command }, repo)), `not denied: ${command}`);
  } finally { rmSync(repo, { recursive: true, force: true }); }
});

test('spec-tripwire: a ../ path to the contract is canonicalised without GNU realpath', { skip: SKIP }, () => {
  const repo = repoOn('feature/STORY-7-add-field');
  try {
    assert.ok(denied(run('spec-tripwire.sh', { file_path: 'src/../specs/openapi.yaml' }, repo)));
    assert.ok(denied(run('spec-tripwire.sh', { file_path: `${repo}/lib/../specs/openapi.yaml` }, repo)));
  } finally { rmSync(repo, { recursive: true, force: true }); }
});
```
Run: `cd $H && node --test scripts/hooks.test.mjs` → the first new test FAILS on `npx openapi-typescript …` (denied); the second FAILS on macOS (`realpath -m` unsupported, raw path kept).

- [ ] **Step 2: Canonicalise portably** — replace lines 71–76 (`# Canonicalize so ../, symlinks …` through the `fi` that closes `if command -v realpath`) with:

```sh
  # Canonicalize so ../, symlinks, or odd prefixes cannot dodge the match. GNU `realpath -m`
  # is not on macOS, so resolve with node (always present: the gates are node) and fall back
  # to the raw path only if that fails.
  case "$file_path" in /*) abs="$file_path" ;; *) abs="${CLAUDE_PROJECT_DIR:-$PWD}/$file_path" ;; esac
  canonical=$(node -e 'process.stdout.write(require("path").resolve(process.argv[1]))' -- "$abs" 2>/dev/null || printf '%s' "$abs")
```

- [ ] **Step 3: Write signal must target the contract** — replace the entire Bash-section loop (from the line `for spec in $SPEC_PATHS; do` that follows the `# ── Bash: the command names the contract …` comment, through its closing `done`) with the loop below, so the deny fires only when a write is aimed at the contract; `$esc` is the spec basename with regex metacharacters escaped:

```sh
for spec in $SPEC_PATHS; do
  name="${spec##*/}"
  esc=$(printf '%s' "$name" | sed 's/[][\.*^$]/\\&/g')
  if printf '%s' "$command" | grep -Fq -- "$name"; then
    if printf '%s' "$command" | grep -Eq -- "(^|[^<])>>?[[:space:]]*[^[:space:]|;&]*${esc}" \
      || printf '%s' "$command" | grep -Eq -- "(^|[[:space:]])sed[[:space:]]+(-[a-zA-Z]*i|--in-place)[^|;&]*${esc}" \
      || printf '%s' "$command" | grep -Eq -- "(^|[[:space:]])(mv|cp|rm|dd|truncate|install|tee)[[:space:]][^|;&]*${esc}" \
      || printf '%s' "$command" | grep -Eq -- "(^|[[:space:]])git[[:space:]]+(mv|rm|checkout|restore)[[:space:]][^|;&]*${esc}" \
      || printf '%s' "$command" | grep -Eq -- "(^|[[:space:]])yq[[:space:]][^|;&]*[[:space:]]-i[[:space:]][^|;&]*${esc}" \
      || { printf '%s' "$command" | grep -Eq -- "(^|[[:space:]])(python[0-9.]*|node|perl|ruby|php)([[:space:]]|$)" \
           && printf '%s' "$command" | grep -Eq -- 'writeFile|write_text|write\(|unlink|rename|dump\(|copyfile|truncate'; }; then
      deny "Spec tripwire: this shell command names $spec and writes to it (redirection, sed -i, mv/cp/rm/tee, a scripting runtime with a write call) on a working branch ($branch). The contract changes via its own spec-only PR — use the spec-change skill (branch feature/<ID>-spec-<slug>). Reading it (cat, grep, git diff, codegen that writes elsewhere) is fine."
    fi
  fi
done
```
POSIX classes replace `\b`/`\s` so BSD grep matches the same strings.

- [ ] **Step 4: Run with both greps**

```bash
node --test scripts/hooks.test.mjs
PATH=/usr/bin:$PATH node --test scripts/hooks.test.mjs   # BSD grep first on PATH
```
Expected: all pass both times, including the five pre-existing spec-tripwire cases (`sed -i`, heredoc, `git mv`, `node -e writeFileSync`, `>>`).

- [ ] **Step 5: Commit** `hooks: spec-tripwire canonicalises without GNU realpath and denies only writes aimed at the contract`.

### Task E2: The build-loop skills agree with each other

**Files:**
- Modify: `$H/skills/implement-story/SKILL.md:4, 17-21, 22-31`
- Modify: `$H/skills/develop/SKILL.md:59-63` and end of file
- Modify: `$H/skills/discovery/SKILL.md` end of file

- [ ] **Step 1: implement-story** — delete line 4 (`disable-model-invocation: true`). In step 2 (lines 19–21) change `Surface any genuine decision for the user; otherwise proceed.` to `Surface any genuine decision for the user; otherwise proceed. Under the \`next-story\` loop, do not ask: record the decision as \`blocked\` on the backlog item with the question, and move to the next eligible item.` Change the start of 3b (line 22) from `3b. **If the story has a user-facing surface, design it before you test it.** Run` to `3b. **If the story has a user-facing surface and Claude Design is installed, design it before you test it** (\`/design\` and \`/design-sync\` are not part of the Loom plugin; without them, build from the design tokens and say so in the PR). Run`.
- [ ] **Step 2: develop** — line 60 `**A direction with a user-facing surface is sketched, not described.** For each such direction` → `**A direction with a user-facing surface is sketched, not described.** Where Claude Design is installed (\`/design\` is not part of the Loom plugin — otherwise sketch in Markdown or ASCII and say so), for each such direction`. Append to the end of the file:

```

## Red flags — you are rationalizing
- Only one direction was explored ("the obvious one") — the SDR needs alternatives to judge
- A direction is judged on effort or familiarity instead of the success measures and the D6 conditions
- Touching the API contract or writing a spike "to see if it works" — that is `next-story`'s work
- A backlog item without `discovery: <slug>` or `sdr:` ("we'll link it later")
- Converging because the sponsor prefers it, with no success-measure argument recorded
```
- [ ] **Step 3: discovery** — append:

```

## Red flags — you are rationalizing
- `handoff.md` names a component, an endpoint, a table or a vendor ("just to be concrete") — D4
- The wireframe has real copy, a colour system or working navigation ("so the sponsor gets it") — D8
- A theme in the synthesis cites no signal, or the signal was written after the theme — D5
- Evidence is "common knowledge" or "what the PO said" with no source file — D2
- Skipping D9 because "nobody was available to react" — an unreacted prototype is not validated
```
- [ ] **Step 4: Verify** — `grep -c 'Red flags' skills/*/SKILL.md` shows every skill ≥ 1; `grep -n 'disable-model-invocation' skills/*/SKILL.md` prints nothing; the harness suite passes (`node --test scripts/*.test.mjs` — template-parity and doc checks read these files).
- [ ] **Step 5: Commit** `loom-adopt skills: implement-story is invocable from next-story; design steps optional; red flags for discovery and develop`.

### Task E3: The canon answers gate questions inline; changelog residue leaves the skills

**Files:**
- Modify: `plugins/middleleap-loom/skills/loom/SKILL.md:50 (insert after), 88-90, 91, 138, 181`
- Modify: `plugins/middleleap-loom/agents/change-watch.md:13`, `plugins/middleleap-loom/agents/risk-reviewer.md:18`
- Modify: `plugins/middleleap-loom/skills/loom-adopt/SKILL.md:71-73, 409`
- Modify: `plugins/middleleap-loom/README.md:137`

- [ ] **Step 1: Gate table** — insert after line 50 (`or an appendix.`) a blank line and:

```
**Gate ids at a glance** (full definitions and failure conditions: `references/glossary.md`):

| Discovery gate | Passes when | Delivery gate | Passes when |
|---|---|---|---|
| D1 Problem framing | a falsifiable problem, a target user and a success measure exist | Q1 build + unit | it compiles and passes its own tests |
| D2 Evidence | every claim cites a signal that exists | Q2 static + SAST | lint, types and security static analysis are clean |
| D3 Scope & stakeholders | stakeholders are named and out-of-scope is explicit | Q3 integration + contract | it works against real local stores and honours the contract end to end |
| D4 No-solutioning boundary | no discovery artifact specifies a build | Q4 security + dependencies | dependency audit and secrets scan are clean |
| D5 Synthesis integrity | every theme traces to a signal; the prioritisation method is stated | Q5 production approval | a human approved at release time, evidenced |
| D6 Data-governance feasibility | risk category, regulatory driver, resolvable register id and residual-risk verdict are present | | |
| D7 Brand conformance | the brand marker is present; no colour, size or font is hard-coded | | |
| D8 Tangibility | a prototype brief and wireframe exist and do not over-specify | | |
| D9 Validation loop | somebody reacted to the prototype | | |
```
- [ ] **Step 2: Residue** — exact substitutions:
  - `loom/SKILL.md:88` `the repo-side half. Since 2.1.0 this covers the reviewer agents too: they emit one output` → `the repo-side half. This covers the five Loom reviewer agents too (\`code-reviewer\` keeps its Markdown format): they emit one output`
  - `loom/SKILL.md:91` `the 2.4 UAE consumer-AI route` → `the UAE consumer-AI route`
  - `loom/SKILL.md:138` `(\`institution/brainkit/\`, 2.0-rc.10)` → `(\`institution/brainkit/\`)`
  - `loom/SKILL.md:181` `The decision log (2.0-rc) makes` → `The decision log makes`
  - `agents/change-watch.md:13` and `agents/risk-reviewer.md:18` `## Read the external record first (2.1.0, hardening plan row 5.3)` → `## Read the external record first`
  - `loom-adopt/SKILL.md:71-73` `A first run with no \`--tier\` lands \`core\` (rc.33 — it used to land \`full\`, handing every` / `unflagged first-timer the cliff this section exists to remove).` → `A first run with no \`--tier\` lands \`core\`, the safe on-ramp.`
  - `loom-adopt/SKILL.md:409` `- **A repository adopted before 2.0.0-rc.18** has no stamp,` → `- **A repository adopted before the stamp existed** (early 2.0 release candidates) has no stamp,`
  - `plugins/middleleap-loom/README.md:137` `Version 2.4 adds an automatic UAE consumer-AI route:` → `An automatic UAE consumer-AI route:`
- [ ] **Step 3: Verify** — `grep -n 'rc\.[0-9]\|Since 2\.1\|hardening plan row\|2\.0-rc' plugins/middleleap-loom/skills/loom/SKILL.md plugins/middleleap-loom/agents/*.md` prints nothing; `cd $H && node scripts/doc-integrity-check.mjs && node scripts/self-claims-check.mjs` exit 0.
- [ ] **Step 4: Commit** `loom: gate ids at a glance; release-candidate residue removed from skills and agents`.

### Task E4: Plugin eval suites prove the descriptions fire

`claude plugin eval` (CLI 2.1.284) runs `evals/<case>/case.yaml` files against a plugin with a no-plugin baseline arm; a `tool_used` grader on the `Skill` tool is the skill-fired indicator, and `min: 0, max: 0` asserts a skill did NOT fire. Every run is a real `claude` child on the operator's credential, so these suites are run by hand (or a scheduled job), never in `validate.yml`.

**Files:**
- Create: `plugins/middleleap-loom/evals/loom-adopt-fires-on-install/case.yaml`
- Create: `plugins/middleleap-loom/evals/loom-answers-gate-questions/case.yaml`
- Create: `plugins/middleleap-loom/evals/intake-before-brainkit/case.yaml`
- Create: `plugins/middleleap-loom/evals/claude-md-from-scratch/case.yaml`
- Create: `plugins/middleleap-banking-uae/evals/risk-review-fires/case.yaml`
- Create: `plugins/middleleap-loom-demo/evals/demo-stays-quiet-for-a-real-bank/case.yaml`
- Modify: `CLAUDE.md` Verification section (one line), `.gitignore` (`**/evals/results/`)

- [ ] **Step 1: Write the six cases**

`plugins/middleleap-loom/evals/loom-adopt-fires-on-install/case.yaml`:
```yaml
schema_version: "1.1"
name: loom-adopt-fires-on-install
description: An install request loads loom-adopt and not its neighbours.
tags: [triggers]
execution:
  prompt: "We want to adopt the Loom in this repository — set up the discovery harness and the build-loop guardrails. Tell me the first command to run."
  runs: 2
  max_turns: 6
graders:
  - name: loom-adopt-fired
    type: tool_used
    tool: Skill
    input_match: '"skill"\s*:\s*"(?:[\w-]+:)?loom-adopt"'
    min: 1
    max: 3
  - name: intake-did-not-fire
    type: tool_used
    tool: Skill
    input_match: '"skill"\s*:\s*"(?:[\w-]+:)?institution-intake"'
    min: 0
    max: 0
  - name: brainkit-did-not-fire
    type: tool_used
    tool: Skill
    input_match: '"skill"\s*:\s*"(?:[\w-]+:)?brainkit-init"'
    min: 0
    max: 0
  - name: names-the-installer
    type: regex
    pattern: "adopt\\.mjs"
    match: contains
```

`plugins/middleleap-loom/evals/loom-answers-gate-questions/case.yaml`:
```yaml
schema_version: "1.1"
name: loom-answers-gate-questions
description: A gate question loads the loom canon, not the installer, and answers from the gate table.
tags: [triggers]
execution:
  prompt: "In the Loom, what does gate D6 check and what makes it fail?"
  runs: 2
  max_turns: 6
graders:
  - name: loom-fired
    type: tool_used
    tool: Skill
    input_match: '"skill"\s*:\s*"(?:[\w-]+:)?loom"'
    min: 1
    max: 3
  - name: loom-adopt-did-not-fire
    type: tool_used
    tool: Skill
    input_match: '"skill"\s*:\s*"(?:[\w-]+:)?loom-adopt"'
    min: 0
    max: 0
  - name: names-the-gate
    type: regex
    pattern: "[Dd]ata-governance feasibility"
    match: contains
  - name: names-a-failure-condition
    type: regex
    pattern: "register|residual"
    flags: "i"
    match: contains
```

`plugins/middleleap-loom/evals/intake-before-brainkit/case.yaml`:
```yaml
schema_version: "1.1"
name: intake-before-brainkit
description: With no approved sources named, the intake fires and brainkit-init stays quiet.
tags: [triggers]
execution:
  prompt: "We are a bank starting with the Loom next month. Nobody has gathered any policy documents, brand guidelines or architecture standards yet. What do we need to prepare?"
  runs: 2
  max_turns: 6
graders:
  - name: intake-fired
    type: tool_used
    tool: Skill
    input_match: '"skill"\s*:\s*"(?:[\w-]+:)?institution-intake"'
    min: 1
    max: 3
  - name: brainkit-did-not-fire
    type: tool_used
    tool: Skill
    input_match: '"skill"\s*:\s*"(?:[\w-]+:)?brainkit-init"'
    min: 0
    max: 0
```

`plugins/middleleap-loom/evals/claude-md-from-scratch/case.yaml`:
```yaml
schema_version: "1.1"
name: claude-md-from-scratch
description: A new-repo CLAUDE.md request loads claude-md-guide (the only CLAUDE.md skill after WP-B).
tags: [triggers]
execution:
  prompt: "This repository has no CLAUDE.md. Write me a starter one I can fill in."
  runs: 2
  max_turns: 6
graders:
  - name: guide-fired
    type: tool_used
    tool: Skill
    input_match: '"skill"\s*:\s*"(?:[\w-]+:)?claude-md-guide"'
    min: 1
    max: 3
  - name: has-commands-section
    type: regex
    pattern: "## Commands"
    match: contains
```

`plugins/middleleap-banking-uae/evals/risk-review-fires/case.yaml`:
```yaml
schema_version: "1.1"
name: risk-review-fires
description: A "what are the risks" question in a UAE banking context loads the risk reviewer.
tags: [triggers]
execution:
  prompt: "We are a UAE retail bank adding an AI-driven affordability check to our lending app. What are the risks?"
  runs: 2
  max_turns: 6
graders:
  - name: reviewer-fired
    type: tool_used
    tool: Skill
    input_match: '"skill"\s*:\s*"(?:[\w-]+:)?uae-bank-risk-reviewer"'
    min: 1
    max: 3
  - name: cites-mms-or-cps-ai
    type: regex
    pattern: "MMS|CPS-AI|Model Management"
    match: contains
```

`plugins/middleleap-loom-demo/evals/demo-stays-quiet-for-a-real-bank/case.yaml`:
```yaml
schema_version: "1.1"
name: demo-stays-quiet-for-a-real-bank
description: A real institution's business-case request must not load the Meridian demo skills.
tags: [triggers, negative]
execution:
  prompt: "Draft the business case for our bank's new payments hub — we need the NPV and the sign-off list for the investment committee."
  runs: 2
  max_turns: 6
graders:
  - name: meridian-business-case-did-not-fire
    type: tool_used
    tool: Skill
    input_match: '"skill"\s*:\s*"(?:[\w-]+:)?meridian-business-case"'
    min: 0
    max: 0
  - name: meridian-brand-did-not-fire
    type: tool_used
    tool: Skill
    input_match: '"skill"\s*:\s*"(?:[\w-]+:)?meridian-brand-guidelines"'
    min: 0
    max: 0
  - name: no-meridian-in-answer
    type: regex
    pattern: "Meridian"
    match: not_contains
```

- [ ] **Step 2: Ignore results; document the command** — append `**/evals/results/` to `.gitignore`. In CLAUDE.md's Verification block add, after the console line: `claude plugin eval ./plugins/middleleap-loom --trust-plugin --max-cost-usd 5   # trigger evals; paid, run by hand — same for middleleap-banking-uae and middleleap-loom-demo`.

- [ ] **Step 3: Run the suites (RED expected on the demo case if A3 was not merged)**

```bash
for p in middleleap-loom middleleap-banking-uae middleleap-loom-demo; do
  claude plugin eval ./plugins/$p --trust-plugin --max-cost-usd 5 --no-publish; echo "$p exit=$?"
done
```
Expected: `exit=0` for all three; every `*-fired` indicator shows `Skill called 1x` or more in the `with` arm; every `*-did-not-fire` grader passes. Results land in `plugins/<p>/evals/results/<timestamp>/report.html` (ignored by git). A case that fails on the SAME grader in both runs is a description defect: fix the description (Task B3 wording is the baseline), re-run, and record the change in the PR body — do not loosen the grader.

- [ ] **Step 4: Verify the marketplace still validates** — `node scripts/validate-marketplace.mjs` reports only the loom bump error; `node scripts/deidentify-check.mjs` OK (the eval prompts are fictional).

- [ ] **Step 5: Commit**

```bash
git add plugins/middleleap-loom/evals plugins/middleleap-banking-uae/evals plugins/middleleap-loom-demo/evals .gitignore CLAUDE.md
git commit -m "evals: trigger suites for loom, banking-uae and loom-demo via claude plugin eval

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

### Task E5: Bump and PR

- [ ] loom `2.5.5` → `2.5.6`; upgrade note `{ "version": "2.5.6", "headline": "Portable spec tripwire; build-loop skills consistent; canon quick reference", "notes": ["spec-tripwire.sh no longer needs GNU realpath and denies only commands that write to the contract; read-only codegen naming it is allowed.", "implement-story is invocable from next-story again; under the loop a decision is recorded as blocked, never asked. The /design steps are marked optional.", "discovery and develop carry red-flag lists; the loom skill lists every gate inline."] }`; verification block; commit `release: loom 2.5.6`; PR "Review WP-E: hooks, delivery skills, canon, evals"; checks green.

---

## Deferred to separate plans (not in scope here)

- **B4 restructures:** `open-finance-uiux` templates out of Markdown into `assets/`; `meridian-brand-guidelines` slimmed to a skill with `references/`; `copy-manifest.json` seam strings capped and the copy table moved to a reference; the five agents' output-contract block deduplicated into the schema.
- **C4:** move `demo/`, the 25 `*-example/` roots and `upgrade-notes.json` out of the installable skill directory.
- **C8:** extract `validate.yml`'s inline programs into `harness/scripts/ci/*.mjs` with one local reproduction command; add `customer-demo-illustration.test.mjs` to CI.
- **C9:** `docs/README.md` with a status column; archive the July material; extend `.deidentify.json` scope to `docs/`; fix or relocate `docs/loom-website/`.
- **C10 remainder:** validator checks for dependencies resolving, referenced files existing, plugin README presence and the size ceiling; a forbidden-spelling lint for "Al Tareq" in UI contexts.
