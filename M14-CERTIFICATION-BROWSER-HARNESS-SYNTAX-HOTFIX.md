# M14 Certification Browser Harness Syntax Hotfix

## Scope

This hotfix corrects the M14 browser integration fixture embedded in `tests/browser/run-cdp.mjs`. The command-palette filtering test had introduced an inner JavaScript template literal inside the outer `String.raw` program template. That made the harness file invalid JavaScript and caused the governed ESLint gate to stop at a parser error before full Stage C release certification.

## Correction

- Replaced the nested template literal used only to compose searchable command text with ordinary string concatenation.
- Added a fail-fast `node --check tests/browser/run-cdp.mjs` contract to the M14 verifier so this syntax class is detected during the focused M14 preflight rather than late in release certification.
- Moved the governed ESLint gate to the beginning of the M14 certification sequence, immediately after dependency installation and architecture preflight, so future parser/lint failures stop before the long UI/browser/build chain.
- Audited every shipped `.js` and `.mjs` file with `node --check`; no other parser failures were found.

## Boundaries

No runtime application behavior, command registry authority, Supabase schema, dependency version, RBAC policy, or production data contract is changed by this hotfix. M14 remains `implementation-complete-pending-certification` until the governed Mac release certification succeeds.
