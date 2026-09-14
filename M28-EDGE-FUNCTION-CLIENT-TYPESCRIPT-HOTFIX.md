# M28 Edge Function Client TypeScript Hotfix

## Purpose

This corrective release candidate resolves the Stage F M28 certification failure raised by the historical v1.42 controlled TypeScript verifier against `assets/js/platform/data/edge-function-client.ts`.

## Root cause

The original M28 client validated the Edge Function response at runtime but then returned the validated record through `as unknown as EdgeFunctionResponseMap[TName]`. The v1.42 migration policy intentionally rejects double assertions across migrated TypeScript source.

## Correction

The client now uses `isAdminSyncAuthAccessResponse(...)` as a runtime type guard. `validateResponse(...)` returns the narrowed payload directly after the guard succeeds. No `as unknown as`, `as any`, `@ts-ignore`, `@ts-expect-error`, or equivalent escape hatch is used.

## Regression protection

`verify-stage-f-m28-edge-functions.mjs` now explicitly rejects a TypeScript double assertion in the M28 browser client and requires the runtime response type guard marker.

## Scope and provenance

- Architecture remains 36.
- M27 remains `active-certified` prerequisite.
- M28 remains `implementation-complete-pending-certification` until the full governed release certification succeeds.
- No npm dependency change.
- No `package-lock.json` change.
- No Supabase schema change or M28 database migration.
- No Edge Function authorization, origin, secret-isolation, or ban/unban behavior change.
- No automatic user-management cutover is introduced.
