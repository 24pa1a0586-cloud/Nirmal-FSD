/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#16a34a',
          600: '#0d9488', // muted teal / student clean accent
          700: '#0f766e',
          800: '#115e59',
        },
        brand: {
          light: '#f8fafc',
          muted: '#64748b',
          dark: '#0f172a',
          accent: '#2563eb', // clean muted student blue
          accentHover: '#1d4ed8',
        }
      },
    },
  },
  plugins: [],
}
