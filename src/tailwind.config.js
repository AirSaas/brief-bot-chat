/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html","./src/**/*.{ts,tsx}"],
    theme: {
      extend: {
        colors: {
          brand: {
            DEFAULT: "#3C51E2",   // RGB: 60/81/226 - Primary blue
            50: "#F0F2FF",        // Very light blue tint
            100: "#E1E5FF",       // Light blue tint
            200: "#C3CCFF",       // Lighter blue
            300: "#A5B3FF",       // Light blue
            400: "#879AFF",       // Medium-light blue
            500: "#3C51E2",       // Primary blue (DEFAULT)
            600: "#3041B5",       // Darker blue
            700: "#243188",       // Dark blue
            800: "#18215B",       // Darker blue
            900: "#0C112E",       // Very dark blue
            dark: "#1E2A8A",
            contrast: "#FFFFFF",
          },
          gray: {
            50: "#F9FAFB",
            100: "#F3F4F6",
            200: "#E5E7EB",
            300: "#D1D5DB",
            400: "#9CA3AF",
            500: "#6B7280",
            600: "#4B5563",
            700: "#374151",
            800: "#1F2937",
            900: "#111827",
          },
          red: {
            50: "#FEF2F2",
            100: "#FEE2E2",
            200: "#FECACA",
            300: "#FCA5A5",
            400: "#F87171",
            500: "#EF4444",
            600: "#DC2626",
            700: "#B91C1C",
            800: "#991B1B",
            900: "#7F1D1D",
          },
        },
        fontFamily: {
          // Google Sans with bold weights available
          display: ['"Google Sans"', "Inter", "system-ui", "sans-serif"],
          body: ['"Google Sans"', "Inter", "system-ui", "sans-serif"],
          sans: ['"Google Sans"', "Inter", "system-ui", "sans-serif"],
        },
        fontWeight: {
          normal: '400',
          medium: '500',
          bold: '700',
        },
        boxShadow: {
          card: "0 6px 24px rgba(0,0,0,0.08)",
        },
        borderRadius: {
          xl2: "1rem",
        },
      },
    },
    plugins: [],
  }
  