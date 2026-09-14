# Stage B M6 — Final Browser Storage-Origin Certification Hotfix

## Failure corrected

The real Chromium integration suite previously executed from `about:blank`. Chromium treats that page as an opaque origin and denies Web Storage access, so the Shell M5 theme-authority test failed with:

`SecurityError: Failed to read the 'localStorage' property from 'Window': Access is denied for this document.`

## Correction

`tests/browser/run-cdp.mjs` now creates an ephemeral HTTP server bound only to `127.0.0.1`, navigates the controlled headless Chromium page to that loopback origin, waits for the document to finish loading, and proves `localStorage` availability before executing the application integration suite.

The temporary server is closed before the CDP session exits.

## Why this is the correct boundary

The production Work Management shell runs from an HTTP(S) origin and relies on origin-scoped Web Storage plus same-origin iframe/message security. Executing the browser certification suite from a loopback HTTP origin therefore matches the relevant browser security model instead of bypassing it with mocked storage.

No production application, runtime-schema, RBAC, Board, TimeTracker, FuelTrack+, or TradeLink behavior was changed by this hotfix.
