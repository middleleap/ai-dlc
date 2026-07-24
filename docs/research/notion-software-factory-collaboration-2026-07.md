# Notion & the "Software Factory" — a teammate-collaboration layer for the Loom (2026-07)

> **Purpose.** Assess how **Notion** — and the **"software factory"** idea it has come to embody — could
> support the Loom's harness as a place where *teammates collaborate*: humans coordinating around a
> governed AI build, and a fleet of coding agents coordinating with each other. Written to inform
> where **The Loom** invests next on the collaboration edge it currently leaves unbuilt.
>
> **Method.** Two parallel research streams synthesized into one map: (1) a code-level exploration of
> the Loom harness — its artifacts, gates, identity model, and the exact places humans and agents
> touch it; (2) external web research on Notion's product, its 2025–2026 agent platform, its API/MCP
> surface, and the "software factory" concept. Every Loom claim below is grounded in a cited repo
> path verified against source. Every Notion claim carries a dated release or source URL and a
> confidence rating. Read the [Caveats](#caveats--how-much-to-trust-this) before relying on specifics.
>
> **Date of research:** 2026-07-24. **Companion:** `docs/research/ai-dlc-harness-landscape-2026-07.md`
> (the competitive harness scan this doc extends into the collaboration dimension).
> **Visualization:** [`docs/loom-factory-floor.html`](../loom-factory-floor.html) — the interactive,
> brand-styled companion page (open it in a browser).

---

## TL;DR — the big picture

1. **"Software factory" has two meanings, and Notion sits on the newer one.** The classic sense is
   *industrial manufacturing principles applied to software* (assemble from components, quality
   checkpoints). The 2025–2026 AI-native sense — Factory.ai, and Notion's own internal practice — is
   **the coordination system around fleets of agents**: *agents produce the work; humans design the
   system those agents operate in; a shared database is the coordination substrate.* That framing is a
   near-exact echo of the Loom's own governing principle — **"AI proposes; humans and a protected
   control plane dispose"** (`skills/loom/references/governance.md`).

2. **The Loom's teammate-collaboration surface is genuinely greenfield.** Today, multi-human
   collaboration is expressed *only* as governed files in git + GitHub PRs. There is no shared board,
   no per-role inbox for the 12-role PA1/PA2 approval spine, no discussion threads bound to a
   governance artifact, no co-authoring surface for discovery, and the autonomous loop escalates to a
   single "**the user**." A repo-wide search finds **no Notion/Jira/Linear/Confluence/kanban
   integration** — this layer is deliberately unbuilt (`skills/loom/references/enterprise-rings.md`
   scopes it out as adopter-side).

3. **Notion just shipped the exact seam this needs.** Notion **3.5's Developer Platform (May 2026)**
   turned the workspace into a "hub for AI agents" — Workers + webhooks, an **External Agent API**,
   and **partner-agent support that names Claude Code** (alongside Cursor, Codex, Decagon). Combined
   with a headless-capable API/MCP and native human-in-the-loop **approval pages**, Notion is now a
   *deliberate* humans-plus-agents surface, not an incidental one.

4. **But the Loom's discipline forbids the naïve version.** The live roadmap
   (`docs/loom-control-plane-plan.md`) is blunt: *stop adding gates*, and beware anything that
   "increases the *appearance* of control faster than actual control." Platform state must be
   **observed, not declared**. So Notion enters as a **projection + a collaboration surface**, never
   as a system of record and never as a green control on its own say-so.

**The wedge.** *Git stays the system of record; Notion becomes the factory floor — the board, the
inbox, and the discussion humans and agents share — and any decision made there round-trips back into
the Loom as a **signed evidence envelope** through the existing adapter contract, tied to a named
control.* That keeps the core vendor-neutral and the governance honest.

---

## 1 · "Software factory" — what the term means, and why it fits the Loom

### 1.1 The classic sense (decades old)
**Confidence: HIGH.**

A "software factory" applies **industrial manufacturing principles to software production** —
standardized processes, reusable components, quality checkpoints, assembly-line output. The idea
traces to the **1968 NATO Conference on Software Engineering** (GE's Robert Bemer proposed a
"controlled, machine-assisted environment"); in the 1980s–90s **NEC, Hitachi, and Fujitsu** built
literal software factories. The defining move: *assemble from predefined components rather than
hand-code everything.*

*Source:* [Wikipedia — Software factory](https://en.wikipedia.org/wiki/Software_factory).

### 1.2 The AI-native reframing (2025–2026) — the coordination system, not the coder
**Confidence: MEDIUM** (vendor/practitioner framing, well-corroborated).

The term was revived by the AI coding-agent industry. **Factory.ai** ("Factory 2.0") is the clearest
articulation: the individual coding agent is the *unit*, and the "software factory" is the
**interconnected, agent-native, end-to-end system** connecting those units — signals from the outside
world get *triaged → planned → built → tested → reviewed → secured → shipped → monitored* by
coordinated agents, with humans **designing and overseeing the system**.

*Sources:* [Factory.ai — software factory](https://factory.ai/news/software-factory) ·
[Addy Osmani — the Factory Model](https://addyosmani.com/blog/factory-model/) ·
[mager.co — the software factory](https://www.mager.co/blog/2026-03-19-software-factory/).

### 1.3 Notion's own framing — "Token Town"
**Confidence: MEDIUM** (single podcast primary + secondary write-ups; framing, not a shipped product).

Notion does **not** sell a product literally named "software factory." The term describes (a) **how
Notion builds its own product internally** with fleets of agents, and (b) an industry vision Notion
positions its workspace to *host*. Co-founder/head-of-AI **Simon Last** and AI-eng manager **Sarah
Sachs** (Latent Space, *"Notion's Token Town … the Software Factory Future"*) describe:

- **The definition:** agents produce the code/work; **humans design the system the agents operate
  within** — the engineer's job shifts to *system design, error handling, workflow orchestration*.
- **Notion rebuilt its agent harness ~5 times** before shipping Custom Agents; the platform runs
  **100+ tools serving 30+ internal agents** with progressive-disclosure tool selection.
- **Architectural lessons:** abandon proprietary data models for **formats AI already understands** —
  SQLite-style queries over a custom JSON API, **Notion-flavored Markdown** over block JSON; **formal
  tool definitions** over few-shot prompting.
- **The coordination pattern:** *agents write tasks to a database that other agents listen to*, or
  call each other via **webhooks** — i.e., **Notion databases as the coordination substrate**.

*Sources:* [Latent Space — Notion's Token Town](https://www.latent.space/p/notion) ·
[Podwise summary](https://podwise.ai/episodes/7761465).

### 1.4 Why this fits the Loom
The Loom's metaphor is already a factory: **warp** = always-on controls; **harnesses** = discovery +
delivery; **shuttle** = the AI agents "the harness pulls in to weave continuously"; **cloth** =
shipped, audit-ready software (`skills/loom/SKILL.md:19-25`). And its double diamond is the
factory's flow line — *discover → define → develop → deliver*, closed into a loop by Run/Operations
(`SKILL.md:37-46`). The one thing the metaphor never named is the **floor** — the shared surface where
the humans and shuttles actually see each other's work, hand off, and sign off. That is exactly what
"software factory" tooling supplies, and exactly what Notion has built toward.

> **Framing to adopt.** Position Notion not as "a tool the Loom integrates" but as **the factory
> floor**: the Loom is the machinery and the controls; Notion is where teammates (human and agent)
> stand around it. "Software factory" = the *coordination system*, so Notion **complements** the loom,
> it does not replace any thread of it.

---

## 2 · Notion as a collaboration substrate — the primitives that matter

**Confidence: HIGH** (Notion help/dev docs, corroborated).

Notion is a **connected workspace** where roadmaps, PRDs, specs, sprint boards, and docs live together
and link through shared databases. The primitives a Loom integration would build on:

- **Databases → data sources.** The core structured primitive (rows = pages with typed properties).
  As of API **2025-09-03**, a database is a *container of one or more data sources*, each with its own
  schema — a **breaking change** that matters for any automation (page creation now parents to a
  `data_source_id`). [upgrade FAQ](https://developers.notion.com/docs/upgrade-faqs-2025-09-03)
- **Relations + rollups.** Link items across databases (roadmap ↔ PRD ↔ task) and aggregate — the
  mechanism that would tie a Loom *change* to its *approvals*, *evidence*, and *backlog items*.
- **Typed properties** (status, select, people, date, formula) — the fields that carry state.
  [database properties](https://www.notion.com/help/database-properties)
- **Views** — table, **board (kanban)**, list, timeline, calendar over the *same* data (one dataset,
  many role-specific lenses).
- **Comments + @mentions** — in-context threaded discussion; `@` tags people/pages/dates, driving
  notifications and backlinks. The async-discussion primitive the Loom lacks.
- **Permissions / sharing** — four tiers (**Full Access / Can Edit / Can Comment / Can View**),
  page-level and **granular database** permissions, real-time co-editing.
  [sharing & permissions](https://www.notion.com/help/sharing-and-permissions)

Notion markets these for engineering directly — [engineering roadmaps](https://www.notion.com/use-case/project-management/engineering-roadmap),
[sprint planning](https://www.notion.com/help/guides/product-engineering-notion-sprint-planning),
[tech specs/PRDs](https://www.notion.com/use-case/project-management/how-to-write-a-tech-spec).

### 2.1 The agent stack (the "workers")
**Confidence: HIGH** on existence/dates; **MEDIUM** on capability specifics.

- **Notion 3.0 — Agents (18 Sep 2025).** Autonomous agents that work **up to ~20 minutes across
  hundreds of pages**, take the same actions as a user (create docs/databases, run multi-step
  workflows, assign tasks), hold **user-editable memory**, and pull context from the workspace,
  connected tools (Slack/Drive/GitHub), and the web — always within permissions.
  [release](https://www.notion.com/releases/2025-09-18) ·
  [TechCrunch](https://techcrunch.com/2025/09/18/notion-launches-agents-for-data-analysis-and-task-automation/)
- **Notion 3.3 — Custom Agents (24 Feb 2026).** Persistent, **named agents that live in a workspace**,
  run on **schedules or event triggers** ("when a page is added to this database"), hold a skill set,
  and **write results back into databases** — positioned as "AI teammates" running 24/7.
  **Business/Enterprise only; priced in Notion credits.** (~21k built in beta; 1M+ by May 2026.)
  [release](https://www.notion.com/releases/2026-02-24)
- **AI Connectors / Enterprise Search.** Cross-platform cited answers across Google, Slack,
  **GitHub, Jira, Linear**, Teams, SharePoint (some beta; Business/Enterprise).
  [AI connectors](https://www.notion.com/help/notion-ai-connectors)

### 2.2 The programmatic surface — can a headless harness read/write Notion?
**Confidence: HIGH.** This distinction decides whether Notion can be *durable shared state* for an
autonomous agent, and it is the single most important operational fact here.

| Path | Auth | Headless? | Granularity | Best for |
|---|---|---|---|---|
| **REST API** (2025-09-03) | integration token | **Yes** | full (pages, data sources, blocks, comments) | the Loom's automated read/write |
| **Self-hosted MCP** (`makenotion/notion-mcp-server`) | integration token; HTTP + bearer | **Yes** (~22 tools, Markdown blocks) | block-level | agent-in-loop writes without a human present |
| **Hosted (remote) MCP** | OAuth, **human present** | **No** (page-level; ~18 search/retrieve tools) | page-level | interactive, human-present sessions |

Notion's **hosted MCP is explicitly *not* designed for headless/cloud agentic workflows**; the **REST
API with an integration token** (or the self-hosted MCP) is the reliable path for the Loom to
read/write Notion without a human in the loop.
[hosted MCP overview](https://developers.notion.com/guides/mcp/overview) ·
[self-hosted server](https://github.com/makenotion/notion-mcp-server).

### 2.3 The May-2026 turn — Notion as a humans-plus-agents hub
**Confidence: HIGH** on existence; specifics from dated release + press.

**Notion 3.5 — Developer Platform (13 May 2026)** made the workspace an explicit **AI orchestration
layer** where people *and third-party agents* collaborate across tools and databases:

- **Workers** — cloud runtime for custom code; each Worker has a **webhook URL**.
- **Database sync** — pull live data from any API-enabled external source.
- **External Agent API** — lets **outside AI agents operate inside the workspace**.
- **Partner agent support** — assign and **track third-party agents**; launch partners **explicitly
  include Claude Code, Cursor, Codex, and Decagon**.
- **Native human-in-the-loop:** agents **request approval on sensitive steps** and can **create an
  approval page with a recommendation** teammates approve/reject in Notion; a PR-review agent creates
  approval gates before destructive actions.

*Sources:* [release](https://www.notion.com/releases/2026-05-13) ·
[TechCrunch](https://techcrunch.com/2026/05/13/notion-just-turned-its-workspace-into-a-hub-for-ai-agents/)
· [GitHub connector](https://www.notion.com/help/notion-ai-connector-for-github).

---

## 3 · The Loom's collaboration model today — and its gaps

**Confidence: HIGH** (all claims grounded in repo paths).

The Loom is git/GitHub-native and file-based. **Multi-human collaboration is expressed entirely as
governed file state validated by gates** — there is no board, ticket, inbox, or shared workspace.

**Where the cast is named.** `harness/governance/identities.template.json` is the collaboration
roster: disjoint groups (`builders`, `second-line`, `platform-admins`) and ~14 named roles
(engineering, product-owner, risk-second-line, compliance, legal, operations, information-security,
credit-risk, model-validator, data-protection, accountable-executive, institutional-context-owner,
platform-admin) plus the agent identity `agent-loom-delivery` (a *builder* that **holds no approval
role**). Every approver field in every governance file must resolve against this registry
(`scripts/identity-registry-check.mjs`).

**Where approvals/handoffs actually live** (all files in git):

- **Four-eyes merge (HG-0001)** — GitHub branch protection + `CODEOWNERS`. The agent opens a PR and
  stops; a human outside the agent's group merges.
- **The discovery→delivery hand-off** — `discovery/runs/<slug>/handoff.md`, gate-green, linked from
  `docs/backlog.yaml`. The one explicit cross-team boundary object — a markdown file.
- **PA1 / PA2 product approvals** — `docs/governance/changes/<id>/product-passport.json`, the richest
  multi-human artifact. In the worked example, PA1 carries three recorded approvals (`po-fatima`
  product-owner, `risk-lena` risk-second-line, `exec-rashid` accountable-executive), each `by` + `at`;
  a high-risk `control-plan.json` compiles **12 required approver roles**. Today these are **hand-edited
  into JSON.** (`harness/change-example/product-passport.json`, `control-plan.json`.)
- **The second-line release hold** — `release-hold.json`, set to `released` by a second-line human;
  missing = HELD (fails closed).
- **The triage queue** — `operations-signal.json`, every signal typed, severity-rated, and routed.
- **The agent's reasoning** — `decision-log.json`, an append-only hash chain.

**How the loop talks to humans — thinly.** Per `harness/skills/next-story/SKILL.md`, the loop **never
asks the user mid-iteration** (a needed human decision becomes a `blocked` backlog item); escalation
is a **single push notification to "the user"** (singular) at iteration end — PR ready, milestone
done, queue empty-but-blocked, or item failed twice. There is **no routing to *which* human, no
per-role inbox, no board reflecting state.** The backlog is a flat `docs/backlog.yaml`.

**The named gaps a collaboration surface would fill:**

| Gap | Today | What's missing |
|---|---|---|
| No shared board | `docs/backlog.yaml` + scattered JSON | a view teammates watch; swimlanes by role; "what's waiting on me" |
| No approver routing | PA1/PA2 hand-edited into JSON | notify Lena (Risk)/Imran (Compliance) that a passport awaits them; track who blocks |
| No discussion threads | GitHub PR comments, detached from governance artifacts | in-context threads on the passport/change/handoff |
| No co-authoring | discovery artifacts are markdown files | facilitator + stakeholders co-edit; the D9 stakeholder-reaction is a human moment stored as a file |
| No MI/board view | evidence is JSON assembled by hand | a standing management-information pack from the sealed bundle |
| Single-operator model | notifications assume one "user" | a team with distinct roles and queues |

The macro/enterprise ring — "make the whole company queryable," organisational topology, embedded
risk/legal pods — is **explicitly out of scope** (`references/enterprise-rings.md`: "*The Loom does
not ship an operating model*"). So the collaboration layer is left open *by design* — a seam, not an
oversight.

---

## 4 · The integration architecture

### 4.1 The governing principle (read this first)

Any Notion integration must obey four rules, or it manufactures the "appearance of control" the
roadmap warns against (`docs/loom-control-plane-plan.md`):

1. **Git stays the system of record.** Notion is a **projection** of governed files and a **surface**
   for human collaboration — never the authoritative store. Every fact the gates trust lives in the
   repo.
2. **Decisions round-trip as signed evidence.** A human approval or sign-off captured in Notion only
   *counts* once it becomes a **signed evidence envelope** through the existing **adapter contract**
   (`harness/adapters/README.md`), tied to a named catalog control. The gates read envelopes, never a
   vendor payload.
3. **Observed, not declared.** A Notion status is not a green control on its own. It follows the
   precedent already in the bundle — the **platform-activation observation**
   (`harness/platform-activation-example/github-branch-protection.json`): a live read + a
   **bypass test**, signed by an **observer identity outside the coding agent's authority**, freshly
   timestamped. Absent that, the adapter is "**declared, not active**."
4. **Identities resolve; agents approve nothing.** Every Notion approver maps to a registry identity
   holding the role (`identities.json`); `agent-loom-delivery` and any Notion agent hold **no approval
   authority** (HG-0001, the four-eyes line).
5. **The round-trip lands as a PR, not a write.** An approval envelope enters `docs/governance/`
   through a pull request merged under CODEOWNERS — those paths are second-line-owned — so neither
   the coding agent nor the sync worker can place an approval into the governance tree unilaterally.
   The sync identity registers in `identities.json` as a builder-class identity holding no approval
   role; the control plane stays immutable to it (HG-0002).

> **Pattern to adopt.** Model Notion exactly like the existing **GRC / branch-protection adapters**
> (`harness/adapters/reference/*.json`): `system: "notion"`, `satisfies_control: "HG-0001"` (or a PA
> gate), an `evidence.kind` (e.g. `approval-attestation`), and an `activation_evidence` filled from a
> real API read + a signature. A Notion approval becomes *evidence about* an approval, not the
> approval itself — same seam, new vendor dialect.

### 4.2 Dimension A — human-teammate collaboration
**The "teammates" half.** Notion renders the Loom's governed files as the board, inbox, and threads
the harness lacks:

- **A board over the backlog.** Sync `docs/backlog.yaml` → a Notion database with **board/timeline
  views** and **role swimlanes**. Status stays authored in git; Notion shows it and adds "what's
  waiting on me."
- **Approver routing for the PA1/PA2 spine.** Project `product-passport.json` into an **approvals
  database** with **people-properties** per required role; use Notion's **approval pages** +
  **@mention notifications** so each of the 12 roles is actively told a passport awaits them and the
  system tracks who blocks. The *decision* still round-trips into `product-passport.json` (git) as
  signed evidence (§4.1).
- **Discussion bound to the artifact.** Notion **comments/@mentions** on the change/passport/handoff
  give the async review thread that today only exists, detached, in PR comments.
- **Co-authoring discovery.** Problem-statement, synthesis, handoff, and **stakeholder-reaction**
  become co-editable Notion pages — the D9 reaction step becomes a real multi-person moment, then
  exports back **by PR** to the gated markdown the renderer expects; the D-gates re-run on the
  export, so evidence traceability (D2) binds to the committed artifact, not the Notion draft.
- **A standing MI view.** Rollups over the sealed evidence bundle become the "MI pack" the
  governance-and-accountability runbook calls for — assembled continuously, not by hand.

### 4.3 Dimension B — multi-agent factory orchestration
**The "factory" half.** Notion becomes the shared task queue Notion itself uses internally
(`agents write tasks to a database other agents listen to`):

- **A Notion database as the shared work view** for a fleet of coding agents — mirroring, and
  *proposing into*, the Loom's `next-story` / `develop` loop. The authoritative queue stays
  `docs/backlog.yaml` behind the **waist gate** (`discovery-link-check`, HG-0007): a Notion card
  becomes a backlog item only through a PR, and it is never a hand-off — feature entry still
  requires the gate-green `handoff.md`. With **Claude Code a *named* Notion 3.5 partner agent**,
  the mirror is a first-class supported pattern, not a hack.
- **Webhooks + Workers as assembly-line events** — "page added to the delivery DB" triggers a build
  agent; "PR ready" flips a status a human watches.
- **Humans strictly at the gates.** The graduated-autonomy boundary (HG-0013 — "the PR is the light
  switch") is preserved: agents coordinate freely *up to proposal*; disposal stays human, enforced by
  git, evidenced back through the adapter.

> **Caveat for Dimension B.** Notion is the *coordination view*, not the merge authority. Auto-merge
> and control-plane enforcement remain in GitHub branch protection + the routine controller; Notion
> must never be able to move a change to `in-production` — that authority lives in `release-hold.json`
> under second-line CODEOWNERS.

---

## 5 · The artifact-by-artifact crosswalk

How each Loom artifact maps to Notion, what collaboration it unlocks, and how a decision made in
Notion returns to the harness as trusted evidence.

| Loom artifact (git, source of truth) | Notion representation | Collaboration unlocked | Evidence round-trip |
|---|---|---|---|
| `docs/backlog.yaml` | Board/timeline database, role swimlanes | Shared "what's next / waiting on me" | Read-only projection — no round-trip needed |
| `product-passport.json` (PA1/PA2) | Approvals DB + **approval pages**, people-property per role | Routed sign-off across the 12-role spine; who's blocking | **Signed `approval-attestation` envelope** → PA gate; identity must resolve |
| `change-envelope.json` | Change record page (state, tier, classifier) | One place to watch a change move states | Classification stays human-set in git; Notion mirrors |
| `release-hold.json` | Second-line "release gate" property | Visible go/no-go for the launch decision | **Never** writable from Notion; git + CODEOWNERS only |
| `handoff.md` + discovery artifacts | Co-authored discovery pages | Facilitator + stakeholders co-edit; D9 reactions in-place | Export back to gated markdown; renderer + D-gates unchanged |
| `operations-signal.json` | Triage queue (board) | Team triages incidents/drift/CVEs together | Route/decision returns to the signal log (git) |
| `identities.template.json` | Workspace roster / role mapping | Human-readable "who approves what" | Registry stays canonical in git; Notion reflects roles |
| `decision-log.json` | Agent activity feed | Teammates *see* what the agent decided and why | Read-only; the hash chain stays in git |
| Sealed evidence bundle | Rollup MI dashboard | Board/second-line management information | Read-only projection of the sealed manifest |

The pattern is uniform: **Notion never owns the truth; it renders it and hosts the human
conversation, and where a human *decides*, that decision comes home as a signed envelope.**

---

## 6 · A phased adoption path

Deliberately staged so value lands before any governance risk, and nothing becomes a "gate" before
the control-plane foundations the roadmap is fixing are in place.

- **Phase 0 — Read-only projection (zero governance risk).** A Worker (or a small script using the
  REST API + integration token) mirrors `docs/backlog.yaml`, `change-envelope.json`, and the decision
  log into Notion databases/views. One-way, git → Notion. Teammates get a board and an activity feed;
  the harness is untouched. *This is the low-regret first move.*
- **Phase 1 — Human-approval round-trip.** Add a **Notion adapter** (`docs/governance/adapters/
  notion-approvals.json`) that maps a Notion **approval page** → a **signed `approval-attestation`
  envelope** for a PA gate / HG-0001, **observed and bypass-tested** like the platform-activation
  precedent. Approvers act in Notion; the gate still reads the git envelope. Ship it "**declared, not
  active**" until the first real signed fetch.
- **Phase 2 — Agent-orchestration mirror.** A Notion delivery database (via webhooks/Workers) mirrors
  `next-story` and lets teammates propose work; proposals enter `docs/backlog.yaml` by PR, and feature
  entry still requires a gate-green hand-off — **the waist gate is never bypassed**. Claude Code
  participates as a **named partner agent**. Humans remain at the merge/launch gates.
- **Phase 3 — Continuous-assurance MI + signal intake.** Operations-signal triage and the MI rollup
  close the loop back to Discovery — the Notion board becomes the standing management view over the
  sealed evidence.

Each phase names its control tie-in and states honestly whether it is *declared* or *active*.

---

## 7 · Risks & caveats

- **The appearance-of-control trap (highest).** A pretty Notion board can *look* like governance while
  the real controls sit elsewhere. Mitigation: §4.1 — git is truth, decisions round-trip as signed
  evidence, nothing is green on Notion's say-so.
- **Comprehension-debt acceleration.** The method's own Limits name four-eyes decaying into ceremony
  as its standing risk — "whether the human at the gate is still reading … not yet measure[d]"
  (`skills/loom/SKILL.md`). A one-click Notion approval makes rubber-stamping *easier*, not harder.
  Mitigation: the approval page must carry the evidence into the approver's view — the change summary,
  gate results, and the relevant decision-log excerpt — so routing increases *reading*, not just
  throughput.
- **Data residency & PII (HG-0011 + `hooks/pii-guard.sh`).** Pushing regulated governance state
  (customer categories, risk ratings, named approvers) into a SaaS workspace is a **real control
  question** for a CBUAE-regulated adopter — onshore-gateway/DLP expectations apply. A projection
  should carry **references and status, not personal data**; treat the residency review as a gate on
  adoption, not an afterthought.
- **Notion-as-system-of-record temptation.** The moment a team edits truth in Notion first, the
  evidence chain breaks. The integration must stay a projection with an explicit round-trip.
- **API breaking change (2025-09-03).** The data-source model is not backward compatible; any
  integration must target `data_source_id`, and Notion has signalled it may **sunset the self-hosted
  MCP** in favour of the hosted one — pin to the REST API for durability.
- **Hosted MCP is not headless.** Autonomous Loom writes need the **REST API + integration token**;
  the hosted MCP is for interactive, human-present sessions only.
- **Cost / tier.** Custom Agents and AI Connectors are **Business/Enterprise only**, priced in Notion
  credits — a per-adopter cost, not free machinery.
- **Source reliability.** Notion ships fast and several primary pages block automated fetch; the
  Notion specifics here rest on **dated releases confirmed via search summaries + secondary press**,
  not raw-page reads. **Re-verify capability details before building.**

---

## 8 · Recommendation — where the Loom invests next

The collaboration edge is the Loom's clearest *unclaimed adjacency*: the harness already produces
every artifact a team needs to collaborate around, and Notion has — as of May 2026 — built the exact
humans-plus-agents seam to host it, naming Claude Code a partner agent. The competitive scan
(`ai-dlc-harness-landscape-2026-07.md`) found the field converging on the Loom's *control* framing;
this is the parallel opportunity on the *collaboration* framing.

**The low-regret move is Phase 0 + a documented Notion adapter shape** — a read-only git→Notion
projection (board + activity feed + MI view) plus a written `notion-approvals` adapter spec that
follows the observed-not-declared precedent. It delivers the teammate board and factory-floor view
immediately, proves the round-trip design on paper, and adds **no new gate** before the control-plane
foundations land — exactly the discipline the current roadmap demands.

Two boundary rules keep this the Loom's shape. **The collaboration surface is itself a seam
(HG-0008):** the crosswalk in §5 is vendor-neutral — Notion is its *reference instantiation* the way
GitHub is the reference instantiation of branch protection; the same mapping should be realizable on
Jira, Linear, or Confluence without the core ever learning a vendor's API. And **the sync machinery
is adopter-side wiring**, like every adapter's fetch-and-sign step — the bundle ships at most the
reference mapping and the documented envelope kind, never a Notion client, preserving the harness's
zero-dependency core and the enterprise-rings boundary (the macro-ring "enterprise hub" remains the
adopter's, not the Loom's).

> **One-line positioning.** *Git is the loom; Notion is the factory floor — teammates and agents
> coordinate there, and every decision they make comes home to the Loom as signed evidence.*

---

## Caveats — how much to trust this

- **Loom-side claims are HIGH confidence** — each is grounded in a repo path verified against source
  at `origin/main` state during this research (metaphor `SKILL.md:19-25`; principle
  `governance.md`; PA spine `change-example/product-passport.json` + `control-plan.json`;
  single-operator model `next-story/SKILL.md`; observed-not-declared `platform-activation-example/`).
- **Notion-side claims** range HIGH (dated releases with a primary URL) to MEDIUM (framing/positioning
  from a podcast or vendor blog). Distinguish **Notion's official capabilities** (§2) from **industry
  concepts** (§1.1–1.2) before quoting.
- **Fetch reliability:** Notion's own domains and several publishers block automated fetch, so verbatim
  confirmation leaned on **search-summary reproduction + multi-source corroboration**. Verify exact
  quotes against the primary source before citing externally.
- **Time-sensitivity is high.** Notion 3.0 → 3.5 shipped inside ~8 months; the API had a breaking
  change; the self-hosted MCP may be sunset. **Re-verify before relying on specifics.**
- **This is a design map, not a committed build.** No harness code changes accompany it; the phased
  path and adapter shape are proposals for the maintainer to weigh against the roadmap's "stop adding
  gates" discipline.

---

## Sources

**Notion — primary**
- Notion 3.0 Agents (18 Sep 2025) — https://www.notion.com/releases/2025-09-18
- Notion 3.3 Custom Agents (24 Feb 2026) — https://www.notion.com/releases/2026-02-24
- Notion 3.5 Developer Platform (13 May 2026) — https://www.notion.com/releases/2026-05-13
- Hosted MCP overview — https://developers.notion.com/guides/mcp/overview
- API upgrade FAQ (2025-09-03 data sources) — https://developers.notion.com/docs/upgrade-faqs-2025-09-03
- Sharing & permissions — https://www.notion.com/help/sharing-and-permissions
- Database properties — https://www.notion.com/help/database-properties
- AI connectors — https://www.notion.com/help/notion-ai-connectors
- GitHub connector — https://www.notion.com/help/notion-ai-connector-for-github
- `makenotion/notion-mcp-server` — https://github.com/makenotion/notion-mcp-server

**"Software factory" — industry**
- Wikipedia — Software factory — https://en.wikipedia.org/wiki/Software_factory
- Factory.ai — software factory — https://factory.ai/news/software-factory
- Addy Osmani — the Factory Model — https://addyosmani.com/blog/factory-model/
- Latent Space — Notion's Token Town — https://www.latent.space/p/notion

**Corroborating press**
- TechCrunch — Notion launches Agents (18 Sep 2025) — https://techcrunch.com/2025/09/18/notion-launches-agents-for-data-analysis-and-task-automation/
- TechCrunch — Notion turns its workspace into a hub for AI agents (13 May 2026) — https://techcrunch.com/2026/05/13/notion-just-turned-its-workspace-into-a-hub-for-ai-agents/
- Reworked — Notion 3.0 introduces AI agents — https://www.reworked.co/collaboration-productivity/notion-30-introduces-ai-agents-for-task-automation/

**Loom (this repo)**
- `plugins/middleleap-loom/skills/loom/SKILL.md` · `references/{governance,enterprise-rings,discovery-harness,delivery-harness}.md`
- `plugins/middleleap-loom/skills/loom-adopt/harness/adapters/README.md` · `adapters/reference/*.json`
- `plugins/middleleap-loom/skills/loom-adopt/harness/change-example/{product-passport,control-plan,change-envelope,release-hold}.json`
- `plugins/middleleap-loom/skills/loom-adopt/harness/governance/identities.template.json`
- `plugins/middleleap-loom/skills/loom-adopt/harness/skills/next-story/SKILL.md`
- `plugins/middleleap-loom/skills/loom-adopt/harness/platform-activation-example/github-branch-protection.json`
- `docs/loom-control-plane-plan.md` · `docs/research/ai-dlc-harness-landscape-2026-07.md`
