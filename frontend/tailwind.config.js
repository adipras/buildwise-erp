/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Design system BuildWise
        navy:    '#0F2B4A',
        primary: '#1A5276',
        accent:  '#E67E22',
        'accent-light': '#F39C12',
        success: '#27AE60',
        danger:  '#E74C3C',
        warning: '#F1C40F',
        'light-bg': '#F0F4F8',
        'card-bg':  '#FFFFFF',
        'text-dark': '#1A2535',
        'text-mid':  '#4A6080',
        'text-light':'#8FA5C0',
        border:      '#D4E1F0',
        'badge-success': '#D5F5E3',
        'badge-warning': '#FDEBD0',
        'badge-danger':  '#FADBD8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
