/* Work Boards feature boundary.
 *
 * The v1.42 UI migration makes this TypeScript controller facade authoritative.
 * Transport/domain construction remains outside presentation components.
 */
import { createBoardsFeature as createBoardsView } from '../../boards-ui.ts';
import { createBoardsController, type BoardController, type BoardFeatureViewOptions } from './boards-controller.ts';
import { createBoardService } from '../../core/boards.ts';
import { createBoardCommandService } from './services/board-command-service.ts';
import type { BoardCommandService } from '../../../../src/features/boards/contracts/commands.ts';
import type { BoardDomainService } from '../../../../src/features/boards/contracts/service.ts';
import type { BoardRealtimeService } from '../../../../src/features/boards/contracts/realtime.ts';

export { createBoardService, createBoardDomainService } from '../../core/boards.ts';
export { COLUMN_TYPES, STATUS_LABELS, BOARD_TABS, BOARD_TAB_LABELS, BOARD_ROLE_LABELS, defaultColumnName, startingColumns } from './board-schema.ts';
export { createBoardViewState, resetItemPanel } from './board-state.ts';
export { renderBoardListState, renderBoardToolbar } from './views/board-list-view.ts';
export { renderBoardTableView } from './views/table-view.ts';
export { renderBoardKanbanView } from './views/kanban-view.ts';
export { renderBoardHeader, renderBoardControls, renderBoardItemRow, renderBoardColumnHeader } from './views/board-workspace-view.ts';
export { renderItemWorkspace } from './views/item-workspace-view.ts';
export { createBoardDialogController } from './controllers/dialog-controller.ts';
export { createColumnWorkflows } from './controllers/column-workflows.ts';
export { createGroupWorkflows } from './controllers/group-workflows.ts';
export { createItemWorkflows } from './controllers/item-workflows.ts';
export { createMemberWorkflows } from './controllers/member-workflows.ts';
export { createActivityWorkflows } from './controllers/activity-workflows.ts';
export { createItemWorkspaceController } from './controllers/item-workspace-controller.ts';
export { createItemPanelRenderer } from './controllers/item-panel-renderer.ts';
export { createBoardDragDropController } from './controllers/drag-drop-controller.ts';
export { createBoardMenuController } from './controllers/board-menu-controller.ts';
export { createBoardDomainService as createTypedBoardDomainService } from './services/board-domain-service.ts';
export { createBoardRealtimeService } from './services/board-realtime-service.ts';
export { createBoardRealtimeController } from './controllers/board-realtime-controller.ts';

export interface BoardsFeatureOptions extends BoardFeatureViewOptions {
  readonly service?: BoardDomainService | null;
  readonly commands?: BoardCommandService | null;
  readonly realtime?: BoardRealtimeService | null;
}

export function createBoardsFeature(options: BoardsFeatureOptions): BoardController {
  const injectedService = options.service ?? null;
  const createService = (): BoardDomainService => injectedService ?? createBoardService(options.auth, {
    queryClient: options.queryClient ?? null,
    diagnostics: options.diagnostics ?? null,
  });
  const createCommands = (service: BoardDomainService): BoardCommandService => options.commands ?? createBoardCommandService({ service });
  return createBoardsController({
    auth: options.auth,
    createView: createBoardsView,
    viewOptions: options,
    createService,
    createCommands,
  });
}

export const BOARDS_FEATURE = Object.freeze({
  id: 'boards',
  routes: Object.freeze(['boards', 'board']),
  persistence: 'supabase-postgres',
  collaboration: Object.freeze(['overview', 'updates', 'files', 'activity', 'rich-properties', 'draft-resilience', 'file-drop', 'realtime-broadcast', 'presence']),
  lifecycle: Object.freeze(['activate', 'deactivate']),
  presentation: 'react-board-presentation-facade-v1',
  presentationEngine: 'assets/js/boards-ui.ts',
  architecture: 'react-route-facade-with-typed-rich-item-workspace-v1',
} as const);
