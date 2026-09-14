# M21 Browser Semantics Synchronization Hotfix

The authoritative Chromium CDP browser integration harness retained the pre-M21 exact three-tab assertion for Item Workspace accessibility semantics. M21 intentionally adds the semantic `Overview` tab while retaining `Updates`, `Files`, and `Activity`, so the production view correctly renders four tabs.

This hotfix synchronizes `tests/browser/run-cdp.mjs` with the already-correct `tests/browser/integration.js` four-tab contract and strengthens `verify-stage-d-m21-rich-item-workspace.mjs` so both browser fixtures must recognize `Overview` plus the three certified collaboration tabs.

No production runtime, dependency, database schema, migration, or persistence behavior is changed. M21 remains `implementation-complete-pending-certification` until the governed Mac certification workflow promotes it.
