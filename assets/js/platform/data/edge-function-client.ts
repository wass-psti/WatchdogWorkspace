import type {
  EdgeFunctionClient,
  EdgeFunctionInvokeOptions,
  EdgeFunctionName,
  EdgeFunctionRequestMap,
  EdgeFunctionResponseMap,
} from '../../../../src/platform/contracts/edge-functions.ts';
import type { AuthTransportPort } from '../../../../src/platform/contracts/transport.ts';
import type { DiagnosticsPort } from '../../../../src/platform/contracts/diagnostics.ts';
import type { ObservabilityService } from '../../../../src/platform/contracts/observability.ts';
import { normalizeAppError, WorkManagementError } from '../errors/app-error.ts';

const DEFAULT_TIMEOUT_MS = 20_000;
const FUNCTION_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ALLOWED_FUNCTIONS = Object.freeze(['admin-sync-auth-access'] as const satisfies readonly EdgeFunctionName[]);

const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const requestId = (): string => `wm-edge-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

function validatedFunctionName(name: string): EdgeFunctionName {
  const candidate = String(name || '').trim();
  if (!FUNCTION_NAME.test(candidate) || !(ALLOWED_FUNCTIONS as readonly string[]).includes(candidate)) {
    throw new WorkManagementError('The requested server function is not registered for this application.', {
      code: 'WM_EDGE_FUNCTION_NOT_ALLOWED',
      category: 'authorization',
      operation: 'edge-function.resolve',
    });
  }
  return candidate as EdgeFunctionName;
}

function isAdminSyncAuthAccessResponse(value: unknown): value is EdgeFunctionResponseMap['admin-sync-auth-access'] {
  return isRecord(value)
    && value.ok === true
    && typeof value.requestId === 'string'
    && typeof value.userId === 'string'
    && (value.authAccess === 'enabled' || value.authAccess === 'banned');
}

function validateResponse<TName extends EdgeFunctionName>(name: TName, value: unknown): EdgeFunctionResponseMap[TName] {
  if (name === 'admin-sync-auth-access' && isAdminSyncAuthAccessResponse(value)) {
    return value;
  }
  throw new WorkManagementError('The server function returned an invalid response.', {
    code: 'WM_EDGE_FUNCTION_RESPONSE_INVALID',
    category: 'internal',
    operation: `edge-function.${name}`,
  });
}


export function createEdgeFunctionClient(auth: AuthTransportPort, diagnostics: DiagnosticsPort | null = null, observability: ObservabilityService | null = null): EdgeFunctionClient {
  const isAllowed = (name: string): name is EdgeFunctionName => (ALLOWED_FUNCTIONS as readonly string[]).includes(String(name || '').trim());

  async function invoke<TName extends EdgeFunctionName>(
    name: TName,
    body: EdgeFunctionRequestMap[TName],
    options: EdgeFunctionInvokeOptions = {},
  ): Promise<EdgeFunctionResponseMap[TName]> {
    const resolved = validatedFunctionName(name);
    const operation = `edge-function.${resolved}`;
    const id = requestId();
    if (!auth.isAuthenticated) {
      throw new WorkManagementError('Sign in to continue.', {
        code: 'WM_AUTH_REQUIRED',
        category: 'authentication',
        operation,
      });
    }
    const token = await auth.ensureAccessToken();
    if (!token) {
      throw new WorkManagementError('Your session expired. Sign in again.', {
        code: 'WM_AUTH_EXPIRED',
        category: 'authentication',
        operation,
      });
    }
    const span = observability?.startSpan('edge_function.invoke', { 'rpc.system.name': 'supabase-edge-functions', functionName: resolved, requestId: id });
    try {
      diagnostics?.debug('EDGE_FUNCTION_INVOKE', 'Calling governed Edge Function.', { operation, requestId: id });
      const payload = await auth.supabase.request<unknown>(`/functions/v1/${encodeURIComponent(resolved)}`, {
        method: 'POST',
        headers: auth.headers(token, { 'x-wm-request-id': id }),
        body: JSON.stringify(body),
        signal: options.signal,
        timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      });
      const validated = validateResponse(resolved, payload);
      diagnostics?.debug('EDGE_FUNCTION_SUCCESS', 'Governed Edge Function completed.', { operation, requestId: id });
      span?.end({ status: 'ok' });
      return validated;
    } catch (error: unknown) {
      const normalized = normalizeAppError(error, {
        operation,
        fallbackMessage: 'The protected server operation could not be completed.',
        metadata: { requestId: id },
      });
      diagnostics?.warn('EDGE_FUNCTION_FAILURE', normalized.message, {
        operation,
        requestId: id,
        code: normalized.code,
        status: normalized.status,
        retryable: normalized.retryable,
      });
      span?.end({ status: 'error', error: normalized, attributes: { 'error.type': normalized.code, status: normalized.status } });
      throw normalized;
    }
  }

  return Object.freeze({
    invoke,
    isAllowed,
    functions: () => ALLOWED_FUNCTIONS,
  } satisfies EdgeFunctionClient);
}
