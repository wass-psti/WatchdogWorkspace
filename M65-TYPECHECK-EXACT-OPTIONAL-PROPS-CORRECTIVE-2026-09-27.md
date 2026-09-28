# M65 TypeScript exactOptionalPropertyTypes Corrective — 2026-09-27

## Originating failed checkpoint

The first governed local M65 certification attempt reached `npm run typecheck` and failed with TS2769 in `src/design-system/forms/field.tsx` at the `cloneElement` call.

## Root cause

The M65 field adapter constructed one object literal that explicitly supplied optional ARIA properties with values typed as `string | undefined` / `AriaAttributes['aria-invalid'] | undefined`. With `exactOptionalPropertyTypes: true`, an optional property must be omitted when absent unless its declared value type itself explicitly includes `undefined`. React's `cloneElement` overload therefore rejected the object even though runtime behavior would have tolerated those keys.

## Corrective implementation

`WMField` now constructs `Partial<FieldControlProps>` with the always-defined `id`, `required`, and `disabled` values first. `aria-invalid`, `aria-describedby`, and `aria-errormessage` are added only when their computed values are not `undefined`. This preserves the original semantic behavior while satisfying the strict optional-property contract.

The M65 deterministic verifier was also corrected to verify those semantic computations and conditional assignments rather than requiring the obsolete one-object-literal source spelling.

## Regression surface

No form submission, state management, persistence, backend/API, RBAC, routing, M64 component behavior, M63 accessibility authority, or module business logic was changed by this correction.

## Verification state

Source-side M65 static/deterministic verification, inherited M64/M63 verification, secret scanning, and repository checksum verification pass after the correction. A clean dependency-backed TypeScript/build/browser/certification run remains required. Because the source changed after the failed certification attempt, certification must restart from the beginning on the corrective continuation artifact.
