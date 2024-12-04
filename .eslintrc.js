module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@react-native", "@typescript-eslint", "react-hooks"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "error",
    eqeqeq: "error",
    "no-shadow": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        caughtErrors: "none",
        argsIgnorePattern: "^_",
      },
    ],
    "arrow-body-style": ["error", "as-needed"]
  },
};
