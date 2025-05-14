import pluginJs from "@eslint/js";
import prettier from "eslint-config-prettier";
import pluginN from "eslint-plugin-n";
import globals from "globals";

export default [
  pluginJs.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      n: pluginN,
    },
    rules: {
      "no-unused-vars": "off",
      "n/no-missing-require": "error",
      "no-constant-condition": "warn",
      "no-empty-function": "warn",
      "no-extra-boolean-cast": "warn",
      "no-useless-return": "warn",
      eqeqeq: ["error", "always"],
      ...prettier.rules,
    },
  },
];
