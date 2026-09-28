export const workManagementTypography = Object.freeze({
  roles: Object.freeze({
    display: 'wm-type-display',
    pageTitle: 'wm-type-page-title',
    sectionTitle: 'wm-type-section-title',
    subsectionTitle: 'wm-type-subsection-title',
    body: 'wm-type-body',
    bodyStrong: 'wm-type-body-strong',
    control: 'wm-type-control',
    label: 'wm-type-label',
    caption: 'wm-type-caption',
    helper: 'wm-type-helper',
    metadata: 'wm-type-metadata',
    data: 'wm-type-data',
    dataHeader: 'wm-type-data-header',
  }),
  contentFlow: Object.freeze({
    wrap: 'wm-text-wrap',
    truncate: 'wm-text-truncate',
    preserve: 'wm-text-preserve',
  }),
  numeric: 'wm-type-numeric',
  code: 'wm-type-code',
} as const);

export type WorkManagementTypographyRole = keyof typeof workManagementTypography.roles;
export type WorkManagementTextFlow = keyof typeof workManagementTypography.contentFlow;
