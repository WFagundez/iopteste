/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'topbar': '#0C447C',
        'sidebar': '#1A1A1A',
        'primary': '#E8820C',
        'primary-hover': '#C56E08',
        'primary-light': '#FEF3E7',
        'primary-border': '#F5A54A',
        'blue-accent': '#185FA5',
        'blue-light': '#E6F1FB',
        'blue-border': '#B5D4F4',
        'page-bg': '#F0F2F5',
        'card-bg': '#FFFFFF',
        'border-default': '#CCCCCC',
        'text-primary': '#1A1A1A',
        'text-secondary': '#6B6B6B',
        'status-green': '#1D9E75',
        'status-yellow': '#E8970C',
        'status-red': '#E24B4A',
        'status-teal': '#0E7C96',
        'status-gray': '#9CA3AF',
      }
    },
  },
  plugins: [],
}
