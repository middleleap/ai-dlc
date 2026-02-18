# Design Tokens

Complete design token reference extracted from Al Tareq Figma assets and screen designs.

## Color Palette

### Brand Colors (Al Tareq Mark Gradients)

The Al Tareq mark uses concentric squares with graduated gradient layers:

| Layer | Gradient Start | Gradient End | Usage |
|-------|---------------|--------------|-------|
| Outer ring | `#BFD6F5` | `#BAF0E9` | Outermost square border |
| Middle ring | `#80ACEB` | `#75E1D4` | Middle square border |
| Inner ring | `#4083E1` | `#30D2BE` | Inner square border |
| Center square | Solid fill | | Center element |
| Diagonal accent | Radial: `#40E0C7` → `#0050C8` → `white` | | Bottom-right diagonal beam |

### Dark Logo Brand Gradients

| Layer | Gradient Start | Gradient End |
|-------|---------------|--------------|
| Outer | `#001738` | `#00332C` |
| Middle | `#002D70` | `#006657` |
| Inner | `#0043A6` | `#009882` |
| Accent bar | `#000001` → `#00267E` → `#00A2FB` → `#00C2A9` → `#000` | |
| Diagonal | Radial: `#40E0C7` → `#0050C8` → `black` | |

### UI Colors

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--color-page-bg` | `#F0F2FA` | 240, 242, 250 | Page background |
| `--color-card-bg` | `#FFFFFF` | 255, 255, 255 | Card/panel backgrounds |
| `--color-card-border` | `#E8EAF0` | 232, 234, 240 | Card borders, field separators |
| `--color-text-primary` | `#1A1D3B` | 26, 29, 59 | Headings, values, body text |
| `--color-text-secondary` | `#6B7194` | 107, 113, 148 | Field labels, muted text |
| `--color-text-link` | `#015AD7` | 1, 90, 215 | Links, interactive text |
| `--color-accent-blue` | `#015AD7` | 1, 90, 215 | Active states, progress bar |
| `--color-accent-teal` | `#00C8AF` | 0, 200, 175 | Gradient endpoints, success |
| `--color-accent-green` | `#40E0C7` | 64, 224, 199 | Highlight accents |
| `--color-warning` | `#E74C3C` | 231, 76, 60 | Warning text, alert labels |
| `--color-warning-bg` | `#FFF5F3` | 255, 245, 243 | Warning panel background |
| `--color-selected-border` | `#1A1D3B` | 26, 29, 59 | Selected account card border |
| `--color-unselected-border` | `#E8EAF0` | 232, 234, 240 | Unselected account card border |
| `--color-progress-inactive` | `#D1D5E4` | 209, 213, 228 | Inactive progress steps/line |
| `--color-checkbox-checked` | `#015AD7` | 1, 90, 215 | Checked checkboxes |

### Gradient Definitions

```css
/* Primary button gradient */
--gradient-button: linear-gradient(90deg, #003366 0%, #00B894 100%);

/* Progress bar active segment */
--gradient-progress: linear-gradient(90deg, #015AD7 0%, #00C8AF 100%);

/* Redirection screen background */
--gradient-redirect: linear-gradient(135deg, #001B3D 0%, #003366 30%, #006B5A 70%, #00C8AF 100%);

/* Spinner stroke gradient (angular/conic) */
--gradient-spinner: conic-gradient(from 0deg, white, #015AD7 40%, #00C8AF 100%);
```

## Typography

### Font Families

| Usage | Font | Fallback |
|-------|------|----------|
| Al Tareq brand text | System default (matches Figma) | `'Inter', 'Segoe UI', sans-serif` |
| Arabic brand text | System Arabic | `'Noto Sans Arabic', 'Arial', sans-serif` |
| Body text / fields | System default | `'Inter', 'Segoe UI', sans-serif` |

### Font Sizes

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `--font-heading-lg` | 18px | 700 (Bold) | 1.3 | Section headings ("Confirm Payment") |
| `--font-heading-md` | 16px | 600 (Semibold) | 1.4 | Sub-section headings ("Payment Schedule") |
| `--font-body` | 14px | 400 (Regular) | 1.5 | Permission text, descriptions |
| `--font-label` | 13px | 400 (Regular) | 1.4 | Field labels (left column) |
| `--font-value` | 14px | 500 (Medium) | 1.4 | Field values (right column) |
| `--font-value-bold` | 14px | 600 (Semibold) | 1.4 | Emphasized values (amounts, names) |
| `--font-button` | 15px | 600 (Semibold) | 1 | Button text |
| `--font-progress` | 12px | 500 (Medium) | 1.2 | Progress step labels |
| `--font-small` | 12px | 400 (Regular) | 1.4 | Captions, IBAN numbers, balance |
| `--font-account-type` | 14px | 600 (Semibold) | 1.3 | Account type label in selector |
| `--font-alert-title` | 14px | 600 (Semibold) | 1.3 | Alert heading text |
| `--font-alert-body` | 13px | 400 (Regular) | 1.5 | Alert description text |

