/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./utils/**/*.{js,ts,jsx,tsx}"],
  plugins: [require("daisyui")],
  darkTheme: "dark",
  darkMode: ["selector", "[data-theme='dark']"],
  // DaisyUI theme colors
  daisyui: {
    themes: [
      {
        light: {
          primary: "#ffffff",
          "primary-content": "#0c0c0c",
          secondary: "#dfdfdf",
          "secondary-content": "#0a0a0a",
          accent: "#0c0c0c",
          "accent-content": "#E9FBFF",
          neutral: "#0a0a0a",
          "neutral-content": "#dfdfdf",
          "base-100": "#efefef",
          "base-200": "#ffffff",
          "base-300": "#dfdfdf",
          "base-content": "#0a0a0a",
          info: "#0c0c0c",
          success: "#34EEB6",
          warning: "#FFCF72",
          error: "#FF8863",

          "--rounded-btn": "9999rem",

          ".tooltip": {
            "--tooltip-tail": "6px",
          },
          ".link": {
            textUnderlineOffset: "2px",
          },
          ".link:hover": {
            opacity: "80%",
          },
        },
      },
      {
        dark: {
          primary: "#026262",
          "primary-content": "#C8F5FF",
          secondary: "#107575",
          "secondary-content": "#E9FBFF",
          accent: "#C8F5FF",
          "accent-content": "#088484",
          neutral: "#E9FBFF",
          "neutral-content": "#11ACAC",
          "base-100": "#11ACAC",
          "base-200": "#088484",
          "base-300": "#026262",
          "base-content": "#E9FBFF",
          info: "#C8F5FF",
          success: "#34EEB6",
          warning: "#FFCF72",
          error: "#FF8863",

          "--rounded-btn": "9999rem",

          ".tooltip": {
            "--tooltip-tail": "6px",
            "--tooltip-color": "oklch(var(--p))",
          },
          ".link": {
            textUnderlineOffset: "2px",
          },
          ".link:hover": {
            opacity: "80%",
          },
        },
      },
    ],
  },
  theme: {
    extend: {
      fontFamily: {
        "space-grotesk": ["Space Grotesk", "sans-serif"],
      },
      boxShadow: {
        center: "0 0 12px -2px rgb(0 0 0 / 0.05)",
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
};
