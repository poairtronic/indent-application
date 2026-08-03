/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          primary: 'var(--bg-main)',
          secondary: 'var(--bg-secondary)',
        },
        surface: {
          card: 'var(--bg-card)',
          elevated: 'var(--surface-elevated)',
          hover: 'var(--surface-hover)',
        },
        border: {
          default: 'var(--border-color)',
          strong: 'var(--border-strong)',
        },
        accent: {
          primary: 'var(--primary)',
          hover: 'var(--primary-hover)',
          pressed: 'var(--primary-pressed)',
          light: 'var(--primary-light)',
          soft: 'var(--primary-soft)',
          softer: 'var(--primary-softer)',
        },
        overlay: {
          DEFAULT: 'var(--overlay)',
          light: 'var(--overlay-light)',
        },
        info: {
          DEFAULT: 'var(--info)',
          hover: 'var(--info-hover)',
          soft: 'var(--info-soft)',
        },
        status: {
          success: 'var(--success)',
          warning: 'var(--warning)',
          error: 'var(--danger)',
          info: 'var(--info)',
        },
        text: {
          primary: 'var(--text-main)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          disabled: 'var(--text-disabled)',
        },
        toast: {
          action: 'var(--toast-action-bg)',
          'action-hover': 'var(--toast-action-hover)',
          'progress-track': 'var(--toast-progress-track)',
          'progress-fill': 'var(--toast-progress-fill)',
          dismiss: 'var(--toast-dismiss)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: 'var(--shadow-sm)',
        modal: 'var(--shadow-lg)',
        dropdown: 'var(--shadow-md)',
        glass: 'var(--shadow-md)',
        glow: 'var(--glow-primary)',
        'glow-info': 'var(--glow-info)',
        'glow-success': 'var(--glow-success)',
        'glow-warning': 'var(--glow-warning)',
        'glow-danger': 'var(--glow-danger)',
        lift: '0 12px 32px -4px rgba(0, 0, 0, 0.5)',
      },
      backgroundImage: {
        'grad-card': 'var(--grad-card)',
        'grad-primary': 'var(--grad-primary)',
        'grad-info': 'var(--grad-info)',
        'grad-success': 'var(--grad-success)',
        'grad-warning': 'var(--grad-warning)',
        'grad-danger': 'var(--grad-danger)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      transitionProperty: {
        all: 'all',
      },
      transitionTimingFunction: {
        bezier: 'cubic-bezier(0.4, 0, 0.2, 1)',
        enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
        spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
    },
  },
  plugins: [],
};
