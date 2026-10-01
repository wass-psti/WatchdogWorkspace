export const stageIM79TokenArchitecture = Object.freeze({
  semanticsVersion: '1.43.2-m79-v1',
  tiers: Object.freeze(['primitive', 'semantic', 'component', 'compatibility'] as const),
  primitiveNamespaces: Object.freeze([
    '--wm-palette-', '--wm-font-', '--wm-text-', '--wm-line-height-', '--wm-letter-spacing-',
    '--wm-space-', '--wm-control-', '--wm-icon-', '--wm-radius-', '--wm-border-', '--wm-focus-',
    '--wm-shadow-', '--wm-blur-', '--wm-density-', '--wm-motion-', '--wm-breakpoint-', '--wm-z-',
  ]),
  semanticNamespaces: Object.freeze(['--wm-color-', '--wm-semantic-']),
  componentNamespaces: Object.freeze(['--wm-shell-', '--wm-board-']),
  compatibilityNamespaces: Object.freeze([
    '--wm-sidebar-', '--wm-topbar-', '--wm-content-', '--wm-reading-', '--wm-panel-', '--wm-table-row-',
  ]),
  themeModes: Object.freeze(['system', 'light', 'dark'] as const),
  contrast: Object.freeze({ normalTextMinimum: 4.5, largeTextMinimum: 3, focusMinimum: 3 }),
  densityModes: Object.freeze(['compact', 'default', 'comfortable'] as const),
  breakpoints: Object.freeze({ narrow: '40rem', tablet: '52.5rem', laptop: '70rem', wide: '90rem' }),
  invariants: Object.freeze({
    primitivePaletteOwnsRawGlobalColorValues: true,
    semanticColorRolesDoNotOwnRawGlobalColorValues: true,
    semanticAliasLayerContainsNoNewConcreteColorValues: true,
    moduleSpecificComponentTokensRemainCompatibilityBoundaries: true,
    mediaQueriesDoNotAttemptToUseCustomPropertyBreakpoints: true,
    reducedMotionPolicyRemainsInForce: true,
  }),
} as const);

export type StageIM79TokenTier = typeof stageIM79TokenArchitecture.tiers[number];
