/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4fbf7',
          100: '#e5f6ee',
          200: '#ccecdc',
          500: '#10b981',
          600: '#059669',
          900: '#064e3b',
        },
        matcha: {
          100: '#eef6ea',
          500: '#6b9055',
          600: '#557642',
        },
        coffee: {
          100: '#f7ede2',
          500: '#9c6644',
          600: '#7f5539',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'San Francisco', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
      },
      boxShadow: {
        'airbnb': '0 6px 20px rgba(0,0,0,0.12)',
        'pill': '0 3px 12px rgba(0,0,0,0.15)',
        'pill-active': '0 4px 16px rgba(0,0,0,0.35)',
      }
    },
  },
  plugins: [],
}
