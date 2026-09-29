# Meridian Trust — icons

Part of the `meridian-brand-guidelines` skill; file paths below are relative to the skill folder.

**No icon files ship with this plugin.** This is the specification for creating Meridian-style icons if an institution supplies or commissions them. `#0B5A93` is a legacy icon blue; new icons use Meridian Blue `#0B4F80`.

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
