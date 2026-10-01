/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,scss}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        // Palet desain wizard survey — CSS variables didefinisikan di src/index.css
        // (nilai 1:1 dari :root apps/api/data/reff.html).
        survey: {
          navy: 'var(--survey-navy)',
          navy2: 'var(--survey-navy2)',
          blue: 'var(--survey-blue)',
          lblue: 'var(--survey-lblue)',
          llblue: 'var(--survey-llblue)',
          g1: 'var(--survey-g1)',
          g2: 'var(--survey-g2)',
          g3: 'var(--survey-g3)',
          dark: 'var(--survey-dark)',
          red: 'var(--survey-red)',
          lred: 'var(--survey-lred)',
          green: 'var(--survey-green)',
          lgreen: 'var(--survey-lgreen)',
          orange: 'var(--survey-orange)',
          lorng: 'var(--survey-lorng)',
          purple: 'var(--survey-purple)',
          lpurp: 'var(--survey-lpurp)',
        },
      },
    },
  },
  plugins: [],
};
