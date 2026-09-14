/**
 * Work Management React Design System foundation contract.
 *
 * The legacy CSS custom properties remain the canonical cross-runtime token
 * authority during Stage B. React/Chakra surfaces consume these values rather
 * than defining a competing light/dark palette.
 */
export const wmCssVariable = <TName extends `--wm-${string}`>(name: TName) => `var(${name})` as const;

export const workManagementFoundation = Object.freeze({
  fonts: Object.freeze({
    body: wmCssVariable('--wm-font-family'),
    mono: wmCssVariable('--wm-font-mono'),
  }),
  fontSizes: Object.freeze({
    '2xs': wmCssVariable('--wm-text-2xs'),
    xs: wmCssVariable('--wm-text-xs'),
    sm: wmCssVariable('--wm-text-sm'),
    md: wmCssVariable('--wm-text-md'),
    lg: wmCssVariable('--wm-text-lg'),
    xl: wmCssVariable('--wm-text-xl'),
    '2xl': wmCssVariable('--wm-text-2xl'),
    '3xl': wmCssVariable('--wm-text-3xl'),
    '4xl': wmCssVariable('--wm-text-4xl'),
  }),
  fontWeights: Object.freeze({
    regular: wmCssVariable('--wm-font-weight-regular'),
    medium: wmCssVariable('--wm-font-weight-medium'),
    semibold: wmCssVariable('--wm-font-weight-semibold'),
    bold: wmCssVariable('--wm-font-weight-bold'),
  }),
  lineHeights: Object.freeze({
    tight: wmCssVariable('--wm-line-height-tight'),
    heading: wmCssVariable('--wm-line-height-tight'),
    body: wmCssVariable('--wm-line-height-normal'),
    relaxed: wmCssVariable('--wm-line-height-relaxed'),
  }),
  letterSpacings: Object.freeze({
    label: wmCssVariable('--wm-letter-spacing-label'),
  }),
  spacing: Object.freeze({
    0: wmCssVariable('--wm-space-0'),
    1: wmCssVariable('--wm-space-025'),
    2: wmCssVariable('--wm-space-050'),
    3: wmCssVariable('--wm-space-075'),
    4: wmCssVariable('--wm-space-100'),
    5: wmCssVariable('--wm-space-125'),
    6: wmCssVariable('--wm-space-150'),
    8: wmCssVariable('--wm-space-200'),
    10: wmCssVariable('--wm-space-250'),
    12: wmCssVariable('--wm-space-300'),
    14: wmCssVariable('--wm-space-350'),
    16: wmCssVariable('--wm-space-400'),
    20: wmCssVariable('--wm-space-500'),
    24: wmCssVariable('--wm-space-600'),
    32: wmCssVariable('--wm-space-800'),
  }),
  radii: Object.freeze({
    xs: wmCssVariable('--wm-radius-050'),
    sm: wmCssVariable('--wm-radius-100'),
    md: wmCssVariable('--wm-radius-150'),
    lg: wmCssVariable('--wm-radius-200'),
    xl: wmCssVariable('--wm-radius-300'),
    round: wmCssVariable('--wm-radius-round'),
  }),
  shadows: Object.freeze({
    xs: wmCssVariable('--wm-shadow-xs'),
    sm: wmCssVariable('--wm-shadow-sm'),
    md: wmCssVariable('--wm-shadow-md'),
    lg: wmCssVariable('--wm-shadow-lg'),
    overlay: wmCssVariable('--wm-shadow-overlay'),
  }),
  durations: Object.freeze({
    instant: wmCssVariable('--wm-motion-instant'),
    fast: wmCssVariable('--wm-motion-fast'),
    normal: wmCssVariable('--wm-motion-normal'),
    slow: wmCssVariable('--wm-motion-slow'),
    emphasized: wmCssVariable('--wm-motion-emphasized'),
  }),
  sizes: Object.freeze({
    controlSm: wmCssVariable('--wm-control-sm'),
    controlMd: wmCssVariable('--wm-control-md'),
    controlLg: wmCssVariable('--wm-control-lg'),
    hitTarget: wmCssVariable('--wm-hit-target'),
    contentMax: wmCssVariable('--wm-content-max'),
  }),
} as const);

export const workManagementSemanticColors = Object.freeze({
  canvas: wmCssVariable('--wm-color-canvas'),
  surfacePrimary: wmCssVariable('--wm-color-surface-primary'),
  surfaceSecondary: wmCssVariable('--wm-color-surface-secondary'),
  surfaceTertiary: wmCssVariable('--wm-color-surface-tertiary'),
  textPrimary: wmCssVariable('--wm-color-text-primary'),
  textSecondary: wmCssVariable('--wm-color-text-secondary'),
  textTertiary: wmCssVariable('--wm-color-text-tertiary'),
  textInverse: wmCssVariable('--wm-color-text-inverse'),
  borderPrimary: wmCssVariable('--wm-color-border-primary'),
  borderSubtle: wmCssVariable('--wm-color-border-subtle'),
  accent: wmCssVariable('--wm-color-accent'),
  accentHover: wmCssVariable('--wm-color-accent-hover'),
  positive: wmCssVariable('--wm-color-positive'),
  negative: wmCssVariable('--wm-color-negative'),
  warning: wmCssVariable('--wm-color-warning'),
  info: wmCssVariable('--wm-color-info'),
  focus: wmCssVariable('--wm-color-focus'),
  overlay: wmCssVariable('--wm-color-overlay'),
  input: wmCssVariable('--wm-color-input'),
  inputDisabled: wmCssVariable('--wm-color-input-disabled'),
} as const);

/** Values mirror the authoritative CSS media-query breakpoints and are verifier-locked. */
export const workManagementBreakpoints = Object.freeze({
  narrow: '40rem',
  tablet: '52.5rem',
  laptop: '70rem',
  wide: '90rem',
} as const);
