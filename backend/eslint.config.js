// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default tseslint.config(
  {
    ignores: [
      'eslint.config.js',
      'prettier.config.cjs',
      'dist',
      'node_modules',
      'create-test-user.js',
      'inspect-history.js',
      'inspect-indent.js',
      'check-admin.js',
      'check-db.js',
      'api-test.js',
      'get-observability-metrics.js',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'eqeqeq': ['error', 'always'],
      'consistent-return': 'error',
      'prefer-const': 'error',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
);
