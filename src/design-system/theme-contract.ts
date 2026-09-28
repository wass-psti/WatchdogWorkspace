export const workManagementThemeContract = Object.freeze({
  modes: Object.freeze(['system', 'light', 'dark'] as const),
  cssAttribute: 'data-theme',
  semanticRoles: Object.freeze({
    canvas: '--wm-color-canvas',
    surfacePrimary: '--wm-color-surface-primary',
    surfaceSecondary: '--wm-color-surface-secondary',
    surfaceElevated: '--wm-color-surface-elevated',
    textPrimary: '--wm-color-text-primary',
    textSecondary: '--wm-color-text-secondary',
    textTertiary: '--wm-color-text-tertiary',
    accent: '--wm-color-accent',
    accentContrast: '--wm-color-accent-contrast',
    positive: '--wm-color-positive',
    negative: '--wm-color-negative',
    warning: '--wm-color-warning',
    info: '--wm-color-info',
    focus: '--wm-color-focus',
  }),
  contrast: Object.freeze({
    normalTextMinimum: 4.5,
    largeTextMinimum: 3,
    nonTextFocusMinimum: 3,
  }),
});

export type WorkManagementThemeMode = typeof workManagementThemeContract.modes[number];
