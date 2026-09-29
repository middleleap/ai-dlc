---
name: meridian-brand-guidelines
description: "Meridian Trust (the Loom's fictional demo bank) brand system — Meridian Blue + Inter, colour roles, the Meridian line motif, Midnight surfaces, typography, slide layout and logo rules. Use only for Meridian Trust-branded work: the Loom demo's discovery artifacts, business cases and prototypes, or as the template to copy when packaging a real institution's brand. Not for any other institution's branding."
---

# Meridian Trust Brand Guidelines

A complete, self-contained brand system for **Meridian Trust**, a fictional CBUAE-regulated retail
and commercial bank — the demo institution of the Loom. Apply these guidelines to every Meridian
Trust deliverable: decks, documents, prototypes, web pages and the Loom's rendered discovery
artifacts.

> **Adapting this skill:** Meridian Trust is a fictional institution. To retarget this skill to a
> real bank, replace the palette hex values, font names, logo assets in `assets/logos/`, and the
> brand portal URL — the colour *roles*, structure, layout rules and icon system stay as-is.

> **One brand, everywhere.** The Loom's brand profile for Meridian
> (`middleleap-loom` → `harness/discovery/brand/examples/meridian-trust.design.md`) is a token
> projection of this skill. Change a value here and change it there in the same commit.

## The idea

Meridian Blue and Inter carry the identity; they are the calm, institutional base. The brand stops
being "just blue" through three deliberate moves, used across every format:

1. **Depth** — Midnight (`#052540`) is a real surface, not only a heading colour. Title slides,
   hero bands, summary panels and dark cards sit on Midnight.
2. **The Meridian line** — the brand's signature: a short cyan bar (`#00A3C4`), taken from the
   meridian in the logo. It marks the one thing to look at: under a title, beside a key figure,
   on the active tab, down the edge of a callout.
3. **One warm note** — Amber (`#E08A2E`) appears at most once per view: the headline number, the
   "today" marker, the single call-out that matters. Never as a second brand colour.

Everything else is blue, neutral, and white space.

## Colour roles

Use colours by **role**. The role says where a colour may go; the hex is the current value.

### Structure — the blues (primary)

| Role | Name | Hex | Use |
|------|------|-----|-----|
| **Primary** | Meridian Blue | `#0B4F80` | Primary buttons, links, logo globe, chart series 1, table header rows |
| Primary hover | Deep Navy | `#083A5E` | Hover/pressed states, H2 headings |
| Depth | Midnight | `#052540` | Display headings, **dark surfaces** (title slides, hero bands, summary panels) |
| Support | Azure | `#2F80B8` | Chart series 2, secondary highlights (large text / non-text only) |
| Tint | Mist | `#E9F0F6` | Tinted sections, key-value label cells, selected rows |

### Signature and highlight

| Role | Name | Hex | Use |
|------|------|-----|-----|
| **Signature** | Meridian Cyan | `#00A3C4` | The Meridian line, active indicators, focus rings, the logo meridian, chart emphasis. **Non-text on light**; text is fine on Midnight |
| Signature text | Cyan Deep | `#007C96` | When cyan must be text on white (links in info callouts, small labels) |
| Signature tint | Cyan Ice | `#EAF8FB` | Info callout background |
| **Highlight** | Amber | `#E08A2E` | One warm note per view — headline figure marker, "today" line, single call-out. Non-text on light; text is fine on Midnight |
| Highlight text | Amber Deep | `#9A5B00` | Amber as text on white |

### Status

| Role | Name | Hex | Use |
|------|------|-----|-----|
| Success | Harbour Green | `#157A55` | Positive, "within tolerance", completed |
| Warning | Amber Deep | `#9A5B00` | Caution, nearing a threshold, expiring |
| Danger | Signal Red | `#B3261E` | Breach, failure, revoked |

Status colours are for state, never decoration. Always pair them with a word or icon.

### Neutrals

| Name | Hex | Use |
|------|-----|-----|
| Graphite | `#3A3F44` | Body text |
| Slate | `#6B7278` | Secondary text, captions |
| Ash | `#9AA1A7` | Subtle text on dark, disabled |
| Silver | `#BEC4C9` | Dividers, inactive elements |
| Silver Light | `#D9DDE0` | Borders, table rules |
| Gray Alt | `#E9ECEE` | Alternate table rows |
| Gray BG | `#F4F6F7` | Page / section background |
| White | `#FFFFFF` | Cards, content slides |

Legacy values still in older assets: Visited Link `#7C9BB8`, Deep Teal `#213A45`, Cyan Light
`#5FC9DE` (chart tertiary), icon blue `#0B5A93`.

### Proportion

