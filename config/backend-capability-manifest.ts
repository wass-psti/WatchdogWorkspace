export const M38_BACKEND_CAPABILITY_SCHEMA = '1.43.2-m38-v2' as const;

export const M38_REQUIRED_TABLES = Object.freeze([
  'profiles','module_role_assignments','module_state_entries','module_activity_events','module_operation_locks','workspaces','workspace_members',
  'work_boards','work_board_members','work_board_groups','work_board_columns','work_board_items','work_board_item_values','work_board_item_updates','work_board_item_files','work_board_events',
] as const);

export const M38_REQUIRED_RPCS = Object.freeze([
  'update_own_profile','list_user_directory','admin_set_user_access','claim_bootstrap_admin',
  'list_module_directory','list_module_state','put_module_state','delete_module_state','list_module_activity','append_module_activity','acquire_module_operation_lock','release_module_operation_lock',
  'commit_timetracker_attendance_action','commit_fueltrack_requests_with_activity','wm_restore_workspace_backup_v4',
  'wm_board_backend_capabilities','wm_list_boards','wm_get_board','wm_create_board','wm_create_board_configured','wm_add_board_column','wm_add_board_column_at','wm_duplicate_board','wm_update_board','wm_delete_board_permanently',
  'wm_get_board_preferences','wm_set_board_preferences','wm_add_board_group','wm_update_board_group','wm_move_board_group','wm_delete_board_group','wm_set_board_group_accent',
  'wm_update_board_column','wm_change_board_column_type','wm_move_board_column','wm_duplicate_board_column','wm_delete_board_column',
  'wm_add_board_item','wm_update_board_item','wm_move_board_item','wm_duplicate_board_item','wm_delete_board_item','wm_set_board_item_archived','wm_set_board_cell','wm_set_board_status','wm_set_board_status_labels','wm_set_board_view',
  'wm_add_board_member','wm_remove_board_member','wm_get_board_item_workspace','wm_add_board_item_update','wm_delete_board_item_update','wm_register_board_item_file','wm_delete_board_item_file','wm_list_board_events',
] as const);

export const M38_REQUIRED_STORAGE_BUCKETS = Object.freeze(['work-board-files'] as const);
export const M38_REQUIRED_REALTIME_CAPABILITIES = Object.freeze([
  'private-channels','broadcast-receive-policy','presence-track-policy','board-topic-authorization','board-change-broadcast-triggers',
] as const);

export type M38CapabilityModule = 'core'|'account'|'users'|'settings'|'boards'|'time-tracker'|'fueltrack-plus'|'tradelink';
export interface M38ModuleRequirement { readonly tables: readonly string[]; readonly rpcs: readonly string[]; readonly storage: readonly string[]; readonly realtime: readonly string[]; }

const BOARD_RPCS = Object.freeze(M38_REQUIRED_RPCS.filter((name) => name.startsWith('wm_') && name !== 'wm_restore_workspace_backup_v4'));
export const M38_MODULE_REQUIREMENTS = Object.freeze({
  core: Object.freeze({ tables:['profiles','module_role_assignments'], rpcs:['claim_bootstrap_admin'], storage:[], realtime:[] }),
  account: Object.freeze({ tables:['profiles','module_role_assignments'], rpcs:['update_own_profile'], storage:[], realtime:[] }),
  users: Object.freeze({ tables:['profiles','module_role_assignments'], rpcs:['list_user_directory','admin_set_user_access'], storage:[], realtime:[] }),
  settings: Object.freeze({ tables:['module_state_entries','module_activity_events','module_operation_locks','workspaces','workspace_members','work_boards'], rpcs:['list_module_state','list_module_activity','acquire_module_operation_lock','release_module_operation_lock','wm_restore_workspace_backup_v4'], storage:[], realtime:[] }),
  boards: Object.freeze({ tables:['work_boards','work_board_members','work_board_groups','work_board_columns','work_board_items','work_board_item_values','work_board_item_updates','work_board_item_files','work_board_events'], rpcs:BOARD_RPCS, storage:['work-board-files'], realtime:M38_REQUIRED_REALTIME_CAPABILITIES }),
  'time-tracker': Object.freeze({ tables:['module_state_entries','module_activity_events','module_operation_locks'], rpcs:['list_module_state','put_module_state','append_module_activity','acquire_module_operation_lock','release_module_operation_lock','commit_timetracker_attendance_action'], storage:[], realtime:[] }),
  'fueltrack-plus': Object.freeze({ tables:['module_state_entries','module_activity_events','module_operation_locks'], rpcs:['list_module_state','put_module_state','append_module_activity','acquire_module_operation_lock','release_module_operation_lock','commit_fueltrack_requests_with_activity'], storage:[], realtime:[] }),
  tradelink: Object.freeze({ tables:['module_state_entries','module_activity_events'], rpcs:['list_module_state','put_module_state','append_module_activity'], storage:[], realtime:[] }),
} satisfies Record<M38CapabilityModule, M38ModuleRequirement>);
