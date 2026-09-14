# Stage B Milestone 8 — Strict Optional Type Hotfix

## Scope

This corrective RC resolves the TypeScript `TS2379` failure exposed by the M8 release-certification path with `exactOptionalPropertyTypes: true`.

## Root cause

`assets/js/platform/data/query-client.ts` always constructed the native TanStack client with `{ defaultStaleTime: options.defaultStaleTime }`. When the option was omitted, this produced an explicitly present `undefined` property, which is incompatible with the declared optional `number` property under `exactOptionalPropertyTypes`.

## Correction

The compatibility facade now omits `defaultStaleTime` entirely when no value is supplied and passes the property only when it is a concrete number. The strict TypeScript contract remains unchanged.

## Regression protection

`verify-stage-b-m8-tanstack-query.mjs` now rejects the invalid object-construction pattern and requires the conditional omission semantics.

## Certification requirement

The RC must pass `npm run typecheck` and the complete `npm run stage-b:certify` pipeline before M8 may be considered `active-certified`.
