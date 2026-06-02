import tailwindcssTypography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Noto Sans JP"', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Noto Serif JP"', '"Yu Mincho"', 'serif'],
      },
    },
  },
  plugins: [tailwindcssTypography],
}