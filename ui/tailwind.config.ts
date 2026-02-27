import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-elevated': 'rgb(var(--surface-elevated) / <alpha-value>)',
        'surface-sunken': 'rgb(var(--surface-sunken) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        'border-subtle': 'rgb(var(--border-subtle) / <alpha-value>)',
        'text-primary': 'rgb(var(--text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--text-secondary) / <alpha-value>)',
        'text-muted': 'rgb(var(--text-muted) / <alpha-value>)',
        'text-faint': 'rgb(var(--text-faint) / <alpha-value>)',
        'input-bg': 'rgb(var(--input-bg) / <alpha-value>)',
        'input-border': 'rgb(var(--input-border) / <alpha-value>)',
        brand: {
          50: '#f5edff',
          100: '#e8d5ff',
          200: '#d3b0ff',
          300: '#b87dfc',
          400: '#a052f4',
          500: '#893ceb',
          600: '#7228cc',
          700: '#5c1fa8',
          800: '#481787',
          900: '#360f66',
        },
        market: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        crypto: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
