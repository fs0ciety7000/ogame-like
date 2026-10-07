import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

/** Un effet s'écrit `useEffect(() => { … }, deps)` : jamais un corps en expression (qui renvoie sa valeur sans le dire). */
const USE_EFFECT_BRACES = [
  {
    selector: "CallExpression[callee.name='useEffect'] > ArrowFunctionExpression[body.type!='BlockStatement']",
    message: "Corps de useEffect entre accolades (CLAUDE.md, règles du front) : useEffect(() => { return … }, deps).",
  },
  {
    selector: "CallExpression[callee.property.name='useEffect'] > ArrowFunctionExpression[body.type!='BlockStatement']",
    message: "Corps de useEffect entre accolades (CLAUDE.md, règles du front) : useEffect(() => { return … }, deps).",
  },
];

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { window: "readonly", document: "readonly" },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      // 6.14.83 (CLAUDE.md, règles du front) : corps de useEffect entre accolades.
      "no-restricted-syntax": ["error", ...USE_EFFECT_BRACES],
    },
  },
);
