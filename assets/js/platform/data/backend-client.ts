import type {
  AuthTransportPort,
  BackendClient,
  BackendClientOptions,
  RpcOptions,
  StorageDeleteOptions,
  StorageUploadOptions,
  TransportValidator,
} from '../../../../src/platform/contracts/transport.ts';
import { normalizeAppError, WorkManagementError } from '../errors/app-error.ts';

const STORAGE_REQUEST_TIMEOUT_MS = 20_000;
const STORAGE_UPLOAD_TIMEOUT_MS = 60_000;
let requestSequence = 0;
const nextRequestId = (): string => `wm-${Date.now().toString(36)}-${(++requestSequence).toString(36)}`;


function validatePayload<T>(value: unknown, validator: TransportValidator<T> | undefined, operation: string): T | unknown {
  if (!validator) return value;
  try {
    return validator(value);
  } catch (cause: unknown) {
    throw new WorkManagementError('The server returned data in an unexpected format.', {
      code: 'WM_TRANSPORT_PAYLOAD_INVALID',
      category: 'internal',
      retryable: false,
      operation,
      cause,
    });
  }
}

/** Supabase transport adapter. Feature/domain code should depend on repositories, not this client. */
export function createBackendClient(auth: AuthTransportPort, options: BackendClientOptions = {}): BackendClient {
  const diagnostics = options.diagnostics ?? null;
  const observability = options.observability ?? null;

  async function accessToken(): Promise<string> {
    if (!auth.isAuthenticated) {
      throw new WorkManagementError('Sign in to continue.', {
        code: 'WM_AUTH_REQUIRED',
        category: 'authentication',
        operation: 'auth.access-token',
      });
    }
    const token = await auth.ensureAccessToken();
    if (!token) {
      throw new WorkManagementError('Your session expired. Sign in again.', {
        code: 'WM_AUTH_EXPIRED',
        category: 'authentication',
        operation: 'auth.access-token',
      });
    }
    return token;
  }

  async function rpc<T = unknown>(
    name: string,
    body: Readonly<Record<string, unknown>> = {},
    rpcOptions: RpcOptions<T> = {},
  ): Promise<T | unknown> {
    const operation = `rpc.${name}`;
    const prefer = rpcOptions.prefer ?? 'return=representation';
    const requestId = nextRequestId();
    const span = observability?.startSpan('rpc.request', { 'rpc.system.name': 'supabase', 'rpc.method': name, requestId });
    try {
      const token = await accessToken();
      diagnostics?.debug('API_RPC', 'Calling backend RPC.', { operation, requestId });
      const payload = await auth.supabase.rpc(name, body, token, {
        prefer,
        signal: rpcOptions.signal,
      });
      const validated = validatePayload(payload, rpcOptions.validate, operation);
      diagnostics?.debug('API_RPC_SUCCESS', 'Backend RPC completed.', { operation, requestId });
      span?.end({ status: 'ok' });
      return validated;
    } catch (error: unknown) {
      const normalized = normalizeAppError(error, { operation, metadata: { requestId } });
      diagnostics?.warn('API_RPC_FAILURE', normalized.message, {
        operation,
        requestId,
        code: normalized.code,
        status: normalized.status,
        retryable: normalized.retryable,
      });
      span?.end({ status: 'error', error: normalized, attributes: { 'error.type': normalized.code, status: normalized.status } });
      throw normalized;
    }
  }

  async function storageDelete(bucket: string, path: string, deleteOptions: StorageDeleteOptions = {}): Promise<boolean> {
    const operation = `storage.delete.${bucket}`;
    const requestId = nextRequestId();
    const span = observability?.startSpan('storage.delete', { bucket, requestId });
    try {
      const token = await accessToken();
      diagnostics?.debug('STORAGE_DELETE', 'Deleting private storage object.', { operation, requestId, bucket });
      const result = await auth.supabase.storageDelete(bucket, path, token, {
        ignoreMissing: deleteOptions.ignoreMissing,
        signal: deleteOptions.signal,
        timeoutMs: STORAGE_REQUEST_TIMEOUT_MS,
      });
      span?.end({ status: 'ok' });
      return result;
    } catch (error: unknown) {
      const normalized = normalizeAppError(error, {
        operation,
        fallbackMessage: 'The file could not be removed. Try again.',
        categoryHint: error instanceof WorkManagementError ? null : 'storage',
        metadata: { bucket, requestId },
      });
      span?.end({ status: 'error', error: normalized, attributes: { 'error.type': normalized.code } });
      throw normalized;
    }
  }

  async function storageUpload(bucket: string, path: string, file: Blob, uploadOptions: StorageUploadOptions = {}): Promise<boolean> {
    const operation = `storage.upload.${bucket}`;
    const requestId = nextRequestId();
    const span = observability?.startSpan('storage.upload', { bucket, requestId, size: file.size });
    try {
      const token = await accessToken();
      diagnostics?.debug('STORAGE_UPLOAD', 'Uploading private storage object.', { operation, requestId, bucket, size: file.size });
      const result = await auth.supabase.storageUpload(bucket, path, file, token, {
        contentType: uploadOptions.contentType,
        upsert: uploadOptions.upsert,
        signal: uploadOptions.signal,
        timeoutMs: STORAGE_UPLOAD_TIMEOUT_MS,
      });
      span?.end({ status: 'ok' });
      return result;
    } catch (error: unknown) {
      const normalized = normalizeAppError(error, {
        operation,
        fallbackMessage: 'The file could not be uploaded. Try again.',
        categoryHint: error instanceof WorkManagementError ? null : 'storage',
        metadata: { bucket, size: file.size, requestId },
      });
      span?.end({ status: 'error', error: normalized, attributes: { 'error.type': normalized.code } });
      throw normalized;
    }
  }

  async function storageSign(bucket: string, path: string, expiresIn = 120): Promise<unknown> {
    const operation = `storage.sign.${bucket}`;
    const span = observability?.startSpan('storage.sign', { bucket });
    try {
      const token = await accessToken();
      const result = await auth.supabase.storageSign(bucket, path, token, expiresIn);
      span?.end({ status: 'ok' });
      return result;
    } catch (error: unknown) {
      const normalized = normalizeAppError(error, {
        operation,
        fallbackMessage: 'The file could not be opened securely. Try again.',
        categoryHint: error instanceof WorkManagementError ? null : 'storage',
        metadata: { bucket },
      });
      span?.end({ status: 'error', error: normalized, attributes: { 'error.type': normalized.code } });
      throw normalized;
    }
  }

  return Object.freeze({ rpc, storageDelete, storageUpload, storageSign } satisfies BackendClient);
}
