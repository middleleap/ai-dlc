# Discovery on the Factory Floor — the day-one runbook

> **Identifiers.** Gate ids (`D1`–`D9`), signals (`S-001`), hypotheses (`H1`) and the floor's
> `Decision Dn.n` records are expanded in `glossary.md`. Read `factory-floor.md` for *why* the
> floor has the shape it has; this file is about what two people actually do on a Tuesday.

`factory-floor.md` describes an architecture. It does not say what a product manager sees at ten
in the morning, or what the one technical person in the room types at eleven. This runbook does.
It walks **one discovery run** through the left diamond with two people at the table:

| Role | Who they usually are | Where they stand | What they hold |
|---|---|---|---|
| **Facilitator** | The one engineer, analyst or architect who has Claude Code and the Loom plugin | At the machine — a repository checkout | The `discovery` skill, the renderer, the gate validator, the freezer |
| **Author** | The product manager, the business owner, the domain expert | On the floor — pages in the institution's workspace tool | Guided forms, floor-only notes, the projected gate board |
| **Reactors** | The named roles in the problem statement who look at the prototype | On the floor, once, at stage 5b | Nothing to hold. They react; the author records |

The Loom's answer to "how do we support the not-so-technical people in discovery" is **not** to
give them Claude Code. It is to put them on a floor whose every page tells them what becomes of
what they type, while one facilitator runs the machine. The two roles are deliberately unequal:
the author owns the *content* of the problem; the facilitator owns the *record* of it. Neither
approves anything. Approval, where discovery has any, is a second human merging a PR.

## 0. Before day one — what must already be true

The floor's own gates refuse a floor that is stood up in the wrong order. Do these first, and
do them in this order, or the first freeze fails for a reason that will look unrelated.

1. **The residency record is signed.** `docs/governance/residency-approval.json` (the
   deprecated markdown fallback is `docs/governance/residency-review.md`) carries two
   signatures — data-protection and risk-second-line — from two different people, neither in
   the `builders` group. `residency-check` blocks workspace construction, token issue and floor
   content until it does. **Drafting the record does not need a floor; using a floor needs the
   record.** A programme that skips this and lets a PM start typing has put personal data into
   an unreviewed external service on day one, which is the exact incident the record exists to
   prevent.
2. **The harness is adopted at the `full` tier.** `node harness/adopt.mjs --dest . --tier full`
   lands `floor/templates`, `floor/catalog-b` and `floor/catalog-c` alongside the discovery
   machinery. Every tier installs every gate; only `full` installs the forms.
3. **The guided forms are regenerated, not authored.** `node scripts/template-parity-check.mjs
   --fix` regenerates `floor/templates/*.json` from `discovery/templates/*.md`. The gate fails
   when a form and its source disagree. If the institution edits a discovery template — and it
   should, to fit its own language — the floor form follows by regeneration, never by hand.
4. **Two seam identities are wired: the projector and the freezer.** `svc-floor-projector`
   mirrors git → floor and is *probed* unable to write git (`projection-capability-check`).
   `svc-floor-freezer` exports floor → a feature branch and opens a PR it cannot merge. This
   wiring is **adopter-side**: the bundle ships the pure exporter, the fetcher against recorded
   response shapes, and the gates, and carries no vendor client or token by design.
5. **Decision routing is not wired.** Catalog B (the ADR inbox card, the solution-direction flow)
   ships declared, not active, and stays that way until WS5 clears its independent second-line
   review. Discovery does not need it: the two decisions a run ends in — hand off, or stop — are
   both PR merges made by a human at the machine.
6. **The floor's home page carries the write-class legend and `authority: none`**, visible
   without scrolling. Every projected card inherits it.

If any of the six is missing, the honest position is "we have a facilitator and a repository",
and the author works by conversation with the facilitator, not by page. That is a legitimate,
lower-maturity state. It is not a floor.

## 1. The run, stage by stage

One table per stage. The left column is what the author does on the floor; the right is what
the facilitator does at the machine. The **write class** row is the sentence the page itself
shows the author, and the **gates** row is what the facilitator will be held to.

### Stage 1 · Discover, diverge — signals

