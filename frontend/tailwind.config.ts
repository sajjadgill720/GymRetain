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
        // Linear & Vercel-inspired Neutral Cool Dark System
        background: '#09090B',
        canvas: '#09090B',
        surface: {
          50: '#27272A',  // zinc-800
          100: '#18181B', // zinc-900
          200: '#121215', // subtle card dark
          300: '#09090B', // zinc-950
          border: '#27272A',
        },
        // Crisp High-Contrast Neutrals for Text
        content: {
          primary: '#FAFAFA',
          secondary: '#A1A1AA',
          tertiary: '#71717A',
        },
        // Single Purposeful Brand Accent (Linear / Stripe Indigo-Blue)
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        // Functional Status Colors
        success: {
          light: '#ECFDF5',
          DEFAULT: '#10B981',
          dark: '#059669',
        },
        warning: {
          light: '#FFFBEB',
          DEFAULT: '#F59E0B',
          dark: '#D97706',
        },
        danger: {
          light: '#FEF2F2',
          DEFAULT: '#EF4444',
          dark: '#DC2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        // Crisp tactile button shadows for clickable elements (code-style.md)
        btn: '0 1px 2px 0 rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        'btn-hover': '0 2px 4px 0 rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        'btn-primary': '0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2)',
        'btn-primary-hover': '0 2px 6px 0 rgba(0, 0, 0, 0.4)',
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [],
};

export default config;
