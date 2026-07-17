---
name: implement-story
description: Use when implementing a numbered backlog story — one story per session, one branch, spec-first (e.g. /implement-story STORY-17)
disable-model-invocation: true
---

# Implement a story

Story: $ARGUMENTS

`CLAUDE.md` rules are binding throughout; the API contract is ground truth. Follow this order
exactly.

1. **Read the canon first.** The requirement + acceptance criteria in the PRD, every matching
   path in the API contract, and the interfaces the story touches. If the spec conflicts with the
   PRD or a binding `CLAUDE.md` convention → **STOP** and run the `spec-change` skill before any
   code.
2. **Confirm scope.** Post a short plan: files to touch, endpoints, and what is explicitly out of
   scope (name the neighbouring story IDs you are NOT building). Surface any genuine decision for
   the user; otherwise proceed.
3. **Branch:** `feature/<ID>-<short-slug>` off `main`.
4. **Failing tests first — show them red.** Contract + acceptance tests from the API contract and
   the acceptance criteria, written against the **interface** the story exposes. Minimum cases —
   <!-- ADOPT: replace with your project's binding conventions; these are the shape of the list,
   not its content -->
   - the response envelope and error envelope shapes; pagination if listing
   - authorization enforced at **every** layer that claims to enforce it; wrong-role rejected
   - idempotency: replay returns the original result, no duplicate side effects
   - audit records written where the story is audit-relevant — and immutability verified by
     asserting UPDATE/DELETE fail
   - human-approval (four-eyes) operations defer execution, never execute inline;
     initiator ≠ approver
   - the failure path via fault injection where a simulator exists
   Run the suite and show the user the red list as the checkpoint before implementing.
5. **Implement to green.** Code against interfaces, never concrete adapters. Synthetic data
   only — no PII in fixtures, test names, or logs.
6. **Definition of Done — verify with evidence before claiming done:**
   - full suite green; coverage at or above the project floor on changed packages
   - integration tests against real local stores (the enforcement you claim is actually exercised)
   - lineage/audit emission in the same change — never retrofit
   - grep the diff for PII-shaped literals and any egress bypassing the sanctioned path
   - if the story moves/renames a file a current-state doc cites, update that doc in the same
     change — never retrofit
   - the demo walkthrough for the story runs end-to-end
7. **Commit + PR.** Every commit and the PR cite the story ID. After merge, confirm the story is
   demonstrable before reporting done.

## Red flags — stop and restart the step
- Tests written after implementation, or never shown failing
- "Audit/lineage after the demo"
- Spec edited on the feature branch (use `spec-change`)
- Enforcement checked in only one layer when the rule says two
- A second story ID creeping into the diff
