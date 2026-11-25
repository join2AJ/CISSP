// The guide's slate/indigo classes are remapped to StudyCISSP's warm neutrals and green accent.
module.exports = {
  content: ["./grc/src/**/*.jsx"],
  theme: {
    extend: {
      colors: {
        slate: { 50: "#fbf8f1", 100: "#f1ebde", 200: "#e3dccb", 300: "#cfc5ae", 400: "#a69c86", 500: "#7d7462", 600: "#5f5848", 700: "#45402f", 800: "#2c2a22", 900: "#1d1b17" },
        indigo: { 50: "#ecf4ef", 100: "#d5e8dc", 200: "#a9d0b8", 500: "#2f7a59", 600: "#1f5c43", 700: "#184a36" },
      },
    },
  },
};
