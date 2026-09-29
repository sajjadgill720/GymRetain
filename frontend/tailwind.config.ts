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
        // mynext9to5-inspired Deep Charcoal Canvas & Warm Luxury Stone Surfaces
        background: '#111111',
        canvas: '#111111',
        surface: {
          50: '#26221E',
          100: '#1C1814',
          200: '#161310',
          300: '#111111',
          border: '#2A2520',
        },
        // Cozy High-Contrast Neutrals for Text
        content: {
          primary: '#F7F5F2',
          secondary: '#A39E98',
          tertiary: '#6B6661',
        },
        // mynext9to5 Signature Warm Champagne Bronze Accent (#BFA785)
        brand: {
          50: '#FAF6F0',
          100: '#F2EBE0',
          400: '#D4C2A7',
          500: '#BFA785', // mynext9to5 signature luxury gold
          600: '#A68F6E',
          700: '#8B7454',
        },
        // Streaks & Consistency Wins
        success: {
          light: '#EAF5EF',
          DEFAULT: '#4E9F6E',
          dark: '#3A7C54',
        },
        // Warning: At-Risk Inactivity
        warning: {
          light: '#FDF6EA',
          DEFAULT: '#E5A13B',
          dark: '#B87B22',
        },
        // Danger: Critical Dropout / Overdue Payment
        danger: {
          light: '#FCEBEA',
          DEFAULT: '#D9534F',
          dark: '#AD3835',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        serif: ['DM Serif Display', 'Playfair Display', 'Source Serif 4', 'serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        // All clickable buttons have shadow and tactile depth (code-style.md)
        btn: '0 2px 5px 0 rgba(0, 0, 0, 0.35), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
        'btn-hover': '0 4px 14px 0 rgba(0, 0, 0, 0.45), 0 2px 4px 0 rgba(0, 0, 0, 0.25)',
        // mynext9to5 Signature Champagne Glow Button Shadow
        'btn-primary': '0 4px 16px 0 rgba(191, 167, 133, 0.28), 0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        'btn-primary-hover': '0 6px 20px 0 rgba(191, 167, 133, 0.38), 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
        'btn-success': '0 4px 14px 0 rgba(78, 159, 110, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        'btn-warning': '0 4px 14px 0 rgba(229, 161, 59, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        'btn-danger': '0 4px 14px 0 rgba(217, 83, 79, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        // Soft Glassmorphic Card Ambient Shadows
        glass: '0 20px 40px -15px rgba(0, 0, 0, 0.5), 0 0 15px 0 rgba(191, 167, 133, 0.05)',
      },
    },
  },
  plugins: [],
};

export default config;