| On the floor (author) | At the machine (facilitator) |
|---|---|
| Opens an **interview note** or **meeting note** (catalog C) per session. Writes participants as roles and pseudonyms (`P-01 · SME lender`). Every quote attributed to the pseudonym. | Scaffolds `discovery/runs/<slug>/` from the templates and creates `evidence/`. Confirms the slug on the floor's run page so every form's **Run** property points at it. |
| Opens the **research log** guided form. Adds one **Signal** row per observation: source, observation, type, confidence. Does not number them — the form does. | Reviews the draft signals for two things the form cannot: that none is a customer detail in disguise, and that each is one observation, not a conclusion. |
| Optionally opens a **product brief** (catalog C) for the bet in three sentences. | Reads it. Does not copy it anywhere. |

- **Write class the author sees:** notes and the brief are `lives-on-the-floor` — *never frozen,
  no gate reads them, nothing downstream catches what you write*. The research log is
  `born-on-the-floor` — *frozen into the run at a gate, by PR*.
- **Gates the facilitator answers to:** `D2` (every claim traces to a logged signal) — which is
  why the interview note is cited by its id from the research log and never pasted into it.
- **The PII rule is on the page, before the first keystroke.** It is the only control at this
  stage. The pre-egress filter governs git → floor and cannot see what a person types *in*.

### Stage 2 · Discover, converge — synthesis

| On the floor (author) | At the machine (facilitator) |
|---|---|
| Opens the **synthesis** guided form. Clusters signals into **Themes**, each citing the `S-NNN` ids it rests on. Picks a **Prioritisation** method by name and applies it. Names the one **Candidate problem**. | Runs `node discovery/gates/validate.mjs discovery/runs/<slug>` against a dry export and reads the `D5` result back to the author in words: *"theme T-3 cites no signal"* becomes *"the third theme has no evidence behind it yet"*. |

- **Write class:** `born-on-the-floor`.
- **Gates:** `D5` (themes trace to signals; prioritisation method stated).
- **First freeze.** When the author is content, the facilitator freezes the research log and
  the synthesis together (§2 below). From here the run has a record, and the floor pages show
  **Frozen at** and **Version** filled in, read-only.

### Stage 3 · Define — the problem statement

| On the floor (author) | At the machine (facilitator) |
|---|---|
| Opens the **problem statement** guided form. Fills **The problem (falsifiable)**, **Target user**, **Success measures** (baseline → target), **Constraints**, **Stakeholders & scope** with named *roles* and an explicit out-of-scope list. | Reads it for the one failure the author is most likely to commit without noticing: a build hiding inside a constraint. *"Must integrate with the CRM"* is a constraint. *"A sync job from the CRM"* is a solution, and fails `D4`. |

- **Write class:** `born-on-the-floor`.
- **Gates:** `D1` (falsifiable problem, target user, success measure), `D3` (stakeholders and
  scope), `D4` (no-solutioning boundary).
- **Language rule for the facilitator.** Never say "D4". Say *"that sentence decides how we'd
  build it, and we're not there yet — what's the constraint underneath it?"* The gate ids are
  for the record; the author gets the reason.

### Stage 4 · Define — data-governance feasibility

| On the floor (author) | At the machine (facilitator) |
|---|---|
| Opens the **data governance** guided form. Lists **Data the direction would touch** in plain categories. Leaves the register mapping to the facilitator, or fills it from the projected register board if one exists. | Maps each category to `DR-*` risk ids and `CTRL-*` controls in the data-risk register, names the regulatory driver, and writes the **Residual-risk verdict**. Runs the `data-governance-reviewer` agent for coverage. |

- **Write class:** `born-on-the-floor`.
- **Gates:** `D6` (≥1 `DR-*` and ≥1 driver cited, every id resolves, a verdict present).
- **This is the one stage where the author is not the primary writer.** The register is the
  institution's, in its own vocabulary, and mapping to it is a skill. The author's job is the
  plain-language inventory; the facilitator's is the mapping; a second-line reader's is the
  verdict when the residual risk is High. The form's sections are split to match.

### Stage 5 · Define — the prototype

| On the floor (author) | At the machine (facilitator) |
|---|---|
| Opens the **prototype** guided form and writes **What this prototype tests** as framing hypotheses `H1`, `H2`, … and **Scope of the wireframe** as the two or three screens that make the pain visible. | Runs `/design` with the brief and the `design.md` tokens, walks the author through the options on the canvas, puts the canvas URL in `prototype.md` as `design_canvas:`. Transcribes the chosen option to `specs/wireframe.prototype.json` and renders `wireframe.html` through `discovery/render/`. |
| Reacts to the options on the canvas. Says which one makes the problem *recognisable*, not which one looks finished. | Freezes `prototype.md` and commits the rendered asset and specs. Runs the validator with `--prototype-digest` and keeps the value for stage 5b. |

