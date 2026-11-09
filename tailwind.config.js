/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sd: {
          dark: '#24130a',
          woodDark: '#381f13',
          woodMed: '#5b3117',
          woodLight: '#8b5329',
          parchment: '#fbf2d5',
          parchmentDark: '#eedcb1',
          gold: '#f6b262',
          goldGlow: '#ffdf79',
          iridium: '#9b51e0',
          silver: '#a0aec0',
          green: '#487332',
          red: '#a93226',
          blue: '#2e6b9e'
        }
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        retro: ['"VT323"', 'monospace'],
        serifSc: ['"Noto Serif SC"', 'serif']
      },
      boxShadow: {
        'pixel': '4px 4px 0px rgba(0, 0, 0, 0.45)',
        'pixel-sm': '2px 2px 0px rgba(0, 0, 0, 0.45)',
        'pixel-lg': '6px 6px 0px rgba(0, 0, 0, 0.55)',
        'gold-glow': '0 0 16px rgba(246, 178, 98, 0.6)'
      }
    },
  },
  plugins: [],
}
