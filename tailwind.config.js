/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          // ── Dark editorial palette ──────────────────────
          orange:        '#C4622D',   // terracotta accent
          'orange-light':'#E4956A',   // warm peach hover
          cream:         '#F8F4EE',   // warm light bg
          charcoal:      '#1C1712',   // dark warm brown (primary text)
          muted:         '#A09590',   // warm grey (secondary text)
          border:        '#D5CCC0',   // hairline light border
          card:          '#EEE8DF',   // raised card surface
          'card-high':   '#E4DDD4',   // further elevated surface
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
