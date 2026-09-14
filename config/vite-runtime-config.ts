export type WorkManagementRuntimeEnvironment = 'local' | 'development' | 'ci' | 'production';
export type BackendConfigurationSource = 'vite-env' | 'vite-env-incomplete' | 'runtime-fallback' | 'unconfigured';

export interface PublicBackendRuntimeConfig {
  readonly provider: 'supabase';
  readonly accountBased: boolean;
  readonly enabled: boolean;
  readonly supabaseUrl: string;
  readonly publishableKey: string;
  readonly requireAuthentication: boolean;
  readonly allowRegistration: boolean;
  readonly runtimeEnvironment: WorkManagementRuntimeEnvironment;
  readonly configurationSource: BackendConfigurationSource;
}

export interface VitePublicRuntimeEnv {
  readonly VITE_SUPABASE_URL?: unknown;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: unknown;
  readonly VITE_RUNTIME_ENV?: unknown;
  readonly MODE?: unknown;
}

type UnknownRecord = Readonly<Record<string, unknown>>;
declare global { var WM_BACKEND_CONFIG: unknown; }

const clean = (value: unknown): string => typeof value === 'string' ? value.trim() : '';
const asRecord = (value: unknown): UnknownRecord => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : Object.freeze({});
const environments = new Set<WorkManagementRuntimeEnvironment>(['local','development','ci','production']);

function runtimeEnvironment(env: VitePublicRuntimeEnv, current: UnknownRecord): WorkManagementRuntimeEnvironment {
  const explicit = clean(env.VITE_RUNTIME_ENV) as WorkManagementRuntimeEnvironment;
  if (environments.has(explicit)) return explicit;
  const fallback = clean(current.runtimeEnvironment) as WorkManagementRuntimeEnvironment;
  if (environments.has(fallback)) return fallback;
  return clean(env.MODE) === 'production' ? 'production' : 'development';
}

export function resolveViteRuntimeConfig(env: VitePublicRuntimeEnv = {}, currentConfig: unknown = {}): PublicBackendRuntimeConfig {
  const current = asRecord(currentConfig);
  const envUrl = clean(env.VITE_SUPABASE_URL);
  const envKey = clean(env.VITE_SUPABASE_PUBLISHABLE_KEY);
  const envAttempted = Boolean(envUrl || envKey);
  const fallbackUrl = clean(current.supabaseUrl);
  const fallbackKey = clean(current.publishableKey);
  const fallbackConfigured = Boolean(fallbackUrl && fallbackKey);
  const source: BackendConfigurationSource = envAttempted
    ? (envUrl && envKey ? 'vite-env' : 'vite-env-incomplete')
    : (fallbackConfigured ? 'runtime-fallback' : 'unconfigured');
  return Object.freeze({
    provider: 'supabase',
    accountBased: current.accountBased !== false,
    enabled: current.enabled !== false,
    supabaseUrl: envAttempted ? envUrl : fallbackUrl,
    publishableKey: envAttempted ? envKey : fallbackKey,
    requireAuthentication: current.requireAuthentication !== false,
    allowRegistration: current.allowRegistration !== false,
    runtimeEnvironment: runtimeEnvironment(env, current),
    configurationSource: source,
  });
}

export function applyViteRuntimeConfig(env: VitePublicRuntimeEnv = {}): PublicBackendRuntimeConfig {
  const resolved = resolveViteRuntimeConfig(env, globalThis.WM_BACKEND_CONFIG);
  globalThis.WM_BACKEND_CONFIG = resolved;
  return resolved;
}
