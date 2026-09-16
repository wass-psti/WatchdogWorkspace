import fs from 'node:fs';
import assert from 'node:assert/strict';
import { renderBoardTableView } from './assets/js/features/boards/views/table-view.ts';
import { renderBoardKanbanView } from './assets/js/features/boards/views/kanban-view.ts';

const read = (path) => fs.readFileSync(path, 'utf8');
const app = read('assets/js/app.ts');
const runtime = read('assets/js/runtime/index.ts');
const manifest = read('config/application-manifest.ts');
const assets = read('config/runtime-assets.js');
const platform = read('assets/js/core/platform.ts');
const sw = read('service-worker.js');
const authFeature = read('assets/js/features/auth/index.ts');
const authUi = read('src/app/auth/AuthenticationUI.tsx');
const authRuntime = read('src/app/auth/authentication-ui-runtime.ts');
const managementUi = read('src/app/management/AuthenticatedManagementUI.tsx');
const managementRuntime = read('src/app/management/authenticated-management-ui-runtime.ts');
const boardsUi = read('assets/js/boards-ui.ts');
const boardState = read('assets/js/features/boards/board-state.ts');
const boardFeature = read('assets/js/features/boards/index.ts');
const tableView = read('assets/js/features/boards/views/table-view.ts');
const kanbanView = read('assets/js/features/boards/views/kanban-view.ts');
const dialogs = read('assets/js/features/boards/controllers/dialog-controller.ts');
const workflows = read('assets/js/features/boards/controllers/column-workflows.ts');
const itemWorkspaceController = read('assets/js/features/boards/services/item-workspace-runtime.ts');
const docs = read('docs/architecture/PHASE-4.md');

assert.ok(platform.includes("PLATFORM_VERSION = '1.43.2'"), 'platform version is not v1.27.0');
assert.ok(sw.includes("work-management-v1.43.2"), 'service-worker cache is not v1.27.0');
assert.ok(manifest.includes("version: '1.43.2'") && Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0) >= 24, 'manifest architecture/version mismatch');

assert.ok(runtime.includes('AUTH_FEATURE') && runtime.includes('authenticatedManagementUiRuntime'), 'runtime gateway does not expose the current Authentication and M13 management authorities');
assert.ok(app.includes("featureRegistry.register('auth', authenticationUiRuntime"), 'React Authentication UI runtime is not registered as the auth feature authority');
assert.ok(app.includes("showStandaloneAuthentication('login')") && app.includes("showStandaloneAuthentication('register')") && app.includes("showStandaloneAuthentication('verify')"), 'auth route rendering is not delegated to the React standalone authentication boundary');
assert.ok(!app.includes('createAuthenticationFeature') && !app.includes('authFeature.'), 'shell must not construct or delegate to the retired imperative Authentication controller');
for (const legacy of ['let authBusy', 'let authMessage', 'let authTone', 'let registrationDraft', 'function renderLogin()', 'function renderRegister()', 'function renderVerify()']) {
  assert.ok(!app.includes(legacy), `shell still owns legacy authentication state/rendering: ${legacy}`);
}
for (const token of ['data-wm-authentication-ui-form="login"', 'data-wm-authentication-ui-form="register"', 'auth.confirmPendingCallback()', 'auth.resendSignupConfirmation', 'authenticationUiRuntime.consumeReturnRoute()']) {
  assert.ok(authUi.includes(token), `React Authentication UI missing ${token}`);
}
for (const token of ['registrationDraft', 'consumeReturnRoute', 'function cleanReturnRoute', 'deactivate()']) {
  assert.ok(authRuntime.includes(token), `Authentication UI runtime missing ${token}`);
}
assert.ok(authFeature.includes("presentation: 'react-authentication-ui-v1'") && !authFeature.includes('<form'), 'legacy Authentication feature must remain a non-rendering compatibility facade');

