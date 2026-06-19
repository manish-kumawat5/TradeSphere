/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['Hanken Grotesk', 'Inter', 'sans-serif'],
        mono:  ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        primary:   { DEFAULT: '#2962FF', light: '#5C85FF', dark: '#1539B3', subtle: 'rgba(41,98,255,0.08)' },
        secondary: { DEFAULT: '#00C853', light: '#00E676', dark: '#007A32', subtle: 'rgba(0,200,83,0.08)' },
        tertiary:  { DEFAULT: '#FF5252', light: '#FF6E6E', dark: '#C62828', subtle: 'rgba(255,82,82,0.08)' },
        neutral: {
          950: '#020617', 900: '#0F172A', 800: '#1E293B', 700: '#2D3B52',
          600: '#3D4E68', 500: '#64748B', 400: '#94A3B8', 300: '#CBD5E1',
          200: '#E2E8F0', 100: '#F1F5F9', 50: '#F8FAFC',
        },
        up:     '#00C853',
        down:   '#FF5252',
        brand:  '#2962FF',
        surface:  '#0F172A',
        'surface-border': 'rgba(255,255,255,0.08)',
        'surface-light': '#1C2333',
        card:     '#1E293B',
        elevated: '#2D3B52',
        accent:   '#00D09C',
        sell:     '#FF4757',
        muted:    '#8B949E',
        'muted-light': '#A0AAB4',
        dark:     '#080B10',
        'dark-50': '#0D1117',
      },
      boxShadow: {
        card:    '0 4px 16px rgba(2,6,23,0.4), 0 0 0 0.5px var(--border-subtle)',
        modal:   '0 24px 64px rgba(2,6,23,0.8), 0 0 0 1px var(--border-default)',
        glow:    '0 0 20px rgba(0,208,156,0.2)',
        'glow-primary': '0 0 24px rgba(41,98,255,0.25)',
        'glow-up':      '0 0 20px rgba(0,200,83,0.20)',
      },
      borderRadius: { sm:'6px', md:'10px', lg:'14px', xl:'20px', '2xl':'28px' },
    },
  },
  plugins: [],
}
