import type {
  ObservabilityAttributes,
  ObservabilityBatch,
  ObservabilityFlushResult,
  ObservabilityOptions,
  ObservabilityRecord,
  ObservabilityResource,
  ObservabilityService,
  ObservabilitySeverity,
  ObservabilitySignal,
  ObservabilitySpan,
  ObservabilitySpanEndOptions,
  ObservabilitySpanStatus,
} from '../../../../src/platform/contracts/observability.ts';

const SENSITIVE_KEY = /(?:token|password|secret|authorization|cookie|api[_-]?key|publishable[_-]?key|email|phone|address|display[_-]?name|first[_-]?name|last[_-]?name|full[_-]?name|note|comment|content|payload|body|query|sql|user[_-]?id|session[_-]?token)/i;
const JWT_LIKE = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g;
const BEARER = /\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const UUID_SEGMENT = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;
const MAX_STRING = 500;
const MAX_DEPTH = 3;
const MAX_ARRAY = 20;
const MAX_KEYS = 32;

function sanitizeString(value: string): string {
  return value
    .slice(0, MAX_STRING)
    .replace(BEARER, 'Bearer [redacted]')
    .replace(JWT_LIKE, '[redacted-jwt]')
    .replace(EMAIL, '[redacted-email]')
    .replace(UUID_SEGMENT, ':id');
}

export function sanitizeObservabilityValue(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return '[depth-limited]';
  if (value === null || value === undefined) return value ?? null;
  if (typeof value === 'string') return sanitizeString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.slice(0, MAX_ARRAY).map((entry) => sanitizeObservabilityValue(entry, depth + 1));
  if (value instanceof Error) {
    return Object.freeze({
      type: sanitizeString(value.name || 'Error'),
      message: sanitizeString(value.message || ''),
    });
  }
  if (typeof value !== 'object') return sanitizeString(String(value));
  const output: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value).slice(0, MAX_KEYS)) {
    output[key] = SENSITIVE_KEY.test(key) ? '[redacted]' : sanitizeObservabilityValue(entry, depth + 1);
  }
  return Object.freeze(output);
}

function sanitizeAttributes(attributes: ObservabilityAttributes | undefined): Readonly<Record<string, unknown>> {
  const value = sanitizeObservabilityValue(attributes ?? {});
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Readonly<Record<string, unknown>>
    : Object.freeze({});
}

function defaultRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) throw new Error('Secure random generation is required for observability trace identifiers.');
  return cryptoApi.getRandomValues(bytes);
}

