import fs from 'node:fs';
import assert from 'node:assert/strict';
import { applicationManifest, validateApplicationManifest } from './config/application-manifest.ts';
import { createFeatureRegistry } from './assets/js/runtime/feature-registry.ts';
import { renderBoardListState } from './assets/js/features/boards/views/board-list-view.ts';
import { renderItemWorkspace } from './assets/js/features/boards/views/item-workspace-view.ts';

const read = (path) => fs.readFileSync(path, 'utf8');
const app = read('assets/js/app.ts');
const runtime = read('assets/js/runtime/index.ts');
const managementUi = read('src/app/management/AuthenticatedManagementUI.tsx');
const managementRuntime = read('src/app/management/authenticated-management-ui-runtime.ts');
const authFacade = read('assets/js/features/auth/index.ts');
const boardUi = read('assets/js/boards-ui.ts');
const boardList = read('assets/js/features/boards/views/board-list-view.ts');
const itemWorkspace = read('assets/js/features/boards/views/item-workspace-view.ts');
const cache = read('config/runtime-assets.js');
const platform = read('assets/js/core/platform.ts');
const sw = read('service-worker.js');
const checklist = read('docs/architecture/RESTRUCTURE-CHECKLIST.md');

assert.ok(platform.includes("PLATFORM_VERSION = '1.43.2'"), 'platform version mismatch');
assert.ok(sw.includes('work-management-v1.43.2'), 'service-worker cache mismatch');
assert.ok(applicationManifest.architectureVersion >= 4, 'architecture version must preserve the phase-three boundary');
assert.equal(validateApplicationManifest(applicationManifest).valid, true, 'application manifest must validate');
if (applicationManifest.architectureVersion >= 52) {
  for (const routeId of ['account', 'settings', 'users']) assert.equal(applicationManifest.routes.find((route) => route.id === routeId)?.owner, 'management', `${routeId} route must use the consolidated M44 management owner`);
  assert.ok(applicationManifest.features.some((feature) => feature.id === 'management' && feature.boundary === 'src/app/management/AuthenticatedManagementUI.tsx'), 'M44 consolidated management React feature declaration missing');
} else {
  assert.equal(applicationManifest.routes.find((route) => route.id === 'account')?.owner, 'account', 'Account route must have its own feature owner');
  assert.equal(applicationManifest.routes.find((route) => route.id === 'users')?.owner, 'user-management', 'Users route ownership mismatch');
  assert.ok(applicationManifest.features.some((feature) => feature.id === 'account' && feature.boundary === 'src/app/management/AuthenticatedManagementUI.tsx'), 'Account React feature declaration missing');
  assert.ok(applicationManifest.features.some((feature) => feature.id === 'user-management' && feature.boundary === 'src/app/management/AuthenticatedManagementUI.tsx'), 'User Management React feature declaration missing');
}

