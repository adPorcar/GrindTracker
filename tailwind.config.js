/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#FDFBF7',
          100: '#F5EFEB',
          200: '#E8DACF',
          300: '#D5BEB0',
          400: '#B58F76',
          500: '#8E5B3D',
          600: '#6F4228',
          700: '#54311D',
          800: '#392013',
          900: '#23140C',
          950: '#140A06',
        },
        crema: {
          light: '#FFFDF9',
          DEFAULT: '#FDF8F0',
          dark: '#F3EAD9',
        },
        terracotta: {
          light: '#EAA088',
          DEFAULT: '#C86242',
          dark: '#A34629',
        },
        darkbg: {
          base: '#131110',
          card: '#1F1B18',
          cardHover: '#2A2421',
          border: '#342D29',
          input: '#25201D'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(111, 66, 40, 0.08)',
        'soft-lg': '0 10px 25px -3px rgba(111, 66, 40, 0.12)',
        'dark-soft': '0 4px 20px -2px rgba(0, 0, 0, 0.4)',
      },
      borderRadius: {
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
