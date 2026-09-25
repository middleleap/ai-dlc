---
name: meridian-brand-guidelines
description: "Meridian Trust brand system for presentations, documents, web and product UI — Meridian Blue + Inter as the primary identity, with defined colour roles (structure, depth, signature cyan, warm amber highlight, status colours), the Meridian line motif, Midnight surfaces, typography, slide layout, logo rules and icon system. Use for anything Meridian Trust-branded, including the Loom demo's discovery artifacts, business cases and prototypes."
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

Contrast ratios (WCAG 2.1):

| Colour | On white | On Midnight | Safe for |
|--------|---------|-------------|----------|
| Midnight `#052540` | 15.6:1 | — | All text |
| Deep Navy `#083A5E` | 11.8:1 | — | All text |
| Graphite `#3A3F44` | 10.6:1 | — | Body text |
| Meridian Blue `#0B4F80` | 8.6:1 | — | All text |
| Signal Red `#B3261E` | 6.5:1 | — | Text and chips |
| Amber Deep `#9A5B00` | 5.4:1 | — | Text and chips |
| Harbour Green `#157A55` | 5.3:1 | — | Text and chips |
| Slate `#6B7278` | 4.9:1 | — | Secondary text (AA on white; exactly 4.5:1 on Gray BG — the floor) |
| Cyan Deep `#007C96` | 4.9:1 | — | Text |
| Azure `#2F80B8` | 4.3:1 | — | Large text and non-text only |
| Meridian Cyan `#00A3C4` | 3.0:1 | 5.2:1 | Non-text on light; **text on Midnight** |
| Amber `#E08A2E` | 2.7:1 | 5.8:1 | Non-text on light; **text on Midnight** |
| White `#FFFFFF` | — | 15.6:1 | Text on Midnight and on Meridian Blue (8.6:1) |

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

### Size Hierarchy (slides)

| Element | Weight | Size |
|---------|--------|------|
| Title slide heading | SemiBold | 32pt |
| Title slide subtitle | Light | 20pt |
| Content slide title | Medium | 20pt |
| Section label (top-left, uppercase) | Medium | 9pt |
| Subheading / column header | Medium | 11pt |
| Body text / bullet content | Regular | 10pt |
| Headline figure | SemiBold | 28–40pt |
| Table of contents items | Regular | 12pt |
| Footnotes / source citations | Regular | 7pt |

## Slide Layout Structure

The template uses a consistent layout pattern across content slides:

```
┌─────────────────────────────────────────────────────────┐
│ SECTION LABEL (9pt, uppercase, top-left)  [MERIDIAN LOGO]│
│                                              (top-right) │
│ Slide Title (20pt, Light weight)                         │
│ Subtitle line(s) (11pt, Medium weight)                   │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐  │
│ │                                                     │  │
│ │              CONTENT AREA                           │  │
│ │    (text, tables, charts, multi-column)             │  │
│ │                                                     │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                          │
│ [Source: 6pt]  [Meridian Trust presentation]  [page #]   │
└─────────────────────────────────────────────────────────┘
```

### Available Slide Layout Types

| Layout | Use For |
|--------|---------|
| Title Slide (variants) | Opening and section dividers on Midnight |
| Title and Content | Standard content with title + body area |
| Two Content | Side-by-side content (text+chart, text+text) |
| Comparison | Labeled left/right comparison columns |
| Section Header | Section transition slides |
| Blank | Custom layout (charts, diagrams, full-bleed visuals) |
| Title Only | Slide with only title bar, free content area below |

### Title/Section Divider Slides

Midnight (`#052540`) full-bleed background. Display title in white, lower-left; a Meridian line
(cyan, 48×4pt) directly above the title; subtitle in Ash or white at 20pt Light. Use
`assets/logos/default-2.svg` top-right. Abstract architectural imagery is optional — if used, place
it on the right half behind a Midnight gradient so the title side stays solid.

### Content Slides