function hex(bytes: Uint8Array): string {
  return [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('');
}

function clampRate(value: number | undefined): number {
  const rate = Number(value ?? 0.2);
  if (!Number.isFinite(rate)) return 0.2;
  return Math.max(0, Math.min(1, rate));
}

function exceptionAttributes(error: unknown): ObservabilityAttributes {
  if (error instanceof Error) {
    return Object.freeze({
      'exception.type': error.name || 'Error',
      'exception.message': error.message || '',
      'exception.stacktrace': error.stack ? sanitizeString(error.stack) : null,
    });
  }
  return Object.freeze({
    'exception.type': typeof error,
    'exception.message': String(error ?? 'Unknown error'),
  });
}

export function createObservability(options: ObservabilityOptions): ObservabilityService {
  const resource: ObservabilityResource = Object.freeze({ ...options.resource });
  const limit = Math.max(40, Math.floor(options.limit ?? 240));
  const exportSampleRate = clampRate(options.exportSampleRate);
  const transport = options.transport ?? null;
  const now = options.now ?? (() => new Date());
  const monotonicNow = options.monotonicNow ?? (() => globalThis.performance?.now?.() ?? Date.now());
  const randomBytes = options.randomBytes ?? defaultRandomBytes;
  const sessionId = hex(randomBytes(16));
  const records: ObservabilityRecord[] = [];
  let sequence = 0;
  let lastExportedId = 0;
  let dropped = 0;

  const sampled = (severity: ObservabilitySeverity | null): boolean => {
    if (severity === 'warning' || severity === 'error') return true;
    if (exportSampleRate >= 1) return true;
    if (exportSampleRate <= 0) return false;
    return (randomBytes(1)[0] ?? 255) / 255 <= exportSampleRate;
  };

  function record(input: {
    signal: ObservabilitySignal;
    name: string;
    severity?: ObservabilitySeverity | null;
    traceId?: string | null;
    spanId?: string | null;
    durationMs?: number | null;
    value?: number | null;
    unit?: string | null;
    status?: ObservabilitySpanStatus | null;
    attributes?: ObservabilityAttributes;
  }): ObservabilityRecord {
    const severity = input.severity ?? null;
    const entry: ObservabilityRecord = Object.freeze({
      id: ++sequence,
      at: now().toISOString(),
      signal: input.signal,
      name: sanitizeString(input.name || 'wm.event'),
      severity,
      traceId: input.traceId ?? null,
      spanId: input.spanId ?? null,
      durationMs: input.durationMs ?? null,
      value: input.value ?? null,
      unit: input.unit ? sanitizeString(input.unit) : null,
      status: input.status ?? null,
      sampled: sampled(severity),
      attributes: sanitizeAttributes(input.attributes),
    });
    records.push(entry);
    while (records.length > limit) {
      records.shift();
      dropped += 1;
    }
    return entry;
  }

  const service: ObservabilityService = {
    sessionId,
    log(severity, name, message, attributes = {}) {
      return record({ signal: 'log', severity, name, attributes: { ...attributes, message } });
    },
    counter(name, value = 1, attributes = {}) {
      return record({ signal: 'counter', name, value, unit: '1', attributes });
    },
    histogram(name, value, unit = '1', attributes = {}) {
      return record({ signal: 'histogram', name, value, unit, attributes });
    },
    performance(name, value, unit = 'ms', attributes = {}) {
      return record({ signal: 'performance', name, value, unit, attributes });
    },
    exception(error, attributes = {}) {
      return record({ signal: 'exception', severity: 'error', name: 'exception', attributes: { ...attributes, ...exceptionAttributes(error) } });
    },
    startSpan(name, attributes = {}, traceId = null): ObservabilitySpan {
      const resolvedTraceId = traceId && /^[0-9a-f]{32}$/.test(traceId) ? traceId : hex(randomBytes(16));
      const spanId = hex(randomBytes(8));
      const startedAt = monotonicNow();
      let ended = false;
      return Object.freeze({
        traceId: resolvedTraceId,
        spanId,
        end(endOptions: ObservabilitySpanEndOptions = {}): ObservabilityRecord | null {
          if (ended) return null;
          ended = true;
          const durationMs = Math.max(0, monotonicNow() - startedAt);
          const errorAttributes = endOptions.error === undefined ? {} : exceptionAttributes(endOptions.error);
          const status = endOptions.status ?? (endOptions.error === undefined ? 'ok' : 'error');
          return record({
            signal: 'span',
            name,
            traceId: resolvedTraceId,
            spanId,
            durationMs,
            status,
            severity: status === 'error' ? 'error' : null,
            attributes: { ...attributes, ...(endOptions.attributes ?? {}), ...errorAttributes },
          });
        },
      });
    },
    snapshot() {
      return Object.freeze(records.slice());
    },
    status() {
      const pendingExport = records.filter((entry) => entry.sampled && entry.id > lastExportedId).length;
      return Object.freeze({ buffered: records.length, pendingExport, dropped, transportConfigured: transport !== null, exportSampleRate });
    },
    async flush(reason = 'manual'): Promise<ObservabilityFlushResult> {
      const pending = records.filter((entry) => entry.sampled && entry.id > lastExportedId);
      if (!transport) return Object.freeze({ exported: 0, pending: pending.length, status: 'disabled' });
      if (pending.length === 0) return Object.freeze({ exported: 0, pending: 0, status: 'empty' });
      const batch: ObservabilityBatch = Object.freeze({
        schema: 'wm-observability-v1',
        resource,
        sessionId,
        reason: sanitizeString(reason),
        records: Object.freeze(pending.slice()),
      });
      try {
        await transport.export(batch);
        lastExportedId = pending[pending.length - 1]?.id ?? lastExportedId;
        return Object.freeze({ exported: pending.length, pending: 0, status: 'exported' });
      } catch {
        return Object.freeze({ exported: 0, pending: pending.length, status: 'failed' });
      }
    },
    clear() {
      records.splice(0, records.length);
      lastExportedId = sequence;
      dropped = 0;
    },
  };
  return Object.freeze(service);
}
