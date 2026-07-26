# The end-to-end run — live floor to gate

**Ran:** 26 Jul 2026 · **Workspace:** a real Notion Business-tier workspace · **Run slug:**
`accounts-elsewhere-live` · **Result:** four checks, all green (`run-transcript.txt`).

This is the Alpha simulation carried the whole way: content authored by a human on a real
collaboration surface, read back live, exported by the shipped exporter, frozen with a stamp, and
put in front of the shipped gate — including the attack the gate exists to stop.

```
live Notion page ──► MCP connector ──► nfm-bridge ──► floor-export.mjs ──► digest
                                                                            │
                              freeze-stamp-check.mjs ◄── stamp + artifact ◄──┘
```

| Check | Result |
|---|---|
| Export is deterministic (same tree twice → same bytes) | **PASS** |
| Gate passes on the frozen bytes | **PASS** |
| Gate refuses a one-word tamper (`Medium` → `Low`) | **PASS** |
| The page built to be un-freezable is refused | **PASS** |

Frozen digest: `sha256:2755e0006a3665eec8c586205ae1915b631120cca503dad57d9aa32e7d254dbe`
(26 blocks: 2 tables of 5 rows, 5 headings, 4 to-dos, 2 callouts, a fenced code block, a divider,
three list types and four paragraphs.)

The tamper is the point. Changing **one word** in the frozen file — the residual-risk verdict from
`Medium` to `Low`, three bytes — is caught:

```
data-governance.md does not match its freeze stamp
(stamped sha256:2755e000…, actual sha256:55bd679f…)
— the record was edited after the freeze, so re-freeze it rather than editing in place
```

## The substituted link, and closing it

The first run substituted the **transport**: `core/floor-fetch.mjs` could not run because
`api.notion.com` was denied by the environment's egress policy, and such a denial is to be
reported rather than routed around. Content arrived through the **MCP connector** — a sanctioned
path, but one returning Notion-flavored *Markdown* rather than raw block JSON, which
`nfm-bridge.mjs` converts back.

**The policy was then changed and the real path ran.** `floor-fetch.mjs` walked the live REST API
with an integration token: 36 blocks read, 26 top-level, exit 0.

```
digest via REST API   sha256:2755e0006a3665ee…
digest via bridge     sha256:2755e0006a3665ee…
4157 bytes · 66 lines · cmp reports no differences
```

**I had written here that the bridge would produce a different digest. It does not** — for this
page the two paths are byte-identical, which is a stronger result than the one argued for. What it
establishes: the vendor's Markdown serialization lost nothing the exporter reads for content of
this shape. What it does **not** establish: that the paths agree in general. This page has no
nested lists, no colours, no underline, no mentions and no equations, and NFM represents some of
those differently or not at all.

So the bridge still stays out of the shipped harness — but for the narrower and more honest reason
that **nothing verifies the two paths agree**, rather than the claim that they disagree.

**What the live run then found.** The first attempt failed with `403 error: the surface refused the
request`, and that message was wrong: the 403 came from the egress proxy, not from Notion, because
Node's built-in `fetch` ignores `HTTPS_PROXY` unless `NODE_USE_ENV_PROXY=1` is set. The module
blamed the vendor for a firewall. `classify()` now distinguishes a response carrying no
`{ object: "error", code }` body and names the proxy, the egress policy and the Node flag; two
regression tests cover both directions.

**Still unexercised:** pagination and the cursor guards — this page fits in one page of results —
and every error branch except the two hit by accident. The `has_children` recursion *was*
exercised: both tables are children fetched separately.

**Everything downstream of the fetch is the shipped code, unmodified**: `floor-export.mjs`
produced the markdown and the digest, `freezeStamp()` produced the stamp, and
`scripts/freeze-stamp-check.mjs` — the same command CI runs — produced both verdicts.

```bash
NODE_USE_ENV_PROXY=1 NOTION_TOKEN=… node core/floor-fetch.mjs <page-id> 2022-06-28
```

## Files

| File | What it is |
|---|---|
| `run.mjs` | The runner. Six stages; the result table is derived from what happened, not asserted |
| `nfm-bridge.mjs` | The substituted transport. Simulation scaffolding, not method |
| `live-data-governance.nfm` | Exactly what the workspace returned, kept so the run is reproducible |
| `frozen-data-governance.md` | The frozen artifact |
| `frozen-stamp.json` | Its stamp |
| `run-transcript.txt` | Full output of the run |

Reproduce with `node run.mjs` from this directory.

---

**Companions:** `../../notion-floor-alpha-walkthrough.md` (the walkthrough this completes) ·
`../../notion-floor-plan.md` · the CI-verified freeze at
`plugins/middleleap-loom/skills/loom-adopt/harness/freeze-example/`.
