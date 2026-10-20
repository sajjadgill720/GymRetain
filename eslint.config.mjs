import { createRequire } from 'node:module';
const require = createRequire(new URL('./backend/package.json', import.meta.url));
const parser = require('@typescript-eslint/parser');

// Syntax/correctness checks for the existing TypeScript code, without formatting rewrites.
export default [{
  files: ['**/*.ts', '**/*.tsx'],
  ignores: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
  languageOptions: { parser, parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } } },
  rules: { 'no-debugger': 'error', 'no-dupe-keys': 'error', 'no-constant-condition': ['error', { checkLoops: false }], 'no-unreachable': 'error', 'no-unsafe-finally': 'error', 'constructor-super': 'error' },
}];
