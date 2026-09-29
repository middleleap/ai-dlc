# AlTareq Open Finance Presentation Blueprint

A professional, modern HTML template for generating solution presentations about Open Finance value propositions for the UAE's AlTareq platform.

## Quick Start

1. Open the HTML template below in any web browser
2. Navigate through slides using arrow keys, on-screen buttons, or progress dots
3. Customize placeholders (marked as `{{PLACEHOLDER_NAME}}`) with your content
4. Save as `.html` and share

---

## HTML Template

The complete template is `../assets/templates/presentation.html` (the complete 9-slide presentation template) — read that file and fill it in as described here. It is a real HTML file, so it can be opened in a browser as-is.

---

## How to Customize

### Finding and Replacing Placeholders

All customizable content uses the `{{PLACEHOLDER_NAME}}` format. Use your text editor's find-and-replace function (Ctrl+H or Cmd+H) to efficiently update all instances.

### Complete Placeholder List

#### Presentation Metadata
- `{{PRESENTATION_TITLE}}` — Main presentation headline
- `{{CHANNEL_CONTEXT}}` — Context (e.g., "Mobile Banking", "API Marketplace")
- `{{JOURNEY_TYPE}}` — Type of user journey (e.g., "Open Banking Onboarding")
- `{{PRESENTATION_DESCRIPTION}}` — Subtitle/description on title slide
- `{{PRESENTATION_DATE}}` — Date (e.g., "February 2025")

#### Problem Statement (Slide 2)
- `{{PROBLEM_HEADLINE}}` — Main problem statement
- `{{PAIN_POINT_1_TITLE}}` through `{{PAIN_POINT_4_TITLE}}` — Pain point titles
- `{{PAIN_POINT_1_DESCRIPTION}}` through `{{PAIN_POINT_4_DESCRIPTION}}` — Pain point descriptions
- `{{PROBLEM_STAT}}` — Supporting statistic (e.g., "68% of customers struggle with...")

#### Solution Overview (Slide 3)
- `{{SOLUTION_HEADLINE}}` — Solution headline
- `{{SOLUTION_DESCRIPTION}}` — Solution description paragraph
- `{{APP_NAME}}` — Name of the app/service in the flow diagram
- `{{SOLUTION_POINT_1}}`, `{{SOLUTION_POINT_2}}`, `{{SOLUTION_POINT_3}}` — Key solution benefits

#### User Journey (Slide 4)
- `{{JOURNEY_HEADLINE}}` — Journey section headline
- `{{JOURNEY_STEP_1_TITLE}}` through `{{JOURNEY_STEP_5_TITLE}}` — Step titles
- `{{JOURNEY_STEP_1_DESCRIPTION}}` through `{{JOURNEY_STEP_5_DESCRIPTION}}` — Step descriptions

#### Interactive Demo (Slide 5)
- `{{PROTOTYPE_HTML_FILENAME}}` — Path to interactive prototype file (e.g., "prototype.html")
- `{{PROTOTYPE_DESCRIPTION}}` — Description under the demo card
- `{{PROTOTYPE_SCREENSHOT_PATH}}` — Path to screenshot image or text

#### Benefits (Slide 6)
- `{{BENEFITS_HEADLINE}}` — Section headline
- `{{CUSTOMER_BENEFIT_1}}` through `{{CUSTOMER_BENEFIT_4}}` — Customer-facing benefits
- `{{BUSINESS_BENEFIT_1}}` through `{{BUSINESS_BENEFIT_4}}` — Business/partner benefits

#### KPIs & Metrics (Slide 7)
- `{{METRICS_HEADLINE}}` — Section headline
- `{{METRIC_1_VALUE}}` through `{{METRIC_4_VALUE}}` — Metric values (e.g., "95%")
- `{{METRIC_1_LABEL}}` through `{{METRIC_4_LABEL}}` — Metric names
- `{{METRIC_1_DESCRIPTION}}` through `{{METRIC_4_DESCRIPTION}}` — Metric descriptions

#### Technical Architecture (Slide 8)
- `{{BANK_NAME}}` — Name of the bank/LFI (e.g., "Al Hilal Bank")

#### Call-to-Action (Slide 9)
- `{{CTA_SUBTITLE}}` — Subtitle under "Let's Build This Together"
- `{{ACTION_ITEM_1}}` through `{{ACTION_ITEM_4}}` — Phase descriptions
- `{{CONTACT_NAME}}` — Contact person name
- `{{CONTACT_EMAIL}}` — Email address
- `{{CONTACT_PHONE}}` — Phone number
- `{{COMPANY_WEBSITE}}` — Website URL

### Modifying Colors

To change the color scheme globally, update the CSS variables at the top of the `<style>` section:

```css
:root {
    --color-primary-dark: #003366;        /* Navy blue */
    --color-primary-accent: #00C8AF;      /* Teal/green */
    --color-progress-gradient: linear-gradient(90deg, #015AD7, #00C8AF);
    --color-button-gradient: linear-gradient(90deg, #003366, #00B894);
    --color-bg-light: #F0F2FA;            /* Light lavender */
    --color-card-bg: #FFFFFF;             /* White */
    --color-text-primary: #1A1D3B;        /* Dark text */
    --color-text-secondary: #6B7194;      /* Gray text */
}
```

### Adding or Removing Slides

**To add a new slide:**
1. Copy any existing slide `<div class="slide">...</div>` block
2. Paste it before the closing `</div>` of `.slides-wrapper`
3. Update content and placeholders
4. Change the `totalSlides` count in JavaScript (currently set to 9)

**To remove a slide:**
1. Delete the entire `<div class="slide">...</div>` block
2. Update the hard-coded slide count in the JavaScript section if needed

### Linking to Interactive Prototype

Replace `{{PROTOTYPE_HTML_FILENAME}}` with the path to your prototype:
- Same folder: `"prototype.html"`
- Subfolder: `"prototypes/main-flow.html"`
- External URL: `"https://example.com/prototype.html"`

### Responsive Behavior

The template is optimized for:
- **Desktop:** 1920×1080 and larger
- **Tablet:** 1024×768 to 1440×900
- **Mobile:** 375×667 and larger (navigation adapts)

CSS media queries automatically adjust layout at 1024px and 768px breakpoints.

### Keyboard Shortcuts

Users can navigate with:
- **Right arrow (→)** — Next slide
- **Left arrow (←)** — Previous slide
- **Click progress dots** — Jump to slide
- **Click Previous/Next buttons** — Navigate

### Font Customization

The template uses Google Fonts "Inter" via CDN. To use a different font:
1. Replace the Google Fonts URL in `<head>`
2. Update the font-family in CSS:
   ```css
   font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Your Font Name', sans-serif;
   ```

---

## Features Summary

✅ **9 professionally designed slide layouts**
✅ **Smooth keyboard and click navigation**
✅ **Progress dots and slide counter**
✅ **AlTareq brand colors pre-configured**
✅ **Fully responsive design**
✅ **Modern CSS animations and transitions**
✅ **Accessibility-ready (WCAG compliant)**
✅ **Single HTML file—no dependencies**
✅ **Production-ready for bank executives**
✅ **Easy customization with `{{PLACEHOLDER}}` format**

---

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support (optimized)

Save the file and open in your browser. No server or build tools required.
