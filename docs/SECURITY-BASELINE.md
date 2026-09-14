# Work Management v1.43.2 — Stage A Milestone 2 Security Baseline

## Purpose

This document defines the source-controlled security baseline for the current Work Management release candidate. It covers the Work Management shell, Supabase-backed identity and authorization boundary, embedded-application host boundary, production browser policy, service-worker cache behavior, and release verification.

This milestone does **not** replace Supabase Auth with a browser-owned credential/session system. Supabase Auth is authoritative for passwords, access tokens, refresh tokens, authentication rate limiting, and session revocation. PostgreSQL/RLS and security-definer RPCs remain authoritative for Work Management authorization.

## Trust model

### Identity and credentials

- Supabase Auth owns user credentials and authenticated sessions.
- The browser receives only the public Supabase project URL and publishable/browser key.
- Service-role credentials and other privileged backend secrets are prohibited from the client bundle and source-controlled runtime configuration.
- Work Management persists the Supabase browser session so sign-in survives reloads. That persistence is not an authorization authority; every protected cloud operation remains server-authorized.

### Authorization

- Active profile state, workspace membership, platform role, module assignment, and Board membership are enforced by PostgreSQL/RLS/RPC helpers.
- Disabled accounts are rejected by the authoritative workspace/Board helpers even when an older JWT has not yet expired.
- The shell revalidates the current account/module access context when the browser regains focus or visibility and clears stale server state when effective authorization changes.
- Embedded modules receive the authenticated identity context from Work Management but keep their application-scoped role semantics.

### Browser/module isolation

- Embedded applications remain same-origin iframes so the existing identity/cloud bridge can operate without duplicating login flows.
- Browser feature permissions are least-privilege per module:
  - TimeTracker: `geolocation`
  - FuelTrack+: `clipboard-write`
  - TradeLink: `clipboard-write`
- `clipboard-read` is no longer granted to any module.
- The module bootstrap refuses cross-origin executable entry scripts.
- Host/module `postMessage` traffic is accepted only when both `event.origin` and `event.source` match the attached module frame.

## Controls implemented by Milestone 2

### 1. Production Content Security Policy

The Vite production build injects a CSP into the shell before application resources are loaded. The policy:

- restricts scripts to same-origin bundles;
- does not permit `unsafe-inline` or `unsafe-eval` for scripts;
- blocks plugins/objects with `object-src 'none'`;
- pins `base-uri` and `form-action` to the application origin;
- limits connections to the application origin and the configured Supabase HTTPS/WSS origin family;
- limits frames to same-origin modules;
- limits media/image exceptions to the explicit data/blob/Supabase cases required by the current product.

A `strict-origin-when-cross-origin` referrer policy is emitted with the production shell.

`style-src 'unsafe-inline'` remains temporarily necessary because the current shell and compatibility modules still use dynamic inline style attributes. This does not weaken `script-src`.

### 2. Session revocation correctness

`Sign out all sessions` now treats remote Supabase revocation as a security-critical operation:

1. Work Management requests `scope=global` revocation from Supabase first.
2. Only after Supabase confirms that request does the current browser clear its local session and broadcast sign-out to other tabs.
3. If remote revocation fails, the current browser session is deliberately retained so the user can retry, and the UI reports that revocation was not confirmed.

Local browser sign-out remains local-first. If the best-effort remote local logout request subsequently fails, the destroyed local credential is not restored.

### 3. Session validation and synchronization

The existing controls remain part of the baseline:

- refresh tokens are used to renew expiring Supabase access tokens;
- malformed/invalid restored sessions are cleared;
- browser focus/visibility triggers account/access-context revalidation;
- BroadcastChannel plus storage synchronization propagate sign-out/session changes across tabs;
- disabled accounts have cached application state detached/cleared after authorization changes.

No custom browser-side password database, PBKDF2 credential store, or parallel session authority is introduced.

### 4. Service-worker cache hygiene

The service worker now bypasses cache for same-origin requests carrying `Authorization` or `Cookie` headers and uses `cache: 'no-store'` for those requests. Navigation URLs containing a query string are not written to the navigation cache, reducing the risk that future authentication/callback query parameters are retained in Cache Storage.

Supabase API traffic is cross-origin and is not intercepted or cached by the Work Management service worker.

### 5. Embedded runtime supply-chain integrity

