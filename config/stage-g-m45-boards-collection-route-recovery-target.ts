export type M45ActivationState = 'implementation-complete-pending-certification' | 'active-certified';

export const stageGM45BoardsCollectionRouteRecoveryTarget = Object.freeze({
  milestone: 45,
  stage: 'G',
  name: 'Boards Collection & Route Recovery',
  activationState: 'implementation-complete-pending-certification' as M45ActivationState,
  prerequisite: Object.freeze({ milestone: 44, requiredState: 'active-certified' as const }),
  architectureVersion: 53,
  authority: Object.freeze({
    featureOwner: 'boards',
    presentationFacade: 'src/app/boards/BoardPresentationFacade.tsx',
    collectionController: 'assets/js/boards-ui.ts',
    dataController: 'assets/js/features/boards/controllers/board-data-controller.ts',
    repository: 'assets/js/features/boards/data/board-repository.ts',
    collectionView: 'assets/js/features/boards/views/board-list-view.ts',
    browser: 'tests/modern/e2e/boards-collection-route-recovery.spec.mjs',
  }),
  completionCriteria: Object.freeze([
    'Boards Active, Archive, and Trash collection views load through the typed Board repository and preserve lifecycle-specific list state.',
    'Board search filters by board name or description without corrupting collection lifecycle state.',
    'Active boards open through mouse and keyboard navigation; archived and trashed cards are not openable until restored.',
    'Direct navigation to an archived or trashed board is rejected from the workspace and redirected to the corresponding collection.',
    'Board creation and duplication refresh the Active collection before opening the resulting active board.',
    'Archive, trash, restore, and permanent-delete mutations await the current collection refresh before completing UI state progression.',
    'Context menus expose only lifecycle-appropriate actions and do not render empty action menus for inactive viewer-only cards.',
    'M37-BRD-001 is explicitly resolved by M40 route readiness plus M45 collection/route evidence without masking M37-BRD-002.',
    'Dedicated deterministic and browser verification exercise collection navigation, search, create/open/duplicate, archive/restore/trash/delete, list menus, and inactive-route recovery end to end.',
  ]),
  knownBoundaries: Object.freeze([
    'M46 remains responsible for deployed wm_* Board RPC/schema capability recovery (M37-BRD-002); M45 does not claim backend deployment repair.',
    'M26 same-origin iframe compatibility remains for embedded modules that have not met native-retirement criteria.',
    'Board table/cell/Kanban/item-workspace/realtime milestones M47-M51 remain outside M45 collection recovery scope.',
    'M54 remains responsible for final production-readiness certification.',
  ]),
});
