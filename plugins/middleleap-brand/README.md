# middleleap-brand

The MiddleLeap brand and design system — v2.0, verified against middleleap.com computed styles (July 2026).

```
/plugin marketplace add middleleap/ai-dlc
/plugin install middleleap-brand@middleleap-ai-dlc
```

Once installed, Claude loads the rules automatically for any MiddleLeap UI, document, or copy work. You can also invoke it directly: `/middleleap-brand:middleleap-brand`.

## What's in it

Everything lives in `skills/middleleap-brand/`, and everything the skill references ships with it.

| File | What it's for |
|------|---------------|
| `SKILL.md` | The rules, condensed — what Claude reads first |
| `DESIGN.md` | The full specification; canonical |
| `tokens.css` | Drop-in `:root` custom properties |
| `tokens.json` | W3C Design Tokens, for Figma / Style Dictionary |
| `tailwind.preset.js` | Tailwind theme mapping |
| `components/` | `components.css` + React library — PivotMark, Wordmark, Lockup, Button, Field, Checkbox, Toggle, Badge, Card, Alert, Loader, Eyebrow |
| `scripts/check-contrast.mjs` | WCAG AA gate — exits 1 on failure |
| `middleleap-design-system.html` | Living reference implementation; open it in a browser |
| `assets/` | Pivot lockup, icon, animated mark, favicons, OG card |

## Wiring it into a project

**Plain CSS** — `<link rel="stylesheet" href="tokens.css">`, then use the custom properties. Markup reference: `middleleap-design-system.html`.

**React** — import `components/components.css` once at the root, then:

```jsx
import { Button, Card, Badge, Lockup } from './components/index.jsx'

<Button variant="primary">Discuss a mandate</Button>
```

**Tailwind** —

```js
// tailwind.config.js
module.exports = {
  presets: [require('./tailwind.preset.js')],
  content: ['./src/**/*.{js,jsx,html}'],
}
```

**Fonts** —

```html
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300..700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

**Favicons / OG** —

```html
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:image" content="https://middleleap.com/og-image.png">
```

**Non-Claude agents** — `DESIGN.md` is plain, tool-agnostic markdown. Point `AGENTS.md` at it, or paste it into context.

## Changing a color

Tokens are the contract. Any change to `tokens.css` must be mirrored in `tokens.json`, `tailwind.preset.js`, the pair list in `scripts/check-contrast.mjs`, and `DESIGN.md` — and the gate must pass:

```bash
node skills/middleleap-brand/scripts/check-contrast.mjs
```

CI runs this on every push. Bump the plugin `version` in both `.claude-plugin/plugin.json` and the marketplace entry when you do, or installed copies never see the change.
