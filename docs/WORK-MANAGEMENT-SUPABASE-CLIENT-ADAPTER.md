# Work Management Supabase Client Adapter

## Scope

Stage B Milestone 7 introduces one Work Management-owned Supabase transport authority:

- `assets/js/platform/data/supabase-client-adapter.ts`
- `src/platform/contracts/supabase-client.ts`

The adapter owns browser communication with the configured Supabase project. Feature, Board, module and shell code must not construct Supabase Auth, PostgREST, RPC or Storage URLs directly.

## Responsibilities

The adapter provides:

1. validation of the configured HTTPS `*.supabase.co` project origin;
2. publishable/anon-key enforcement, including browser rejection of `sb_secret_*` and legacy `service_role` JWTs;
3. publishable-key and bearer-token header construction;
4. project-relative Auth/PostgREST/Storage request dispatch;
5. authenticated PostgreSQL RPC dispatch;
6. private Storage upload and delete operations with bucket/object-path validation;
7. signed private Storage URL requests and same-project signed-URL resolution;
8. bounded request timeouts and caller cancellation with distinct failure semantics;
9. normalized Supabase HTTP errors carrying provider code, HTTP status and payload context;
10. a health probe used by Work Management diagnostics.

## Authority boundaries

### Authentication/session authority

`assets/js/core/auth.ts` remains authoritative for:

- Work Management session persistence keys;
- refresh scheduling and refresh-token rotation orchestration;
- email confirmation callback semantics;
- profile hydration;
- platform/module role reconciliation;
- disabled-account handling;
- cross-tab session broadcasts.

M7 routes that runtime through the adapter without replacing those established semantics.

### Authorization authority

Supabase Row Level Security and protected RPC functions remain authoritative for database authorization. The adapter does not elevate privileges and accepts only the browser-publishable key plus the authenticated user's bearer token.

### Domain authority

Board DTO validation, Status-label lifecycle rules, attendance rules, module-specific RBAC, and M6 Zod runtime schemas remain in their existing authorities. M7 is transport consolidation, not a domain rewrite.

## Integration

`AuthManager.supabase` owns the adapter instance for the current configured project. `createPlatformServices()` exposes the same instance internally, and `createBackendClient()` delegates RPC and private Storage operations to it.

Board attachment signed URLs are resolved by the adapter so a signed URL cannot silently redirect to an unrelated origin.

## Dependency policy

M7 does not add a browser CDN or privileged server key. It also does not require a Supabase schema migration. The existing browser transport is consolidated behind a typed project-owned adapter so the current Work Management session model and release-certified wire behavior remain stable.

## Verification

Run:

```bash
npm run supabase-client:check
npm run supabase-client:status
```

The M7 verifier checks source ownership, manifest Architecture Version 17, direct-fetch leakage, Auth/Backend/Board integration, CI/deployment participation, activation wiring, strict type-contract coverage, and executable adapter vectors for RPC, Storage, signed URLs, privileged-key rejection, path validation, provider failures, timeouts, caller cancellation, and health probing.
