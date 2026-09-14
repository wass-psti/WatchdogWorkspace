export interface SupabaseProjectIdentity {
  readonly supabaseUrl: string;
  readonly publishableKey: string;
}

export type SupabaseRequestInit = Omit<RequestInit, 'signal'> & Readonly<{
  signal?: AbortSignal | null | undefined;
  timeoutMs?: number | undefined;
}>;

export interface SupabaseRpcRequestOptions {
  readonly prefer?: string | undefined;
  readonly signal?: AbortSignal | null | undefined;
  readonly timeoutMs?: number | undefined;
}

export interface SupabaseStorageDeleteOptions {
  readonly ignoreMissing?: boolean | undefined;
  readonly signal?: AbortSignal | null | undefined;
  readonly timeoutMs?: number | undefined;
}

export interface SupabaseStorageUploadOptions {
  readonly contentType?: string | null | undefined;
  readonly upsert?: boolean | undefined;
  readonly signal?: AbortSignal | null | undefined;
  readonly timeoutMs?: number | undefined;
}

export interface SupabaseHealthResult {
  readonly ok: boolean;
  readonly status: number;
}

export interface SupabaseClientAdapter {
  readonly project: SupabaseProjectIdentity;
  headers(accessToken?: string | null, extra?: Readonly<Record<string, string>>): Record<string, string>;
  request<T = unknown>(path: string, init?: SupabaseRequestInit): Promise<T>;
  rpc<T = unknown>(name: string, body: Readonly<Record<string, unknown>>, accessToken: string, options?: SupabaseRpcRequestOptions): Promise<T>;
  storageDelete(bucket: string, path: string, accessToken: string, options?: SupabaseStorageDeleteOptions): Promise<boolean>;
  storageUpload(bucket: string, path: string, file: Blob, accessToken: string, options?: SupabaseStorageUploadOptions): Promise<boolean>;
  storageSign<T = unknown>(bucket: string, path: string, accessToken: string, expiresIn?: number, signal?: AbortSignal | null): Promise<T>;
  resolveStorageSignedUrl(value: string): string;
  health(signal?: AbortSignal | null): Promise<SupabaseHealthResult>;
}
