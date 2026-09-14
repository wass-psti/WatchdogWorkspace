# M35 Shell Historical Verifier Synchronization Hotfix

## Problem

M35 intentionally deletes the obsolete imperative `shell(content, active)` serializer and its private presentation helpers after proving they have no live runtime call sites. The React `WorkManagementShell.tsx` already owns the corresponding shell presentation markup.

The full historical `npm run check` chain still contained several older Shell verifiers that hard-coded the pre-M35 implementation location. As a result, a healthy Architecture 43 runtime failed historical verification when those verifiers searched `assets/js/app.ts` for deleted presentation helpers or markup that now lives in `WorkManagementShell.tsx`.

## Synchronized authorities

The following historical verifiers are architecture-aware after this correction:

- `verify-v1432-shell-navigation-foundation-sm1.mjs`
- `verify-v1432-shell-primary-sidebar-sm2.mjs`
- `verify-v1432-shell-resizing-pinning-sm4.mjs`
- `verify-v1432-shell-responsive-accessibility-sm7.mjs`
- `verify-v1432-shell-collapse-control-hotfix.mjs`
- `verify-v1432-shell-collapse-anchor-hotfix.mjs`
- `verify-v1432-shell-collapse-structure-hotfix.mjs`

For Architecture 43+, presentation ownership is verified in `src/app/shell/WorkManagementShell.tsx`, while live imperative navigation/event authorities that still belong to `assets/js/app.ts` remain required there. The deleted serializer/helpers are explicitly required to remain absent.

For earlier architectures, the historical implementation contract remains unchanged.

## Scope boundary

This synchronization changes verifier expectations only. It does not modify production application behavior, embedded modules, package dependencies, service-worker behavior, database schema, migrations, or the M35 deletion set.
