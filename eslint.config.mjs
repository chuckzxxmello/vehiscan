import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // For all JS/TS files in the project (default: browser)
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  // For files in the functions directory: Node.js environment
  {
    files: ["functions/**/*.{js,ts}"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
]);
