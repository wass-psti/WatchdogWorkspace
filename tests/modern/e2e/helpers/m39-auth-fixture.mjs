const FIXTURE_ORIGIN = 'https://m39-fixture.supabase.co';
const ADMIN_ID = '00000000-0000-4000-8000-000000000039';
const EMPLOYEE_ID = '00000000-0000-4000-8000-000000000139';

const M38_TABLES = ['profiles','module_role_assignments','module_state_entries','module_activity_events','module_operation_locks','workspace_members','workspaces','work_boards','work_board_members','work_board_groups','work_board_columns','work_board_items','work_board_item_values','work_board_item_updates','work_board_item_files','work_board_events'];
const M38_RPCS = ['update_own_profile','list_user_directory','admin_set_user_access','claim_bootstrap_admin','list_module_directory','list_module_state','put_module_state','delete_module_state','list_module_activity','append_module_activity','acquire_module_operation_lock','release_module_operation_lock','commit_timetracker_attendance_action','commit_fueltrack_requests_with_activity','wm_board_backend_capabilities','wm_list_boards','wm_get_board','wm_create_board','wm_create_board_configured','wm_add_board_column','wm_add_board_column_at','wm_duplicate_board','wm_update_board','wm_delete_board_permanently','wm_get_board_preferences','wm_set_board_preferences','wm_add_board_group','wm_update_board_group','wm_move_board_group','wm_delete_board_group','wm_set_board_group_accent','wm_update_board_column','wm_change_board_column_type','wm_move_board_column','wm_duplicate_board_column','wm_delete_board_column','wm_add_board_item','wm_update_board_item','wm_move_board_item','wm_duplicate_board_item','wm_delete_board_item','wm_set_board_item_archived','wm_set_board_cell','wm_set_board_status','wm_set_board_status_labels','wm_set_board_view','wm_add_board_member','wm_remove_board_member','wm_get_board_item_workspace','wm_add_board_item_update','wm_delete_board_item_update','wm_register_board_item_file','wm_delete_board_item_file','wm_list_board_events','wm_restore_workspace_backup_v4'];
const M38_REALTIME = ['private-channels','broadcast-receive-policy','presence-track-policy','board-topic-authorization','board-change-broadcast-triggers'];

const adminAssignments = (userId = ADMIN_ID) => [
  { user_id: userId, module_id: 'time-tracker', role: 'System Admin', enabled: true, updated_at: '2026-09-11T00:00:00.000Z' },
  { user_id: userId, module_id: 'fueltrack-plus', role: 'Admin', enabled: true, updated_at: '2026-09-11T00:00:00.000Z' },
  { user_id: userId, module_id: 'tradelink', role: 'General Manager', enabled: true, updated_at: '2026-09-11T00:00:00.000Z' },
];
const employeeAssignments = (userId = EMPLOYEE_ID) => [
  { user_id: userId, module_id: 'time-tracker', role: 'Employee', enabled: true, updated_at: '2026-09-11T00:00:00.000Z' },
  { user_id: userId, module_id: 'fueltrack-plus', role: 'User', enabled: false, updated_at: '2026-09-11T00:00:00.000Z' },
  { user_id: userId, module_id: 'tradelink', role: 'User', enabled: false, updated_at: '2026-09-11T00:00:00.000Z' },
];

export const M39_FIXTURE_ORIGIN = FIXTURE_ORIGIN;

export async function seedM39Session(page, { principal = 'admin', expired = false } = {}) {
  const userId = principal === 'employee' ? EMPLOYEE_ID : ADMIN_ID;
  await page.addInitScript(({ userId, expired }) => {
    // Playwright init scripts execute in every attached frame. Platform auth belongs
    // exclusively to the top-level Work Management document; a same-origin embedded
    // application must never reseed shared localStorage or it will trigger a parent
    // storage event and force an authenticated route back through the boot owner.
    if (window.top !== window) return;
    localStorage.setItem('wm.platform.auth.session.v1', JSON.stringify({
      access_token: expired ? 'm39-expired-access-token' : 'm39-active-access-token',
      refresh_token: 'm39-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: expired ? Date.now() - 5_000 : Date.now() + 3_600_000,
    }));
    localStorage.removeItem('wm.platform.identity.v1');
    sessionStorage.removeItem('wm.platform.auth.return-to.v1');
    sessionStorage.setItem('m39.fixture.user-id', userId);
  }, { userId, expired });
}

