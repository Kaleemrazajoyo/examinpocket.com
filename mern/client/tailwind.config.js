/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx}',
    './src/pages/**/*.{js,jsx}',
    './src/context/**/*.{js,jsx}',
    './src/layout/**/*.{js,jsx}',
    './src/hooks/**/*.{js,jsx}',
  ],
  safelist: [
    'active-link',
    'nav-link',
    'opt-correct',
    'opt-wrong',
    'new-card-glow',
    'ticker-marquee-content',
    'animate-ping',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      keyframes: {
        tickerMarquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        newMaterialGlow: {
          '0%, 100%': { borderColor: '#fbbf24', boxShadow: '0 0 10px rgba(251, 191, 36, 0.4)' },
          '50%': { borderColor: '#6366f1', boxShadow: '0 0 14px rgba(99, 102, 241, 0.45)' },
        },
      },
      animation: {
        ticker: 'tickerMarquee 22s linear infinite',
        'glow-new': 'newMaterialGlow 3s infinite ease-in-out',
      },
    },
  },
  plugins: [],
};
