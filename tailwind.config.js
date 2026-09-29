/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0b0e14',
        panel: '#141821',
        panel2: '#1c212e',
        border: '#262c3b',
        neon: {
          green: '#00ffa3',
          red: '#ff4d6d',
          purple: '#a855f7',
          blue: '#38bdf8',
        },
      },
      boxShadow: {
        neon: '0 0 20px rgba(0,255,163,0.25)',
      },
    },
  },
  plugins: [],
};