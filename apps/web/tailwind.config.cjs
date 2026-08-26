module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces
        deep: '#070B10',
        panel: '#0D131C',
        raised: '#131B27',
        overlay: '#182234',
        // Text
        ink: { DEFAULT: '#E8EDF5', dim: '#97A3B6', faint: '#5C6879' },
        // Borders
        edge: { DEFAULT: 'rgba(148,163,184,0.10)', strong: 'rgba(148,163,184,0.20)' },
        // Brand accent (mint emerald — profit-forward grid trading identity)
        accent: {
          DEFAULT: '#2DD4A0',
          hover: '#26BE8F',
          soft: 'rgba(45,212,160,0.12)',
          glow: 'rgba(45,212,160,0.28)',
        },
        // Semantic trading colors
        up: { DEFAULT: '#34D399', soft: 'rgba(52,211,153,0.12)' },
        down: { DEFAULT: '#F87171', soft: 'rgba(248,113,113,0.12)' },
        warn: { DEFAULT: '#FBBF24', soft: 'rgba(251,191,36,0.12)' },
        info: { DEFAULT: '#38BDF8', soft: 'rgba(56,189,248,0.12)' },
        violet: { DEFAULT: '#A78BFA', soft: 'rgba(167,139,250,0.12)' },
      },
      fontFamily: {
        sans: [
          'var(--font-inter)',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'var(--font-mono)',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'Liberation Mono',
          'monospace',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.30), 0 0 0 1px rgba(148,163,184,0.06)',
        pop: '0 12px 40px -12px rgba(0,0,0,0.65), 0 0 0 1px rgba(148,163,184,0.08)',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        'pulse-dot': 'pulse-dot 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
