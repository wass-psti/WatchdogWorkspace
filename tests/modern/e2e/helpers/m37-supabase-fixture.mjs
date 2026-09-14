const FIXTURE_ORIGIN = 'https://m37-fixture.supabase.co';
const ADMIN_ID = '00000000-0000-4000-8000-000000000037';
const OTHER_ID = '00000000-0000-4000-8000-000000000038';

const M38_TABLES = ['profiles','module_role_assignments','module_state_entries','module_activity_events','module_operation_locks','workspace_members','workspaces','work_boards','work_board_members','work_board_groups','work_board_columns','work_board_items','work_board_item_values','work_board_item_updates','work_board_item_files','work_board_events'];
const M38_RPCS = ['update_own_profile','list_user_directory','admin_set_user_access','claim_bootstrap_admin','list_module_directory','list_module_state','put_module_state','delete_module_state','list_module_activity','append_module_activity','acquire_module_operation_lock','release_module_operation_lock','commit_timetracker_attendance_action','commit_fueltrack_requests_with_activity','wm_board_backend_capabilities','wm_list_boards','wm_get_board','wm_create_board','wm_create_board_configured','wm_add_board_column','wm_add_board_column_at','wm_add_board_column_at','wm_duplicate_board','wm_update_board','wm_delete_board_permanently','wm_get_board_preferences','wm_set_board_preferences','wm_add_board_group','wm_update_board_group','wm_move_board_group','wm_delete_board_group','wm_set_board_group_accent','wm_update_board_column','wm_change_board_column_type','wm_move_board_column','wm_duplicate_board_column','wm_delete_board_column','wm_add_board_item','wm_update_board_item','wm_move_board_item','wm_duplicate_board_item','wm_delete_board_item','wm_set_board_item_archived','wm_set_board_cell','wm_set_board_status','wm_set_board_status_labels','wm_set_board_view','wm_add_board_member','wm_remove_board_member','wm_get_board_item_workspace','wm_add_board_item_update','wm_delete_board_item_update','wm_register_board_item_file','wm_delete_board_item_file','wm_list_board_events','wm_restore_workspace_backup_v4'];
const M38_REALTIME = ['private-channels','broadcast-receive-policy','presence-track-policy','board-topic-authorization','board-change-broadcast-triggers'];


export const fixtureIdentity = Object.freeze({
  origin: FIXTURE_ORIGIN,
  userId: ADMIN_ID,
  email: 'm37-admin@example.test',
});

export async function seedAuthenticatedSession(page) {
  await page.addInitScript(({ userId }) => {
    // Platform authentication belongs to the top-level Work Management document.
    // Playwright also runs page init scripts inside attached module iframes; never
    // let an embedded same-origin application rewrite the shared platform session.
    if (window.top !== window) return;
    localStorage.setItem('wm.platform.auth.session.v1', JSON.stringify({
      access_token: 'm37.fixture.access.token',
      refresh_token: 'm37-fixture-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
    }));
    localStorage.removeItem('wm.platform.identity.v1');
    sessionStorage.removeItem('wm.platform.auth.return-to.v1');
    sessionStorage.setItem('m37.fixture.user-id', userId);
  }, { userId: ADMIN_ID });
}

export async function waitForFixtureAuthentication(page, { timeout = 10_000 } = {}) {
  await page.waitForFunction(({ userId }) => {
    let runtimeContext = null;
    try { runtimeContext = globalThis.WorkManagementRuntime?.getContext?.() ?? null; } catch {}
    let identity = null;
    try {
      const raw = localStorage.getItem('wm.platform.identity.v1');
      identity = raw ? JSON.parse(raw) : null;
    } catch {}
    return runtimeContext?.authenticated === true
      && identity?.user?.id === userId
      && identity?.platformRole === 'admin_general_manager'
      && identity?.accountStatus === 'active';
  }, { userId: ADMIN_ID }, { timeout });

  return page.evaluate(() => {
    const raw = localStorage.getItem('wm.platform.identity.v1');
    const identity = raw ? JSON.parse(raw) : null;
    return {
      authenticated: Boolean(globalThis.WorkManagementRuntime?.getContext?.()?.authenticated),
      route: globalThis.WorkManagementRuntime?.getContext?.()?.route ?? null,
      userId: identity?.user?.id ?? null,
      platformRole: identity?.platformRole ?? null,
      accountStatus: identity?.accountStatus ?? null,
    };
  });
}

export async function navigateFixtureRoute(page, route, { timeout = 10_000 } = {}) {
  await page.evaluate((target) => { location.hash = `#/${target}`; }, route);
  await page.waitForFunction((target) => {
    let context = null;
    try { context = globalThis.WorkManagementRuntime?.getContext?.() ?? null; } catch {}
    return context?.authenticated === true && context?.route === target && location.hash === `#/${target}`;
  }, route, { timeout });
}

const json = (route, status, body) => route.fulfill({
  status,
  contentType: 'application/json; charset=utf-8',
  body: JSON.stringify(body),
  headers: { 'access-control-allow-origin': '*' },
});
const error = (route, status, code, message) => json(route, status, { code, message, hint: null, details: null });

