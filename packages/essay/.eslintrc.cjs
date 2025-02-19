module.exports = {
  root: true,
  env: { browser: true, ES2022: true },
  extends: ["plugin:react-hooks/recommended"],
  ignorePatterns: ["dist", ".eslintrc.cjs"],
  parser: "@typescript-eslint/parser",
};
