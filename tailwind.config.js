/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* surfaces & layout */
        app: 'var(--bg-app)',
        deep: 'var(--bg-deep)',
        main: 'var(--bg-main)',
        side: {
          left: 'var(--bg-left)',
          right: 'var(--bg-right)',
        },
        elevated: 'var(--bg-active)',
        tab: {
          active: 'var(--bg-active)',
          idle: 'var(--bg-tab-idle)',
        },
        surface: {
          DEFAULT: 'var(--bg-surface)',
          2: 'var(--bg-surface-2)',
          3: 'var(--bg-surface-3)',
        },
        input: 'var(--bg-input)',
        toolbar: 'var(--bg-toolbar)',
        code: 'var(--bg-code)',
        graph: 'var(--bg-graph)',
        hover: 'var(--bg-hover)',
        'hover-strong': 'var(--bg-hover-strong)',

        /* lines & type */
        line: 'var(--border)',
        'line-strong': 'var(--border-strong)',
        ink: {
          DEFAULT: 'var(--text)',
          soft: 'var(--text-soft)',
          dim: 'var(--text-dim)',
          mute: 'var(--text-mute)',
          faint: 'var(--text-faint)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          bright: 'var(--accent-bright)',
          soft: 'var(--accent-soft)',
          deep: 'var(--accent-deep)',
          edge: 'var(--accent-edge)',
        },
        link: 'var(--link)',
        danger: 'var(--danger)',
        success: 'var(--success)',
        warn: 'var(--warn)',
        selection: 'var(--selection)',
      },
      fontFamily: {
        sans: ['var(--font-ui)'],
        mono: ['var(--font-mono)'],
        editor: ['var(--font-editor)'],
      },
      boxShadow: {
        palette: 'var(--shadow-palette)',
        menu: 'var(--shadow-menu)',
        toolbar: 'var(--shadow-toolbar)',
        pop: 'var(--shadow-pop)',
      },
      transitionTimingFunction: {
        nexus: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
