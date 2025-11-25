import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "2rem",
        lg: "4rem",
        xl: "5rem",
        "2xl": "6rem",
      },
    },
    extend: {
      colors: {
        // New color palette
        primary: {
          DEFAULT: "#0A2E8A", // Imperial blue - Primary buttons, main headings, brand elements
          dark: "#011D5F", // Deep navy - Hover states, darker variants
          light: "#505984", // Dusty grape - Lighter variants, secondary text
        },
        secondary: {
          DEFAULT: "#DDB0B1", // Cotton rose - Accent elements, highlights, badges
          dark: "#505984", // Dusty grape - Darker accent variants
          light: "#F5E6E7", // Lighter tint of cotton-rose for backgrounds
        },
        accent: {
          DEFAULT: "#D00123", // Flag red - Important buttons, warnings, emphasis
          dark: "#A0011A", // Darker red variant for hover states
          light: "#FFE6E8", // Lighter red tint for backgrounds
        },
        neutral: {
          DEFAULT: "#f9fafb", // Light grey - Backgrounds
          dark: "#505984", // Dusty grape - Text on light backgrounds
          light: "#ffffff", // White - Card backgrounds
        },
      },
    },
  },
  plugins: [],
};
export default config;

