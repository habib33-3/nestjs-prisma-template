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
        extends: [
            "plugin:@typescript-eslint/recommended",
            "plugin:@typescript-eslint/recommended-requiring-type-checking",
            "plugin:prettier/recommended", // Ensure compatibility with Prettier
        ],
        env: {
            node: true,
            jest: true,
        },
        ignorePatterns: [".eslintrc.js", "dist/**", "node_modules/**"],
        rules: {
            // NestJS-specific improvements
            "@typescript-eslint/interface-name-prefix": "off", // Deprecated, unnecessary
            "@typescript-eslint/no-explicit-any": ["warn"], // Avoid 'any' for stricter typing
            "@typescript-eslint/no-misused-promises": [
                "error",
                { checksVoidReturn: false },
            ], // Adjust for async functions

            // Code consistency and best practices
            "no-console": ["warn", { allow: ["warn", "error"] }], // Allow warn/error logs
            "prefer-const": "error", // Enforce const where applicable
            "no-var": "error", // Disallow var usage

            // TypeScript-specific adjustments
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    ignoreRestSiblings: true,
                },
            ],
            "prettier/prettier": "off",

            // Enforce NestJS-specific patterns
            "@typescript-eslint/no-empty-function": [
                "warn",
                { allow: ["methods", "constructors"] },
            ], // Allow empty constructors or lifecycle methods
            "class-methods-use-this": "off", // Lifecycle methods in NestJS may not use 'this'

            // Turn off unsafe assignment, call, spread, and member access rules
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-spread": "off", // Disable the unsafe spread warning
            "@typescript-eslint/no-unsafe-member-access": "off", // Disable the unsafe member access warning
        },
    }),
];
