import '../../assets/js/runtime/motion-orchestrator.ts';
import '../../assets/js/runtime/motion-design.ts';

import { createFeatureRegistry } from '../../assets/js/runtime/feature-registry.ts';
import { createRoutePolicyService } from '../../assets/js/runtime/services/route-policy.ts';
import { createRouteController } from '../../assets/js/runtime/route-controller.ts';
import { createWorkManagementClient } from '../../assets/js/runtime/work-management-client.ts';
import { WorkManagementError, normalizeAppError } from '../../assets/js/platform/errors/app-error.ts';
import {
  parseModuleDataRequest,
  parseModuleIdentityRequest,
  handleCloudModuleDataMessage,
  handleCloudModuleIdentityMessage,
  installCloudModuleDataBridge,
} from '../../assets/js/core/cloud-module-data.ts';
import { EmbeddedLifecycleTransitionError, transitionEmbeddedLifecycle } from '../../assets/js/runtime/module-lifecycle.ts';
import { createModuleHost } from '../../assets/js/runtime/module-host.ts';
import { authorizationFingerprint, reconcileAuthorizationContext } from '../../assets/js/runtime/authorization-context.ts';
import {
  buttonClass,
  iconButtonClass,
  fieldControlClass,
  navigationItemClass,
  tabClass,
  toolbarClass,
} from '../../assets/js/platform/ui/primitives.ts';
import { createBoardDialogController } from '../../assets/js/features/boards/controllers/dialog-controller.ts';
import { createBoardDragDropController } from '../../assets/js/features/boards/controllers/drag-drop-controller.ts';
import { createColumnResizeController } from '../../assets/js/features/boards/controllers/column-resize-controller.ts';
import { createBoardStructureDragController } from '../../assets/js/features/boards/controllers/structure-drag-controller.ts';
import { createBoardViewState, resetItemPanel } from '../../assets/js/features/boards/board-state.ts';
import { isStatusLabel, parseStatusColumnConfig, assertStatusValue } from '../../src/features/boards/contracts/status-schema.ts';
import {
  registerBoardColumnType,
  getBoardColumnType,
  boardColumnTypes,
  boardColumnTypeMap,
  normalizeBoardCellValue,
  defaultBoardCellValue,
  getBoardCellEditorContract,
} from '../../assets/js/features/boards/grid/column-type-registry.ts';
import { STATUS_LABELS, BOARD_TABS, COLUMN_TYPES, defaultColumnName, startingColumns } from '../../assets/js/features/boards/board-schema.ts';
import {
  STATUS_COLOR_PALETTE,
  DEFAULT_STATUS_LABELS,
  STATUS_REFERENCE_POLICY,
  createStatusLabelId,
  normalizeStatusLabels,
  statusConfig,
  statusLabelMap,
  activeStatusLabels,
  serializeStatusConfig,
  renameStatusLabel,
  recolorStatusLabel,
  setStatusLabelActive,
  reorderStatusLabels,
  addStatusLabel,
  removeStatusLabel,
} from '../../assets/js/features/boards/status-labels.ts';
import { createOverlayManager } from '../../assets/js/platform/ui/overlay-manager.ts';
import { globalOverlayRuntime, resolveGlobalOverlayRoot, resolveGlobalToastRoot } from '../../assets/js/platform/ui/global-overlay-runtime.ts';
import { authenticationUiRuntime } from '../../src/app/auth/authentication-ui-runtime.ts';
import { authenticatedManagementUiRuntime } from '../../src/app/management/authenticated-management-ui-runtime.ts';
import { sharedApplicationUiRuntime } from '../../src/app/shared-ui/shared-application-ui-runtime.ts';
import { boardPresentationFacadeRuntime } from '../../src/app/boards/board-presentation-facade-runtime.ts';
import {
  cssPixelValue,
  positionAnchoredSurface,
  menuItemElements,
  focusMenuItem,
  focusMenuItemByTypeahead,
} from '../../assets/js/platform/ui/floating-surface.ts';
import { createShellTooltipController } from '../../assets/js/platform/ui/tooltip-controller.ts';
import { createAccountProfileMenu } from '../../assets/js/features/account/profile-menu.ts';
import { applyTheme, getPreferences, savePreferences } from '../../assets/js/core/platform.ts';
import { createBoardOverlayCoordinator } from '../../assets/js/features/boards/controllers/overlay-coordinator.ts';
import { createBoardSelectionService } from '../../assets/js/features/boards/services/board-selection-service.ts';
import { createStatusLabelEditor } from '../../assets/js/features/boards/services/status-label-editor.ts';
import { createItemWorkspaceRuntime } from '../../assets/js/features/boards/services/item-workspace-runtime.ts';
import { createBoardHistoryController } from '../../assets/js/features/boards/controllers/history-controller.ts';
import { createBoardSelectionController } from '../../assets/js/features/boards/controllers/selection-controller.ts';
import { createBoardInlineEditController } from '../../assets/js/features/boards/controllers/inline-edit-controller.ts';
import { renderItemWorkspace } from '../../assets/js/features/boards/views/item-workspace-view.ts';
import { createItemWorkspaceController } from '../../assets/js/features/boards/controllers/item-workspace-controller.ts';
import { createItemPanelRenderer } from '../../assets/js/features/boards/controllers/item-panel-renderer.ts';
import { createBoardMenuController } from '../../assets/js/features/boards/controllers/board-menu-controller.ts';
import { createBoardTableVirtualizationController } from '../../assets/js/features/boards/controllers/board-table-virtualization-controller.ts';
import {
  BOARD_TABLE_VIRTUALIZATION_POLICY,
  boardVirtualColumnContains,
  boardVirtualRowContains,
  calculateBoardVirtualColumnWindow,
  calculateBoardVirtualRowWindow,
} from '../../src/features/boards/virtualization/board-table-virtualization.ts';

