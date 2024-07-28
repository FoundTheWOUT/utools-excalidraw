/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#6965db",
        secondary: "#5b57d1",
      },
      keyframes: {
        rotate: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        rainbow: {
          "0%, 100%": { borderColor: "#FF0000" }, // Red
          "16%": { borderColor: "#FF7F00" }, // Orange
          "33%": { borderColor: "#FFFF00" }, // Yellow
          "50%": { borderColor: "#00FF00" }, // Green
          "66%": { borderColor: "#0000FF" }, // Blue
          "83%": { borderColor: "#4B0082" }, // Indigo
        },
      },
      animation: {
        "spin-slow": "rotate 3s linear infinite",
        rainbow: "rainbow 6s linear infinite",
      },
    },
  },
  plugins: [],
};
