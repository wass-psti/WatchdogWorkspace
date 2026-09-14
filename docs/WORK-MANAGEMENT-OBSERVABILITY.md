# Work Management Observability — Stage F M32

M32 introduces a vendor-neutral client observability authority without changing business behavior or requiring a new npm dependency, database migration, or production telemetry vendor.

## Signals

The host runtime records bounded structured logs, counters, histograms, spans, exceptions, and browser performance measurements. The existing diagnostics service is bridged into the observability stream so legacy diagnostic codes remain usable during migration.

## Correlation

Trace identifiers are random 16-byte / 32-hex values and span identifiers are random 8-byte / 16-hex values. These sizes align with W3C Trace Context identifiers. M32 does not inject trace headers into Supabase traffic; correlation is local to the client until a server-side trace ingestion contract is certified.

## Privacy and data minimization

Telemetry is memory-first and bounded to 240 records by default. It is not persisted to localStorage, IndexedDB, or cookies. Sensitive key names, bearer credentials, JWT-like values, email addresses, and UUID-like path segments are redacted before records enter the buffer. Request bodies and storage object paths are not added to spans.

Warnings and errors are always export-sampled. Lower-severity signals use a 20% export sample rate by default. Sampling affects export eligibility, not the in-memory debugging snapshot.

## Browser instrumentation

The host captures global errors, unhandled promise rejections, existing M31 startup performance measures, navigation timing, long tasks, paint timing, largest-contentful-paint timing, and layout-shift deltas when the browser supports the relevant PerformanceObserver entry type. Page hide triggers a best-effort flush.

## Export boundary

No production export endpoint is configured by default. `ObservabilityTransport` is injectable and a beacon/fetch transport adapter is provided for a later governed deployment integration. This prevents M32 from hard-coding a vendor, leaking credentials, or expanding CSP/network permissions without a separately certified endpoint.

## Release gates

- `npm run observability:check`
- `npm run observability:test`
- `bash scripts/certify-stage-f-m32.sh`

M32 certification also revalidates M31 performance engineering, M30 modern testing, M29 database/RLS structure, M28 Edge Functions, and M27 Realtime architecture.
