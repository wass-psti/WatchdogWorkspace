export type EdgeFunctionName = 'admin-sync-auth-access';

export type WorkManagementAccountStatus = 'active' | 'disabled';

export interface AdminSyncAuthAccessRequest {
  readonly userId: string;
  readonly status: WorkManagementAccountStatus;
}

export interface AdminSyncAuthAccessResponse {
  readonly ok: true;
  readonly requestId: string;
  readonly userId: string;
  readonly authAccess: 'enabled' | 'banned';
}

export type EdgeFunctionRequestMap = Readonly<{
  'admin-sync-auth-access': AdminSyncAuthAccessRequest;
}>;

export type EdgeFunctionResponseMap = Readonly<{
  'admin-sync-auth-access': AdminSyncAuthAccessResponse;
}>;

export interface EdgeFunctionInvokeOptions {
  readonly signal?: AbortSignal | null;
  readonly timeoutMs?: number;
}

export interface EdgeFunctionClient {
  invoke<TName extends EdgeFunctionName>(
    name: TName,
    body: EdgeFunctionRequestMap[TName],
    options?: EdgeFunctionInvokeOptions,
  ): Promise<EdgeFunctionResponseMap[TName]>;
  isAllowed(name: string): name is EdgeFunctionName;
  functions(): readonly EdgeFunctionName[];
}
