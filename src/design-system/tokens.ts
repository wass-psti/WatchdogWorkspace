/** Product-facing references to governed Work Management CSS custom properties. */
export const workManagementTokens = Object.freeze({
  semantic: Object.freeze({
    color: Object.freeze({
      canvas: 'var(--wm-color-canvas)',
      surface: 'var(--wm-color-surface-primary)',
      raisedSurface: 'var(--wm-color-surface-elevated)',
      text: 'var(--wm-color-text-primary)',
      mutedText: 'var(--wm-color-text-secondary)',
      border: 'var(--wm-color-border-primary)',
      accent: 'var(--wm-color-accent)',
      positive: 'var(--wm-color-positive)',
      negative: 'var(--wm-color-negative)',
      warning: 'var(--wm-color-warning)',
      info: 'var(--wm-color-info)',
      focus: 'var(--wm-color-focus)',
    }),
    spacing: Object.freeze({
      cluster: 'var(--wm-semantic-space-cluster)',
      control: 'var(--wm-semantic-space-control)',
      section: 'var(--wm-semantic-space-section)',
      separation: 'var(--wm-semantic-space-separation)',
      containment: 'var(--wm-semantic-space-containment)',
    }),
    control: Object.freeze({
      compact: 'var(--wm-semantic-control-compact)',
      default: 'var(--wm-semantic-control-default)',
      comfortable: 'var(--wm-semantic-control-comfortable)',
      hitTarget: 'var(--wm-semantic-hit-target)',
    }),
    surface: Object.freeze({
      controlRadius: 'var(--wm-semantic-radius-control)',
      surfaceRadius: 'var(--wm-semantic-radius-surface)',
      raisedShadow: 'var(--wm-semantic-shadow-raised)',
      overlayShadow: 'var(--wm-semantic-shadow-overlay)',
      focusWidth: 'var(--wm-semantic-focus-width)',
    }),
    motion: Object.freeze({
      fast: 'var(--wm-semantic-motion-fast)',
      standard: 'var(--wm-semantic-motion-standard)',
      deliberate: 'var(--wm-semantic-motion-deliberate)',
      enterEase: 'var(--wm-semantic-ease-enter)',
      exitEase: 'var(--wm-semantic-ease-exit)',
    }),
    layer: Object.freeze({
      base: 'var(--wm-semantic-z-base)',
      sticky: 'var(--wm-semantic-z-sticky)',
      floating: 'var(--wm-semantic-z-floating)',
      drawer: 'var(--wm-semantic-z-drawer)',
      modal: 'var(--wm-semantic-z-modal)',
      command: 'var(--wm-semantic-z-command)',
      toast: 'var(--wm-semantic-z-toast)',
    }),
  }),
  componentNamespace: Object.freeze({
    shell: '--wm-shell-',
    board: '--wm-board-',
  }),
} as const);

export type WorkManagementTokenReferences = typeof workManagementTokens;
