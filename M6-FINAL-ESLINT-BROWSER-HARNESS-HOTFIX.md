# M6 Final ESLint Browser Harness Hotfix

The browser storage-origin correction introduced two `no-promise-executor-return` violations in `tests/browser/run-cdp.mjs`.

Corrected:
- polling delay Promise executor now uses a block body and does not return the timer handle;
- harness server close Promise executor now uses a block body and does not return `server.close(...)`.

The loopback HTTP-origin browser harness remains intact, preserving Web Storage and origin-sensitive browser verification semantics.
