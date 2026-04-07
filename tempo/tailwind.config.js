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
        background: '#08080f',
        surface: '#0f0f1a',
        card: '#13131f',
        hover: '#1a1a2e',
        border: 'rgba(255,255,255,0.06)',
        accent: {
          DEFAULT: '#7c3aed',
          hover: '#6d28d9',
          muted: 'rgba(124,58,237,0.15)',
        },
        text: {
          primary: '#f1f0f8',
          secondary: '#8b8aa8',
          muted: '#4a4964',
        },
      },
      fontFamily: {
        sans: ['Geist Variable', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'Consolas', 'monospace'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