const phaseFourArchitecture = Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0);
if (phaseFourArchitecture >= 52) assert.ok(app.includes("featureRegistry.register('management', authenticatedManagementUiRuntime"), 'M44 consolidated Settings management authority is not registered');
else assert.ok(app.includes("featureRegistry.register('settings', authenticatedManagementUiRuntime"), 'Settings M13 authority is not registered');
// phaseFourArchitecture declared above for M44-aware historical compatibility.
const directSettingsDelegation = "settings: () => showAuthenticatedManagement('settings')";
const gatedSettingsDelegation = "settings: () => gateBackendCapability('settings', 'settings', () => showAuthenticatedManagement('settings'))";
if (phaseFourArchitecture >= 48) {
  assert.ok(app.includes(directSettingsDelegation), 'Settings route must delegate directly after the M40 precommit capability resolver selects Settings ownership');
  assert.ok(app.includes('resolveBackendCapabilityPresentation') && app.includes('backendCapabilityRequirement(route)'), 'Settings route must preserve the M38 backend-capability gate through the M40 precommit resolver');
  assert.equal(app.includes(gatedSettingsDelegation), false, 'Settings route must not re-check capability after ownership is chosen at Architecture 48+');
} else if (phaseFourArchitecture >= 46) {
  assert.ok(app.includes(gatedSettingsDelegation), 'Settings route must preserve React M13 presentation behind the M38 backend-capability gate');
  assert.equal(app.includes(directSettingsDelegation), false, 'Settings route must not bypass the M38 backend-capability gate at Architecture 46+');
} else {
  assert.ok(app.includes(directSettingsDelegation), 'Settings route is not delegated to React M13 presentation');
}
assert.ok(!app.includes('settingsFeature.handleAction(action)'), 'Retired Settings imperative action delegation remains active');
for (const legacy of ['let settingsBusy', 'let diagnostics', 'let compatibility', 'function renderSettings()', 'function ensureBackupFileInput()']) {
  assert.ok(!app.includes(legacy), `shell still owns legacy Settings implementation: ${legacy}`);
}
for (const token of ['getStorageHealth', 'requestPersistentStorage', 'runPlatformDiagnostics', 'verifyModuleCompatibility', 'downloadWorkspaceBackup', 'restoreWorkspaceBackup', "action === 'density'", "action === 'reset-platform'", 'refreshStorageHealth']) {
  assert.ok(managementRuntime.includes(token), `M13 Settings runtime missing ${token}`);
}
assert.ok(managementUi.includes('data-wm-management-view="settings"'), 'M13 Settings React view missing');

assert.ok(boardsUi.includes("import { renderBoardTableView } from './features/boards/views/table-view.ts';"), 'Board Table view is not extracted');
assert.ok(boardsUi.includes("import { renderBoardKanbanView } from './features/boards/views/kanban-view.ts';"), 'Board Kanban view is not extracted');
assert.ok(tableView.includes('export function renderBoardTableView') && tableView.includes('No custom columns yet.') && tableView.includes('data-inline-add-item'), 'Table presentation boundary incomplete');
assert.ok(kanbanView.includes('export function renderBoardKanbanView') && kanbanView.includes('data-drop-status'), 'Kanban presentation boundary incomplete');

const escaped = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const emptyTable = renderBoardTableView({
  state: { boardPrefs: {}, itemSearch: '', itemStatus: 'all' }, groups: [], items: [],
  visibleColumns: () => [], allColumns: () => [], canEdit: () => true,
  itemMatches: () => true, compareItems: () => 0, renderColumnHeader: () => '', renderItemRow: () => '', escapeHtml: escaped,
});
assert.ok(emptyTable.includes('No custom columns yet.') && emptyTable.includes('data-add-column'), 'extracted Table view does not preserve operable empty-schema state');
const kanbanSmoke = renderBoardKanbanView({
  state: { itemPanel: { itemId: null } },
  items: [{ id: 'i1', group_id: 'g1', status: 'not_started', title: 'Example', assignee_id: null, due_date: null }],
  groups: [{ id: 'g1', title: 'Main' }], itemMatches: () => true, canEdit: () => true,
  memberMap: () => new Map(), statusLabels: { not_started: 'Not started' }, escapeHtml: escaped, formatDay: () => '—',
});
assert.ok(kanbanSmoke.includes('data-drop-status="not_started"') && kanbanSmoke.includes('data-open-item="i1"'), 'extracted Kanban view does not preserve lane/card interactions');

