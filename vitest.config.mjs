export default {
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/modern/setup.mjs'],
    include: ['tests/modern/**/*.test.{mjs,js,jsx}'],
    globals: false,
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage/modern',
      reporter: ['text', 'json-summary'],
      include: [
        'assets/js/runtime/services/route-policy.ts',
        'src/features/boards/virtualization/board-table-virtualization.ts',
        'assets/js/platform/state/client-state-store.ts',
        'src/design-system/interactions/button.tsx',
      ],
      thresholds: {
        statements: 75,
        branches: 65,
        functions: 75,
        lines: 75,
      },
    },
  },
};