- **Write class:** `born-on-the-floor` for the brief. The **canvas is not a record** and is
  never frozen — its URL is provenance.
- **Gates:** `D7` (tokens only, marker present), `D8` (brief + asset + specs exist, none
  over-specifies), `D4`.
- **What the author must hear before the canvas opens:** *"This is going to be thrown away. If
  it looks good enough to ship, it's wrong."* Over-specification lands hardest in the asset
  because the wireframe is written to persuade, and the person it persuades is the reactor
  whose reaction is supposed to be evidence.

### Stage 5b · Define — the stakeholder reaction

This is the stage the floor exists for, and the stage a floor-less discovery most often fakes.
A prototype no one reacted to tested nothing; `D9` fails the run.

| On the floor (author) | At the machine (facilitator) |
|---|---|
| Opens the **stakeholder reaction** guided form. **Session** names the reactors as roles and the format. **Reactions** has one row per hypothesis, pre-populated from the frozen prototype brief: **Hypothesis**, **Stakeholder** (role), **Verdict** (`confirmed` / `refuted` / `uncertain` / `partially`), **Reaction** (what they said or did). | Shows the reactors the **committed `wireframe.html`**, not the canvas draft — the digest binds to what was shown. Sits with the author during the session so the reaction is recorded live, not reconstructed. |
| Writes the **Outcome**: framing held or adjusted, and the open questions carried to Develop. | On freeze, each reaction row becomes a new `S-NNN` signal appended to the research log (continuing the numbering), and `prototype_digest:` is written into the reaction's front-matter. |

- **Write class:** `born-on-the-floor`.
- **Gates:** `D9` (a verdict per hypothesis, bound to the prototype digest, each reaction
  logged as a signal → `D2`).
- **The one bespoke floor piece worth building first** is exactly this form's behaviour:
  pre-fill the hypothesis rows from the frozen `prototype.md`, and on freeze emit the signal
  rows into the research log. The shipped `stakeholder-reaction.json` form has the shape; the
  pre-fill and the signal emission are adopter-side wiring the bundle does not carry.
- **If the prototype changes after the session, the reaction is void.** `D9` fails again
  because the digest moved. Show the new prototype or record a new session; do not edit the
  old reaction to fit.

### Stage 6 · Hand-off — or Stop

| On the floor (author) | At the machine (facilitator) |
|---|---|
| Where the institution funds change by decision, opens the **business case** guided form (`decision-routed`). Writes the "do nothing" row first, then values only the D1 measures, then the total-cost-of-change band — the ▲ rows are the ones the author knows better than the facilitator does. | Checks the case names no mechanism, technology or vendor. Routes it to the decision authority named in `governance.md`; the decision comes back as an ADR or envelope merged by a second human, and its id goes into the case's `decision_record`. **The floor shows the case as `proposed` until then, never as approved.** |
| Opens the **handoff** guided form. Its sections quote the frozen problem, governance position and prototype rather than restating them; the author writes **What delivery owns now** — the questions discovery could not answer. | Freezes it. Runs the full validator. Opens the hand-off PR. **A second human merges it.** The waist gate (`discovery-link-check`) then lets a backlog item cite the run. |
| If the run ends **without** a hand-off: says so, and says why, in conversation. | Writes `outcome.md` at the machine — who decided (a human, named as a role), which hypotheses were refuted or left uncertain, what would reopen it. There is **no floor form for `outcome.md`**, deliberately: stopping is a record-side act by the facilitator, and a stop and a hand-off never coexist in one run. |

- **Write class:** `born-on-the-floor` for the hand-off; `decision-routed` for the business case —
  and catalog B ships **declared, not active**, so until WS5 clears, the case is authored on the
  floor but its decision is routed by conversation and recorded at the machine.
- **Gates:** all of `D1`–`D9`.
- **A discovery is allowed to fail.** The author needs to hear that at stage 1, not stage 6.

## 2. The freeze — what the author sees, what actually happens

The freeze is the moment a draft becomes a record, and it is where the floor's honesty is tested.
The author's experience must match the mechanism exactly, or the floor is lying by simplification.

