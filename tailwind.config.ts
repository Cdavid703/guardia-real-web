import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Paleta Guardia Real de Antioquia
        navy:       '#1B2E6E',
        royal:      '#1B75BB',
        sky:        '#5AB8E5',
        gold:       '#F2C100',
        'gold-dark':'#C9A000',
        green:      '#3D8B3D',
        'near-black':'#0D1B3E',
        brand: {
          50:  '#EEF1F6',
          100: '#D8DCE8',
          200: '#8A93AA',
          300: '#4A5068',
          400: '#1B75BB',
          500: '#1B2E6E',
          600: '#142260',
          700: '#0D1B3E',
          800: '#091226',
          900: '#040B15',
        },
      },
      fontFamily: {
        display: ['var(--font-cinzel)', 'Trajan Pro', 'serif'],
        serif:   ['var(--font-playfair)', 'EB Garamond', 'Georgia', 'serif'],
        sans:    ['var(--font-inter)', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #1B2E6E 0%, #1B75BB 100%)',
        'gradient-hero':    'linear-gradient(135deg, #0D1B3E 0%, #1B2E6E 60%, #1B5A8A 100%)',
        'gradient-aqua':    'linear-gradient(90deg, #1B75BB 0%, #5AB8E5 100%)',
        'gradient-premium': 'linear-gradient(135deg, #1B2E6E 0%, #C9A000 100%)',
      },
      boxShadow: {
        sm:   '0 1px 3px rgba(27,46,110,.12), 0 1px 2px rgba(27,46,110,.08)',
        md:   '0 4px 16px rgba(27,46,110,.14), 0 2px 6px rgba(27,46,110,.10)',
        lg:   '0 10px 40px rgba(27,46,110,.18), 0 4px 16px rgba(27,46,110,.12)',
        xl:   '0 20px 60px rgba(27,46,110,.22), 0 8px 24px rgba(27,46,110,.16)',
        gold: '0 4px 20px rgba(242,193,0,.35)',
      },
      borderRadius: {
        sm:   '4px',
        md:   '8px',
        lg:   '16px',
        xl:   '24px',
        full: '9999px',
      },
      animation: {
        'fade-up':   'fadeUp 0.6s ease-out forwards',
        'fade-in':   'fadeIn 0.4s ease-out forwards',
        'slide-in':  'slideIn 0.4s ease-out forwards',
        'pulse-gold':'pulseGold 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 4px 20px rgba(242,193,0,.35)' },
          '50%':      { boxShadow: '0 4px 32px rgba(242,193,0,.55)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
