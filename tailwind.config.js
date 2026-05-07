/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Montserrat", "system-ui", "sans-serif"],
        montserrat: ["Montserrat", "sans-serif"],
      },
      colors: {
        // Primary heading / brand colour requested by spec
        brand: {
          50: "#EAF2F6",
          100: "#CFE0E9",
          200: "#9FC1D2",
          300: "#6FA2BC",
          400: "#3F83A5",
          500: "#14587F", // main
          600: "#114E70",
          700: "#0E3F5B",
          800: "#0A2F45",
          900: "#061F2E",
        },
        accent: {
          green: "#1FA971",
          amber: "#F5A623",
          red: "#E5484D",
          violet: "#7C5CFA",
        },
        ink: {
          900: "#0F1B22",
          700: "#33424B",
          500: "#5C6B74",
          300: "#9AA6AD",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F5F8FA",
          sunken: "#EEF3F6",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,27,34,0.04), 0 4px 16px rgba(15,27,34,0.06)",
        pop: "0 8px 32px rgba(20,88,127,0.18)",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
      },
    },
  },
  plugins: [],
};
