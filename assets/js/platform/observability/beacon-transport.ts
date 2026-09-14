import type { ObservabilityBatch, ObservabilityTransport } from '../../../../src/platform/contracts/observability.ts';

export interface BeaconObservabilityTransportOptions {
  readonly endpoint: string;
  readonly fetchImpl?: typeof fetch;
  readonly navigatorLike?: Pick<Navigator, 'sendBeacon'> | null;
}

export function createBeaconObservabilityTransport(options: BeaconObservabilityTransportOptions): ObservabilityTransport {
  const endpoint = String(options.endpoint || '').trim();
  if (!endpoint) throw new TypeError('Observability export endpoint is required.');
  const base = typeof location !== 'undefined' ? location.href : 'https://localhost/';
  const resolved = new URL(endpoint, base);
  if (resolved.protocol !== 'https:' && resolved.hostname !== 'localhost' && resolved.hostname !== '127.0.0.1') {
    throw new TypeError('Observability export endpoint must use HTTPS outside local development.');
  }
  const exportUrl = resolved.toString();
  const fetchImpl = options.fetchImpl ?? globalThis.fetch?.bind(globalThis);
  const navigatorLike = options.navigatorLike ?? (typeof navigator !== 'undefined' ? navigator : null);
  return Object.freeze({
    async export(batch: ObservabilityBatch): Promise<void> {
      const body = JSON.stringify(batch);
      if (navigatorLike?.sendBeacon && navigatorLike.sendBeacon(exportUrl, new Blob([body], { type: 'application/json' }))) return;
      if (!fetchImpl) throw new Error('No observability export transport is available.');
      const response = await fetchImpl(exportUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        credentials: 'omit',
        keepalive: true,
      });
      if (!response.ok) throw new Error(`Observability export failed with HTTP ${response.status}.`);
    },
  });
}
