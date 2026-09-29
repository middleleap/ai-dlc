# Meridian Trust — slides and documents

Part of the `meridian-brand-guidelines` skill; file paths below are relative to the skill folder.

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

## PPTX Template Usage

When creating Meridian presentations:

1. **Preferred method:** Start from an approved Meridian template PPTX (if the user supplies one)
   and edit slides using the pptx skill's editing workflow (unpack → modify → repack)
2. **From scratch:** Apply the color palette, fonts, and layout structure documented above
3. **Section dividers:** Midnight background, white display title, Meridian line — see Title/Section Divider Slides


### Documents (DOCX/PDF)

- Heading colour hierarchy: H1 `#0B4F80`, H2 `#083A5E`, H3 `#052540`; a Meridian line under H1
- Body text: `#3A3F44`, Inter Regular (or Arial where Inter is unavailable)
- Footer: page numbers in `#6B7278`
- Key-value tables: `#E9F0F6` label cells, white value cells
- Cover page: Midnight band across the top third with the white logo and the display title
