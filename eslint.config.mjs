import { dirname, resolve } from "path";

import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: resolve(__dirname),
});

export default [
    ...compat.config({
        parser: "@typescript-eslint/parser",
        parserOptions: {
            project: "tsconfig.json",
            tsconfigRootDir: __dirname,
            sourceType: "module",
        },
        plugins: ["@typescript-eslint"],
        extends: ["plugin:@typescript-eslint/recommended"],
        env: {
            node: true,
            jest: true,
        },
        ignorePatterns: [".eslintrc.js"],
        rules: {
            // NestJS-specific improvements
            "@typescript-eslint/interface-name-prefix": "off",
            "@typescript-eslint/no-explicit-any": "warn", // Avoid using 'any', prefer stricter typing

            // Code consistency and best practices
            "no-console": "warn", // Warn against using console.log
            "no-unused-vars": "off", // Disable the base rule
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    ignoreRestSiblings: true,
                },
            ], // Adjusted for TypeScript

            "prefer-const": "error", // Prefer const over let where possible
            "no-var": "error", // Disallow var, prefer let/const
        },
    }),
];
