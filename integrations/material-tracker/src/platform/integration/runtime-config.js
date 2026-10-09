export const MATERIAL_TRACKER_MODULE_ID = 'material-tracker';
export const DEFAULT_WORKSPACE_ID = '00000000-0000-4000-8000-000000000001';

function hostBackendConfig() {
  try {
    const local = globalThis.WM_BACKEND_CONFIG;
    if (local?.supabaseUrl && local?.publishableKey) return local;
    const parentConfig = globalThis.parent && globalThis.parent !== globalThis ? globalThis.parent.WM_BACKEND_CONFIG : null;
    if (parentConfig?.supabaseUrl && parentConfig?.publishableKey) return parentConfig;
  } catch { /* Same-origin host configuration is optional in standalone mode. */ }
  return null;
}

export function getRuntimeConfig() {
  const env = typeof import.meta !== 'undefined' ? import.meta.env || {} : {};
  const host = hostBackendConfig();
  return {
    supabaseUrl: host?.supabaseUrl || env.VITE_SUPABASE_URL || 'https://jtlusodorfnyzgyuewkz.supabase.co',
    publishableKey: host?.publishableKey || env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_CrkvaTRYTYAMVbieywNMyg_a0F7HpB6',
    workspaceId: env.VITE_MATERIAL_TRACKER_WORKSPACE_ID || DEFAULT_WORKSPACE_ID,
  };
}
