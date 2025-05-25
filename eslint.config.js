// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const unusedImportsPlugin = require('eslint-plugin-unused-imports');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    plugins: {
      'unused-imports': unusedImportsPlugin
    },
    rules: {
      // Detect and remove unused imports
      'no-unused-vars': 'off', // Turn off the base rule as it can report incorrect errors
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { 'vars': 'all', 'varsIgnorePattern': '^_', 'args': 'after-used', 'argsIgnorePattern': '^_' }
      ],
      
      
      // No duplicate imports
      'no-duplicate-imports': 'error'
    }
  },
]);
