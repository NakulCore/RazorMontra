/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        razorpay: {
          blue: "#0c2340",
          accent: "#0c83ff",
          dark: "#0b1424",
          light: "#f4f8fc",
          card: "#111c30",
          border: "#1e2d4a"
        }
      }
    },
  },
  plugins: [],
}
