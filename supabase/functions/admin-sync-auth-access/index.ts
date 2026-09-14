import { createAdminSyncAuthAccessHandler } from './handler.ts';

function singleConfiguredKey(raw: string | undefined): string {
  if (!raw) return '';
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const values = Object.values(parsed as Record<string, unknown>).filter((value): value is string => typeof value === 'string' && Boolean(value.trim())).map((value) => value.trim());
      return values.length === 1 ? values[0] ?? '' : '';
    }
  } catch {
    return '';
  }
  return '';
}

const environment = Object.freeze({
  supabaseUrl: Deno.env.get('SUPABASE_URL')?.replace(/\/$/, '') || '',
  publishableKey: Deno.env.get('WM_SUPABASE_PUBLISHABLE_KEY') || singleConfiguredKey(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')),
  serverSecretKey: Deno.env.get('WM_SUPABASE_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || singleConfiguredKey(Deno.env.get('SUPABASE_SECRET_KEYS')),
  allowedOrigins: Deno.env.get('WM_EDGE_ALLOWED_ORIGINS') || '',
});

for (const [name, value] of Object.entries(environment)) {
  if (!value) throw new Error(`Missing required Edge Function environment value: ${name}`);
}

Deno.serve(createAdminSyncAuthAccessHandler({ fetch, environment }));
