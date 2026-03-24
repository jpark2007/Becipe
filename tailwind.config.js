/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          // ── Dark editorial palette ──────────────────────
          orange:        '#C4622D',   // terracotta accent
          'orange-light':'#E4956A',   // warm peach hover
          cream:         '#0C0A08',   // ink black (all backgrounds)
          charcoal:      '#EDE8DC',   // warm ivory (primary text)
          muted:         '#7A6E64',   // warm grey (secondary text)
          border:        '#272018',   // hairline dark border
          card:          '#161210',   // raised card surface
          'card-high':   '#201C18',   // further elevated surface
        },
      },
      fontFamily: {
        display:       ['CormorantGaramond_600SemiBold'],
        'display-reg': ['CormorantGaramond_400Regular'],
        'display-it':  ['CormorantGaramond_400Regular'],
        mono:          ['DMMono_400Regular'],
        'mono-med':    ['DMMono_500Medium'],
        body:          ['Lora_400Regular'],
        'body-it':     ['Lora_400Regular'],
      },
    },
  },
  plugins: [],
};
