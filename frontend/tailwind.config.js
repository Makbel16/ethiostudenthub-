/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
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
        dark: {
          bg: "#0D1117",
          surface: "#161B22",
          border: "#30363D",
          text: "#E6EDF3",
          muted: "#8B949E",
        },
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
      },
    },
  },
  plugins: [],
};
