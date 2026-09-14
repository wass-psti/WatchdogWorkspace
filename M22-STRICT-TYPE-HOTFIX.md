# Stage E M22 Strict Type Hotfix

This corrective RC addresses the first dependency-backed certification failure found on the authoritative Mac certification run for Stage E Milestone 22.

## Corrected defects

1. `assets/js/platform/data/normalized-module-data-service.ts`
   - With `exactOptionalPropertyTypes: true`, `QueryFetchOptions.force` must be omitted when no boolean value is supplied.
   - The normalized module-data load path now conditionally spreads `{ force }` only when `options.force` is defined.

2. `config/modules.ts`
   - Added explicit `ModuleId` and `string` parameter annotations to the normalized registry `list`, `resolve`, and `resolveLegacy` methods.
   - This removes the five implicit-`any` errors reported by strict TypeScript.

## Compatibility

No runtime behavior, persistence key, Supabase schema, RPC contract, package dependency, authentication/RBAC boundary, embedded-module compatibility boundary, or Architecture Version changes are introduced by this hotfix.

M22 remains `implementation-complete-pending-certification` at Architecture Version 30 until the full governed Mac certification succeeds.
