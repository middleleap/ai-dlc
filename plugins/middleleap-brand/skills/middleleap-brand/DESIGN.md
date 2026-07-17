# MiddleLeap — DESIGN.md

Agent-facing design specification. When building UI, marketing pages, documents, or components for MiddleLeap, follow this file exactly. Do not invent colors, fonts, radii, or motion outside this spec. When in doubt, choose the plainer option.

**Verified against middleleap.com computed styles, July 2026.**

---

## 1. Identity in one paragraph

MiddleLeap is an independent advisory firm for regulated platform businesses: dark, editorial, precise. The brand idea is **the pivot** — a settled square leaps, rotated 45°, into a diamond. The visual language is sharp rectangles, serif headlines with one italic ember accent, mono uppercase labels, and ember spent only where something changes or acts.

## 2. Tokens (source of truth)

Use these exact values. A drop-in `tokens.css` ships alongside this file — import it rather than redeclaring.

### Color — Ink (surfaces, dark-first)
| token | value | use |
|---|---|---|
| ink-0 | `#080808` | page background |
| ink-1 | `#101010` | raised surface |
| ink-2 | `#181817` | card |
| ink-3 | `#232321` | hover surface |
| ink-4 | `#33322F` | strong border |
| ink-border | `#1E1E1C` | default border |

### Color — Bone (text on dark)
| token | value | use |
|---|---|---|
| bone-0 | `#ECE9E1` | headlines |
| bone-1 | `#DEDBD4` | body text; the mark's square |
| bone-2 | `#A8A59E` | secondary text |
| bone-3 | `#87847D` | captions, hints, table headers (AA ≥4.8:1 on all surfaces) |
| bone-4 | `#4A4945` | disabled ONLY (WCAG-exempt) |

### Color — Ember (accent)
| token | value | use |
|---|---|---|
| ember-300 | `#F58F55` | accent text on dark |
| ember-400 | `#F0722E` | hover state, eyebrows, ghost buttons |
| ember-500 | `#E65C2D` | brand core; primary CTA background; hero italic accent |
| ember-600 | `#CE451B` | accent text on light backgrounds |
| ember-grad | `linear-gradient(135deg,#F0722E,#CE451B)` | **THE MARK ONLY.** Never on buttons or UI. |
| ember-dim | `rgba(230,92,45,.14)` | tinted backgrounds |

### Color — Semantic
| token | value | rule |
|---|---|---|
| positive | `#5FA671` | live / passed / certified |
| caution | `#D9A03C` | pending / degraded. Gold, NOT ember — status never borrows the brand accent |
| critical | `#D64545` | fills, dots, borders ONLY |
| critical-text | `#E06060` | any red text (error hints, critical badge labels). Base critical fails AA as text |
| info | `#5D8FA6` | neutral notice |
| *-dim | base color at 14% over surface | tinted badge/alert backgrounds |

Danger button background is `#C43B3B` (not critical) so white text passes AA.

### Typography
| role | font | rules |
|---|---|---|
| Display (h1–h4, card titles) | **Instrument Serif**, weight 400 only | No bold, no negative letter-spacing. Accent phrases inside headlines: `<em>` = italic + ember-500 |
| Body | **DM Sans** | 16px/1.6 body; 14px small; labels 600 |
| Mono (buttons, labels, data, eyebrows, table headers, badges) | **JetBrains Mono** 400/500 | Uppercase + letterspaced for labels |

Google Fonts: `Instrument+Serif:ital@0;1`, `DM+Sans:opsz,wght@9..40,300..700`, `JetBrains+Mono:wght@400;500`.

Scale: hero `clamp(44px,6vw,76px)/1.08` · h1 42 · h2 30 · h3 22 · body 16 · small 14 · caption 12.5.
Eyebrow pattern: JetBrains Mono 12.5px, `letter-spacing:.22em`, uppercase, ember-400, prefixed `// `.

### Space, radius, elevation
- Spacing: 4px base grid. Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- **Radius: UI is sharp (0px)** — buttons, inputs, cards, tables, alerts, modals. Badges/chips: 2px.
- **Radius belongs to the mark**: pivot glyphs only (logo, checkbox box, toggle thumb, loader) use squircle radius ≈16% of element size. Nothing else is rounded except the toggle track (pill).
- Layout: container 1080px max, 32px side padding, 12-col/24px-gutter grid. Breakpoint: single column below 720px.
- Shadows: `0 1px 2px rgba(0,0,0,.5)` raised · `0 4px 16px rgba(0,0,0,.45)` overlay · `0 4px 24px rgba(230,92,45,.28)` primary-CTA hover only.

## 3. The mark (logo)

- Composition: bone square (settled) + ember-gradient diamond (leaping, rotated 45°), diamond to the RIGHT of the square. Corner radius 16% of size.
- Wordmark: `MiddleLeap` — ONE word. "Middle" bone-1, "Leap" ember. DM Sans 600, letter-spacing -0.02em. Never a space between; never split by weight.
- Clearspace: 1× the square's width on all sides. Min sizes: lockup 120px, mark 20px, below 20px use the ember diamond alone.
- NEVER: other rotation angles; recolored diamond; reversed order (leap goes forward = rightward); mark on photography without an ink scrim ≥70%.
- Canonical assets: `assets/pivot_primary.svg` (lockup) · `assets/pivot_icon.svg` (app icon) · `assets/pivot_anim.svg` (animated).

