/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Refined Enterprise Dark Color Palette
        background: {
          primary: '#0F172A',
          secondary: '#111827',
        },
        surface: {
          card: '#1E293B',
          elevated: '#243244',
        },
        border: {
          default: '#334155',
        },
        accent: {
          primary: '#3B82F6',
          hover: '#2563EB',
          pressed: '#1D4ED8',
        },
        status: {
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
        },
        text: {
          primary: '#F8FAFC',
          secondary: '#CBD5E1',
          muted: '#94A3B8',
          disabled: '#64748B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
        modal: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
        dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
      },
      transitionProperty: {
        all: 'all',
      },
      transitionTimingFunction: {
        bezier: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