assert.ok(runtime.includes('authenticatedManagementUiRuntime'), 'runtime gateway missing M13 authenticated management authority');
if (applicationManifest.architectureVersion >= 52) {
  assert.ok(app.includes("featureRegistry.register('management', authenticatedManagementUiRuntime"), 'M44 consolidated management runtime registration missing');
} else {
  assert.ok(app.includes("featureRegistry.register('account', authenticatedManagementUiRuntime"), 'Account M13 runtime registration missing');
  assert.ok(app.includes("featureRegistry.register('user-management', authenticatedManagementUiRuntime"), 'User Management M13 runtime registration missing');
}
for (const route of ['account', 'users']) {
  const directDelegation = `${route}: () => showAuthenticatedManagement('${route}')`;
  const gatedDelegation = `${route}: () => gateBackendCapability('${route}', '${route}', () => showAuthenticatedManagement('${route}'))`;
  if (applicationManifest.architectureVersion >= 48) {
    assert.ok(app.includes(directDelegation), `${route} route must delegate directly after the M40 precommit capability resolver selects M13 ownership`);
    assert.ok(app.includes('resolveBackendCapabilityPresentation') && app.includes('backendCapabilityRequirement(route)'), `${route} route must preserve the M38 backend-capability gate through the M40 precommit resolver`);
    assert.equal(app.includes(gatedDelegation), false, `${route} route must not re-check capability after ownership is chosen at Architecture 48+`);
  } else if (applicationManifest.architectureVersion >= 46) {
    assert.ok(app.includes(gatedDelegation), `${route} route must preserve React M13 presentation behind the M38 backend-capability gate`);
    assert.equal(app.includes(directDelegation), false, `${route} route must not bypass the M38 backend-capability gate at Architecture 46+`);
  } else {
    assert.ok(app.includes(directDelegation), `${route} route is not delegated to React M13 presentation`);
  }
}
assert.ok(!app.includes('accountFeature.handleAction') && !app.includes('userManagementFeature.handleSubmit'), 'Retired imperative management delegates remain active');
for (const removed of ['let accountBusy', 'let userDirectory =', 'function renderAccount()', 'function renderUsers()', 'async function loadUserDirectory']) {
  assert.equal(app.includes(removed), false, `shell still owns extracted state/logic: ${removed}`);
}

assert.ok(managementRuntime.includes('show(view:') && managementRuntime.includes('hide():') && managementRuntime.includes('epoch += 1'), 'M13 management runtime must preserve route lifecycle invalidation formerly owned by Account/User Management controllers');
if (applicationManifest.architectureVersion >= 49) {
  const accountService = read('assets/js/features/account/account-service.ts');
  assert.ok(managementRuntime.includes('createAccountService(auth)') && accountService.includes('auth.updateProfile') && accountService.includes('auth.updatePassword'), 'M13/M41 Account mutations missing');
  assert.ok(managementRuntime.includes("async signOut(scope: 'local' | 'global')") && accountService.includes('auth.signOut({ scope })'), 'M13/M41 Account session termination behavior missing');
  assert.ok(accountService.includes('revalidateAccessContext({ force: true, maxAgeMs: 5_000 })'), 'M41 Account access refresh must use M39 session/access revalidation authority');
} else {
  assert.ok(managementRuntime.includes('auth.updateProfile') && managementRuntime.includes('auth.updatePassword'), 'M13 Account mutations missing');
  assert.ok(managementRuntime.includes("async signOut(scope: 'local' | 'global')") && managementRuntime.includes('auth.signOut({ scope })'), 'M13 Account session termination behavior missing');
  assert.ok(managementRuntime.includes('auth.reloadAccessContext'), 'M13 Account access refresh missing');
}
assert.ok(managementUi.includes('auth.listUsers()') && managementRuntime.includes('auth.updateUserAccess'), 'M13 User directory service integration missing');
assert.ok(managementUi.includes('useQuery({'), 'M13 User directory loading/stale-response ownership must remain delegated to TanStack Query');
if (applicationManifest.architectureVersion >= 50) {
  assert.ok(
    managementUi.includes('queryClient.setQueryData(USER_DIRECTORY_QUERY_KEY')
      && managementUi.includes('const refreshed = await directory.refetch()')
      && managementUi.includes('if (!auth.canManageUsers)'),
    'M13/M42 User directory mutation cache ownership must update TanStack Query immediately, reconcile from the server, and avoid unauthorized refetch after self-demotion',
  );
} else {
  assert.ok(managementUi.includes('queryClient.invalidateQueries'), 'M13 User directory stale-response/cache ownership must be delegated to TanStack Query');
}
assert.ok(managementUi.includes("const [filter, setFilter] = useState('')") && managementUi.includes('onChange={(event) => setFilter(event.currentTarget.value)}'), 'M13 User directory search controller missing');
assert.ok(authFacade.includes("owns: Object.freeze(['login', 'register', 'verify'])"), 'Auth facade still claims Account/User Management routes');

