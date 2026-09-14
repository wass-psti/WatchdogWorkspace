import type {
  SupabaseClientAdapter,
  SupabaseHealthResult,
  SupabaseProjectIdentity,
  SupabaseRequestInit,
  SupabaseRpcRequestOptions,
  SupabaseStorageDeleteOptions,
  SupabaseStorageUploadOptions,
} from '../../../../src/platform/contracts/supabase-client.ts';
import { createRequestSignal, timeoutError } from './request-signal.ts';

type UnknownRecord = Record<string, unknown>;

const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;
const DEFAULT_STORAGE_TIMEOUT_MS = 20_000;
const DEFAULT_STORAGE_UPLOAD_TIMEOUT_MS = 60_000;
const ALLOWED_API_PREFIXES = Object.freeze(['/auth/v1/', '/rest/v1/', '/storage/v1/']);

const recordOf = (value: unknown): UnknownRecord | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : null;

const stringValue = (value: unknown): string => typeof value === 'string' ? value.trim() : '';

function legacyJwtRole(value: string): string {
  if (!/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value)) return '';
  try {
    const payload = value.split('.')[1];
    if (!payload) return '';
    const padded = payload.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(payload.length / 4) * 4, '=');
    const parsed = recordOf(JSON.parse(globalThis.atob(padded)) as unknown);
    return stringValue(parsed?.role).toLowerCase();
  } catch { return ''; }
}

function normalizeProject(project: SupabaseProjectIdentity): SupabaseProjectIdentity {
  const supabaseUrl = String(project.supabaseUrl || '').trim().replace(/\/+$/, '');
  const publishableKey = String(project.publishableKey || '').trim();
  if (supabaseUrl && !/^https:\/\/[A-Za-z0-9.-]+\.supabase\.co$/i.test(supabaseUrl)) {
    throw new TypeError('Supabase client adapter requires an HTTPS *.supabase.co project URL.');
  }
  if (/^sb_secret_/i.test(publishableKey) || legacyJwtRole(publishableKey) === 'service_role') {
    throw new TypeError('Supabase client adapter rejects privileged browser keys. Use only a publishable/anon key.');
  }
  return Object.freeze({ supabaseUrl, publishableKey });
}

function assertRelativeApiPath(path: string): string {
  const normalized = String(path || '').trim();
  if (!normalized.startsWith('/') || normalized.startsWith('//') || normalized.includes('://')) {
    throw new TypeError('Supabase client adapter accepts only project-relative API paths.');
  }
  if (!ALLOWED_API_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    throw new TypeError(`Supabase client adapter rejected an unsupported API path: ${normalized}`);
  }
  return normalized;
}

function assertRpcName(name: string): string {
  const normalized = String(name || '').trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(normalized)) throw new TypeError('Supabase RPC name is invalid.');
  return normalized;
}

function assertStorageBucket(bucket: string): string {
  const normalized = String(bucket || '').trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(normalized)) throw new TypeError('Supabase Storage bucket name is invalid.');
  return normalized;
}

function encodeObjectPath(path: string): string {
  const normalized = String(path || '').trim();
  if (!normalized) throw new TypeError('Supabase Storage object path is empty.');
  return normalized.split('/').map((segment) => {
    if (!segment || segment === '.' || segment === '..') throw new TypeError('Supabase Storage object path contains an invalid segment.');
    return encodeURIComponent(segment);
  }).join('/');
}

async function payloadOf(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text) as unknown; } catch { return text; }
}

function errorMessage(payload: unknown, status: number): string {
  const record = recordOf(payload);
  return stringValue(record?.msg)
    || stringValue(record?.message)
    || stringValue(record?.error_description)
    || stringValue(record?.error)
    || `Supabase request failed with HTTP ${status}`;
}

function errorCode(payload: unknown): string {
  const record = recordOf(payload);
  return stringValue(record?.error_code) || stringValue(record?.code) || stringValue(record?.error);
}

export class SupabaseClientAdapterError extends Error {
  override readonly name = 'SupabaseClientAdapterError' as const;
  readonly code: string;
  readonly status: number;
  readonly payload: unknown;

  constructor(payload: unknown, status: number) {
    super(errorMessage(payload, status), { cause: payload });
    this.code = errorCode(payload);
    this.status = status;
    this.payload = payload;
  }
}

