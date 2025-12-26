/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hzdBlue: '#1E3A8A',
        hzdGreen: '#166534',
        hzdGold: '#D4AF37',
        hzdBeige: '#FDFBF7',
      }
    },
  },
  plugins: [],
}