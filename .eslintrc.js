module.exports =  {
  parser:  '@typescript-eslint/parser',  // Specifies the ESLint parser
  extends:  [
    'plugin:@typescript-eslint/recommended',  // Uses the recommended rules from the @typescript-eslint/eslint-plugin
  ],
 parserOptions:  {
    ecmaVersion:  2018,  // Allows for the parsing of modern ECMAScript features
    sourceType:  'module',  // Allows for the use of imports
  },
  rules: {
    "arrow-parens": ["off"],
    "class-methods-use-this": "off",
    "consistent-return": "off",
    "comma-dangle": "off",
    "default-case": "off",
    "dot-notation": "off",
    "function-paren-newline": "off",
    "generator-star-spacing": "off",
    "import/no-extraneous-dependencies": "off",
    "import/prefer-default-export": "off",
    "indent": ["error", 2, { "SwitchCase": 0 }],
    "jsx-quotes": "off",
    "lines-between-class-members": "off",
    "no-bitwise": "off",
    "no-case-declarations": "off",
    "no-console": "off",
    "no-mixed-operators": "off",
    "no-param-reassign": ["error", { "props": false }],
    "no-use-before-define": "off",
    "@typescript-eslint/no-use-before-define": "off",
    "no-multi-assign": "off",
    "object-curly-newline": "off",
    "object-shorthand": ["error", "never"],
    "one-var": "off",
    "one-var-declaration-per-line": "off",
    "operator-linebreak": "off",
    "prefer-destructuring": "off",
    "quotes": "off"
  }
};