const json = (route, status, body) => route.fulfill({
  status,
  contentType: 'application/json; charset=utf-8',
  body: JSON.stringify(body),
  headers: { 'access-control-allow-origin': '*' },
});
const error = (route, status, code, message) => json(route, status, { code, message, hint: null, details: null });

export async function installM39Fixture(page, { principal = 'admin', expiredRefreshFailure = false, accessContextFailure = false, boardContractOverrides = null, boardContractFailure = false } = {}) {
  const state = {
    principal,
    role: principal === 'employee' ? 'employee' : 'admin_general_manager',
    status: 'active',
    assignments: principal === 'employee' ? employeeAssignments() : adminAssignments(),
    refreshCalls: 0,
    accessContextCalls: 0,
    accessContextFailure,
    expiredRefreshFailure,
    revision: 1,
    displayName: principal === 'employee' ? 'M39 Employee' : 'M39 Admin',
    profileUpdateCalls: 0,
    passwordUpdateCalls: 0,
    logoutCalls: [],
    profileUpdateFailure: false,
    passwordUpdateFailure: false,
    globalLogoutFailure: false,
    userDirectoryCalls: 0,
    userMutationCalls: 0,
    userDirectoryFailure: false,
    userMutationFailure: false,
    authHealthCalls: 0,
    authHealthFailure: false,
    backupRestoreCalls: 0,
    directory: [
      { id: ADMIN_ID, email:'m39-admin@example.test', display_name:'M39 Admin', platform_role:'admin_general_manager', status:'active', is_bootstrap_admin:false, is_self:principal !== 'employee', is_last_active_admin:false },
      { id:'00000000-0000-4000-8000-000000000239', email:'bootstrap@example.test', display_name:'Bootstrap Admin', platform_role:'admin_general_manager', status:'active', is_bootstrap_admin:true, is_self:false, is_last_active_admin:false },
      { id: EMPLOYEE_ID, email:'m39-employee@example.test', display_name:'M39 Employee', platform_role:'employee', status:'active', is_bootstrap_admin:false, is_self:principal === 'employee', is_last_active_admin:false },
    ],
  };
  const userId = () => state.principal === 'employee' ? EMPLOYEE_ID : ADMIN_ID;
  const email = () => state.principal === 'employee' ? 'm39-employee@example.test' : 'm39-admin@example.test';

  await page.route(`${FIXTURE_ORIGIN}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
    if (path === '/auth/v1/health') { state.authHealthCalls += 1; return state.authHealthFailure ? json(route, 503, { status:'unavailable', milestone:43 }) : json(route, 200, { status: 'ok' }); }
    if (path === '/auth/v1/token' && url.searchParams.get('grant_type') === 'refresh_token') {
      state.refreshCalls += 1;
      if (state.expiredRefreshFailure) return error(route, 400, 'invalid_grant', 'Invalid Refresh Token: Refresh Token Not Found');
      return json(route, 200, {
        access_token: `m39-refreshed-access-token-${state.refreshCalls}`,
        refresh_token: `m39-rotated-refresh-token-${state.refreshCalls}`,
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      });
    }
    if (path === '/auth/v1/user' && request.method() === 'GET') return json(route, 200, { id: userId(), email: email(), email_confirmed_at: '2026-09-11T00:00:00.000Z', user_metadata: { display_name: state.displayName } });
    if (path === '/rest/v1/rpc/wm_auth_access_context') {
      state.accessContextCalls += 1;
      if (state.accessContextFailure) return error(route, 503, 'M39_FIXTURE_TEMPORARY', 'Temporary access context failure');
      return json(route, 200, {
        schema_version: '1.43.2-m39-v1',
        user_id: userId(),
        profile: { id: userId(), email: email(), display_name: state.displayName, platform_role: state.role, status: state.status, created_at: '2026-09-11T00:00:00.000Z', updated_at: `2026-09-11T00:00:${String(state.revision).padStart(2,'0')}.000Z` },
        assignments: state.assignments,
        revision: `m39-revision-${state.revision}`,
      });
    }
    if (path === '/rest/v1/rpc/update_own_profile' && request.method() === 'POST') {
      state.profileUpdateCalls += 1;
      if (state.profileUpdateFailure) return error(route, 503, 'M41_PROFILE_TEMPORARY', 'Temporary profile update failure');
      const body = request.postDataJSON?.() || {};
      const nextName = String(body.p_display_name || '').trim().replace(/\s+/g, ' ');
      if (nextName.length < 2) return error(route, 400, 'M41_PROFILE_INVALID', 'Display name must contain at least 2 characters.');
      state.displayName = nextName;
      state.revision += 1;
      return json(route, 200, [{ id:userId(), email:email(), display_name:state.displayName, platform_role:state.role, status:state.status, updated_at:new Date().toISOString() }]);
    }
    if (path === '/auth/v1/user' && request.method() === 'PUT') {
      state.passwordUpdateCalls += 1;
      if (state.passwordUpdateFailure) return error(route, 422, 'M41_PASSWORD_REJECTED', 'Password update rejected');
      const body = request.postDataJSON?.() || {};
      if (String(body.password || '').length < 10) return error(route, 422, 'M41_PASSWORD_WEAK', 'Password is too short');
      return json(route, 200, { id:userId(), email:email(), email_confirmed_at:'2026-09-11T00:00:00.000Z', user_metadata:{ display_name:state.displayName } });
    }
    if (path === '/rest/v1/rpc/wm_runtime_capabilities') return json(route, 200, { schema_version:'1.43.2-m38-v2', tables:M38_TABLES, rpcs:M38_RPCS, storage:['work-board-files'], realtime:M38_REALTIME, missing_tables:[], missing_rpcs:[], missing_storage:[], missing_realtime:[] });
    if (path === '/rest/v1/rpc/wm_board_contract_attestation') {
      if (boardContractFailure) return error(route, 404, 'PGRST202', 'Could not find the function public.wm_board_contract_attestation in the schema cache');
      const base = { contract_version:'1.43.2-m46-v1', contract_digest:'2e5db3073f702cad96be3eb1d4a18b33ea039252ad4d0532dc9b6e1b3ca0da1c', compatible:true, rpc_count:40, expected_rpc_count:40, table_count:9, expected_table_count:9, rls_table_count:9, board_table_policy_count:0, board_table_policy_table_count:9, direct_privilege_violations:0, storage_ok:true, storage_policy_count:3, realtime_function_count:2, realtime_policy_count:2, realtime_trigger_count:8, capabilities_ok:true };
      return json(route, 200, boardContractOverrides ? { ...base, ...boardContractOverrides } : base);
    }
    if (path === '/rest/v1/rpc/list_user_directory') {
      state.userDirectoryCalls += 1;
      if (state.principal !== 'admin' || state.role !== 'admin_general_manager' || state.status !== 'active') return error(route, 403, 'M42_ADMIN_REQUIRED', 'Administrator access required');
      if (state.userDirectoryFailure) return error(route, 503, 'M42_DIRECTORY_TEMPORARY', 'Temporary user directory failure');
      const activeAdmins = state.directory.filter((entry) => entry.platform_role === 'admin_general_manager' && entry.status === 'active').length;
      return json(route, 200, state.directory.map((entry) => ({ ...entry, is_self:entry.id === userId(), is_last_active_admin:entry.platform_role === 'admin_general_manager' && entry.status === 'active' && activeAdmins <= 1 })));
    }
    if (path === '/rest/v1/rpc/admin_set_user_access' && request.method() === 'POST') {
      state.userMutationCalls += 1;
      if (state.principal !== 'admin' || state.role !== 'admin_general_manager' || state.status !== 'active') return error(route, 403, 'M42_ADMIN_REQUIRED', 'Administrator access required');
      if (state.userMutationFailure) return error(route, 503, 'M42_MUTATION_TEMPORARY', 'Temporary user mutation failure');
      const body = request.postDataJSON?.() || {};
      const target = state.directory.find((entry) => entry.id === body.p_user_id);
      if (!target) return error(route, 404, 'M42_USER_MISSING', 'User account not found');
      const nextRole = String(body.p_platform_role || '');
      const nextStatus = String(body.p_status || '');
      if (target.is_bootstrap_admin && (nextRole !== 'admin_general_manager' || nextStatus !== 'active')) return error(route, 400, 'M42_BOOTSTRAP_PROTECTED', 'The bootstrap administrator cannot be demoted or disabled');
      if (target.id === userId() && nextStatus === 'disabled') return error(route, 400, 'M42_SELF_DISABLE', 'You cannot disable your own active administrator account');
      const activeAdmins = state.directory.filter((entry) => entry.platform_role === 'admin_general_manager' && entry.status === 'active').length;
      if (target.platform_role === 'admin_general_manager' && target.status === 'active' && (nextRole !== 'admin_general_manager' || nextStatus !== 'active') && activeAdmins <= 1) return error(route, 400, 'M42_LAST_ADMIN', 'At least one active Admin/General Manager is required');
      target.platform_role = nextRole; target.status = nextStatus;
      if (target.id === userId()) {
        state.role = nextRole; state.status = nextStatus;
        state.assignments = nextRole === 'admin_general_manager' ? adminAssignments(userId()) : employeeAssignments(userId());
        state.revision += 1;
      }
      return json(route, 200, [{ ...target }]);
    }
    if (path === '/rest/v1/rpc/wm_restore_workspace_backup_v4' && request.method() === 'POST') {
      state.backupRestoreCalls += 1;
      const body = request.postDataJSON?.() || {};
      const boards = Array.isArray(body.p_boards) ? body.p_boards.length : 0;
      return json(route, 200, { verified:true, restored:0, boards });
    }
    if (path === '/rest/v1/rpc/wm_list_boards') return json(route, 200, []);
    if (path === '/auth/v1/logout') {
      const scope = url.searchParams.get('scope') || 'global';
      state.logoutCalls.push(scope);
      if (scope === 'global' && state.globalLogoutFailure) return error(route, 503, 'M41_LOGOUT_TEMPORARY', 'Temporary global logout failure');
      return json(route, 200, {});
    }
    if (path.startsWith('/rest/v1/rpc/')) return json(route, 200, []);
    return error(route, 404, 'M39_FIXTURE_UNHANDLED', `M39 fixture has no response for ${request.method()} ${path}`);
  });

  return Object.freeze({
    get refreshCalls() { return state.refreshCalls; },
    get accessContextCalls() { return state.accessContextCalls; },
    get profileUpdateCalls() { return state.profileUpdateCalls; },
    get passwordUpdateCalls() { return state.passwordUpdateCalls; },
    get logoutCalls() { return [...state.logoutCalls]; },
    get displayName() { return state.displayName; },
    get userDirectoryCalls() { return state.userDirectoryCalls; },
    get userMutationCalls() { return state.userMutationCalls; },
    get authHealthCalls() { return state.authHealthCalls; },
    get backupRestoreCalls() { return state.backupRestoreCalls; },
    get accessRole() { return state.role; },
    get accessStatus() { return state.status; },
    get accessRevision() { return state.revision; },
    get accessAssignments() { return state.assignments.map((entry) => ({ ...entry })); },
    updateAccess({ role = state.role, status = state.status, assignments = state.assignments } = {}) {
      state.role = role;
      state.status = status;
      state.assignments = assignments.map((entry) => ({ ...entry, user_id: userId() }));
      state.revision += 1;
    },
    setAccessContextFailure(value) { state.accessContextFailure = Boolean(value); },
    setProfileUpdateFailure(value) { state.profileUpdateFailure = Boolean(value); },
    setPasswordUpdateFailure(value) { state.passwordUpdateFailure = Boolean(value); },
    setGlobalLogoutFailure(value) { state.globalLogoutFailure = Boolean(value); },
    setUserDirectoryFailure(value) { state.userDirectoryFailure = Boolean(value); },
    setUserMutationFailure(value) { state.userMutationFailure = Boolean(value); },
    setAuthHealthFailure(value) { state.authHealthFailure = Boolean(value); },
    setDirectory(entries) { state.directory = entries.map((entry) => ({ ...entry })); },
  });
}

const m39BoundaryDelay = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});
const isM39DocumentReplacementError = (error) => /execution context was destroyed|most likely because of a navigation|cannot find context with specified id|frame was detached/i.test(String(error instanceof Error ? error.message : error));

/**
 * Retry a browser-runtime boundary probe without separating readiness from value
 * consumption. GitHub-hosted Vite/Playwright can replace the main document while
 * the application is still completing its boot owner transition. A readiness check
 * in one evaluation followed by a second evaluation is therefore a TOCTOU race.
 *
 * Every successful probe below obtains and validates the authoritative value inside
 * one page evaluation, while an execution-context replacement is treated as a
 * transient boundary miss and retried against the new main document.
 */
export async function retryM39RuntimeBoundary(attempt, { timeout = 12_000, pollMs = 25, label = 'M39 runtime boundary' } = {}) {
  const deadline = Date.now() + Math.max(1, Number(timeout) || 12_000);
  let last = null;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      last = await attempt();
      if (last?.ready === true) return last;
    } catch (error) {
      if (!isM39DocumentReplacementError(error)) throw error;
      lastError = error;
    }
    await m39BoundaryDelay(Math.max(0, Number(pollMs) || 0));
  }
  const detail = lastError instanceof Error ? lastError.message : last?.reason || 'runtime did not become ready';
  throw new Error(`${label} did not become ready within ${timeout}ms: ${detail}`);
}

export async function waitForM39Identity(page, { role, status = 'active', timeout = 12_000 } = {}) {
  const result = await retryM39RuntimeBoundary(() => page.evaluate(async ({ role, status }) => {
    const runtime = globalThis.WorkManagementRuntime;
    if (!runtime || typeof runtime.get !== 'function' || typeof runtime.execute !== 'function') {
      return { ready:false, reason:'runtime-api-unavailable' };
    }
    try {
      const raw = localStorage.getItem('wm.platform.identity.v1');
      const identity = raw ? JSON.parse(raw) : null;
      const snapshot = await runtime.get('identity.current');
      if (globalThis.WorkManagementRuntime !== runtime) return { ready:false, reason:'runtime-replaced-during-identity-read' };
      const ready = snapshot?.isAuthenticated === true
        && (!role || identity?.platformRole === role)
        && identity?.accountStatus === status
        && (!role || snapshot?.profile?.platform_role === role)
        && snapshot?.profile?.status === status;
      return { ready, reason:ready ? '' : 'identity-not-hydrated', snapshot };
    } catch (error) {
      return { ready:false, reason:error instanceof Error ? error.message : String(error) };
    }
  }, { role, status }), { timeout, label:'M39 identity/runtime boundary' });
  return result.snapshot;
}

export async function waitForM39BackendPreflight(page, moduleName, { timeout = 12_000 } = {}) {
  const result = await retryM39RuntimeBoundary(() => page.evaluate(async (moduleName) => {
    const runtime = globalThis.WorkManagementRuntime;
    if (!runtime || typeof runtime.get !== 'function') return { ready:false, reason:'runtime-get-unavailable' };
    try {
      const snapshot = await runtime.get('backend-preflight.current');
      if (globalThis.WorkManagementRuntime !== runtime) return { ready:false, reason:'runtime-replaced-during-preflight-read' };
      const ready = snapshot?.state === 'ready' && snapshot?.modules?.[moduleName]?.ready === true;
      return { ready, reason:ready ? '' : 'backend-preflight-not-ready', snapshot };
    } catch (error) {
      return { ready:false, reason:error instanceof Error ? error.message : String(error) };
    }
  }, moduleName), { timeout, label:`M39 backend preflight/runtime boundary (${moduleName})` });
  return result.snapshot;
}

export async function executeM39Runtime(page, operation, params = undefined, { timeout = 12_000 } = {}) {
  if (operation !== 'identity.revalidate') throw new Error(`M39 retryable runtime execution is restricted to idempotent identity.revalidate, received ${operation}.`);
  const result = await retryM39RuntimeBoundary(() => page.evaluate(async ({ operation, params }) => {
    const runtime = globalThis.WorkManagementRuntime;
    if (!runtime || typeof runtime.execute !== 'function') return { ready:false, reason:'runtime-execute-unavailable' };
    // identity.revalidate is an idempotent authoritative read/reconciliation command.
    // Execute it in the same evaluation that proves the runtime authority exists so
    // a boot-time document replacement cannot invalidate a prior readiness result.
    // Operation errors are intentionally not converted into readiness misses: only
    // document-replacement errors are retryable at the outer boundary.
    const value = await runtime.execute(operation, params);
    if (globalThis.WorkManagementRuntime !== runtime) return { ready:false, reason:'runtime-replaced-during-operation' };
    return { ready:true, value };
  }, { operation, params }), { timeout, label:`M39 runtime operation boundary (${operation})` });
  return result.value;
}

const M40_DIAGNOSTICS_KEY = 'wm.m40.composition-diagnostics.v1';

export async function installM40CompositionDiagnostics(page) {
  const nodeEvents = [];
  const pushNode = (type, detail = '') => {
    nodeEvents.push({ at: Date.now(), type, detail:String(detail || '') });
    if (nodeEvents.length > 80) nodeEvents.splice(0, nodeEvents.length - 80);
  };
  page.on('pageerror', (error) => pushNode('pageerror', error?.stack || error?.message || error));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') pushNode(`console:${message.type()}`, message.text());
  });
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) pushNode('main-frame-navigated', frame.url());
  });
  page.on('close', () => pushNode('page-closed'));
  await page.addInitScript(({ key }) => {
    if (window.top !== window) return;
    const readPersisted = () => {
      try { const raw=sessionStorage.getItem(key); return raw ? JSON.parse(raw) : { generation:0, events:[] }; }
      catch { return { generation:0, events:[] }; }
    };
    const previous = readPersisted();
    const generation = Number(previous.generation || 0) + 1;
    const events = Array.isArray(previous.events) ? previous.events.slice(-100) : [];
    const persist = () => { try { sessionStorage.setItem(key, JSON.stringify({ generation, events:events.slice(-100) })); } catch {} };
    const record = (type, detail = '') => { events.push({ at:Date.now(), generation, type, detail:String(detail || '') }); persist(); };
    globalThis.__wmM40Diagnostics = { generation, events, record };
    record('document-init', location.href);
    addEventListener('pageshow', (event) => record('pageshow', event.persisted ? 'persisted' : 'fresh'));
    addEventListener('pagehide', (event) => record('pagehide', event.persisted ? 'persisted' : 'unload'));
    addEventListener('beforeunload', () => record('beforeunload', location.href));
    addEventListener('unload', () => record('unload', location.href));
    addEventListener('hashchange', () => record('hashchange', location.hash));
    addEventListener('error', (event) => record('window-error', event.error?.stack || event.message || 'unknown'));
    addEventListener('unhandledrejection', (event) => record('unhandledrejection', event.reason?.stack || event.reason?.message || String(event.reason)));
    const installObserver = () => {
      const app = document.querySelector('#app');
      if (!app) return record('app-missing');
      let hadRoot = Boolean(app.querySelector('[data-wm-react-shell-root]'));
      record('app-observer-installed', hadRoot ? 'root-present' : 'root-absent');
      new MutationObserver(() => {
        const hasRoot = Boolean(app.querySelector('[data-wm-react-shell-root]'));
        if (hasRoot !== hadRoot) {
          record(hasRoot ? 'react-shell-added' : 'react-shell-removed', location.hash || '#/');
          hadRoot = hasRoot;
        }
      }).observe(app, { childList:true, subtree:true });
    };
    if (document.readyState === 'loading') addEventListener('DOMContentLoaded', installObserver, { once:true });
    else installObserver();
  }, { key:M40_DIAGNOSTICS_KEY });
  return Object.freeze({
    async read() {
      const browser = await page.evaluate((key) => {
        try { return JSON.parse(sessionStorage.getItem(key) || '{"generation":0,"events":[]}'); }
        catch { return { generation:0, events:[] }; }
      }, M40_DIAGNOSTICS_KEY).catch(() => ({ generation:-1, events:[] }));
      return { browser, node:[...nodeEvents] };
    },
  });
}

export async function waitForM40ApplicationReady(page, { timeout = 12_000, stableMs = 350 } = {}) {
  const deadline = Date.now() + timeout;
  let stableSince = 0;
  let stableDocument = null;
  let last = null;
  while (Date.now() < deadline) {
    try {
      last = await page.evaluate(async () => {
        const runtime = globalThis.WorkManagementRuntime;
        const context = runtime?.getContext?.() ?? null;
        const lifecycle = await runtime?.get?.('route-lifecycle.current') ?? null;
        return {
          ready: Boolean(runtime)
            && context?.authenticated === true
            && lifecycle?.phase === 'committed'
            && document.querySelectorAll('[data-wm-react-shell-root]').length === 1
            && document.querySelectorAll('[data-wm-runtime-host]').length === 1
            && document.querySelectorAll('[data-wm-board-presentation-host]').length === 1
            && document.querySelectorAll('[data-wm-global-overlay-host]').length === 1,
          documentId: `${performance.timeOrigin}:${globalThis.__wmM40Diagnostics?.generation ?? 0}`,
          context,
          lifecycle,
        };
      });
      if (last.ready) {
        if (stableDocument !== last.documentId) { stableDocument = last.documentId; stableSince = Date.now(); }
        if (Date.now() - stableSince >= stableMs) return last;
      } else {
        stableDocument = null;
        stableSince = 0;
      }
    } catch {
      stableDocument = null;
      stableSince = 0;
    }
    await page.waitForTimeout(50);
  }
  throw new Error(`M40 application shell did not remain stable for ${stableMs}ms. Last state: ${JSON.stringify(last)}`);
}
