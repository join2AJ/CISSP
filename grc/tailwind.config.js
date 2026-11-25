// The guide's colours are CSS variables so it follows StudyCISSP's light, sepia and dark themes (values in grc/src/styles.css).
module.exports = {
  important: "#grc-guide",          // utilities only apply inside the guide, so it can sit in a StudyCISSP page
  corePlugins: { preflight: false },  // no global reset; a small scoped reset is in styles.css
  content: ["./grc/src/**/*.jsx"],
  theme: { extend: { colors: {
  "white": "var(--g-w)",
  "slate": {
    "50": "var(--g-s50)",
    "100": "var(--g-s100)",
    "200": "var(--g-s200)",
    "300": "var(--g-s300)",
    "400": "var(--g-s400)",
    "500": "var(--g-s500)",
    "600": "var(--g-s600)",
    "700": "var(--g-s700)",
    "800": "var(--g-s800)",
    "900": "var(--g-s900)"
  },
  "indigo": {
    "50": "var(--g-i50)",
    "100": "var(--g-i100)",
    "200": "var(--g-i200)",
    "500": "var(--g-i500)",
    "600": "var(--g-i600)",
    "700": "var(--g-i700)",
    "800": "var(--g-i800)",
    "900": "var(--g-i900)"
  },
  "emerald": {
    "50": "var(--g-e50)",
    "100": "var(--g-e100)",
    "500": "var(--g-e500)",
    "600": "var(--g-e600)",
    "700": "var(--g-e700)",
    "800": "var(--g-e800)",
    "900": "var(--g-e900)"
  },
  "amber": {
    "50": "var(--g-a50)",
    "100": "var(--g-a100)",
    "200": "var(--g-a200)",
    "600": "var(--g-a600)",
    "800": "var(--g-a800)",
    "900": "var(--g-a900)"
  },
  "rose": {
    "100": "var(--g-r100)",
    "200": "var(--g-r200)",
    "600": "var(--g-r600)",
    "700": "var(--g-r700)",
    "800": "var(--g-r800)"
  },
  "yellow": {
    "100": "var(--g-y100)",
    "800": "var(--g-y800)"
  },
  "sky": {
    "600": "var(--g-k600)"
  }
} } },
};
