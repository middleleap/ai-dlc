/**
 * MiddleLeap Tailwind preset · v2.0
 * Usage: // tailwind.config.js
 *   module.exports = { presets: [require('./brand-kit/tailwind.preset.js')], content: [...] }
 * Rules (see DESIGN.md): UI radius is 0 — use rounded-none; rounded-mark is for pivot glyphs only.
 * The ember gradient (bg-ember-grad) is THE MARK ONLY, never buttons.
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        ink: {
          0: '#080808', 1: '#101010', 2: '#181817',
          3: '#232321', 4: '#33322F', border: '#1E1E1C',
        },
        bone: {
          0: '#ECE9E1', 1: '#DEDBD4', 2: '#A8A59E',
          3: '#87847D', // AA >=4.8:1 on all surfaces
          4: '#4A4945', // disabled only
        },
        ember: {
          300: '#F58F55', 400: '#F0722E', 500: '#E65C2D',
          600: '#CE451B', 700: '#A83614',
          dim: 'rgba(230,92,45,.14)',
        },
        positive: { DEFAULT: '#5FA671', dim: 'rgba(95,166,113,.14)' },
        caution:  { DEFAULT: '#D9A03C', dim: 'rgba(217,160,60,.14)' },
        critical: { DEFAULT: '#D64545', text: '#E06060', dim: 'rgba(214,69,69,.14)' },
        info:     { DEFAULT: '#5D8FA6', dim: 'rgba(93,143,166,.14)' },
        'danger-btn': '#C43B3B',
      },
      fontFamily: {
        display: ["'Instrument Serif'", 'Georgia', 'serif'], // weight 400 only
        body: ["'DM Sans'", 'Arial', 'sans-serif'],
        mono: ["'JetBrains Mono'", 'monospace'],
      },
      fontSize: {
        hero: ['clamp(44px,6vw,76px)', { lineHeight: '1.08' }],
        h1: ['42px', { lineHeight: '1.2' }],
        h2: ['30px', { lineHeight: '1.25' }],
        h3: ['22px', { lineHeight: '1.3' }],
        caption: ['12.5px', { lineHeight: '1.5' }],
      },
      spacing: { 18: '4.5rem' }, // 4px grid comes free with Tailwind's default scale
      borderRadius: {
        none: '0',
        chip: '2px',
        mark: '16%', // pivot glyphs only
      },
      backgroundImage: {
        'ember-grad': 'linear-gradient(135deg,#F0722E 0%,#CE451B 100%)', // the mark only
      },
      boxShadow: {
        raised: '0 1px 2px rgba(0,0,0,.5)',
        overlay: '0 4px 16px rgba(0,0,0,.45)',
        ember: '0 4px 24px rgba(230,92,45,.28)', // primary CTA hover only
      },
      transitionDuration: { fast: '120ms', base: '200ms', leap: '400ms' },
      transitionTimingFunction: {
        out: 'cubic-bezier(.2,0,0,1)',
        leap: 'cubic-bezier(.34,1.3,.4,1)', // pivots only
      },
      maxWidth: { container: '1080px' },
      keyframes: {
        'pivot-loop': {
          '0%,15%': { transform: 'rotate(0deg)' },
          '50%,70%': { transform: 'rotate(45deg)' },
          '100%': { transform: 'rotate(90deg)' },
        },
        'pivot-replay': {
          '0%': { transform: 'rotate(0) translateX(-24px)' },
          '100%': { transform: 'rotate(45deg) translateX(0)' },
        },
        'leap-in': {
          '0%': { transform: 'rotate(0) translateX(-32px)', opacity: '0' },
          '35%': { opacity: '1' },
          '100%': { transform: 'rotate(45deg) translateX(0)', opacity: '1' },
        },
      },
      animation: {
        loader: 'pivot-loop 1.6s cubic-bezier(.34,1.3,.4,1) infinite',
        'leap-in': 'leap-in .9s cubic-bezier(.34,1.3,.4,1) .3s both',
      },
    },
  },
};
