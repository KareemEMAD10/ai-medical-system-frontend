/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f0fa',
          100: '#cce1f5',
          200: '#99c3eb',
          300: '#66a5e0',
          400: '#3387d6',
          500: '#0069cc',
          600: '#0054a3',
          700: '#003f7a',
          800: '#002a52',
          900: '#001529',
        },
        secondary: {
          500: '#2ecc71',
          600: '#27ae60',
        },
        accent: {
          500: '#e74c3c',
          600: '#c0392b',
        },
        dark: {
          100: '#2d2d2d',
          200: '#1a1a1a',
          300: '#0d0d0d',
        }
      },
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
