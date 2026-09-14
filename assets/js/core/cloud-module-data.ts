import type {
  CloudModuleDataBridge,
  CloudModuleDataBridgeOptions,
  ModuleDataRequest,
  ModuleDataResponse,
  ModuleIdentityRequest,
} from '../../../src/platform/contracts/module-data.ts';
import {
  firstSchemaIssue,
  moduleDataEnvelopeSchema,
  moduleDataRequestSchema,
  moduleIdentityRequestSchema,
} from '../../../src/runtime-schemas/index.ts';
import { WorkManagementError, normalizeAppError } from '../platform/errors/app-error.ts';

type UnknownRecord = Record<string, unknown>;
type MessageLike = Pick<MessageEvent<unknown>, 'data' | 'origin' | 'source'>;

export type ModuleDataRequestParseResult =
  | Readonly<{ ok: true; value: ModuleDataRequest }>
  | Readonly<{ ok: false; reason: string }>;

export type ModuleDataMessageOutcome = 'ignored' | 'rejected' | 'handled';

export interface CloudModuleDataMessageContext extends CloudModuleDataBridgeOptions {
  readonly origin: string;
  readonly respond: (target: WindowProxy | null, response: ModuleDataResponse) => void;
}

const rpcPath = (name: string): string => `/rest/v1/rpc/${name}`;

const invalid = (reason: string): ModuleDataRequestParseResult => Object.freeze({ ok: false, reason });

/**
 * Parses the same-origin module protocol from an untrusted browser message.
 * M6 centralizes the structural contract in the Work Management runtime-schema
 * authority; semantic authorization remains in this bridge.
 */
export function parseModuleDataRequest(value: unknown): ModuleDataRequestParseResult {
  // Preserve protocol-specific diagnostics before structural parsing so callers
  // retain actionable errors for operations that are intentionally module-owned.
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const candidate = value as Record<string, unknown>;
    if (candidate.action === 'attendance:commit' && candidate.moduleId !== 'time-tracker') {
      return invalid('Attendance commit is only available to TimeTracker.');
    }
    if ((candidate.action === 'activity:list' || candidate.action === 'activity:append' || candidate.action === 'commit:requests-activity') && candidate.moduleId !== 'fueltrack-plus') {
      return invalid('Activity stream is only available to FuelTrack+.');
    }
  }
  const parsed = moduleDataRequestSchema.safeParse(value);
  if (!parsed.success) return invalid(firstSchemaIssue(parsed.error));
  return Object.freeze({ ok: true, value: Object.freeze(parsed.data) as ModuleDataRequest });
}

export function parseModuleIdentityRequest(value: unknown): ModuleIdentityRequest | null {
  const parsed = moduleIdentityRequestSchema.safeParse(value);
  return parsed.success ? Object.freeze(parsed.data) as ModuleIdentityRequest : null;
}

function validationMessage(reason: string): string {
  return `Module data request is invalid: ${reason}`;
}

function operationDenied(message: string): WorkManagementError {
  return new WorkManagementError(message, {
    code: 'WM_MODULE_OPERATION_DENIED',
    category: 'authorization',
    operation: 'module-data.bridge',
  });
}

async function executeRequest(request: ModuleDataRequest, auth: CloudModuleDataBridgeOptions['auth']): Promise<unknown> {
  const token = await auth.ensureAccessToken();
  if (!token) {
    throw new WorkManagementError('Your authenticated session expired. Sign in again.', {
      code: 'WM_AUTH_REQUIRED',
      category: 'authentication',
      operation: 'module-data.bridge',
    });
  }

  const rpc = (name: string, body: UnknownRecord): Promise<unknown> => auth.request(rpcPath(name), {
    method: 'POST',
    headers: auth.headers(token),
    body: JSON.stringify(body),
  });

  switch (request.action) {
    case 'list':
      return rpc('list_module_state', { p_module_id: request.moduleId });
    case 'directory':
      return rpc('list_module_directory', { p_module_id: request.moduleId });
    case 'put':
      return rpc('put_module_state', {
        p_module_id: request.moduleId,
        p_state_key: request.key,
        p_value: request.value,
        p_scope: request.scope,
        p_expected_revision: request.expectedRevision,
      });
    case 'delete':
      return rpc('delete_module_state', {
        p_module_id: request.moduleId,
        p_state_key: request.key,
        p_scope: request.scope,
        p_expected_revision: request.expectedRevision,
      });
    case 'lock:acquire':
      return rpc('acquire_module_operation_lock', {
        p_module_id: request.moduleId,
        p_lock_key: request.lockKey,
        p_ttl_seconds: request.ttlSeconds,
      });
    case 'lock:release':
      return rpc('release_module_operation_lock', {
        p_module_id: request.moduleId,
        p_lock_key: request.lockKey,
        p_token: request.token,
      });
    case 'attendance:commit':
      if (request.moduleId !== 'time-tracker') throw operationDenied('Transactional attendance commit is only available to TimeTracker.');
      return rpc('commit_timetracker_attendance_action', {
        p_action: request.operation,
        p_record_id: request.recordId,
        p_location: request.location,
        p_department: request.department,
        p_geo: request.geo,
        p_work_note: request.workNote,
        p_attendance_policy: request.attendancePolicy,
      });
    case 'activity:list':
      if (request.moduleId !== 'fueltrack-plus') throw operationDenied('Activity stream is only available to FuelTrack+.');
      return rpc('list_module_activity', {
        p_module_id: request.moduleId,
        p_before_sequence: request.beforeSequence,
        p_limit: request.limit,
      });
    case 'activity:append':
      if (request.moduleId !== 'fueltrack-plus') throw operationDenied('Activity stream is only available to FuelTrack+.');
      return rpc('append_module_activity', {
        p_module_id: request.moduleId,
        p_event_id: request.event.id,
        p_event_type: request.event.type,
        p_title: request.event.title,
        p_message: request.event.message,
        p_request_id: request.event.requestId,
        p_payload: request.event.payload,
      });
    case 'commit:requests-activity':
      if (request.moduleId !== 'fueltrack-plus') throw operationDenied('Atomic request/activity commit is only available to FuelTrack+.');
      return rpc('commit_fueltrack_requests_with_activity', {
        p_value: request.value,
        p_expected_revision: request.expectedRevision,
        p_event_id: request.event.id,
        p_event_type: request.event.type,
        p_title: request.event.title,
        p_message: request.event.message,
        p_request_id: request.event.requestId,
        p_payload: request.event.payload,
      });
  }
}

