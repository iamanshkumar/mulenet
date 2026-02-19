/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f7ff",
          100: "#e0effe",
          500: "#0066cc",
          600: "#0052a3",
          700: "#003d7a",
        },
        accent: {
          50: "#ecfdf5",
          500: "#06b6d4",
          600: "#0891b2",
        },
        danger: "#ef4444",
        success: "#10b981",
        warning: "#f59e0b",
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        md: "0 4px 12px 0 rgba(0, 0, 0, 0.08)",
        lg: "0 10px 25px 0 rgba(0, 0, 0, 0.1)",
      },
      borderRadius: {
        xs: "6px",
        sm: "8px",
        md: "12px",
        lg: "16px",
      },
      animation: {
        fadeIn: "fadeIn 0.3s ease-in",
        slideIn: "slideIn 0.3s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
}