import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  { rules: { "no-nested-ternary": "error" } },
  {
    // The home link reloads the page and resets the in-memory chat.
    files: ["app/page.tsx"],
    rules: { "@next/next/no-html-link-for-pages": "off" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "next-env.d.ts",
    "motion-artifact/**",
    ".playwright-mcp/**",
  ]),
]);
