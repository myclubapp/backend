import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import typescript from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import googleConfig from 'eslint-config-google';

// Filter out deprecated rules from Google config
const googleRules = {...googleConfig.rules};
delete googleRules['valid-jsdoc'];
delete googleRules['require-jsdoc'];

// Filter out JSDoc rules from TypeScript ESLint
const tsRules = Object.entries(tseslint.configs.recommended.rules)
    .filter(([key]) => !key.includes('jsdoc'))
    .reduce((rules, [key, value]) => ({...rules, [key]: value}), {});

const baseConfig = {
  ignores: [
    'lib/**/*',
    'node_modules/**',
  ],
  plugins: {
    'import': importPlugin,
  },
  rules: {
    'require-jsdoc': 'off',
    'valid-jsdoc': 'off',
    'quotes': ['error', 'double'],
    'max-len': ['error', {'code': 100}],
    'indent': ['error', 2],
    'comma-dangle': ['error', 'always-multiline'],
    'no-console': 'off',
    ...Object.fromEntries(
        Object.entries(googleRules).filter(([key]) =>
          !key.includes('jsdoc') && !key.includes('require-jsdoc'),
        ),
    ),
  },
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    globals: {
      console: true,
      process: true,
    },
  },
  settings: {
    'import/resolver': {
      node: true,
    },
  },
};

export default [
  eslint.configs.recommended,
  // JavaScript files config
  {
    ...baseConfig,
    files: ['**/*.js'],
  },
  // TypeScript files config
  {
    ...baseConfig,
    files: ['**/*.ts'],
    plugins: {
      ...baseConfig.plugins,
      '@typescript-eslint': tseslint,
    },
    languageOptions: {
      ...baseConfig.languageOptions,
      parser: typescript,
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...baseConfig.rules,
      ...tsRules,
    },
    settings: {
      ...baseConfig.settings,
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
  },
];
