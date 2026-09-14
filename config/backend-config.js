/*
 * Work Management public backend configuration fallback.
 *
 * The checked-in source stays deployment-neutral. Vite environment values are
 * the runtime authority for development, CI, staging, and production:
 *   VITE_RUNTIME_ENV
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_PUBLISHABLE_KEY
 *
 * Only public client configuration belongs here. Privileged secrets are forbidden.
 */
window.WM_BACKEND_CONFIG = Object.freeze({
  provider: 'supabase',
  accountBased: true,
  enabled: true,
  supabaseUrl: '',
  publishableKey: '',
  requireAuthentication: true,
  allowRegistration: true,
  runtimeEnvironment: 'unconfigured',
  configurationSource: 'unconfigured'
});
