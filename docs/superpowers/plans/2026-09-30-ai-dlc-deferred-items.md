# AI DLC Deferred Items Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the items the 29 Sep 2026 review deferred — CI coverage and reproducibility, the docs index and de-identification of docs, validator hardening, the Loom's token cost, the Open Finance prototyping kit, and the Meridian brand skill — as six independently mergeable work packages.

**Architecture:** One branch and one PR per work package (WP-F … WP-K), each cut from `main` after the previous one merges (or stacked, if the user prefers — see Global Constraints). Packages that change a plugin end with a version bump in both manifests; the validator's content-without-bump check (added 29 Sep) enforces it. Every behavioural change is test-first.

**Tech Stack:** Node ≥ 18 (`node:test`), bash + jq, Python ≥ 3.9, GitHub Actions, git, `gh`.

**Spec:** `docs/superpowers/specs/2026-09-29-ai-dlc-optimisation-review.md` — findings B4, C4, C8, C9, C10. The facts gathered for this plan on 29–30 Sep 2026 (file sizes, line numbers, readers) are summarised under each package's **Facts** block; re-verify line numbers with `grep -n` before editing, since earlier packages shift them.

## Global Constraints

- Before every commit: `node scripts/validate-marketplace.mjs` and `node scripts/deidentify-check.mjs`. The validator fails when a plugin's tracked content changed after its version was set; bump **patch** in `plugins/<p>/.claude-plugin/plugin.json` and the matching `.claude-plugin/marketplace.json` entry as the last task of a package that touches that plugin. Read the current version first (`grep -h '"version"' plugins/*/.claude-plugin/plugin.json`) — do not assume.
- Versions at plan time: loom 2.5.7, banking-uae 1.1.3, open-finance-uae 3.0.5, loom-demo 1.0.2.
- Loom upgrade notes: append to `plugins/middleleap-loom/skills/loom-adopt/harness/upgrade-notes.json` `versions` **textually** (never re-serialise the file — it rewrites 300+ lines). Every entry needs `version`, `headline`, `notes` (array) and `action_required` (array, may be empty) — `core/adoption-stamp.test.mjs` enforces the shape.
- Harness directory: `H=plugins/middleleap-loom/skills/loom-adopt/harness`. Full harness suite, run **from H**: `node --test discovery/gates/*.test.mjs discovery/render/*.test.mjs scripts/*.test.mjs core/*.test.mjs demo/meridian/*.test.mjs` (≈2,572 tests).
- Files under `harness/discovery/` are tracked by `harness/discovery-sync.json`; after changing one, run `node scripts/discovery-sync-check.mjs --record` from H and commit the ledger change.
- Files that are digest-sealed evidence (e.g. `demo/meridian/payment-status-tests.json`) must not be edited.
- Shell is zsh in this workspace: run multi-argument scripts with `bash script.sh`, not a zsh function (zsh does not word-split `$VAR`).
- Commit messages: `<area>: <imperative summary>`, ending with the session's Co-Authored-By / Claude-Session lines.
- Merging: the auto-mode classifier blocks `gh pr merge` unless the user has explicitly said to merge. Open the PR, wait for `gh pr checks <n> --watch`, report, and stop at merge unless told otherwise.

## Review Focus

1. **A bundle-only test that has never run in CI** (Task F1) — expect some to fail on first run; each failure is fixed under systematic-debugging, never skipped.
2. **CI scripts run outside GitHub Actions** (Task F2) — `RUNNER_TEMP`, `GITHUB_ENV`, OIDC and `git` identity are absent locally; the local runner must default them and still exit non-zero on any real failure.
3. **A de-identification scope that includes `docs/`** (Task G2) — historical plans legitimately name the de-identification task itself; they need a reasoned allowlist, not a term removal.
4. **An agent file shortened below what `agent-output-check.mjs` requires** (Task I1) — the checker regex-matches five tokens and a `^## Output` heading in every agent file.
5. **A template moved out of Markdown** (Task J1) — the skill must still find it by path; placeholders (`{{…}}`) and the `{P}` SVG-prefix convention must survive the move byte-for-byte.

---

## WP-F — CI coverage and a local reproduction (branch `claude/deferred-f-ci`)

**Facts.** `.github/workflows/validate.yml` is 1,287 lines. The dry-run step (≈140–967) runs the harness suite after `cd "$A"` (the adopted copy), so bundle-only branches skip — `scripts/adopt.test.mjs:19-20`, `scripts/discovery-sync-check.test.mjs:242` and ≈36 others. Line ≈302 passes `"$H"/demo/meridian/*.test.mjs`, which after `cd "$A"` resolves to a path never staged, so `demo/meridian/scenario.test.mjs` never runs. Root `scripts/customer-demo-illustration.test.mjs` is not in the step at line ≈43. The negative-bypass step (≈969–1227) depends on the dry-run step's `$A`, its git repo, and `KOSLI_BIN` from `$GITHUB_ENV`. No local CI reproduction exists.

### Task F1: CI runs the harness suite in the bundle layout, the demo tests, and every root test

**Files:** Modify `.github/workflows/validate.yml` (the "Validator self-test" step ≈43; the dry-run `node --test` line ≈302; add one step after "Loom console").