## Spacing

### Layout Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--space-page-padding` | 24px | Outer page margin (web) |
| `--space-page-padding-mobile` | 16px | Outer page margin (mobile) |
| `--space-content-max-width` | 720px | Max width of content area |
| `--space-card-padding` | 24px | Internal card padding |
| `--space-card-gap` | 16px | Gap between stacked cards |
| `--space-section-gap` | 24px | Gap between content sections |
| `--space-field-row-height` | 48px | Height of each field row |
| `--space-field-gap` | 0px | Fields are separated by borders, not gaps |

### Component Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--space-header-padding` | 20px 0 | Header vertical padding |
| `--space-logo-margin` | 16px 0 | Al Tareq logo vertical margin |
| `--space-progress-margin` | 16px 0 24px | Progress bar margins |
| `--space-button-gap` | 16px | Gap between Cancel and Primary buttons |
| `--space-button-padding` | 14px 32px | Button internal padding |
| `--space-account-card-padding` | 16px | Account selector card padding |
| `--space-account-card-gap` | 12px | Gap between account cards |
| `--space-checkbox-gap` | 8px | Gap between checkbox and label |
| `--space-alert-padding` | 16px | Warning/alert panel padding |

## Border & Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-card` | 16px | Content cards |
| `--radius-button` | 28px | Action buttons (pill shape) |
| `--radius-account-card` | 12px | Account selector cards |
| `--radius-input` | 8px | Form inputs |
| `--border-card` | `1px solid #E8EAF0` | Card borders |
| `--border-selected` | `2px solid #1A1D3B` | Selected account border |
| `--border-field` | `1px solid #E8EAF0` | Field row separators |

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-card` | `0 2px 8px rgba(26, 29, 59, 0.06)` | Content cards |
| `--shadow-button` | `0 2px 4px rgba(0, 51, 102, 0.15)` | Primary button |
| `--shadow-header` | `0 1px 4px rgba(26, 29, 59, 0.08)` | Page header |

## Z-Index

| Token | Value | Usage |
|-------|-------|-------|
| `--z-header` | 100 | Fixed header |
| `--z-redirect-overlay` | 200 | Redirection screen overlay |
| `--z-modal` | 300 | Error modals |

## Breakpoints

| Token | Value | Description |
|-------|-------|-------------|
| `--bp-mobile` | 480px | Small mobile |
| `--bp-tablet` | 768px | Tablet / large mobile |
| `--bp-desktop` | 1024px | Desktop |

## CSS Custom Properties Block

```css
:root {
  /* Colors */
  --color-page-bg: #F0F2FA;
  --color-card-bg: #FFFFFF;
  --color-card-border: #E8EAF0;
  --color-text-primary: #1A1D3B;
  --color-text-secondary: #6B7194;
  --color-text-link: #015AD7;
  --color-accent-blue: #015AD7;
  --color-accent-teal: #00C8AF;
  --color-warning: #E74C3C;
  --color-warning-bg: #FFF5F3;
  --color-selected-border: #1A1D3B;
  --color-progress-inactive: #D1D5E4;

  /* Gradients */
  --gradient-button: linear-gradient(90deg, #003366 0%, #00B894 100%);
  --gradient-progress: linear-gradient(90deg, #015AD7 0%, #00C8AF 100%);
  --gradient-redirect: linear-gradient(135deg, #001B3D 0%, #003366 30%, #006B5A 70%, #00C8AF 100%);

  /* Typography */
  --font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  --font-family-arabic: 'Noto Sans Arabic', 'Arial', sans-serif;

  /* Spacing */
  --space-page-padding: 24px;
  --space-card-padding: 24px;
  --space-card-gap: 16px;
  --space-content-max-width: 720px;

  /* Borders */
  --radius-card: 16px;
  --radius-button: 28px;
  --radius-account-card: 12px;
  --border-card: 1px solid #E8EAF0;

  /* Shadows */
  --shadow-card: 0 2px 8px rgba(26, 29, 59, 0.06);
  --shadow-button: 0 2px 4px rgba(0, 51, 102, 0.15);
}
```
