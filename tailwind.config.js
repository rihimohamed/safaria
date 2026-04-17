/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      "colors": {
              "outline": "#6e7977",
              "surface-container-lowest": "#ffffff",
              "secondary": "#426464",
              "primary": "#004e46",
              "background": "#fef9ee",
              "surface-container-low": "#f8f3e9",
              "on-secondary-fixed-variant": "#2a4c4c",
              "tertiary": "#5a4100",
              "on-error": "#ffffff",
              "on-background": "#1d1c16",
              "secondary-fixed": "#c5eae9",
              "inverse-on-surface": "#f5f0e6",
              "on-primary-fixed-variant": "#005048",
              "on-tertiary-fixed": "#261900",
              "primary-fixed-dim": "#85d5c8",
              "tertiary-fixed": "#ffdea2",
              "surface-container-high": "#ede8de",
              "surface-container-highest": "#e7e2d8",
              "on-primary": "#ffffff",
              "on-secondary-container": "#486a6a",
              "surface-variant": "#e7e2d8",
              "primary-fixed": "#a1f1e4",
              "on-primary-container": "#93e4d7",
              "on-tertiary-fixed-variant": "#5c4200",
              "on-secondary": "#ffffff",
              "on-tertiary-container": "#fece6d",
              "error": "#ba1a1a",
              "on-primary-fixed": "#00201c",
              "surface": "#fef9ee",
              "primary-container": "#00685e",
              "surface-bright": "#fef9ee",
              "on-secondary-fixed": "#002020",
              "surface-container": "#f3ede3",
              "on-error-container": "#93000a",
              "secondary-container": "#c5eae9",
              "on-tertiary": "#ffffff",
              "inverse-primary": "#85d5c8",
              "on-surface": "#1d1c16",
              "secondary-fixed-dim": "#a9cdcd",
              "outline-variant": "#bec9c6",
              "on-surface-variant": "#3e4947",
              "tertiary-fixed-dim": "#eec060",
              "inverse-surface": "#32302a",
              "tertiary-container": "#775700",
              "error-container": "#ffdad6",
              "surface-tint": "#066a60",
              "surface-dim": "#dedad0"
      },
      "borderRadius": {
              "DEFAULT": "1rem",
              "lg": "2rem",
              "xl": "3rem",
              "full": "9999px"
      },
      "fontFamily": {
              "headline": ["Noto Serif"],
              "body": ["Manrope"],
              "label": ["Manrope"]
      },
      "keyframes": {
        "fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 }
        },
        "fade-in-up": {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" }
        }
      },
      "animation": {
        "fade-in": "fade-in 0.4s ease-out",
        "fade-in-up": "fade-in-up 0.5s ease-out",
        "spin-slow": "spin 3s linear infinite"
      }
    },
  },
  plugins: [],
}