## 4. Component recipes

- **Button**: JetBrains Mono 500, 13px, uppercase, `letter-spacing:.08em`, padding 14/22, radius 0. Primary = flat ember-500 bg, text `#110D0A`, hover → ember-400 + ember shadow + translateY(-1px). Secondary = transparent, 1px ink-4 border. Ghost = ember-400 text, ember-dim hover bg. Danger = `#C43B3B` bg, white text. Primary carries a 9px `currentColor` square marker that rotates 45° on hover (400ms leap easing). Focus: 2px ember-400 outline, 2px offset.
- **Input**: ink-0 bg, 1px ink-4 border, radius 0, padding 11/14, DM Sans 15px. Focus: ember-500 border + `0 0 0 3px ember-dim`. Label: DM Sans 600 14px. Hint: caption bone-3. Error: critical border, hint in critical-text.
- **Checkbox**: THE PIVOT. 20px square, 5px radius, ink-4 border. Checked → ember-grad fill, `rotate(45deg) scale(.88)`, 400ms leap easing. Input is visually hidden but focusable (never `display:none`).
- **Toggle**: 48×26 pill track; 18px squircle thumb; checked → thumb slides right AND rotates 45°, track ember-600.
- **Badge**: mono 11.5px, 2px radius, `{color}-dim` bg, colored text (critical uses critical-text), 7px rotated-square dot.
- **Card**: ink-2 bg, ink-border, radius 0, padding 24. Hover: ink-4 border, translateY(-2px), overlay shadow.
- **Table**: mono uppercase 11.5px headers in bone-3; 14px DM Sans cells; row hover ink-1. Wrap in horizontal-scroll container for mobile.
- **Alert**: `{color}-dim` bg, 30%-alpha color border, radius 0, rotated-square dot, DM Sans 600 title.

Reference markup for all of the above: `middleleap-design-system.html`.

## 5. Motion — one move only

The pivot: rotation 0°→45°, sometimes with translation. Nothing slides or fades decoratively; motion marks state change.

| token | value | use |
|---|---|---|
| dur-fast | 120ms | color/opacity |
| dur-base | 200ms | hover, borders, elevation |
| dur-leap | 400ms | any 45° pivot |
| ease-out | `cubic-bezier(.2,0,0,1)` | default |
| ease-leap | `cubic-bezier(.34,1.3,.4,1)` | pivots only — the overshoot is the landing |

Loader: single ember squircle, keyframes rotate 0→45→90 over 1.6s, ease-leap, infinite. Logo on page load: diamond translates in from the square and pivots 0→45°, 0.9s. ALWAYS honor `prefers-reduced-motion` by collapsing to instant state changes.

## 6. Voice

Senior operator, not agency. Active voice, present tense. Regulatory and standards vocabulary stays exact — never paraphrase framework names or licence classes. Buttons say what happens ("Discuss a mandate", "Start a sprint") — never "Submit" / "Learn more" / "Get started". Numbers over adjectives; no claim we can't count. Errors state fault + fix in one breath, no apologies. Headline pattern: plain statement, one italic ember phrase for the turn ("From strategic mandate to *market execution.*").

## 7. Hard don'ts (checklist for generated code)

- ❌ Rounded corners on buttons, inputs, cards, tables, modals (0px only)
- ❌ Gradient on anything except the mark
- ❌ Ember for status/warnings (caution is gold `#D9A03C`)
- ❌ `#D64545` as text color (use critical-text)
- ❌ bone-4 for anything except disabled
- ❌ Bold or tight-tracked Instrument Serif; serif in buttons/labels/forms
- ❌ Space Grotesk, IBM Plex, Inter, or any font outside the three faces
- ❌ Circles as emphasis dots (use the 45° diamond)
- ❌ "Middle Leap" with a space, or the wordmark split across lines
- ❌ Motion other than the pivot vocabulary; ignoring prefers-reduced-motion
- ❌ `display:none` on checkbox/toggle inputs (breaks keyboard access)

## 8. File map

Every path below is relative to this skill folder, and everything referenced here ships with it.

```
middleleap-brand/
├── SKILL.md                         ← the rules, condensed; entry point
├── DESIGN.md                        ← this file: load into agent context
├── tokens.css                       ← drop-in :root custom properties
├── tokens.json                      ← W3C Design Tokens (Figma / Style Dictionary)
├── tailwind.preset.js               ← Tailwind theme mapping
├── middleleap-design-system.html    ← living reference implementation
├── components/
│   ├── components.css               ← component styles (imports ../tokens.css)
│   └── index.jsx                    ← React library, tokens baked in
├── scripts/check-contrast.mjs       ← WCAG AA gate — run after any color change
└── assets/
    ├── pivot_primary.svg · pivot_icon.svg · pivot_anim.svg
    ├── og-image.png                 ← 1200×630 social card
    └── favicon.ico · favicon-16/32.png · apple-touch-icon.png
```

Wiring instructions per tool (plain CSS, React, Tailwind, fonts, favicons, CI) are in the plugin README, one level up.
