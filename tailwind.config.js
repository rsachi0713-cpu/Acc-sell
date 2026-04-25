/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0f111a",
        card: "#171a26",
        primary: "#3b82f6",
        "primary-hover": "#2563eb",
      }
    },
  },
  plugins: [],
}
