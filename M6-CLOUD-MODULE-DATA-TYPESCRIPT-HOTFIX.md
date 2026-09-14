# M6 Cloud Module Data TypeScript Hotfix

## Defect

The initial M6 runtime-schema migration removed the handwritten `recordOf` and `nonEmptyString` helpers from `assets/js/core/cloud-module-data.ts`, but two call sites remained in `handleCloudModuleDataMessage`. The source-level M6 verifier did not initially reject those stale references, so the defect surfaced only when the dependency-backed TypeScript compiler ran during M6 activation.

## Correction

- Added `moduleDataEnvelopeSchema` to the Work Management runtime-schema authority.
- `handleCloudModuleDataMessage` now validates the minimum request envelope through `moduleDataEnvelopeSchema.safeParse` before frame/module authorization.
- Removed all residual `recordOf(...)` and `nonEmptyString(...)` calls from `cloud-module-data.ts`.
- Extended `verify-stage-b-m6-runtime-schemas.mjs` to fail if either retired helper call reappears in that module.
- M4/M5 certified contracts remain unchanged.

## Certification expectation

The next dependency-backed Stage B certification must pass `tsc --noEmit`, the M6 runtime execution vectors, the complete release gate, and finish with M4/M5/M6 all `active-certified`.