- [ ] **Step 1: See what has never run.** From H: `node --test discovery/gates/*.test.mjs discovery/render/*.test.mjs scripts/*.test.mjs core/*.test.mjs demo/meridian/*.test.mjs > /tmp/f1.txt 2>&1; echo exit=$?; grep -E '^ℹ (pass|fail|skipped)' /tmp/f1.txt` and from the repo root `node --test scripts/*.test.mjs`. Record pass/fail/skip counts in the PR body. Any failure is a real defect: fix it under superpowers:systematic-debugging in this task (and bump loom in F3 if the fix touches the plugin).
- [ ] **Step 2: Root tests by glob.** Replace the explicit list in the "Validator self-test" step with `run: node --test scripts/*.test.mjs` so a new root test cannot be forgotten again.
- [ ] **Step 3: Bundle-layout step.** Insert after the "Loom console" step:
```yaml
      - name: Loom harness — full suite in the bundle layout (bundle-only branches run here)
        working-directory: plugins/middleleap-loom/skills/loom-adopt/harness
        run: node --test discovery/gates/*.test.mjs discovery/render/*.test.mjs scripts/*.test.mjs core/*.test.mjs demo/meridian/*.test.mjs
```
- [ ] **Step 4: Fix the dead path.** At the dry-run's `node --test … "$H"/demo/meridian/*.test.mjs` line, delete the `"$H"/demo/meridian/*.test.mjs` argument (the new step covers it in the layout where it resolves), and add a comment: `# demo/meridian tests run in the bundle-layout step; $H is not staged under $A`.
- [ ] **Step 5: Prove it bites.** Temporarily add `test('ci-probe', () => { throw new Error('probe') })` to `H/scripts/adopt.test.mjs` inside the bundle-only block, push to the branch, confirm the new step fails in CI, then remove the probe (do not commit the probe to main — use a throwaway commit and `git revert` it before the PR is marked ready, and say so in the PR body).
- [ ] **Step 6: Commit** `ci: run the harness suite in the bundle layout, the demo tests and every root test`.

### Task F2: The two big CI steps become scripts, and one local command reproduces CI

**Files:**
- Create `scripts/ci/loom-dry-run.sh`, `scripts/ci/loom-negative-bypass.sh`, `scripts/ci/local.sh`
- Modify `.github/workflows/validate.yml` (the dry-run and negative-bypass steps become one-line calls)
- Modify `CLAUDE.md` (Verification section)

- [ ] **Step 1: Extract verbatim.** Move the dry-run step's `run:` body (from `A="$RUNNER_TEMP/loom-adopt-dryrun"` to the step's last line) into `scripts/ci/loom-dry-run.sh`, de-indented by 10 spaces, unchanged otherwise. Header:
```bash
#!/usr/bin/env bash
# The Loom adoption dry-run — extracted verbatim from .github/workflows/validate.yml.
# GitHub runs step scripts with `bash -e -o pipefail`; so does this.
set -eo pipefail
RUNNER_TEMP="${RUNNER_TEMP:-$(mktemp -d)}"; export RUNNER_TEMP
GITHUB_ENV="${GITHUB_ENV:-$RUNNER_TEMP/github-env}"; export GITHUB_ENV; touch "$GITHUB_ENV"
cd "$(git rev-parse --show-toplevel)"
```
  Do the same for the negative-bypass step into `scripts/ci/loom-negative-bypass.sh`, with the same header plus `set -a; . "$GITHUB_ENV"; set +a` (so `KOSLI_BIN` written by the dry-run is visible when run locally in sequence).
- [ ] **Step 2: Workflow calls them.** Replace each step's `run:` block with `run: bash scripts/ci/loom-dry-run.sh` / `run: bash scripts/ci/loom-negative-bypass.sh`. Keep step names identical.
- [ ] **Step 3: Local runner.** `scripts/ci/local.sh`:
```bash
#!/usr/bin/env bash
# Reproduce .github/workflows/validate.yml locally. OIDC runner-identity is inert off-GitHub (it says so).
set -eo pipefail
cd "$(git rev-parse --show-toplevel)"
export RUNNER_TEMP="$(mktemp -d)"; export GITHUB_ENV="$RUNNER_TEMP/github-env"; touch "$GITHUB_ENV"
step() { printf '\n== %s\n' "$1"; }
step "validator";            node scripts/validate-marketplace.mjs
step "open-finance offline"; python3 plugins/middleleap-open-finance-uae/skills/open-finance-uae/scripts/test_check_current.py
step "de-identification";    node scripts/deidentify-check.mjs
step "root tests";           node --test scripts/*.test.mjs
step "console";              node --test apps/loom-console/test/*.test.mjs
step "harness bundle layout"; (cd plugins/middleleap-loom/skills/loom-adopt/harness && node --test discovery/gates/*.test.mjs discovery/render/*.test.mjs scripts/*.test.mjs core/*.test.mjs demo/meridian/*.test.mjs)
step "adoption dry-run";     bash scripts/ci/loom-dry-run.sh
step "negative bypass";      bash scripts/ci/loom-negative-bypass.sh
printf '\nlocal CI: all steps passed\n'
```
  Then read every remaining multi-line step in validate.yml (doc-integrity, rendered workflow, external-record seam, evidence-derived, operations-signal, BrainKit conformance) and add a `step` line for each that runs the same commands (with the same `working-directory`, via a subshell `cd`). The runner-identity step is added as `node <its script>` only if it exits 0 without OIDC; otherwise list it as skipped with a printed reason.
- [ ] **Step 4: Run it.** `bash scripts/ci/local.sh > /tmp/ci-local.txt 2>&1; echo exit=$?` → `exit=0`, last line `local CI: all steps passed`. Then prove failure propagates: temporarily break one fixture (e.g. `echo '{' > /tmp/x && cp` over a copy — do it on a scratch clone, not the working tree) or run `bash -c 'set -eo pipefail; false'` inside a copy of the dry-run script; confirm non-zero exit. Record both in the PR.
- [ ] **Step 5: CLAUDE.md.** In Verification, add first: `bash scripts/ci/local.sh   # everything CI runs, locally (~3 min); the lines below are the fast subsets`.
- [ ] **Step 6: Commit** `ci: extract the dry-run and negative-bypass steps; bash scripts/ci/local.sh reproduces CI`, push, `gh pr checks --watch` → green.

