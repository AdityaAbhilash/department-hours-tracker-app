/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dce8ff',
          200: '#b8d0ff',
          300: '#8ab0ff',
          400: '#5c8bff',
          500: '#3a66f5',
          600: '#2c4dd6',
          700: '#253dac',
          800: '#213489',
          900: '#1f306c'
        }
      }
    }
  },
  plugins: []
};