White background. Meridian logo top-right. Section label top-left (uppercase, 9pt, Meridian Blue).
Title in Medium 20pt with a short Meridian line beneath it. Footer at bottom with source text,
the deck identifier ("Meridian Trust"), and page number. A dark summary panel (Midnight, white
text, one amber figure) is allowed once per slide for the key takeaway.

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

### Full Logo (mark + wordmark)

| File | Background | Description |
|------|-----------|-------------|
| `default.svg` | Light / white | Blue globe, cyan meridian, Midnight wordmark — **primary usage** |
| `default-2.svg` | Midnight / dark | White globe, cyan meridian, white wordmark |
| `black.svg` | Light / white | All-black monochrome — grayscale and print |

### Mark only

| File | Background | Description |
|------|-----------|-------------|
| `mark.svg` | Light / white | Blue globe, cyan meridian — icon, favicon, small spaces |
| `mark-white.svg` | Midnight / dark | White globe, cyan meridian |
| `mark-black.svg` | Light / white | All-black monochrome |

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

Meridian maintains a library of brand icons as SVGs. When icon files are supplied, they follow a
consistent design system.

### Icon Design Specifications

| Property | Value |
|----------|-------|
| Format | SVG (outlined paths, not strokes) |
| viewBox | `0 0 100 100` (square) |
| Primary fill | `#0B5A93` (icon blue — slightly brighter than brand Meridian Blue `#0B4F80`) |
| Secondary fill | `#2F80B8` (for layered detail elements) |
| Negative space | `#FFFFFF` (white cutouts within filled shapes) |
| Style | Monochrome line-art with ~2px apparent stroke weight, clean outlines |
| Construction | Paths are outlined/expanded (not live strokes) — the "line" look comes from shaped fills |

### Icon Categories

| Category | Prefix | Examples |
|----------|--------|----------|
| Platform / API | `platform-*` | availability, efficiency, productivity, real-time, security, scalability |
| Banking Services | `service-*` | card activation, contact centre, ease of access, mobile platforms, multilingual |
| Wealth Management | `wealth-*` | multi-asset, portfolio objectives, mutual funds, strategies, managed portfolios |
| Digital Onboarding | `onboarding-*` | benefits, documents, features |
| Generic / Reusable | `icon1`–`icon5` | general-purpose icons and variants |
| Stats / Touchpoints | `stat-*` | stat-20, stat-200 |

### Using Icons in Presentations (PPTX)

When placing icons on Meridian slides:

- **Size:** 40–60px (0.55–0.83in) for inline icons alongside text; 80–100px (1.1–1.4in) for
  featured icon blocks
- **Placement:** Align icons to the left of text labels in feature grids. Use consistent spacing
  (12–16px gaps).
- **Color on white slides:** Use as-is (blue `#0B5A93` on white background)
- **Color on dark/blue slides:** Replace fill with white (`#FFFFFF`) — since icons are single-fill
  SVGs, a simple find-replace of the fill color works
- **Icon + label pattern:** Icon left or top, label text in Medium 11pt, description in Light 9pt
  below
- **Grid layouts:** For feature/benefit slides, use 2×3 or 3×3 icon grids with equal column widths

Typical icon-label slide layout:

```
┌────────────────────────────────────────────┐
│ SECTION LABEL                [MERIDIAN LOGO]│
│ Slide Title                                 │
│                                             │
│  ◆ Label 1      ◆ Label 2     ◆ Label 3    │
│  Description    Description   Description   │
│                                             │
│  ◆ Label 4      ◆ Label 5     ◆ Label 6    │
│  Description    Description   Description   │
│                                             │
│ [Source]  [Meridian Trust presentation]  [#]│
└────────────────────────────────────────────┘
```

**Embedding SVG icons in PPTX programmatically:**

1. Convert SVG to PNG at 2x resolution (200×200px from the 100×100 viewBox) for crisp display
2. Insert as an image at the target size (e.g., 0.7in × 0.7in)
3. For python-pptx: use `slide.shapes.add_picture()` with the converted PNG

