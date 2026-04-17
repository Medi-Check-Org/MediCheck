/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563eb", 
          foreground: "#ffffff",
        },
        white: "#ffffff",
        gray: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
        },
        black: "#000000",
        blue: {
          600: "#2563eb",
          700: "#1d4ed8",
        },
        green: {
          50: "#f0fdf4",
          200: "#bbf7d0",
        },
      },
      // 2. Add your custom ripple animation here
      keyframes: {
        ripple: {
          "0%": { transform: "scale(1)", opacity: "0.4" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
      },
      animation: {
        ripple: "ripple 3s ease-out infinite",
      },
    },
  },
  plugins: [],
};