Roughly **60 / 25 / 10 / 5**: white and Gray BG / blues and Midnight / neutrals for text / cyan and
amber together. If a view has more cyan than a line or two, or more than one amber element, it has
drifted.

### Accessibility

Contrast pairs and the accessibility rules: `references/accessibility.md`.

## Typography

Inter throughout. The system gets its contrast from **weight and size**, not from a second
typeface.

- **Display** (title slides, hero headings): Inter SemiBold 600, Midnight (or white on Midnight),
  tracking −1%
- **Headings:** Inter Medium 500 — H1 Meridian Blue, H2 Deep Navy, H3 Midnight
- **Body:** Inter Regular 400 on screen; Inter Light 300 only at 20pt/20px and above
- **Eyebrow / section label:** Inter Medium 500, uppercase, +12% tracking, Meridian Blue
- **Figures:** tabular numerals (`font-variant-numeric: tabular-nums`) for every amount and table
- **Identifiers** (account numbers, record ids): `"Roboto Mono", Menlo, monospace`
- **Office-safe fallback:** Arial (PPTX/DOCX where Inter may not be installed)
- **Web fallback stack:** `'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif`

### Slides

Size hierarchy, slide layout structure, layout types, title/section divider slides and content slides: `references/slides-and-documents.md`.

## Design Elements

- **The Meridian line** — a cyan bar, 4px/4pt thick and 32–48 units long, under or above the
  primary heading of a view; a 3px cyan left border on info callouts; the active tab underline.
  One per heading, never as a full-width rule.
- **Midnight surfaces** — title slides, hero bands, the summary panel, the dark card that holds a
  headline figure. Text on Midnight is white; cyan and amber may be text here.
- **The warm note** — one amber element per view (a figure, a marker, a badge). Headline figures
  on white use Midnight text with a short amber underline instead of amber text.
- **Header** — white background with the logo; no coloured top bar on content slides or pages.
- **Charts** — series order: Meridian Blue, Azure, Meridian Cyan, then neutrals (Ash, Silver);
  Amber only for the single series or point being called out. Gridlines Silver Light.
- **Tables** — header row Meridian Blue with white text, rules Silver Light, alternate rows
  Gray Alt; numbers right-aligned, tabular.
- **Callouts** — info: Cyan Ice background + cyan left border; neutral: Mist background + Deep
  Navy left border; status: status colour left border + the status word.
- **Shape** — corner radius 4px for cards and buttons, 2px for inputs and chips; shadows only on
  floating elements (`0 2px 8px rgba(5,37,64,0.12)`).

## Logo Assets

All logo files are in `assets/logos/` as SVG vectors. The mark is a globe: the outline and equator
in Meridian Blue, the **meridian** — the vertical ellipse — in Meridian Cyan. The wordmark reads
MERIDIAN over TRUST.

Logo files (full logo and mark, each in default, white and black) and when to use each: `references/logos-and-web.md`.

### Logo Usage Rules

- **Presentations:** `default.svg` top-right on white content slides; `default-2.svg` on Midnight
  title and divider slides.
- **Web/HTML headers:** `default.svg`. Minimum clear space = half the height of the mark.
- **Favicons / app icons:** `mark.svg`, or `mark-white.svg` on a Midnight tile.
- **Dark backgrounds:** always `default-2.svg` or `mark-white.svg`.
- **Monochrome / print:** `black.svg` or `mark-black.svg`.
- **Prefer SVG**; convert to PNG programmatically when needed (e.g. PPTX, email signatures).
- **Never** stretch, recolour, rotate, or add effects. The cyan meridian is part of the mark — do
  not recolour it to match a layout.

## Icon System

No icon files ship with this plugin. The specification for creating Meridian-style icons is `references/icons.md`.

## PPTX Template Usage

See `references/slides-and-documents.md` (PPTX Template Usage).

## Format-Specific Notes

### Documents (DOCX/PDF)

See `references/slides-and-documents.md` (Documents).

### Web / HTML / Product UI

CSS variables, component notes and product-UI rules: `references/logos-and-web.md` (tokens in `references/meridian-variables.css`).

### Loom discovery artifacts

The Loom renders discovery decks, documents and prototypes from token values only. Its Meridian
profile maps this system as: `color.brand.primary` Meridian Blue, `color.brand.accent` Harbour
Green, `color.status.warn` Amber Deep, `color.status.danger` Signal Red, `color.surface.bg`
Gray BG, `color.surface.card` White, `color.ink.strong` Midnight, `color.ink.muted` Slate,
`color.border.subtle` Silver Light, sans Inter, mono Roboto Mono. Signature cyan, amber and
Midnight surfaces are listed there as additional tokens.

## Brand Portal

Complete brand guidelines live on the institution's brand portal. Replace this placeholder with
the real URL when retargeting the skill: `https://brand.meridiantrust.example/guidelines`