Object.assign(globalThis, {
  createFeatureRegistry,
  createRoutePolicyService,
  createRouteController,
  createWorkManagementClient,
  WorkManagementError,
  normalizeAppError,
  parseModuleDataRequest,
  parseModuleIdentityRequest,
  handleCloudModuleDataMessage,
  handleCloudModuleIdentityMessage,
  installCloudModuleDataBridge,
  EmbeddedLifecycleTransitionError,
  transitionEmbeddedLifecycle,
  createModuleHost,
  authorizationFingerprint,
  reconcileAuthorizationContext,
  buttonClass,
  iconButtonClass,
  fieldControlClass,
  navigationItemClass,
  tabClass,
  toolbarClass,
  createBoardDialogController,
  createBoardDragDropController,
  createColumnResizeController,
  createBoardStructureDragController,
  createBoardViewState,
  resetItemPanel,
  isStatusLabel,
  parseStatusColumnConfig,
  assertStatusValue,
  registerBoardColumnType,
  getBoardColumnType,
  boardColumnTypes,
  boardColumnTypeMap,
  normalizeBoardCellValue,
  defaultBoardCellValue,
  getBoardCellEditorContract,
  STATUS_LABELS,
  BOARD_TABS,
  COLUMN_TYPES,
  defaultColumnName,
  startingColumns,
  STATUS_COLOR_PALETTE,
  DEFAULT_STATUS_LABELS,
  STATUS_REFERENCE_POLICY,
  createStatusLabelId,
  normalizeStatusLabels,
  statusConfig,
  statusLabelMap,
  activeStatusLabels,
  serializeStatusConfig,
  renameStatusLabel,
  recolorStatusLabel,
  setStatusLabelActive,
  reorderStatusLabels,
  addStatusLabel,
  removeStatusLabel,
  createOverlayManager,
  globalOverlayRuntime,
  resolveGlobalOverlayRoot,
  resolveGlobalToastRoot,
  authenticationUiRuntime,
  authenticatedManagementUiRuntime,
  sharedApplicationUiRuntime,
  boardPresentationFacadeRuntime,
  cssPixelValue,
  positionAnchoredSurface,
  menuItemElements,
  focusMenuItem,
  focusMenuItemByTypeahead,
  createShellTooltipController,
  createAccountProfileMenu,
  applyTheme,
  getPreferences,
  savePreferences,
  createBoardOverlayCoordinator,
  createBoardSelectionService,
  createStatusLabelEditor,
  createItemWorkspaceRuntime,
  createBoardHistoryController,
  createBoardSelectionController,
  createBoardInlineEditController,
  renderItemWorkspace,
  createItemWorkspaceController,
  createItemPanelRenderer,
  createBoardMenuController,
  createBoardTableVirtualizationController,
  BOARD_TABLE_VIRTUALIZATION_POLICY,
  boardVirtualColumnContains,
  boardVirtualRowContains,
  calculateBoardVirtualColumnWindow,
  calculateBoardVirtualRowWindow,
});

(globalThis as typeof globalThis & { __wmBrowserRuntimeBundleReady?: boolean }).__wmBrowserRuntimeBundleReady = true;
