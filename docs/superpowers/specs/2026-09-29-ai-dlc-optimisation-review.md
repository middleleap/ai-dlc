# AI DLC optimisation review — 29 September 2026

Verified findings from a full review of the marketplace at commit f454631 (main). Four
parallel reviewers covered the Loom core skills and agents, the loom-adopt harness bundle, the
two UAE domain plugins, and the demo plugin, console, scripts, CI and docs. Every finding below
was spot-checked against the tree. This document is the spec for
`docs/superpowers/plans/2026-09-29-ai-dlc-optimisation.md`.

## State of the repository

Mechanics pass: `validate-marketplace.mjs` OK, `deidentify-check.mjs` OK (3 allowlisted),
console suite 15/15, scripts suites 32/32, harness suite 2,548/2,548, hooks 14/14. All
cross-references in the Loom canon (HG-0001–0014, D1–D9, Q1–Q5, references, scripts) resolve.
Always-on token cost with all four plugins installed: ~4.7k per session (`claude plugin details`).

## Findings

### A. Wrong today (release, correctness, exposure)

- A1. `middleleap-loom` is at 2.5.2 (set in 02b2583) but c771f8a and 97cf51a change the plugin
  (97cf51a deletes `harness/scripts/console-data.mjs`). Installed users never receive them.
  The validator cannot detect content changed without a bump.
- A2. `plugins/middleleap-loom/.claude-plugin/plugin.json` declares `middleleap-loom-demo` as a
  dependency; Claude Code honours it (local `installed_plugins.json` shows all four installed
  together). Every real bank receives the fictional Meridian brand and a business-case skill
  whose description fires on plain "business case / NPV / sign-off / project proposal".
- A3. `agents/change-watch.md:8,36`, `agents/risk-reviewer.md:8,12`,
  `agents/model-risk-reviewer.md:10-11` cite `skills/loom/references/...` — a path that exists
  neither in an adopted repo nor relative to the user's cwd. `.mcp.json` shows the right form:
  `${CLAUDE_PLUGIN_ROOT}/skills/...`.
- A4. `skills/loom-adopt/SKILL.md`: step 7 (line 402) says step 3 told you to edit
  `pii-guard.sh`; step 3 (line 264) says never edit it. Lines 63–69 carry marker counts
  (133/28, 12/9, 44/16) that disagree with `adopt.mjs:21` ("200+ across 70+") and a real
  adoption. Line 198 says five plugin agents ship; six do.
- A5. `open-finance-uiux/SKILL.md:169-175` mandates "Al Tareq" (two words) and forbids the
  one-word form; the skill writes "Al Tareq" 181 times and "AlTareq" once. The canon
  (`open-finance-uae/references/altareq-brand.md`, 80× "AlTareq") and CLAUDE.md say the brand
  and button spelling is "AlTareq".
- A6. Open Finance freshness: `standards-versions.md:139` says API Hub v7 is current (skill says
  v8); `:462` still names errata2; the 16 Sep 2026 TPP regularisation deadline is written as
  upcoming in `SKILL.md:171`, `cbuae-regulations.md:67,124`, `implementation-roadmap.md:39`,
  `verification-log.md:35`. README (13 Jul), CLAUDE.md (17 Aug) and SKILL.md (14 Sep) carry
  three different "last verified" dates. `check_current.py` fails on macOS Python 3.9
  (`tuple[str,int] | None` evaluated annotations); works on 3.10+; nothing says so.
  `islamic-banking-uae` last verified 13 Jul 2026, before errata3 §3–5 (21 Aug) changed the
  Islamic fields.
- A7. Public-repo exposure (`gh repo view` → PUBLIC): `docs/plans/kosli-founder-demo-briefing.md`
  is headed "private" and names two real people; `docs/plans/loom-onboarding-browser-acceptance.md:6`
  publishes an owner-only preview URL on a personal domain; `docs/simulations/notion-e2e/*.mjs`
  read `.notion-token` from their directory and `.gitignore` does not cover it. The de-identify
  gate scans `plugins/` only. `open-finance-uiux/references/{INDEX,value-propositions}.md` keep
  "Maintained by … Slack #open-finance-ux" footers.
- A8. Loom README:227 "adds six skills and six agents — nothing always-on" is false: 14 skills
  via dependencies, plus the `loom-record` MCP server is always-on. README:181 says three hooks;
  four ship. Root README:14 "installs the three plugins it depends on".
- A9. CLAUDE.md:87 gives `node scripts/discovery-sync-check.mjs --record` (fails from repo
  root; the script is under the harness) and says "8 of 23" owe a port; the ledger says 23 of 26.

### B. Skills that load wrong (discovery, triggers, size)

- B1. `bank-risk-reviewer` and `uae-bank-risk-reviewer` are 87% identical (75 differing lines
  after stripping "UAE"/"CBUAE" tokens) with identical trigger clauses; the non-UAE one exists
  for one jurisdiction-mapping paragraph and five `../uae-bank-risk-reviewer/references/` paths.
