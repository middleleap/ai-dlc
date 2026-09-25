---
name: meridian-brand-guidelines
description: "Meridian Trust brand implementation guidelines for presentations, documents, and web assets. Covers complete color palette, typography, slide layout structure, logo usage rules, and icon design system."
---

# Meridian Trust Brand Guidelines

A complete, self-contained brand system for a generic retail/commercial bank. Apply these
guidelines to all Meridian Trust-branded deliverables.

> **Adapting this skill:** Meridian Trust is a fictional institution. To retarget this skill to a
> real bank, replace the palette hex values, font names, logo assets in `assets/logos/`, and the
> brand portal URL — the structure, layout rules, and icon system below stay as-is.

## Official Color Palette

RGB and hex values for the full brand palette. "Primary colours" grouping applies to the blues.

### Blues (Primary)

| Name | RGB | Hex | Usage |
|------|-----|-----|-------|
| Mist | 233, 240, 246 | `#E9F0F6` | Callout backgrounds, tinted sections |
| Azure | 047, 128, 184 | `#2F80B8` | Chart accents, secondary blue highlights |
| Meridian Blue | 011, 079, 128 | `#0B4F80` | **Primary brand color.** Main accents, accent6 in theme, CTA buttons, logo blue |
| Deep Navy | 008, 058, 094 | `#083A5E` | H2 headings, hover states, secondary accents |
| Midnight | 005, 037, 064 | `#052540` | H3 headings, deep emphasis |

### Neutrals

| Name | RGB | Hex | Usage |
|------|-----|-----|-------|
| Graphite | 058, 063, 068 | `#3A3F44` | Primary body text (theme accent1) |
| Slate | 107, 114, 120 | `#6B7278` | Secondary text, captions (theme accent2) |
| Ash | 154, 161, 167 | `#9AA1A7` | Borders, subtle text (theme accent3) |
| Silver | 190, 196, 201 | `#BEC4C9` | Dividers, inactive elements (theme accent4) |
| Silver Light | 217, 221, 224 | `#D9DDE0` | Subtle backgrounds (theme accent5) |
| Gray Alt | 233, 236, 238 | `#E9ECEE` | Alternate table rows |
| Gray BG | 244, 246, 247 | `#F4F6F7` | Section backgrounds, code blocks (theme lt2) |

### Secondary Accents (charts, callouts, slide layout elements)

| Name | Hex | Usage |
|------|-----|-------|
| Amber | `#E08A2E` | Chart secondary accent, warm highlight |
| Cyan | `#00A3C4` | Chart accent, info/link callouts |
| Cyan Light | `#5FC9DE` | Chart tertiary, background tints |
| Cyan Ice | `#EAF8FB` | Very light info backgrounds |

### Base / Other

| Name | Hex | Usage |
|------|-----|-------|
| Black | `#000000` | Theme dk1, dk2 |
| White | `#FFFFFF` | Theme lt1, slide backgrounds |
| Visited Link | `#7C9BB8` | Visited hyperlinks |
| Deep Teal | `#213A45` | Occasional dark accent in slide content |

### Accessibility Notes

Contrast ratios against white (WCAG 2.1):

| Color | Ratio on white | Safe for |
|-------|---------------|----------|
| Meridian Blue `#0B4F80` | 8.6:1 | All text, including small |
| Deep Navy `#083A5E` | 11.8:1 | All text |
| Midnight `#052540` | 15.6:1 | All text |
| Graphite `#3A3F44` | 10.6:1 | All body text |
| Slate `#6B7278` | 4.9:1 | Body text (AA) |
| Azure `#2F80B8` | 4.3:1 | **Large text (18pt+/14pt bold) and non-text only** |
| Amber `#E08A2E`, Cyan `#00A3C4` | <3:1 | **Decorative / chart fills only — never body text on white** |

## Typography

From the Meridian theme:

- **Heading font:** `Inter Medium` (medium weight, 500)
- **Body font:** `Inter Light` (light weight, 300)
- **Office-safe fallback:** `Arial` (use in PPTX/DOCX where Inter may not be installed)
- **Web fallback stack:** `'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif`

### Size Hierarchy (from template placeholders)

| Element | Weight | Size |
|---------|--------|------|
| Title slide heading | Light | 32pt |
| Title slide subtitle | Light | 24pt |
| Content slide title | Light | 20pt |
| Section label (top-left, uppercase) | Light | 9pt |
| Subheading / column header | Medium | 11pt |
| Body text / bullet content | Light | 9pt |
| Table of contents items | Light | 12pt |
| Footnotes / source citations | Light | 6pt |

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
| Title Slide (variants) | Opening/section dividers with abstract architectural background images |
| Title and Content | Standard content with title + body area |
| Two Content | Side-by-side content (text+chart, text+text) |
| Comparison | Labeled left/right comparison columns |
| Section Header | Section transition slides |
| Blank | Custom layout (charts, diagrams, full-bleed visuals) |
| Title Only | Slide with only title bar, free content area below |

