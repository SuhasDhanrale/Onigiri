import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  // Build output, deps, and legacy/scratch files we don't lint.
  {
    ignores: [
      'dist',
      'dist-*',
      'node_modules',
      '.kilo',
      'Autob.jsx',
      'tmp_*.cjs',
    ],
  },

  // Browser app source (React + Canvas), incl. root-level ads/ and analytics/.
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      // Demote: the codebase deliberately uses "declare with a default, then
      // override in each branch", which this newer rule flags. Keep it visible
      // as a warning rather than failing the lint.
      'no-useless-assignment': 'warn',
      // Hooks: the two classic, high-signal rules (the v7 plugin ships many
      // more — opt into reactHooks.configs.recommended later if desired).
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Keep Fast Refresh boundaries clean during dev.
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // ALL_CAPS / PascalCase (configs, components) and _prefixed args are
      // intentionally allowed to be unused.
      'no-unused-vars': [
        'warn',
        { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' },
      ],
    },
  },

  // Ad/analytics adapters talk to SDK globals injected by external scripts.
  {
    files: ['ads/**/*.js', 'analytics/**/*.js', 'src/@ads/**/*.js', 'src/@analytics/**/*.js'],
    languageOptions: {
      globals: {
        PokiSDK: 'readonly',
        CrazyGames: 'readonly',
        gdsdk: 'readonly',
        GD_OPTIONS: 'readonly',
        firebase: 'readonly',
      },
    },
  },

  // Node-land config files (vite/tailwind/postcss) — give them Node globals.
  {
    files: ['*.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
]
