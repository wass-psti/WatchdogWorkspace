/**
 * Product-facing semantic design-language vocabulary established by M57.
 * This module intentionally contains no concrete colors, spacing values,
 * breakpoints, typography sizes, or component styling. Those remain owned by
 * the existing foundation authorities and their assigned successor milestones.
 */
export const workManagementSemanticLanguage = Object.freeze({
  hierarchy: Object.freeze(['primary', 'secondary', 'tertiary', 'supporting'] as const),
  contentPriority: Object.freeze(['critical', 'primary', 'secondary', 'metadata'] as const),
  interactionPriority: Object.freeze(['primary', 'secondary', 'tertiary', 'destructive', 'quiet'] as const),
  surfaceRole: Object.freeze(['canvas', 'base', 'raised', 'overlay', 'inset'] as const),
  densityIntent: Object.freeze(['comfortable', 'compact', 'dense'] as const),
  spatialIntent: Object.freeze(['cluster', 'section', 'separation', 'containment'] as const),
  emphasis: Object.freeze(['default', 'subtle', 'strong', 'critical'] as const),
  alignmentIntent: Object.freeze(['start', 'center', 'end', 'baseline', 'numeric-end'] as const),
} as const);

export type WorkManagementHierarchy = (typeof workManagementSemanticLanguage.hierarchy)[number];
export type WorkManagementContentPriority = (typeof workManagementSemanticLanguage.contentPriority)[number];
export type WorkManagementInteractionPriority = (typeof workManagementSemanticLanguage.interactionPriority)[number];
export type WorkManagementSurfaceRole = (typeof workManagementSemanticLanguage.surfaceRole)[number];
export type WorkManagementDensityIntent = (typeof workManagementSemanticLanguage.densityIntent)[number];
export type WorkManagementSpatialIntent = (typeof workManagementSemanticLanguage.spatialIntent)[number];
export type WorkManagementEmphasis = (typeof workManagementSemanticLanguage.emphasis)[number];
export type WorkManagementAlignmentIntent = (typeof workManagementSemanticLanguage.alignmentIntent)[number];