assert.ok(boardsUi.includes("import { createBoardDialogController } from './features/boards/controllers/dialog-controller.ts';"), 'Board dialog controller is not wired');
assert.ok(dialogs.includes('data-modal-error') && dialogs.includes("event.key === 'Escape'") && dialogs.includes('closeAll'), 'Board dialog lifecycle/error handling incomplete');
assert.ok(boardsUi.includes("import { createColumnWorkflows } from './features/boards/controllers/column-workflows.ts';"), 'Column workflow controller is not wired');
for (const token of ['openFilter', 'openDuplicate', 'openPicker', 'openEditor', 'openChangeType', 'openManager', 'openDelete', 'openCell']) {
  assert.ok(workflows.includes(token), `Column workflow controller missing ${token}`);
}
assert.ok(!boardState.includes('addColumnPosition') && !boardState.includes('changeTypeColumn'), 'transient picker context still leaks into board view state');
const boardArchitecturePreservesPhaseFour =
  boardFeature.includes("architecture: 'stable-workspace-controller-state-service-views-workflow-and-interaction-controllers'") ||
  ([
    "architecture: 'react-route-facade-with-typed-compatibility-board-engine'",
    "architecture: 'react-route-facade-with-typed-rich-item-workspace-v1'",
  ].some((marker) => boardFeature.includes(marker)) &&
    boardFeature.includes("presentation: 'react-board-presentation-facade-v1'") &&
    boardFeature.includes("presentationEngine: 'assets/js/boards-ui.ts'") &&
    boardFeature.includes('createBoardsController') &&
    boardFeature.includes('createBoardCommandService'));
assert.ok(boardArchitecturePreservesPhaseFour, 'Boards feature metadata must preserve Phase Four controller/service/view/workflow guarantees or declare the M15 React facade over that compatibility engine');

assert.ok(itemWorkspaceController.includes('let epoch = 0;') && itemWorkspaceController.includes('ticket === epoch') && itemWorkspaceController.includes('state.itemPanel.itemId === itemId'), 'Item Workspace stale-response protection missing from extracted controller');
assert.ok(boardsUi.includes('let boardResizeCleanup: (() => void) | null = null;') && boardsUi.includes('boardResizeCleanup?.();'), 'Board resize-listener disposal boundary missing');
assert.ok(boardsUi.includes('dialogs.closeAll()') && boardsUi.includes('columnWorkflows.reset()'), 'Boards teardown does not clean workflow overlays');

for (const path of [
  './assets/js/features/boards/views/table-view.ts',
  './assets/js/features/boards/views/kanban-view.ts',
  './assets/js/features/boards/controllers/dialog-controller.ts',
  './assets/js/features/boards/controllers/column-workflows.ts',
]) assert.ok(assets.includes(path), `runtime cache manifest missing ${path}`);
if (phaseFourArchitecture >= 52) assert.equal(assets.includes('./assets/js/features/settings/index.ts'), false, 'M44 retired Settings controller must not remain in runtime cache');
else assert.ok(assets.includes('./assets/js/features/settings/index.ts'), 'runtime cache manifest missing historical Settings controller');

assert.ok(docs.includes('Architecture Phase Four') && docs.includes('Remaining safe targets'), 'Phase Four architecture documentation missing');
assert.ok(!fs.existsSync('supabase/migrations/v1.27.0-architecture.sql'), 'architecture-only release must not introduce a v1.25 database migration');

console.log('v1.27.0 architecture phase-four verification: PASS');
