# Milestone 9 — Shell Historical Verifier Synchronization Hotfix

## Root cause

The first Milestone 9 release-certification run reached the complete production release gate and failed in the historical Shell Milestone 2 verifier. Milestone 9 intentionally moved shared shell navigation state from module-level variables into the scoped Zustand client-state authority, but several historical Shell verifiers still asserted the pre-M9 source-code spellings.

The affected behavior itself remained present and M9 client-state execution, TypeScript, governance, security, M4–M8, lint, and audit gates had already passed. The failure was verifier drift, not a runtime regression.

## Corrective scope

The hotfix synchronizes the historical Shell M2, M3, M4, M7, and collapse-control verifiers with the M9 ownership model while preserving their behavioral contracts. The verifiers now assert the same navigation mode, section identifiers, width, pin, mobile-open, inertness, and accessibility behavior through `shellNavigation()` / `workManagementClientState` rather than requiring removed module-level variables.

The M9 verifier now contains regression assertions preventing these historical verifiers from reintroducing pre-M9 shell-state ownership assumptions.

## Non-scope

No application behavior, CSS, Supabase schema, Board domain logic, TanStack Query semantics, authentication/session authority, dependency version, or client-state ownership rule is changed by this hotfix.
