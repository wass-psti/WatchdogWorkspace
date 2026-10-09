import { apiFetch } from './http';
class LocalStorageKey {
  constructor(key) { this.storageKey = key; this.expectedVersion = null; }
  key(key) { this.storageKey = key; return this; }
  version(v) { this.expectedVersion = v; return this; }
  async get() { return apiFetch(`/api/storage/${encodeURIComponent(this.storageKey)}`); }
  async set(value) {
    const result = await apiFetch(`/api/storage/${encodeURIComponent(this.storageKey)}`, {
      method: 'PUT', body: JSON.stringify({ value, version: this.expectedVersion }),
    });
    this.expectedVersion = result.version;
    return result;
  }
}
export function storage() { return new LocalStorageKey(null); }
