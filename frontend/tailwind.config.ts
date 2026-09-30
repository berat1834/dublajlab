import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        '3xl': '1920px',
        '4xl': '2560px',
      },
      colors: {
        ink: '#08090D',
        panel: '#111115',
        lime: '#B8FF4D',
        mint: '#22E6C3',
        'lime-dim': '#3a4a1a',
        violet: '#a78bfa',
        'violet-dim': '#2e2250',
        surface: '#18181b',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 28px rgba(184, 255, 77, 0.12)',
        'glow-lg': '0 0 48px rgba(184, 255, 77, 0.15), 0 0 12px rgba(184, 255, 77, 0.08)',
        card: '0 4px 24px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.04)',
      },
      keyframes: {
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out both',
      },
    },
  },
  plugins: [],
} satisfies Config