/** Handles one untrusted module-data message after verifying origin, frame ownership, module identity and payload shape. */
export async function handleCloudModuleDataMessage(event: MessageLike, context: CloudModuleDataMessageContext): Promise<ModuleDataMessageOutcome> {
  if (event.origin !== context.origin) return 'ignored';
  const envelope = moduleDataEnvelopeSchema.safeParse(event.data);
  if (!envelope.success) return 'ignored';
  const raw = envelope.data;
  const requestId = raw.requestId;

  const frame = context.getFrame();
  const activeModuleId = context.getModuleId();
  const target = frame?.contentWindow ?? null;
  if (!target || event.source !== target || raw.moduleId !== activeModuleId) {
    context.respond(event.source === target ? target : null, {
      type: 'wm:data:response', requestId, ok: false, payload: null,
      error: 'Module data request was rejected by the workspace boundary.',
    });
    return 'rejected';
  }

  if (!context.auth.isAuthenticated || !context.auth.canAccessModule(activeModuleId)) {
    context.respond(target, {
      type: 'wm:data:response', requestId, ok: false, payload: null,
      error: 'Authenticated module access is required.',
    });
    return 'rejected';
  }

  const parsed = parseModuleDataRequest(raw);
  if (!parsed.ok) {
    context.respond(target, {
      type: 'wm:data:response', requestId, ok: false, payload: null,
      error: validationMessage(parsed.reason),
    });
    return 'rejected';
  }

  if (parsed.value.moduleId !== activeModuleId) {
    context.respond(target, {
      type: 'wm:data:response', requestId, ok: false, payload: null,
      error: 'Module data request was rejected by the workspace boundary.',
    });
    return 'rejected';
  }

  try {
    const payload = await executeRequest(parsed.value, context.auth);
    context.respond(target, { type: 'wm:data:response', requestId, ok: true, payload, error: null });
  } catch (error) {
    const normalized = normalizeAppError(error, {
      operation: 'module-data.bridge',
      fallbackMessage: 'Cloud persistence request failed.',
      metadata: { moduleId: parsed.value.moduleId, action: parsed.value.action, requestId },
    });
    context.respond(target, { type: 'wm:data:response', requestId, ok: false, payload: null, error: normalized.message });
  }
  return 'handled';
}

export function handleCloudModuleIdentityMessage(event: MessageLike, context: Omit<CloudModuleDataMessageContext, 'respond'>): ModuleDataMessageOutcome {
  if (event.origin !== context.origin) return 'ignored';
  const request = parseModuleIdentityRequest(event.data);
  if (!request) return 'ignored';
  const frame = context.getFrame();
  const activeModuleId = context.getModuleId();
  const target = frame?.contentWindow ?? null;
  if (!target || event.source !== target || request.moduleId !== activeModuleId) return 'rejected';
  if (!context.auth.isAuthenticated || !context.auth.canAccessModule(activeModuleId)) return 'rejected';
  const identity = context.auth.moduleIdentityContext(activeModuleId);
  if (!identity) return 'rejected';
  try {
    target.postMessage(identity, context.origin);
    return 'handled';
  } catch {
    return 'rejected';
  }
}

/** Typed, runtime-validated bridge between same-origin isolated modules and authenticated persistence. */
export function installCloudModuleDataBridge({ auth, getFrame, getModuleId }: CloudModuleDataBridgeOptions): CloudModuleDataBridge {
  const abort = new AbortController();
  const origin = location.origin;
  const respond = (target: WindowProxy | null, response: ModuleDataResponse): void => {
    try { target?.postMessage(response, origin); } catch { /* Detached frame. */ }
  };
  const context: CloudModuleDataMessageContext = { auth, getFrame, getModuleId, origin, respond };

  const onDataMessage = (event: MessageEvent<unknown>): void => {
    void handleCloudModuleDataMessage(event, context);
  };
  const onIdentityMessage = (event: MessageEvent<unknown>): void => {
    handleCloudModuleIdentityMessage(event, { auth, getFrame, getModuleId, origin });
  };

  window.addEventListener('message', onDataMessage, { signal: abort.signal });
  window.addEventListener('message', onIdentityMessage, { signal: abort.signal });

  return Object.freeze({ dispose: () => abort.abort() });
}
