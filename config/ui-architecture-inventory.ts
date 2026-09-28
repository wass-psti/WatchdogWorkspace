export type UIArchitectureAuthorityStatus =
  | 'authoritative-shared'
  | 'authoritative-host'
  | 'compatibility-authority'
  | 'module-specific-authority'
  | 'verification-authority';

export interface UIArchitectureDomain {
  readonly id: string;
  readonly status: UIArchitectureAuthorityStatus;
  readonly purpose: string;
  readonly canonicalPaths: readonly string[];
  readonly invariants: readonly string[];
  readonly plannedSuccessorMilestones: readonly number[];
}

export const uiArchitectureInventoryVersion = 1 as const;

/**
 * M56 inventory of live presentation authorities in the certified M55 baseline.
 * This manifest records ownership; it does not authorize relocation or deletion.
 */
export const uiArchitectureDomains = Object.freeze([
  Object.freeze({
    id: 'react-design-system',
    status: 'authoritative-shared',
    purpose: 'Product-owned React design-system provider, tokens bridge, primitives, icons, and interaction components.',
    canonicalPaths: Object.freeze(['src/design-system']),
    invariants: Object.freeze([
      'Feature code consumes the product-owned design-system boundary rather than creating a competing provider.',
      'Chakra remains an implementation detail and must not become a feature-owned global authority.',
      'The certified CSS custom-property layer remains the cross-runtime token source until a later migration explicitly changes that contract.',
    ]),
    plannedSuccessorMilestones: Object.freeze([57, 58, 59, 60, 61, 63, 64]),
  }),
  Object.freeze({
    id: 'foundation-css',
    status: 'authoritative-shared',
    purpose: 'Cross-runtime CSS tokens, themes, primitives, interactions, component styling, migration bridges, and module-unification rules.',
    canonicalPaths: Object.freeze(['assets/css/foundation']),
    invariants: Object.freeze([
      'Shared visual tokens and cross-runtime CSS contracts remain centralized here until explicitly migrated.',
      'Legacy aliases are compatibility contracts, not permission to add new ungoverned styling.',
    ]),
    plannedSuccessorMilestones: Object.freeze([57, 58, 59, 60, 61, 62, 63, 64]),
  }),
  Object.freeze({
    id: 'host-shared-presentation',
    status: 'authoritative-host',
    purpose: 'React-owned authentication, authenticated management, shared application UI, and application composition surfaces.',
    canonicalPaths: Object.freeze(['src/app/auth', 'src/app/management', 'src/app/shared-ui', 'src/app/composition', 'assets/css/app.css', 'assets/css/shared-application-ui.css']),
    invariants: Object.freeze([
      'Presentation evolution must preserve authentication, session, authorization, persistence, routing, and management-authority contracts.',
      'Runtime-hosted DOM islands remain explicitly owned boundaries until separately migrated.',
    ]),
    plannedSuccessorMilestones: Object.freeze([65, 67, 72]),
  }),
  Object.freeze({
    id: 'application-shell',
    status: 'authoritative-host',
    purpose: 'Application shell, navigation, account-menu, accessibility, responsive-shell, and shell-overlay presentation.',
    canonicalPaths: Object.freeze(['src/app/shell', 'assets/css/shell-navigation.css', 'assets/css/shell-account-menu.css', 'assets/css/shell-accessibility.css', 'assets/css/shell-overlays.css']),
    invariants: Object.freeze([
      'Shell presentation must not seize route ownership from the route-lifecycle authority.',
      'Shell styling must preserve stable navigation geometry, scroll behavior, keyboard access, and responsive containment.',
    ]),
    plannedSuccessorMilestones: Object.freeze([62, 63, 68, 71, 72]),
  }),
  Object.freeze({
    id: 'overlay-floating-surface',
    status: 'compatibility-authority',
    purpose: 'Global overlay coordination, floating-surface positioning, tooltip control, dismissal, focus restoration, and imperative overlay lifecycle.',
    canonicalPaths: Object.freeze(['src/app/overlays', 'assets/js/platform/ui/global-overlay-runtime.ts', 'assets/js/platform/ui/overlay-manager.ts', 'assets/js/platform/ui/floating-surface.ts', 'assets/js/platform/ui/tooltip-controller.ts']),
    invariants: Object.freeze([
      'React and imperative surfaces must share one coordinated overlay lifecycle instead of introducing parallel global stacks.',
      'Escape handling, outside-pointer dismissal, focus restoration, and nested surface ownership remain behavior contracts.',
    ]),
    plannedSuccessorMilestones: Object.freeze([63, 66, 72]),
  }),
  Object.freeze({
    id: 'imperative-ui-runtime',
    status: 'compatibility-authority',
    purpose: 'Typed browser UI primitives and legacy-compatible runtime presentation used by still-certified non-React execution paths.',
    canonicalPaths: Object.freeze(['assets/js/platform/ui/primitives.ts', 'assets/js/runtime', 'assets/js/features']),
    invariants: Object.freeze([
      'Compatibility runtime paths remain live until a successor milestone proves their consumers are migrated.',
      'No new competing global UI authority may be introduced under the compatibility runtime.',
    ]),
    plannedSuccessorMilestones: Object.freeze([64, 67, 68, 69, 70, 71, 72, 73]),
  }),
  Object.freeze({
    id: 'boards-presentation',
    status: 'authoritative-host',
    purpose: 'Boards React presentation facade plus certified imperative board interaction and dense-data presentation runtime.',
    canonicalPaths: Object.freeze(['src/app/boards', 'src/features/boards', 'assets/js/features/boards', 'assets/css/boards-monday.css']),
    invariants: Object.freeze([
      'UI changes must preserve Boards repository, realtime, concurrency, virtualization, drag/drop, and item-workspace contracts.',
      'Dense-data presentation is a feature authority and must not be flattened into generic styling at the expense of behavior.',
    ]),
    plannedSuccessorMilestones: Object.freeze([69, 71, 73]),
  }),
  Object.freeze({
    id: 'motion-system',
    status: 'compatibility-authority',
    purpose: 'Shared CSS and typed runtime motion orchestration across the host and embedded modules.',
    canonicalPaths: Object.freeze(['assets/css/motion-design.css', 'assets/js/runtime/motion-design.ts', 'assets/js/runtime/motion-orchestrator.ts']),
    invariants: Object.freeze([
      'Motion must remain reduced-motion aware and must not destabilize application-shell layout or focus behavior.',
      'Motion is a continuity aid, not a replacement for state or navigation feedback.',
    ]),
    plannedSuccessorMilestones: Object.freeze([58, 63, 71]),
  }),
  Object.freeze({
    id: 'time-tracker-module-ui',
    status: 'module-specific-authority',
    purpose: 'TimeTracker-specific presentation and motion with its own application-scoped workflow and authorization semantics.',
    canonicalPaths: Object.freeze(['apps/time-tracker']),
    invariants: Object.freeze([
      'Host UI governance must not collapse TimeTracker-specific authorization or attendance workflows into host-global presentation semantics.',
      'Module-local styling remains legitimate until the TimeTracker harmonization milestone completes.',
    ]),
    plannedSuccessorMilestones: Object.freeze([74]),
  }),
  Object.freeze({
    id: 'fueltrack-module-ui',
    status: 'module-specific-authority',
    purpose: 'FuelTrack+-specific dashboard, analytics, request, approval, inventory, and activity presentation.',
    canonicalPaths: Object.freeze(['apps/fueltrack-plus']),
    invariants: Object.freeze([
      'Host UI governance must preserve FuelTrack+ request lifecycle and module-scoped RBAC.',
      'Module-local styling remains legitimate until the FuelTrack+ harmonization milestone completes.',
    ]),
    plannedSuccessorMilestones: Object.freeze([70, 75]),
  }),
  Object.freeze({
    id: 'tradelink-module-ui',
    status: 'module-specific-authority',
    purpose: 'TradeLink-specific document creation, document management, recovery, and PDF-oriented presentation.',
    canonicalPaths: Object.freeze(['apps/tradelink']),
    invariants: Object.freeze([
      'Host UI governance must preserve document calculations, PDF semantics, and TradeLink-specific workflows.',
      'Module-local styling remains legitimate until the TradeLink harmonization milestone completes.',
    ]),
    plannedSuccessorMilestones: Object.freeze([76]),
  }),
  Object.freeze({
    id: 'ui-verification-governance',
    status: 'verification-authority',
    purpose: 'Historical UI, accessibility, shell, design-system, interaction, browser, and release verification that protects certified behavior.',
    canonicalPaths: Object.freeze(['tests', 'verify-project.sh', 'verify-v1432-ui-foundation-phase1.mjs', 'verify-v1432-ui-components-phase2.mjs', 'verify-v1432-ui-deep-migration-phase3.mjs', 'verify-v1432-ui-final-quality.mjs']),
    invariants: Object.freeze([
      'UI implementation is not complete solely because visual output appears correct.',
      'Existing historical regression gates remain mandatory unless a separately certified governance change replaces them.',
    ]),
    plannedSuccessorMilestones: Object.freeze([77]),
  }),
] satisfies readonly UIArchitectureDomain[]);

export const uiGovernanceClassification = Object.freeze({
  authoritativeShared: 'shared system authority consumed across host/runtime/module boundaries',
  authoritativeHost: 'host or host-feature presentation authority',
  compatibilityAuthority: 'live certified compatibility boundary retained until an explicit successor migration proves replacement',
  moduleSpecificAuthority: 'legitimate module-owned UI authority whose business workflows must remain independent',
  verificationAuthority: 'quality/certification authority that constrains UI changes',
} as const);
