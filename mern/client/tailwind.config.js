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
        display: ['Fraunces', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },

      /*
       * THEME A — Midnight Navy + Champagne Gold
       * Only 3 brand families + neutrals. Emerald and rose stay untouched as
       * semantic colours (correct / wrong). To roll back, restore this file
       * from the git tag `theme-before-a`.
       */
      colors: {
        // Premium cool neutral: canvas, borders, body text, header, cards
        slate: {
          50: '#F7F8FC',
          100: '#EEF1F8',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1B2437',
          900: '#0B1220',
          950: '#060A14',
        },
        // Primary brand: royal indigo (links, secondary actions, AI)
        indigo: {
          50: '#F0F1FE',
          100: '#E2E4FD',
          200: '#C8CBFB',
          300: '#A5A9F7',
          400: '#8285F2',
          500: '#6667E8',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#27227A',
          950: '#161244',
        },
        // Accent: champagne gold — CTA, active state, highlights only
        amber: {
          50: '#FFFBF0',
          100: '#FDF3D3',
          200: '#FBE7A6',
          300: '#F8D66D',
          400: '#F5B301',
          500: '#E0A200',
          600: '#BE8500',
          700: '#946600',
          800: '#755000',
          900: '#543A00',
          950: '#332200',
        },
      },

      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '26px',
      },

      // One border colour everywhere, so no grey/slate mismatch.
      borderColor: {
        DEFAULT: '#E2E8F0',
      },
      ringColor: {
        DEFAULT: '#4F46E5',
      },

      boxShadow: {
        sm: '0 1px 2px rgba(11, 18, 32, 0.04), 0 4px 12px rgba(11, 18, 32, 0.05)',
        DEFAULT: '0 2px 6px rgba(11, 18, 32, 0.05), 0 8px 20px rgba(11, 18, 32, 0.06)',
        md: '0 2px 4px rgba(11, 18, 32, 0.04), 0 8px 22px rgba(11, 18, 32, 0.08)',
        lg: '0 12px 30px rgba(11, 18, 32, 0.10)',
        xl: '0 20px 44px rgba(11, 18, 32, 0.13)',
        '2xl': '0 28px 64px rgba(11, 18, 32, 0.18)',
        gold: '0 10px 24px rgba(245, 179, 1, 0.28)',
      },

      keyframes: {
        tickerMarquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        newMaterialGlow: {
          '0%, 100%': { borderColor: '#F5B301', boxShadow: '0 0 10px rgba(245, 179, 1, 0.35)' },
          '50%': { borderColor: '#4338CA', boxShadow: '0 0 16px rgba(67, 56, 202, 0.35)' },
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
