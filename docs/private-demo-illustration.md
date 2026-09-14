# Private planning illustrations

`customer-demo-illustration.mjs` adds an editorial companion page to an already generated private demo package. It does not run a workflow or change the recorded evidence or hosting gateway.

```sh
node scripts/customer-demo-illustration.mjs <base-package> <private-scenario.json> <new-package>
node --test scripts/customer-demo-illustration.test.mjs
```

Keep scenario values in the private deployment repository, outside `dist/`. Do not add them to the public website or this public source repository. The input uses `loom.private-illustration/v1` with `fictional-editorial` authority, four stages, cross-cutting considerations, three artifact excerpts and HTTPS sources. See the test fixture for the structure.

Two optional blocks serve an audience-specific presenter route (the Kosli founder briefing, `docs/plans/kosli-founder-demo-briefing.md`):

- `presenter: { mandate, opening, roles: [3 × { title, holds, asks }] }` renders above the four stages — the bank's mandate and three role cards (product sponsor, platform owner, control owner) — so the audience is put in the bank's decision before the method detail, which stays in the collapsible stages.
- `evidence_status` on each artifact excerpt, one of `fictional planning` (the default when absent), `executed local check`, `recorded agent run`, `simulated provider`, `verified external record`. The renderer always prints the legend and puts the chip on the excerpt where the claim is made. An excerpt may only claim `verified external record` when a dated live run exists to cite; `simulated provider` is the honest status for anything answered by the record-and-replay fake, and the harness demo's own step tags use the same words (`demo/run-demo.mjs`).

Regenerate from a package without a companion page, using a new destination. The renderer escapes text, generates no executable scripts, preserves recorded evidence and gateway bytes, and records scenario/generator hashes separately from the original evidence provenance. The updated package digest excludes `release.json`, matching the base export convention.

Deploy only through the existing private gateway. Test the new HTML and CSS anonymously and authenticated, confirm private source files are not reachable, and retain the existing protected host/secret configuration. A private GitHub repository alone does not establish protected hosting. Do not promote editorial scenario decisions into executed evidence.
