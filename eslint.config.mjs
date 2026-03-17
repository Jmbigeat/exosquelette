import { createRequire } from "module";
import prettierConfig from "eslint-config-prettier";

const require = createRequire(import.meta.url);
const coreWebVitals = require("eslint-config-next/core-web-vitals");

export default [
  ...coreWebVitals,
  prettierConfig,
  {
    rules: {
      "no-console": "warn",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "react/no-unescaped-entities": "off",
    },
  },
];
