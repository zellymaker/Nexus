/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        win: { DEFAULT: '#121217', deep: '#0e0e13' },
        pane: { left: '#131418', main: '#1c1d21', right: '#1e1e25' },
        tab: { active: '#1f1f26', idle: '#151618' },
        line: 'rgba(255,255,255,0.075)',
        ink: {
          DEFAULT: '#e9e9ee',
          soft: '#c9c9d1',
          dim: '#a2a2ad',
          mute: '#7c7c87',
          faint: '#5f5f69',
        },
        accent: {
          DEFAULT: '#877ffe',
          bright: '#9d95ff',
          soft: '#6f68c9',
          deep: '#5651a8',
          edge: '#4c4786',
        },
        card: {
          DEFAULT: '#232329',
          hi: '#26262d',
          input: '#26272c',
          chip: '#2c2e34',
          code: '#2b2b34',
          graph: '#24242b',
          quote: '#1e1e24',
        },
        hover: 'rgba(255,255,255,0.055)',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        palette:
          '0 32px 80px -16px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.055)',
        toolbar: '0 12px 32px -12px rgba(0,0,0,0.6)',
        window: '0 40px 120px -24px rgba(0,0,0,0.85)',
      },
    },
  },
  plugins: [],
}
