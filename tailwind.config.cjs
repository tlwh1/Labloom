module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        accent: "var(--color-accent)",
        accentMuted: "var(--color-accent-muted)"
      },
      fontFamily: {
        sans: [
          "Pretendard Variable",
          "Apple SD Gothic Neo",
          "Noto Sans KR",
          "Segoe UI",
          "sans-serif"
        ]
      },
      boxShadow: {
        soft: "0 20px 60px rgba(15, 23, 42, 0.12)"
      }
    }
  },
  plugins: [require("@tailwindcss/typography"), require("@tailwindcss/line-clamp")]
};
