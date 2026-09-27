/* eslint-disable @typescript-eslint/no-require-imports */
import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // VectorAfriq brand palette — extracted from the VectorAfriq logo.
        // Primary blue (#468AD1) is the dominant hue of the V/A mark, with
        // teal, indigo and purple as gradient accents and a warm grey for text.
        brand: {
          50: "#eff6fc",
          100: "#dcebf7",
          200: "#bcd7ef",
          300: "#92bce3",
          400: "#669fd6",
          500: "#468AD1",
          600: "#2f6fae",
          700: "#27598c",
          800: "#21486f",
          900: "#1c3a59",
        },
        brandTeal: "#2FB3C7",
        brandIndigo: "#7569C0",
        brandPurple: "#A142B4",
        brandGrey: "#5F5C5E",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar')({ nocompatible: true }),
    require('tailwind-scrollbar-hide')
  ],
} satisfies Config;
