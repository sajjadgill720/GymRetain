import type { Config } from 'tailwindcss';

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
        canvas: 'var(--bg-canvas)',
        surface: {
          DEFAULT: 'var(--bg-surface)',
          card: 'var(--bg-card)',
          elevated: 'var(--bg-card-elevated)',
          subtle: 'var(--bg-subtle)',
          sidebar: 'var(--bg-sidebar)',
          border: 'var(--border-color)',
          'border-hover': 'var(--border-hover)',
        },
        content: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        brand: {
          50: '#F0F3ED', 100: '#E1E9DE', 200: '#C7D7C4', 300: '#A7C0A4',
          400: '#7E9F7B', 500: '#537C60', 600: '#365D47', 700: '#244B3D',
          800: '#203E32', 900: '#1B3027',
        },
        brass: {
          50: '#F8F5EB', 100: '#F0E9D6', 200: '#E1D5B7', 300: '#D2C49F',
          400: '#C4B58F', 500: '#AD9A70', 600: '#8D794F', 700: '#6F603F',
          800: '#554B34', 900: '#393427',
        },
        emerald: { 400: '#A6BEA3', 500: '#55764C', 600: '#45683D', 700: '#3E5C43' },
        // Compatibility shades keep older page and chart utilities in the same palette.
        blue: {
          50: '#F0F4E9', 100: '#E4ECD8', 200: '#CCDABD', 300: '#B4C89F',
          400: '#9CB78C', 500: '#618266', 600: '#365F47', 700: '#234F3D',
          800: '#203F30', 900: '#182F24',
        },
        purple: { 400: '#C2AFBE', 500: '#947A91', 600: '#795F77', 700: '#624B60' },
        violet: { 400: '#C2AFBE', 500: '#947A91', 600: '#795F77', 700: '#624B60' },
        cyan: { 400: '#B2C5B8', 500: '#789A88', 600: '#4C7461', 700: '#365A49' },
        orange: { 400: '#C9AF78', 500: '#A58349', 600: '#816232', 700: '#684E29' },
        slate: { 50: '#FAF9F4', 100: '#F0F1E7', 200: '#D6D9C8', 300: '#BFC6B3', 400: '#909D85', 500: '#6C7A66', 600: '#52624E', 700: '#3B4D39', 800: '#293A2B', 900: '#1D2B20' },
        zinc: { 100: '#F0F1E7', 200: '#D6D9C8', 300: '#BFC6B3', 400: '#89957D', 500: '#6C7A66', 600: '#52624E', 700: '#3B4D39', 800: '#293A2B', 900: '#1D2B20' },
        red: { 400: '#D7A08D', 500: '#A84F46', 600: '#963E37', 700: '#885341' },
        amber: { 400: '#CFB477', 500: '#85651A', 600: '#745613', 700: '#7C6537' },
        status: {
          success: '#6F8C6A',
          'success-bg': 'var(--status-success-bg)',
          'success-text': 'var(--status-success-text)',
          'success-border': 'var(--status-success-border)',
          warning: '#B49960',
          'warning-bg': 'var(--status-warning-bg)',
          'warning-text': 'var(--status-warning-text)',
          'warning-border': 'var(--status-warning-border)',
          danger: '#BA806B',
          'danger-bg': 'var(--status-danger-bg)',
          'danger-text': 'var(--status-danger-text)',
          'danger-border': 'var(--status-danger-border)',
          info: '#718A7A',
          'info-bg': 'var(--status-info-bg)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        btn: 'var(--shadow-btn)',
        'btn-hover': 'var(--shadow-btn-hover)',
        'btn-primary': 'var(--shadow-btn-primary)',
        'btn-primary-hover': 'var(--shadow-btn-primary-hover)',
        glow: '0 0 20px -3px rgba(97, 130, 102, 0.2)',
      },
      animation: {
        'float-slow': 'float 4s ease-in-out infinite',
        'float-delayed': 'float 4s ease-in-out 2s infinite',
        'pulse-glow': 'pulse-glow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.9', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
