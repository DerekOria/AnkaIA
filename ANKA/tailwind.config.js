export default {
  content: ["./src/**/*.{jsx,js,tsx,ts}", "./index.html"],
  theme: {
    extend: {
      colors: {
        anka: {
          50: "#e6fbff",
          100: "#ccf8ff",
          300: "#33d6ff",
          500: "#00c2ff",
          700: "#00a3d6",
          neon: "#00f2ff",
          violet: "#8b5cf6",
          navy: "#050510",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};
