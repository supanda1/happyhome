import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // 🚨 SECURITY: Enforce zero client-side storage policy
      'no-restricted-globals': [
        'error',
        {
          name: 'localStorage',
          message: '🚫 SECURITY VIOLATION: localStorage is forbidden. Use backend APIs instead for all data persistence.'
        },
        {
          name: 'sessionStorage',
          message: '🚫 SECURITY VIOLATION: sessionStorage is forbidden. Use backend APIs instead for all data persistence.'
        }
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='localStorage']",
          message: '🚫 SECURITY VIOLATION: localStorage access is forbidden. Use backend APIs with HTTP-only cookies.'
        },
        {
          selector: "MemberExpression[object.name='sessionStorage']",
          message: '🚫 SECURITY VIOLATION: sessionStorage access is forbidden. Use backend APIs with HTTP-only cookies.'
        },
        {
          selector: "MemberExpression[object.name='window'][property.name='localStorage']",
          message: '🚫 SECURITY VIOLATION: window.localStorage is forbidden. Use secure backend APIs instead.'
        },
        {
          selector: "MemberExpression[object.name='window'][property.name='sessionStorage']",
          message: '🚫 SECURITY VIOLATION: window.sessionStorage is forbidden. Use secure backend APIs instead.'
        },
        {
          selector: "CallExpression[callee.object.name='document'][callee.property.name='cookie']",
          message: '⚠️  SECURITY WARNING: Manual cookie manipulation detected. Use HTTP-only cookies set by backend instead.'
        }
      ],
      // Additional security-focused rules
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-script-url': 'error',
      'no-inline-comments': 'off', // Allow security comments
    },
  },
])