| What the author sees | What is actually happening |
|---|---|
| Sets **Status** to `in review` and tells the facilitator | Nothing. Status is a floor property; no gate reads it. |
| The facilitator says "freezing the problem statement" | A human explicitly freezes (ADR-0003). The fetcher walks the page **as the API serves it**; the exporter converts it deterministically to Markdown. An unknown block, a truncated body or a permission gap **aborts** with a visible reason. |
| A few minutes later, **Frozen at** shows a commit sha and **Status** reads `gate-green` or the facilitator comes back with a plain-language failure | `svc-floor-freezer` opened a PR into `discovery/runs/<slug>/` with a `.freeze/<artifact>.json` stamp naming the digest of exactly the exported bytes. `D1`–`D9` ran on the export. Someone other than the freezer merged it. |
| Edits the page again after the freeze; **Drift** changes to `draft ahead of record` | `drift-check` observed the page digest moving past the stamp. **Nothing blocks.** The merged record stands forever. What the drift does is refuse any *new* claim that cites the frozen artifact until it is re-frozen — the reaction form, for instance, cannot bind to a prototype brief that has moved. |

Three things to say to every author on day one, in these words or better:

1. *"Frozen means a copy went into the record. Your page is still yours."*
2. *"Gate-green is a fact about the copy, not a badge on your page. If you edit, the copy does
   not change, and the page will say it's ahead."*
3. *"Nothing on this floor approves anything. The tick means a check passed on a file in git."*

## 3. The floor must never tell the author these things

The risk the floor adds is **appearance of control**. These are the specific lies a
well-meaning projection tells, and each is refused by a shipped gate or by the payload rule:

| The tempting card | Why it is refused |
|---|---|
| "Approved" on a discovery run page | Discovery has no approval stage. A hand-off is *merged*, by a named human, and the floor may say `merged` with the sha — never `approved`. Payloads refuse attestation, signature, seal and release-hold fields even if added to the allow-list. |
| A green tick with no `authority: none` beside it | Every projected record carries `authority: "none"`. It is on the record, not only in the footer. |
| A withheld record silently missing from a board | A record whose payload trips the pre-egress filter is withheld **whole** and shown as withheld. Silence must never be mistaken for coverage. |
| "Live" on a floor whose seam is paused | `floor-keeper-check` refuses a paused floor represented as live. The degraded banner is D6.4 working, not failing. |
| A catalog-C note "promoted" into the run | `floor-only-check` refuses a `lives-on-the-floor` page that has crossed into `discovery/runs/`. The brief is *rewritten* as a problem statement, never copied. |

## 4. Day-one checklist

For the facilitator, in order. Each line is either a command or a conversation.

- [ ] `node scripts/residency-check.mjs` prints `SIGNED`, two people, neither a builder.
- [ ] `node scripts/template-parity-check.mjs` is green; the forms match the templates.
- [ ] `node scripts/projection-capability-check.mjs` shows the projector *refused* a git write.
- [ ] `node scripts/floor-keeper-check.mjs` shows the keeper holds no grant on any
      approval-carrying container, and the floor is `LIVE`.
- [ ] The floor home shows the write-class legend and `authority: none` above the fold.
- [ ] Told the author: no names, roles and pseudonyms only, on every page, before typing.
- [ ] Told the author: the prototype will be thrown away.
- [ ] Told the author: the run is allowed to end in a stop, and a stop is a result.
- [ ] Agreed the slug. Every form's **Run** property points at it.
- [ ] Agreed who the second human is who merges the freeze PRs. Not the facilitator.

## 5. Honest state

- **The bundle ships the git-side halves only.** Templates, the pure exporter, the fetcher
  against recorded response shapes, the ten gates, the worked examples. Standing up the
  workspace, wiring the projector and freezer, and hosting the seam are the adopter's, and this
  runbook assumes they exist. Where they do not, §0's fallback applies: facilitator plus
  conversation, and the author's forms are the facilitator's screen.
- **Stage 5b's pre-fill and signal emission are not built.** The shape is; the behaviour is
  adopter-side. It is named here as the first bespoke piece because it is where the largest
  gap between "what the method requires" and "what a floor-less team actually does" sits.
- **MiddleLeap's own residency record is unsigned.** The walkthrough that produced the
  `freeze-example/` was a simulation against a recorded page shape. Nothing in this runbook has
  been run by a real author on a real floor at a real institution. It is the day-one design,
  written before day one, and says so.
- **The comprehension-debt limit applies here too.** A floor that makes discovery pleasant
  makes it easier to click through. The facilitator reading every draft before it freezes is
  the control, and nothing here measures whether that reading happened.
