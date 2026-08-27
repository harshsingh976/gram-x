/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0B1F3A',
          light: '#142e52',
          dark: '#070f1c',
        },
        govblue: {
          DEFAULT: '#155EEF',
          light: '#3b82f6',
          dark: '#1249c7',
        },
        saffron: {
          DEFAULT: '#F97316',
          light: '#fb923c',
          dark: '#ea580c',
        },
        govgreen: {
          DEFAULT: '#15803D',
          light: '#22c55e',
          dark: '#166534',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Devanagari', 'Noto Sans Tamil', 'Noto Sans Telugu', 'system-ui', 'sans-serif'],
        hindi: ['Noto Sans Devanagari', 'Inter', 'system-ui', 'sans-serif'],
        tamil: ['Noto Sans Tamil', 'Inter', 'system-ui', 'sans-serif'],
        telugu: ['Noto Sans Telugu', 'Inter', 'system-ui', 'sans-serif'],
      },

    },
  },
  plugins: [],
}
