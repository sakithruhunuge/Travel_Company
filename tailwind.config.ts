import type { Config } from "tailwindcss";

const config: Config = {
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
        brand: {
          dark: "#0f172a", // slate-900
          primary: "#0284c7", // sky-600 (ocean blue)
          secondary: "#0d9488", // teal-600
          accent: "#f59e0b", // amber-500 (sandy gold)
          light: "#f8fafc", // slate-50
        }
      },
    },
  },
  plugins: [],
};
export default config;
