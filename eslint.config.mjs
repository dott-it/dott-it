import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginReact from 'eslint-plugin-react'
import eslintPluginUnicorn from 'eslint-plugin-unicorn'
import tailwind from 'eslint-plugin-tailwindcss'
import { FlatCompat } from '@eslint/eslintrc'
import globals from 'globals'

const compat = new FlatCompat({
  // import.meta.dirname is available after Node.js v20.11.0
  baseDirectory: import.meta.dirname,
})

/** @type {import('eslint').Linter.Config[]} */
const config = [
  { ignores: [
    '.next/**',
    'public/**',
    'next.config.js',
    'postcss.config.js',
    // Google Apps Script globals — not a Node/Next module.
    'lib/library/digitize/apps-script/**',
  ] },
  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  eslintPluginUnicorn.configs['recommended'],
  ...tailwind.configs['flat/recommended'],
  ...compat.config({
    extends: ['next'],
    settings: {
      next: {
        rootDir: '.',
      },
    },
  }),
  ...compat.config({
    extends: ['plugin:drizzle/all'],
  }),
  {
    rules: {
      'no-undef': 'error',
      'unicorn/no-null': 'off',
      'unicorn/no-zero-fractions': 'off',
      'drizzle/enforce-delete-with-where': 'off',
      'unicorn/catch-error-name': 'off',
      'react/react-in-jsx-scope': 'off',
      'tailwindcss/no-custom-classname': 'off',
      'tailwindcss/classnames-order': 'off',
      'tailwindcss/enforces-shorthand': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error', // or "error"
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'unicorn/prevent-abbreviations': 'off',
    },
  },
  {
    files: ['**/*.{jsx,tsx}'],
    rules: {
      'no-console': 'warn',
    },
  },
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/__tests__/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      'no-undef': 'off', // Jest globals are available
    },
  },
]
export default config
