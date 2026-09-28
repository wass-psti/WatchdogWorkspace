export const workManagementLayout = Object.freeze({
  gap: Object.freeze({
    tight: 'var(--wm-layout-gap-tight)',
    compact: 'var(--wm-layout-gap-compact)',
    control: 'var(--wm-layout-gap-control)',
    standard: 'var(--wm-layout-gap-standard)',
    section: 'var(--wm-layout-gap-section)',
    major: 'var(--wm-layout-gap-major)',
  }),
  inset: Object.freeze({
    compact: 'var(--wm-layout-inset-compact)',
    control: 'var(--wm-layout-inset-control)',
    standard: 'var(--wm-layout-inset-standard)',
    section: 'var(--wm-layout-inset-section)',
    major: 'var(--wm-layout-inset-major)',
  }),
  width: Object.freeze({
    content: 'var(--wm-layout-page-max)',
    reading: 'var(--wm-layout-reading-max)',
    full: '100%',
  }),
  page: Object.freeze({
    paddingStart: 'var(--wm-layout-page-padding-start)',
    paddingInline: 'var(--wm-layout-page-padding-inline)',
    paddingEnd: 'var(--wm-layout-page-padding-end)',
  }),
} as const);

export type WorkManagementStackGap = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type WorkManagementClusterGap = 'tight' | 'compact' | 'control' | 'standard';
export type WorkManagementGridGap = 'compact' | 'standard' | 'section';
export type WorkManagementGridColumns = 1 | 2 | 3;
export type WorkManagementContentWidth = 'content' | 'reading' | 'full';
