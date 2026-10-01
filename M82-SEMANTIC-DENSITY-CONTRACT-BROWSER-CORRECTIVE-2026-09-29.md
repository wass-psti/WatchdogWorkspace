# M82 Semantic Density Contract Browser Corrective — 2026-09-29

## Loop origin
M82 local Browser/E2E certification failed because the compact and comfortable fixture paddings both computed to `0px`.

## Root cause
`src/design-system/tokens.ts` exposed six semantic density CSS variable references, but `assets/css/foundation/token-architecture.css` defined only the default control alias. Undefined semantic space aliases invalidated the fixture's inline padding declarations.

## Corrective delta
- Added compact/default/comfortable semantic density aliases for both space and control dimensions.
- Authorized the semantic token architecture correction in the M82→M81 source guard.
- Extended the M82 static verifier to require all six aliases and product-facing references.
- Extended the deterministic verifier to require primitive-token, semantic-alias, and TypeScript-reference parity.
- Preserved the Browser/E2E assertion; no weakening or bypass was introduced.

## Exit criterion
Run the full ordered fail-closed local certification pipeline from the beginning. The corrective loop exits only after Browser/E2E and all subsequent required certification, regression, package-hygiene, integrity, and final-checkpoint gates pass.
