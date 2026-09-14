export type ObservabilitySignal = 'log' | 'counter' | 'histogram' | 'span' | 'exception' | 'performance';
export type ObservabilitySeverity = 'debug' | 'info' | 'warning' | 'error';
export type ObservabilitySpanStatus = 'unset' | 'ok' | 'error';
export interface ObservabilityAttributes { readonly [key: string]: unknown; }
export interface ObservabilityResource {
  readonly serviceName: string;
  readonly serviceVersion: string;
  readonly architectureVersion: number;
  readonly runtime: string;
}
export interface ObservabilityRecord {
  readonly id: number;
  readonly at: string;
  readonly signal: ObservabilitySignal;
  readonly name: string;
  readonly severity: ObservabilitySeverity | null;
  readonly traceId: string | null;
  readonly spanId: string | null;
  readonly durationMs: number | null;
  readonly value: number | null;
  readonly unit: string | null;
  readonly status: ObservabilitySpanStatus | null;
  readonly sampled: boolean;
  readonly attributes: Readonly<Record<string, unknown>>;
}
export interface ObservabilityBatch {
  readonly schema: 'wm-observability-v1';
  readonly resource: ObservabilityResource;
  readonly sessionId: string;
  readonly reason: string;
  readonly records: readonly ObservabilityRecord[];
}
export interface ObservabilityTransport {
  export(batch: ObservabilityBatch): Promise<void> | void;
}
export interface ObservabilitySpanEndOptions {
  readonly status?: ObservabilitySpanStatus;
  readonly error?: unknown;
  readonly attributes?: ObservabilityAttributes;
}
export interface ObservabilitySpan {
  readonly traceId: string;
  readonly spanId: string;
  end(options?: ObservabilitySpanEndOptions): ObservabilityRecord | null;
}
export interface ObservabilityStatus {
  readonly buffered: number;
  readonly pendingExport: number;
  readonly dropped: number;
  readonly transportConfigured: boolean;
  readonly exportSampleRate: number;
}
export interface ObservabilityFlushResult {
  readonly exported: number;
  readonly pending: number;
  readonly status: 'disabled' | 'empty' | 'exported' | 'failed';
}
export interface ObservabilityService {
  readonly sessionId: string;
  log(severity: ObservabilitySeverity, name: string, message: string, attributes?: ObservabilityAttributes): ObservabilityRecord;
  counter(name: string, value?: number, attributes?: ObservabilityAttributes): ObservabilityRecord;
  histogram(name: string, value: number, unit?: string, attributes?: ObservabilityAttributes): ObservabilityRecord;
  performance(name: string, value: number, unit?: string, attributes?: ObservabilityAttributes): ObservabilityRecord;
  exception(error: unknown, attributes?: ObservabilityAttributes): ObservabilityRecord;
  startSpan(name: string, attributes?: ObservabilityAttributes, traceId?: string | null): ObservabilitySpan;
  snapshot(): readonly ObservabilityRecord[];
  status(): ObservabilityStatus;
  flush(reason?: string): Promise<ObservabilityFlushResult>;
  clear(): void;
}
export interface ObservabilityOptions {
  readonly resource: ObservabilityResource;
  readonly limit?: number;
  readonly exportSampleRate?: number;
  readonly transport?: ObservabilityTransport | null;
  readonly now?: () => Date;
  readonly monotonicNow?: () => number;
  readonly randomBytes?: (length: number) => Uint8Array;
}
