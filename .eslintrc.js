module.exports = {
  parser: "@typescript-eslint/parser", // Specifies the ESLint parser
  parserOptions: {
    project: "tsconfig.json",
    ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
    sourceType: "module", // Allows for the use of imports
  },
  settings: {
    "import/resolver": {
      typescript: {},
    },
  },
  plugins: ["import", "simple-import-sort"],
  rules: {
    // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
    // e.g. "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-use-before-define": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/explicit-member-accessibility": "error",
    "@typescript-eslint/consistent-type-imports": "warn",
    "import/no-default-export": "error",
    "import/no-named-as-default-member": "off",
    "simple-import-sort/imports": "warn",
    "simple-import-sort/exports": "warn",
    // "strict-booleans/no-nullable-numbers": "error",
    "no-undef": "off",
    "new-cap": "error",
    curly: "error",
  },
  ignorePatterns: ["/*.js"],
};
