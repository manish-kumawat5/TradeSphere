/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: '#0B0E11',
          50: '#1A1D23',
          100: '#151820',
          200: '#131722',
          300: '#0F1218',
          400: '#0B0E11',
          500: '#080A0D',
        },
        accent: {
          DEFAULT: '#00D09C',
          light: '#00E8AD',
          dark: '#00B386',
          50: 'rgba(0, 208, 156, 0.05)',
          100: 'rgba(0, 208, 156, 0.1)',
          200: 'rgba(0, 208, 156, 0.2)',
        },
        sell: {
          DEFAULT: '#FF5252',
          light: '#FF6B6B',
          dark: '#E04545',
        },
        muted: {
          DEFAULT: '#8A8F98',
          light: '#A0A5AE',
          dark: '#6B7080',
        },
        surface: {
          DEFAULT: '#131722',
          light: '#1A1D23',
          border: 'rgba(255, 255, 255, 0.06)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 208, 156, 0.1)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 208, 156, 0.3)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 208, 156, 0.15)',
        'glow-lg': '0 0 40px rgba(0, 208, 156, 0.2)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
};
