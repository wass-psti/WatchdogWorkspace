export type FuturisticMinimalistOwnershipClass =
  | 'shared-design-authority'
  | 'host-presentation-authority'
  | 'module-presentation-authority'
  | 'compatibility-runtime-authority'
  | 'verification-authority';

export interface FuturisticMinimalistPresentationDomain {
  readonly id: string;
  readonly ownership: FuturisticMinimalistOwnershipClass;
  readonly canonicalPaths: readonly string[];
  readonly protectedBehaviors: readonly string[];
  readonly mutationMilestones: readonly number[];
}

/**
 * M78 re-baselines presentation ownership from the certified M77 repository.
 * It is a migration contract only: M78 itself does not authorize mutation of
 * any presentation/runtime path listed here.
 */
export const futuristicMinimalistPresentationDomains = Object.freeze([
  Object.freeze({
    id: 'design-system-foundation',
    ownership: 'shared-design-authority',
    canonicalPaths: Object.freeze(['src/design-system', 'assets/css/foundation']),
    protectedBehaviors: Object.freeze([
      'Preserve M57-M71 token, typography, theme, layout, responsive, accessibility, component, overlay, feedback, data-presentation, analytics, and motion contracts.',
      'Do not introduce a competing design-system provider or feature-owned global token authority.',
    ]),
    mutationMilestones: Object.freeze([79, 80, 82, 90, 91, 92, 93, 94, 95, 96]),
  }),
  Object.freeze({
    id: 'application-shell-and-host',
    ownership: 'host-presentation-authority',
    canonicalPaths: Object.freeze(['src/app', 'assets/css/app.css', 'assets/css/shared-application-ui.css', 'assets/css/shell-navigation.css', 'assets/css/shell-account-menu.css', 'assets/css/shell-accessibility.css', 'assets/css/shell-overlays.css']),
    protectedBehaviors: Object.freeze([
      'Preserve routing, authentication, authorization, session restoration, account management, shell navigation, overlay lifecycle, responsive containment, and keyboard behavior.',
      'Shell presentation may not seize route or application-state ownership.',
    ]),
    mutationMilestones: Object.freeze([81, 82, 83, 88, 89, 91, 92, 93, 94, 95, 96]),
  }),
  Object.freeze({
    id: 'boards-presentation',
    ownership: 'host-presentation-authority',
    canonicalPaths: Object.freeze(['src/features/boards', 'assets/js/features/boards', 'assets/css/boards-monday.css']),
    protectedBehaviors: Object.freeze([
      'Preserve Board repository, Supabase persistence, realtime/concurrency, virtualization, drag/drop, selection, item workspace, history, and RBAC semantics.',
    ]),
    mutationMilestones: Object.freeze([84, 90, 91, 92, 93, 94, 95, 96]),
  }),
  Object.freeze({
    id: 'imperative-host-runtime',
    ownership: 'compatibility-runtime-authority',
    canonicalPaths: Object.freeze(['assets/js/features', 'assets/js/platform/ui', 'assets/js/runtime']),
    protectedBehaviors: Object.freeze([
      'Retain production imperative UI/event/data hooks until explicit consumer migration and zero-consumer evidence permit retirement.',
      'Do not convert compatibility ownership into deletion authority.',
    ]),
    mutationMilestones: Object.freeze([81, 83, 84, 88, 89, 90, 91, 92, 93, 94, 95, 96]),
  }),
  Object.freeze({
    id: 'time-tracker-presentation',
    ownership: 'module-presentation-authority',
    canonicalPaths: Object.freeze(['apps/time-tracker']),
    protectedBehaviors: Object.freeze([
      'Preserve TimeTracker application-scoped RBAC, attendance, GPS, work-note, schedule, OT, persistence, and host-identity boundaries.',
    ]),
    mutationMilestones: Object.freeze([85, 90, 91, 92, 93, 94, 95, 96]),
  }),
  Object.freeze({
    id: 'fueltrack-plus-presentation',
    ownership: 'module-presentation-authority',
    canonicalPaths: Object.freeze(['apps/fueltrack-plus']),
    protectedBehaviors: Object.freeze([
      'Preserve FuelTrack+ module RBAC, request/approval/refueling lifecycle, analytics, persistence, exports, and host-identity boundaries.',
    ]),
    mutationMilestones: Object.freeze([86, 90, 91, 92, 93, 94, 95, 96]),
  }),
  Object.freeze({
    id: 'tradelink-presentation',
    ownership: 'module-presentation-authority',
    canonicalPaths: Object.freeze(['apps/tradelink']),
    protectedBehaviors: Object.freeze([
      'Preserve TradeLink document calculations, VAT behavior, import/recovery actions, PDF semantics, persistence, and host-identity boundaries.',
    ]),
    mutationMilestones: Object.freeze([87, 90, 91, 92, 93, 94, 95, 96]),
  }),
  Object.freeze({
    id: 'visual-regression-and-certification',
    ownership: 'verification-authority',
    canonicalPaths: Object.freeze(['tests', 'regression-baseline', 'scripts', 'verify-project.sh']),
    protectedBehaviors: Object.freeze([
      'Historical regression, browser/E2E, package hygiene, source identity, and certification gates remain mandatory unless replaced by an explicitly certified successor authority.',
    ]),
    mutationMilestones: Object.freeze([78, 97, 98]),
  }),
] satisfies readonly FuturisticMinimalistPresentationDomain[]);
