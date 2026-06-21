/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#05070c',
        panel: '#0b1019',
        lime: '#22d3ee',
        violet: '#8b5cf6',
      },
      fontFamily: {
        display: ['Rajdhani', 'Arial Narrow', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 45px rgba(34, 211, 238, 0.18)',
        violet: '0 0 45px rgba(139, 92, 246, 0.18)',
      },
      backgroundImage: {
        grid: 'linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
}
