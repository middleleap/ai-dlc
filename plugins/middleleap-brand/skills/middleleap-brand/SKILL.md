---
name: middleleap-brand
description: MiddleLeap brand and design system implementation. Use when building, styling, or reviewing ANY MiddleLeap user interface, website, landing page, component, document, presentation, email, or marketing asset — or when the user mentions MiddleLeap branding, the pivot mark, ember/ink/bone colors, or middleleap.com. Covers tokens (color, type, space, radius, motion), the Pivot logo rules, component recipes, voice and copy rules, and accessibility gates. Also use when reviewing generated UI for brand compliance.
---

# MiddleLeap Brand & Design System

When producing anything visual or written for MiddleLeap, follow this skill exactly. Full specification: `DESIGN.md`, in this folder — it is canonical. Drop-in code: `tokens.css`, `tokens.json`, `tailwind.preset.js`, `components/` (React). Run `node scripts/check-contrast.mjs` as a gate after changing any color.

## Essence
Independent advisory firm for regulated platform businesses. Dark, editorial, precise. The brand idea is **the pivot**: a settled square leaps, rotated 45°, into a diamond. Sharp rectangles; serif headlines with one italic ember accent; mono uppercase labels; ember only where something acts or changes.

## Non-negotiable rules
1. **Fonts (only these three):** Instrument Serif 400 for display (accent phrases = `<em>` italic + ember). DM Sans for body. JetBrains Mono for buttons, labels, eyebrows, data — uppercase, letterspaced.
2. **Corners:** UI radius is 0px (buttons, inputs, cards, tables, modals). Chips/badges 2px. Rounded squircles (16% radius) belong ONLY to pivot glyphs: logo, checkbox, toggle thumb, loader.
3. **Color:** page `#080808`; body text `#DEDBD4`; captions `#87847D`; CTA flat `#E65C2D` with `#110D0A` text. Gradient `135deg #F0722E→#CE451B` on THE MARK ONLY. Status: positive `#5FA671`, caution gold `#D9A03C` (never ember), critical `#D64545` fills-only — red text uses `#E06060`. Danger buttons: bg `#C43B3B`.
4. **Wordmark:** `MiddleLeap` — one word, no space, "Middle" bone / "Leap" ember, DM Sans 600. Mark = bone square + ember diamond to its RIGHT, always 45°.
5. **Motion:** one move — the pivot (rotate 0→45°), 400ms `cubic-bezier(.34,1.3,.4,1)`. Nothing decorative. Honor `prefers-reduced-motion`.
6. **Copy:** active voice; buttons say what happens ("Discuss a mandate", never "Submit"/"Learn more"); numbers over adjectives; regulatory vocabulary exact; errors = fault + fix, no apologies.
7. **Accessibility floor:** WCAG AA on all text; form inputs visually hidden, never `display:none`; visible ember focus rings.

## Anti-patterns (reject on sight)
Rounded buttons/cards · gradients on UI · ember as warning color · `#D64545` as text · circles as emphasis dots (use 45° diamonds) · "Middle Leap" with a space · bold or tracked serif · any fourth typeface · scattered decorative animation.

## Assets
`assets/pivot_primary.svg` (lockup) · `pivot_icon.svg` (app icon) · `pivot_anim.svg` (animated) · `og-image.png` · `favicon.ico` + PNG sizes · reference implementation `middleleap-design-system.html`.
