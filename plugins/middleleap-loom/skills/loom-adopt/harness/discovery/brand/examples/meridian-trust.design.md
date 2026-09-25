---
profile_id: design.md
profile_version: 1
entity: "Meridian Trust (DEMO instance)"
status: demo
banner: "DEMO — Meridian Trust · synthetic, non-production"
---

# Brand profile — Meridian Trust (a second, mounted brand)

> **Identifiers.** Gate ids (`D1`–`D9`, `Q1`–`Q5`) and run-level ids (`S-001` signal,
> `T-1` theme, `H1` hypothesis) are expanded in `discovery/GLOSSARY.md`.

This is **not the demo brand**. It is the brand of the demo *institution*, Meridian Trust, mounted
behind the *same seam* to prove the discovery harness is solution-agnostic: identical token
**names**, different **values** (Meridian's navy, Midnight ink and Harbour Green here vs the
harness demo's own palette). Both brands are set in Inter, so the swap is carried by the palette
alone — the strictest form of the test. The renderer and gate D7 read this file the same way they
read `discovery/brand/design.md` — no code changes to swap.

**Source of truth:** the `meridian-brand-guidelines` skill (plugin `middleleap-loom-demo`). This file
is its token projection; change a value there and here in the same commit.

> Render any run's specs against this brand with `--brand`:
> `node discovery/render/render.mjs deck <spec.json> <out.html> --brand discovery/brand/examples/meridian-trust.design.md`

## Conformance marker

Same contract as the demo instance — every rendered artifact carries
`<!-- discovery/brand/design.md@v1 -->` and uses token values only.

## 1. Design tokens

### Colour

| Token | Value | Use |
|---|---|---|
| `color.brand.primary` | `#0B4F80` | Primary actions, headers, links (Meridian Blue) |
| `color.brand.primary-ink` | `#FFFFFF` | Text on primary |
| `color.brand.accent` | `#157A55` | Positive / success / "within tolerance" (Harbour Green) |
| `color.status.warn` | `#9A5B00` | Caution / nearing threshold (Amber Deep) |
| `color.status.danger` | `#B3261E` | Breach / liability crossing (Signal Red) |
| `color.surface.bg` | `#F4F6F7` | Page background (Gray BG) |
| `color.surface.card` | `#FFFFFF` | Card / panel |
| `color.ink.strong` | `#052540` | Primary text (Midnight) |
| `color.ink.muted` | `#6B7278` | Secondary text (Slate) |
| `color.border.subtle` | `#D9DDE0` | Dividers, table rules (Silver Light) |

Additional Meridian tokens — allowed in rendered output, not required by the renderer:

| Token | Value | Use |
|---|---|---|
| `color.brand.signature` | `#00A3C4` | The Meridian line, active indicators, focus (non-text on light) |
| `color.brand.highlight` | `#E08A2E` | One warm note per view (non-text on light) |
| `color.surface.hero` | `#052540` | Midnight surfaces — hero band, summary panel |
| `color.brand.tint` | `#E9F0F6` | Tinted sections (Mist) |

### Typography

| Token | Value |
|---|---|
| `font.family.sans` | `"Inter", Arial, sans-serif` |
| `font.family.mono` | `"Roboto Mono", Menlo, monospace` |
| `font.size.h1` | `32px` |
| `font.size.h2` | `24px` |
| `font.size.h3` | `18px` |
| `font.size.body` | `16px` |
| `font.size.caption` | `13px` |
| `font.weight.regular` | `400` |
| `font.weight.semibold` | `600` |

### Spacing & shape

| Token | Value |
|---|---|
| `shadow.card` | `0 2px 8px rgba(5,37,64,0.12)` |

### Logo

| Token | Value |
|---|---|
| `logo.wordmark` | `MERIDIAN TRUST` rendered in `font.family.sans` / `font.weight.semibold` / `color.brand.primary` (the full globe mark lives in the skill's `assets/logos/`) |

## 2. Voice & tone

- **Clear, institutional, quietly confident.** Plain sentences, numbers first, no hype.
- **The Meridian line and one warm note** — a short `color.brand.signature` bar under the primary heading; at most one `color.brand.highlight` element per view.
- Same hard rules as any brand: tokens only, DEMO banner, zero PII, synthetic data.

## 3. Accessibility minimums

- Text contrast ≥ 4.5:1; never colour-only meaning; logical heading order.