export async function installSupabaseFixture(page, {
  boardRpcFailure = false,
  userDirectoryFailure = false,
  profileMutationFailure = false,
  healthFailure = false,
  runtimeCapabilityOverrides = null,
  runtimeCapabilityFailure = false,
} = {}) {
  await page.route(`${FIXTURE_ORIGIN}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    if (request.method() === 'OPTIONS') {
      return route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-headers': '*',
        },
      });
    }

    if (path === '/auth/v1/user' && request.method() === 'GET') {
      return json(route, 200, {
        id: ADMIN_ID,
        email: 'm37-admin@example.test',
        email_confirmed_at: '2026-09-11T00:00:00.000Z',
        user_metadata: { display_name: 'M37 Admin' },
      });
    }
    if (path === '/auth/v1/health') {
      if (healthFailure) return json(route, 503, { status: 'unavailable', milestone: 37 });
      return json(route, 200, { status: 'ok' });
    }
    if (path === '/rest/v1/profiles') {
      return json(route, 200, [{
        id: ADMIN_ID,
        email: 'm37-admin@example.test',
        display_name: 'M37 Admin',
        platform_role: 'admin_general_manager',
        status: 'active',
        created_at: '2026-09-11T00:00:00.000Z',
        updated_at: '2026-09-11T00:00:00.000Z',
      }]);
    }
    if (path === '/rest/v1/module_role_assignments') {
      return json(route, 200, [
        { module_id: 'time-tracker', role: 'System Admin', enabled: true, updated_at: '2026-09-11T00:00:00.000Z' },
        { module_id: 'fueltrack-plus', role: 'Admin', enabled: true, updated_at: '2026-09-11T00:00:00.000Z' },
        { module_id: 'tradelink', role: 'General Manager', enabled: true, updated_at: '2026-09-11T00:00:00.000Z' },
      ]);
    }
    if (path === '/rest/v1/rpc/wm_auth_access_context') {
      return json(route, 200, {
        schema_version: '1.43.2-m39-v1',
        user_id: ADMIN_ID,
        profile: {
          id: ADMIN_ID,
          email: 'm37-admin@example.test',
          display_name: 'M37 Admin',
          platform_role: 'admin_general_manager',
          status: 'active',
          created_at: '2026-09-11T00:00:00.000Z',
          updated_at: '2026-09-11T00:00:00.000Z',
        },
        assignments: [
          { user_id: ADMIN_ID, module_id: 'time-tracker', role: 'System Admin', enabled: true, updated_at: '2026-09-11T00:00:00.000Z' },
          { user_id: ADMIN_ID, module_id: 'fueltrack-plus', role: 'Admin', enabled: true, updated_at: '2026-09-11T00:00:00.000Z' },
          { user_id: ADMIN_ID, module_id: 'tradelink', role: 'General Manager', enabled: true, updated_at: '2026-09-11T00:00:00.000Z' },
        ],
        revision: 'm37-m39-compat-1',
      });
    }
    if (path === '/rest/v1/rpc/wm_runtime_capabilities') {
      if (runtimeCapabilityFailure) return error(route, 404, 'PGRST202', 'Could not find the function public.wm_runtime_capabilities in the schema cache');
      const base = { schema_version:'1.43.2-m38-v2', tables:M38_TABLES, rpcs:M38_RPCS, storage:['work-board-files'], realtime:M38_REALTIME, missing_tables:[], missing_rpcs:[], missing_storage:[], missing_realtime:[] };
      return json(route, 200, runtimeCapabilityOverrides ? { ...base, ...runtimeCapabilityOverrides } : base);
    }
    if (path === '/rest/v1/rpc/list_user_directory') {
      if (userDirectoryFailure) return error(route, 404, 'PGRST202', 'Could not find the function public.list_user_directory in the schema cache');
      return json(route, 200, [
        { id: ADMIN_ID, email: 'm37-admin@example.test', display_name: 'M37 Admin', platform_role: 'admin_general_manager', status: 'active' },
        { id: OTHER_ID, email: 'm37-employee@example.test', display_name: 'M37 Employee', platform_role: 'employee', status: 'active' },
      ]);
    }
    if (path === '/rest/v1/rpc/admin_set_user_access') {
      return error(route, 404, 'PGRST202', 'Could not find the function public.admin_set_user_access in the schema cache');
    }
    if (path === '/rest/v1/rpc/update_own_profile') {
      if (profileMutationFailure) return error(route, 404, 'PGRST202', 'Could not find the function public.update_own_profile in the schema cache');
      return json(route, 200, [{
        id: ADMIN_ID,
        email: 'm37-admin@example.test',
        display_name: 'M37 Admin Updated',
        platform_role: 'admin_general_manager',
        status: 'active',
      }]);
    }
    if (path === '/auth/v1/logout') return json(route, 200, {});
    if (path === '/rest/v1/rpc/wm_list_boards') {
      if (boardRpcFailure) return error(route, 404, 'PGRST202', 'Could not find the function public.wm_list_boards in the schema cache');
      return json(route, 200, []);
    }
    if (path.startsWith('/rest/v1/rpc/wm_')) {
      return error(route, 404, 'PGRST202', `M37 fixture intentionally does not implement ${path.split('/').at(-1)}`);
    }
    return error(route, 404, 'M37_FIXTURE_UNHANDLED', `M37 fixture has no response for ${request.method()} ${path}`);
  });
}
