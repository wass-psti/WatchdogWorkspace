export const DESIGN_TOKEN_ARCHITECTURE = Object.freeze({
  milestone: 58,
  semanticsVersion: '1.43.2-m58-v1',
  model: Object.freeze(['primitive', 'semantic', 'component', 'compatibility'] as const),
  authorities: Object.freeze({
    primitiveAndLegacyGeometry: 'assets/css/foundation/tokens.css',
    semanticThemeColor: 'assets/css/foundation/themes.css',
    canonicalSemanticAliases: 'assets/css/foundation/token-architecture.css',
    productTokenReferences: 'src/design-system/tokens.ts',
  }),
  primitiveNamespaces: Object.freeze([
    '--wm-font-', '--wm-text-', '--wm-line-height-', '--wm-letter-spacing-',
    '--wm-space-', '--wm-control-', '--wm-hit-target', '--wm-radius-',
    '--wm-border-width', '--wm-focus-width', '--wm-shadow-', '--wm-motion-',
    '--wm-breakpoint-', '--wm-z-',
  ]),
  semanticNamespaces: Object.freeze([
    '--wm-color-', '--wm-semantic-',
  ]),
  componentNamespaces: Object.freeze([
    '--wm-shell-', '--wm-board-',
  ]),
  compatibilityNamespaces: Object.freeze([
    '--wm-sidebar-', '--wm-topbar-', '--wm-content-', '--wm-reading-',
    '--wm-panel-', '--wm-table-row-',
  ]),
  semanticAliasGroups: Object.freeze({
    typography: Object.freeze([
      '--wm-semantic-font-family-body', '--wm-semantic-font-family-code',
      '--wm-semantic-text-caption', '--wm-semantic-text-body',
      '--wm-semantic-text-control', '--wm-semantic-text-heading',
      '--wm-semantic-weight-regular', '--wm-semantic-weight-medium',
      '--wm-semantic-weight-strong', '--wm-semantic-line-body',
      '--wm-semantic-line-heading',
    ]),
    spacing: Object.freeze([
      '--wm-semantic-space-cluster', '--wm-semantic-space-control',
      '--wm-semantic-space-section', '--wm-semantic-space-separation',
      '--wm-semantic-space-containment',
    ]),
    controlGeometry: Object.freeze([
      '--wm-semantic-control-compact', '--wm-semantic-control-default',
      '--wm-semantic-control-comfortable', '--wm-semantic-hit-target',
    ]),
    surface: Object.freeze([
      '--wm-semantic-radius-control', '--wm-semantic-radius-surface',
      '--wm-semantic-radius-prominent', '--wm-semantic-radius-round',
      '--wm-semantic-border-default', '--wm-semantic-focus-width',
      '--wm-semantic-shadow-rest', '--wm-semantic-shadow-raised',
      '--wm-semantic-shadow-prominent', '--wm-semantic-shadow-overlay',
    ]),
    motion: Object.freeze([
      '--wm-semantic-motion-instant', '--wm-semantic-motion-fast',
      '--wm-semantic-motion-standard', '--wm-semantic-motion-deliberate',
      '--wm-semantic-ease-standard', '--wm-semantic-ease-enter',
      '--wm-semantic-ease-exit',
    ]),
    layers: Object.freeze([
      '--wm-semantic-z-base', '--wm-semantic-z-sticky',
      '--wm-semantic-z-floating', '--wm-semantic-z-drawer',
      '--wm-semantic-z-modal', '--wm-semantic-z-command', '--wm-semantic-z-toast',
    ]),
  }),
  invariants: Object.freeze({
    concreteValuesRemainInCertifiedAuthorities: true,
    semanticAliasesMustResolveThroughExistingTokens: true,
    componentTokensMayConsumePrimitiveOrSemanticTokens: true,
    compatibilityTokensRemainValidUntilZeroConsumerRetirement: true,
    noVisualValueChangeInM58: true,
    noThemePaletteRedesignInM58: true,
    noTypographyScaleRedesignInM58: true,
    noBreakpointRedesignInM58: true,
  }),
  successorOwnership: Object.freeze({
    typography: 59,
    themeContrast: 60,
    layoutSpatial: 61,
    responsive: 62,
    accessibility: 63,
    componentConsolidation: 64,
    motionChoreography: 71,
  }),
} as const);

export type DesignTokenTier = typeof DESIGN_TOKEN_ARCHITECTURE.model[number];
