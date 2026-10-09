import { getRuntimeConfig } from './runtime-config';
import { resolveWorkspaceHostContext } from './workspace-session';

let runtime = null;

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  let body = null;
  try { body = await response.json(); } catch {}
  if (!response.ok) {
    const error = new Error(body?.message || body?.error || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return body;
}

export async function initializeMaterialTrackerRuntime(overrides = {}) {
  const config = getRuntimeConfig();
  const host = resolveWorkspaceHostContext();
  const session = overrides.session || host.session;
  const workspaceId = overrides.workspaceId || host.workspaceId || config.workspaceId;
  const embedded = overrides.embedded ?? host.embedded;

  if (!session?.access_token) throw new Error('Authenticated WatchdogWorkspace session is required.');
  if (!workspaceId) throw new Error('Active WatchdogWorkspace workspace is required.');

  const authUser = await fetchJson(`${config.supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: config.publishableKey,
      Authorization: `Bearer ${session.access_token}`,
    },
  });
  if (!authUser?.id) throw new Error('Supabase did not return an authenticated user.');

  const bootstrap = await fetchJson(`${config.supabaseUrl}/rest/v1/rpc/material_tracker_bootstrap`, {
    method: 'POST',
    headers: {
      apikey: config.publishableKey,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ p_workspace_id: workspaceId }),
  });

  runtime = {
    ...config,
    session,
    workspaceId,
    embedded,
    role: bootstrap?.role || null,
    user: bootstrap?.user || authUser,
    canWrite: ['ADMIN', 'USER'].includes(bootstrap?.role),
    isAdmin: bootstrap?.role === 'ADMIN',
  };
  return runtime;
}

export function getMaterialTrackerRuntime() {
  if (!runtime) throw new Error('Material Tracker runtime is not initialized.');
  return runtime;
}

export function clearMaterialTrackerRuntime() { runtime = null; }