### Task F3: PR

- [ ] If F1 required a plugin fix, bump loom patch + upgrade note. Open the PR "Deferred WP-F: CI coverage and local reproduction"; body lists what F1 Step 1 found.

---

## WP-G — Docs index and de-identification of docs (branch `claude/deferred-g-docs`)

**Facts.** 59 tracked files under `docs/`, no index. Status markers read from the files: 5 ADRs accepted (with residual `AWAITING` items), ADR-0006 proposed/AWAITING; `loom-2.0-plan`, `loom-2.0-rc7-plan`, `loom-control-plane-plan`, `loom-flow-plan` "proposed" (flow-plan body says items landed at rc.33–35); `notion-floor-{identity-mapping,residency-review,threat-model}` DRAFT/Owner AWAITING; `plans/loom-kosli-integration/*` bannered superseded 16 Sep; `plans/2026-09-16-consolidated-landing-plan` 2/50 ticked; `superpowers/plans/2026-07-28-self-describing-identifiers` 0/30. Decks linked from README: `the-loom.html`, `loom-for-the-value-chain.html`; the other four are linked only from docs. Many docs are cited by harness code (`notion-floor-plan.md` by `adapter-evidence-check.mjs:232`, `floor-keeper-check.mjs:133`; `notion-floor-residency-review.md` by `residency-check.mjs:26`; `pilots/loom-onboarding/*` read by `scripts/onboarding-pilot*.mjs`) — **so no file moves in this package**. `.deidentify.json` `scope` is the single string `"plugins"`; scoped to `docs` it would hit `plans/2026-09-16-consolidated-landing-plan.md:217,255,273` (ADCB — describing the de-identification task itself) and `the-loom-walkthrough.html:308` (`WovenPipe`, a client pipeline name, in a public deck).

### Task G1: `docs/README.md` — what each document is and whether it is live

**Files:** Create `docs/README.md`; modify root `README.md` (one link).

