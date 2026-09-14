# Work Management App v1.43.2 — Stage B M7 Supabase Client Adapter

## Milestone

**Stage B Milestone 7 — Supabase client adapter**

## Implementation status

**IMPLEMENTATION COMPLETE at the source/runtime boundary.**

M7 advances the application manifest to **Architecture Version 17** and establishes one typed Work Management-owned Supabase client adapter as the browser transport authority.

## Implemented modules

- `src/platform/contracts/supabase-client.ts`
  - adapter contract;
  - request/RPC/Storage option contracts;
  - health result contract.
- `assets/js/platform/data/supabase-client-adapter.ts`
  - project-origin validation;
  - browser publishable/anon-key enforcement and privileged-key rejection;
  - publishable-key/bearer header construction;
  - Auth/PostgREST/Storage relative-path enforcement;
  - timeout/cancellation composition with caller-cancellation distinction;
  - RPC dispatch;
  - private Storage upload/delete/sign with bucket/object-path validation;
  - signed-URL same-origin enforcement;
  - provider error normalization;
  - Auth health probe.
- `assets/js/core/auth.ts`
  - delegates request/header/health transport to the M7 adapter;
  - retains existing session, callback, refresh, profile and RBAC authority.
- `assets/js/platform/data/backend-client.ts`
  - delegates RPC and private Storage transport to the M7 adapter;
  - retains Work Management error classification, diagnostics and payload validation.
- `assets/js/features/boards/data/board-repository.ts`
  - delegates signed attachment URL resolution to the adapter.
- `assets/js/runtime/platform-services.ts`
  - composes the same Auth-owned adapter instance into platform services.
- `config/application-manifest.ts`
  - Architecture Version 17;
  - declares `work-management-supabase-client-adapter-v1`.
- M6 manifest runtime schema/type contracts extended for the v17 adapter marker.
- M7 target, strict type-contract coverage, verifier, execution vectors, activation/reporting scripts, CI/deployment gates, governance self-healing, governed-toolchain coverage and aggregate verification inventory added.

## Verified preservation boundaries

M7 does not change:

- Supabase project/database schema;
- RLS or RPC authorization policies;
- Work Management authentication UX;
- session storage keys;
- refresh scheduling semantics;
- email confirmation flow;
- platform RBAC or module assignments;
- Board domain invariants and Status stable IDs;
- TimeTracker, FuelTrack+ or TradeLink internal persistence/RBAC;
- M4 React Design System;
- M5 Primitive Interaction Architecture;
- M6 Zod runtime schema authority.

## Temporary compatibility boundaries

1. `AuthManager` remains the session lifecycle authority. M7 consolidates transport underneath it rather than replacing the proven Work Management session model.
2. Embedded TimeTracker, FuelTrack+ and TradeLink continue to consume the host module-data/identity bridge rather than importing the Supabase adapter directly.
3. Board repository/domain layers continue to depend on the Work Management `BackendClient`; they do not consume provider-specific APIs directly.
4. Existing Supabase RLS and protected RPCs remain the server-side authorization boundary.
5. React StrictMode remains deferred under the previously certified legacy-runtime disposal boundary; M7 does not alter that decision.

## Database migration

**None.** M7 is a client transport architecture milestone.

## Remaining work before milestone certification

No source module remains intentionally unfinished inside M7. The only remaining promotion step is execution of the complete release certification on the target environment so the target state can move from `implementation-complete-pending-certification` to `active-certified`.

## Blockers / unresolved risks

### Code-level blockers

None known after the M7 verification suite passes.

### Environment-level controls

Production deployment still depends on the already-established external controls:

- valid browser publishable Supabase configuration;
- deployed RLS/RPC policies and prior migrations;
- GitHub Pages/CI release execution;
- real production connectivity and user-session smoke/UAT.

Those are environment controls, not unfinished M7 source implementation.

## Certification commands

```bash
npm run stage-b:certify
npm run supabase-client:status
```

Expected final state:

```text
Stage B platform certification: PASS
M4 React Design System: active-certified
M5 Primitive Interaction Architecture: active-certified
M6 Runtime Schemas: active-certified
M7 Supabase Client Adapter: active-certified
```

## Authoring-environment verification

The completed M7 source has passed the dependency-independent and focused gates available in the packaging environment:

- M7 Supabase adapter executable vectors — PASS;
- M7 structural/architecture verifier — PASS;
- focused strict TypeScript 5.8.3 compile for the adapter, transport contracts, request-signal, normalized errors and backend client — PASS;
- Stage A package-governance verification — PASS;
- Stage A security baseline — PASS;
- Stage B bootstrap/governed-toolchain/governance-synchronization regressions — PASS;
- M3 composition, M4 corrective/CSP, M5 interaction and M6 source-contract regressions — PASS;
- v1.43 production-hardening and embedded-runtime compatibility regressions — PASS;
- high-confidence secret scan — PASS.

The packaging environment cannot resolve `registry.npmjs.org`, so it cannot reconstruct the clean `node_modules` graph needed for the complete project TypeScript/Vite/Chromium release gate. The RC intentionally contains no `node_modules` or `dist`; `npm run stage-b:certify` runs the existing governed dependency preflight (`npm ci --ignore-scripts`) on the target Mac, re-certifies the clean M6 source state if required, executes the complete release gate, and only then promotes M7 to `active-certified`.

## Architecture verifier synchronization hotfix

Release-candidate certification exposed two inherited historical verifiers that still asserted Architecture Version 16. They are synchronized to M7 Architecture Version 17, and the M7 source gate now prevents this stale-version regression. No runtime or database behavior changed.
