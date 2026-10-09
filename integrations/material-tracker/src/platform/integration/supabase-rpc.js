import { getMaterialTrackerRuntime } from './bootstrap';


const MUTATION_RPCS = new Set([
  'material_tracker_create_material',
  'material_tracker_update_material',
  'material_tracker_archive_material',
  'material_tracker_create_task',
  'material_tracker_update_task',
  'material_tracker_create_notification',
  'material_tracker_set_forex',
  'material_tracker_put_user_state',
  'material_tracker_add_comment',
  'material_tracker_edit_comment',
  'material_tracker_delete_comment',
  'material_tracker_import_commit',
]);

function emitHostMutation(runtime, functionName, args, result) {
  if (typeof window === 'undefined' || !MUTATION_RPCS.has(functionName)) return;
  const detail = {
    moduleId: 'material-tracker',
    workspaceId: runtime.workspaceId,
    functionName,
    materialId: args?.p_material_id || null,
  };
  window.dispatchEvent(new CustomEvent('watchdog:material-tracker:changed', { detail }));
  if (functionName !== 'material_tracker_put_user_state') {
    window.dispatchEvent(new CustomEvent('watchdog:material-tracker:invalidate', { detail }));
  }
  if (functionName === 'material_tracker_create_notification') {
    window.dispatchEvent(new CustomEvent('watchdog:module-notification-created', {
      detail: { ...detail, userId: args?.p_user_id || null, result },
    }));
  }
}

export async function materialTrackerRpc(functionName, args = {}) {
  const runtime = getMaterialTrackerRuntime();
  const response = await fetch(`${runtime.supabaseUrl}/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    headers: {
      apikey: runtime.publishableKey,
      Authorization: `Bearer ${runtime.session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  let body = null;
  try { body = await response.json(); } catch {}
  if (!response.ok) {
    const error = new Error(body?.message || body?.error || body?.hint || `Material Tracker RPC failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  emitHostMutation(runtime, functionName, args, body);
  return body;
}

export function workspaceArgs(extra = {}) {
  return { p_workspace_id: getMaterialTrackerRuntime().workspaceId, ...extra };
}
