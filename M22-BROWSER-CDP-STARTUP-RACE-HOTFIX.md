# M22 browser CDP startup-race hotfix

## Failure observed

The M22 strict-type hotfix passed dependency installation, M21/M22 preflight, ESLint, strict TypeScript, M22 execution vectors, and UI regression. Certification then stopped in `verify:vite-browser-cdp` because the helper used one deadline for both Chromium cold-start and DOM-settle work. Chromium had already emitted `DevTools listening`, but `/json/list` had not exposed a page target before that shared deadline expired.

## Correction

- Browser startup now has an independent bounded `startupTimeoutMs` budget (15 seconds by default).
- The DOM/ready-state timeout begins only after a page DevTools WebSocket is established.
- If `/json/list` is reachable but no page target is available yet, the helper explicitly requests a new `about:blank` target through `/json/new` using the required PUT method.
- Startup failure diagnostics now report a startup timeout directly.
- The never-ready regression vector still uses a 1.2 second DOM timeout and retains a bounded overall wall-clock assertion, widened only to include the separately bounded cold-start budget.

## Scope

This is certification-tooling-only. Application runtime, normalized module data, Supabase authority, authentication, RBAC, module state, Board behavior, and embedded module behavior are unchanged.
