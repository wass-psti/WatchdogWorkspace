# Work Management Runtime Schemas — Stage B Milestone 6

## Purpose

Milestone 6 establishes one Work Management-owned runtime schema authority for untrusted data crossing platform boundaries. Static TypeScript types remain authoritative for compile-time contracts; Zod provides runtime validation where values originate outside the current trusted TypeScript process.

## Governed dependency

- `zod@4.5.4` — exact-pinned in `package.json` and `package-lock.json`.
- Third-party Zod imports are confined to `src/runtime-schemas/**`. Feature/runtime code consumes Work Management schema exports instead of importing Zod directly.

## Schema authority

`src/runtime-schemas/index.ts` exports schemas for:

- application manifest and feature/route architecture metadata;
- embedded module definitions and browser-permission declarations;
- module data requests/responses and activity events;
- module identity requests and authenticated identity context;
- module host ready/error/invalidate messages;
- platform/Board role values and authorization boundary inputs;
- persistence pages, module-state rows, directory entries, activity items, and generic persistence envelopes.

## Activated trust boundaries

M6 is wired into the production runtime at these boundaries:

1. `config/modules.ts` validates all embedded module definitions before they become the runtime module catalog.
2. `config/application-manifest.ts` validates Architecture Version 16 metadata and route/feature/module uniqueness.
3. `assets/js/core/cloud-module-data.ts` parses untrusted module data and identity requests before authorization or RPC execution.
4. `assets/js/core/module-identity-bridge.ts` validates host-provided identity context before publishing embedded globals.
5. `assets/js/runtime/module-host.ts` validates ready/error messages from embedded application frames.
6. `assets/js/core/module-cloud-store.ts` validates host data responses, invalidation messages, persisted state rows, directory entries, activity items, and appended activity events before embedded consumers observe them.
7. `assets/js/runtime/module-lifecycle.ts` validates lifecycle states/events before state transitions.
8. `assets/js/runtime/route-controller.ts` validates parsed application routes before ownership dispatch.
9. `assets/js/runtime/work-management-client.ts` validates runtime context values on creation and update.
10. `assets/js/platform/auth/permissions.ts` uses schema-backed platform/Board role predicates.

## Boundary rule

Runtime schemas validate structure, primitive constraints, discriminants, and protocol ownership. They do **not** replace business-domain invariants that already have a stronger authority. Board entity relationships, Status lifecycle semantics, optimistic concurrency, RBAC decisions, and SQL/RLS authorization remain in their existing domain/service/database layers.

## Compatibility

The legacy Work Management runtime and embedded TimeTracker/FuelTrack+/TradeLink applications remain compatibility islands. M6 validates messages and configuration at their boundaries without requiring those applications to import Zod or rewrite their internal persistence models.

Two specialized parser authorities intentionally remain outside the generic M6 schema layer: Board DTO/domain mapping (because it performs compatibility migration and relational/domain validation) and the existing Supabase authentication provider/session normalization in `assets/js/core/auth.ts` (because it contains provider-specific fallback semantics). These are not bypasses around M6 message/configuration schemas; they remain explicit follow-on migration boundaries.

## Certification

- `npm run runtime-schemas:check`
- `npm run runtime-schemas:status`
- `npm run runtime-schemas:activate`
- `npm run runtime-schemas:activate:release`
- `npm run stage-b:certify` now certifies M4 → M5 → M6 in order.

The M6 release gate requires exact dependency/lock integrity, M5 `active-certified`, runtime execution vectors, strict TypeScript, ESLint, security/governance gates, full build/dist/preview verification, and the aggregate browser/project suite.
