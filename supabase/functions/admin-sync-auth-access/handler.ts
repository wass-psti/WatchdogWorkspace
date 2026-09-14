import { allowedOrigins, corsHeaders, jsonBody, jsonResponse, requestIdOf, type EdgeJsonRecord } from '../_shared/http.ts';

export interface EdgeFunctionEnvironment {
  readonly supabaseUrl: string;
  readonly publishableKey: string;
  readonly serverSecretKey: string;
  readonly allowedOrigins: string;
}

export interface AdminSyncAuthAccessDependencies {
  readonly fetch: typeof fetch;
  readonly environment: EdgeFunctionEnvironment;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BAN_DURATION = '876000h';

const stringValue = (value: unknown): string => typeof value === 'string' ? value.trim() : '';
const recordOf = (value: unknown): EdgeJsonRecord | null => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as EdgeJsonRecord : null;

async function payloadOf(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

async function assertCallerIsActiveAdmin(request: Request, deps: AdminSyncAuthAccessDependencies): Promise<string> {
  const authorization = request.headers.get('authorization')?.trim() || '';
  if (!/^Bearer\s+\S+$/i.test(authorization)) throw Object.assign(new Error('Authentication required.'), { status: 401, code: 'WM_EDGE_AUTH_REQUIRED' });
  const common = { apikey: deps.environment.publishableKey, Authorization: authorization };
  const userResponse = await deps.fetch(`${deps.environment.supabaseUrl}/auth/v1/user`, { headers: common });
  const userPayload = recordOf(await payloadOf(userResponse));
  const callerId = stringValue(userPayload?.id);
  if (!userResponse.ok || !UUID.test(callerId)) throw Object.assign(new Error('The caller session could not be verified.'), { status: 401, code: 'WM_EDGE_AUTH_INVALID' });

  const profileResponse = await deps.fetch(`${deps.environment.supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(callerId)}&select=id,platform_role,status`, { headers: common });
  const profilePayload = await payloadOf(profileResponse);
  const profile = Array.isArray(profilePayload) ? recordOf(profilePayload[0]) : null;
  if (!profileResponse.ok || profile?.platform_role !== 'admin_general_manager' || profile?.status !== 'active') {
    throw Object.assign(new Error('Administrator access is required.'), { status: 403, code: 'WM_EDGE_ADMIN_REQUIRED' });
  }
  return callerId;
}

async function synchronizeAuthAccess(userId: string, status: 'active' | 'disabled', deps: AdminSyncAuthAccessDependencies): Promise<void> {
  const adminHeaders: Record<string, string> = {
    apikey: deps.environment.serverSecretKey,
    'Content-Type': 'application/json',
  };
  // New sb_secret_* API keys are opaque and belong only in the apikey header.
  // Legacy service_role credentials are JWTs and may also be supplied as Bearer tokens.
  if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(deps.environment.serverSecretKey)) {
    adminHeaders.Authorization = `Bearer ${deps.environment.serverSecretKey}`;
  }
  const response = await deps.fetch(`${deps.environment.supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({ ban_duration: status === 'disabled' ? BAN_DURATION : 'none' }),
  });
  if (!response.ok) {
    const payload = recordOf(await payloadOf(response));
    const message = stringValue(payload?.message) || stringValue(payload?.error_description) || 'Supabase Auth administrative update failed.';
    throw Object.assign(new Error(message), { status: response.status, code: 'WM_EDGE_AUTH_ADMIN_FAILED' });
  }
}

export function createAdminSyncAuthAccessHandler(deps: AdminSyncAuthAccessDependencies): (request: Request) => Promise<Response> {
  const origins = allowedOrigins(deps.environment.allowedOrigins);
  return async (request: Request): Promise<Response> => {
    const requestId = requestIdOf(request);
    const origin = request.headers.get('origin')?.trim() || '';
    if (request.method === 'OPTIONS') {
      if (origin && !origins.has(origin)) return jsonResponse(request, origins, 403, { ok: false, requestId, code: 'WM_EDGE_ORIGIN_DENIED', message: 'Origin is not allowed.' });
      return new Response(null, { status: 204, headers: corsHeaders(request, origins) });
    }
    if (request.method !== 'POST') return jsonResponse(request, origins, 405, { ok: false, requestId, code: 'WM_EDGE_METHOD_NOT_ALLOWED', message: 'POST is required.' });
    if (origin && !origins.has(origin)) return jsonResponse(request, origins, 403, { ok: false, requestId, code: 'WM_EDGE_ORIGIN_DENIED', message: 'Origin is not allowed.' });

    try {
      await assertCallerIsActiveAdmin(request, deps);
      const body = await jsonBody(request);
      const userId = stringValue(body.userId);
      const status = body.status === 'active' || body.status === 'disabled' ? body.status : null;
      if (!UUID.test(userId) || !status) return jsonResponse(request, origins, 400, { ok: false, requestId, code: 'WM_EDGE_VALIDATION', message: 'A valid userId and account status are required.' });
      await synchronizeAuthAccess(userId, status, deps);
      return jsonResponse(request, origins, 200, { ok: true, requestId, userId, authAccess: status === 'disabled' ? 'banned' : 'enabled' });
    } catch (error: unknown) {
      const candidate = recordOf(error);
      const status = Number(candidate?.status);
      const httpStatus = Number.isInteger(status) && status >= 400 && status <= 599 ? status : error instanceof TypeError ? 400 : 500;
      const code = stringValue(candidate?.code) || (error instanceof TypeError ? 'WM_EDGE_VALIDATION' : 'WM_EDGE_INTERNAL');
      const message = error instanceof Error && error.message ? error.message : 'The protected server operation could not be completed.';
      return jsonResponse(request, origins, httpStatus, { ok: false, requestId, code, message });
    }
  };
}