TimeTracker still loads Leaflet 1.9.4 from the pinned unpkg URL for map rendering. Milestone 2 adds the official Leaflet 1.9.4 Subresource Integrity hashes and anonymous CORS mode for both Leaflet CSS and JavaScript. A modified CDN response therefore cannot execute as Leaflet unless it matches the pinned release bytes.

Self-hosting Leaflet remains preferable in a later embedded-runtime modernization because SRI protects integrity but does not remove CDN availability dependence.

### 6. Diagnostics and secret hygiene

- Diagnostics redact fields shaped like tokens, passwords, secrets, authorization headers, API keys, or cookies.
- Stage A M1 secret scanning remains mandatory.
- Dependency/governance/audit gates remain mandatory.
- The authoritative host TypeScript security verifier prohibits `eval`, `new Function`, and `javascript:` execution primitives.

### 7. Release enforcement

`npm run security:check` is now a required part of both `check` and `release:check` and is also executed explicitly by CI and the GitHub Pages deployment workflow.

The production `dist` verifier confirms that the generated shell contains the governed CSP/referrer policy and that the generated service worker contains the sensitive-request cache protections.

## External production controls that source code cannot certify

The following controls live outside this static GitHub Pages application and must be reviewed/configured in the actual Supabase/GitHub environment before the milestone is considered fully production-certified.

### Supabase Auth configuration

Verify in the target Supabase project:

- authentication rate limits are appropriate for production traffic;
- production SMTP is configured for account email delivery;
- CAPTCHA is enabled for exposed authentication flows where required by the organization threat model;
- the password policy is at least as strong as the Work Management UI baseline (10-character minimum) and stronger server-side options are enabled where available;
- session inactivity/time-box/single-session policy is explicitly selected according to organization policy rather than relying unknowingly on platform defaults;
- MFA policy for Admin/General Manager and other privileged roles is decided and implemented before it becomes a compliance requirement.

These settings are provider-side controls. A browser-only “account lockout” would be trivially bypassable by clearing client storage and is therefore not represented as authoritative security.

### Administrator revocation of another user's Supabase sessions

Disabling a user already removes effective Work Management data access at the server/RLS boundary. However, the static client cannot safely call Supabase administrative session-revocation APIs for another user because doing so requires privileged server credentials.

If the organization requires an administrator to terminate another user's Supabase Auth sessions immediately, implement that capability behind a trusted server/Edge Function with explicit administrator authorization. **Do not expose a service-role key in the browser.**

Stage F M28 implements the trusted Edge Function architecture and the first privileged Auth-admin operation (`admin-sync-auth-access`). It synchronizes disabled/active Work Management account state with Supabase Auth ban/unban state using server-only credentials. Already-issued stateless access JWTs remain valid until expiry, so `profiles.status` plus RLS continues to provide immediate Work Management data-access denial; full provider-supported by-user-id session revocation remains a separate compatibility boundary.

### Hosting response headers

GitHub Pages does not provide application-controlled arbitrary response headers. The build-level CSP meta policy protects the shell, but some protections require HTTP response headers and cannot be expressed equivalently by a CSP meta element, including a reliable `frame-ancestors` clickjacking policy and `X-Content-Type-Options`.

If those controls become mandatory, deploy behind a host/CDN/reverse proxy that supports governed security headers or place such a layer in front of GitHub Pages.

## Temporary compatibility boundaries

1. **Persistent browser Supabase session:** Work Management remains a static SPA and uses browser-accessible Supabase session persistence. Moving tokens into HttpOnly cookies would require a server/BFF architecture and is outside Stage A.
2. **Inline styles:** production CSP still permits inline styles; inline scripts remain prohibited.
3. **TimeTracker Leaflet CDN:** executable integrity is pinned with SRI, but availability still depends on unpkg and map tiles depend on OpenStreetMap.
4. **FuelTrack+ Google Fonts:** the embedded compatibility UI still loads fonts from Google; this is not an executable-script dependency but remains an external availability/privacy dependency.
5. **Legacy embedded JavaScript:** embedded apps remain compatibility islands pending their dedicated modernization stage; M2 applies targeted security changes without converting their architecture.

## Verification commands

Source gate:

```bash
npm run security:check
npm run check
```

Full release gate:

```bash
npm run audit:ci
npm run release:check
```

External production certification additionally requires the Supabase Auth and hosting checks above.
