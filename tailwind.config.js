/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'media', // Automatically follow system preference (light/dark mode)
  theme: {
    extend: {
      // Add any custom theme extensions here if needed in the future
    },
  },
  plugins: [
    // Add any Tailwind plugins here if needed
  ],
}