assert.ok(boardUi.includes("from './features/boards/views/board-list-view.ts'"), 'Board List view extraction not wired');
assert.ok(boardUi.includes("from './features/boards/views/item-workspace-view.ts'"), 'Item Workspace view extraction not wired');
assert.ok(boardUi.includes('renderBoardListState({ state'), 'Board List view delegation missing');
assert.ok(boardUi.includes('renderItemWorkspace({ state'), 'Item Workspace delegation missing');
assert.ok(boardList.includes('renderBoardCard') && boardList.includes('renderBoardToolbar'), 'Board List view surface incomplete');
assert.ok(itemWorkspace.includes("tabButton('updates'") && itemWorkspace.includes("tabButton('files'") && itemWorkspace.includes("tabButton('activity'") && itemWorkspace.includes('data-item-file-input'), 'Item Workspace view surface incomplete');

for (const asset of [
  'assets/js/features/boards/views/board-list-view.ts',
  'assets/js/features/boards/views/item-workspace-view.ts',
]) assert.ok(cache.includes(asset), `cache manifest missing ${asset}`);
if (applicationManifest.architectureVersion >= 52) {
  for (const retired of ['assets/js/features/account/index.ts','assets/js/features/settings/index.ts','assets/js/features/user-management/index.ts']) assert.equal(cache.includes(retired), false, `M44 retired management controller must not remain in runtime cache: ${retired}`);
}

// Pure Board List rendering remains independently testable without a DOM.
const listMarkup = renderBoardListState({
  state: { loading: false, error: '', search: '', status: 'active', boards: [{ id: 'b1', name: 'Delivery', description: 'Ops', member_role: 'owner', item_count: 2, status: 'active', updated_at: '2026-08-27T00:00:00Z' }] },
  escapeHtml: (value) => String(value),
  formatDate: () => 'today',
});
assert.ok(listMarkup.includes('data-board-id="b1"') && listMarkup.includes('data-status="archived"'), 'Board List pure renderer lost card/action behavior');

const workspaceMarkup = renderItemWorkspace({
  state: {
    board: { columns: [], groups: [{ id: 'g1', title: 'Main' }], items: [{ id: 'i1', group_id: 'g1', title: 'Task', status: 'working', due_date: '2026-08-28', archived_at: null }] },
    itemPanel: { itemId: 'i1', tab: 'updates', loading: false, error: '', uploading: false, data: { updates: [], files: [], activity: [] } },
  },
  canEdit: () => true,
  escapeHtml: (value) => String(value ?? ''),
  formatDate: () => 'now',
  formatDay: () => 'Aug 28, 2026',
});
assert.ok(workspaceMarkup.includes('data-item-update-form') && workspaceMarkup.includes('data-item-panel-tab="files"'), 'Item Workspace pure renderer lost collaboration tabs');

// Manifest validator must catch route/feature ownership drift.
const invalid = {
  ...applicationManifest,
  routes: [...applicationManifest.routes, { id: 'broken-route', pattern: '#/broken', owner: 'missing-feature' }],
};
assert.equal(validateApplicationManifest(invalid).valid, false, 'manifest validator must reject undeclared route owners');

const registry = createFeatureRegistry(applicationManifest);
for (const feature of applicationManifest.features) registry.register(feature.id, {});
assert.equal(registry.validate().valid, true, 'runtime feature inventory must remain complete');
assert.equal(registry.ownerForRoute('account'), applicationManifest.architectureVersion >= 52 ? 'management' : 'account');
assert.equal(registry.ownerForRoute('users'), applicationManifest.architectureVersion >= 52 ? 'management' : 'user-management');

assert.ok(checklist.includes('[x] Extract account/user-management controllers from the shell.'), 'restructure checklist not updated');
assert.ok(fs.existsSync('docs/architecture/PHASE-3.md'), 'phase-three architecture documentation missing');
assert.equal(fs.existsSync('supabase/migrations/v1.27.0-architecture.sql'), false, 'architecture-only release must not invent a database migration');

console.log('v1.27.0 architecture phase-three verification: PASS');
