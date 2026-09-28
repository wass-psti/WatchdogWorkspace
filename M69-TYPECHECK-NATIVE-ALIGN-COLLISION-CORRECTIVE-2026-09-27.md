# M69 TypeScript Native Align Collision Corrective — 2026-09-27

## Originating gate
`npm run typecheck` during the first governed M69 certification attempt.

## Failure
TypeScript TS2430 reported that `WMTableHeaderCellProps` and `WMTableCellProps` could not extend React's native table-cell attribute interfaces because M69 intentionally defines logical `align` values (`start | center | end`) while the deprecated native HTML `align` attribute accepts a different value set.

## Root cause
The component prop interfaces inherited the legacy native `align` property and then re-declared the same property name with an incompatible semantic type. Runtime behavior was not the source of the failure; the defect was at the TypeScript public-prop ownership boundary.

## Correction
Both M69 table-cell prop interfaces now inherit their native React attributes through `Omit<..., 'align'>`. This preserves all other native table-cell attributes while making M69 the sole owner of its logical alignment contract. No compiler setting, strictness rule, runtime semantics, Boards behavior, sorting behavior, persistence behavior, or backend authority was changed.

The M69 deterministic verifier now requires this native-attribute omission so the collision cannot silently return while source-level architecture checks still pass.

## Required certification consequence
Because source and verification code changed after the failed certification run, the original continuation candidate is superseded. Full fail-closed M69 certification must restart from the beginning against the corrective continuation candidate.
