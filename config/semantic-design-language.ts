export type SemanticHierarchyLevel = 'primary' | 'secondary' | 'tertiary' | 'supporting';
export type SemanticContentPriority = 'critical' | 'primary' | 'secondary' | 'metadata';
export type SemanticInteractionPriority = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'quiet';
export type SemanticSurfaceRole = 'canvas' | 'base' | 'raised' | 'overlay' | 'inset';
export type SemanticDensityIntent = 'comfortable' | 'compact' | 'dense';
export type SemanticSpatialIntent = 'cluster' | 'section' | 'separation' | 'containment';
export type SemanticEmphasis = 'default' | 'subtle' | 'strong' | 'critical';
export type SemanticAlignmentIntent = 'start' | 'center' | 'end' | 'baseline' | 'numeric-end';

export const semanticDesignLanguageVersion = 1 as const;

/**
 * M57 defines meaning and governance only. Concrete token values remain under
 * the existing foundation/token/theme authorities until their assigned
 * successor milestones (M58-M61).
 */
export const semanticDesignLanguage = Object.freeze({
  principles: Object.freeze([
    Object.freeze({ id: 'clarity-first', rule: 'Operational comprehension takes precedence over decoration or novelty.' }),
    Object.freeze({ id: 'hierarchy-by-purpose', rule: 'Visual hierarchy communicates task and content priority rather than arbitrary size or color differences.' }),
    Object.freeze({ id: 'consistent-meaning', rule: 'The same semantic role should communicate the same meaning across host and module boundaries unless a documented workflow exception exists.' }),
    Object.freeze({ id: 'density-with-intent', rule: 'Density is selected from task frequency and information load; it is not a page-local styling preference.' }),
    Object.freeze({ id: 'progressive-disclosure', rule: 'Secondary detail and infrequent controls should not compete with the current primary task.' }),
    Object.freeze({ id: 'accessible-by-default', rule: 'Meaning cannot depend on color, motion, pointer precision, or visual position alone.' }),
    Object.freeze({ id: 'continuity-over-spectacle', rule: 'Motion and visual continuity may reinforce state changes but must never become the only state signal.' }),
    Object.freeze({ id: 'restrained-brand-expression', rule: 'Brand expression supports recognition and emphasis without reducing legibility, data density, or module usability.' }),
  ]),
  hierarchy: Object.freeze({
    primary: 'Current task, page identity, or dominant decision.',
    secondary: 'Supporting task groups or major subsections.',
    tertiary: 'Local structure and subordinate actions.',
    supporting: 'Helper, contextual, explanatory, or metadata content.',
  }),
  contentPriority: Object.freeze({
    critical: 'Safety, destructive, blocking, authorization, or irreversible information requiring immediate recognition.',
    primary: 'Information required to understand or complete the current task.',
    secondary: 'Useful supporting information that may be deferred without blocking the primary task.',
    metadata: 'Low-emphasis timestamps, identifiers, provenance, status detail, or auxiliary context.',
  }),
  interactionPriority: Object.freeze({
    primary: 'The dominant affirmative action for the current bounded task.',
    secondary: 'A common alternative action that remains visually subordinate to the primary action.',
    tertiary: 'Contextual or low-frequency action that should not compete for dominant emphasis.',
    destructive: 'Potentially irreversible or materially harmful action requiring explicit semantic distinction and applicable confirmation.',
    quiet: 'Low-emphasis action whose availability matters more than visual prominence.',
  }),
  surfaceRoles: Object.freeze({
    canvas: 'Application or module background plane.',
    base: 'Default content surface placed on the canvas.',
    raised: 'Elevated content or interaction surface requiring separation from its parent plane.',
    overlay: 'Transient surface rendered above the active page hierarchy.',
    inset: 'Subordinate or embedded region visually contained within another surface.',
  }),
  density: Object.freeze({
    comfortable: 'General-purpose reading and mixed interaction density.',
    compact: 'Frequent operational work where scan efficiency matters while touch and readability contracts remain valid.',
    dense: 'High-volume data presentation used only where the workflow and input modality support it.',
  }),
  spatialIntent: Object.freeze({
    cluster: 'Keep strongly related controls or content perceptually together.',
    section: 'Separate meaningful task or content groups without implying unrelatedness.',
    separation: 'Create clear distinction between independent concerns or competing action groups.',
    containment: 'Communicate ownership or bounded scope through a stable parent surface or region.',
  }),
  emphasis: Object.freeze({
    default: 'Normal hierarchy treatment for the role.',
    subtle: 'Reduced visual prominence without reducing accessibility or discoverability below policy.',
    strong: 'Increased prominence for current focus, major state, or high-priority content.',
    critical: 'Reserved emphasis for blocking, destructive, security, or urgent operational state.',
  }),
  alignment: Object.freeze({
    start: 'Default text and mixed-content alignment.',
    center: 'Reserved for compact, balanced content where scan order is not degraded.',
    end: 'Right/end alignment for controls or values when semantically appropriate.',
    baseline: 'Align mixed inline content by readable text baseline.',
    'numeric-end': 'Align comparable numeric data by end edge for efficient scanning.',
  }),
  brandExpression: Object.freeze({
    accentUse: 'Use product accent for recognition, active state, or deliberate emphasis; do not use it as generic decoration.',
    moduleIdentity: 'Module-specific identity may remain visible when it does not conflict with shared semantic meaning or accessibility.',
    restraint: 'Decorative gradients, shadows, translucency, and motion must remain subordinate to content and interaction clarity.',
  }),
  protectedBoundaries: Object.freeze([
    'M57 does not change token values, breakpoints, typography scales, theme palettes, component APIs, routing, authentication, authorization/RBAC, persistence, backend contracts, schemas, migrations, or module workflows.',
    'M57 semantic roles do not authorize retirement of M56 compatibility authorities.',
    'M57 definitions are normative vocabulary; successor milestones own their concrete visual mapping.',
  ]),
} as const);