### Title/Section Divider Slides

Use abstract, light architectural background imagery. Text is placed on the lower-left. White /
light-gray colour scheme over the imagery. Vary the background between divider slides so each
section is visually distinct.

### Content Slides

White background. Meridian logo in the top-right corner. Section label in top-left (uppercase,
9pt). Footer at bottom with source text (6pt), the deck identifier, and page number.

## Design Elements

- **No top color bar** — the template uses a clean white background with the Meridian logo mark,
  NOT a colored header bar
- **Meridian logo** — positioned top-right on content slides. Use `assets/logos/default.svg` on
  white backgrounds, `assets/logos/default-2.svg` on dark backgrounds. See Logo Assets below.
- **Chart colors** — use Meridian Blue (`#0B4F80`) as the dominant chart color, with neutrals
  (`#3A3F44`, `#6B7278`, `#9AA1A7`) for secondary series, and Amber/Cyan for categorical contrast
- **Tables** — clean neutral borders, no heavy colored headers; alternate `#F4F6F7` / white rows
- **Callout boxes** — Mist (`#E9F0F6`) background with a Deep Navy left border
- **Clean minimal styling** — restrained and corporate; avoid heavy decorative elements

## Logo Assets

All logo files are in `assets/logos/` as SVG vectors.

### Full Logo (Meridian mark + wordmark)

| File | Background | Description |
|------|-----------|-------------|
| `default.svg` | Light / white | Graphite wordmark, blue mark — **primary usage** |
| `default-2.svg` | Dark / colored | White wordmark, blue mark — for dark backgrounds |
| `black.svg` | Light / white | All-black monochrome — for grayscale/print |

### Meridian Mark Only (globe/meridian icon)

| File | Background | Description |
|------|-----------|-------------|
| `mark.svg` | Light / white | Blue mark — brand icon, favicons, small spaces |
| `mark-black.svg` | Light / white | Black mark — monochrome contexts |
| `mark-white.svg` | Dark / colored | White mark — dark background icon |

### Logo Usage Rules

- **Presentations:** Use `default.svg` (full logo) in the top-right corner on white content slides.
  Use `default-2.svg` on dark section divider slides.
- **Web/HTML headers:** Use `default.svg` at standard size. Minimum clear space around the logo =
  half the height of the mark.
- **Favicons / app icons:** Use `mark.svg` (blue) as the primary icon mark.
- **Dark backgrounds:** Always switch to `default-2.svg` or `mark-white.svg` — never place the
  default dark logo on a dark background.
- **Monochrome / print:** Use `black.svg` or `mark-black.svg` when color is unavailable.
- **Prefer SVG** for web and presentations (scales cleanly). Convert to PNG programmatically when
  needed (e.g., email signatures).
- **Never** stretch, recolor, rotate, or add effects to the logo. Scale proportionally only.

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
- **Fill override:** Set `fill: var(--mb-blue)` or `fill: currentColor` on the SVG paths for theme
  flexibility
- **Sizing:** Use `width` and `height` on the `<svg>` element; the 100×100 viewBox scales cleanly
- **Dark mode:** Override fill to `#FFFFFF` or `var(--mb-white)`
- **Icon + text components:** Flex row with icon at 24–32px, gap 12px, text block right-aligned

```html
<!-- Inline SVG with color override -->
<svg viewBox="0 0 100 100" width="32" height="32" class="mb-icon">
  <path fill="currentColor" d="..." />
</svg>

<style>
  .mb-icon { color: var(--mb-blue, #0B4F80); }
  .dark .mb-icon { color: var(--mb-white, #FFFFFF); }
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
3. **Background images** for section dividers: use abstract, light, architectural imagery

## Format-Specific Notes

### Documents (DOCX/PDF)

- Heading color hierarchy: H1→`#0B4F80`, H2→`#083A5E`, H3→`#052540`
- Body text: `#3A3F44`, Inter Light (or Arial where Inter is unavailable)
- Footer: page numbers in `#6B7278`
- Key-value tables: `#E9F0F6` label cells, white value cells

### Web / HTML / React

- CSS variables provided in `references/meridian-variables.css`
- Logo files: `assets/logos/default.svg` for headers; `assets/logos/mark.svg` for favicons
- Navigation/header: white background with the Meridian logo, optional thin blue accent line
- Links: `#0B4F80`, hover `#083A5E`, visited `#7C9BB8`
- Font stack: `'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif`
- Body weight: 300 (light), Headings weight: 500 (medium)

## Brand Portal

Complete brand guidelines live on the institution's brand portal. Replace this placeholder with
the real URL when retargeting the skill: `https://brand.meridiantrust.example/guidelines`