export function createSupabaseClientAdapter(projectInput: SupabaseProjectIdentity): SupabaseClientAdapter {
  const project = normalizeProject(projectInput);

  const ensureConfigured = (): void => {
    if (!project.supabaseUrl) throw new Error('Supabase project URL is not configured.');
    if (!project.publishableKey) throw new Error('Supabase publishable key is not configured.');
  };

  const endpoint = (path: string): string => {
    ensureConfigured();
    return `${project.supabaseUrl}${assertRelativeApiPath(path)}`;
  };

  function headers(accessToken: string | null = null, extra: Readonly<Record<string, string>> = {}): Record<string, string> {
    const output: Record<string, string> = {
      apikey: project.publishableKey,
      'Content-Type': 'application/json',
      ...extra,
    };
    if (accessToken) output.Authorization = `Bearer ${accessToken}`;
    return output;
  }

  async function perform(path: string, init: SupabaseRequestInit = {}, fallbackTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS): Promise<Response> {
    const { timeoutMs = fallbackTimeoutMs, signal = null, ...requestInit } = init;
    const requestSignal = createRequestSignal(signal, timeoutMs);
    try {
      const requestHeaders = new Headers(headers());
      if (requestInit.headers) {
        for (const [name, value] of new Headers(requestInit.headers).entries()) requestHeaders.set(name, value);
      }
      return await fetch(endpoint(path), {
        ...requestInit,
        headers: requestHeaders,
        signal: requestSignal.signal,
        cache: requestInit.cache ?? 'no-store',
      });
    } catch (error: unknown) {
      if (requestSignal.timedOut()) throw timeoutError('The Supabase service did not respond in time.');
      throw error;
    } finally {
      requestSignal.dispose();
    }
  }

  async function request<T = unknown>(path: string, init: SupabaseRequestInit = {}): Promise<T> {
    const response = await perform(path, init);
    const payload = await payloadOf(response);
    if (!response.ok) throw new SupabaseClientAdapterError(payload, response.status);
    return payload as T;
  }

  async function rpc<T = unknown>(
    name: string,
    body: Readonly<Record<string, unknown>>,
    accessToken: string,
    options: SupabaseRpcRequestOptions = {},
  ): Promise<T> {
    const prefer = options.prefer ?? 'return=representation';
    return request<T>(`/rest/v1/rpc/${assertRpcName(name)}`, {
      method: 'POST',
      headers: headers(accessToken, prefer ? { Prefer: prefer } : {}),
      body: JSON.stringify(body),
      signal: options.signal,
      timeoutMs: options.timeoutMs,
    });
  }

  async function storageDelete(
    bucket: string,
    path: string,
    accessToken: string,
    options: SupabaseStorageDeleteOptions = {},
  ): Promise<boolean> {
    const response = await perform(`/storage/v1/object/${encodeURIComponent(assertStorageBucket(bucket))}/${encodeObjectPath(path)}`, {
      method: 'DELETE',
      headers: headers(accessToken),
      signal: options.signal,
      timeoutMs: options.timeoutMs ?? DEFAULT_STORAGE_TIMEOUT_MS,
    }, DEFAULT_STORAGE_TIMEOUT_MS);
    if (response.ok || ((options.ignoreMissing ?? true) && response.status === 404)) return true;
    throw new SupabaseClientAdapterError(await payloadOf(response), response.status);
  }

  async function storageUpload(
    bucket: string,
    path: string,
    file: Blob,
    accessToken: string,
    options: SupabaseStorageUploadOptions = {},
  ): Promise<boolean> {
    const response = await perform(`/storage/v1/object/${encodeURIComponent(assertStorageBucket(bucket))}/${encodeObjectPath(path)}`, {
      method: 'POST',
      headers: headers(accessToken, {
        'Content-Type': options.contentType || file.type || 'application/octet-stream',
        'x-upsert': options.upsert ? 'true' : 'false',
      }),
      body: file,
      signal: options.signal,
      timeoutMs: options.timeoutMs ?? DEFAULT_STORAGE_UPLOAD_TIMEOUT_MS,
    }, DEFAULT_STORAGE_UPLOAD_TIMEOUT_MS);
    if (response.ok) return true;
    throw new SupabaseClientAdapterError(await payloadOf(response), response.status);
  }

  async function storageSign<T = unknown>(
    bucket: string,
    path: string,
    accessToken: string,
    expiresIn = 120,
    signal: AbortSignal | null = null,
  ): Promise<T> {
    return request<T>(`/storage/v1/object/sign/${encodeURIComponent(assertStorageBucket(bucket))}/${encodeObjectPath(path)}`, {
      method: 'POST',
      headers: headers(accessToken),
      body: JSON.stringify({ expiresIn }),
      signal,
      timeoutMs: DEFAULT_STORAGE_TIMEOUT_MS,
    });
  }

  function resolveStorageSignedUrl(value: string): string {
    ensureConfigured();
    const candidate = String(value || '').trim();
    if (!candidate) throw new TypeError('Supabase signed URL is empty.');
    if (/^https:\/\//i.test(candidate)) {
      const url = new URL(candidate);
      const projectUrl = new URL(project.supabaseUrl);
      if (url.origin !== projectUrl.origin) throw new TypeError('Supabase signed URL origin does not match the configured project.');
      return url.toString();
    }
    if (candidate.startsWith('/storage/v1/')) return `${project.supabaseUrl}${candidate}`;
    if (candidate.startsWith('/')) return `${project.supabaseUrl}/storage/v1${candidate}`;
    return `${project.supabaseUrl}/storage/v1/${candidate}`;
  }

  async function health(signal: AbortSignal | null = null): Promise<SupabaseHealthResult> {
    const response = await perform('/auth/v1/health', { method: 'GET', headers: headers(), signal });
    return Object.freeze({ ok: response.ok, status: response.status });
  }

  return Object.freeze({ project, headers, request, rpc, storageDelete, storageUpload, storageSign, resolveStorageSignedUrl, health } satisfies SupabaseClientAdapter);
}
