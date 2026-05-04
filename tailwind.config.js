/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['DM Serif Display', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          50:  '#f0faf4',
          100: '#dcf0e7',
          200: '#b8e1cf',
          300: '#87cbae',
          400: '#52b088',
          500: '#2d9168',
          600: '#1b6b45',   // ← primary brand
          700: '#165a3a',
          800: '#124930',
          900: '#0e3c27',
        },
      },
      borderRadius: {
        'sm':  '8px',
        'md':  '12px',
        'lg':  '16px',
        'xl':  '20px',
        '2xl': '24px',
      },
      boxShadow: {
        'xs': '0 1px 2px rgba(15,23,17,0.04)',
        'sm': '0 2px 8px rgba(15,23,17,0.06), 0 0 0 1px rgba(15,23,17,0.03)',
        'md': '0 4px 16px rgba(15,23,17,0.08), 0 0 0 1px rgba(15,23,17,0.03)',
        'lg': '0 12px 40px rgba(15,23,17,0.12), 0 0 0 1px rgba(15,23,17,0.04)',
        'xl': '0 24px 64px rgba(15,23,17,0.16)',
      },
      animation: {
        'appear':     'appear 0.25s ease',
        'slide-up':   'slideUp 0.2s cubic-bezier(0.34,1.2,0.64,1)',
        'pop-in':     'popIn 0.15s cubic-bezier(0.34,1.56,0.64,1)',
        'bounce-sm':  'bounceSm 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        'shimmer':    'shimmer 1.5s infinite',
      },
      keyframes: {
        appear:   { from: { opacity: '0', transform: 'translateY(-6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideUp:  { from: { opacity: '0', transform: 'translateY(12px) scale(0.97)' }, to: { opacity: '1', transform: 'translateY(0) scale(1)' } },
        popIn:    { from: { opacity: '0', transform: 'scale(0.8) translateY(4px)' }, to: { opacity: '1', transform: 'scale(1) translateY(0)' } },
        bounceSm: { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.25)' } },
        shimmer:  { '0%': { backgroundPosition: '200% 0' }, '100%': { backgroundPosition: '-200% 0' } },
      },
    },
  },
  plugins: [],
}
