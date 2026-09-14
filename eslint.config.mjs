/**
 * Stage A / M1 JavaScript governance lint baseline.
 *
 * The application runtime is TypeScript-authoritative and remains guarded by the
 * strict compiler plus Work Management verifiers. Until the TypeScript ESLint
 * parser is added to the locked toolchain, ESLint owns JavaScript/MJS tooling,
 * Vite configuration, browser harnesses, and verifier scripts only.
 */
export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.vite/**',
      'apps/**',
      '**/RELEASE-STATUS-*.md',
    ],
  },
  {
    files: [
      '*.js',
      '*.mjs',
      'scripts/**/*.mjs',
      'tests/**/*.mjs',
      'config/**/*.js',
      'verify-*.mjs',
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    rules: {
      'constructor-super': 'error',
      'getter-return': ['error', { allowImplicit: true }],
      'no-async-promise-executor': 'error',
      'no-class-assign': 'error',
      'no-const-assign': 'error',
      'no-constant-binary-expression': 'error',
      'no-debugger': 'error',
      'no-dupe-args': 'error',
      'no-dupe-class-members': 'error',
      'no-dupe-else-if': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-ex-assign': 'error',
      'no-import-assign': 'error',
      'no-new-native-nonconstructor': 'error',
      'no-obj-calls': 'error',
      'no-promise-executor-return': 'error',
      'no-self-assign': 'error',
      'no-setter-return': 'error',
      'no-this-before-super': 'error',
      'no-unreachable': 'error',
      'no-unsafe-finally': 'error',
      'no-unsafe-negation': 'error',
      'no-unsafe-optional-chaining': 'error',
      'use-isnan': 'error',
      'valid-typeof': 'error'
    },
  },
];
