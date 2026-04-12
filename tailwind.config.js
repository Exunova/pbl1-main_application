/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx}', './electron/**/*.{js,mjs}'],
  theme: {
    extend: {
      colors: {
        background: '#0d0f14',
        surface: '#141720',
        card: '#1c2030',
        accent: '#3b82f6',
        danger: '#ef4444',
        success: '#22c55e',
      }
    }
  },
  plugins: []
}