import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#e6f2ec',
          100: '#c0ddc9',
          200: '#96c8a4',
          300: '#6bb37f',
          400: '#4da265',
          500: '#2d914b',
          600: '#1b6b45',
          700: '#145538',
          800: '#0c3f2a',
          900: '#042a1b',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