- [ ] **Step 1:** Write `docs/README.md`: one short intro paragraph ("Working documents behind the plugins. Only the two decks linked from the root README are reader-facing; everything else is a plan, a record or research, with the status it declares."), then one table per folder (`adrs/`, root decks, root plans, `notion-floor-*`, `pilots/`, `plans/`, `research/`, `simulations/`, `superpowers/`) with columns **Document · What it is · Status (as the file declares it) · Cited by**. Status values are exactly those in the Facts (quote the file's word: accepted / proposed / DRAFT / superseded / note / ILLUSTRATIVE / record / research / reference-deck); where the file declares nothing, write "—". "Cited by" lists code/README citations outside `docs/` only.
- [ ] **Step 2:** Root `README.md`: after the line linking `docs/the-loom.html`, add `Working documents (plans, ADRs, research) are indexed in [docs/](docs/README.md).`
- [ ] **Step 3: Verify** every link in `docs/README.md` resolves: `grep -oE '\]\(([^)#]+)' docs/README.md | sed 's/](//' | while read l; do [ -e "docs/$l" ] || echo MISSING $l; done` prints nothing.
- [ ] **Step 4: Commit** `docs: index every working document with the status it declares`.

### Task G2: The de-identification gate covers `docs/`

**Files:** Modify `scripts/deidentify-check.mjs` (scope handling), `scripts/deidentify-check.test.mjs`, `.deidentify.json`, `docs/the-loom-walkthrough.html:308`.

- [ ] **Step 1: Failing test** — append to `scripts/deidentify-check.test.mjs`, following its existing temp-repo helper style (read the file first; reuse its builder):
```js
const DOCS_FILES = { 'plugins/p/a.md': 'clean\n', 'docs/x.md': 'the WovenPipe pipeline\n' };
const DOCS_TERMS = { terms: ['WovenPipe'], allow: [] };

test('scope may be a list, and a hit under docs/ fails when docs is in scope', () => {
  const r = repo(DOCS_FILES, { ...DOCS_TERMS, scope: ['plugins', 'docs'] });
  try {
    const out = check({ root: r.root });
    assert.equal(out.code, 1);
    assert.equal(out.scanned, 2);
    assert.match(out.findings.join('\n'), /docs\/x\.md:1/);
  } finally { r.cleanup(); }
});

test('a string scope still works (backwards compatible)', () => {
  const r = repo(DOCS_FILES, { ...DOCS_TERMS, scope: 'plugins' });
  try { const out = check({ root: r.root }); assert.equal(out.code, 0); assert.equal(out.scanned, 1); } finally { r.cleanup(); }
});
```
  Run `node --test scripts/deidentify-check.test.mjs` → the first new test FAILS (`scope` is ignored when not a string, so only `plugins/` is scanned).
- [ ] **Step 2: Implement** — in `scripts/deidentify-check.mjs`: change `tracked(root, scope)` (≈19) to take an array and call `git ls-files -z -- ...scopes`; replace line ≈34 with `const scopes = [].concat(cfg.scope || 'plugins').filter((s) => typeof s === 'string' && s);` and pass `scopes`; return `scope: scopes.join(', ')` so the OK message (≈74) reads `under plugins, docs/`. Run → all tests pass.
- [ ] **Step 3: Fix the real hit** — `docs/the-loom-walkthrough.html:308`: replace the table cell text `WovenPipe` with `The delivery pipeline`. `grep -n -i wovenpipe docs/` → nothing.
- [ ] **Step 4: Config** — `.deidentify.json`: `"scope": ["plugins", "docs"]`; add one allow entry: `{ "path": "docs/plans/2026-09-16-consolidated-landing-plan.md", "reason": "historical plan whose task was the ADCB de-identification itself; names the term to describe removing it" }`. Update `$comment` to say plugins/ and docs/.
- [ ] **Step 5: Verify** `node scripts/deidentify-check.mjs` → OK with 4 allowlisted; `node --test scripts/deidentify-check.test.mjs` all pass.
- [ ] **Step 6: Commit** `deidentify: scan docs/ too; the walkthrough deck no longer names a client pipeline`. PR "Deferred WP-G: docs index and de-identification".

---

## WP-H — Validator hardening (branch `claude/deferred-h-validator`)

**Facts.** Frontmatter parser `scripts/validate-marketplace.mjs:90-102`: keeps a leading `|`, `|-`, `>+` in the value; returns `null` for CRLF files; drops everything after a blank line inside a folded block. Today: all `dependencies` resolve (0 misses); every plugin has a README; no skill lacks `name`; sizes loom 5.8 MB, open-finance 0.75 MB, demo 0.25 MB, banking 0.16 MB against CONTRIBUTING's soft "about 1 MB" (which it subordinates to "ship everything referenced"). A referenced-file check as specified in the spec would report 206 misses, almost all paths in an **adopter's** repo — **not implemented** (see ruling in Task H3).

### Task H1: The frontmatter parser handles block indicators, CRLF and paragraph breaks

**Files:** `scripts/validate-marketplace.mjs:90-102`; `scripts/validate-marketplace.test.mjs`.

- [ ] **Step 1: Failing tests** (append; use `withRepo`, `write`, `commit`, `run`, and `bumpBoth` from the file):
```js
const skillWith = (dir, fm) => { write(join(dir, 'plugins', 'demo', 'skills', 'alpha', 'SKILL.md'), `---\n${fm}\n---\n\nbody\n`); bumpBoth(dir, '1.0.1'); commit(dir) }

test('a literal-block description is measured without its indicator', () => withRepo((dir) => {
  skillWith(dir, 'name: alpha\ndescription: |\n  ' + 'x'.repeat(1023))
  const { code, out } = run(dir); assert.equal(code, 0, out)
}))
test('a CRLF SKILL.md is parsed, not reported as missing frontmatter', () => withRepo((dir) => {
  write(join(dir, 'plugins', 'demo', 'skills', 'alpha', 'SKILL.md'), '---\r\nname: alpha\r\ndescription: d\r\n---\r\n\r\nbody\r\n'); bumpBoth(dir, '1.0.1'); commit(dir)
  const { code, out } = run(dir); assert.equal(code, 0, out)
}))
test('a folded description keeps text after a blank line', () => withRepo((dir) => {
  skillWith(dir, 'name: alpha\ndescription: >\n  first\n\n  ' + 'y'.repeat(1030))
  const { code, out } = run(dir); assert.equal(code, 1); assert.match(out, /max 1024/)
}))
```
  Run → all three FAIL.
- [ ] **Step 2: Implement** — normalise `\r\n` to `\n` before matching; strip a leading block indicator `/^[|>][+-]?\s*/` (not only `>-?`); let continuation lines include blank lines (`(?:\n(?:[ \t]+.*)?)*` then trim trailing blank lines). Run the whole file → all pass.
- [ ] **Step 3: Commit** `validator: frontmatter parser handles |, >+, CRLF and paragraph breaks`.

### Task H2: Dependencies must resolve; a shallow clone warns; a skill without `name` warns

**Files:** same two files.

- [ ] **Step 1: Failing tests**:
```js
test('a plugin dependency that is not in the marketplace fails', () => withRepo((dir) => {
  write(join(dir, 'plugins', 'demo', '.claude-plugin', 'plugin.json'), JSON.stringify({ name: 'demo', version: '1.0.0', dependencies: ['ghost'] }))
  commit(dir); const { code, out } = run(dir)
  assert.equal(code, 1); assert.match(out, /dependency "ghost" is not a plugin in this marketplace/)
}))
test('a shallow clone warns that the version check cannot see history', () => withRepo((dir) => {
  const shallow = mkdtempSync(join(tmpdir(), 'mkt-shallow-'))
  execFileSync('git', ['clone', '-q', '--depth', '1', `file://${dir}`, shallow])
  const { code, out } = run(shallow); assert.equal(code, 0, out); assert.match(out, /shallow clone/)
  rmSync(shallow, { recursive: true, force: true })
}))
test('a skill with no name field warns', () => withRepo((dir) => {
  write(join(dir, 'plugins', 'demo', 'skills', 'alpha', 'SKILL.md'), '---\ndescription: d\n---\n'); bumpBoth(dir, '1.0.1'); commit(dir)
  const { code, out } = run(dir); assert.equal(code, 0, out); assert.match(out, /skills\/alpha has no name field/)
}))
```
  (Add `mkdtempSync, rmSync` / `tmpdir` / `execFileSync` imports if the file lacks them.) Run → FAIL.
- [ ] **Step 2: Implement** — after the plugins loop, `for (const d of manifest.dependencies ?? []) if (!names.has(d)) fail(\`${label}: dependency "${d}" is not a plugin in this marketplace — installing ${label} will fail.\`)` (collect `names` from the marketplace entries first); before the bump check, if `git rev-parse --is-shallow-repository` prints `true`, `warn('this is a shallow clone — the content-changed-without-a-bump check cannot see history and is skipped. Fetch full history (CI: fetch-depth: 0).')` and skip the bump check; in the skills loop, `if (fm && !fm.name) warn(\`${label}: skills/${name} has no name field.\`)`. Run → all pass.
- [ ] **Step 3: Commit** `validator: dependencies must resolve; shallow clones and nameless skills warn`.

### Task H3: CONTRIBUTING states the rules the validator does and does not enforce

**Files:** `CONTRIBUTING.md` (the size paragraph ≈ line 69 and the "ship everything the skill references" paragraph ≈ 67).

- [ ] **Step 1:** Amend line ≈69 to: "**Keep a plugin under about 1 MB — except a harness bundle.** `middleleap-loom` ships the adoption harness (≈5.8 MB) because `loom-adopt` installs it into the adopting repo; its tests are control evidence there. Anything else over 1 MB needs a reason in the PR." After line ≈67 add: "The validator does not check that referenced files exist: most paths in the Loom's skills and agents name files in the *adopting* repository, not in this one. Check references by hand when you add one."
- [ ] **Step 2: Commit** `CONTRIBUTING: the size rule's harness exception and the unchecked-reference caveat`. PR "Deferred WP-H: validator hardening".

---

## WP-I — The Loom's token cost (branch `claude/deferred-i-loom-tokens`)

**Facts.** Eight agents carry the same ≈355-word "### The output contract (`loom.agent-output/v1`)" block (five plugin agents: change-watch 97-130, risk-reviewer 71-104, data-governance-reviewer 40-73, discovery-boundary-reviewer 43-77, model-risk-reviewer 40-73; three harness agents: hard-stop-reviewer ≈48, contract-conformance-reviewer ≈61, shariah-conformance-reviewer ≈92). They differ only in the "judges against" clause and the verdict enum (discovery-boundary's bullet is the "Inputs unreadable" variant). `H/scripts/agent-output-check.mjs:35-41` requires, **in each agent file**, matches for `loom\.agent-output\/v1`, `INSUFFICIENT_EVIDENCE`, `register_state|register (is )?(absent|not mounted)`, `\bconfidence\b`, `evidence_refs`, and (`:55-60`) a `^## Output` heading. `H/agents/agent-output.schema.json` has `_comment` fields and an `invariants` array the validator ignores. `copy-manifest.json` `seam` strings total 1,913 words over 80 entries (longest 97 words); they are rendered into `loom-adopt/SKILL.md`'s copy table by `adopt.mjs copyTable()` (≈102-110) via `doc-integrity-check.mjs`; no other reader uses `seam` text.

### Task I1: One copy of the output-contract rules; each agent keeps a short stanza

**Files:** `H/agents/agent-output.schema.json`; the eight agent files; `H/scripts/agent-output-check.test.mjs`.

- [ ] **Step 1: Failing test** — in `agent-output-check.test.mjs` add:
```js
test('the output-contract rules live once, in the schema', () => {
  const schema = JSON.parse(readFileSync(new URL('../agents/agent-output.schema.json', import.meta.url), 'utf8'));
  assert.ok(Array.isArray(schema.rules) && schema.rules.length >= 5, 'schema.rules holds the contract');
  for (const f of agentFiles()) {  // reuse or add a helper listing ../agents/*.md and ../../../../agents/*.md
    const words = (readFileSync(f, 'utf8').split(/^### The output contract/m)[1] ?? '').split(/\s+/).length;
    assert.ok(words < 140, `${f}: output-contract stanza is ${words} words — the rules belong in the schema`);
  }
});
```
  Run → FAILS (no `rules`; stanzas ≈355 words).
- [ ] **Step 2: Schema** — add a top-level `"rules"` array to `agent-output.schema.json` holding, one string each, the shared bullets of today's block: register-absent ⇒ INSUFFICIENT_EVIDENCE (with "never fall back to prose, memory or a rule of thumb" and "an unrun review is not a clean one"); pass-class verdicts carry no high/critical finding; `confidence` meaning and "do not round up"; every finding carries `evidence_refs` whose files appear in `inputs_read`, and a finding with no evidence goes in `reason`; `model` and `prompt_version` are the manifest pins and `"unknown"` is a finding; plus the JSON example as one string. Copy the wording from change-watch's block verbatim.
- [ ] **Step 3: Stanzas** — replace each agent's block (heading to end of file) with, filling `<JUDGES>` and `<VERDICTS>` from the Facts table:
```markdown
### The output contract (`loom.agent-output/v1`)

After the review, emit one JSON block that validates against `.claude/agents/agent-output.schema.json`
(`loom.agent-output/v1`); the schema's `rules` array is the full contract — read it once per session.

- This agent judges against <JUDGES>. If it is absent, unreadable or empty, set
  `register_state: "absent"` and `verdict: "INSUFFICIENT_EVIDENCE"`, and say what was missing in `reason`.
- `verdict` is one of <VERDICTS>, or `INSUFFICIENT_EVIDENCE`. Give `confidence` honestly, and put
  `evidence_refs` on every finding.
```
  For discovery-boundary-reviewer use its own first bullet (inputs unreadable; `register_state` always `not-applicable`). Each stanza must still match all five `REQUIRED_DECLARATIONS` regexes; confirm the file still has a `## Output` heading.
- [ ] **Step 4: Verify** from H: `node scripts/agent-output-check.mjs` → OK; `node --test scripts/agent-output-check.test.mjs` → all pass; full harness suite passes. Word count saved: `git diff --stat` plus `wc -w` before/after in the PR body.
- [ ] **Step 5: Commit** `loom agents: the output-contract rules live once, in the schema`.

### Task I2: The copy table stops carrying rationale essays

**Files:** `H/copy-manifest.json`; `H/adopt.mjs` (`copyTable`); `H/scripts/adopt.test.mjs`; regenerated `loom-adopt/SKILL.md` table.

- [ ] **Step 1: Failing test** in `adopt.test.mjs` (inside the bundle-only block):
```js
test('every manifest seam is a one-line description (rationale lives in "why")', () => {
  for (const e of loadManifest().entries) {
    const n = e.seam.split(/\s+/).length;
    assert.ok(n <= 30, `${e.source}: seam is ${n} words — move the rationale to "why"`);
  }
});
```
  Run → FAILS on ≈20 entries.
- [ ] **Step 2: Split** each seam over 30 words into `seam` (≤ 30 words: what the file is) and `why` (the rest, verbatim). `copyTable()` keeps printing `seam` only; the CLI report (`adopt.mjs` ≈262) may print `why` under `--verbose` if trivial, otherwise leave it data-only.
- [ ] **Step 3:** `node scripts/doc-integrity-check.mjs --fix`, then without `--fix` → OK. `wc -w ../SKILL.md` before/after into the PR body.
- [ ] **Step 4: Full harness suite; commit** `loom-adopt: seams are one line; rationale moves to "why"`.

### Task I3: Bump and PR

- [ ] Loom patch bump + upgrade note (`action_required`: "If you edited an agent's output-contract section, diff it against the .loom-new sidecar: the rules moved to agent-output.schema.json's rules array."). Verification: validator, de-identify, root tests, full harness suite, console. PR "Deferred WP-I: the Loom's token cost".

---

## WP-J — Open Finance prototyping kit (branch `claude/deferred-j-uiux`)

**Facts.** `plugins/middleleap-open-finance-uae/skills/open-finance-uiux/references/`: `app-context-blueprint.md` 74.7 KB (94.8 % fenced; 13 shells/screens + an 877-line 7-screen flow at ≈2488–3364), `html-blueprint.md` 50.7 KB (92.1 %; a 1,221-line consent page at ≈53–1273 plus 8 journey fragments), `presentation-blueprint.md` 49.0 KB (89.2 %; a 1,215-line 9-slide shell at ≈16–1230). Placeholders: 133 `{{…}}` in app-context, 105 in presentation; html-blueprint uses `<!-- INSERT … -->` comments. SKILL.md reads them as templates (l.77, 80, 84, 92–111); it never says "verbatim" except for logos (l.185). Contradictions: `svg-assets.md:22` forbids `<img>` for external files, while `component-library.md:498, 704, 713` use `<img src="assets/...">` — and `:704` names `assets/spinner/Property 1=1.svg`, which does not exist (files are `spinner-frame-1..4.svg`). The inline white logo (`svg-assets.md:65`) differs from `assets/logos/white-logo.svg` in one coordinate (`351.674` vs `351.679`). `design-tokens.md` `:root` block (≈159–200) omits `--color-accent-green`, `--color-unselected-border`, `--color-checkbox-checked`, `--gradient-spinner`. `.deidentify.json` allowlists `references/{INDEX,html-blueprint,value-propositions}.md` (current ADCB hits 3/6/6) plus ENBD/FAB/ADIB mentions. Nothing machine-reads the kit except the de-identify allowlist.

### Task J1: The three large templates become real HTML files

**Files:** Create `open-finance-uiux/assets/templates/{presentation.html, consent-flow.html, app-flow.html}`; modify the three blueprint `.md` files and `SKILL.md` (l.77–111); add `scripts/uiux-kit.test.mjs` (repo root).

- [ ] **Step 1: Failing test** `scripts/uiux-kit.test.mjs`:
```js
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const K = 'plugins/middleleap-open-finance-uae/skills/open-finance-uiux/';
const read = (p) => readFileSync(K + p, 'utf8');
test('the three large templates are HTML files the skill names by path', () => {
  for (const t of ['presentation', 'consent-flow', 'app-flow']) {
    assert.ok(existsSync(K + `assets/templates/${t}.html`), `${t}.html missing`);
    assert.match(read('SKILL.md'), new RegExp(`assets/templates/${t}\\.html`));
  }
});
test('placeholders survive the move', () => {
  const count = (s) => (s.match(/\{\{[A-Z0-9_]+\}\}/g) ?? []).length;
  assert.equal(count(read('assets/templates/presentation.html')), 105);
  assert.ok(count(read('assets/templates/app-flow.html')) > 0);
  assert.match(read('assets/templates/consent-flow.html'), /<!-- INSERT DARK LOGO SVG/);
});
test('no blueprint keeps a fenced block over 200 lines', () => {
  for (const f of ['app-context-blueprint', 'html-blueprint', 'presentation-blueprint']) {
    const lines = read(`references/${f}.md`).split('\n'); let open = -1;
    lines.forEach((l, i) => { if (/^```/.test(l)) { if (open < 0) open = i; else { assert.ok(i - open < 200, `${f}.md:${open + 1} block is ${i - open} lines`); open = -1; } } });
  }
});
```
  Run from the repo root: `node --test scripts/uiux-kit.test.mjs` → FAILS.
- [ ] **Step 2: Move** — for each of the three big blocks, write the fence's inner text byte-for-byte to the template file (`sed -n '<start+1>,<end-1>p'`, using fresh `grep -n '^```'` line numbers), and replace the block in the `.md` with: "The complete template is `../assets/templates/<name>.html` — read it, then follow the placeholder table below." Keep every non-code instruction around it. The 7-screen flow goes to `app-flow.html`; the four shells and eight pre/post screens stay in `app-context-blueprint.md` (each under 300 lines) unless the third test still fails, in which case move the offenders the same way to `assets/templates/app-shells/<name>.html`.
- [ ] **Step 3: SKILL.md** — in "Read these files IN ORDER", point items 2, 3 and 5 at the template files as well as the `.md` (the `.md` keeps the how-to).
- [ ] **Step 4: Verify** — test passes; `diff <(sed -n '<old range>' <(git show HEAD:<file>)) assets/templates/<name>.html` shows only the fence lines differ; `node scripts/validate-marketplace.mjs` shows only the expected open-finance bump error.
- [ ] **Step 5: Commit** `open-finance-uiux: the three large templates are HTML files, not fenced Markdown`.

### Task J2: The kit agrees with itself

**Files:** `component-library.md` (≈498, 704, 713), `svg-assets.md` (≈65), `design-tokens.md` (`:root` block); `scripts/uiux-kit.test.mjs`.

- [ ] **Step 1: Failing tests** (append):
```js
test('components inline logos and spinners, as svg-assets.md requires', () => {
  assert.doesNotMatch(read('references/component-library.md'), /<img src="assets\//);
});
test('the inline white logo matches its asset file', () => {
  assert.doesNotMatch(read('references/svg-assets.md'), /351\.674/);
});
test('the :root block declares every token the tables list', () => {
  const t = read('references/design-tokens.md');
  for (const v of ['--color-accent-green', '--color-unselected-border', '--color-checkbox-checked', '--gradient-spinner'])
    assert.match(t.slice(t.lastIndexOf(':root')), new RegExp(v));
});
```
  Run → FAIL.
- [ ] **Step 2: Fix** — replace each `<img src="assets/...">` with the instruction comment `<!-- inline the <white mark | white logo | spinner> SVG from svg-assets.md (prefix {P}) -->`; change `351.674` to `351.679` (the asset file is the source); add the four declarations to `:root` with the values from the token tables above them. Run → pass.
- [ ] **Step 3: Commit** `open-finance-uiux: components inline the SVGs; logo, tokens and assets agree`.

### Task J3: Fictional banks, and no allowlist

**Files:** `references/INDEX.md`, `html-blueprint.md`, `value-propositions.md` (and any template file J1 moved that inherited names); `.deidentify.json`.

- [ ] **Step 1: Failing check** — remove the three `open-finance-uiux` entries from `.deidentify.json` `allow`; `node scripts/deidentify-check.mjs` → FAILS listing file:line hits.
- [ ] **Step 2: Replace** real bank names across the kit: `ADCB`, `Abu Dhabi Commercial Bank` → `Meridian Trust`; `ENBD`/`Emirates NBD` → `Bank A`; `FAB`/`First Abu Dhabi Bank` → `Bank B`; `ADIB`/`Abu Dhabi Islamic Bank` → `Bank C (Islamic)`. Use word-boundary regexes (`\bFAB\b`) — "FAB" occurs inside other words. Update INDEX.md's sentence that said real names are used on purpose: "Sample scenarios use Meridian Trust and generic Bank A/B/C; replace them with the institution you are prototyping for."
- [ ] **Step 3: Verify** — de-identify gate OK with the remaining allowlist; `grep -rniE '\b(ENBD|FAB|ADIB|ADCB)\b' plugins/middleleap-open-finance-uae/skills/open-finance-uiux` prints nothing; `node --test scripts/uiux-kit.test.mjs` passes.
- [ ] **Step 4: Commit** `open-finance-uiux: fictional banks in the sample scenarios; the de-identify allowlist is empty for the kit`.

### Task J4: Bump and PR

- [ ] Open-finance patch bump. Add `node --test scripts/uiux-kit.test.mjs` coverage — it runs automatically if WP-F's glob step merged; otherwise add it to the root test step. PR "Deferred WP-J: Open Finance prototyping kit".

---

## WP-K — Meridian brand skill (branch `claude/deferred-k-meridian`)

**Facts.** `meridian-brand-guidelines/SKILL.md` is 20.6 KB / 398 lines / ≈3,000 words. Sections (line: words): intro 6 (123), The idea 21 (136), Colour roles 36–91 (≈446), Accessibility 92 (197), Typography 112 (116), Size hierarchy 127 (94), Slide layout 141–188 (≈270), Design elements 189 (223), Logo 208–241 (≈230), **Icon system 242–352 (≈699)**, PPTX 353 (61), Format notes 362–394 (≈235), Portal 395 (21). None of the icon files the icon section names exist; `#0B5A93` is a "Legacy" value (SKILL l.83–84, CSS `--mt-icon-blue`). "One brand, everywhere" (l.17–19) says change `harness/discovery/brand/examples/meridian-trust.design.md` in the same commit — nothing tests it. Token parity today: all colours match; the **font stack differs** (`'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif` in SKILL l.125/383 and CSS vs `"Inter", Arial, sans-serif` in design.md l.62). `business-case-slides.md:21` cites the heading "Title/Section Divider Slides" by name. `render.test.mjs:140-160` asserts `#0B4F80` and `#052540` in the Meridian render.

### Task K1: A parity test binds the skill's tokens to the Loom's brand profile

**Files:** Create `scripts/meridian-brand-parity.test.mjs` (repo root); modify `H/discovery/brand/examples/meridian-trust.design.md` (font stack) and the discovery-sync ledger.

- [ ] **Step 1: Failing test**:
```js
import { test } from 'node:test'; import assert from 'node:assert/strict'; import { readFileSync } from 'node:fs';
const css = readFileSync('plugins/middleleap-loom-demo/skills/meridian-brand-guidelines/references/meridian-variables.css', 'utf8');
const md = readFileSync('plugins/middleleap-loom/skills/loom-adopt/harness/discovery/brand/examples/meridian-trust.design.md', 'utf8');
const v = (name) => (css.match(new RegExp(`--${name}:\\s*([^;]+);`)) ?? [])[1]?.trim();
const t = (key) => (md.match(new RegExp(`${key.replace(/\./g, '\\.')}\\s*:\\s*["']?([^"'\\n]+)`)) ?? [])[1]?.trim();
const norm = (s) => s?.replace(/["']/g, '').replace(/\s+/g, ' ').toLowerCase();
const PAIRS = [['mt-blue','color.brand.primary'],['mt-cyan','color.brand.signature'],['mt-amber','color.brand.highlight'],['mt-mist','color.brand.tint'],['mt-success','color.brand.accent'],['mt-warning','color.status.warn'],['mt-danger','color.status.danger'],['mt-gray-bg','color.surface.bg'],['mt-midnight','color.ink.strong'],['mt-slate','color.ink.muted'],['mt-silver-light','color.border.subtle'],['mt-font','font.family.sans'],['mt-font-mono','font.family.mono']];
test('the Loom brand profile projects the Meridian skill tokens exactly', () => {
  for (const [c, d] of PAIRS) assert.equal(norm(t(d)), norm(v(c)), `${c} vs ${d}`);
});
```
  First read `meridian-trust.design.md`'s token syntax and adjust `t()` to match it (YAML front-matter vs a table); keep the assertion. Run → FAILS on `mt-font` only.
- [ ] **Step 2: Fix the projection** — set design.md's `font.family.sans` to `"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif` (the skill is the source of truth). From H: `node --test discovery/render/*.test.mjs` passes; `node scripts/discovery-sync-check.mjs --record`; commit the ledger.
- [ ] **Step 3: Run** → passes. **Commit** `meridian: a test binds the brand skill to the Loom's brand profile; font stacks agree`.

### Task K2: SKILL.md is a skill; the reference material moves to references/

**Files:** `meridian-brand-guidelines/SKILL.md`; create `references/{accessibility.md, slides-and-documents.md, icons.md}`; `meridian-business-case/references/business-case-slides.md:21`.

- [ ] **Step 1: Failing check** — add to `scripts/meridian-brand-parity.test.mjs`:
```js
test('the brand SKILL.md stays a skill (≤ 1,200 words) and names its references', () => {
  const s = readFileSync('plugins/middleleap-loom-demo/skills/meridian-brand-guidelines/SKILL.md', 'utf8');
  assert.ok(s.split(/\s+/).length <= 1200, `${s.split(/\s+/).length} words`);
  for (const r of ['accessibility', 'slides-and-documents', 'icons']) assert.match(s, new RegExp(`references/${r}\\.md`));
});
```
  Run → FAILS (≈3,000 words).
- [ ] **Step 2: Move sections verbatim** — Accessibility (l.92–111) → `references/accessibility.md`; Size hierarchy, Slide layout, layout types, Title/Section Divider, Content slides, PPTX template usage, Documents (DOCX/PDF) → `references/slides-and-documents.md` (keep the heading "Title/Section Divider Slides" unchanged); the Icon system (l.242–352) → `references/icons.md` with a first line: "**No icon files ship with this plugin.** This is the specification for creating Meridian-style icons if an institution supplies or commissions them. `#0B5A93` is a legacy icon blue; new icons use Meridian Blue `#0B4F80`." In SKILL.md, each moved section becomes one line: "**<Section>** — `references/<file>.md`".
- [ ] **Step 3: Repoint** `business-case-slides.md:21` to "(see `meridian-brand-guidelines` → `references/slides-and-documents.md`, Title/Section Divider Slides)".
- [ ] **Step 4: Verify** — test passes; `wc -w SKILL.md` ≤ 1,200; the demo eval still passes if you choose to run it (`claude plugin eval ./plugins/middleleap-loom-demo --trust-plugin --max-cost-usd 3 --no-publish`, paid, optional — say whether you ran it).
- [ ] **Step 5: Commit** `meridian-brand-guidelines: SKILL.md is the brand's rules; tables, slides and icons move to references/`.

### Task K3: Bump and PR

- [ ] Bumps: loom-demo patch; loom patch (design.md changed) + upgrade note (`notes`: "The Meridian brand profile's sans font stack now matches the brand skill (adds Helvetica Neue, Helvetica)."; `action_required`: []). Verification block. PR "Deferred WP-K: Meridian brand skill".

---

## Declined in this plan (with evidence)

- **C4 — move `demo/` and the 25 `*-example/` fixture dirs out of the installable skill.** ≈30 readers depend on them by harness-relative path: CI's dry-run (`$H/…-example`), `run-demo.mjs`, `demo/meridian/mount.mjs`, `apps/loom-console/src/demo.mjs:10-22`, and ≈20 tests. They are never installed into adopters and never loaded into a model's context; the only cost is install size. The move would touch every reader for no behavioural gain. Revisit only if install size becomes a user complaint.
- **C10 (part) — validator check that referenced files exist.** As specified it reports 206 misses today, nearly all paths in an adopter's repository (`docs/governance/…`, `.claude/agents/…`) or illustrative examples. Task H3 documents the gap instead.
- **Moving the AlTareq colour tokens into `open-finance-uae/references/altareq-brand.md`.** That file is the regulatory canon and carries no hex values because the Standards own the exact design; the kit's tokens are prototyping values, unverified against the Standards. Moving them would give them authority they do not have.
