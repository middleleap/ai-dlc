# Activation runbook — making the control plane real (HG-0001, HG-0002, HG-0004)

The Loom's merge policy — *the agent proposes; a human disposes* — depends on platform
controls the agent **cannot toggle**. Skills and reviewer agents that honour the rule are
hygiene; the control of record is branch protection + CODEOWNERS + a least-privilege agent
identity. This runbook is the paper-to-platform step: a **platform admin** (not the build
agent, and outside the agent's write scope) runs it once per repository.

> Why this exists: the origin catalog was prompted by a live incident in which an agent
> identity merged to `main` because branch protection was *configured but not activated*.
> An inert control fails exactly when you need it. Do not stop at "the files are present."

## Preconditions

- A platform admin with repository-settings access. **This must not be the agent's identity.**
- The machinery already copied into the repo (`loom-adopt` step 1), including
  `scripts/control-plane-check.mjs` and a `CODEOWNERS` derived from
  `governance/CODEOWNERS.template`.

## 1. Real CODEOWNERS teams (HG-0002)

1. Copy `governance/CODEOWNERS.template` to `CODEOWNERS` (root or `.github/`).
2. Replace `@your-org/platform-admins` with a **real team the agent identity is not in**.
3. Confirm every control-plane path is owned:
   ```bash
   node scripts/control-plane-check.mjs      # → "Control-plane integrity gate (HG-0002) — OK"
   ```
   Wire this into CI (below) so ownership can never silently regress.

## 2. Branch protection on `main` (HG-0001)

On the default branch, require — with **no bypass for anyone, including admins and the agent**:

- **Require a pull request before merging**, with **≥1 Code Owner review**.
- **Require status checks to pass** — add every gate: the discovery suites, the waist gate
  (`discovery-link-check`), the **control-plane check**, and the project's Q-gates.
- **Dismiss stale approvals on new commits.**
- **Restrict who can push** to the branch — the agent identity is not on the list.
- **Do not allow force-pushes or deletions.**

The decisive property: **the agent's identity is not in the approver group and cannot change
the protection.** Verify by having the agent identity attempt a direct push to `main` — it
must be rejected.

## 3. Least-privilege agent identity (HG-0004)

- Give the agent its **own** service identity — never a human's, never an admin token.
- Scope it to: read the repo, push to `feature/*` branches, open PRs. **Not**: merge, edit
  branch-protection, edit repository settings, or push to `main`.
- Store any secrets in a vault the agent reads at run time; no long-lived tokens on disk.
- Rotate on a schedule; log the identity's actions to an audit trail.

## 4. Wire the checks into CI

Add to the PR workflow (a control-plane file — owned in CODEOWNERS):

```bash
node --test discovery/gates/*.test.mjs discovery/render/*.test.mjs \
            scripts/*.test.mjs                 # bundled suites, incl. the control-plane gate
node scripts/discovery-link-check.mjs          # waist gate (HG-0007)
node scripts/control-plane-check.mjs           # control-plane integrity (HG-0002)
# + the project's Q-gates per ../loom/references/delivery-harness.md
```

## 5. Verify activation — evidence, not vibes

- [ ] Agent identity **cannot** push to `main` (attempted and rejected).
- [ ] A PR touching a control-plane file **requires** a Code Owner review.
- [ ] `control-plane-check.mjs` is a **required** status check and currently green.
- [ ] The agent identity **cannot** edit branch protection or CODEOWNERS without review.
- [ ] Secrets are vaulted; the agent holds no merge or admin rights.

Only when every box is checked is the control plane *activated*, not merely *present*. Record
the result as an ADR per `../loom/references/governance.md` and keep the status honest.
