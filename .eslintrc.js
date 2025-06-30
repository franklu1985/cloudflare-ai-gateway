module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint'],
  env: {
    browser: false,
    es6: true,
    node: false,
    worker: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    'no-console': 'off',
  },
  globals: {
    Request: 'readonly',
    Response: 'readonly',
    Headers: 'readonly',
    URL: 'readonly',
    URLSearchParams: 'readonly',
    crypto: 'readonly',
  },
}; 