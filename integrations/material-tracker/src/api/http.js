import { materialTrackerRpc, workspaceArgs } from '../platform/integration/supabase-rpc';
import { getMaterialTrackerRuntime } from '../platform/integration/bootstrap';


function requireWrite(action = 'write') {
  const runtime = getMaterialTrackerRuntime();
  if (!runtime.canWrite) throw new Error(`Material Tracker ${action} denied for read-only role.`);
}

function requireAdmin(action = 'administration') {
  const runtime = getMaterialTrackerRuntime();
  if (!runtime.isAdmin) throw new Error(`Material Tracker ${action} requires ADMIN role.`);
}

function parseBody(options = {}) {
  if (!options.body) return {};
  if (typeof options.body !== 'string') throw new TypeError('Material Tracker compatibility API expects JSON string bodies.');
  const parsed = JSON.parse(options.body || '{}');
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new TypeError('Material Tracker API JSON body must be an object.');
  return parsed;
}

function parseUrl(path) {
  return new URL(path, 'https://material-tracker.local');
}

export async function apiFetch(path, options = {}) {
  const method = String(options.method || 'GET').toUpperCase();
  const url = parseUrl(path);
  const pathname = url.pathname;
  const body = parseBody(options);

  if (pathname === '/api/items' && method === 'GET') {
    return materialTrackerRpc('material_tracker_list_materials', workspaceArgs({
      p_where: url.searchParams.get('where') ? JSON.parse(url.searchParams.get('where')) : {},
      p_sort: url.searchParams.get('sort') ? JSON.parse(url.searchParams.get('sort')) : null,
      p_limit: Number(url.searchParams.get('limit') || 200),
      p_cursor: Number(url.searchParams.get('cursor') || 0),
    }));
  }
  if (pathname === '/api/items' && method === 'POST') {
    requireWrite('material creation');
    const { groupId = 'new_group', ...fields } = body;
    return materialTrackerRpc('material_tracker_create_material', workspaceArgs({ p_fields: fields, p_group_id: groupId }));
  }

  if (pathname === '/api/import/preflight' && method === 'POST') {
    requireWrite('file import preflight');
    return materialTrackerRpc('material_tracker_import_preflight', workspaceArgs({
      p_rows: Array.isArray(body.rows) ? body.rows : [],
      p_mode: body.mode || 'create',
    }));
  }
  if (pathname === '/api/import/commit' && method === 'POST') {
    requireWrite('file import commit');
    return materialTrackerRpc('material_tracker_import_commit', workspaceArgs({
      p_rows: Array.isArray(body.rows) ? body.rows : [],
      p_mode: body.mode || 'create',
      p_expected_fingerprint: body.fingerprint || '',
    }));
  }

  let match = pathname.match(/^\/api\/items\/([^/]+)$/);
  if (match && method === 'GET') {
    return materialTrackerRpc('material_tracker_get_material', workspaceArgs({ p_material_id: decodeURIComponent(match[1]) }));
  }
  if (match && method === 'PATCH') {
    requireWrite('material update');
    return materialTrackerRpc('material_tracker_update_material', workspaceArgs({
      p_material_id: decodeURIComponent(match[1]),
      p_updates: body.updates || {},
      p_group_id: body.groupId || null,
    }));
  }
  if (match && method === 'DELETE') {
    requireWrite('material archive');
    return materialTrackerRpc('material_tracker_archive_material', workspaceArgs({ p_material_id: decodeURIComponent(match[1]) }));
  }

  match = pathname.match(/^\/api\/items\/([^/]+)\/updates$/);
  if (match && method === 'GET') {
    return materialTrackerRpc('material_tracker_list_activity', workspaceArgs({ p_material_id: decodeURIComponent(match[1]) }));
  }

  match = pathname.match(/^\/api\/items\/([^/]+)\/subitems$/);
  if (match && method === 'GET') {
    return materialTrackerRpc('material_tracker_list_tasks', workspaceArgs({ p_material_id: decodeURIComponent(match[1]) }));
  }
  if (match && method === 'POST') {
    requireWrite('task creation');
    return materialTrackerRpc('material_tracker_create_task', workspaceArgs({ p_material_id: decodeURIComponent(match[1]), p_fields: body }));
  }
  match = pathname.match(/^\/api\/items\/([^/]+)\/subitems\/([^/]+)$/);
  if (match && method === 'PATCH') {
    requireWrite('task update');
    return materialTrackerRpc('material_tracker_update_task', workspaceArgs({
      p_material_id: decodeURIComponent(match[1]), p_task_id: decodeURIComponent(match[2]), p_updates: body,
    }));
  }

  if (pathname === '/api/users/me' && method === 'GET') {
    return materialTrackerRpc('material_tracker_current_user', workspaceArgs());
  }
  if (pathname === '/api/users' && method === 'GET') {
    return materialTrackerRpc('material_tracker_directory', workspaceArgs());
  }
  if (pathname === '/api/notifications' && method === 'POST') {
    requireWrite('notification creation');
    return materialTrackerRpc('material_tracker_create_notification', workspaceArgs({
      p_material_id: body.itemId || null,
      p_user_id: body.userId,
      p_message: body.message || '',
    }));
  }
  if (pathname === '/api/aggregates' && method === 'GET') {
    return materialTrackerRpc('material_tracker_aggregates', workspaceArgs({
      p_group_by: url.searchParams.get('groupBy') || null,
      p_metrics: url.searchParams.get('metrics') ? JSON.parse(url.searchParams.get('metrics')) : [],
    }));
  }
  if (pathname === '/api/forex' && method === 'GET') {
    return materialTrackerRpc('material_tracker_get_forex', workspaceArgs());
  }
  if (pathname === '/api/forex' && method === 'PUT') {
    requireAdmin('forex administration');
    return materialTrackerRpc('material_tracker_set_forex', workspaceArgs({ p_rates: body }));
  }
  if (pathname === '/api/history' && method === 'GET') {
    return materialTrackerRpc('material_tracker_history', workspaceArgs());
  }

  match = pathname.match(/^\/api\/storage\/(.+)$/);
  if (match && method === 'GET') {
    return materialTrackerRpc('material_tracker_get_user_state', workspaceArgs({ p_state_key: decodeURIComponent(match[1]) }));
  }
  if (match && method === 'PUT') {
    return materialTrackerRpc('material_tracker_put_user_state', workspaceArgs({
      p_state_key: decodeURIComponent(match[1]),
      p_value: body.value ?? null,
      p_expected_revision: body.version ?? null,
    }));
  }

  if (pathname === '/api/presence/heartbeat' && method === 'POST') {
    return materialTrackerRpc('material_tracker_presence_heartbeat', workspaceArgs());
  }
  match = pathname.match(/^\/api\/items\/([^/]+)\/comments$/);
  if (match && method === 'GET') {
    return materialTrackerRpc('material_tracker_list_comments', workspaceArgs({ p_material_id: decodeURIComponent(match[1]) }));
  }
  if (match && method === 'POST') {
    requireWrite('comment creation');
    return materialTrackerRpc('material_tracker_add_comment', workspaceArgs({ p_material_id: decodeURIComponent(match[1]), p_text: body.text || '' }));
  }
  match = pathname.match(/^\/api\/comments\/([^/]+)$/);
  if (match && method === 'PATCH') {
    requireWrite('comment edit');
    return materialTrackerRpc('material_tracker_edit_comment', workspaceArgs({ p_comment_id: decodeURIComponent(match[1]), p_text: body.text || '' }));
  }
  if (match && method === 'DELETE') {
    requireWrite('comment delete');
    return materialTrackerRpc('material_tracker_delete_comment', workspaceArgs({ p_comment_id: decodeURIComponent(match[1]) }));
  }

  throw new Error(`Unsupported Material Tracker compatibility route: ${method} ${pathname}`);
}