- B2. `context-template` and `claude-md-guide` both fire on "improve an existing CLAUDE.md";
  the template body duplicates `claude-md-guide/references/patterns.md` almost line for line.
  `platform-tips.md:11` claims CLAUDE.md is re-sent on every tool call (false).
- B3. Workflow-summarising descriptions: `institution-intake` (994 chars), `brainkit-init`
  (881), `loom-adopt` (595) enumerate their steps or payload instead of stating triggers.
  `open-finance-uae`'s description hardcodes "current v2.1-final + errata3" and
  "Interaction Guide v5.0" (992/1024 chars).
- B4. Heavy loaders: `loom-adopt` ~14.9k tokens per invoke, ~2,900 words of which is the
  manifest-generated copy table whose `seam` strings are essays. `meridian-brand-guidelines`
  3,046 words (~7.8k tokens) incl. a 733-word icon library the plugin does not ship.
  `open-finance-uiux` ~220 KB of fenced HTML/SVG in markdown. Five Loom agents paste the same
  ~350-word output-contract block.
- B5. Changelog residue (rc.10…rc.39, WS ids, "since 2.1.0", "the 2.4 route", "hardening plan
  row 5.3") in `loom/SKILL.md:88,91,138,181`, `loom-adopt/SKILL.md:71-73,80-86,409-416`,
  `change-watch.md:13`, `risk-reviewer.md:18`, plugin README:137. `loom/SKILL.md` promises gate
  answers but names no gate inline.
- B6. `agents/discovery-boundary-reviewer.md:51` contradicts itself (`not-applicable` then
  `absent` + `INSUFFICIENT_EVIDENCE`).

### C. Bundle surface and maintenance

- C1. `copy-manifest.json` `scripts` glob `*.mjs` and `core` dir install 130 test files
  (1.65 MB, 31% of bundle) into every adopter; 17 read fixtures that are not installed.
- C2. The eight harness skills and three harness agents are outside the manifest ("still copied
  by hand", `loom-adopt/SKILL.md:179-180`): no stamp, no upgrade notes, no drift detection.
- C3. `governance/control-catalog.template.json:1153-1165` installs a `DISCOVERY-SYNC` control
  (lane pr, always true) naming `openfinance-os/ofbo` into every adopter; `ci/ci.yml:95` runs
  it; in an adopted tree it prints "nothing to verify". `ci-catalog-check.mjs` requires every
  gate ci.yml runs to be catalogued, so both must go together.
- C4. `demo/` (195 KB), 25 `*-example/` roots (~245 KB), `upgrade-notes.json` (114 KB) ship in
  the plugin but never install; `demo/meridian/README.md:4` cites the Kosli founder briefing.
- C5. `hooks/spec-tripwire.sh:73` uses `realpath -m` (GNU-only; macOS BSD realpath rejects it,
  falls back to the raw path). Lines 88–90 deny any Bash command naming the spec and containing
  a scripting runtime or `>`, which blocks read-only codegen on `claude/*` branches.
- C6. `skills/implement-story/SKILL.md:4` sets `disable-model-invocation: true` while
  `next-story/SKILL.md:37` says "follow the implement-story skill exactly"; next-story "never asks
  the user mid-iteration" vs implement-story step 2 "surface any genuine decision for the user";
  `/design` and `/design-sync` steps depend on commands the plugin does not provide.
  `discovery` and `develop` are the only harness skills without a red-flags section.
- C7. Harness evals (`agents/evals/`) cover three plugin agents, none of the three agents that
  ship in the bundle. The CLI now offers `claude plugin eval` (evals/**/case.yaml) with a
  no-plugin baseline arm; nothing in the repo uses it.
- C8. `.github/workflows/validate.yml` is 1,285 lines with ~830 lines of inline bash and 32
  inline `node -e` programs; CLAUDE.md lists four commands. `customer-demo-illustration.test.mjs`
  is not run by CI.
- C9. `docs/` has 59 tracked files, no index, two-thirds July-era planning marked DRAFT or
  proposed. Untracked strays: `.loomviz-tmp/` (2.2 MB), `Claude outputs/`, `docs/loom-website/`
  (links a tokens file that exists only in another repo), `plugins/middleleap-open-finance/`
  (empty rename leftover). `.gitignore` is five lines.
- C10. Validator gaps: no check for dependencies resolving, referenced files existing, plugin
  README presence, CONTRIBUTING's 1 MB ceiling (Loom is 5.5 MB), or content-without-bump.

## Scope of the plan

The plan implements A1–A9, B1–B3, B5–B6, C1–C3, C5–C7 and the version-bump validator check
from C10, as five independently mergeable work packages. B4 (uiux restructure, brand-guidelines
slimming, copy-table rationale trimming, agent-contract dedupe), C4, C8, C9 and the rest of C10
are deferred to separate plans; each is a self-contained refactor with its own tests.
