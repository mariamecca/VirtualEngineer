export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a'
        },
        construction: {
          yellow: '#f59e0b',
          orange: '#f97316',
          dark: '#1c1917'
        }
      }
    }
  },
  plugins: []
}
