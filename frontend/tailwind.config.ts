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
        background: '#0a0d14',
        surface: {
          50: '#1e2433',
          100: '#161b26',
          200: '#11151f',
          300: '#0d111a',
        },
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        streak: {
          orange: '#f97316',
          flame: '#ef4444',
          gold: '#eab308',
        },
        risk: {
          low: '#10b981',
          medium: '#f59e0b',
          high: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px -5px rgba(16, 185, 129, 0.3)',
        'glow-orange': '0 0 20px -5px rgba(249, 115, 22, 0.3)',
        'btn': '0 2px 6px 0 rgba(0, 0, 0, 0.35), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
        'btn-hover': '0 4px 14px 0 rgba(0, 0, 0, 0.45), 0 2px 4px 0 rgba(0, 0, 0, 0.25)',
        'btn-primary': '0 4px 14px 0 rgba(16, 185, 129, 0.35), 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
        'btn-rose': '0 4px 14px 0 rgba(244, 63, 94, 0.35), 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
        'btn-surface': '0 2px 8px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(255, 255, 255, 0.05) inset',
        'btn-amber': '0 4px 14px 0 rgba(245, 158, 11, 0.35), 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
        'btn-whatsapp': '0 4px 14px 0 rgba(37, 211, 102, 0.3), 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
};

export default config;