### Using Icons in Web / HTML / React

- **Inline SVG** (preferred): Embed the SVG directly for color control via CSS
- **Fill override:** Set `fill: var(--mt-blue)` or `fill: currentColor` on the SVG paths for theme
  flexibility
- **Sizing:** Use `width` and `height` on the `<svg>` element; the 100×100 viewBox scales cleanly
- **Dark mode:** Override fill to `#FFFFFF` or `var(--mt-white)`
- **Icon + text components:** Flex row with icon at 24–32px, gap 12px, text block right-aligned

```html
<!-- Inline SVG with color override -->
<svg viewBox="0 0 100 100" width="32" height="32" class="mt-icon">
  <path fill="currentColor" d="..." />
</svg>

<style>
  .mt-icon { color: var(--mt-blue, #0B4F80); }
  .dark .mt-icon { color: var(--mt-white, #FFFFFF); }
</style>
```

### Creating New Icons to Match the Meridian Style

When the existing set doesn't cover a concept, create new icons following these rules:

1. **Canvas:** 100×100 SVG viewBox, no padding (content fills the full box)
2. **Color:** Single fill `#0B5A93`. No gradients, no shadows, no multi-color.
3. **Stroke appearance:** ~2px visual stroke weight. Achieve this with outlined/expanded paths
   (not live `stroke` attributes) — this matches how the existing icons are built
4. **Corners:** Slightly rounded joins (2–4px radius) for a friendly but professional feel
5. **Complexity:** Keep path count low (1–3 paths). Simple, recognizable silhouettes.
6. **Negative space:** Use white (`#FFFFFF`) fill for internal cutout details (e.g., window panes,
   screen content)
7. **Consistency:** Match the visual weight and level of detail of existing icons — not too thin,
   not too heavy
8. **Export:** Outline all strokes, flatten layers, export as SVG with `viewBox="0 0 100 100"`

**Anti-patterns to avoid:**

- Solid/filled icons (these are outline-style)
- Multiple colors or brand blues mixed together
- Live strokes (always outline/expand before export)
- Icons smaller than the viewBox with excessive padding
- Overly detailed or illustrative icons — keep them diagrammatic

## PPTX Template Usage

When creating Meridian presentations:

1. **Preferred method:** Start from an approved Meridian template PPTX (if the user supplies one)
   and edit slides using the pptx skill's editing workflow (unpack → modify → repack)
2. **From scratch:** Apply the color palette, fonts, and layout structure documented above
3. **Section dividers:** Midnight background, white display title, Meridian line — see Title/Section Divider Slides

## Format-Specific Notes

### Documents (DOCX/PDF)

- Heading colour hierarchy: H1 `#0B4F80`, H2 `#083A5E`, H3 `#052540`; a Meridian line under H1
- Body text: `#3A3F44`, Inter Regular (or Arial where Inter is unavailable)
- Footer: page numbers in `#6B7278`
- Key-value tables: `#E9F0F6` label cells, white value cells
- Cover page: Midnight band across the top third with the white logo and the display title

### Web / HTML / Product UI

- CSS variables in `references/meridian-variables.css` (prefix `--mt-`)
- Logo: `assets/logos/default.svg` in the header; `assets/logos/mark.svg` for favicons
- Page background Gray BG, cards white with Silver Light borders
- Hero or summary band on Midnight with a white display heading and the Meridian line
- Primary button Meridian Blue / white text, hover Deep Navy; secondary button white with a
  Meridian Blue border; focus ring 2px Meridian Cyan with 2px offset
- Links `#0B4F80`, hover `#083A5E`, visited `#7C9BB8`
- Active navigation: Meridian Blue text with a 3px cyan underline
- Status chips: status colour background, white text, the status word in capitals
- Font stack: `'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif`; body 400, headings 500,
  display 600

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
