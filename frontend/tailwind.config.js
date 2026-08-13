/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17213A",
        paper: "#F7F9F4",
        surface: "#FFFFFF",
        mist: "#EEF4EF",
        muted: "#667085",
        gold: "#D99A00",
        ember: "#B42318",
        highland: {
          DEFAULT: "#0F7A52",
          dark: "#0A5C3E",
          light: "#DFF3E9",
        },
        sky: "#2563EB",
        line: "#DADFD3",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
