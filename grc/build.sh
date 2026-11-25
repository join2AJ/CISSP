#!/bin/sh
# Rebuild the GRC field guide. Needs react, react-dom, esbuild and tailwindcss (v3) installed in $NODE_DIR.
set -e
cd "$(dirname "$0")/.."
NODE_DIR="${NODE_DIR:-./node_modules}"
NODE_PATH="$NODE_DIR" "$NODE_DIR/.bin/esbuild" grc/src/main.jsx --bundle --minify --format=iife --jsx=automatic \
  --define:process.env.NODE_ENV='"production"' --resolve-extensions=.jsx,.js --outfile=assets/grc/grc.js --legal-comments=none
"$NODE_DIR/.bin/tailwindcss" -c grc/tailwind.config.js -i grc/src/styles.css -o assets/grc/grc.css --minify
