import { M39_FIXTURE_ORIGIN, installM39Fixture, seedM39Session, waitForM39Identity } from './m39-auth-fixture.mjs';

export const M52_ROLE_MATRIX = Object.freeze({
  admin_general_manager: Object.freeze({
    label: 'Admin/General Manager',
    assignments: Object.freeze([
      { module_id: 'time-tracker', role: 'System Admin', enabled: true },
      { module_id: 'fueltrack-plus', role: 'Admin', enabled: true },
      { module_id: 'tradelink', role: 'General Manager', enabled: true },
    ]),
    users: true,
  }),
  hr: Object.freeze({
    label: 'HR',
    assignments: Object.freeze([
      { module_id: 'time-tracker', role: 'HR', enabled: true },
      { module_id: 'fueltrack-plus', role: 'User', enabled: true },
      { module_id: 'tradelink', role: 'User', enabled: true },
    ]),
    users: false,
  }),
  supervisor: Object.freeze({
    label: 'Supervisor',
    assignments: Object.freeze([
      { module_id: 'time-tracker', role: 'Supervisor', enabled: true },
      { module_id: 'fueltrack-plus', role: 'User', enabled: true },
      { module_id: 'tradelink', role: 'Sales Supervisor', enabled: true },
    ]),
    users: false,
  }),
  employee: Object.freeze({
    label: 'Employee',
    assignments: Object.freeze([
      { module_id: 'time-tracker', role: 'Employee', enabled: true },
      { module_id: 'fueltrack-plus', role: 'User', enabled: true },
      { module_id: 'tradelink', role: 'User', enabled: true },
    ]),
    users: false,
  }),
});

const CAPABILITY_TABLES = ['profiles','module_role_assignments','module_state_entries','module_activity_events','module_operation_locks','workspace_members','workspaces','work_boards','work_board_members','work_board_groups','work_board_columns','work_board_items','work_board_item_values','work_board_item_updates','work_board_item_files','work_board_events'];
const CAPABILITY_RPCS = ['update_own_profile','list_user_directory','admin_set_user_access','claim_bootstrap_admin','list_module_directory','list_module_state','put_module_state','delete_module_state','list_module_activity','append_module_activity','acquire_module_operation_lock','release_module_operation_lock','commit_timetracker_attendance_action','commit_fueltrack_requests_with_activity','wm_board_backend_capabilities','wm_list_boards','wm_get_board','wm_create_board','wm_create_board_configured','wm_add_board_column','wm_add_board_column_at','wm_duplicate_board','wm_update_board','wm_delete_board_permanently','wm_get_board_preferences','wm_set_board_preferences','wm_add_board_group','wm_update_board_group','wm_move_board_group','wm_delete_board_group','wm_set_board_group_accent','wm_update_board_column','wm_change_board_column_type','wm_move_board_column','wm_duplicate_board_column','wm_delete_board_column','wm_add_board_item','wm_update_board_item','wm_move_board_item','wm_duplicate_board_item','wm_delete_board_item','wm_set_board_item_archived','wm_set_board_cell','wm_set_board_cell_if_current','wm_set_board_status','wm_set_board_status_labels','wm_set_board_view','wm_add_board_member','wm_remove_board_member','wm_get_board_item_workspace','wm_add_board_item_update','wm_delete_board_item_update','wm_register_board_item_file','wm_delete_board_item_file','wm_list_board_events','wm_restore_workspace_backup_v4'];
const CAPABILITY_REALTIME = ['private-channels','broadcast-receive-policy','presence-track-policy','board-topic-authorization','board-change-broadcast-triggers'];

const json = (route, status, body) => route.fulfill({ status, contentType: 'application/json; charset=utf-8', body: JSON.stringify(body), headers: { 'access-control-allow-origin': '*' } });

export async function installM52Principal(page, { role = 'employee', status = 'active' } = {}) {
  const profile = M52_ROLE_MATRIX[role];
  if (!profile) throw new Error(`Unsupported M52 role: ${role}`);
  await seedM39Session(page, { principal: 'admin' });
  const fixture = await installM39Fixture(page, { principal: 'admin' });
  fixture.updateAccess({ role, status, assignments: profile.assignments });

  // M52 successor fixture advertises the complete current RPC surface, including M51 CAS.
  await page.route(`${M39_FIXTURE_ORIGIN}/rest/v1/rpc/wm_runtime_capabilities`, async (route) => json(route, 200, {
    schema_version: '1.43.2-m38-v2', tables: CAPABILITY_TABLES, rpcs: CAPABILITY_RPCS,
    storage: ['work-board-files'], realtime: CAPABILITY_REALTIME,
    missing_tables: [], missing_rpcs: [], missing_storage: [], missing_realtime: [],
  }));

  // Board access remains board-membership scoped and independent from platform role.
  await page.route(`${M39_FIXTURE_ORIGIN}/rest/v1/rpc/wm_list_boards`, async (route) => json(route, 200, [
    { id: '52000000-0000-4000-8000-000000000001', name: 'M52 Owner Board', description: 'Board-scoped owner fixture', status: 'active', member_role: 'owner', item_count: 1, created_at: '2026-09-23T00:00:00.000Z', updated_at: '2026-09-23T00:00:00.000Z' },
    { id: '52000000-0000-4000-8000-000000000002', name: 'M52 Editor Board', description: 'Board-scoped editor fixture', status: 'active', member_role: 'editor', item_count: 1, created_at: '2026-09-23T00:00:00.000Z', updated_at: '2026-09-23T00:00:00.000Z' },
    { id: '52000000-0000-4000-8000-000000000003', name: 'M52 Viewer Board', description: 'Board-scoped viewer fixture', status: 'active', member_role: 'viewer', item_count: 1, created_at: '2026-09-23T00:00:00.000Z', updated_at: '2026-09-23T00:00:00.000Z' },
  ]));

  return Object.freeze({ fixture, profile, role, status });
}

export async function openM52Route(page, route, options = {}) {
  const context = await installM52Principal(page, options);
  await page.goto(`/#/${route}`);
  if ((options.status ?? 'active') === 'active') await waitForM39Identity(page, { role: options.role ?? 'employee' });
  return context;
}

export async function waitForEmbeddedIdentity(page, moduleId, expectedRole) {
  const frame = page.frameLocator('#moduleFrame');
  await frame.locator('body').waitFor({ state: 'visible' });
  await page.waitForFunction(({ moduleId, expectedRole }) => {
    const iframe = document.querySelector('#moduleFrame');
    const context = iframe?.contentWindow?.WM_IDENTITY_CONTEXT;
    return context?.moduleId === moduleId && context?.accountStatus === 'active' && context?.module?.enabled === true && context?.module?.role === expectedRole;
  }, { moduleId, expectedRole });
  return page.evaluate(() => {
    const iframe = document.querySelector('#moduleFrame');
    const context = iframe?.contentWindow?.WM_IDENTITY_CONTEXT;
    return context ? JSON.parse(JSON.stringify(context)) : null;
  });
}
